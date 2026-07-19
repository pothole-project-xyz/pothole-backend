const axios_url = process.env.AI_DETECTION_URL;

/**
 * Calls an external AI detection microservice (e.g. a Python FastAPI service
 * running a YOLO/TensorFlow pothole-detection model) if AI_DETECTION_ENABLED
 * is true. The microservice is expected to accept a multipart image and
 * return { isPothole, confidence, severity }.
 *
 * If the service is disabled or unreachable, a safe fallback result is
 * returned so report submission is never blocked by AI downtime.
 */
async function analyzeImage(filePath) {
    console.log("AI DETECTION CALLED");
    console.log(process.env.AI_DETECTION_URL);
  if (process.env.AI_DETECTION_ENABLED !== 'true' || !process.env.AI_DETECTION_URL) {
    return { isPothole: true, confidence: null, severity: 'medium', source: 'fallback' };
  }

  try {
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));

    const { data } = await axios.post(process.env.AI_DETECTION_URL, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });

    return {
      isPothole: data.isPothole ?? true,
      confidence: data.confidence ?? null,
      severity: data.severity ?? 'medium',
      image: data.image ?? null,
      source: 'model',
    };
  } catch (err) {
    console.warn('AI detection service unavailable, using fallback:', err.message);
    return { isPothole: true, confidence: null, severity: 'null', source: 'fallback' };
  }
}

module.exports = { analyzeImage };
