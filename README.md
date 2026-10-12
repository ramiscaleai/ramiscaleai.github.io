# Rami Hersonsky — AI portfolio

This repository contains only the public, static website. Run `node generate.mjs` to rebuild the HTML, sitemap, and robots file in `dist/`. Preview it with `python3 -m http.server 8080 --directory dist`.

Before publishing, run `node scripts/check-public.mjs`. The check reviews the worktree, Git index, and reachable history for email addresses, common credential formats, unapproved API endpoints, and server or environment files. Enable the included commit and push checks after cloning with `git config core.hooksPath .githooks`. Review images and every staged Git diff as well; automated scans cannot recognize every private detail. Testimonial portraits are published with the client's name and must contain no EXIF or XMP metadata.

The contact form calls the HTTPS API at `https://api.rami-heb.joyfulaiteam.net`. This address is public by design. The API accepts the site's exact origin through CORS, checks submitted input and a signed time-limited challenge, and is rate limited at the edge. The recipient email and SMTP credentials stay in the separate private server configuration. Never put credentials in browser code.

GitHub Pages publishes the committed `dist/` files through the workflow in `.github/workflows/pages.yml` at `https://ramihersonsky.com/`. The form is replaced with a contact notice if the API captcha route returns 404.

The Heebo font is served locally from `dist/assets/`. Its SIL Open Font License is included as `dist/assets/OFL-Heebo.txt`.
