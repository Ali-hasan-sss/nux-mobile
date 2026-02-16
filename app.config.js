// Load .env into process.env (for local dev). CI/GitHub can inject GOOGLE_MAPS_API_KEY.
require("dotenv").config();

const base = require("./app.json");

if (process.env.GOOGLE_MAPS_API_KEY) {
  if (!base.android) base.android = {};
  if (!base.android.config) base.android.config = {};
  if (!base.android.config.googleMaps) base.android.config.googleMaps = {};
  base.android.config.googleMaps.apiKey = process.env.GOOGLE_MAPS_API_KEY;
}

module.exports = base;
