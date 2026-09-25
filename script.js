(() => {
  const data = window.ANNIVERSARY;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

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

  const getAudioContext = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  };

  const tone = (frequency, endFrequency, duration = 0.12, gainValue = 0.035, delay = 0, type = 'sine') => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const startAt = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency || frequency), startAt + duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  };

  const playSound = kind => {
    try {
      if (kind === 'hold') {
        tone(180, 260, 0.16, 0.018, 0, 'sine');
      } else if (kind === 'open') {
        tone(420, 560, 0.15, 0.035);
        tone(620, 760, 0.16, 0.03, 0.08);
        tone(820, 1040, 0.2, 0.028, 0.16);
      } else if (kind === 'sparkle') {
        tone(650, 1120, 0.13, 0.028);
        tone(980, 1480, 0.11, 0.018, 0.07);
      } else if (kind === 'heart') {
        tone(480, 690, 0.1, 0.022);
        tone(690, 900, 0.12, 0.018, 0.055);
      } else if (kind === 'paper') {
        tone(260, 340, 0.08, 0.012, 0, 'triangle');
        tone(350, 470, 0.11, 0.012, 0.07, 'triangle');
      } else {
        tone(360, 450, 0.07, 0.014);
      }
    } catch {}
  };

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
      $('.quiz-choices button', root).forEach(btn => btn.addEventListener('click', () => {
        playSound('tap');
        $('.quiz-choices button', root).forEach(b => { b.disabled = true; });
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
    $('.reason-heart', root).forEach(btn => btn.addEventListener('click', () => {
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

  const setupHiddenHearts = () => {
    const targets = ['things-i-know', 'camera-roll', 'messages', 'changed', 'museum'];
    const found = new Set(JSON.parse(localStorage.getItem('anniv-hearts-v3') || '[]'));
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
        localStorage.setItem('anniv-hearts-v3', JSON.stringify([...found]));
        score.textContent = found.size;
        message.textContent = `♥ ${data.hiddenSecrets[i]}`;
        heart.classList.add('collecting');
        setTimeout(() => heart.remove(), 720);

        if (found.size === targets.length) {
          setTimeout(() => {
            message.textContent = 'You found all five. Of course you did. 🥹❤️';
            playSound('open');
          }, 1200);
        }
      });
    });

    score.textContent = found.size;
    if (found.size === targets.length) message.textContent = 'You found all five. Of course you did. 🥹❤️';
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
    env.addEventListener('click', () => {
      playSound('paper');
      const open = env.classList.toggle('open');
      env.setAttribute('aria-expanded', String(open));
    });
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

  const observers = () => {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    }), { threshold: .12, rootMargin: '0px 0px -7%' });

    $$('.reveal,.future-card').forEach(el => io.observe(el));

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

  setNames();
  photoFallback($('#coverPhoto'), data.cover.photo, '00-cover.jpg');
  createIntro();
  buildCounter();
  buildUsMontage();
  buildKnowGrid();
  buildCameraRoll();
  buildMessages();
  buildChanged();
  buildQuiz();
  buildTinyThings();
  buildMuseum();
  setupCompare();
  setupHiddenHearts();
  buildFuture();
  buildLetter();
  setupFinale();
  observers();
  heartTrail();
})();
