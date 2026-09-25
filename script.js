(() => {
  const data = window.ANNIVERSARY;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const revealAll = () => {
    try {
      $$('.reveal,.future-card').forEach(el => el.classList.add('visible'));
      document.documentElement.classList.add('js-fallback');
    } catch {}
  };

  const safeRun = (name, fn) => {
    try {
      return fn();
    } catch (error) {
      console.error(`[anniversary] ${name} failed`, error);
      return null;
    }
  };

  const safeStorageGet = (key, fallback = '[]') => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };

  const safeStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };

  const setText = (selector, value) => {
    const el = $(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  const setNames = () => {
    $$('[data-partner]').forEach(el => { el.textContent = data.partnerName; });
    $$('[data-self]').forEach(el => { el.textContent = data.selfName; });
    document.title = `5 Years of ${data.selfName} + ${data.partnerName} ❤️`;
    setText('#openingTiny', data.opening.tinyLine);
    setText('#openingHello', data.opening.hello);
    setText('#openingLine1', data.opening.line1);
    setText('#openingLine2', data.opening.line2);
    setText('#coverCaption', data.cover.caption);
    setText('#coverTitle', data.cover.title);
    setText('#coverAfter', data.cover.after);
    setText('#finalHeadline', data.finale.headline);
    setText('#finalSubline', data.finale.subline);
    setText('#epilogueText', data.finale.ending);
    setText('#letterGreeting', data.letterGreeting || `Hiii ${data.partnerName},`);
  };

  const photoFallback = (el, src, label) => {
    if (!el) return;
    if (!src) {
      el.classList.add('photo-missing');
      const span = $('span', el);
      if (span) span.textContent = label || 'add photo';
      return;
    }
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      el.classList.remove('photo-missing');
      const span = $('span', el);
      if (span) span.style.display = 'none';
    };
    img.onerror = () => {
      el.classList.add('photo-missing');
      const span = $('span', el);
      if (span) span.textContent = label || src.split('/').pop();
    };
    img.src = src;
  };

  const burstHearts = (root, count = 30) => {
    root.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = ['♥', '♡', '✦', '💕'][i % 4];
      const angle = (Math.PI * 2 * i) / count;
      const dist = 140 + Math.random() * 360;
      s.style.setProperty('--x', `${Math.cos(angle) * dist}px`);
      s.style.setProperty('--y', `${Math.sin(angle) * dist}px`);
      s.style.setProperty('--r', `${Math.random() * 180 - 90}deg`);
      s.style.color = i % 3 === 0 ? '#fff' : '#f5a8ba';
      root.appendChild(s);
    }
  };


  /* =========================================================
     MEDIA-CHANNEL SOUND ENGINE
     Uses real HTMLAudioElement playback instead of Web Audio for the
     important effects. On iPhone this follows the media channel rather
     than the Ring/Silent channel.
     ========================================================= */

  const MEDIA_SAMPLE_RATE = 24000;

  const encodeWavUrl = samples => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeText = (offset, text) => {
      for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };

    writeText(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, MEDIA_SAMPLE_RATE, true);
    view.setUint32(28, MEDIA_SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    for (let i = 0; i < samples.length; i++) {
      const value = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
    }

    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  };

  const makeSweepUrl = (fromHz, toHz, duration, startAmp, endAmp) => {
    const count = Math.floor(duration * MEDIA_SAMPLE_RATE);
    const samples = new Float32Array(count);
    let phase = 0;

    for (let i = 0; i < count; i++) {
      const p = i / Math.max(1, count - 1);
      const freq = fromHz * Math.pow(toHz / fromHz, p);
      phase += (Math.PI * 2 * freq) / MEDIA_SAMPLE_RATE;

      const attack = Math.min(1, p / 0.025);
      const release = Math.min(1, (1 - p) / 0.035);
      const amp = (startAmp + (endAmp - startAmp) * p) * attack * release;
      samples[i] = Math.sin(phase) * amp;
    }

    return encodeWavUrl(samples);
  };

  const makeChimeUrl = (tones, duration = 0.72) => {
    const count = Math.floor(duration * MEDIA_SAMPLE_RATE);
    const samples = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / MEDIA_SAMPLE_RATE;
      let value = 0;

      tones.forEach(({ at, hz, amp = 0.55, decay = 6.5 }) => {
        if (t < at) return;
        const local = t - at;
        const attack = Math.min(1, local / 0.012);
        const envelope = attack * Math.exp(-decay * local);
        value += Math.sin(Math.PI * 2 * hz * local) * amp * envelope;
        value += Math.sin(Math.PI * 4 * hz * local) * amp * 0.16 * envelope;
      });

      samples[i] = Math.max(-0.95, Math.min(0.95, value));
    }

    return encodeWavUrl(samples);
  };

  const mediaUrls = {
    hold: makeSweepUrl(115, 900, 1.55, 0.14, 0.72),
    open: makeChimeUrl([
      { at: 0.00, hz: 440, amp: 0.50 },
      { at: 0.13, hz: 660, amp: 0.54 },
      { at: 0.29, hz: 990, amp: 0.58 }
    ], 0.82),
    sparkle: makeChimeUrl([
      { at: 0.00, hz: 820, amp: 0.42, decay: 11 },
      { at: 0.055, hz: 1260, amp: 0.40, decay: 12 }
    ], 0.34),
    heart: makeChimeUrl([
      { at: 0.00, hz: 520, amp: 0.46, decay: 12 },
      { at: 0.07, hz: 760, amp: 0.42, decay: 13 }
    ], 0.30),
    paper: makeChimeUrl([
      { at: 0.00, hz: 260, amp: 0.28, decay: 14 },
      { at: 0.07, hz: 390, amp: 0.24, decay: 15 }
    ], 0.30),
    tap: makeChimeUrl([
      { at: 0.00, hz: 420, amp: 0.30, decay: 18 }
    ], 0.18)
  };

  const mediaSounds = Object.fromEntries(
    Object.entries(mediaUrls).map(([kind, src]) => {
      const audio = document.createElement('audio');
      audio.src = src;
      audio.preload = 'auto';
      audio.volume = 1;
      audio.muted = false;
      audio.setAttribute('playsinline', '');
      audio.setAttribute('webkit-playsinline', '');
      audio.setAttribute('aria-hidden', 'true');
      audio.tabIndex = -1;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      try { audio.load(); } catch {}
      return [kind, audio];
    })
  );

  const playMediaSound = kind => {
    const audio = mediaSounds[kind];
    if (!audio) return false;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  };

  const playSound = kind => playMediaSound(kind === 'hold' ? 'tap' : kind);

  const playOpeningChime = () => {
    const audio = mediaSounds.hold;
    if (!audio) return playMediaSound('open');

    try {
      audio.pause();
      audio.src = mediaUrls.open;
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;

      const restore = () => {
        try {
          audio.removeEventListener('ended', restore);
          audio.pause();
          audio.src = mediaUrls.hold;
          audio.load();
        } catch {}
      };

      audio.addEventListener('ended', restore, { once: true });
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          restore();
          playMediaSound('open');
        });
      }
      return true;
    } catch {
      playMediaSound('open');
      return false;
    }
  };

  const haptic = kind => {
    const patterns = {
      tick: 10,
      light: 14,
      medium: 24,
      success: [18, 28, 38],
      complete: [20, 20, 28, 22, 55]
    };

    try {
      if (typeof navigator.vibrate === 'function') {
        return navigator.vibrate(patterns[kind] || patterns.light);
      }
    } catch {}
    return false;
  };

  let activeHoldMedia = null;

  const stopHoldRampSound = () => {
    if (!activeHoldMedia) return;
    try {
      activeHoldMedia.pause();
      activeHoldMedia.currentTime = 0;
    } catch {}
    activeHoldMedia = null;
  };

  const startHoldRampSound = () => {
    stopHoldRampSound();
    const audio = mediaSounds.hold;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.muted = false;
      activeHoldMedia = audio;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          if (activeHoldMedia === audio) activeHoldMedia = null;
        });
      }
    } catch {
      activeHoldMedia = null;
    }
  };

  const unlockAudio = () => {
    Object.values(mediaSounds).forEach(audio => {
      try { audio.load(); } catch {}
    });
  };

  document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  document.addEventListener('touchstart', unlockAudio, { once: true, capture: true, passive: true });

  const createIntro = () => {
    const btn = $('#holdButton');
    const intro = $('#intro');
    let start = 0;
    let frame = null;
    let completed = false;
    let activePointerId = null;
    let hapticStep = 0;
    const duration = 1500;

    const reset = () => {
      cancelAnimationFrame(frame);
      stopHoldRampSound();
      hapticStep = 0;
      start = 0;
      btn.style.setProperty('--hold', '0%');
    };

    const tick = t => {
      if (!start) start = t;
      const pct = Math.min(100, ((t - start) / duration) * 100);
      btn.style.setProperty('--hold', `${pct}%`);
      btn.style.setProperty('--hold-scale', String(1 + (pct / 100) * 0.18));
      btn.style.setProperty('--hold-glow', `${0.25 + (pct / 100) * 0.75}`);
      btn.style.setProperty('--hold-glow-px', `${10 + (pct / 100) * 18}px`);

      const nextStep = pct >= 75 ? 3 : pct >= 50 ? 2 : pct >= 25 ? 1 : 0;
      if (nextStep > hapticStep) {
        hapticStep = nextStep;
        haptic('tick');
      }

      if (pct >= 100 && !completed) {
        completed = true;
        stopHoldRampSound();
        haptic('complete');
        $('.hold-heart', btn).textContent = '♥';
        playOpeningChime();
        burstHearts($('#burst'), 36);
        setTimeout(() => {
          intro.classList.add('opened');
          document.body.classList.remove('locked');
          window.scrollTo({ top: 0 });
        }, 420);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const down = e => {
      if (completed) return;
      e.preventDefault();
      hapticStep = 0;
      haptic('light');
      startHoldRampSound();
      if (e.pointerId !== undefined) {
        activePointerId = e.pointerId;
        try { btn.setPointerCapture(e.pointerId); } catch {}
      }
      cancelAnimationFrame(frame);
      start = 0;
      frame = requestAnimationFrame(tick);
    };

    const up = e => {
      if (e?.pointerId !== undefined && activePointerId !== null && e.pointerId !== activePointerId) return;
      if (e?.pointerId !== undefined) {
        try { if (btn.hasPointerCapture(e.pointerId)) btn.releasePointerCapture(e.pointerId); } catch {}
      }
      activePointerId = null;
      if (!completed) reset();
    };

    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    ['contextmenu', 'dragstart', 'selectstart'].forEach(type => btn.addEventListener(type, e => e.preventDefault()));
    btn.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !completed) {
        e.preventDefault();
        cancelAnimationFrame(frame);
        start = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    btn.addEventListener('keyup', e => {
      if (e.key === 'Enter' || e.key === ' ') up(e);
    });
  };

  const buildCounter = () => {
    const start = new Date(data.anniversaryDate);
    const root = $('#loveCounter');
    const units = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
    root.innerHTML = units.map(unit => `<div class="counter-unit"><strong data-unit="${unit}">0</strong><span>${unit}</span></div>`).join('');

    const update = () => {
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      const anniversaryThisYear = new Date(start);
      anniversaryThisYear.setFullYear(now.getFullYear());
      if (now < anniversaryThisYear) years--;

      const afterYears = new Date(start);
      afterYears.setFullYear(start.getFullYear() + years);
      let months = (now.getFullYear() - afterYears.getFullYear()) * 12 + now.getMonth() - afterYears.getMonth();
      const afterMonths = new Date(afterYears);
      afterMonths.setMonth(afterYears.getMonth() + months);
      if (afterMonths > now) months--;

      const cursor = new Date(afterYears);
      cursor.setMonth(afterYears.getMonth() + months);
      let diff = Math.max(0, now - cursor);
      const days = Math.floor(diff / 86400000);
      diff %= 86400000;
      const hours = Math.floor(diff / 3600000);
      diff %= 3600000;
      const minutes = Math.floor(diff / 60000);
      diff %= 60000;
      const seconds = Math.floor(diff / 1000);

      const values = { years, months, days, hours, minutes, seconds };
      Object.entries(values).forEach(([key, value]) => {
        const el = $(`[data-unit="${key}"]`);
        if (el) el.textContent = String(value).padStart(2, '0');
      });
    };

    update();
    setInterval(update, 1000);
  };

  const buildUsMontage = () => {
    const root = $('#usMontage');
    root.innerHTML = '';
    data.thisIsUs.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = `us-card reveal us-card-${(i % 3) + 1}`;
      card.innerHTML = `
        <div class="photo us-photo"><span>${String(i + 1).padStart(2, '0')} · add photo</span></div>
        <div class="us-copy"><h3>${item.title}</h3><p>${item.text}</p></div>`;
      root.appendChild(card);
      photoFallback($('.us-photo', card), item.photo, `01-us-${String(i + 1).padStart(2, '0')}.jpg`);
    });
  };

  const buildKnowGrid = () => {
    const root = $('#knowGrid');
    root.innerHTML = data.thingsIKnow.map((item, i) => `
      <article class="know-card reveal" style="--delay:${i * 60}ms">
        <span class="know-emoji">${item.emoji}</span>
        <span class="know-label">${item.label}</span>
        <strong>${item.value}</strong>
      </article>`).join('');
  };

  const buildCameraRoll = () => {
    const root = $('#cameraGroups');
    root.innerHTML = '';
    data.cameraRoll.forEach((group, groupIndex) => {
      const section = document.createElement('div');
      section.className = 'camera-group';
      section.innerHTML = `
        <div class="camera-heading reveal"><span>0${groupIndex + 1}</span><div><h3>${group.title}</h3><p>${group.caption}</p></div></div>
        <div class="camera-row"></div>`;
      root.appendChild(section);
      const row = $('.camera-row', section);
      group.photos.forEach((src, i) => {
        const frame = document.createElement('div');
        frame.className = 'photo camera-photo reveal';
        frame.style.setProperty('--tilt', `${[-2.4, 1.7, -1.1, 2][i % 4]}deg`);
        frame.innerHTML = `<span>${src.split('/').pop()}</span>`;
        row.appendChild(frame);
        photoFallback(frame, src, src.split('/').pop());
      });
    });
  };

  const buildMessages = () => {
    const root = $('#messageStrip');
    root.innerHTML = '';
    data.messages.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'message-card reveal';
      card.style.setProperty('--r', `${[-3, 2, -1, 2.5][i % 4]}deg`);
      card.innerHTML = `<div class="photo message-shot"><span>${item.image.split('/').pop()}</span></div><p>${item.caption}</p>`;
      root.appendChild(card);
      photoFallback($('.message-shot', card), item.image, item.image.split('/').pop());
    });
  };

  const buildChanged = () => {
    $('#changedLines').innerHTML = data.whatChanged.map((line, i) => `
      <p class="changed-line reveal ${i === data.whatChanged.length - 1 ? 'changed-final' : ''}">${line}</p>`).join('');
  };

  const buildQuiz = () => {
    const root = $('#quizCard');
    let index = 0;

    const render = () => {
      if (index >= data.quiz.length) {
        root.innerHTML = `<div class="quiz-done"><span>RESULT</span><h3>Still us. Still ridiculous. Still my favourite. ❤️</h3><button type="button" id="quizAgain">play again</button></div>`;
        $('#quizAgain').addEventListener('click', () => { index = 0; render(); });
        return;
      }
      const q = data.quiz[index];
      root.innerHTML = `
        <div class="quiz-progress"><span style="width:${((index + 1) / data.quiz.length) * 100}%"></span></div>
        <span class="quiz-count">${index + 1} / ${data.quiz.length}</span>
        <h3>${q.question}</h3>
        <div class="quiz-choices">
          ${q.choices.map((choice, choiceIndex) => `<button type="button" data-choice="${choiceIndex}">${choice}</button>`).join('')}
        </div>
        <div class="quiz-answer" id="quizAnswer"></div>`;
      $$('.quiz-choices button', root).forEach(btn => btn.addEventListener('click', () => {
        haptic('light');
        playSound('tap');
        $$('.quiz-choices button', root).forEach(b => { b.disabled = true; });
        $('#quizAnswer').textContent = q.answer;
        setTimeout(() => { index++; render(); }, 1500);
      }));
    };

    render();
  };

  const buildTinyThings = () => {
    const root = $('#reasonGrid');
    root.innerHTML = data.tinyThings.map((_, i) => `<button class="reason-heart reveal" data-reason="${i}" aria-label="Tiny thing ${i + 1}" style="--i:${i}">♥</button>`).join('');
    const modal = $('#reasonModal');
    $$('.reason-heart', root).forEach(btn => btn.addEventListener('click', () => {
      haptic('light');
      playSound('heart');
      btn.classList.remove('heart-tapped');
      void btn.offsetWidth;
      btn.classList.add('heart-tapped');
      const i = Number(btn.dataset.reason);
      $('#reasonNumber').textContent = `Tiny thing ${String(i + 1).padStart(2, '0')} / ${data.tinyThings.length}`;
      $('#reasonText').textContent = data.tinyThings[i];
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }));
    const close = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };
    $('#reasonClose').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  };

  const buildMuseum = () => {
    const root = $('#museumGrid');
    root.innerHTML = '';
    data.museum.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'museum-card reveal';
      card.innerHTML = `
        <div class="museum-number">EXHIBIT ${String(i + 1).padStart(2, '0')}</div>
        <div class="photo museum-photo"><span>${item.image.split('/').pop()}</span></div>
        <div class="museum-copy"><span class="museum-icon">${item.icon}</span><h3>${item.title}</h3><p>${item.text}</p></div>`;
      root.appendChild(card);
      photoFallback($('.museum-photo', card), item.image, item.image.split('/').pop());
    });
  };

  const setupCompare = () => {
    photoFallback($('#thenPhoto'), data.thenNow.then, '07-then.jpg');
    photoFallback($('#nowPhoto'), data.thenNow.now, '07-now.jpg');
    const range = $('#compareRange');
    const cover = $('#compareNew');
    const divider = $('#compareDivider');
    const sync = () => {
      cover.style.width = `${range.value}%`;
      divider.style.left = `${range.value}%`;
    };
    let lastHapticBucket = -1;
    range.addEventListener('input', () => {
      sync();
      const bucket = Math.round(Number(range.value) / 25);
      if (bucket !== lastHapticBucket) {
        lastHapticBucket = bucket;
        haptic('tick');
      }
    });
    sync();
  };


  const createHeartSparkBurst = heart => {
    const symbols = ['✦', '✧', '⋆', '♡'];
    for (let i = 0; i < 14; i++) {
      const spark = document.createElement('span');
      spark.className = 'collect-spark';
      spark.textContent = symbols[i % symbols.length];
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() * 0.22 - 0.11);
      const distance = 48 + Math.random() * 62;
      spark.style.setProperty('--sx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--sy', `${Math.sin(angle) * distance}px`);
      spark.style.setProperty('--sr', `${Math.random() * 220 - 110}deg`);
      spark.style.setProperty('--sd', `${Math.random() * 90}ms`);
      heart.appendChild(spark);
    }
  };

  const loveMessages = [
    'I love you ❤️',
    'I love youuu ❤️',
    'I love youuuu ❤️',
    'I love youuuuu ❤️',
    'I love youuuuuu ∞ ❤️'
  ];

  const renderLoveMessages = (root, count) => {
    if (!root) return;
    if (count <= 0) {
      root.innerHTML = '<span class="love-prompt">Find the first glowing heart ♥</span>';
      return;
    }

    root.innerHTML = loveMessages
      .slice(0, Math.min(5, count))
      .map((line, index) => `<div class="love-line" style="--love-delay:${index * 70}ms">${line}</div>`)
      .join('');
  };

  const setupHiddenHearts = () => {
    const targets = ['things-i-know', 'camera-roll', 'messages', 'changed', 'museum'];
    const found = new Set();
    const template = $('#hiddenHeartTemplate');
    const score = $('#heartScore');
    const message = $('#secretMessage');

    renderLoveMessages(message, 0);
    score.textContent = '0';

    targets.forEach((id, i) => {
      const section = document.getElementById(id);
      if (!section) return;

      const heart = template.content.firstElementChild.cloneNode(true);
      heart.dataset.index = i;
      heart.style.top = `${16 + ((i * 19) % 62)}%`;
      heart.style[i % 2 ? 'left' : 'right'] = `${4 + i * 2}%`;
      section.appendChild(heart);

      heart.addEventListener('click', () => {
        if (heart.classList.contains('collecting') || found.has(i)) return;

        haptic('success');
        playSound('sparkle');
        found.add(i);
        score.textContent = String(found.size);
        renderLoveMessages(message, found.size);

        createHeartSparkBurst(heart);
        heart.classList.add('collecting');
        setTimeout(() => heart.remove(), 920);

        if (found.size === targets.length) {
          setTimeout(() => playSound('open'), 720);
        }
      });
    });
  };

  const buildFuture = () => {
    $('#futurePolaroids').innerHTML = data.future.map((text, i) => `
      <div class="future-card future-text-card" style="--r:${[-5, 3, -2, 4, -3][i % 5]}deg;--delay:${i * 120}ms">
        <span class="future-number">0${i + 1}</span>
        <p>${text}</p>
      </div>`).join('');
  };

  const buildLetter = () => {
    $('#letterBody').innerHTML = data.letter.map(p => `<p>${p}</p>`).join('');
    const env = $('#envelope');
    const letterSection = $('#letter');

    const closeLetter = () => {
      if (!env.classList.contains('open')) return;
      env.classList.remove('open');
      env.setAttribute('aria-expanded', 'false');
    };

    env.addEventListener('click', () => {
      haptic('medium');
      playSound('paper');
      const open = env.classList.toggle('open');
      env.setAttribute('aria-expanded', String(open));
    });

    if ('IntersectionObserver' in window && letterSection) {
      const letterObserver = new IntersectionObserver(entries => {
        const entry = entries[0];
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) closeLetter();
      }, { threshold: [0, 0.35, 0.7] });
      letterObserver.observe(letterSection);
    } else {
      addEventListener('scroll', () => {
        const rect = letterSection?.getBoundingClientRect();
        if (!rect || rect.bottom < innerHeight * .25 || rect.top > innerHeight * .75) closeLetter();
      }, { passive: true });
    }
  };

  const setupFinale = () => {
    photoFallback($('#finaleBg'), data.finale.photo, '08-finale.jpg');
    const epi = $('#epilogue');
    $('#chapterSix').addEventListener('click', () => {
      haptic('success');
      playSound('open');
      burstHearts($('#confetti'), 48);
      setTimeout(() => {
        epi.classList.add('open');
        epi.setAttribute('aria-hidden', 'false');
      }, 500);
    });
    $('#closeEpilogue').addEventListener('click', () => {
      epi.classList.remove('open');
      epi.setAttribute('aria-hidden', 'true');
    });
  };

  const setupAmbientMotion = () => {
    const floating = $$('.us-card,.know-card,.camera-photo,.message-card,.museum-card,.future-card');
    if (!floating.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    const update = () => {
      const vh = innerHeight || 800;
      floating.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = (center - vh / 2) / vh;
        const amount = Math.max(-1, Math.min(1, distance)) * (5 + (i % 3) * 2);
        el.style.setProperty('--ambient-y', `${amount.toFixed(1)}px`);
      });
      ticking = false;
    };
    addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  };

  const observers = () => {
    const revealTargets = [...document.querySelectorAll('.reveal,.future-card')];
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(el => el.classList.add('visible'));
    } else {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        const showing = entry.isIntersecting && entry.intersectionRatio >= 0.08;
        entry.target.classList.toggle('visible', showing);

        if (!showing && entry.boundingClientRect.bottom < 0) {
          entry.target.classList.add('exit-up');
        } else {
          entry.target.classList.remove('exit-up');
        }
      }), {
        threshold: [0, 0.08, 0.18, 0.35],
        rootMargin: '4% 0px -4% 0px'
      });

      revealTargets.forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${(index % 6) * 35}ms`);
        io.observe(el);
      });
    }

    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? (scrollY / max) * 100 : 0;
      $('#progressBar').style.width = `${pct}%`;
    }, { passive: true });
  };

  const heartTrail = () => {
    if (matchMedia('(pointer: coarse)').matches) return;
    let last = 0;
    addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last < 80) return;
      last = now;
      const h = document.createElement('span');
      h.className = 'trail-heart';
      h.textContent = Math.random() > .4 ? '♥' : '✦';
      h.style.left = `${e.clientX}px`;
      h.style.top = `${e.clientY}px`;
      $('#heartTrail').appendChild(h);
      setTimeout(() => h.remove(), 950);
    });
  };

  safeRun('names', setNames);
  safeRun('cover photo', () => photoFallback($('#coverPhoto'), data.cover.photo, '00-cover.jpg'));
  safeRun('intro', createIntro);
  safeRun('counter', buildCounter);
  safeRun('this is us', buildUsMontage);
  safeRun('things I know', buildKnowGrid);
  safeRun('camera roll', buildCameraRoll);
  safeRun('messages', buildMessages);
  safeRun('what changed', buildChanged);
  safeRun('quiz', buildQuiz);
  safeRun('tiny things', buildTinyThings);
  safeRun('museum', buildMuseum);
  safeRun('compare', setupCompare);
  safeRun('hidden hearts', setupHiddenHearts);
  safeRun('future', buildFuture);
  safeRun('letter', buildLetter);
  safeRun('finale', setupFinale);
  safeRun('observers', observers);
  safeRun('ambient motion', setupAmbientMotion);
  safeRun('heart trail', heartTrail);
})();
