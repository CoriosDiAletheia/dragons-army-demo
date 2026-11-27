/* Dragon's Army TCG Store — demo. Sin librerías. */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const html = document.documentElement;
  if ('scrollRestoration' in history && html.classList.contains('is-intro')) history.scrollRestoration = 'manual';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = matchMedia('(max-width: 760px)');
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const PHONE = '526241848784';
  const wa = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const money = (n) => '$' + n.toLocaleString('es-MX') + ' MXN';

  /* -----------------------------------------------------
     Hora de San José del Cabo (B.C.S., UTC-7 todo el año)
     ----------------------------------------------------- */
  const TZ = 'America/Mazatlan';
  function cabo(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((o, p) => (o[p.type] = p.value, o), {});
    const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday); // 0 = lunes
    return { wd, y: +parts.year, m: +parts.month, d: +parts.day, min: (+parts.hour) * 60 + (+parts.minute) };
  }

  /* -----------------------------------------------------
     Imágenes: placeholder borroso + aparecen ya decodificadas
     ----------------------------------------------------- */
  function hostLqip(img) {
    const lq = [...img.classList].find(c => c.startsWith('lq-'));
    if (!lq) return;
    const host = img.parentElement;
    host.classList.add('lq-host', lq);
    img.classList.remove('lq', lq);
  }
  function fadeIn(img) {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) return done();
    img.addEventListener('load', () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(done), { once: true });
    img.addEventListener('error', done, { once: true });
  }
  const preObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.loading = 'eager';
      preObs.unobserve(en.target);
    });
  }, { rootMargin: '150% 0px 150% 0px' });
  function watchImg(img) {
    hostLqip(img);
    if (img.hasAttribute('data-fade')) fadeIn(img);
    if (img.loading === 'lazy') preObs.observe(img);
  }
  $$('img').forEach(watchImg);

  /* -----------------------------------------------------
     Títulos palabra por palabra + apariciones
     ----------------------------------------------------- */
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span');
            const s = document.createElement('span');
            o.className = 'wm'; o.setAttribute('aria-hidden', 'true');
            s.textContent = part; s.style.setProperty('--wi', i++);
            o.appendChild(s); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  }
  $$('[data-reveal="words"]').forEach(splitWords);

  const inObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      inObs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .01 });
  // Escalonar elementos hermanos que aparecen juntos
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const k = sibs.indexOf(el);
    if (k > 0) el.style.setProperty('--d', Math.min(k, 6) * 0.08 + 's');
  });
  $$('.reveal, [data-reveal="words"]').filter(el => !el.closest('.hero')).forEach(el => inObs.observe(el));

  /* -----------------------------------------------------
     Intro (primera visita de la sesión)
     ----------------------------------------------------- */
  const hero = $('[data-hero]');
  const heroImg = $('img', hero);
  const heroIn = () => {
    hero.classList.add('is-in');
    $$('[data-reveal="words"]', hero).forEach(el => el.classList.add('is-in'));
  };
  if (html.classList.contains('is-intro')) {
    const t0 = performance.now();
    const ready = Promise.all([
      new Promise(res => { if (heroImg.complete && heroImg.naturalWidth) res(); else { heroImg.addEventListener('load', res, { once: true }); heroImg.addEventListener('error', res, { once: true }); } }),
      document.fonts ? document.fonts.ready : Promise.resolve()
    ]);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      html.classList.add('intro-out');
      html.classList.remove('is-intro');
      try { sessionStorage.setItem('da-intro', '1'); } catch (e) { /* sin almacenamiento */ }
      setTimeout(heroIn, 280);
      setTimeout(() => html.classList.remove('intro-out'), 1000);
    };
    Promise.race([ready, wait(2800)]).then(() => setTimeout(end, Math.max(0, 1500 - (performance.now() - t0))));
    $('[data-intro]').addEventListener('click', end);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(heroIn));
  }

  /* -----------------------------------------------------
     Scroll con inercia (solo mouse / trackpad)
     ----------------------------------------------------- */
  const locked = () => document.body.classList.contains('menu-open') || html.classList.contains('is-intro');
  const smooth = (() => {
    if (!finePointer.matches || reduceMotion.matches) return null;
    html.classList.add('smooth');
    let target = scrollY, current = target, raf = 0, last = 0, tween = null;
    const maxY = () => html.scrollHeight - innerHeight;
    function step(now) {
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (tween) {
        const k = Math.min(1, (now - tween.t0) / tween.d);
        current = lerp(tween.from, tween.to, easeInOut(k));
        target = current;
        if (k >= 1) tween = null;
      } else {
        current += (target - current) * (1 - Math.pow(1 - .09, dt / 16.67));
        if (Math.abs(target - current) < .5) current = target;
      }
      scrollTo(0, current);
      if (!tween && current === target) { raf = 0; last = 0; return; }
      raf = requestAnimationFrame(step);
    }
    const run = () => { if (!raf) { last = 0; raf = requestAnimationFrame(step); } };
    addEventListener('wheel', e => {
      if (e.ctrlKey || locked()) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!raf) target = current = scrollY;
      tween = null;
      const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      target = clamp(target + dy, 0, maxY());
      run();
    }, { passive: false });
    addEventListener('scroll', () => { if (!raf) target = current = scrollY; }, { passive: true });
    return {
      to(y) {
        const from = scrollY, to = clamp(y, 0, maxY());
        tween = { from, to, t0: performance.now(), d: Math.min(2200, 650 + Math.abs(to - from) * .15) };
        current = from; run();
      }
    };
  })();
  const nav = $('[data-nav]');
  const scrollToEl = (el) => {
    const y = el === hero ? 0 : el.getBoundingClientRect().top + scrollY - nav.offsetHeight + 1;
    if (smooth) smooth.to(y);
    else scrollTo({ top: y, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-demo-link')) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? hero : (id.length > 1 && document.getElementById(id.slice(1)));
    if (!target) return;
    e.preventDefault();
    if (document.body.classList.contains('menu-open')) setMenu(false);
    scrollToEl(target);
    try { history.replaceState(null, '', id); } catch (err) { /* sin historial */ }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* -----------------------------------------------------
     Navegación y menú
     ----------------------------------------------------- */
  const burger = $('[data-burger]');
  const burgerLabel = $('[data-burger-label]');
  const menu = $('[data-menu]');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burgerLabel.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    document.body.classList.toggle('menu-open', open);
    menu.hidden = false;
    menu.toggleAttribute('inert', !open);
    if (open) $('a', menu).focus({ preventScroll: true });
  }
  menu.setAttribute('inert', '');
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });

  const navLinks = $$('.nav__links a');
  const sections = navLinks.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  // Posiciones cacheadas: el scroll no lee el layout en cada cuadro
  const docTop = (el) => { let t = 0; for (let n = el; n; n = n.offsetParent) t += n.offsetTop; return t; };
  let secTops = [];
  // El menú se oculta al bajar y solo reaparece al subir de verdad (umbral acumulado)
  let lastY = scrollY, travel = 0, navHidden = false, navScrolled = null, activeIdx = -2;
  function onNav() {
    const y = scrollY, dy = y - lastY;
    lastY = y;
    const sc = y > 40;
    if (sc !== navScrolled) { navScrolled = sc; nav.classList.toggle('is-scrolled', sc); }
    if (dy !== 0) travel = (Math.sign(dy) === Math.sign(travel)) ? travel + dy : dy;
    let hide = navHidden;
    if (document.body.classList.contains('menu-open') || y < innerHeight * .6) hide = false;
    else if (travel > 24) hide = true;
    else if (travel < -60) hide = false;
    if (hide !== navHidden) { navHidden = hide; nav.classList.toggle('is-hidden', hide); }
    let cur = -1;
    secTops.forEach((t, i) => { if (t - y < innerHeight * .4) cur = i; });
    if (cur !== activeIdx) { activeIdx = cur; navLinks.forEach((a, i) => a.classList.toggle('is-active', i === cur)); }
  }

  /* -----------------------------------------------------
     Brasas del hero
     ----------------------------------------------------- */
  const embers = $('[data-embers]');
  if (embers && !reduceMotion.matches) {
    const n = mobile.matches ? 10 : 22;
    let h = '';
    for (let i = 0; i < n; i++) {
      const s = (2 + Math.random() * 4).toFixed(1);
      h += `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${s}px;--d:${(7 + Math.random() * 9).toFixed(1)}s;--dl:${(-Math.random() * 14).toFixed(1)}s;--dx:${(Math.random() * 160 - 80).toFixed(0)}px"></i>`;
    }
    embers.innerHTML = h;
  }

  /* -----------------------------------------------------
     Carta holográfica
     ----------------------------------------------------- */
  const holo = $('[data-holo]');
  const card = $('[data-holo-card]');
  const gyroBtn = $('[data-gyro]');
  const st = { rx: 0, ry: 0, mx: 50, my: 50, hyp: 0, tx: 0, ty: 0, tmx: 50, tmy: 50, thyp: 0, active: false, flipped: false, lastInput: 0, gyro: false };
  function setHolo() {
    holo.style.setProperty('--rx', st.rx.toFixed(2) + 'deg');
    holo.style.setProperty('--ry', st.ry.toFixed(2) + 'deg');
    holo.style.setProperty('--mx', st.mx.toFixed(1));
    holo.style.setProperty('--my', st.my.toFixed(1));
    holo.style.setProperty('--hyp', st.hyp.toFixed(3));
  }
  function aim(px, py) { // px, py de 0 a 1
    st.tx = (py - .5) * -26;
    st.ty = (px - .5) * 30;
    st.tmx = px * 100; st.tmy = py * 100;
    st.thyp = clamp(Math.hypot(px - .5, py - .5) * 2, 0, 1);
    st.lastInput = performance.now();
  }
  if (!reduceMotion.matches) {
    holo.classList.add('is-live');
    const area = finePointer.matches ? $('.hero__stage') : holo;
    area.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && st.gyro) return;
      const r = holo.getBoundingClientRect();
      aim(clamp((e.clientX - r.left) / r.width, -.2, 1.2), clamp((e.clientY - r.top) / r.height, -.2, 1.2));
      st.active = true;
    });
    area.addEventListener('pointerleave', () => { st.active = false; });

    const onOrient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      st.gyro = true;
      const px = clamp(.5 + e.gamma / 50, 0, 1);
      const py = clamp(.5 + (e.beta - 45) / 50, 0, 1);
      aim(px, py);
      st.active = true;
    };
    if (!finePointer.matches && 'DeviceOrientationEvent' in window) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        gyroBtn.hidden = false; // iOS pide permiso con un toque
        gyroBtn.addEventListener('click', () => {
          DeviceOrientationEvent.requestPermission().then(p => {
            if (p === 'granted') { addEventListener('deviceorientation', onOrient); gyroBtn.hidden = true; }
          }).catch(() => { gyroBtn.hidden = true; });
        });
      } else {
        addEventListener('deviceorientation', onOrient);
      }
    }

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(holo);
    let raf = 0;
    function loop() {
      if (raf) return;
      const tick = (now) => {
        raf = 0;
        if (!visible) return;
        if (!st.active || now - st.lastInput > 2600) {
          // Piloto automático: balanceo suave cuando nadie la toca
          const t = now / 1000;
          st.tx = Math.sin(t * .7) * 7;
          st.ty = Math.sin(t * .5 + 1) * 11;
          st.tmx = 50 + Math.sin(t * .5 + 1) * 38;
          st.tmy = 50 + Math.sin(t * .7) * 30;
          st.thyp = .35 + Math.sin(t * .9) * .2;
        }
        const k = .1;
        st.rx = lerp(st.rx, st.tx, k); st.ry = lerp(st.ry, st.ty, k);
        st.mx = lerp(st.mx, st.tmx, k); st.my = lerp(st.my, st.tmy, k);
        st.hyp = lerp(st.hyp, st.thyp, k);
        setHolo();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    loop();
  }
  card.addEventListener('click', () => {
    st.flipped = !st.flipped;
    holo.classList.add('is-flipping');
    holo.style.setProperty('--flip', st.flipped ? '180deg' : '0deg');
    card.setAttribute('aria-label', st.flipped ? 'Reverso de la carta de Dragon\'s Army. Toca para regresar al frente.' : 'Carta de Dragon\'s Army. Toca para voltearla.');
    clearTimeout(card._t);
    card._t = setTimeout(() => holo.classList.remove('is-flipping'), 900);
  });

  // Pausar animaciones decorativas cuando no se ven
  const pauseObs = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('is-off', !en.isIntersecting)));
  $$('.hero, .ticker, .final').forEach(el => pauseObs.observe(el));

  /* -----------------------------------------------------
     Ticker infinito
     ----------------------------------------------------- */
  const ticker = $('[data-ticker]');
  if (ticker) {
    const ul = $('ul', ticker);
    const copy = ul.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    ticker.appendChild(copy);
  }

  /* -----------------------------------------------------
     Torneos de la semana
     ----------------------------------------------------- */
  const { GAMES, BR } = DA;
  let DATA = DA.load();
  let EVENTS = DATA.events;
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const fmtTime = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return { t: `${h}:${String(m).padStart(2, '0')}`, ap }; };

  const weekEl = $('[data-week]');
  const listEl = $('[data-ev-list]');
  const now = cabo();
  const monday = new Date(Date.UTC(now.y, now.m - 1, now.d - now.wd));
  let selDay = now.wd, selGame = 'all';

  function renderWeek() {
    weekEl.innerHTML = DAYS.map((d, i) => {
      const date = new Date(monday.getTime() + i * 864e5).getUTCDate();
      const games = [...new Set(EVENTS.filter(e => e.day === i && (selGame === 'all' || e.game === selGame)).map(e => e.game))];
      return `<button class="day${i === now.wd ? ' is-today' : ''}" role="tab" type="button" id="day-${i}" aria-selected="${i === selDay}" aria-controls="ev-panel" tabindex="${i === selDay ? 0 : -1}" data-day="${i}" aria-label="${DAYS_LONG[i]} ${date}${i === now.wd ? ', hoy' : ''}">
        <span class="day__d">${d}</span><span class="day__n">${date}</span>
        <span class="day__dots">${games.map(g => `<i style="--g:${GAMES[g].c}"></i>`).join('')}</span></button>`;
    }).join('');
  }
  function renderEvents() {
    listEl.id = 'ev-panel';
    listEl.setAttribute('role', 'tabpanel');
    listEl.setAttribute('aria-labelledby', 'day-' + selDay);
    const evs = EVENTS.filter(e => e.day === selDay && (selGame === 'all' || e.game === selGame)).sort((a, b) => a.time.localeCompare(b.time));
    if (!evs.length) {
      const closedZ = selDay === 2 || selDay === 5;
      listEl.innerHTML = `<div class="ev__empty"><b>Este día no hay torneo de ${selGame === 'all' ? 'ningún juego' : GAMES[selGame].name}.</b>Las mesas casuales siguen abiertas en Plaza Mijares de 4:00 a 9:30 pm${closedZ ? '' : ' y en Zacatal de 12:00 a 6:00 pm'}.</div>`;
      return;
    }
    listEl.innerHTML = evs.map((e, i) => {
      const g = GAMES[e.game];
      const tm = fmtTime(e.time);
      const msg = `Hola Dragon's Army, quiero inscribirme a "${e.title}" del ${DAYS_LONG[e.day]} a las ${tm.t} ${tm.ap} en ${BR[e.branch]}.`;
      return `<article class="ev" style="--g:${g.c};--i:${i}">
        <div class="ev__time">${tm.t}<small>${tm.ap} · ${DAYS[e.day]}</small></div>
        <div>
          <span class="ev__game">${esc(g.name)}</span>
          <h3>${esc(e.title)}</h3>
          <ul class="ev__meta">
            <li>${esc(e.format)}</li>
            <li><svg aria-hidden="true"><use href="#i-pin"/></svg>${BR[e.branch]}</li>
            <li>Cuota: <b>${esc(e.fee)}</b></li>
          </ul>
        </div>
        <a class="btn btn--sm btn--ghost" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="Inscribirme a ${esc(e.title)}, ${DAYS_LONG[e.day]}">Inscribirme <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
      </article>`;
    }).join('');
  }
  weekEl.addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    selDay = +b.dataset.day;
    renderWeek(); renderEvents();
    $(`[data-day="${selDay}"]`, weekEl).focus();
  });
  weekEl.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    selDay = e.key === 'Home' ? 0 : e.key === 'End' ? 6 : (selDay + (e.key === 'ArrowRight' ? 1 : 6)) % 7;
    renderWeek(); renderEvents();
    $(`[data-day="${selDay}"]`, weekEl).focus();
  });
  $('[data-ev-filters]').addEventListener('click', e => {
    const b = e.target.closest('[data-game]');
    if (!b) return;
    selGame = b.dataset.game;
    $$('[data-game]').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    // Si el día elegido no tiene ese juego, saltar al siguiente que sí
    if (selGame !== 'all' && !EVENTS.some(ev => ev.day === selDay && ev.game === selGame)) {
      for (let k = 1; k < 7; k++) { const d = (selDay + k) % 7; if (EVENTS.some(ev => ev.day === d && ev.game === selGame)) { selDay = d; break; } }
    }
    renderWeek(); renderEvents();
  });
  renderWeek(); renderEvents();

  /* -----------------------------------------------------
     Singles y preventas
     ----------------------------------------------------- */
  const grid = $('[data-sg-grid]');
  let selCat = 'all';
  function renderSingles() {
    const items = DATA.singles.filter(s => !s.sold);
    grid.innerHTML = items.map((s, i) => {
      const label = s.pre ? 'Apartar preventa' : 'Apártalo';
      const msg = s.pre ? `Hola, quiero apartar la preventa: ${s.name} (${money(+s.price || 0)}).` : `Hola, ¿sigue disponible ${s.name} (${s.from ? 'desde ' : ''}${money(+s.price || 0)})? Quiero apartarla.`;
      const show = selCat === 'all' || s.cat === selCat;
      const lq = DA.isSample(s.img) ? `lq lq-${s.img}` : '';
      return `<li class="sg" data-cat="${esc(s.cat)}" style="--i:${i}"${show ? '' : ' hidden'}>
        <div class="sg__card" data-tilt data-cursor="${s.pre ? 'Preventa' : 'Ver'}">
          <span class="sg__badge${s.pre ? ' sg__badge--pre' : ''}">${s.pre ? 'Preventa' : esc(DA.CATS[s.cat] || s.cat)}</span>
          ${s.stock ? `<span class="sg__stock">${esc(s.stock)}</span>` : ''}
          <img class="${lq}" src="${esc(DA.imgSrc(s.img))}" alt="${esc(s.name)}" width="600" height="800" loading="lazy" decoding="async" data-fade>
        </div>
        <div class="sg__info">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.meta || '')}</p>
          <span class="sg__price">${s.from ? '<small>desde </small>' : ''}${money(+s.price || 0).replace(' MXN', '')}</span>
          ${s.pre ? `<div class="sg__cd" data-countdown="${esc(s.pre)}" aria-label="Tiempo para el lanzamiento"></div>` : ''}
        </div>
        <a class="btn btn--sm btn--dark sg__btn" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="${label}: ${esc(s.name)}"><svg aria-hidden="true"><use href="#i-wa"/></svg>${label}</a>
      </li>`;
    }).join('');
    $$('img', grid).forEach(watchImg);
    tickCd();
  }

  $('[data-sg-filters]').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    selCat = b.dataset.cat;
    $$('[data-cat]', e.currentTarget).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    let i = 0;
    $$('.sg', grid).forEach(li => {
      const show = selCat === 'all' || li.dataset.cat === selCat;
      li.hidden = !show;
      if (show) { li.style.setProperty('--i', i++); li.style.animation = 'none'; li.offsetWidth; li.style.animation = ''; }
    });
  });

  // Cuenta regresiva de las preventas
  function tickCd() {
    $$('[data-countdown]', grid).forEach(el => {
      let ms = Math.max(0, new Date(el.dataset.countdown) - Date.now());
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4);
      el.innerHTML = `<span>${d}d</span><span>${String(h).padStart(2, '0')}h</span><span>${String(m).padStart(2, '0')}m</span>`;
    });
  }
  renderSingles();
  setInterval(tickCd, 30000);

  // Si el panel guarda cambios en otra pestaña, la página se actualiza sola
  addEventListener('storage', e => {
    if (e.key !== DA.KEY && e.key !== null) return;
    DATA = DA.load(); EVENTS = DATA.events;
    renderWeek(); renderEvents(); renderSingles();
  });

  // Inclinación + brillo de las cartas (solo puntero fino)
  if (finePointer.matches && !reduceMotion.matches) {
    let tiltEl = null;
    const untilt = (el) => { el.classList.remove('is-live'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--o', '0'); };
    grid.addEventListener('pointermove', e => {
      const el = e.target.closest('[data-tilt]');
      if (tiltEl && tiltEl !== el) untilt(tiltEl);
      tiltEl = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.classList.add('is-live');
      el.style.setProperty('--rx', ((py - .5) * -12).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((px - .5) * 14).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (px * 100).toFixed(1));
      el.style.setProperty('--my', (py * 100).toFixed(1));
      el.style.setProperty('--o', '1');
    });
    grid.addEventListener('pointerleave', () => { if (tiltEl) untilt(tiltEl); tiltEl = null; });
  }

  /* -----------------------------------------------------
     Tabla de la liga
     ----------------------------------------------------- */
  const LADDER = {
    pokemon: [['Diego M.', 'Dragapult ex', 42], ['Sofía R.', 'Gardevoir ex', 39], ['Kevin L.', 'Charizard ex', 33], ['Mariana T.', 'Raging Bolt', 30], ['Luis A.', 'Lost Box', 24]],
    yugioh: [['Andrés P.', 'Snake-Eye', 45], ['Valeria G.', 'Yubel', 38], ['Jorge C.', 'Branded', 31], ['Emilio S.', 'Tenpai', 27], ['Renata F.', 'Labrynth', 22]],
    onepiece: [['Óscar V.', 'Rojo · Luffy', 36], ['Fernanda L.', 'Morado · Enel', 34], ['Iván H.', 'Azul · Doflamingo', 29], ['Paola N.', 'Verde · Zoro', 25], ['Hugo B.', 'Negro · Lucci', 19]]
  };
  const ladderEl = $('[data-ladder]');
  const ladderTabs = $$('[data-ladder-tabs] button');
  function renderLadder(k) {
    const rows = LADDER[k], top = rows[0][2];
    ladderEl.innerHTML = rows.map((r, i) => `<li style="--i:${i}"><div><b>${esc(r[0])}</b><small>${esc(r[1])}</small></div><span class="ladder__pts">${r[2]} pts</span><span class="ladder__bar" aria-hidden="true"><span style="--w:${Math.round(r[2] / top * 100)}%;--i:${i}"></span></span></li>`).join('');
  }
  ladderTabs.forEach(b => b.addEventListener('click', () => {
    ladderTabs.forEach(x => x.setAttribute('aria-selected', x === b));
    renderLadder(b.dataset.l);
  }));
  renderLadder('pokemon');

  /* -----------------------------------------------------
     Sucursales: abierto / cerrado en vivo
     ----------------------------------------------------- */
  const { HOURS } = DA;
  const hm = (m) => { const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${ap}`; };
  function status(key) {
    const c = cabo(), H = HOURS[key];
    const openToday = H.days.includes(c.wd);
    if (openToday && c.min >= H.open && c.min < H.close) return { open: true, txt: `Abierto · cierra ${hm(H.close)}` };
    if (openToday && c.min < H.open) return { open: false, txt: `Abre hoy ${hm(H.open)}` };
    for (let k = 1; k <= 7; k++) {
      const d = (c.wd + k) % 7;
      if (H.days.includes(d)) return { open: false, txt: `Cerrado · abre ${k === 1 ? 'mañana' : DAYS_LONG[d]} ${hm(H.open)}` };
    }
    return { open: false, txt: 'Cerrado' };
  }
  function renderStatus() {
    let anyOpen = false;
    $$('[data-branch]').forEach(b => {
      const s = status(b.dataset.branch);
      anyOpen = anyOpen || s.open;
      const el = $('[data-status]', b);
      el.textContent = s.txt;
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
    });
    const f = $('[data-open-now]');
    const lbl = $('[data-open-label]');
    const c = cabo();
    if (anyOpen) { f.textContent = 'Abierto'; f.classList.add('is-open'); lbl.textContent = 'ahora mismo'; }
    else {
      f.classList.remove('is-open');
      const zOpen = HOURS.zacatal.days.includes(c.wd) && c.min < 12 * 60;
      if (zOpen) { f.textContent = '12:00'; lbl.textContent = 'abrimos hoy, pm'; }
      else if (c.min < 16 * 60) { f.textContent = '4:00'; lbl.textContent = 'abrimos hoy, pm'; }
      else { f.textContent = 'Mañana'; lbl.textContent = 'abrimos de nuevo'; }
    }
  }
  renderStatus(); setInterval(renderStatus, 60000);

  /* -----------------------------------------------------
     Escenas ligadas al scroll
     ----------------------------------------------------- */
  const crew = $('[data-crew]');
  const storeImg = $('.store__media img');
  const finalMark = $('.final__mark');
  const fab = $('.fab');
  const finalSec = $('.final');
  const storeBox = storeImg.closest('.store__media');
  let L = {}, vh = innerHeight, lastP = -1, fabHidden = null;
  function measure() {
    vh = innerHeight;
    secTops = sections.map(s => (s ? docTop(s) : Infinity));
    L = {
      crewTop: docTop(crew), crewH: crew.offsetHeight,
      storeTop: docTop(storeBox), storeH: storeBox.offsetHeight,
      markTop: docTop(finalSec) + finalSec.offsetHeight / 2 - finalMark.offsetHeight / 2, markH: finalMark.offsetHeight,
      finalTop: docTop(finalSec)
    };
  }
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    onNav();
    if (!reduceMotion.matches) {
      const span = L.crewH - vh;
      const p = clamp((y - L.crewTop) / (span * .75), 0, 1);
      if (Math.abs(p - lastP) > .0005) { lastP = p; crew.style.setProperty('--p', p.toFixed(4)); }

      const st = L.storeTop - y;
      if (st + L.storeH > 0 && st < vh) storeImg.style.setProperty('--py', (((st + L.storeH / 2 - vh / 2) / vh) * -50).toFixed(1) + 'px');
      const mt = L.markTop - y;
      if (mt + L.markH > 0 && mt < vh) finalMark.style.setProperty('--rot', ((mt / vh) * 30).toFixed(1) + 'deg');
    }
    const fz = (L.finalTop - y < vh * .8) || document.body.classList.contains('menu-open');
    if (fz !== fabHidden) { fabHidden = fz; fab.classList.toggle('is-hidden', fz); }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  let rT;
  const remeasure = () => { measure(); onScroll(); };
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(remeasure, 120); });
  addEventListener('load', remeasure);
  if (document.fonts) document.fonts.ready.then(remeasure);
  new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(remeasure, 120); }).observe(document.body);
  measure();
  onScroll();

  /* -----------------------------------------------------
     Cursor con etiqueta (escritorio)
     ----------------------------------------------------- */
  if (finePointer.matches) {
    const cur = $('[data-cursor-el]');
    const lab = $('[data-cursor-label]');
    let x = -100, y = -100, cx = -100, cy = -100, cr = 0;
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      const t = e.target.closest && e.target.closest('[data-cursor]');
      if (t) { lab.textContent = t.dataset.cursor; cur.classList.add('has-label'); }
      else cur.classList.remove('has-label');
      if (!cr) cr = requestAnimationFrame(move);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cur.classList.remove('has-label'); x = y = -100; });
    function move() {
      cx = lerp(cx, x, .22); cy = lerp(cy, y, .22);
      cur.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      cr = (Math.abs(cx - x) + Math.abs(cy - y) > .3) ? requestAnimationFrame(move) : 0;
    }
  }

  /* -----------------------------------------------------
     Avisos de enlaces de la demo
     ----------------------------------------------------- */
  const toast = $('[data-toast]');
  let toastT;
  $$('[data-demo-link]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    toast.textContent = 'Aquí va la invitación a su servidor de Discord.';
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 3200);
  }));
})();
