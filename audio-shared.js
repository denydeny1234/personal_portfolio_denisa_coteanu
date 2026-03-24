// Shared audio – persists across index and about pages
(function() {
    const AUDIO_ENABLED_KEY = 'siteAudioEnabled';
    const AUDIO_TIME_KEY = 'siteAudioTime';

    function init() {
        var audio = document.getElementById('siteAudio');
        var navBtn = document.getElementById('audioMuteBtn');
        if (!audio) return;

        // Restore playback position from sessionStorage (persists across page navigations)
        var storedTime = parseFloat(sessionStorage.getItem(AUDIO_TIME_KEY) || '0');
        if (!isNaN(storedTime) && storedTime > 0) {
            audio.currentTime = storedTime;
        }

        // Restore mute state from localStorage ('true' = user enabled site audio; 'false' = muted)
        var enabled = localStorage.getItem(AUDIO_ENABLED_KEY);
        if (enabled === 'false') {
            audio.muted = true;
        } else {
            audio.muted = false;
        }

        function isHomepageWithLoader() {
            try {
                var raw = (window.location.pathname || '').trim();
                if (!raw || raw === '/') return true;
                var seg = raw.split('/').filter(Boolean);
                var last = seg[seg.length - 1] || '';
                return last === 'index.html';
            } catch (e) {
                return false;
            }
        }

        function updateBtn() {
            if (navBtn) {
                navBtn.textContent = audio.muted ? 'Sound' : 'Mute';
                navBtn.setAttribute('aria-label', audio.muted ? 'Turn sound on' : 'Turn sound off');
            }
        }

        function toggle() {
            audio.muted = !audio.muted;
            localStorage.setItem(AUDIO_ENABLED_KEY, audio.muted ? 'false' : 'true');
            updateBtn();
        }

        function handleClick(e) {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        }

        function play() {
            audio.muted = false;
            localStorage.setItem(AUDIO_ENABLED_KEY, 'true');
            audio.play().catch(function() {});
            updateBtn();
        }

        if (navBtn) navBtn.addEventListener('click', handleClick);

        document.addEventListener('keydown', function(e) {
            if ((e.key === 'm' || e.key === 'M') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggle();
            }
        });

        updateBtn();

        window.siteAudio = {
            play: play,
            toggle: toggle,
            updateUI: updateBtn,
            audio: audio
        };

        // Persist playback position
        audio.addEventListener('timeupdate', function() {
            if (!audio.paused && !audio.seeking) {
                sessionStorage.setItem(AUDIO_TIME_KEY, String(audio.currentTime));
            }
        });

        window.addEventListener('beforeunload', function() {
            sessionStorage.setItem(AUDIO_TIME_KEY, String(audio.currentTime || 0));
        });

        // Auto-play when not muted:
        // - localStorage 'true': user enabled audio earlier (any page) — resume after e.g. about → index
        // - key not 'false' on subpages without the homepage loader: first-visit behavior (about / playground / case-study)
        // - homepage first visit: key not 'true' → stay paused until loader click (loader.js sets 'true')
        var path = window.location.pathname || '';
        var isAbout = /about\.html$/.test(path) || path.endsWith('/about');
        var isPlayground = /playground\.html$/.test(path) || path.includes('playground');
        var isCaseStudy = /case-study\.html$/.test(path) || path.includes('case-study');
        var isLoaderHome = isHomepageWithLoader();
        var shouldAutoplay = false;
        if (enabled === 'true') {
            shouldAutoplay = true;
        } else if (enabled !== 'false' && !isLoaderHome && (isAbout || isPlayground || isCaseStudy)) {
            shouldAutoplay = true;
        }
        if (!audio.muted && shouldAutoplay) {
            audio.play().catch(function() {});
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

/**
 * Wait until the window load event, then ensure <img> / <video> under `root` have loaded enough to show.
 * Used so the 3-book first screen stays until page media is ready (index loader + subpages).
 * @param {string} [rootSelector] — default `#pageTransitionWrap` or `document.body`
 * @returns {Promise<void>}
 */
(function () {
    var MEDIA_WAIT_MS = 20000;
    var PAGE_WAIT_MS = 45000;

    function waitForMediaInRoot(root) {
        if (!root) return Promise.resolve();
        var tasks = [];
        function withTimeout(p) {
            return Promise.race([
                p,
                new Promise(function (r) {
                    setTimeout(r, MEDIA_WAIT_MS);
                }),
            ]);
        }
        root.querySelectorAll('img[src]').forEach(function (img) {
            if (img.complete && img.naturalWidth > 0) return;
            tasks.push(
                withTimeout(
                    new Promise(function (resolve) {
                        img.addEventListener('load', resolve, { once: true });
                        img.addEventListener('error', resolve, { once: true });
                    })
                )
            );
        });
        root.querySelectorAll('video').forEach(function (v) {
            if (v.readyState >= 3) return;
            tasks.push(
                withTimeout(
                    new Promise(function (resolve) {
                        v.addEventListener('canplaythrough', resolve, { once: true });
                        v.addEventListener('loadeddata', resolve, { once: true });
                        v.addEventListener('error', resolve, { once: true });
                        try {
                            v.load();
                        } catch (e) {}
                    })
                )
            );
        });
        if (!tasks.length) return Promise.resolve();
        return Promise.all(tasks);
    }

    function waitForPageMediaReady(rootSelector) {
        return new Promise(function (resolve) {
            var root = rootSelector
                ? document.querySelector(rootSelector)
                : document.querySelector('#pageTransitionWrap') || document.body;
            var t = setTimeout(resolve, PAGE_WAIT_MS);
            function done() {
                clearTimeout(t);
                resolve();
            }
            function afterLoad() {
                waitForMediaInRoot(root)
                    .then(done)
                    .catch(done);
            }
            if (document.readyState === 'complete') {
                afterLoad();
            } else {
                window.addEventListener('load', afterLoad, { once: true });
            }
        });
    }

    window.waitForPageMediaReady = waitForPageMediaReady;
})();
