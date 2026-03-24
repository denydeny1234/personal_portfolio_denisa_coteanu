(function () {
    const projects = [
        {
            id: 'beraria-h',
            heroImage: 'images/img1.png', // replace with actual path
            videoSrc: 'videos/berariah_video.mp4', // replace with actual path
            videoSecondarySrc: 'videos/berariah_video2.mp4',
            galleryTop: 'images/case-beraria-gallery-top.png',
            galleryBottomLeft: 'images/case-beraria-gallery-bottom-left.png',
            galleryBottomRight: 'images/case-beraria-gallery-bottom-right.png',
            galleryTop2: 'images/case-beraria-gallery2-top.png',
            galleryBottomLeft2: 'images/case-beraria-gallery2-bottom-left.png',
            galleryBottomRight2: 'images/case-beraria-gallery2-bottom-right.png',
            stripImage1: 'images/case-beraria-strip-image1.png',
            /* strip video omitted: portrait clip added large empty band before Next project */
            nextProjectId: 'posters-beraria-h',
            titlePrimary: 'BERARIA H,',
            // Irregular stacked lines: each entry is one visual row
            titleLines: [
                'AN INTERACTIVE',
                'DIGITAL EXPERIENCE'
            ],
            location: 'MADE IN BUCHAREST, ROMANIA',
            servicesLabel: 'SERVICES',
            services: [
                'UX Research',
                'Concept Development',
                'UI Design',
                '3D Modeling',
                'Creative Development'
            ],
            storyHeading: 'AN INTERACTIVE DIGITAL EXPERIENCE',
            storyParagraphs: [
                'Designing for a venue like Beraria H means working with something more than architecture or branding. It means translating atmosphere, the feeling of being surrounded by music, people, light, and shared moments.',
                'The challenge of this project was to transform that atmosphere into an interactive experience. Instead of presenting information in a traditional website format, the concept focused on scroll-based storytelling, guiding visitors through fragments of the venue’s energy and memories. The goal was not simply to show what Beraria H is, but to evoke what it feels like to be there.'
            ],
            pageTitle: 'Beraria H – Interactive Digital Experience'
        },
        {
            id: 'posters-beraria-h',
            heroImage: 'images/img2.png', // replace with actual path
            videoSrc: 'videos/poster-video.mp4', // replace with actual path
            videoSecondarySrc: 'images/poster-img4.png', // image for this project (not video)
            videoSecondaryIsImage: true,
            galleryTop: 'images/poster-img1.png',
            galleryBottomLeft: 'images/poster-img2.png',
            galleryBottomRight: 'images/poster-img3.png',
            galleryTop2: 'images/poster-img5.png',
            galleryBottomLeft2: 'images/poster-img6.png',
            galleryBottomRight2: 'images/poster-img7.png',
            stripImage1: 'images/poster-img8.png',
            stripVideo1Src: 'videos/poster-video.mp4',
            stripVideo1IsImage: true,
            nextProjectId: 'vodkhaz',
            titlePrimary: 'BERARIA H,',
            // Irregular stacked lines: each entry is one visual row
            titleLines: [
                'VISUAL DESIGN',
                'FOR LIVE EVENTS'
            ],
            location: 'MADE IN BUCHAREST, ROMANIA',
            servicesLabel: 'SERVICES',
            services: [
                'Graphic Design',
                'Event Marketing Design',
                'Social Media Design',
                'Print Design',
                'Visual Communication'
            ],
            storyHeading: 'TRANSLATING ENERGY INTO VISUAL COMMUNICATION',
            storyParagraphs: [
                'For over two years, I worked as a graphic designer at Beraria H, one of the largest live music venues in Romania. My role focused on creating visual materials that promote concerts, performances, and cultural events across both digital and print platforms. I designed posters, social media graphics, and promotional visuals that communicate event information clearly while capturing the energy of live performances.',
                'Working in a fast-paced environment with a constant flow of events required quick execution, strong visual hierarchy, and adaptable design systems. My work helped the venue maintain a consistent visual presence while effectively promoting dozens of events each month, ensuring that each campaign was visually engaging and immediately recognizable to audiences.'
            ],
            pageTitle: 'Beraria H – TRANSLATING ENERGY INTO VISUAL COMMUNICATION'
        },
        {
            id: 'vodkhaz',
            heroImage: 'images/img3.png', // replace with actual path
            videoSrc: 'videos/vodkhaz_videosrc.mov', // replace with actual path
            videoSecondarySrc: 'videos/vodkhaz_strip_video.mov', // optional second video
            galleryTop: 'images/vodkhaz_gallery_top.png',
            galleryBottomLeft: 'images/vodkhaz_gallery_bottom_left.png',
            galleryBottomRight: 'images/vodkhaz_gallery_bottom_right.png',
            galleryTop2: 'images/vodkhaz_gallery_top2.png',
            galleryBottomLeft2: 'images/vodkhaz_gallery_bottom_left2.png',
            galleryBottomRight2: 'images/vodkhaz_gallery_bottom_right2.png',
            stripImage1: 'images/vodkhaz_strip_image.png',
            stripVideo1Src: 'videos/vodkhaz_strip_video2.mov',
            nextProjectId: 'beraria-h',
            titlePrimary: 'VODKHAZ,',
            // Irregular stacked lines: each entry is one visual row
            titleLines: [
                'AN IMMERSIVE',
                'DIGITAL EXPERIENCE'
            ],
            location: 'MADE IN BUCHAREST, ROMANIA',
            servicesLabel: 'SERVICES',
            services: [
                'UX Research',
                'Concept Development',
                'UI Design',
                '3D Modeling',
                'Creative Development'
            ],
            storyHeading: 'AN IMMERSIVE DIGITAL EXPERIENCE',
            storyParagraphs: [
                'Designing for a brand like Vodkhaz means going beyond the product itself. It’s not just about a bottle or a drink, but about translating energy, nightlife, and human connection into a digital space.',
                'The challenge of this project was to redefine Vodkhaz’s identity online. While the brand already carried a strong sense of atmosphere and personality, its digital presence didn’t reflect that depth. Instead of building a traditional product-focused website, the concept focused on narrative-driven storytelling, capturing the feeling of nights, people, and shared moments.',
                'The goal was not simply to present Vodkhaz, but to transform it into something you can experience.'
            ],
            pageTitle: 'VODKHAZ - IMMERSIVE DIGITAL EXPERIENCE'
        }

    ];

    function getProjectIdFromUrl() {
        // 1) Hash (e.g. #posters-beraria-h) – not sent to server, so it's never stripped by redirects
        const hash = typeof window.location.hash === 'string' ? window.location.hash : '';
        if (hash && hash.length > 1) {
            try {
                const value = decodeURIComponent(hash.slice(1).replace(/^project=/, '').trim());
                if (value) return value;
            } catch (e) {}
        }
        // 2) Query string (e.g. ?project=posters-beraria-h)
        const search = typeof window.location.search === 'string' ? window.location.search : '';
        if (search) {
            try {
                const params = new URLSearchParams(search);
                const id = params.get('project');
                if (id && typeof id === 'string') {
                    const trimmed = id.trim();
                    if (trimmed) return trimmed;
                }
            } catch (e) {}
        }
        // 3) Full URL as last resort
        try {
            const url = new URL(window.location.href);
            const id = url.searchParams.get('project');
            if (id && typeof id === 'string') {
                const trimmed = id.trim();
                if (trimmed) return trimmed;
            }
        } catch (e) {}
        return 'beraria-h';
    }

    /** Same for #caseVideo and #caseVideoSecondary: must match the block that sets project.videoSrc */
    function applyCaseVideoSource(videoEl, src) {
        if (!videoEl || !src) return;
        videoEl.src = src;
        videoEl.muted = true;
        videoEl.load();
        videoEl.play().catch(function () {});
    }

    function setMediaSource(mediaId, src, isImage, videoAttrs) {
        const current = document.getElementById(mediaId);
        if (!current || !src) return;
        const parent = current.parentNode;
        if (isImage) {
            const img = document.createElement('img');
            img.id = mediaId;
            img.className = current.classList.contains('case-video__media')
                ? 'case-video__media case-media-reveal'
                : 'case-media-strip__img case-media-reveal';
            img.src = src;
            img.alt = '';
            parent.replaceChild(img, current);
        } else {
            const video = document.createElement('video');
            video.id = mediaId;
            video.className = current.classList.contains('case-video__media')
                ? 'case-video__media'
                : 'case-media-strip__video';
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('tabindex', '-1');
            video.muted = true; /* required for autoplay */
            video.src = src;
            if (videoAttrs) Object.assign(video, videoAttrs);
            parent.replaceChild(video, current);
            video.load();
            var playOnce = function () {
                video.play().catch(function () {});
                video.removeEventListener('loadeddata', playOnce);
                video.removeEventListener('canplay', playOnce);
            };
            video.addEventListener('loadeddata', playOnce);
            video.addEventListener('canplay', playOnce);
            video.play().catch(function () {});
        }
    }

    /** Second block: image (posters) uses setMediaSource; real video uses in-place src like #caseVideo so playback stays reliable */
    function applySecondaryMedia(project) {
        const secondarySection = document.getElementById('experience-2');
        if (!project.videoSecondarySrc) {
            if (secondarySection) secondarySection.style.display = 'none';
            return;
        }
        if (secondarySection) secondarySection.style.display = '';
        if (project.videoSecondaryIsImage) {
            setMediaSource('caseVideoSecondary', project.videoSecondarySrc, true);
            return;
        }
        const el = document.getElementById('caseVideoSecondary');
        if (el && el.tagName === 'VIDEO') {
            applyCaseVideoSource(el, project.videoSecondarySrc);
            /* If secondary file fails (bad codec/corrupt), fall back to primary reel so the slot still plays */
            if (project.videoSrc && project.videoSecondarySrc !== project.videoSrc) {
                el.addEventListener(
                    'error',
                    function onSecondaryVideoError() {
                        el.removeEventListener('error', onSecondaryVideoError);
                        applyCaseVideoSource(el, project.videoSrc);
                    },
                    { once: true }
                );
            }
            return;
        }
        /* e.g. switched from posters project (img) back to a video case */
        setMediaSource('caseVideoSecondary', project.videoSecondarySrc, false);
    }

    function applyProject(project) {
        if (!project) return;

        document.body.dataset.project = project.id || '';

        // Document title
        if (project.pageTitle) {
            document.title = project.pageTitle;
        }

        const bgEl = document.getElementById('caseHeroBg');
        const titlePrimaryEl = document.getElementById('caseHeroTitlePrimary');
        const titleSecondaryEl = document.getElementById('caseHeroTitleSecondary');
        const locationEl = document.getElementById('caseHeroLocation');
        const servicesLabelEl = document.getElementById('caseServicesLabel');
        const servicesListEl = document.getElementById('caseServicesList');
        const storyHeadingEl = document.getElementById('caseStoryHeading');
        const storyPara1El = document.getElementById('caseStoryPara1');
        const storyPara2El = document.getElementById('caseStoryPara2');
        const storyPara3El = document.getElementById('caseStoryPara3');
        const videoEl = document.getElementById('caseVideo');
        const videoSecondaryEl = document.getElementById('caseVideoSecondary');
        const galleryTopEl = document.getElementById('caseGalleryTop');
        const galleryBottomLeftEl = document.getElementById('caseGalleryBottomLeft');
        const galleryBottomRightEl = document.getElementById('caseGalleryBottomRight');
        const galleryTop2El = document.getElementById('caseGalleryTop2');
        const galleryBottomLeft2El = document.getElementById('caseGalleryBottomLeft2');
        const galleryBottomRight2El = document.getElementById('caseGalleryBottomRight2');
        const stripImage1El = document.getElementById('caseStripImage1');
        const stripVideo1El = document.getElementById('caseStripVideo1');
        const nextLinkEl = document.getElementById('caseNextLink');
        const nextTitleEl = document.getElementById('caseNextTitle');
        const firstVideoSection = document.getElementById('experience');

        if (firstVideoSection) {
            firstVideoSection.style.display = project.id === 'posters-beraria-h' ? 'none' : '';
        }
        if (bgEl && project.heroImage) {
            bgEl.style.backgroundImage = `url('${project.heroImage}')`;
        }
        if (titlePrimaryEl && project.titlePrimary) {
            titlePrimaryEl.textContent = project.titlePrimary;
        }
        if (titleSecondaryEl) {
            if (Array.isArray(project.titleLines) && project.titleLines.length) {
                titleSecondaryEl.innerHTML = project.titleLines
                    .map((line, idx) => `<span class="case-hero__title-row case-hero__title-row--${idx + 1}">${line}</span>`)
                    .join('');
            } else if (project.titleSecondary) {
                titleSecondaryEl.textContent = project.titleSecondary;
            }
        }
        if (locationEl && project.location) {
            locationEl.textContent = project.location;
        }

        if (servicesLabelEl && project.servicesLabel) {
            servicesLabelEl.textContent = project.servicesLabel;
        }
        if (servicesListEl && Array.isArray(project.services)) {
            servicesListEl.innerHTML = project.services
                .map((item) => `<li>${item}</li>`)
                .join('');
        }
        if (storyHeadingEl && project.storyHeading) {
            storyHeadingEl.textContent = project.storyHeading;
        }
        if (storyPara1El && project.storyParagraphs && project.storyParagraphs[0]) {
            storyPara1El.textContent = project.storyParagraphs[0];
        }
        if (storyPara2El && project.storyParagraphs && project.storyParagraphs[1]) {
            storyPara2El.textContent = project.storyParagraphs[1];
        }
        if (storyPara3El) {
            if (project.storyParagraphs && project.storyParagraphs[2]) {
                storyPara3El.textContent = project.storyParagraphs[2];
                storyPara3El.style.display = '';
            } else {
                storyPara3El.textContent = '';
                storyPara3El.style.display = 'none';
            }
        }

        if (videoEl && project.videoSrc) {
            applyCaseVideoSource(videoEl, project.videoSrc);
        }
        applySecondaryMedia(project);
        if (galleryTopEl && project.galleryTop) {
            galleryTopEl.src = project.galleryTop;
        }
        if (galleryBottomLeftEl && project.galleryBottomLeft) {
            galleryBottomLeftEl.src = project.galleryBottomLeft;
        }
        if (galleryBottomRightEl && project.galleryBottomRight) {
            galleryBottomRightEl.src = project.galleryBottomRight;
        }
        if (galleryTop2El && project.galleryTop2) {
            galleryTop2El.src = project.galleryTop2;
        }
        if (galleryBottomLeft2El && project.galleryBottomLeft2) {
            galleryBottomLeft2El.src = project.galleryBottomLeft2;
        }
        if (galleryBottomRight2El && project.galleryBottomRight2) {
            galleryBottomRight2El.src = project.galleryBottomRight2;
        }
        if (stripImage1El && project.stripImage1) {
            stripImage1El.src = project.stripImage1;
        }
        if (stripVideo1El) {
            const stripVideoItem = stripVideo1El.closest('.case-media-strip__item');
            if (project.stripVideo1Src) {
                if (stripVideoItem) stripVideoItem.style.display = '';
                setMediaSource('caseStripVideo1', project.stripVideo1Src, !!project.stripVideo1IsImage);
            } else {
                if (stripVideoItem) stripVideoItem.style.display = 'none';
            }
        }
        if (nextLinkEl && project.nextProjectId) {
            const path = window.location.pathname || 'case-study.html';
            nextLinkEl.href = path + '#' + encodeURIComponent(project.nextProjectId);
        }
        if (nextTitleEl && project.nextProjectId) {
            nextTitleEl.textContent = 'Next project';
        }
    }

    function loadProjectFromUrl() {
        const id = getProjectIdFromUrl();
        const project = projects.find((p) => p.id === id) || projects[0];
        applyProject(project);
    }

    /**
     * Always start case study at the top (desktop + mobile): Lenis + browser scroll restoration
     * can otherwise leave the page mid-scroll when opening or switching projects.
     */
    function scrollCaseStudyToTop() {
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
    }

    var CASE_FROM_HOME_KEY = 'caseStudyOpenedFromHome';

    function initCaseStudyCloseFromHome() {
        var closeBtn = document.getElementById('caseStudyCloseBtn');
        if (!closeBtn) return;
        var fromHome = false;
        try {
            fromHome = sessionStorage.getItem(CASE_FROM_HOME_KEY) === '1';
        } catch (e) {}
        if (fromHome) {
            closeBtn.hidden = false;
            closeBtn.setAttribute('aria-hidden', 'false');
        }
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                sessionStorage.removeItem(CASE_FROM_HOME_KEY);
            } catch (err) {}
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        try {
            if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }
        } catch (e) {}

        loadProjectFromUrl();
        scrollCaseStudyToTop();
        requestAnimationFrame(function () {
            scrollCaseStudyToTop();
        });

        window.addEventListener('hashchange', function () {
            // Avoid double-running the delayed first-load text reveal + re-run hero stagger for new project
            try {
                if (typeof window.cancelCaseStudyTextRevealDelay === 'function') {
                    window.cancelCaseStudyTextRevealDelay();
                }
            } catch (e) {}
            loadProjectFromUrl();
            scrollCaseStudyToTop();
            requestAnimationFrame(function () {
                scrollCaseStudyToTop();
                try {
                    if (typeof window.initCaseStudyTextReveal === 'function') {
                        window.initCaseStudyTextReveal();
                    }
                } catch (e) {}
                setTimeout(function () {
                    try {
                        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                    } catch (e) {}
                }, 400);
            });
        });

        window.addEventListener('pageshow', function () {
            scrollCaseStudyToTop();
        });

        window.addEventListener('load', function () {
            scrollCaseStudyToTop();
        });

        initCaseStudyCloseFromHome();
    });
})();

