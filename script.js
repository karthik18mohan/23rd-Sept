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
      revealAll();
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

  window.addEventListener('error', revealAll);
  window.addEventListener('unhandledrejection', revealAll);

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


  let audioContext = null;

  const ensureAudioContext = async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
      try { await audioContext.resume(); } catch {}
    }
    return audioContext;
  };

  const toneOnContext = (ctx, frequency, endFrequency, duration = 0.12, gainValue = 0.065, delay = 0, type = 'sine') => {
    const startAt = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency || frequency), startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.04);
  };

  const playSound = kind => {
    ensureAudioContext().then(ctx => {
      if (!ctx || ctx.state !== 'running') return;
      try {
        if (kind === 'hold') {
          toneOnContext(ctx, 190, 330, 0.18, 0.05, 0, 'sine');
        } else if (kind === 'open') {
          toneOnContext(ctx, 420, 620, 0.16, 0.075);
          toneOnContext(ctx, 620, 880, 0.18, 0.065, 0.08);
          toneOnContext(ctx, 860, 1180, 0.22, 0.055, 0.16);
        } else if (kind === 'sparkle') {
          toneOnContext(ctx, 700, 1300, 0.13, 0.06);
          toneOnContext(ctx, 1050, 1700, 0.12, 0.045, 0.065);
        } else if (kind === 'heart') {
          toneOnContext(ctx, 500, 760, 0.11, 0.055);
          toneOnContext(ctx, 720, 1040, 0.13, 0.045, 0.055);
        } else if (kind === 'paper') {
          toneOnContext(ctx, 240, 360, 0.09, 0.035, 0, 'triangle');
          toneOnContext(ctx, 360, 520, 0.12, 0.032, 0.07, 'triangle');
        } else {
          toneOnContext(ctx, 380, 520, 0.08, 0.04);
        }
      } catch {}
    }).catch(() => {});
  };

  // Prime Web Audio on the first real user gesture. This is especially
  // important on iPhone/Safari, which keeps AudioContext suspended otherwise.
  const unlockAudio = () => { ensureAudioContext().catch(() => {}); };
  document.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  document.addEventListener('touchstart', unlockAudio, { once: true, capture: true, passive: true });

  const createIntro = () => {
    const btn = $('#holdButton');
    const intro = $('#intro');
    let start = 0;
    let frame = null;
    let completed = false;
    let activePointerId = null;
    const duration = 1500;

    const reset = () => {
      cancelAnimationFrame(frame);
      start = 0;
      btn.style.setProperty('--hold', '0%');
    };

    const tick = t => {
      if (!start) start = t;
      const pct = Math.min(100, ((t - start) / duration) * 100);
      btn.style.setProperty('--hold', `${pct}%`);
      if (pct >= 100 && !completed) {
        completed = true;
        $('.hold-heart', btn).textContent = '♥';
        playSound('open');
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
      playSound('hold');
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
    root.innerHTML = data.tinyThings.map((_, i) => `<button class="reason-heart" data-reason="${i}" aria-label="Tiny thing ${i + 1}">♥</button>`).join('');
    const modal = $('#reasonModal');
    $$('.reason-heart', root).forEach(btn => btn.addEventListener('click', () => {
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
    range.addEventListener('input', sync);
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

  const loveMessageForCount = count => {
    const messages = [
      'Find the first glowing heart ♥',
      'I love you ❤️',
      'I love youuu ❤️',
      'I love youuuu ❤️',
      'I love youuuuu ❤️',
      'I love youuuuuu ∞ ❤️'
    ];
    return messages[Math.max(0, Math.min(5, count))];
  };

  const setupHiddenHearts = () => {
    const targets = ['things-i-know', 'camera-roll', 'messages', 'changed', 'museum'];
    let savedHearts = [];
    try { savedHearts = JSON.parse(safeStorageGet('anniv-hearts-v3', '[]')); } catch {}
    const found = new Set(Array.isArray(savedHearts) ? savedHearts : []);
    const template = $('#hiddenHeartTemplate');
    const score = $('#heartScore');
    const message = $('#secretMessage');

    targets.forEach((id, i) => {
      if (found.has(i)) return;
      const section = document.getElementById(id);
      if (!section) return;

      const heart = template.content.firstElementChild.cloneNode(true);
      heart.dataset.index = i;
      heart.style.top = `${16 + ((i * 19) % 62)}%`;
      heart.style[i % 2 ? 'left' : 'right'] = `${4 + i * 2}%`;
      section.appendChild(heart);

      heart.addEventListener('click', () => {
        if (heart.classList.contains('collecting')) return;
        playSound('sparkle');
        found.add(i);
        safeStorageSet('anniv-hearts-v3', JSON.stringify([...found]));
        score.textContent = found.size;
        message.textContent = loveMessageForCount(found.size);
        createHeartSparkBurst(heart);
        heart.classList.add('collecting');
        setTimeout(() => heart.remove(), 920);

        if (found.size === targets.length) {
          setTimeout(() => {
            message.textContent = loveMessageForCount(5);
            playSound('open');
          }, 1200);
        }
      });
    });

    score.textContent = found.size;
    message.textContent = loveMessageForCount(found.size);
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
    const revealTargets = $('.reveal,.future-card');
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(el => el.classList.add('visible'));
    } else {
      const io = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      }), { threshold: .12, rootMargin: '0px 0px -7%' });
      revealTargets.forEach(el => io.observe(el));
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
