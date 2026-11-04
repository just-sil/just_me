# Mohamed Simal M — portfolio

A static portfolio website built with HTML, CSS and JavaScript, suitable for GitHub Pages or Cloudflare Pages.

## Run locally
Open `index.html` in a browser. The 3D hero imports Three.js from jsDelivr; if WebGL/CDN is unavailable, a CSS fallback orb appears.

For a local server:
```bash
python3 -m http.server 8000
```
Then visit http://localhost:8000

## Deploy
Upload the contents of this folder to the root of a GitHub repository and enable GitHub Pages (Settings → Pages → Deploy from branch → main → /root).

## Media and certificates
The upload controls provide temporary local previews in your browser. They do not upload files to GitHub or persist after refresh.
To publish images/videos/certificates:
1. Put files into the repo (e.g. `media/` or `certificates/`).
2. Update the gallery and certificate sections in `index.html` to use those file paths.
3. Keep images optimized (WebP/JPEG), videos short and compressed (MP4 H.264).

## Accuracy/status
Project cards use explicit status labels (live, prototype, concept, in progress). Update those as projects mature.
Some projects are summarized from portfolio notes and prior conversations; add repositories, screenshots, hardware photos and certificates to strengthen the proof.
