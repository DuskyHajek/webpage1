const fs = require('fs');
const path = require('path');

const visualsDir = path.join(__dirname, '../assets/images/visuals');
const manifestPath = path.join(visualsDir, 'manifest.json');
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm'];

function generateManifest() {
    if (!fs.existsSync(visualsDir)) {
        console.error('Visuals directory not found:', visualsDir);
        process.exit(1);
    }

    const result = {};
    const projects = fs.readdirSync(visualsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    projects.forEach(project => {
        const projectDir = path.join(visualsDir, project);
        const files = fs.readdirSync(projectDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return allowedExtensions.includes(ext);
            })
            .map(file => {
                const ext = path.extname(file).toLowerCase();
                const type = ['.mp4', '.mov', '.webm'].includes(ext) ? 'video' : 'image';
                return {
                    file: `assets/images/visuals/${project}/${file}`,
                    type: type,
                    name: path.basename(file, ext)
                };
            });

        if (files.length > 0) {
            result[project] = files;
        }
    });

    fs.writeFileSync(manifestPath, JSON.stringify(result, null, 2)); // Pretty print for readability
    console.log(`Manifest generated at: ${manifestPath}`);
    console.log(`Found ${Object.keys(result).length} projects.`);
}

generateManifest();
