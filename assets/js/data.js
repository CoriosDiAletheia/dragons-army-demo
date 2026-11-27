/* Datos de la tienda: los usan la página y el panel.
   Demo: se guardan en este navegador (localStorage).
   Versión real: el mismo formato vive en una base de datos (p. ej. Supabase) y las fotos en su almacenamiento. */
window.DA = (() => {
  'use strict';
  const KEY = 'da-data-v1';

  const GAMES = {
    pokemon: { name: 'Pokémon', c: 'var(--c-pokemon)' },
    yugioh: { name: 'Yu-Gi-Oh!', c: 'var(--c-yugioh)' },
    onepiece: { name: 'One Piece', c: 'var(--c-onepiece)' },
    magic: { name: 'Magic', c: 'var(--c-magic)' },
    lorcana: { name: 'Lorcana', c: 'var(--c-lorcana)' },
    learn: { name: 'Aprende a jugar', c: 'var(--c-learn)' }
  };
  const CATS = { pokemon: 'Pokémon', yugioh: 'Yu-Gi-Oh!', magic: 'Magic', onepiece: 'One Piece', lorcana: 'Lorcana', preventa: 'Preventa', accesorio: 'Accesorio' };
  const BR = { mijares: 'Plaza Mijares', zacatal: 'Col. Zacatal' };
  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  // 0 = lunes. Minutos desde medianoche.
  const HOURS = {
    mijares: { days: [0, 1, 2, 3, 4, 5, 6], open: 16 * 60, close: 21 * 60 + 30 },
    zacatal: { days: [0, 1, 3, 4, 6], open: 12 * 60, close: 18 * 60 }
  };

  const DEFAULTS = {
    events: [
      { id: 'e1', day: 0, time: '15:00', game: 'learn', title: 'Aprende a jugar Pokémon', format: 'Te prestamos un deck', branch: 'zacatal', fee: 'Gratis' },
      { id: 'e2', day: 0, time: '18:00', game: 'pokemon', title: 'Liga Pokémon', format: 'Estándar · 3 rondas suizas', branch: 'mijares', fee: '$100' },
      { id: 'e3', day: 1, time: '14:00', game: 'onepiece', title: 'One Piece: partidas libres', format: 'Casual · trae tu líder', branch: 'zacatal', fee: 'Gratis' },
      { id: 'e4', day: 1, time: '19:00', game: 'magic', title: 'Commander Night', format: 'Casual · mesas de 4', branch: 'mijares', fee: 'Gratis' },
      { id: 'e5', day: 2, time: '18:30', game: 'yugioh', title: 'Torneo local Yu-Gi-Oh!', format: 'Avanzado · 4 rondas', branch: 'mijares', fee: '$100' },
      { id: 'e6', day: 3, time: '13:00', game: 'onepiece', title: 'Torneo One Piece', format: 'Estándar · top 4 con premio', branch: 'zacatal', fee: '$120' },
      { id: 'e7', day: 3, time: '19:00', game: 'lorcana', title: 'Lorcana: noche de constructed', format: 'Core · 3 rondas', branch: 'mijares', fee: '$100' },
      { id: 'e8', day: 4, time: '14:00', game: 'learn', title: 'Aprende a jugar', format: 'Cualquier juego · decks prestados', branch: 'zacatal', fee: 'Gratis' },
      { id: 'e9', day: 4, time: '19:00', game: 'pokemon', title: 'Torneo semanal Pokémon', format: 'Estándar · premios en sobres', branch: 'mijares', fee: '$120' },
      { id: 'e10', day: 5, time: '17:00', game: 'yugioh', title: 'Sábado de duelos', format: 'Avanzado · 5 rondas', branch: 'mijares', fee: '$100' },
      { id: 'e11', day: 5, time: '19:30', game: 'magic', title: 'Draft de Magic', format: 'Booster draft · 3 sobres incluidos', branch: 'mijares', fee: '$450' },
      { id: 'e12', day: 6, time: '13:00', game: 'pokemon', title: 'Pokémon para peques', format: 'Menores de 12 · decks prestados', branch: 'zacatal', fee: 'Gratis' },
      { id: 'e13', day: 6, time: '17:00', game: 'lorcana', title: 'Lorcana casual', format: 'Partidas libres', branch: 'mijares', fee: 'Gratis' }
    ],
    singles: [
      { id: 's1', cat: 'pokemon', name: 'Giratina V · arte alternativo', meta: 'Pokémon · NM', price: 2450, stock: '1 pieza', img: 's-giratina' },
      { id: 's2', cat: 'yugioh', name: 'Dark Magician', meta: 'Yu-Gi-Oh! · Ultra Rare · NM', price: 680, stock: '2 piezas', img: 's-magician' },
      { id: 's3', cat: 'pokemon', name: 'Charizard · holo', meta: 'Pokémon · LP', price: 1890, stock: '1 pieza', img: 's-charizard' },
      { id: 's4', cat: 'preventa', name: 'Caja de sobres · nueva expansión', meta: 'Pokémon TCG · preventa', price: 3200, stock: 'Apartados abiertos', img: 's-mano', pre: '2026-12-12T16:00:00-07:00' },
      { id: 's5', cat: 'yugioh', name: 'Lote de dioses egipcios', meta: 'Yu-Gi-Oh! · 3 cartas en case', price: 1200, stock: '1 lote', img: 's-slabs' },
      { id: 's6', cat: 'pokemon', name: 'Pikachu · Trainer Gallery', meta: 'Pokémon · NM', price: 420, stock: '3 piezas', img: 's-pikachu' },
      { id: 's7', cat: 'magic', name: 'Singles de Magic', meta: 'Commander y Modern', price: 40, from: true, stock: '+300 cartas', img: 's-mtg' },
      { id: 's8', cat: 'pokemon', name: 'Vaporeon · holo', meta: 'Pokémon · LP', price: 350, stock: '1 pieza', img: 's-vaporeon' }
    ]
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.events) && Array.isArray(d.singles)) return d;
      }
    } catch (e) { /* datos dañados o sin almacenamiento: usar los de ejemplo */ }
    return clone(DEFAULTS);
  }
  function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { /* sin almacenamiento */ } }
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // Foto de ejemplo (nombre de archivo) o foto subida (data URL)
  const imgSrc = (img, base = '') => (/^(data:|https?:|blob:)/.test(img || '') ? img : `${base}assets/img/${img}-600x800.webp`);
  const isSample = (img) => !/^(data:|https?:|blob:)/.test(img || '');

  return { KEY, GAMES, CATS, BR, DAYS, DAYS_LONG, HOURS, load, save, reset, uid, imgSrc, isSample };
})();
