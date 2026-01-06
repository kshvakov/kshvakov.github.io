# kshvakov.github.io

Personal GitHub Pages site: [https://kshvakov.github.io](https://kshvakov.github.io)

This repository contains the source for my personal website, featuring a minimal, clean design with bilingual support (RU/EN) and dark/light theme switching. The site is built with [Hugo](https://gohugo.io/), a fast and flexible static site generator.

## Features

- **Bilingual Support** - Automatic language detection with manual RU/EN switching
- **Theme Switching** - Dark/light theme toggle with system preference detection
- **Minimalist Design** - Clean, professional design without Bootstrap dependencies
- **Articles & Talks** - Collection of technical articles and conference talks
- **Video Pages** - Dedicated pages for video talks with embedded YouTube videos and transcripts
- **Responsive** - Mobile-friendly layout
- **Static Site Generator** - Built with Hugo for easy content management

## Content

- **AI Agent Course** - Hands-on course for building autonomous AI agents in Go
- **Articles** - Technical articles published on Habr and other platforms
- **Conference Talks** - Video recordings from various tech conferences with transcripts
- **Links** - GitHub, Telegram, Kinescope, and other professional profiles

## Structure

```
kshvakov.github.io/
├── config.yaml          # Hugo configuration with multilingual support
├── content/             # Content files (Markdown)
│   ├── _index.md       # Main landing page (RU)
│   ├── en/             # English content
│   └── talks/          # Video talk pages (with front matter metadata)
├── layouts/            # Hugo templates
│   ├── _default/       # Default templates (baseof, single, list)
│   ├── partials/       # Reusable partials
│   ├── shortcodes/     # Hugo shortcodes
│   └── 404.html        # 404 error page template
├── static/             # Static assets (CSS, JS, images, transcripts)
│   └── assets/         # CSS, JS, and transcript files
├── .github/workflows/  # GitHub Actions for deployment
│   └── deploy.yml      # Build and deploy workflow
└── README.md           # This file
```

## Adding a New Video

To add a new video talk:

1. **Add transcript file** (if available) to `static/assets/transcripts/YOUR_YOUTUBE_ID.ru.txt` (and `.en.txt` for English if available)

2. **Create content files** with front matter metadata:
   
   - `content/talks/my-video-slug.md`:
```markdown
---
title: "Заголовок на русском"
youtube_id: YOUR_YOUTUBE_ID
date: 2024-01-01
duration: PT30M
publisher: Conference Name
transcript: /assets/transcripts/YOUR_YOUTUBE_ID.ru.txt
description: |
  Описание доклада на русском языке.
  Может быть многострочным.
short_description: Краткое описание для карточки
---
```

   - `content/en/talks/my-video-slug.md`:
```markdown
---
title: "Title in English"
youtube_id: YOUR_YOUTUBE_ID
date: 2024-01-01
duration: PT30M
publisher: Conference Name
transcript: /assets/transcripts/YOUR_YOUTUBE_ID.en.txt
description: |
  Talk description in English.
  Can be multiline.
short_description: Short description for card
---
```

3. **Commit and push** - GitHub Actions will automatically build and deploy the site.

All video metadata is stored in the Markdown front matter, making it easy to edit and maintain.

## Local Development

### Prerequisites

- [Hugo](https://gohugo.io/installation/) (latest version)

### Running Locally

1. Clone the repository:
```bash
git clone https://github.com/kshvakov/kshvakov.github.io.git
cd kshvakov.github.io
```

2. Start the Hugo development server:
```bash
hugo server
```

3. Visit `http://localhost:1313` in your browser

The site will automatically reload when you make changes to content or templates.

### Building for Production

```bash
hugo --minify
```

The generated site will be in the `public/` directory.

## Technologies

- [Hugo](https://gohugo.io/) - Static site generator (Go-based)
- Pure HTML/CSS/JavaScript (no frameworks)
- CSS Custom Properties for theming
- localStorage for user preferences
- System color scheme detection
- GitHub Actions for CI/CD

## Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

### GitHub Pages Configuration

To set up automatic deployment with GitHub Actions:

1. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
   - Save the settings

2. **Verify GitHub Actions workflow:**
   - The workflow file `.github/workflows/deploy.yml` is already configured
   - It will automatically build and deploy the site when you push to `main` branch
   - You can check the deployment status in the **Actions** tab

3. **First deployment:**
   - Push your changes to the `main` branch
   - GitHub Actions will automatically:
     - Install Hugo
     - Build the site
     - Deploy to GitHub Pages
   - The site will be available at `https://YOUR_USERNAME.github.io` (or your custom domain)

4. **Custom domain (optional):**
   - Add your domain to `config.yaml` (`baseURL`)
   - Add a `CNAME` file in `static/CNAME` with your domain name
   - Configure DNS settings as per GitHub Pages documentation

### Manual Deployment

If you need to deploy manually:

1. Build the site:
```bash
hugo --minify
```

2. The generated site will be in the `public/` directory
3. You can manually upload the contents to GitHub Pages or use other deployment methods

## Content Management

- **Videos**: Edit Markdown files in `content/talks/` and `content/en/talks/` with front matter metadata
- **Main pages**: Edit `content/_index.md` and `content/en/_index.md` for bio and descriptions
- **Templates**: Modify files in `layouts/` directory
- **404 page**: Edit `layouts/404.html` for custom error page
- **Styles**: Edit `static/assets/site.css`
- **Scripts**: Edit `static/assets/site.js` and `static/assets/video-page.js`

## License

This is a personal website. All content is copyright of the author.
