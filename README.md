# kshvakov.github.io

Personal GitHub Pages site: [https://kshvakov.github.io](https://kshvakov.github.io)

This repository contains the source for my personal website, featuring a minimal, clean design with bilingual support (RU/EN) and dark/light theme switching.

## Features

- **Bilingual Support** - Automatic language detection with manual RU/EN switching
- **Theme Switching** - Dark/light theme toggle with system preference detection
- **Minimalist Design** - Clean, professional design without Bootstrap dependencies
- **Articles & Talks** - Collection of technical articles and conference talks
- **Responsive** - Mobile-friendly layout

## Content

- **AI Agent Course** - Hands-on course for building autonomous AI agents in Go
- **Articles** - Technical articles published on Habr and other platforms
- **Conference Talks** - Video recordings from various tech conferences
- **Links** - GitHub, Telegram, Kinescope, and other professional profiles

## Structure

```
kshvakov.github.io/
├── index.html          # Main landing page with RU/EN sections
├── 404.html           # Custom 404 error page
├── assets/
│   ├── site.css       # Minimalist styles with theme support
│   └── site.js        # Language switching and theme toggle logic
└── README.md          # This file
```

## Local Development

Simply open `index.html` in a web browser or use a local web server:

```bash
python3 -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`

## Technologies

- Pure HTML/CSS/JavaScript (no frameworks)
- CSS Custom Properties for theming
- localStorage for user preferences
- System color scheme detection

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

To enable GitHub Pages:
1. Go to repository Settings → Pages
2. Select `main` branch as source
3. Site will be available at `https://kshvakov.github.io`
