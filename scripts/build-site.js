const fs = require('fs');
const path = require('path');

// reuse the manifest generation logic
require('./generate-manifest.js');

const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '../');

// Files/Folders to copy to dist
const include = [
    'index.html',
    'about.html',
    'assets',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'README.md',
    'aib-c01'
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
            const options = { recursive: true };
            if (item === 'aib-c01') {
                options.filter = (source) => {
                    const rel = path.relative(src, source);
                    if (!rel || rel === '.') return true;
                    const top = rel.split(path.sep)[0];
                    return top !== 'tests' && top !== '1791415052344.pdf';
                };
            }
            fs.cpSync(src, dest, options);
        } else {
            console.warn(`Warning: ${item} not found.`);
        }
    });

    console.log('Build complete! Output directory: /dist');
}

build();
