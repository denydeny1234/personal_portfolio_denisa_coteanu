// Library of books → click to enable sound → 9 fly out to form deck → reveal hero
// Loader runs on all devices; scaled for mobile/tablet with larger text
const AUDIO_ENABLED_KEY = 'siteAudioEnabled';

/** Opening with these hashes skips the library screen (no sessionStorage): #work, #services, #book-deck (logo → hero deck). */
const DIRECT_SKIP_LOADER_HASHES = new Set(['work', 'services', 'book-deck']);
/** Subsections below the hero: skip loader and scroll past hero overlay; not used for #book-deck (stay on hero deck). */
const DIRECT_SKIP_SCROLL_PAST_HERO_IDS = new Set(['work', 'services']);

function getDirectHashSkipTarget() {
    try {
        var raw = (typeof location !== 'undefined' && location.hash ? location.hash.replace(/^#/, '') : '').trim();
        if (!raw) return null;
        var id = raw.split('&')[0];
        try {
            id = decodeURIComponent(id);
        } catch (e) {}
        if (!DIRECT_SKIP_LOADER_HASHES.has(id)) return null;
        var el = document.getElementById(id);
        var wrap = document.getElementById('pageTransitionWrap');
        if (!el || !wrap || !wrap.contains(el)) return null;
        return id;
    } catch (err) {
        return null;
    }
}

/**
 * Skip library loader when user returns via browser Back, or when jumping past the library (direct #work / #services).
 * @param {{ skipSectionTarget?: string }} [opts] — if set (work|services), hide fixed hero deck until Lenis scroll completes (no loader books).
 */
function skipHomeLoaderAfterBack(opts) {
    opts = opts || {};
    const loader = document.getElementById('loader');
    const pageWrap = document.getElementById('pageTransitionWrap');
    if (loader) {
        loader.style.display = 'none';
        loader.style.pointerEvents = 'none';
        loader.style.visibility = 'hidden';
    }
    if (pageWrap) {
        pageWrap.style.clipPath = 'inset(0% 0 0 0)';
        pageWrap.style.opacity = '1';
    }
    document.body.classList.add('loaded', 'ready', 'home-loader-skipped');
    if (opts.skipSectionTarget && DIRECT_SKIP_SCROLL_PAST_HERO_IDS.has(opts.skipSectionTarget)) {
        document.body.classList.add('scrolled-past-hero', 'home-skip-past-hero');
    }

    function syncLenisToRestoredScroll() {
        var y = window.scrollY || document.documentElement.scrollTop || 0;
        if (typeof lenis !== 'undefined' && lenis && typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(Math.round(y), { immediate: true });
        }
    }

    requestAnimationFrame(function () {
        requestAnimationFrame(syncLenisToRestoredScroll);
    });
    window.addEventListener(
        'load',
        function onLoadSyncLenis() {
            window.removeEventListener('load', onLoadSyncLenis);
            syncLenisToRestoredScroll();
        },
        { once: true }
    );
}

function runLoader() {
    if (typeof gsap === 'undefined') return;

    var navEntry = typeof performance !== 'undefined' && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (navEntry && navEntry.type === 'back_forward') {
        skipHomeLoaderAfterBack();
        return;
    }

    const loader = document.getElementById('loader');
    if (!loader) return;

    var directSkip = getDirectHashSkipTarget();
    if (directSkip) {
        skipHomeLoaderAfterBack({ skipSectionTarget: directSkip });
        return;
    }

    const loaderPre = document.getElementById('loaderPre');
    const loaderPreBookThird = document.getElementById('loaderPreBookThird');
    const loaderLibraryScreen = document.getElementById('loaderLibraryScreen');
    const loaderLibrary = document.getElementById('loaderLibrary');
    const loaderTextLine1 = document.querySelector('.loader-text--line1');
    const loaderTextLine2 = document.querySelector('.loader-text--line2');
    const loaderCursor = document.getElementById('loaderCursor');
    const deckCards = document.querySelectorAll('.book-deck > *');
    if (!loader || !loaderLibrary || !deckCards.length) return;

    /** Centered "Click" ring + word trail — desktop only (CSS hides ≤1024px) */
    const useLoaderCursor =
        typeof window.matchMedia !== 'undefined' && window.matchMedia('(min-width: 1025px)').matches;

    const deckData = [
        { color: '#D9D9D9', label: 'Shelf location / Eindhoven, the Netherlands', meta: true },
        { color: '#D9D9D9', label: '' },
        { color: '#FFDA2C', label: 'WORK' },
        { color: '#CED700', label: 'ABOUT' },
        { color: '#FF3CA4', label: 'SERVICES' },
        { color: '#ACE8F6', label: 'ARCHIVE' },
        { color: '#FF7D00', label: 'CONTACT' },
        { color: '#D9D9D9', label: '' },
        { color: '#D9D9D9', label: 'Designing digital experiences,<br>one chapter at a time.', meta: true, alignRight: true }
    ];

    // Library colors – rainbow gradient (top: light/neutral → bottom: deep)
    const libraryPalette = [
        '#f5f0e8', '#e8e0d5', '#d4c4b0', '#c9b896', '#b8a078', '#a68b5c', '#8b7355',
        '#ffb5c5', '#ff8fa3', '#ff6b8a', '#e85a7a', '#ff9ebb', '#ff7aa0', '#d94a6a',
        '#ffd966', '#ffcc33', '#b8d96a', '#8fbc4a', '#6ba83a', '#a8e68a', '#7ec850',
        '#7ec8e3', '#5eb8d8', '#4a9fc9', '#6b8fd4', '#7a6fc9', '#8a5fbe', '#9a4fb0',
        '#4a6fd4', '#5a5fc9', '#6a4fbe', '#7a3fb0', '#8a2fa0'
    ];

    const ROWS = 4;
    const BOOKS_PER_ROW = 14;

    // Indices in the grid (row-major) where tilted deck books sit
    const deckIndices = [3, 6, 9, 19, 22, 35, 38, 47, 50];
    const deckTilts = [-18, 14, -12, 16, -15, 13, -17, 11, -14]; // degrees, leaning on shelf

    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1025 && !isMobile;
    const scale = isMobile ? 2 : isTablet ? 1.8 : 1.5;
    const bookW = 2.2 * vmin * scale;
    const bookH = 7 * vmin * scale;
    const gap = 1.4 * vmin * scale;
    const rowGap = 1.5 * vmin * scale;
    const libWidth = BOOKS_PER_ROW * bookW + (BOOKS_PER_ROW - 1) * gap;
    const libHeight = ROWS * bookH + (ROWS - 1) * rowGap;
    const startX = (window.innerWidth - libWidth) / 2;
    const startY = (window.innerHeight - libHeight) / 2;

    const libraryBooks = [];
    const deckBooks = [];
    const deckLabels = [];
    let colorIndex = 0;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < BOOKS_PER_ROW; col++) {
            const i = row * BOOKS_PER_ROW + col;
            const isDeck = deckIndices.includes(i);
            const deckIdx = isDeck ? deckIndices.indexOf(i) : -1;

            const cellX = startX + col * (bookW + gap);
            const cellY = startY + row * (bookH + rowGap);

            if (isDeck) {
                const book = document.createElement('div');
                book.className = 'loader-book loader-book--deck';
                book.dataset.deckIndex = String(deckIdx);
                book.style.backgroundColor = deckData[deckIdx].color;
                const tilt = deckTilts[deckIdx];

                // Create label, hidden at first – will fade in after rectangles settle
                if (deckData[deckIdx].label) {
                    const label = document.createElement('span');
                    const isMeta = deckData[deckIdx].meta;
                    const alignRight = deckData[deckIdx].alignRight;
                    label.className = 'loader-book-label loader-book-label--horizontal' + (isMeta ? ' loader-book-label--meta' : '') + (alignRight ? ' loader-book-label--right' : '');
                    if (isMeta && deckData[deckIdx].label.includes('<br>')) {
                        label.innerHTML = deckData[deckIdx].label;
                    } else {
                        label.textContent = deckData[deckIdx].label;
                    }
                    gsap.set(label, { opacity: 0 });
                    book.appendChild(label);
                    deckLabels.push(label);
                }

                // Same size and spacing as library books, tilted
                gsap.set(book, {
                    left: cellX,
                    top: cellY,
                    width: bookW,
                    height: bookH,
                    rotation: tilt,
                    opacity: 1,
                    transformOrigin: 'center bottom'
                });
                loaderLibrary.appendChild(book);
                deckBooks.push(book);
            } else {
                const book = document.createElement('div');
                book.className = 'loader-book';
                book.style.backgroundColor = libraryPalette[colorIndex % libraryPalette.length];
                colorIndex++;
                gsap.set(book, {
                    left: cellX,
                    top: cellY,
                    width: bookW,
                    height: bookH,
                    rotation: 0,
                    opacity: 1
                });
                loaderLibrary.appendChild(book);
                libraryBooks.push(book);
            }
        }
    }

    // Hide main loader content until pre-loader finishes
    gsap.set(loaderLibrary, { opacity: 0 });

    // Deck targets – programmatic, rounded to whole pixels (avoids subpixel/random glitches)
    function computeDeckTargets() {
        const GAP = 10;
        const isNarrow = window.innerWidth <= 1024;
        /* Phone/tablet: full-width bars, no horizontal stagger (stagger + hero overflow clips labels) */
        const deckW = isNarrow
            ? Math.round(0.94 * window.innerWidth)
            : Math.round(0.65 * window.innerWidth);
        const deckLeft = Math.round((window.innerWidth - deckW) / 2);
        const flexGray = 0.6, flexColored = 1;
        const totalFlex = 4 * flexGray + 5 * flexColored;
        const availH = window.innerHeight - 8 * GAP;
        const unitH = availH / totalFlex;
        const heights = [flexGray, flexGray, flexColored, flexColored, flexColored, flexColored, flexColored, flexGray, flexGray].map(f => Math.round(f * unitH));
        const staggerX = isNarrow
            ? [0, 0, 0, 0, 0, 0, 0, 0, 0]
            : [-0.08, 0.22, 0.02, 0.26, -0.05, 0.18, 0.08, 0.28, -0.02];
        const deckTop = Math.round(-(80 * window.innerHeight) / 900);
        let top = deckTop;
        return deckData.map((d, i) => {
            const h = heights[i];
            const left = Math.round(deckLeft + staggerX[i] * deckW);
            top = Math.round(top);
            const t = { left, top, width: deckW, height: h, color: d.color };
            top += h + GAP;
            return t;
        });
    }

    // Books react to cursor – tilt on hover (before fly-out)
    const allBooks = [...libraryBooks, ...deckBooks];
    allBooks.forEach((book) => {
        book.addEventListener('mouseenter', () => {
            if (clicked) return;
            const deckIdx = deckBooks.indexOf(book);
            const baseRot = deckIdx >= 0 ? deckTilts[deckIdx] : 0;
            gsap.to(book, {
                rotation: baseRot - 12,
                scale: 1.08,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                duration: 0.2,
                ease: 'power2.out',
                overwrite: true
            });
        });
        book.addEventListener('mouseleave', () => {
            if (clicked) return;
            const deckIdx = deckBooks.indexOf(book);
            const baseRot = deckIdx >= 0 ? deckTilts[deckIdx] : 0;
            gsap.to(book, {
                rotation: baseRot,
                scale: 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                duration: 0.25,
                ease: 'power2.out',
                overwrite: true
            });
        });
    });

    // Phase 1: Library and cursor fade in
    // Loader text: same fade-up reveal as case study hero (no letter split)
    const loaderTextLines = [loaderTextLine1, loaderTextLine2].filter(Boolean);
    if (loaderTextLines.length) gsap.set(loaderTextLines, { opacity: 0, y: 28 });
    if (loaderCursor && useLoaderCursor) gsap.set(loaderCursor, { opacity: 0 });
    const trailContainer = document.getElementById('loaderCursorTrail');
    if (trailContainer && useLoaderCursor) gsap.set(trailContainer, { opacity: 0 });

    // Third book: continuous tilt ↔ straight while waiting (killed when media is ready)
    let preBookLoopTween = null;
    if (loaderPreBookThird) {
        gsap.set(loaderPreBookThird, { rotation: 0, transformOrigin: 'center bottom' });
        preBookLoopTween = gsap.to(loaderPreBookThird, {
            rotation: 14,
            duration: 0.55,
            ease: 'power2.inOut',
            transformOrigin: 'center bottom',
            repeat: -1,
            yoyo: true,
        });
    }

    // First screen: 3 books stay until #pageTransitionWrap media is ready, then stop loop + library reveal
    function startPreLoaderPhase() {
        if (preBookLoopTween) {
            preBookLoopTween.kill();
            preBookLoopTween = null;
        }
        if (loaderPreBookThird) {
            gsap.killTweensOf(loaderPreBookThird);
            gsap.set(loaderPreBookThird, { rotation: 0, transformOrigin: 'center bottom' });
        }

        const tlPre = gsap.timeline();
        tlPre.to(loaderPreBookThird || loader, {
            rotation: 0,
            duration: 0.05,
            transformOrigin: 'center bottom',
        });

        // Main loader intro – fade in library content (books, cursor, trail) behind the pre-loader page
        const tlIntro = gsap.timeline({ paused: true });
        tlIntro.fromTo(loaderLibrary, { opacity: 0 }, { duration: 0.4, opacity: 1 }, 0);
        if (loaderCursor && useLoaderCursor) tlIntro.to(loaderCursor, { duration: 0.3, opacity: 1 }, 0.2);
        if (trailContainer && useLoaderCursor) tlIntro.to(trailContainer, { duration: 0.3, opacity: 1 }, 0.2);
        tlIntro.to(loader, { duration: 0.1, opacity: 1 }, 0);

        // Text: same fade-up reveal as case study hero (delay then stagger between lines)
        const tlText = gsap.timeline({ paused: true });
        if (loaderTextLines.length) {
            tlText.to(loaderTextLines, {
                opacity: 1,
                y: 0,
                duration: 0.85,
                ease: 'power2.out',
                stagger: 0.12,
                delay: 0.3,
            }, 0);
        }

        // When pre-loader finishes: top-to-bottom reveal (same as case study images)
        tlPre.eventCallback('onComplete', () => {
            if (loaderPre) loaderPre.style.pointerEvents = 'none';
            tlIntro.play(0);
            const tlClose = gsap.timeline({
                onComplete: () => {
                    if (loaderPre) loaderPre.style.visibility = 'hidden';
                    tlText.play();
                },
            });
            // First screen: wipe up (clip from top) — same transition as about page (only the cover animates, content already underneath)
            if (loaderPre) {
                tlClose.to(loaderPre, {
                    clipPath: 'inset(100% 0 0 0)',
                    duration: 1.6,
                    ease: 'power2.out',
                }, 0);
            }
        });
    }

    const waitPromise =
        typeof window.waitForPageMediaReady === 'function'
            ? window.waitForPageMediaReady('#pageTransitionWrap')
            : Promise.resolve();
    waitPromise.then(startPreLoaderPhase);

    function runFlyOut() {
        const isNarrow = window.innerWidth <= 1024;
        const deckTargets = computeDeckTargets(); // Recompute at click for current viewport
        const tl = gsap.timeline();
        const scrollPrompt = document.querySelector('.scroll-prompt');

        const padNavLeft = isNarrow ? 'clamp(0.65rem, 2.8vw, 1.15rem)' : 'clamp(3rem, 8vw, 6rem)';
        const padNavRight = isNarrow ? 'clamp(0.65rem, 2.8vw, 1.15rem)' : 'clamp(1.5rem, 4vw, 3rem)';

        // Phase 3: Deck books fly out, library books fade
    deckBooks.forEach((book, i) => {
        const t = deckTargets[i];
        const label = book.querySelector('.loader-book-label');
        tl.to(book, {
            duration: 1.2,
            ease: 'power2.inOut',
            position: 'fixed',
            left: t.left,
            top: t.top,
            width: t.width,
            height: t.height,
            rotation: 0,
            backgroundColor: t.color,
            boxShadow: 'none',
            paddingLeft: padNavLeft,
            paddingRight: padNavRight,
            paddingTop: 0,
            paddingBottom: 0,
            justifyContent: isNarrow ? 'center' : 'flex-start',
            overwrite: true
        }, i * 0.05);
        // Scale label text – nav labels get large size, meta labels get small; narrow screens: fit longest word (SERVICES)
        if (label) {
            const isMeta = label.classList.contains('loader-book-label--meta');
            let navSize;
            /* Mobile/tablet (≤1024px): never below 18px — GSAP sets inline fontSize */
            const metaSize = isNarrow ? 'max(18px, 1rem)' : isMobile ? '1rem' : isTablet ? '0.95rem' : '0.9rem';
            if (!isMeta) {
                /* Match desktop loader: big Bebas Neue (same clamps as wide layout / tablet / phone) */
                if (isNarrow) {
                    navSize = isMobile
                        ? 'clamp(2.5rem, 12vh, 6rem)'
                        : 'clamp(2.25rem, 11vh, 10rem)';
                } else {
                    navSize = isMobile
                        ? 'clamp(2.5rem, 12vh, 6rem)'
                        : isTablet
                            ? 'clamp(2.25rem, 11vh, 10rem)'
                            : 'clamp(2rem, 11vh, 14rem)';
                }
            }
            const labelTween = {
                duration: 1.2,
                ease: 'power2.inOut',
                fontSize: isMeta ? metaSize : navSize,
                letterSpacing: '0.02em'
            };
            if (!isMeta) {
                labelTween.fontFamily = "'Bebas Neue', sans-serif";
                labelTween.fontWeight = 700;
            }
            if (isNarrow) {
                labelTween.textAlign = 'center';
            }
            tl.to(label, labelTween, i * 0.05);
        }
    });

    // Nav labels on the rectangles – fade in only after fly-out animation ends
    if (deckLabels.length) {
        tl.to(deckLabels, {
            duration: 0.45,
            ease: 'power2.out',
            opacity: 1,
            stagger: 0.04
        }, '>0');
    }

    // Fade out library books
    libraryBooks.forEach((el) => {
        tl.to(el, { duration: 0.5, opacity: 0 }, '<');
    });

    // Fade out loader text, cursor and trail
    const loaderFadeEarly = [loaderTextLine1, loaderTextLine2, loaderCursor, trailContainer].filter(Boolean);
    tl.to(loaderFadeEarly, { duration: 0.35, opacity: 0 }, 0.5);

    // Smoothly fade loader background from dark to transparent
    tl.to(loader, {
        duration: 1.0,
        ease: 'power2.inOut',
        backgroundColor: 'transparent'
    }, '<0.2');

    // Hero copy (scroll prompt only)
    if (scrollPrompt) {
        tl.to(scrollPrompt, {
            duration: 0.5,
            ease: 'power2.out',
            opacity: 1
        }, '<0.2');
    }

    // Page transition: same vertical reveal as site images (clip-path inset top → full)
    const pageWrap = document.getElementById('pageTransitionWrap');
    if (pageWrap) {
        tl.to(pageWrap, {
            clipPath: 'inset(0% 0 0 0)',
            opacity: 1,
            duration: 1.6,
            ease: 'power2.out'
        }, 0.5);
    }

    // Hover transforms per deck index (match CSS – applied via JS since loader covers hero)
    const deckHoverInBase = [
        { x: '-10%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '10%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '-20%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '12%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '-20%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '12%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '-23%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '10%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' },
        { x: '-10%', scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' }
    ];
    const deckHoverIn = isNarrow
        ? deckHoverInBase.map(function () {
            return { x: 0, scale: 1.02, boxShadow: '4px 4px 20px rgba(0,0,0,0.12)' };
        })
        : deckHoverInBase;
    const deckHoverOut = { x: 0, scale: 1, boxShadow: 'none' };

    // Completion callback
    function completeLoader() {
        document.body.classList.add('loaded');
        loader.style.pointerEvents = 'auto';
        if (loaderLibrary) loaderLibrary.style.pointerEvents = 'auto'; // so loader books receive hover/click
        deckBooks.forEach((book, i) => {
            const deckIdx = Number(book.dataset.deckIndex);
            const isClickable = [2, 3, 4, 5, 6].includes(deckIdx);
            book.style.pointerEvents = 'auto';
            book.style.cursor = isClickable ? 'pointer' : 'default';
            book.classList.add('loader-book--interactive');
            gsap.set(book, { clearProps: 'transform' });

            // JS hover: loader covers hero so CSS :hover doesn't work – animate via JS
            const hoverIn = deckHoverIn[deckIdx];
            book.addEventListener('mouseenter', () => {
                if (book.classList.contains('about-expanded')) return;
                gsap.to(book, {
                    x: hoverIn.x,
                    scale: hoverIn.scale,
                    boxShadow: hoverIn.boxShadow,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: true
                });
            });
            book.addEventListener('mouseleave', () => {
                if (book.classList.contains('about-expanded')) return;
                gsap.to(book, {
                    x: deckHoverOut.x,
                    scale: deckHoverOut.scale,
                    boxShadow: deckHoverOut.boxShadow,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: true
                });
            });

            // Navigate on click – same targets as .book-deck cards (Work/Services → sections, About/Archive/Contact → pages)
            if (isClickable) {
                const card = deckCards[deckIdx];
                const href = card && (card.getAttribute('href') || card.href);
                if (href) {
                    book.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const hashMatch = href.startsWith('#')
                            ? href.slice(1)
                            : (href.match(/^index\.html#(.+)$/i) || [])[1];
                        if (hashMatch && document.getElementById(hashMatch)) {
                            const id = hashMatch;
                            if (typeof window.scrollToHashWithLenis === 'function' && window.scrollToHashWithLenis(id)) {
                                /* wheel limiter off + About expand suppressed for deep sections */
                            } else if (typeof lenis !== 'undefined' && lenis && typeof lenis.scrollTo === 'function') {
                                if (typeof window.prepareLenisHashJump === 'function') window.prepareLenisHashJump(id);
                                lenis.scrollTo('#' + id, {
                                    lerp: 0.1,
                                    onComplete: () => {
                                        if (typeof window.completeLenisHashJump === 'function') window.completeLenisHashJump(id);
                                    },
                                });
                            } else {
                                document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
                            }
                        } else {
                            // About / Archive / Contact – full navigation (same reliability as deck <a>)
                            const url = String(href).trim();
                            if (url && !url.startsWith('#')) {
                                window.location.assign(url);
                            }
                        }
                    });
                }
            }
        });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.add('ready');
            });
        });
    }

    tl.add(completeLoader, '>');
    }

    // Custom cursor follows mouse (smooth lerp) — desktop only
    if (loaderCursor && useLoaderCursor) {
        let cursorX = window.innerWidth / 2;
        let cursorY = window.innerHeight / 2;
        let targetX = cursorX;
        let targetY = cursorY;

        const updateCursor = () => {
            const ease = 0.18;
            cursorX += (targetX - cursorX) * ease;
            cursorY += (targetY - cursorY) * ease;
            loaderCursor.style.left = cursorX + 'px';
            loaderCursor.style.top = cursorY + 'px';
            requestAnimationFrame(updateCursor);
        };

        loader.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        // Start near center
        loaderCursor.style.left = cursorX + 'px';
        loaderCursor.style.top = cursorY + 'px';
        requestAnimationFrame(updateCursor);
    }

    // Words left behind cursor – book-like trail (desktop only)
    let clicked = false;
    const TRAIL_WORDS = ['Curiosity', 'Ideas', 'Knowledge', 'Explore', 'Process', 'Experiment', 'Refine', 'Iteration', 'Growth', 'Story', 'Design', 'Experience', 'Discovery', 'Learn', 'Create'];
    let trailLastSpawn = 0;
    const TRAIL_THROTTLE = 90;
    const TRAIL_MAX = 25;

    if (trailContainer && useLoaderCursor) {
        loader.addEventListener('mousemove', (e) => {
            if (clicked) return;
            const now = Date.now();
            if (now - trailLastSpawn < TRAIL_THROTTLE) return;
            if (trailContainer.children.length >= TRAIL_MAX) return;

            trailLastSpawn = now;
            const word = TRAIL_WORDS[Math.floor(Math.random() * TRAIL_WORDS.length)];
            const el = document.createElement('span');
            el.className = 'loader-cursor-trail__word';
            el.textContent = word;

            const offsetX = (Math.random() - 0.5) * 24;
            const offsetY = (Math.random() - 0.5) * 24;
            el.style.left = (e.clientX + offsetX) + 'px';
            el.style.top = (e.clientY + offsetY) + 'px';
            el.style.transform = `translate(-50%, -50%) rotate(${(Math.random() - 0.5) * 12}deg)`;

            trailContainer.appendChild(el);

            gsap.fromTo(el, { opacity: 0, scale: 0.8 }, {
                opacity: 0.6,
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
            gsap.to(el, {
                opacity: 0,
                y: -8,
                duration: 1.2,
                delay: 0.4,
                ease: 'power2.in',
                onComplete: () => el.remove()
            });
        });
    }

    // Click anywhere on loader: enable sound and start fly-out animation
    loader.addEventListener('click', () => {
        if (clicked) return;
        clicked = true;
        loader.style.cursor = '';
        loader.style.pointerEvents = 'none';

        // Enable audio
        const audio = document.getElementById('siteAudio');
        if (audio) {
            localStorage.setItem(AUDIO_ENABLED_KEY, 'true');
            audio.muted = false;
            audio.play().catch(() => {});
        }
        if (window.siteAudio) {
            window.siteAudio.play();
            window.siteAudio.updateUI && window.siteAudio.updateUI();
        }

        runFlyOut();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(runLoader, 100));
} else {
    setTimeout(runLoader, 100);
}
