# Rami Hersonsky — AI portfolio

This repository contains only the public, static website. Run `node generate.mjs` to rebuild the HTML, sitemap, and robots file in `dist/`. Preview it with `python3 -m http.server 8080 --directory dist`.

Before publishing, run `node scripts/check-public.mjs`. The check reviews the worktree, Git index, and reachable history for email addresses, common credential formats, absolute API endpoints, and server or environment files. Enable the included commit and push checks after cloning with `git config core.hooksPath .githooks`. Review images and every staged Git diff as well; automated scans cannot recognize every private detail.

The contact form uses same-origin relative paths. It needs a separately deployed API and a reverse proxy for those paths. A static host alone cannot process submissions. The API hostname, email recipient, and SMTP credentials do not belong in this repository. A browser can always see the route it calls, so the endpoint must be protected on the server.

GitHub Pages publishes the committed `dist/` files through the workflow in `.github/workflows/pages.yml`. The form is replaced with a contact notice on the default `github.io` address or whenever the captcha endpoint returns 404. A custom domain can use the form when its front proxy routes `/api/` to the private server.

The Heebo font is served locally from `dist/assets/`. Its SIL Open Font License is included as `dist/assets/OFL-Heebo.txt`.
