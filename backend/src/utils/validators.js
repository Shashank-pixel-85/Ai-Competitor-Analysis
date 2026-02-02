const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const validateAnalysisRequest = (req, res, next) => {
  const { clientUrl, competitorUrl } = req.body;

  if (!clientUrl || !competitorUrl) {
    return res.status(400).json({
      error: { message: 'Both clientUrl and competitorUrl are required' }
    });
  }

  if (!isValidUrl(clientUrl)) {
    return res.status(400).json({
      error: { message: 'Invalid clientUrl format' }
    });
  }

  if (!isValidUrl(competitorUrl)) {
    return res.status(400).json({
      error: { message: 'Invalid competitorUrl format' }
    });
  }

  next();
};

module.exports = { isValidUrl, validateAnalysisRequest };