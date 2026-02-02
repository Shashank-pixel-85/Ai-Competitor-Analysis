const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { validateAnalysisRequest } = require('../utils/validators');

// POST /api/analyze
router.post('/analyze', validateAnalysisRequest, (req, res) => {
  analysisController.analyzeWebsites(req, res);
});

module.exports = router;