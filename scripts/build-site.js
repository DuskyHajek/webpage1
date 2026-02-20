const fs = require('fs');
const path = require('path');

// reuse the manifest generation logic
require('./generate-manifest.js');

const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '../');

// Files/Folders to copy to dist
const include = [
    'index.html',
    'assets',
    'robots.txt',
    'sitemap.xml',
    'README.md'
];

function build() {
    console.log('Building to /dist...');

    // 1. Clean/Create dist
    if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir);

    // 2. Copy files
    include.forEach(item => {
        const src = path.join(rootDir, item);
        const dest = path.join(distDir, item);

        if (fs.existsSync(src)) {
            console.log(`Copying ${item}...`);
            fs.cpSync(src, dest, { recursive: true });
        } else {
            console.warn(`Warning: ${item} not found.`);
        }
    });

    console.log('Build complete! Output directory: /dist');
}

build();
