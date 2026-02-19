<?php
/**
 * duskyAI — Visuals API
 *
 * Scans assets/images/visuals/{project}/ subfolders and
 * returns a JSON object of project → [image list].
 *
 * Usage:  GET /api/visuals.php
 * Returns: { "duskylab": ["file1.jpg", "file2.jpg"], ... }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

// Detect whether requested over http or cli
$base = dirname(__DIR__); // project root
$visualsRoot = $base . '/assets/images/visuals';

$allowed = ['jpg','jpeg','png','gif','webp','mp4','mov','webm'];

$result = [];

if (!is_dir($visualsRoot)) {
    echo json_encode([]);
    exit;
}

// Each subfolder = a project slug
$projects = array_filter(scandir($visualsRoot), function($d) use ($visualsRoot) {
    return $d !== '.' && $d !== '..' && is_dir($visualsRoot . '/' . $d);
});

foreach ($projects as $project) {
    $dir = $visualsRoot . '/' . $project;
    $files = [];

    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..') continue;
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowed)) {
            $type = in_array($ext, ['mp4','mov','webm']) ? 'video' : 'image';
            $files[] = [
                'file'  => "assets/images/visuals/{$project}/{$file}",
                'type'  => $type,
                'name'  => pathinfo($file, PATHINFO_FILENAME)
            ];
        }
    }

    if (!empty($files)) {
        $result[$project] = $files;
    }
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
