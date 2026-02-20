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

    const MAX_THUMBS = 3;

    el.innerHTML = PROJECTS.map(p => {
        const preview = p.preview
            ? `<div class="project-preview" style="background-image:url('${p.preview}')"></div>`
            : '';

        // Build gallery thumbnail strip for gallery projects
        let galleryStrip = '';
        if (p.isGallery && p.galleryKey) {
            const items = visualsData[p.galleryKey] || [];
            if (items.length > 0) {
                const visible = items.slice(0, MAX_THUMBS);
                const remaining = items.length - MAX_THUMBS;

                const thumbs = visible.map((item, i) =>
                    `<img class="gallery-thumb" src="${item.file}" alt="${item.name || ''}" loading="lazy" onclick="openGallery(event,'${p.galleryKey}',${i})">`
                ).join('');

                const moreBtn = remaining > 0
                    ? `<button class="gallery-more" onclick="openGallery(event,'${p.galleryKey}',${MAX_THUMBS})">+${remaining} more</button>`
                    : '';

                galleryStrip = `<div class="gallery-strip">${thumbs}${moreBtn}</div>`;
            }
        }

        // Use a real <a> tag so search engines can crawl project links.
        // Gallery projects use data-gallery to intercept clicks in JS.
        const tag = p.isGallery ? 'a' : 'a';
        const extraAttr = p.isGallery
            ? `href="${p.url}" target="_blank" rel="noopener" data-gallery="${p.galleryKey}" onclick="this.dataset.gallery && openGallery(event,this.dataset.gallery,0)"`
            : `href="${p.url}" target="_blank" rel="noopener"`;

        return `
        <li class="project reveal${p.preview ? ' has-preview' : ''}${p.isGallery ? ' has-gallery' : ''}">
            <${tag} class="project-link" ${extraAttr} aria-label="${p.title} — ${p.desc}">
            ${preview}
            <div class="project-body">
                <div class="project-name">${p.title}</div>
                <div class="project-desc">${p.desc}</div>
            </div>
            <div class="project-actions">
                <span class="project-tag">${p.tag}</span>
                <span class="project-arrow">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="7" y1="17" x2="17" y2="7"/>
                        <polyline points="7 7 17 7 17 17"/>
                    </svg>
                </span>
            </div>
            </${tag}>
            ${galleryStrip}
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

function openGallery(e, key, startIndex = 0) {
    e.stopPropagation();
    lbItems = visualsData[key] || [];
    if (!lbItems.length) return;

    lbIndex = startIndex;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    showSlide(startIndex);
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


// ── UI Enhancements ──────────────────────────────────────

function initMagneticCTA() {
    const cta = document.querySelector('.cta-btn');
    // Only apply hover effects on non-touch devices
    if (!cta || !window.matchMedia("(hover: hover)").matches) return;

    cta.addEventListener('mousemove', (e) => {
        const rect = cta.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Subtle magnetic pull
        cta.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    cta.addEventListener('mouseleave', () => {
        cta.style.transform = '';
    });
}

function initStaggeredReveal() {
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add('revealed');
        }, 50 + (i * 60)); // 50ms initial delay, 60ms stagger per element
    });
}

// ── Init ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Load visuals first so thumbnail paths are available during render
    await loadVisuals();
    renderProjects();

    initMagneticCTA();

    requestAnimationFrame(() => requestAnimationFrame(() => {
        document.querySelector('.page').classList.add('ready');
        initStaggeredReveal();
    }));
});