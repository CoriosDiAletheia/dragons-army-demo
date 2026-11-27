/* Panel de Dragon's Army (demostración).
   Guarda en este navegador con DA.save(); en la versión real estas mismas
   funciones llaman a la base de datos y suben la foto al almacenamiento. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + (+n || 0).toLocaleString('es-MX');
  const SESSION = 'da-admin';
  const { GAMES, CATS, BR, DAYS, DAYS_LONG, HOURS } = DA;
  const GAME_COLORS = { pokemon: '#f2c230', yugioh: '#b98cff', onepiece: '#ff6f4d', magic: '#6fb7ff', lorcana: '#5fd4c4', learn: '#9be37a' };

  let data = DA.load();

  /* ---------- Acceso ---------- */
  const login = $('[data-login]');
  const app = $('[data-app]');
  function showApp(on) {
    login.hidden = on;
    app.hidden = !on;
    if (on) render();
  }
  let logged = false;
  try { logged = sessionStorage.getItem(SESSION) === '1'; } catch (e) { /* sin almacenamiento */ }
  $('[data-enter]').addEventListener('click', () => {
    try { sessionStorage.setItem(SESSION, '1'); } catch (e) { /* sin almacenamiento */ }
    showApp(true);
    $('.tab[aria-current="page"]').focus();
  });
  $('[data-logout]').addEventListener('click', () => {
    try { sessionStorage.removeItem(SESSION); } catch (e) { /* sin almacenamiento */ }
    showApp(false);
  });

  /* ---------- Guardar ---------- */
  function persist() {
    try {
      DA.save(data);
      return true;
    } catch (e) {
      toast('No hay espacio para más fotos en esta demostración. Borra alguna carta o restablece los datos.');
      data = DA.load();
      return false;
    }
  }

  /* ---------- Aviso con acción ---------- */
  const toastEl = $('[data-toast]');
  const toastMsg = $('[data-toast-msg]');
  const toastAct = $('[data-toast-act]');
  let toastT, toastFn = null;
  function toast(msg, act, fn) {
    toastMsg.textContent = msg;
    toastAct.hidden = !act;
    toastAct.textContent = act || '';
    toastFn = fn || null;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), act ? 5000 : 3200);
  }
  toastAct.addEventListener('click', () => {
    if (toastFn) toastFn();
    toastEl.classList.remove('is-on');
  });

  /* ---------- Pestañas ---------- */
  let tab = 'vitrina';
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    $$('[data-tab]').forEach(x => { if (x === b) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    $$('[data-view]').forEach(v => { v.hidden = v.dataset.view !== tab; });
    scrollTo(0, 0);
  }));

  function render() { renderCards(); renderDays(); renderEvents(); }

  /* =====================================================
     Vitrina
     ===================================================== */
  const itemsEl = $('[data-items]');
  const searchEl = $('[data-search]');
  let vFilter = 'all';
  function renderCards() {
    const q = searchEl.value.trim().toLowerCase();
    const all = data.singles;
    const on = all.filter(s => !s.sold).length;
    $('[data-v-count]').textContent = `${on} en vitrina · ${all.length - on} vendidas`;
    const list = all.filter(s => (vFilter === 'all' || (vFilter === 'on' ? !s.sold : s.sold)) && (!q || s.name.toLowerCase().includes(q)));
    if (!list.length) {
      itemsEl.innerHTML = `<li class="empty"><b>${q ? 'Nada con ese nombre' : 'Aquí no hay cartas'}</b>${q ? 'Prueba con otra palabra.' : 'Toca "Nueva carta" para subir la primera.'}</li>`;
      return;
    }
    itemsEl.innerHTML = list.map((s, i) => `
      <li class="item${s.sold ? ' is-sold' : ''}" style="--i:${i}">
        <img class="item__img" src="${esc(DA.imgSrc(s.img, '../'))}" alt="" width="64" height="85" loading="lazy">
        <div class="item__main">
          <p class="item__name">${esc(s.name)}</p>
          <p class="item__meta"><span class="item__price">${s.from ? 'desde ' : ''}${money(s.price)}</span> · ${esc(CATS[s.cat] || s.cat)}${s.stock ? ' · ' + esc(s.stock) : ''}</p>
          ${s.pre ? '<span class="tag tag--pre">Preventa</span>' : s.sold ? '<span class="tag">Vendida</span>' : '<span class="tag tag--on">En vitrina</span>'}
        </div>
        <div class="item__acts">
          <label class="toggle"><input type="checkbox" ${s.sold ? '' : 'checked'} data-toggle="${esc(s.id)}" aria-label="Mostrar ${esc(s.name)} en la vitrina"><span>${s.sold ? 'Oculta' : 'Visible'}</span></label>
          <button class="btn btn--ghost btn--sm" type="button" data-edit="${esc(s.id)}"><svg aria-hidden="true"><use href="#i-edit"/></svg>Editar</button>
        </div>
      </li>`).join('');
  }
  searchEl.addEventListener('input', renderCards);
  $('[data-v-filter]').addEventListener('click', e => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    vFilter = b.dataset.f;
    $$('[data-f]').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    renderCards();
  });
  itemsEl.addEventListener('change', e => {
    const t = e.target.closest('[data-toggle]');
    if (!t) return;
    const s = data.singles.find(x => x.id === t.dataset.toggle);
    s.sold = !t.checked;
    if (persist()) toast(s.sold ? `"${s.name}" ya no aparece en la página.` : `"${s.name}" está de vuelta en la vitrina.`, 'Deshacer', () => { s.sold = !s.sold; persist(); renderCards(); });
    renderCards();
  });
  itemsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-edit]');
    if (b) openCard(data.singles.find(x => x.id === b.dataset.edit), b);
  });

  /* ---------- Formulario de carta ---------- */
  const cSheet = $('[data-card-sheet]');
  const cForm = $('[data-card-form]');
  const photo = $('[data-photo]');
  const fileIn = $('[data-file]');
  const preview = $('[data-preview]');
  const busy = $('[data-busy]');
  const catSel = $('[data-cat-select]');
  const preField = $('[data-pre-field]');
  catSel.innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('');
  let editing = null, photoData = null, opener = null;

  function setErr(form, key, msg) {
    const el = $(`[data-err="${key}"]`, form);
    if (el) el.textContent = msg || '';
    const input = form.elements[key];
    if (input && input.setAttribute) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function clearErrs(form) { $$('[data-err]', form).forEach(el => { el.textContent = ''; }); $$('[aria-invalid]', form).forEach(el => el.setAttribute('aria-invalid', 'false')); }

  function toLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function openCard(item, from) {
    opener = from || null;
    editing = item || null;
    cForm.reset();
    clearErrs(cForm);
    photoData = item ? item.img : null;
    $('[data-cs-title]').textContent = item ? 'Editar carta' : 'Nueva carta';
    $('[data-delete]', cForm).hidden = !item;
    if (item) {
      cForm.elements.name.value = item.name;
      cForm.elements.cat.value = item.cat;
      cForm.elements.price.value = item.price;
      cForm.elements.from.checked = !!item.from;
      cForm.elements.meta.value = item.meta || '';
      cForm.elements.stock.value = item.stock || '';
      cForm.elements.pre.value = toLocalInput(item.pre);
    } else {
      cForm.elements.cat.value = 'pokemon';
      cForm.elements.stock.value = '1 pieza';
    }
    showPhoto(photoData ? DA.imgSrc(photoData, '../') : null);
    preField.hidden = cForm.elements.cat.value !== 'preventa';
    cSheet.showModal();
    if (!item) setTimeout(() => cForm.elements.name.focus(), 50);
  }
  function showPhoto(src) {
    preview.hidden = !src;
    if (src) preview.src = src; else preview.removeAttribute('src');
    photo.classList.toggle('has-img', !!src);
  }
  catSel.addEventListener('change', () => { preField.hidden = catSel.value !== 'preventa'; });

  // Recorta a 3:4 y comprime en el navegador antes de guardar
  async function compress(file) {
    const bmp = await (window.createImageBitmap ? createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null) : null) || await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
    const W = 600, H = 800;
    const sw = bmp.width, sh = bmp.height;
    const scale = Math.max(W / sw, H / sh);
    const cw = W / scale, ch = H / scale;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, W, H);
    let out = c.toDataURL('image/webp', .78);
    if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/jpeg', .8);
    return out;
  }
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files && fileIn.files[0];
    if (!f) return;
    setErr(cForm, 'photo', '');
    if (!f.type.startsWith('image/')) { setErr(cForm, 'photo', 'Ese archivo no es una imagen. Elige una foto.'); return; }
    busy.hidden = false;
    try {
      photoData = await compress(f);
      showPhoto(photoData);
    } catch (e) {
      setErr(cForm, 'photo', 'No se pudo leer la foto. Intenta con otra.');
    } finally {
      busy.hidden = true;
      fileIn.value = '';
    }
  });

  cForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrs(cForm);
    const f = cForm.elements;
    const name = f.name.value.trim();
    const price = Math.round(+f.price.value);
    let firstBad = null;
    if (!photoData) { setErr(cForm, 'photo', 'Agrega una foto para que la gente vea la carta.'); firstBad = firstBad || fileIn; }
    if (!name) { setErr(cForm, 'name', 'Escribe el nombre de la carta.'); firstBad = firstBad || f.name; }
    if (!price || price < 1) { setErr(cForm, 'price', 'Pon un precio mayor a $0.'); firstBad = firstBad || f.price; }
    if (firstBad) { firstBad.focus(); return; }
    const item = editing || { id: DA.uid('s') };
    Object.assign(item, {
      name, price, cat: f.cat.value, from: f.from.checked,
      meta: f.meta.value.trim(), stock: f.stock.value.trim(), img: photoData,
      pre: f.cat.value === 'preventa' && f.pre.value ? new Date(f.pre.value).toISOString() : undefined
    });
    if (!item.pre) delete item.pre;
    const isNew = !editing;
    if (isNew) data.singles.unshift(item);
    if (!persist()) return;
    cSheet.close();
    vFilter = 'all'; searchEl.value = '';
    $$('[data-f]').forEach(x => { const on = x.dataset.f === 'all'; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    renderCards();
    toast(isNew ? 'Publicada. Ya aparece en la vitrina.' : 'Cambios publicados.', 'Ver', () => window.open('../index.html#singles', '_blank', 'noopener'));
  });
  $('[data-delete]', cForm).addEventListener('click', () => {
    if (!editing) return;
    const idx = data.singles.indexOf(editing);
    const removed = data.singles.splice(idx, 1)[0];
    persist();
    cSheet.close();
    renderCards();
    toast(`Eliminaste "${removed.name}".`, 'Deshacer', () => { data.singles.splice(idx, 0, removed); persist(); renderCards(); });
  });

  /* =====================================================
     Torneos
     ===================================================== */
  const daysEl = $('[data-days]');
  const evList = $('[data-events]');
  const today = (() => {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mazatlan', weekday: 'short' }).format(new Date());
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd);
  })();
  let selDay = today < 0 ? 0 : today;
  const fmt = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return { t: `${h}:${String(m).padStart(2, '0')}`, ap }; };
  const hm = (m) => fmt(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);

  function renderDays() {
    daysEl.innerHTML = DAYS.map((d, i) => {
      const n = data.events.filter(e => e.day === i).length;
      return `<button type="button" role="tab" aria-selected="${i === selDay}" data-d="${i}" aria-label="${DAYS_LONG[i]}, ${n} ${n === 1 ? 'torneo' : 'torneos'}">${d}<b>${n}</b></button>`;
    }).join('');
  }
  function renderEvents() {
    const list = data.events.filter(e => e.day === selDay).sort((a, b) => a.time.localeCompare(b.time));
    if (!list.length) {
      evList.innerHTML = `<li class="empty"><b>Sin torneos el ${DAYS_LONG[selDay]}</b>Toca "Nuevo torneo" para agregar uno.</li>`;
      return;
    }
    evList.innerHTML = list.map((e, i) => {
      const t = fmt(e.time);
      return `<li class="item ev" style="--i:${i}">
        <div class="ev__time" style="--g:${GAME_COLORS[e.game] || '#e3121d'}">${t.t}<small>${t.ap}</small></div>
        <div class="item__main">
          <p class="item__name">${esc(e.title)}</p>
          <p class="item__meta">${esc(GAMES[e.game] ? GAMES[e.game].name : e.game)} · ${esc(BR[e.branch])} · ${esc(e.fee || 'Gratis')}</p>
        </div>
        <div class="item__acts">
          <button class="icon-btn" type="button" data-dup="${esc(e.id)}" aria-label="Duplicar ${esc(e.title)}"><svg aria-hidden="true"><use href="#i-copy"/></svg></button>
          <button class="btn btn--ghost btn--sm" type="button" data-edit-ev="${esc(e.id)}"><svg aria-hidden="true"><use href="#i-edit"/></svg>Editar</button>
        </div>
      </li>`;
    }).join('');
  }
  daysEl.addEventListener('click', e => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    selDay = +b.dataset.d;
    renderDays(); renderEvents();
  });
  evList.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit-ev]');
    if (ed) return openEvent(data.events.find(x => x.id === ed.dataset.editEv), null, ed);
    const du = e.target.closest('[data-dup]');
    if (du) {
      const src = data.events.find(x => x.id === du.dataset.dup);
      openEvent(null, src, du);
    }
  });

  /* ---------- Formulario de torneo ---------- */
  const eSheet = $('[data-event-sheet]');
  const eForm = $('[data-event-form]');
  $('[data-game-pick]').innerHTML = Object.entries(GAMES).map(([k, g]) => `<label><input type="radio" name="game" value="${k}"><span><i style="--g:${GAME_COLORS[k]}"></i>${esc(g.name)}</span></label>`).join('');
  $('[data-day-pick]').innerHTML = DAYS.map((d, i) => `<label><input type="radio" name="day" value="${i}" aria-label="${DAYS_LONG[i]}"><span>${d}</span></label>`).join('');
  $('[data-branch-pick]').innerHTML = Object.entries(BR).map(([k, v]) => `<label><input type="radio" name="branch" value="${k}"><span>${esc(v)}</span></label>`).join('');
  let editingEv = null;

  function syncBranch() {
    const day = +(eForm.elements.day.value || 0);
    // Zacatal cierra miércoles y sábado: no se puede elegir esos días
    $$('input[name="branch"]', eForm).forEach(r => { r.disabled = !HOURS[r.value].days.includes(day); });
    const cur = $('input[name="branch"]:checked', eForm);
    if (!cur || cur.disabled) { const ok = $$('input[name="branch"]', eForm).find(r => !r.disabled); if (ok) ok.checked = true; }
    const br = eForm.elements.branch.value;
    const H = HOURS[br];
    $('[data-time-help]').textContent = H ? `${BR[br]} abre de ${hm(H.open).t} ${hm(H.open).ap} a ${hm(H.close).t} ${hm(H.close).ap}.` : '';
    setErr(eForm, 'branch', H && !H.days.includes(day) ? `${BR[br]} cierra ese día.` : '');
  }
  eForm.addEventListener('change', e => { if (e.target.name === 'day' || e.target.name === 'branch') syncBranch(); });

  function openEvent(item, copyFrom, from) {
    opener = from || null;
    editingEv = item || null;
    eForm.reset();
    clearErrs(eForm);
    const src = item || copyFrom;
    $('[data-es-title]').textContent = item ? 'Editar torneo' : copyFrom ? 'Duplicar torneo' : 'Nuevo torneo';
    $('[data-delete]', eForm).hidden = !item;
    const set = (name, v) => { const r = $(`input[name="${name}"][value="${v}"]`, eForm); if (r) r.checked = true; };
    set('game', src ? src.game : 'pokemon');
    set('day', src ? (copyFrom && !item ? selDay : src.day) : selDay);
    set('branch', src ? src.branch : 'mijares');
    eForm.elements.title.value = src ? src.title : '';
    eForm.elements.time.value = src ? src.time : '18:00';
    eForm.elements.fee.value = src ? src.fee : '';
    eForm.elements.format.value = src ? src.format : '';
    syncBranch();
    eSheet.showModal();
    if (!item) setTimeout(() => eForm.elements.title.focus(), 50);
  }

  eForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErrs(eForm);
    const f = eForm.elements;
    const title = f.title.value.trim();
    const day = +f.day.value, branch = f.branch.value, time = f.time.value;
    let bad = null;
    if (!title) { setErr(eForm, 'title', 'Ponle nombre al torneo.'); bad = bad || f.title; }
    const H = HOURS[branch];
    if (!H.days.includes(day)) { setErr(eForm, 'branch', `${BR[branch]} cierra el ${DAYS_LONG[day]}. Elige otra sucursal u otro día.`); bad = bad || $('input[name="branch"]', eForm); }
    if (!time) { setErr(eForm, 'time', 'Elige la hora de inicio.'); bad = bad || f.time; }
    else {
      const [h, m] = time.split(':').map(Number), mins = h * 60 + m;
      if (mins < H.open || mins >= H.close) { setErr(eForm, 'time', `A esa hora ${BR[branch]} está cerrada. Elige entre ${hm(H.open).t} ${hm(H.open).ap} y ${hm(H.close).t} ${hm(H.close).ap}.`); bad = bad || f.time; }
    }
    if (bad) { bad.focus(); return; }
    const item = editingEv || { id: DA.uid('e') };
    Object.assign(item, { title, day, branch, time, game: f.game.value, fee: f.fee.value.trim() || 'Gratis', format: f.format.value.trim() });
    const isNew = !editingEv;
    if (isNew) data.events.push(item);
    if (!persist()) return;
    eSheet.close();
    selDay = day;
    renderDays(); renderEvents();
    toast(isNew ? `Publicado el ${DAYS_LONG[day]} a las ${fmt(time).t} ${fmt(time).ap}.` : 'Cambios publicados.', 'Ver', () => window.open('../index.html#torneos', '_blank', 'noopener'));
  });
  $('[data-delete]', eForm).addEventListener('click', () => {
    if (!editingEv) return;
    const idx = data.events.indexOf(editingEv);
    const removed = data.events.splice(idx, 1)[0];
    persist();
    eSheet.close();
    renderDays(); renderEvents();
    toast(`Eliminaste "${removed.title}".`, 'Deshacer', () => { data.events.splice(idx, 0, removed); persist(); renderDays(); renderEvents(); });
  });

  /* ---------- Hojas: cerrar y regresar el foco ---------- */
  [cSheet, eSheet].forEach(d => {
    $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
    d.addEventListener('click', e => { if (e.target === d) d.close(); }); // tocar fuera
    d.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus(); opener = null; });
  });
  $('[data-new-card]').addEventListener('click', e => openCard(null, e.currentTarget));
  $('[data-new-event]').addEventListener('click', e => openEvent(null, null, e.currentTarget));

  /* ---------- Ajustes ---------- */
  $('[data-reset]').addEventListener('click', () => {
    const before = JSON.stringify(data);
    DA.reset();
    data = DA.load();
    render();
    toast('Se restablecieron los datos de ejemplo.', 'Deshacer', () => { data = JSON.parse(before); persist(); render(); });
  });

  // Si cambian los datos en otra pestaña, refrescar
  addEventListener('storage', e => { if (e.key === DA.KEY || e.key === null) { data = DA.load(); render(); } });

  // Altura real del encabezado, para pegar la barra de pestañas justo debajo
  const topBar = $('.top');
  const setTopH = () => document.documentElement.style.setProperty('--top-h', topBar.offsetHeight + 'px');
  new ResizeObserver(setTopH).observe(topBar);

  showApp(logged);
})();
