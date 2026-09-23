(() => {
  const data = window.ANNIVERSARY;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];

  const setNames = () => {
    $$('[data-partner]').forEach(el => el.textContent = data.partnerName);
    $$('[data-self]').forEach(el => el.textContent = data.selfName);
    document.title = `5 Years of ${data.selfName} + ${data.partnerName} ❤️`;
  };

  const photoFallback = (el, src, label) => {
    if (!el) return;
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      const span = $('span', el);
      if (span) span.style.display = 'none';
    };
    img.onerror = () => {
      const span = $('span', el);
      if (span && label) span.textContent = label;
    };
    img.src = src;
  };

  const hydratePhotos = () => {
    Object.entries(data.photos).forEach(([key, src]) => photoFallback($(`[data-photo="${key}"]`), src, key));
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

  const createIntro = () => {
    const btn = $('#holdButton');
    const intro = $('#intro');
    let start = 0;
    let frame = null;
    let completed = false;
    const duration = 1500;

    const reset = () => {
      cancelAnimationFrame(frame);
      btn.style.setProperty('--hold', '0%');
    };

    const tick = t => {
      if (!start) start = t;
      const pct = Math.min(100, ((t - start) / duration) * 100);
      btn.style.setProperty('--hold', `${pct}%`);
      if (pct >= 100 && !completed) {
        completed = true;
        $('.hold-heart', btn).textContent = '♥';
        burstHearts($('#burst'), 34);
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
      start = 0;
      frame = requestAnimationFrame(tick);
    };
    const up = () => {
      if (!completed) reset();
    };

    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !completed) down(e);
    });
    btn.addEventListener('keyup', up);
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
      Object.entries(values).forEach(([k, v]) => {
        const el = $("[data-unit="" + k + ""]");
        if (el) el.textContent = String(v).padStart(2, '0');
      });
    };

    update();
    setInterval(update, 1000);
  };

  const buildRewind = () => {
    const years = [...data.storyYears.map(y => y.year.split(' ')[0]).reverse(), '2021'];
    const root = $('#rewindYears');
    root.innerHTML = years.map(y => `<span class="rewind-year">${y}</span>`).join('');
    let played = false;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !played) {
        played = true;
        $$('.rewind-year', root).forEach((el, i) => setTimeout(() => el.classList.add('active'), i * 390));
      }
    }, { threshold: .5 });
    io.observe(root);
  };

  const buildStory = () => {
    const story = $('#story');
    const heartTpl = $('#hiddenHeartTemplate');

    data.storyYears.forEach((chapter, idx) => {
      const sec = document.createElement('section');
      sec.className = 'scene year-scene';
      sec.id = `year-${idx + 1}`;
      sec.innerHTML = `
        <div class="section-wrap">
          <div class="year-heading reveal">
            <div class="year-number">${chapter.year}</div>
            <div class="year-title">
              <span class="eyebrow dark">${chapter.kicker}</span>
              <h2>${chapter.title}</h2>
              <p>${chapter.note}</p>
            </div>
          </div>
          <div class="moments">
            ${chapter.moments.map((m, i) => `
              <article class="moment-card reveal" style="--tilt:${[-2.4, 1.6, -1.1][i % 3]}deg">
                <div class="photo moment-photo" data-src="${m.photo}"><span>${chapter.year} · memory ${i + 1}</span></div>
                <div class="moment-copy"><h3>${m.title}</h3><p>${m.text}</p></div>
              </article>`).join('')}
          </div>
        </div>`;

      const heart = heartTpl.content.firstElementChild.cloneNode(true);
      heart.dataset.index = idx;
      heart.style.top = `${18 + ((idx * 17) % 58)}%`;
      heart.style[idx % 2 ? 'left' : 'right'] = `${5 + (idx * 4)}%`;
      sec.appendChild(heart);
      story.appendChild(sec);
    });

    $$('[data-src]').forEach(el => photoFallback(el, el.dataset.src, $('span', el)?.textContent));
  };

  const setupHiddenHearts = () => {
    const found = new Set(JSON.parse(localStorage.getItem('anniv-hearts') || '[]'));
    const score = $('#heartScore');
    const message = $('#secretMessage');
    const refresh = () => {
      score.textContent = found.size;
    };

    $$('.hidden-heart').forEach(btn => {
      const i = Number(btn.dataset.index);
      if (found.has(i)) btn.classList.add('found');
      btn.addEventListener('click', () => {
        found.add(i);
        btn.classList.add('found');
        localStorage.setItem('anniv-hearts', JSON.stringify([...found]));
        message.textContent = `♥ ${data.storyYears[i].secret}`;
        refresh();
        if (found.size === 5) {
          setTimeout(() => {
            message.textContent = 'You found all five. Of course you did. 🥹❤️';
          }, 1800);
        }
      });
    });
    refresh();
  };

  const setupCompare = () => {
    const range = $('#compareRange');
    const cover = $('#compareNew');
    const divider = $('#compareDivider');
    range.addEventListener('input', () => {
      cover.style.width = `${range.value}%`;
      divider.style.left = `${range.value}%`;
    });
  };

  const setupAudio = () => {
    const audio = $('#ourAudio');
    const btn = $('#recordButton');
    const status = $('#audioStatus');

    btn.addEventListener('click', async () => {
      if (!audio.paused) {
        audio.pause();
        btn.classList.remove('playing');
        status.textContent = 'tap to play ♫';
        return;
      }
      try {
        await audio.play();
        btn.classList.add('playing');
        status.textContent = 'playing our sound ♫';
      } catch {
        status.textContent = 'add assets/our-song.mp3 ♫';
      }
    });

    audio.addEventListener('ended', () => {
      btn.classList.remove('playing');
      status.textContent = 'play again ♫';
    });
  };

  const buildReasons = () => {
    const root = $('#reasonGrid');
    root.innerHTML = data.reasons.map((_, i) => `<button class="reason-heart" data-reason="${i}" aria-label="Reason ${i + 1}">♥</button>`).join('');
    const modal = $('#reasonModal');

    $$('.reason-heart', root).forEach(btn => btn.addEventListener('click', () => {
      const i = Number(btn.dataset.reason);
      $('#reasonNumber').textContent = `Reason ${String(i + 1).padStart(2, '0')} / 25`;
      $('#reasonText').textContent = data.reasons[i];
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }));

    const close = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };

    $('#reasonClose').addEventListener('click', close);
    modal.addEventListener('click', e => {
      if (e.target === modal) close();
    });
  };

  const buildMosaic = () => {
    const root = $('#mosaicGrid');
    const images = [];
    data.storyYears.forEach(y => y.moments.forEach(m => images.push(m.photo)));

    for (let i = 0; i < 24; i++) {
      const cell = document.createElement('div');
      cell.className = 'photo mosaic-cell';
      cell.style.setProperty('--r', `${(i % 5 - 2) * 4}deg`);
      cell.style.setProperty('--delay', `${(i % 8) * 65}ms`);
      photoFallback(cell, images[i % images.length], '♥');
      root.appendChild(cell);
    }
  };

  const buildLittleThings = () => {
    $('#littleThingsGrid').innerHTML = data.littleThings.map((x, i) => `
      <article class="thing-card reveal" style="--r:${[-1.4, 1.2, -.7, 1.1, -1.1, .7][i % 6]}deg">
        <span>${x.icon}</span>
        <strong>${x.label}</strong>
        <p>${x.value}</p>
      </article>`).join('');
  };

  const buildFuture = () => {
    $('#futurePolaroids').innerHTML = [6, 7, 8, 9, 10].map((y, i) => `
      <div class="future-card" style="--r:${[-7, 4, -2, 5, -4][i]}deg;--delay:${i * 120}ms">
        <div>?</div>
        <p>YEAR ${y}<br/>photo coming soon…</p>
      </div>`).join('');
  };

  const buildLetter = () => {
    $('#letterBody').innerHTML = data.letter.map(p => `<p>${p}</p>`).join('');
    const env = $('#envelope');
    env.addEventListener('click', () => {
      const open = env.classList.toggle('open');
      env.setAttribute('aria-expanded', String(open));
    });
  };

  const setupFinale = () => {
    const epi = $('#epilogue');
    const film = $('#filmStrip');
    const imgs = data.storyYears.flatMap(y => y.moments.map(m => m.photo)).slice(0, 5);

    imgs.forEach((src, i) => {
      const p = document.createElement('div');
      p.className = 'photo';
      const s = document.createElement('span');
      s.textContent = `memory ${i + 1}`;
      p.appendChild(s);
      photoFallback(p, src, s.textContent);
      film.appendChild(p);
    });

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
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('visible');
    }), { threshold: .14, rootMargin: '0px 0px -8%' });

    $$('.reveal,.mosaic-grid,.future-card').forEach(el => io.observe(el));

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
  hydratePhotos();
  createIntro();
  buildCounter();
  buildRewind();
  buildStory();
  setupHiddenHearts();
  setupCompare();
  setupAudio();
  buildReasons();
  buildMosaic();
  buildLittleThings();
  buildFuture();
  buildLetter();
  setupFinale();
  observers();
  heartTrail();
})();