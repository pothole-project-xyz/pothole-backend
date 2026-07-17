const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const createReportValidation = [
  body('latitude').notEmpty().withMessage('Latitude is required.'),
  body('longitude').notEmpty().withMessage('Longitude is required.'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description is too long.'),
  body('roadName').optional().isLength({ max: 255 }).trim().escape(),
];

router.get('/map', reportsController.mapReports);
router.get('/stats', authenticate, authorize('admin', 'authority'), reportsController.getStats);
router.get('/', reportsController.listReports);
router.get('/:id', reportsController.getReport);

router.post(
  '/',
  authenticate,
  upload.array('images', 3),
  createReportValidation,
  validate,
  reportsController.createReport
);

router.patch('/:id/status', authenticate, authorize('admin', 'authority'), reportsController.updateStatus);
router.delete('/:id', authenticate, authorize('admin', 'authority'), reportsController.deleteReport);

module.exports = router;
