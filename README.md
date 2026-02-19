# duskyAI (v2.0)

Minimal, high-impact personal portfolio for Dusan Hajek.
**Live:** https://www.duskyai.com/

## Key Features
- **Minimal 1300px Layout**: Focused, centered design with plenty of negative space.
- **Full-Screen Lightbox Gallery**: Custom-built JS gallery for high-quality AI visuals (@duskylab).
- **Auto-Loading Visuals**: 
  - **Production:** PHP API (`api/visuals.php`) scans `assets/images/visuals/` automatically.
  - **Vercel/Local:** Uses `assets/images/visuals/manifest.json` as a fallback.
- **Micro-Interactions**: Hover previews for projects, smooth page transitions.

## Project Structure
```
duskyAI2/
├── index.html                  # Main entry point
├── api/
│   └── visuals.php             # PHP API for auto-scanning gallery images
├── assets/
│   ├── css/styles.css          # All styles (CSS variables, layout, lightbox)
│   ├── js/script.js            # Lightbox logic, API fetching, interactions
│   └── images/
│       ├── logo.png            # Main logo & favicon
│       ├── photo.jpg           # Profile avatar
│       ├── projects/           # Hover preview images
│       └── visuals/            # Gallery assets
│           ├── manifest.json   # Manual list for Vercel/Static hosting
│           └── duskylab/       # @duskylab portfolio images
└── README.md
```

## How to Add Content

### Adding a Project
Edit `PROJECTS` array in `assets/js/script.js`.

### Adding Visuals (@duskylab)
1. Drop image/video files into `assets/images/visuals/duskylab/`.
2. **For Vercel**: Update `assets/images/visuals/manifest.json` with the new filenames.
3. **For PHP Host**: No action needed (auto-scanned).

## License
© 2026 duskyAI