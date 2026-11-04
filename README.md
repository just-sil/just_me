# Mohamed Simal M — Portfolio

A personal portfolio and online CV showcasing my work across software, electronics, embedded systems, IoT, robotics, and creative technology.

The site is built as a lightweight static website with plain HTML, CSS, and JavaScript. It does not require a framework, package manager, build step, or backend.

## Features

- **Introduction and profile** — a short introduction, profile photo, and links to work and contact details.
- **Project gallery** — selected software, electronics, and engineering projects, with descriptions and technology tags.
- **Experience and recognition** — innovation programmes, competitions, and achievements.
- **Skills and technical interests** — a concise overview of working approaches, tools, and areas of interest.
- **Education timeline** — current B.Tech studies in Computer Science and Business Systems at Model Engineering College, Thrikkakara, alongside completed higher-secondary education.
- **Contact links** — email, GitHub, and WhatsApp.
- **Responsive layout** — adapts to desktop and mobile screen sizes.
- **Motion details** — entrance/reveal animations, a scrolling progress indicator, and a technical marquee.
- **Reduced-motion support** — respects the browser's `prefers-reduced-motion` setting.
- **Centralized design tokens** — key colors, typography, spacing, card styles, and badge styles can be adjusted from the variables near the top of `styles.css`.

## Tech stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and content |
| CSS3 | Layout, responsive styling, animations, and design tokens |
| Vanilla JavaScript | Scroll progress, entrance effects, and scroll-triggered reveals |
| Google Fonts | Hanken Grotesk, Instrument Serif, and Space Mono |

The JavaScript uses browser APIs such as `IntersectionObserver` and does not depend on third-party JavaScript libraries.

## Project structure

```text
.
├── index.html   # Main page and portfolio content
├── styles.css   # Design system, layout, responsive rules, and animations
├── script.js    # Small interaction and animation behaviours
├── me.jpg       # Profile photograph
└── README.md    # Project documentation
```

Keep these files together in the same directory. The page loads `styles.css`, `script.js`, and `me.jpg` using relative paths.

## Run locally

No installation is needed. You only need a modern web browser and (recommended) Python 3 for a local development server.

1. Download or clone this repository.
2. Open a terminal in the project directory.
3. Start a local server:

   ```bash
   python3 -m http.server 8000
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser.
5. Stop the server with `Ctrl+C` in the terminal.

You can also open `index.html` directly in a browser, but using a local server is recommended for more consistent behaviour.

## Customize the portfolio

### Update the content

Edit `index.html` to change the introduction, project descriptions, achievement details, skills, education, and contact links. Keep the existing section IDs (such as `projects`, `experience`, `skills`, `education`, and `contact`) if you want the navigation links and in-page buttons to continue working.

### Change the design

Open `styles.css` and edit the `:root` design tokens near the beginning of the file. These variables control shared values such as:

- Core palette: `--bg`, `--bg2`, `--fg`, `--muted`, `--line`, and `--accent`.
- Fonts: `--font-body`, `--font-heading`, `--font-display`, and `--font-mono`.
- Project title appearance: `--project-title-size`, `--project-title-weight`, and `--project-title-letter-spacing`.
- Project card appearance: `--project-card-radius`, `--project-card-padding`, and hover tokens.
- Achievement badge typography and spacing.
- Education entry spacing: `--education-entry-gap`.

Prefer changing a shared variable over adding another one-off selector. This keeps related components visually consistent.

### Replace the profile photo

Replace `me.jpg` with your own image, keeping the same filename. Alternatively, update the image's `src` in `index.html` to match the new filename. The image is displayed as a cropped profile photo.

### Update external links

Search in `index.html` for the email, GitHub, WhatsApp, and project URLs. Replace them with your own verified destinations. Avoid adding links to repositories or demos that are not public or ready to share.

## Deploy

This is a static site, so it can be hosted on any static web host. No server-side runtime or database is required.

### GitHub Pages

1. Push the project files (`index.html`, `styles.css`, `script.js`, and `me.jpg`) to a GitHub repository.
2. Open the repository's **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch containing the site and the repository root (`/`) as the folder.
5. Save and open the published URL shown by GitHub Pages.

The root `index.html` is the site entry point. When updating the site, commit and push the changed files to the selected branch.

## Notes

- Google Fonts are loaded from Google Fonts, so the selected typefaces require an internet connection. System fallbacks are defined in the CSS.
- The portfolio is intentionally framework-free. There is no `npm install`, `npm run build`, or package configuration to maintain.
- Check the page at both desktop and mobile widths after making substantial content or layout changes.
- Keep image filenames and relative paths in sync when adding or replacing assets.

## License

No license is currently specified. Add a `LICENSE` file before permitting reuse, redistribution, or modification by others.
