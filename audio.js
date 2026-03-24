// audio.js – sound toggle using muted property (more reliable than pause/play)

const AUDIO_ENABLED_KEY = 'siteAudioEnabled';
const AUDIO_TIME_KEY = 'siteAudioTime';

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('siteAudio');
  const wrap = document.getElementById('audioMuteWrap');
  const navBtn = document.getElementById('audioMuteBtn');
  if (!audio) return;

  const storedTime = parseFloat(sessionStorage.getItem(AUDIO_TIME_KEY) || '0');
  if (!isNaN(storedTime) && storedTime > 0) {
    audio.currentTime = storedTime;
  }

  const label = () => (audio.muted ? 'Sound' : 'Mute');

  const updateAll = () => {
    const text = label();
    if (navBtn) {
      navBtn.textContent = text;
      navBtn.setAttribute('aria-label', audio.muted ? 'Turn sound on' : 'Turn sound off');
    }
    if (floatBtn) {
      floatBtn.textContent = text;
    }
  };

  const play = () => {
    audio.muted = false;
    audio.play().catch(() => {});
    localStorage.setItem(AUDIO_ENABLED_KEY, 'true');
  };
  const mute = () => {
    audio.muted = true;
    localStorage.setItem(AUDIO_ENABLED_KEY, 'false');
  };

  const toggle = () => {
    audio.muted = !audio.muted;
    localStorage.setItem(AUDIO_ENABLED_KEY, audio.muted ? 'false' : 'true');
    updateAll();
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  // Floating button (always visible, bottom-right)
  let floatBtn = null;
  if (wrap) {
    floatBtn = document.createElement('button');
    floatBtn.type = 'button';
    floatBtn.className = 'audio-mute-btn';
    floatBtn.setAttribute('aria-label', 'Toggle sound');
    floatBtn.addEventListener('click', handleClick);
    wrap.appendChild(floatBtn);
    wrap.removeAttribute('aria-hidden');
  }

  // Nav button
  if (navBtn) navBtn.addEventListener('click', handleClick);

  // Keyboard: M toggles mute
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      toggle();
    }
  });

  updateAll();
  window.siteAudio = { play, mute, toggle, audio, updateUI: updateAll };

  audio.addEventListener('timeupdate', () => {
    if (!audio.paused && !audio.seeking) {
      sessionStorage.setItem(AUDIO_TIME_KEY, String(audio.currentTime));
    }
  });

  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem(AUDIO_TIME_KEY, String(audio.currentTime || 0));
  });
});
