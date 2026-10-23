# BlueWindEco public frontend

This directory contains only static files for GitHub Pages. Research rasters,
strategy workbooks, decryption keys, and the Python backend are not included.

Set `window.BLUEWINDECO_API_BASE` in `config.js` to the HTTPS origin of the
separately hosted BlueWindEco backend. The backend must allow this Pages origin
in CORS and support preflight requests for JSON POST calls. A Cloudflare Quick
Tunnel URL is temporary: update this configuration when that URL changes, or
use a stable backend hostname.

The HTML, CSS, JavaScript, logo, and land/coast GeoJSON files can be served from
either a GitHub Pages project URL (`/<repository>/`) or a custom domain. All
static asset references are relative to this directory.
