const cloudinary = require('cloudinary').v2;
const { query } = require('../config/db');
const { analyzeImage } = require('../utils/aiDetection');

const DUPLICATE_RADIUS_METERS = 30;

// Haversine distance in meters between two lat/lng points.
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Cloudinary auto-generates a thumbnail URL by inserting a transformation
// segment into the secure_url — no local file processing (sharp) needed.
function buildThumbnailUrl(secureUrl) {
  if (!secureUrl) return null;
  return secureUrl.replace('/upload/', '/upload/w_320,h_240,c_fill/');
}

// POST /api/reports
async function createReport(req, res, next) {
  try {
    const { roadName, description, latitude, longitude, severity } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'A valid GPS location is required.' });
    }

    // Duplicate detection: find pending/in_progress reports within radius.
    const nearby = await query(
      `SELECT id, latitude, longitude, report_count FROM reports
       WHERE status IN ('pending', 'in_progress')
       AND latitude BETWEEN $1 - 0.001 AND $1 + 0.001
       AND longitude BETWEEN $2 - 0.001 AND $2 + 0.001`,
      [lat, lng]
    );

    let duplicateId = null;
    for (const r of nearby.rows) {
      if (distanceMeters(lat, lng, r.latitude, r.longitude) <= DUPLICATE_RADIUS_METERS) {
        duplicateId = r.id;
        break;
      }
    }

    // With multer-storage-cloudinary, each file is already uploaded to
    // Cloudinary by the time we get here. file.path = secure_url,
    // file.filename = the Cloudinary public_id (needed to delete if rejected).
    let aiResult = { isPothole: true, confidence: null, severity: severity || 'medium' };
    const files = req.files || [];

    if (files.length > 0) {
      aiResult = await analyzeImage(files[0].path);
      if (aiResult.isPothole === false) {
        // Reject invalid images (AI thinks this isn't a pothole).
        // Delete the already-uploaded Cloudinary images instead of fs.unlink.
        await Promise.all(
          files.map((f) =>
            cloudinary.uploader.destroy(f.filename).catch((e) =>
              console.warn('Cloudinary cleanup failed:', e.message)
            )
          )
        );
        return res.status(422).json({
          success: false,
          message: 'The uploaded image does not appear to show a pothole or road damage. Please try a clearer photo.',
        });
      }
    }

    if (duplicateId) {
      // Increment report count on the existing report instead of creating a new row.
      const { rows } = await query(
        `UPDATE reports SET report_count = report_count + 1 WHERE id = $1 RETURNING *`,
        [duplicateId]
      );
      req.io?.emit('report:updated', rows[0]);
      return res.status(200).json({
        success: true,
        message: 'A similar report already exists nearby — it has been confirmed and bumped in priority.',
        report: rows[0],
        duplicate: true,
      });
    }

    const { rows } = await query(
      `INSERT INTO reports (user_id, road_name, description, latitude, longitude, severity, ai_confidence, ai_label)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        roadName || null,
        description || null,
        lat,
        lng,
        severity || aiResult.severity || 'medium',
        aiResult.confidence,
        aiResult.isPothole ? 'pothole' : null,
      ]
    );

    const report = rows[0];

    // Store Cloudinary URLs directly — no local resize/thumbnail step needed,
    // Cloudinary generates the thumbnail on the fly via URL transformation.
    for (const file of files) {
      const url = file.path; // secure_url from Cloudinary
      const thumbnailUrl = buildThumbnailUrl(url);
      await query(
        `INSERT INTO report_images (report_id, url, thumbnail_url) VALUES ($1, $2, $3)`,
        [report.id, url, thumbnailUrl]
      );
    }

    req.io?.emit('report:new', report);

    return res.status(201).json({
        success: true,
        report,
        image: aiResult?.image || null
    });
} catch (err) {
  return next(err);
    }
    
    
}


// GET /api/reports  (supports filters + pagination)
async function listReports(req, res, next) {
  try {
    const { status, severity, search, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (severity) {
      conditions.push(`severity = $${idx++}`);
      params.push(severity);
    }
    if (search) {
      conditions.push(`(road_name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await query(
      `SELECT r.*,
        COALESCE(json_agg(json_build_object('url', i.url, 'thumbnail_url', i.thumbnail_url))
          FILTER (WHERE i.id IS NOT NULL), '[]') AS images
       FROM reports r
       LEFT JOIN report_images i ON i.report_id = r.id
       ${where}
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM reports ${where}`, params);

    res.json({
      success: true,
      reports: rows,
      total: Number(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/map  (lightweight payload for map markers)
async function mapReports(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id, road_name, status, severity, latitude, longitude, report_count, created_at
       FROM reports WHERE status != 'rejected'`
    );
    res.json({ success: true, reports: rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/:id
async function getReport(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT r.*,
        COALESCE(json_agg(json_build_object('url', i.url, 'thumbnail_url', i.thumbnail_url))
          FILTER (WHERE i.id IS NOT NULL), '[]') AS images
       FROM reports r LEFT JOIN report_images i ON i.report_id = r.id
       WHERE r.id = $1 GROUP BY r.id`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.json({ success: true, report: rows[0] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reports/:id/status  (admin only)
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'in_progress', 'fixed', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const { rows } = await query(
      `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
       VALUES ($1, 'update_status', 'report', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status })]
    );

    req.io?.emit('report:updated', rows[0]);
    res.json({ success: true, report: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reports/:id  (admin only — for fake/spam reports)
async function deleteReport(req, res, next) {
  try {
    const { rows } = await query(`DELETE FROM reports WHERE id = $1 RETURNING id`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    await query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id) VALUES ($1, 'delete_report', 'report', $2)`,
      [req.user.id, req.params.id]
    );

    req.io?.emit('report:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Report deleted.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/stats  (admin dashboard analytics)
async function getStats(req, res, next) {
  try {
    const totals = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'fixed') AS fixed,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
      FROM reports
    `);

    const bySeverity = await query(`
      SELECT severity, COUNT(*) AS count FROM reports GROUP BY severity
    `);

    const trend = await query(`
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS count
      FROM reports
      WHERE created_at > now() - interval '30 days'
      GROUP BY day ORDER BY day
    `);

    res.json({
      success: true,
      totals: totals.rows[0],
      bySeverity: bySeverity.rows,
      trend: trend.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReport,
  listReports,
  mapReports,
  getReport,
  updateStatus,
  deleteReport,
  getStats,
};