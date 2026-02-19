/*
 * ============================================================
 *  duskyAI — script.js
 * ============================================================
 *
 *  HOW TO ADD VISUALS:
 *    1. Drop images/videos into assets/images/visuals/duskylab/
 *    2. Update manifest.json (or let PHP API handle it on production)
 *    3. Refresh — they appear in the full-screen gallery
 *
 *  HOW TO ADD A PROJECT:
 *    Edit the PROJECTS array below.
 * ============================================================
 */

const PROJECTS = [
    {
        title: "AIList.sk",
        desc: "AI companies & events directory in Slovakia",
        url: "https://www.ailist.sk/",
        tag: "Web",
        preview: "assets/images/projects/AIList-sk.png"
    },
    {
        title: "@duskylab",
        desc: "AI Visual Production Studio",
        url: "https://www.instagram.com/duskylab/",
        tag: "Instagram",
        isGallery: true,
        galleryKey: "duskylab"
    },
    {
        title: "PokerCalendar.eu",
        desc: "Poker tournaments & events across Europe",
        url: "https://www.pokercalendar.eu/",
        tag: "Web"
    },
    {
        title: "@pokerartai",
        desc: "AI-generated poker art & videos",
        url: "https://www.instagram.com/pokerart.ai/",
        tag: "Instagram",
        preview: "assets/images/projects/pokerartai.png"
    }
];


// ── Render Projects ──────────────────────────────────────

function renderProjects() {
    const el = document.getElementById('project-list');
    if (!el) return;

    el.innerHTML = PROJECTS.map(p => {
        const preview = p.preview
            ? `<div class="project-preview" style="background-image:url('${p.preview}')"></div>`
            : '';

        const galleryBtn = p.isGallery
            ? `<button class="btn-gallery" onclick="openGallery(event,'${p.galleryKey}')">
                   Visuals
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
               </button>`
            : '';

        return `
        <li class="project${p.preview ? ' has-preview' : ''}"
            onclick="window.open('${p.url}','_blank')">
            ${preview}
            <div class="project-body">
                <div class="project-name">${p.title}</div>
                <div class="project-desc">${p.desc}</div>
            </div>
            <div class="project-actions">
                ${galleryBtn}
                <span class="project-tag">${p.tag}</span>
                <span class="project-arrow">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="7" y1="17" x2="17" y2="7"/>
                        <polyline points="7 7 17 7 17 17"/>
                    </svg>
                </span>
            </div>
        </li>`;
    }).join('');
}


// ── Load Visuals ─────────────────────────────────────────

let visualsData = {};

async function loadVisuals() {
    try {
        const r = await fetch('api/visuals.php');
        if (r.ok && r.headers.get('content-type')?.includes('json')) {
            visualsData = await r.json(); return;
        }
    } catch { }

    try {
        const r = await fetch('assets/images/visuals/manifest.json');
        if (r.ok) visualsData = await r.json();
    } catch { }
}


// ── Lightbox Gallery ─────────────────────────────────────

let lbItems = [];
let lbIndex = 0;

const lb = document.getElementById('lightbox');
const lbStage = document.getElementById('lb-stage');
const lbCount = document.getElementById('lb-counter');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
const lbClose = document.getElementById('lb-close');

function showSlide(idx) {
    lbIndex = idx;
    const item = lbItems[idx];
    lbCount.textContent = `${idx + 1} / ${lbItems.length}`;

    // Create media element
    let media;
    if (item.type === 'video') {
        media = document.createElement('video');
        media.src = item.file;
        media.autoplay = true;
        media.loop = true;
        media.muted = true;
        media.playsInline = true;
    } else {
        media = document.createElement('img');
        media.src = item.file;
        media.alt = item.name || '';
    }

    // Swap with transition
    lbStage.innerHTML = '';
    lbStage.appendChild(media);
    requestAnimationFrame(() => requestAnimationFrame(() => media.classList.add('visible')));
}

function openGallery(e, key) {
    e.stopPropagation();
    lbItems = visualsData[key] || [];
    if (!lbItems.length) return;

    lbIndex = 0;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showSlide(0);
}

function closeGallery() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    lbStage.innerHTML = '';
}

// Controls
lbClose.addEventListener('click', closeGallery);
lbPrev.addEventListener('click', () => {
    if (lbItems.length) showSlide((lbIndex - 1 + lbItems.length) % lbItems.length);
});
lbNext.addEventListener('click', () => {
    if (lbItems.length) showSlide((lbIndex + 1) % lbItems.length);
});

// Click backdrop to close
lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target === lbStage) closeGallery();
});

// Keyboard: arrows + escape
document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') lbPrev.click();
    if (e.key === 'ArrowRight') lbNext.click();
});


// ── Init ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    renderProjects();
    await loadVisuals();

    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelector('.page').classList.add('ready');
    }));
});