// Loader handled by loader.js – click to enable sound and start animation

// Site cursor – round, smooth lerp, shows "Click" on hover (desktop only, ≥1025px)
function initSiteCursor() {
    const cursor = document.getElementById('siteCursor');
    if (!cursor || !window.matchMedia('(pointer: fine)').matches) return;
    if (!window.matchMedia('(min-width: 1025px)').matches) return;

    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let targetX = cursorX;
    let targetY = cursorY;

    const CLICKABLE = 'a, button, [role="button"], input[type="submit"], input[type="button"], .deck-card, .work__cta, .footer__link, .footer__policy, .testimonials__stack-note, .top-nav a, .top-nav button';

    const updateCursor = () => {
        const ease = 0.18;
        cursorX += (targetX - cursorX) * ease;
        cursorY += (targetY - cursorY) * ease;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        const el = document.elementFromPoint(targetX, targetY);
        const isClickable = el && el.closest(CLICKABLE);
        const label = document.getElementById('siteCursorLabel');
        if (label) label.textContent = isClickable ? 'Click' : 'Explore';
        cursor.classList.toggle('site-cursor--clickable', !!isClickable);

        requestAnimationFrame(updateCursor);
    };

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(updateCursor);
}

// Lenis smooth scroll – init once, raf loop runs for the whole site
let lenis;
/** While true, wheel “one section” cap is off so scrollTo(#work) etc. isn’t clamped to ~1 viewport (green about zone). */
let lenisGestureLimitSuppressed = false;
let lenisWheelAnchor = 0;
let lenisWheelIdleFrames = 0;
let lenisWheelExceededDown = false;
let lenisWheelExceededUp = false;
const LENIS_WHEEL_IDLE_FRAMES = 30;
/** When leaving a subpage for `index.html#section`, stash id so home can scroll even if the hash is missing or late. */
const PENDING_HOME_HASH_KEY = 'pendingHomeHash';
/** Skip green About loader-book expand while Lenis animates past the hero (e.g. jump to #work / #services). */
let suppressAboutCardExpand = false;
let suppressAboutCardExpandSafetyTimer = null;

function beginSuppressAboutCardExpand() {
    suppressAboutCardExpand = true;
    if (suppressAboutCardExpandSafetyTimer) clearTimeout(suppressAboutCardExpandSafetyTimer);
    suppressAboutCardExpandSafetyTimer = setTimeout(() => {
        suppressAboutCardExpand = false;
        suppressAboutCardExpandSafetyTimer = null;
    }, 4500);
}

function endSuppressAboutCardExpand() {
    suppressAboutCardExpand = false;
    if (suppressAboutCardExpandSafetyTimer) {
        clearTimeout(suppressAboutCardExpandSafetyTimer);
        suppressAboutCardExpandSafetyTimer = null;
    }
}

/** In-page targets below the hero/about intro – scrolling here must not trigger the green book mid-animation. */
const SECTION_IDS_SKIP_ABOUT_EXPAND = new Set([
    'work',
    'services',
    'testimonials',
    'footer',
    'archive',
]);

function prepareLenisHashJump(id) {
    lenisGestureLimitSuppressed = true;
    if (SECTION_IDS_SKIP_ABOUT_EXPAND.has(id)) beginSuppressAboutCardExpand();
}

function completeLenisHashJump(id) {
    lenisGestureLimitSuppressed = false;
    if (lenis) {
        lenisWheelAnchor = lenis.scroll;
        lenisWheelExceededDown = false;
        lenisWheelExceededUp = false;
        lenisWheelIdleFrames = 0;
    }
    if (SECTION_IDS_SKIP_ABOUT_EXPAND.has(id)) endSuppressAboutCardExpand();
}

window.prepareLenisHashJump = prepareLenisHashJump;
window.completeLenisHashJump = completeLenisHashJump;

/**
 * Scroll to #id with Lenis; bypasses wheel step limiter + suppresses About-card expand for deep sections.
 * Exposed for loader.js (horizontal books).
 */
function scrollToHashWithLenis(id, extraOpts) {
    if (!lenis || !document.getElementById(id)) return false;
    const hash = '#' + id;
    prepareLenisHashJump(id);
    const userOnComplete = extraOpts && typeof extraOpts.onComplete === 'function' ? extraOpts.onComplete : null;
    const rest = extraOpts && typeof extraOpts === 'object' ? { ...extraOpts } : {};
    delete rest.onComplete;
    lenis.scrollTo(hash, {
        lerp: 0.1,
        ...rest,
        onComplete: () => {
            completeLenisHashJump(id);
            try {
                document.body.classList.remove('home-skip-past-hero');
            } catch (e) {}
            if (userOnComplete) userOnComplete();
        },
    });
    return true;
}

window.scrollToHashWithLenis = scrollToHashWithLenis;

const SECTION_HEIGHT = () => window.innerHeight; // 100vh
const MAX_SCROLL_PER_GESTURE = 0.85; // shorter: one gesture won't skip #about

/** Wheel cap per “gesture” – disabled during programmatic scrollTo(hash) so Work/Services links reach their sections. */
function lenisApplyWheelScrollLimit() {
    if (!lenis || lenisGestureLimitSuppressed) return;
    const y = lenis.scroll;
    const limit = SECTION_HEIGHT() * MAX_SCROLL_PER_GESTURE;
    if (y > lenisWheelAnchor + limit) {
        if (!lenisWheelExceededDown) {
            lenisWheelExceededDown = true;
            lenis.scrollTo(lenisWheelAnchor + limit, { lerp: 0.12 });
        }
    } else {
        lenisWheelExceededDown = false;
    }
    if (y < lenisWheelAnchor - limit) {
        if (!lenisWheelExceededUp) {
            lenisWheelExceededUp = true;
            lenis.scrollTo(Math.max(0, lenisWheelAnchor - limit), { lerp: 0.12 });
        }
    } else {
        lenisWheelExceededUp = false;
    }
    if (Math.abs(lenis.velocity) < 0.3) {
        lenisWheelIdleFrames++;
        if (lenisWheelIdleFrames >= LENIS_WHEEL_IDLE_FRAMES) {
            lenisWheelAnchor = lenis.scroll;
        }
    } else {
        lenisWheelIdleFrames = 0;
    }
}

function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.45,
        touchMultiplier: 0.6,
    });
    lenisWheelAnchor = 0;
    lenisWheelIdleFrames = 0;
    lenisWheelExceededDown = false;
    lenisWheelExceededUp = false;
    lenis.on('scroll', lenisApplyWheelScrollLimit);
    if (typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
    }
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}
// First screen (3 books) before about/case-study: stay until window load + images/videos in #pageTransitionWrap, then tilt + reveal
function initFirstScreen() {
    const wrap = document.getElementById('firstScreenWrap');
    const screen = document.getElementById('firstScreen');
    const bookThird = document.getElementById('firstScreenBookThird');
    if (!wrap || !screen || typeof gsap === 'undefined') return;

    const REVEAL_DURATION = 1.6;
    const REVEAL_EASE = 'power2.out';

    let preBookLoopTween = null;
    if (bookThird) {
        gsap.set(bookThird, { rotation: 0, transformOrigin: 'center bottom' });
        preBookLoopTween = gsap.to(bookThird, {
            rotation: 14,
            duration: 0.55,
            ease: 'power2.inOut',
            transformOrigin: 'center bottom',
            repeat: -1,
            yoyo: true,
        });
    }

    function runFirstScreenSequence() {
        if (preBookLoopTween) {
            preBookLoopTween.kill();
            preBookLoopTween = null;
        }
        if (bookThird) {
            gsap.killTweensOf(bookThird);
            gsap.set(bookThird, { rotation: 0, transformOrigin: 'center bottom' });
        }
        screen.style.pointerEvents = 'none';
        gsap.to(screen, {
            clipPath: 'inset(100% 0 0 0)',
            duration: REVEAL_DURATION,
            ease: REVEAL_EASE,
            onComplete: () => {
                wrap.style.visibility = 'hidden';
            },
        });
    }

    const waitPromise =
        typeof window.waitForPageMediaReady === 'function'
            ? window.waitForPageMediaReady('#pageTransitionWrap')
            : Promise.resolve();
    waitPromise.then(runFirstScreenSequence);
}

// Page transition: top-to-bottom reveal (same as case study images, used when no first screen)
function initPageTurnTransition() {
    if (document.getElementById('firstScreenWrap')) return; // page uses first screen instead
    const overlay = document.getElementById('pageTurnOverlay');
    const wrap = document.getElementById('pageTurnWrap');
    if (!overlay || typeof gsap === 'undefined') return;
    gsap.to(overlay, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.6,
        ease: 'power2.out',
        onComplete: () => {
            if (wrap) wrap.style.visibility = 'hidden';
        },
    });
}

function initPageTransition() {
    if (document.getElementById('pageTurnOverlay')) return; // page uses page-turn instead
    const wrap = document.getElementById('pageTransitionWrap');
    if (!wrap || document.getElementById('loader')) return; // index: loader.js runs it when fly-out completes
    if (typeof gsap === 'undefined') return;
    gsap.to(wrap, {
        clipPath: 'inset(0% 0 0 0)',
        opacity: 1,
        duration: 1.6,
        ease: 'power2.out',
    });
}

function initCaseStudyFromHomeFlag() {
    if (document.querySelector('.case-main')) return;
    if (!document.getElementById('work')) return;
    document.querySelectorAll('a[href*="case-study.html"]').forEach((a) => {
        a.addEventListener('click', () => {
            try {
                sessionStorage.setItem('caseStudyOpenedFromHome', '1');
            } catch (e) {}
        });
    });
}

/** In-page section id from `index.html#section` (homepage) or `#section` */
function getSamePageSectionIdFromHref(href) {
    if (!href || href === '#') return null;
    if (href.startsWith('#')) return href.slice(1);
    const m = href.match(/^index\.html#(.+)$/i);
    return m ? m[1] : null;
}

/** Homepage: open index.html#services (etc.) from another page → scroll after loader is ready */
function initHomeHashScroll() {
    const isHome = document.getElementById('loader') && document.getElementById('services');
    if (!isHome) return;

    let pendingTimeouts = [];

    function getHomeHashTargetId() {
        const h = (typeof location !== 'undefined' && location.hash ? location.hash.replace(/^#/, '') : '').trim();
        if (h && document.getElementById(h)) {
            try {
                sessionStorage.removeItem(PENDING_HOME_HASH_KEY);
            } catch (e) {}
            return h;
        }
        let s = '';
        try {
            s = (sessionStorage.getItem(PENDING_HOME_HASH_KEY) || '').trim();
        } catch (e) {}
        if (s && document.getElementById(s)) {
            try {
                sessionStorage.removeItem(PENDING_HOME_HASH_KEY);
                if (!h) {
                    try {
                        history.replaceState(null, '', '#' + s);
                    } catch (e2) {}
                }
            } catch (e) {}
            return s;
        }
        return '';
    }

    function hashScrollTargetLanded(id) {
        if (!id) return true;
        const el = document.getElementById(id);
        if (!el || !lenis) return false;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        return rect.top <= vh * 0.35 && rect.top >= -vh * 0.2;
    }

    function scrollToHashIfAny() {
        const raw = getHomeHashTargetId();
        if (!raw || !document.getElementById(raw)) return;
        if (!document.body.classList.contains('ready')) return;
        if (typeof lenis === 'undefined' || !lenis) return;
        if (hashScrollTargetLanded(raw)) {
            try {
                document.body.classList.remove('home-skip-past-hero');
            } catch (e) {}
            return;
        }
        const ok = scrollToHashWithLenis(raw);
        if (!ok) {
            try {
                document.body.classList.remove('home-skip-past-hero');
            } catch (e2) {}
        }
    }

    function clearPendingSchedules() {
        pendingTimeouts.forEach((tid) => clearTimeout(tid));
        pendingTimeouts = [];
    }

    function schedule() {
        clearPendingSchedules();
        [200, 550, 1100].forEach((ms) => {
            pendingTimeouts.push(setTimeout(scrollToHashIfAny, ms));
        });
    }

    /* Only react when `ready` first appears — not on every body class change (scrolled-past-hero, etc.),
       or schedule() would re-run and scrollToHashIfAny would yank the user back to #services from the hero. */
    const mo = new MutationObserver(() => {
        if (!document.body.classList.contains('ready')) return;
        schedule();
        mo.disconnect();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('load', schedule);
    window.addEventListener('pageshow', (ev) => {
        if (!document.body.classList.contains('ready')) return;
        let hasPending = false;
        try {
            hasPending = !!(sessionStorage.getItem(PENDING_HOME_HASH_KEY) || '').trim();
        } catch (e) {}
        /* bfcache restore, or pending hash from another page — not “has hash” alone (always true on #services) */
        if (ev.persisted || hasPending) schedule();
    });
    if (document.body.classList.contains('ready')) {
        schedule();
        mo.disconnect();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLenis();
        initSiteCursor();
        initFirstScreen();
        initPageTurnTransition();
        initPageTransition();
        initCaseStudyFromHomeFlag();
        initHomeHashScroll();
    });
} else {
    initLenis();
    initSiteCursor();
    initFirstScreen();
    initPageTurnTransition();
    initPageTransition();
    initCaseStudyFromHomeFlag();
    initHomeHashScroll();
}

// Mobile nav toggle
document.getElementById('navMenuBtn')?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    document.getElementById('navMenuBtn')?.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.top-nav__link').forEach((a) => {
    a.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
            document.body.classList.remove('nav-open');
            document.getElementById('navMenuBtn')?.setAttribute('aria-expanded', 'false');
        }
    });
});

/** Close mobile nav when tapping the blurred backdrop (outside the bar + drawer) */
document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('nav-open')) return;
    if (window.innerWidth > 1024) return;
    if (e.target.closest('.top-nav')) return;
    document.body.classList.remove('nav-open');
    document.getElementById('navMenuBtn')?.setAttribute('aria-expanded', 'false');
});

document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href) {
        const crossId = getSamePageSectionIdFromHref(href);
        /* Navigating to home section from another page: remember target if #id isn’t on this document */
        if (crossId && !document.getElementById(crossId)) {
            try {
                sessionStorage.setItem(PENDING_HOME_HASH_KEY, crossId);
            } catch (err) {}
        }
    }
    if (!lenis) return;
    if (!href) return;
    const id = getSamePageSectionIdFromHref(href);
    /* Only intercept when target section exists on this document (e.g. index.html#work on home, not on about) */
    if (id && document.getElementById(id)) {
        e.preventDefault();
        scrollToHashWithLenis(id);
    }
}, { passive: false });

// 1) Scroll past hero → green rectangle expands to full screen (transition start) — desktop only
// 2) Scroll to #about (100vh) → green fades into #about section (same green in flow)
// 3) Nav appears when about-me section comes into view
// Tablet/phone (≤1024px): no expanding loader book — #about is a normal section under the hero (see .about-static-mobile CSS)
function initScrollObserver() {
    const aboutCard = document.querySelector('.loader-book--deck[data-deck-index="3"]');
    const aboutMeSection = document.getElementById('about-me');
    /** Scroll past this (px) → green ABOUT book can expand (desktop) / hero deck hides (all) */
    const EXPAND_SCROLL_MIN = 80;
    /**
     * Collapse only when scroll is back near the top (much lower than EXPAND_SCROLL_MIN).
     * Hysteresis: Lenis / wheel cap often dips below 80px briefly — that used to collapse the overlay
     * and make the ABOUT title + copy flicker. Don't collapse until the user truly returns to the hero.
     */
    const COLLAPSE_SCROLL_MAX = 28;
    const ABOUT_FLOW_THRESHOLD = window.innerHeight;

    let hasExpanded = false;
    let savedRect = null;

    function isAboutStaticMobile() {
        return typeof window.matchMedia !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches;
    }

    function syncAboutStaticBodyClass() {
        document.body.classList.toggle('about-static-mobile', isAboutStaticMobile());
    }

    syncAboutStaticBodyClass();
    window.addEventListener('resize', syncAboutStaticBodyClass);

    function onScroll() {
        const scrolled = (typeof lenis !== 'undefined' && lenis ? lenis.scroll : null) ?? window.scrollY ?? document.documentElement.scrollTop;
        const staticAbout = isAboutStaticMobile();

        if (scrolled >= ABOUT_FLOW_THRESHOLD) {
            document.body.classList.add('about-flow');
            document.body.classList.add('scrolled-past-hero');
        } else {
            document.body.classList.remove('about-flow');
            /* Mobile/tablet: no fullscreen green loader animation — only hero scroll chrome */
            if (staticAbout) {
                const pinSkipDeck = document.body.classList.contains('home-skip-past-hero');
                if (scrolled >= EXPAND_SCROLL_MIN) {
                    document.body.classList.add('scrolled-past-hero');
                    if (pinSkipDeck) document.body.classList.remove('home-skip-past-hero');
                } else if (!pinSkipDeck) {
                    document.body.classList.remove('scrolled-past-hero');
                }
            } else if (aboutCard) {
                if (!suppressAboutCardExpand && scrolled >= EXPAND_SCROLL_MIN && !hasExpanded) {
                    hasExpanded = true;
                    expandAboutCard(aboutCard);
                } else if (scrolled < COLLAPSE_SCROLL_MAX && hasExpanded) {
                    hasExpanded = false;
                    collapseAboutCard(aboutCard);
                }
                /* Keep hero “past” state while the green overlay is open, even if Lenis dips < EXPAND_SCROLL_MIN */
                if (scrolled >= EXPAND_SCROLL_MIN || hasExpanded) {
                    document.body.classList.add('scrolled-past-hero');
                } else {
                    document.body.classList.remove('scrolled-past-hero');
                }
            } else {
                const pinSkipDeck = document.body.classList.contains('home-skip-past-hero');
                if (scrolled >= EXPAND_SCROLL_MIN) {
                    document.body.classList.add('scrolled-past-hero');
                    if (pinSkipDeck) document.body.classList.remove('home-skip-past-hero');
                } else if (!pinSkipDeck) {
                    document.body.classList.remove('scrolled-past-hero');
                }
            }
        }

        // Nav appears when about-me section is in view
        if (aboutMeSection) {
            const rect = aboutMeSection.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.5) {
                document.body.classList.add('scrolled-to-about-me');
            } else {
                document.body.classList.remove('scrolled-to-about-me');
            }
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    if (lenis) lenis.on('scroll', onScroll);
    onScroll();

    function expandAboutCard(card) {
        const rect = card.getBoundingClientRect();
        savedRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
        card.classList.add('about-expanded');
        document.body.classList.add('scrolled-past-hero');
        if (typeof gsap !== 'undefined') {
            gsap.set(card, { clearProps: 'transform' });
            gsap.to(card, {
                position: 'fixed',
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                duration: 0.8,
                ease: 'power2.inOut',
                overwrite: true,
                onComplete: function () {
                    // Run text reveal as soon as the green container has finished opening
                    animateAboutText();
                }
            });
        }
    }

    function animateAboutText() {
        const aboutContent = document.querySelector('#about .about-content');
        const smallText = document.querySelector('#about .about-text--small');
        const lines = document.querySelectorAll('#about .about-line');
        const elements = [smallText, ...lines].filter(Boolean);
        if (typeof gsap === 'undefined' || !elements.length) return;
        // Ensure about layer is visible (in case transitions delayed it)
        if (aboutContent) {
            aboutContent.style.visibility = 'visible';
            aboutContent.style.opacity = '1';
        }
        gsap.killTweensOf(elements);
        gsap.set(elements, { opacity: 0, y: 28 });
        // No delay: start text reveal immediately when container is open
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        if (smallText) tl.fromTo(smallText, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85 }, 0);
        lines.forEach((line, i) => {
            tl.fromTo(line, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85 }, 0.15 + i * 0.12);
        });
    }

    function resetAboutText() {
        const smallText = document.querySelector('#about .about-text--small');
        const lines = document.querySelectorAll('#about .about-line');
        const elements = [smallText, ...lines].filter(Boolean);
        if (typeof gsap !== 'undefined' && elements.length) {
            gsap.killTweensOf(elements);
            gsap.set(elements, { opacity: 0, y: 28 });
        }
    }

    function collapseAboutCard(card) {
        if (!savedRect) return;
        resetAboutText();
        document.body.classList.remove('scrolled-past-hero');
        if (typeof gsap !== 'undefined') {
            gsap.to(card, {
                position: 'absolute',
                left: savedRect.left,
                top: savedRect.top,
                width: savedRect.width,
                height: savedRect.height,
                duration: 0.6,
                ease: 'power2.inOut',
                overwrite: true,
                onComplete: () => card.classList.remove('about-expanded')
            });
        } else {
            card.classList.remove('about-expanded');
        }
    }
}

function init() {
    const tryInit = () => {
        const aboutCard = document.querySelector('.loader-book--deck[data-deck-index="3"]');
        const loaderReady = document.body.classList.contains('ready');
        if (loaderReady) {
            initScrollObserver();
            window.dispatchEvent(new Event('scroll'));
        } else if (aboutCard) {
            const observer = new MutationObserver(() => {
                if (document.body.classList.contains('ready')) {
                    observer.disconnect();
                    initScrollObserver();
                    window.dispatchEvent(new Event('scroll'));
                }
            });
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        } else {
            setTimeout(tryInit, 100);
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 400));
    } else {
        setTimeout(tryInit, 400);
    }
}
init();

// Work section: page-flip scroll reveal (horizontal, book-style)
function initWorkFlipReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Folded-page rest state: slight tilt/curl so the page isn’t perfectly flat
    const foldedRight1 = { rotateY: 0, rotateX: 3, rotateZ: -1.5, opacity: 1 };
    const foldedRight3 = { rotateY: 0, rotateX: 4, rotateZ: 1, opacity: 1 };
    const foldedLeft2 = { rotateY: 0, rotateX: -2.5, rotateZ: 1.2, opacity: 1 };

    const rightItems = document.querySelectorAll('.work-item--right .work-item__image-wrap');
    const leftItems = document.querySelectorAll('.work-item--left .work-item__image-wrap');
    const blocks = document.querySelectorAll('.work-item__block');
    const innerImages = document.querySelectorAll('.work-item__image');

    rightItems.forEach((el, i) => {
        const to = i === 0 ? foldedRight1 : foldedRight3;
        gsap.fromTo(el, { rotateY: 88, opacity: 0 }, {
            ...to,
            duration: 1.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: el,
                start: '40% 100%',
                end: '40% 60%',
                toggleActions: 'play none none none',
            },
        });
    });
    leftItems.forEach((el) => {
        gsap.fromTo(el, { rotateY: -88, opacity: 0 }, {
            ...foldedLeft2,
            duration: 1.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: el,
                start: '40% 100%',
                end: '40% 60%',
                toggleActions: 'play none none none',
            },
        });
    });

    // Parallax / hanging motion on the work blocks as you scroll
    blocks.forEach((block, index) => {
        gsap.set(block, { transformOrigin: '50% 0%' });
        const baseRotation = index % 2 === 0 ? -2 : 2;
        gsap.fromTo(block,
            { y: -18, rotation: baseRotation },
            {
                y: 18,
                rotation: -baseRotation,
                ease: 'none',
                scrollTrigger: {
                    trigger: block,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            }
        );
    });

    // Inner image parallax (up/down inside its frame)
    innerImages.forEach((img) => {
        gsap.fromTo(img,
            { y: -20 },
            {
                y: 20,
                ease: 'none',
                scrollTrigger: {
                    trigger: img,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            }
        );
    });
}

// About section (.about-content): fade-up text reveal when section scrolls into view (same style as case study)
function initAboutContentTextReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const aboutContent = document.querySelector('#about .about-content');
    const smallText = document.querySelector('#about .about-text--small');
    const lines = document.querySelectorAll('#about .about-line');
    const elements = [smallText, ...lines].filter(Boolean);
    if (!aboutContent || !elements.length) return;

    gsap.set(elements, { opacity: 0, y: 28 });
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: aboutContent,
            start: 'top 88%',
            toggleActions: 'play none none none',
        },
    });
    if (smallText) tl.to(smallText, { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }, 0);
    lines.forEach((line, i) => {
        tl.to(line, { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' }, 0.15 + i * 0.12);
    });
}

// About-me section: letters start faded, fill one by one (left to right) as you scroll
function initAboutMeTextReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = document.querySelector('.about-me__text');
    if (!el || el.classList.contains('about-me__text--split')) return;

    const text = el.textContent;
    el.textContent = '';
    const words = text.split(/\s+/);
    words.forEach((word, wi) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'about-me__word';
        word.split('').forEach((char) => {
            const span = document.createElement('span');
            span.className = 'about-me__char';
            span.textContent = char;
            wordSpan.appendChild(span);
        });
        el.appendChild(wordSpan);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('about-me__text--split');

    const chars = el.querySelectorAll('.about-me__char');
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 25%',
            scrub: true,
        },
    });
    const step = 1 / chars.length;
    chars.forEach((char, i) => {
        tl.to(char, { opacity: 1, duration: 0.01 }, i * step);
    });
}

/** Playground overview body copy: same char scrub as index .about-me__text */
function initPlaygroundOverviewCharReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = document.querySelector('.playground-overview__text');
    if (!el || el.classList.contains('playground-overview__text--split')) return;

    const text = el.textContent;
    el.textContent = '';
    const words = text.split(/\s+/);
    words.forEach((word, wi) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'playground-overview__word';
        word.split('').forEach((char) => {
            const span = document.createElement('span');
            span.className = 'playground-overview__char';
            span.textContent = char;
            wordSpan.appendChild(span);
        });
        el.appendChild(wordSpan);
        if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.classList.add('playground-overview__text--split');

    const chars = el.querySelectorAll('.playground-overview__char');
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 25%',
            scrub: true,
        },
    });
    const step = 1 / chars.length;
    chars.forEach((char, i) => {
        tl.to(char, { opacity: 1, duration: 0.01 }, i * step);
    });
}

// Testimonials: word trail behind cursor (like loader)
function initTestimonialsTrail() {
    const section = document.querySelector('.testimonials');
    const trailContainer = document.getElementById('testimonialsTrail');
    if (!section || !trailContainer || typeof gsap === 'undefined') return;

    const TRAIL_WORDS = ['Curiosity', 'Ideas', 'Knowledge', 'Explore', 'Process', 'Experiment', 'Refine', 'Iteration', 'Growth', 'Story', 'Design', 'Experience', 'Discovery', 'Learn', 'Create', 'Feedback', 'Trust', 'Collaboration'];
    let trailLastSpawn = 0;
    const TRAIL_THROTTLE = 90;
    const TRAIL_MAX = 25;

    document.addEventListener('mousemove', (e) => {
        const rect = section.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

        const now = Date.now();
        if (now - trailLastSpawn < TRAIL_THROTTLE) return;
        if (trailContainer.children.length >= TRAIL_MAX) return;

        trailLastSpawn = now;
        const word = TRAIL_WORDS[Math.floor(Math.random() * TRAIL_WORDS.length)];
        const el = document.createElement('span');
        el.className = 'testimonials__trail-word';
        el.textContent = word;

        const offsetX = (Math.random() - 0.5) * 24;
        const offsetY = (Math.random() - 0.5) * 24;
        el.style.left = (e.clientX - rect.left + offsetX) + 'px';
        el.style.top = (e.clientY - rect.top + offsetY) + 'px';
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

// Testimonials sticky note: scroll-based "pinned" swing animation (desktop only).
// On mobile, GSAP was overwriting CSS transforms — note lost centering; pin lost translate
// and looked like a thin line. We use matchMedia + xPercent/yPercent on desktop only.
function initTestimonialsNoteAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector('.testimonials');
    const inner = document.querySelector('.testimonials__inner');
    const note = document.querySelector('.testimonials__note');
    const sources = gsap.utils.toArray('.testimonials__note-source');
    const stackButtons = gsap.utils.toArray('.testimonials__stack-note');
    if (!section || !inner || !note || !sources.length) return;

    const pin = note.querySelector('.testimonials__pin');

    const eyebrowEl = note.querySelector('.testimonials__eyebrow');
    const quoteEl = note.querySelector('.testimonials__quote');
    const metaEl = note.querySelector('.testimonials__meta');

    const initialData = {
        eyebrow: eyebrowEl?.innerHTML || '',
        quote: quoteEl?.innerHTML || '',
        meta: metaEl?.innerHTML || '',
    };

    const data = [
        initialData,
        ...sources.map((src) => ({
            eyebrow: src.querySelector('.testimonials__eyebrow')?.innerHTML || '',
            quote: src.querySelector('.testimonials__quote')?.innerHTML || '',
            meta: src.querySelector('.testimonials__meta')?.innerHTML || '',
        })),
    ];

    let currentIndex = 0;

    const mqDesktop = '(min-width: 1025px)';

    function isDesktop() {
        return window.matchMedia(mqDesktop).matches;
    }

    /** Same transform base as CSS: translate(-50%,-50%) for centered note */
    const noteBase = {
        xPercent: -50,
        yPercent: -50,
        transformOrigin: '15% -8%',
    };

    function applyTestimonial(index) {
        const item = data[index];
        if (!item) return;

        stackButtons.forEach((btn) => {
            const idx = Number(btn.getAttribute('data-index'));
            if (idx === index) btn.classList.add('is-active');
            else btn.classList.remove('is-active');
        });

        if (!isDesktop()) {
            if (eyebrowEl && item.eyebrow) eyebrowEl.innerHTML = item.eyebrow;
            if (quoteEl && item.quote) quoteEl.innerHTML = item.quote;
            if (metaEl && item.meta) metaEl.innerHTML = item.meta;
            return;
        }

        gsap.to(note, {
            ...noteBase,
            autoAlpha: 0,
            rotation: 3,
            y: 8,
            duration: 0.35,
            onComplete: () => {
                if (eyebrowEl && item.eyebrow) eyebrowEl.innerHTML = item.eyebrow;
                if (quoteEl && item.quote) quoteEl.innerHTML = item.quote;
                if (metaEl && item.meta) metaEl.innerHTML = item.meta;
                gsap.fromTo(
                    note,
                    { ...noteBase, autoAlpha: 0, rotation: -3, y: -8 },
                    { ...noteBase, autoAlpha: 1, rotation: -3, y: -10, duration: 0.35 }
                );
            },
        });
    }

    stackButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-index'));
            if (!Number.isNaN(idx) && idx !== currentIndex && idx >= 0 && idx < data.length) {
                currentIndex = idx;
                applyTestimonial(idx);
            }
        });
    });

    const mm = gsap.matchMedia();

    mm.add(mqDesktop, () => {
        if (pin) {
            gsap.set(pin, {
                xPercent: -40,
                yPercent: -55,
                rotation: -18,
                transformOrigin: '50% 100%',
            });
        }
        gsap.set(note, {
            ...noteBase,
            autoAlpha: 1,
            rotation: -3,
            y: -10,
        });

        const tweenNote = gsap.fromTo(
            note,
            { ...noteBase, rotation: -3, y: -15 },
            {
                ...noteBase,
                rotation: 3,
                y: 15,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            }
        );

        let tweenPin = null;
        if (pin) {
            tweenPin = gsap.fromTo(
                pin,
                { xPercent: -40, yPercent: -55, rotation: -24 },
                {
                    xPercent: -40,
                    yPercent: -55,
                    rotation: -18,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                }
            );
        }

        return () => {
            tweenNote.scrollTrigger?.kill();
            tweenPin?.scrollTrigger?.kill();
            tweenNote.kill();
            tweenPin?.kill();
        };
    });

    mm.add('(max-width: 1024px)', () => {
        gsap.set(note, { clearProps: 'transform' });
        if (pin) gsap.set(pin, { clearProps: 'transform' });
    });
}

/** Delayed first run of case study text reveal (see DOMContentLoaded) — cleared if user switches project via hash first */
let caseStudyTextRevealDelayTimer = null;
/** GSAP context so we can revert hero + scroll reveals when switching project (Next project / hash) */
let caseStudyTextRevealCtx = null;

// Text reveal on scroll for case-study page (fade-up when entering view)
function initCaseStudyTextReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const caseMain = document.querySelector('.case-main');
    if (!caseMain) return;
    gsap.registerPlugin(ScrollTrigger);

    if (caseStudyTextRevealCtx) {
        try {
            caseStudyTextRevealCtx.revert();
        } catch (e) {}
        caseStudyTextRevealCtx = null;
    }

    caseStudyTextRevealCtx = gsap.context(() => {
        // Footer is excluded: same static footer as index/about (no scroll reveal).
        const textSelectors = [
            '.case-hero__title-line',
            '.case-hero__location',
            '.case-details__eyebrow',
            '.case-details__services li',
            '.case-details__paragraph',
            '.case-next__title',
        ];
        const textEls = [];
        textSelectors.forEach((sel) => {
            caseMain.querySelectorAll(sel).forEach((el) => {
                textEls.push(el);
            });
        });

        const heroEls = textEls.filter((el) => el.closest('.case-hero'));
        const scrollEls = textEls.filter((el) => !el.closest('.case-hero'));

        // Hero text: animate on page load after a delay, then stagger
        const heroDelay = 0.8; // seconds before first line appears
        heroEls.forEach((el, i) => {
            gsap.fromTo(
                el,
                { opacity: 0, y: 28 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.85,
                    delay: heroDelay + i * 0.12,
                    ease: 'power2.out',
                }
            );
        });

        // Rest of page: reveal on scroll
        scrollEls.forEach((el) => {
            gsap.fromTo(
                el,
                { opacity: 0, y: 28 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.85,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        });
    }, caseMain);

    requestAnimationFrame(() => {
        try {
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        } catch (e) {}
    });
}

/** Cancel the 1s delayed init so switching project before it runs does not double-init animations */
function cancelCaseStudyTextRevealDelay() {
    if (caseStudyTextRevealDelayTimer) {
        clearTimeout(caseStudyTextRevealDelayTimer);
        caseStudyTextRevealDelayTimer = null;
    }
}

window.initCaseStudyTextReveal = initCaseStudyTextReveal;
window.cancelCaseStudyTextRevealDelay = cancelCaseStudyTextRevealDelay;

/**
 * Case study: snap Lenis/window to top on open (without repeated ScrollTrigger.refresh — that was
 * resetting scroll-linked text reveals). One optional late refresh after GSAP inits.
 */
function scheduleCaseStudyForceTop() {
    if (!document.querySelector('.case-main')) return;
    const run = () => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch (e) {
            window.scrollTo(0, 0);
        }
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        try {
            if (typeof lenis !== 'undefined' && lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(0, { immediate: true });
            }
        } catch (e) {}
    };
    [0, 32, 100].forEach((ms) => setTimeout(run, ms));
    setTimeout(function () {
        try {
            if (typeof lenis !== 'undefined' && lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(0, { immediate: true });
            }
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        } catch (e) {}
    }, 2800);
}

// Generic reveal for case-study media (images/videos)
function initCaseStudyMediaReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Apply a simple vertical mask reveal to all regular images/videos on the site
    const mediaEls = document.querySelectorAll('img, video');
    if (!mediaEls.length) return;

    mediaEls.forEach((el) => {
        // Skip special UI/loader elements
        if (el.closest('#loader') || el.closest('.loader-library') || el.closest('.testimonials__trail')) {
            return;
        }

        /* clip-path + opacity on <video> often paints as blank in WebKit/Chromium; reveal the wrapper instead */
        let revealTarget = el;
        if (el.tagName === 'VIDEO') {
            const inCaseFrame = el.closest('.case-video__frame');
            const inStripItem = el.closest('.case-media-strip__item');
            if (inCaseFrame) revealTarget = inCaseFrame;
            else if (inStripItem) revealTarget = inStripItem;
        }

        /* Do not run scroll reveal on full-bleed case video frames: opacity/clip on the wrapper hides <video>
           reliably and ScrollTrigger.refresh() loops can leave them stuck at opacity 0 */
        if (revealTarget.classList && revealTarget.classList.contains('case-video__frame')) {
            return;
        }

        gsap.fromTo(
            revealTarget,
            { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
            {
                clipPath: 'inset(0% 0 0 0)',
                opacity: 1,
                duration: 1.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: revealTarget,
                    start: 'top 85%',
                    end: 'top 55%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    // Add a gentle "hanging" sway on case-study media wrappers, similar to homepage work blocks
    const swayEls = document.querySelectorAll('.case-video__frame, .case-gallery__top, .case-gallery__bottom-item');
    swayEls.forEach((el, index) => {
        gsap.set(el, { transformOrigin: '50% 0%' });
        const baseRotation = index % 2 === 0 ? -2 : 2;
        gsap.fromTo(
            el,
            { y: -18, rotation: baseRotation },
            {
                y: 18,
                rotation: -baseRotation,
                ease: 'none',
                scrollTrigger: {
                    trigger: el,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            }
        );
    });
}

function scheduleCaseStudyTextRevealDelayed() {
    cancelCaseStudyTextRevealDelay();
    caseStudyTextRevealDelayTimer = setTimeout(() => {
        caseStudyTextRevealDelayTimer = null;
        initCaseStudyTextReveal();
    }, 1000);
}

/** Playground (Archive): same hero stagger on load + fade-up on scroll as case study text reveal */
function initPlaygroundTextReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const main = document.querySelector('.playground-main');
    if (!main) return;
    gsap.registerPlugin(ScrollTrigger);

    const heroLines = main.querySelectorAll('.playground-hero__line');
    const heroDelay = 0.8;
    heroLines.forEach((el, i) => {
        gsap.fromTo(
            el,
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.85,
                delay: heroDelay + i * 0.12,
                ease: 'power2.out',
            }
        );
    });

    /* .playground-overview__text uses initPlaygroundOverviewCharReveal (same scrub as about-me) */
    const scrollSelectors = ['.playground-overview__label', '.playground-grid__meta'];
    scrollSelectors.forEach((sel) => {
        main.querySelectorAll(sel).forEach((el) => {
            gsap.fromTo(
                el,
                { opacity: 0, y: 28 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.85,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        });
    });

    requestAnimationFrame(() => {
        try {
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        } catch (e) {}
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initWorkFlipReveal, 600);
        setTimeout(initAboutContentTextReveal, 620);
        setTimeout(initAboutMeTextReveal, 700);
        setTimeout(initPlaygroundOverviewCharReveal, 700);
        setTimeout(initTestimonialsNoteAnimation, 800);
        setTimeout(initTestimonialsTrail, 800);
        setTimeout(initCaseStudyMediaReveal, 900);
        /* After initial scroll-to-top snaps (see scheduleCaseStudyForceTop) so hero stagger isn’t clobbered */
        scheduleCaseStudyTextRevealDelayed();
        setTimeout(initPlaygroundTextReveal, 1000);
        setTimeout(scheduleCaseStudyForceTop, 0);
    });
} else {
    setTimeout(initWorkFlipReveal, 600);
    setTimeout(initAboutContentTextReveal, 620);
    setTimeout(initAboutMeTextReveal, 700);
    setTimeout(initPlaygroundOverviewCharReveal, 700);
    setTimeout(initTestimonialsNoteAnimation, 800);
    setTimeout(initTestimonialsTrail, 800);
    setTimeout(initCaseStudyMediaReveal, 900);
    scheduleCaseStudyTextRevealDelayed();
    setTimeout(initPlaygroundTextReveal, 1000);
    setTimeout(scheduleCaseStudyForceTop, 0);
}

// Refresh ScrollTrigger on resize for responsive behavior
let resizeTicking = false;
window.addEventListener('resize', () => {
    if (resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        resizeTicking = false;
    });
});
