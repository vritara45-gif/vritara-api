const API_KEY = "vritara-safety-device-key-2024";

function validateApiKey(req, res, next) {
  const clientKey = req.headers["x-api-key"];
  if (clientKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
  }
  next();
}

module.exports = validateApiKey;
