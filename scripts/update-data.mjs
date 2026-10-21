#!/usr/bin/env node
/**
 * Relit le tarif officiel des produits pétroliers sur be.STAT (Statbel, SPF Économie) et
 * régénère src/data/tarif.json. Lancé par .github/workflows/update-data.yml plusieurs fois par
 * jour, puis le site est reconstruit (RECETTE §22, brief du 2026-10-21).
 *
 * Source : API publique de be.STAT, vues standard publiées par Statbel sur la page
 * https://statbel.fgov.be/fr/themes/energie/prix-du-petrole . Licence : CC BY 4.0
 * (https://statbel.fgov.be/fr/open-data). Format lu : CSV, une ligne par jour et par produit,
 * colonnes « Month/Year », « Day » (ex. « 22OCT26 »), « Product group », « Product »,
 * « Price incl. VAT » ; la vue « dernier changement » ajoute « Price excl. VAT ».
 * Le jour de validité d'un tarif publié la veille figure déjà dans la série : la ligne du
 * lendemain est donc le tarif officiel de demain, pas une prévision.
 *
 * Usage : node scripts/update-data.mjs [--offline <dossier>]   (--offline relit des CSV déjà
 * téléchargés, nommés <id-de-vue>.csv, pour les tests sans réseau)
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/tarif.json');
const API_BASE = 'https://bestat.statbel.fgov.be/bestat/api/views/';
const VIEWS = {
  daily: '00881a30-7ec8-4117-93c3-c9e661b3dbd4', // tarif officiel, 365 derniers jours
  monthly: 'b2be867c-947a-47d3-8098-80a5071204b1', // moyenne mensuelle, 24 derniers mois
  yearly: 'e30e694a-3403-45ff-8bb3-df71505ac817', // moyenne annuelle, 8 dernières années
  last: '665e2960-bf86-4d64-b4a8-90f2d30ea892', // dernier tarif, hors et avec TVA
};
/** Produits retenus : clé du site → libellé exact de be.STAT. */
const PRODUCTS = {
  mazout_lt2000: 'Heating gasoil (H0/H7) (<2000L) (€/L)',
  mazout_ge2000: 'Heating gasoil (H0/H7) (>=2000L) (€/L)',
  mazout_pompe: 'Heating gasoil (H0/H7) (at the pump) (€/L)',
  diesel_b7: 'Road Diesel B7 (€/L)',
  diesel_b10: 'Road Diesel B10 (€/L)',
  e10_95: 'Euro Super 95 E10 (€/L)',
  e5_95: 'Euro Super 95 E5 (€/L)',
  e5_98: 'Super Plus 98 E5 (€/L)',
  e10_98: 'Super Plus 98 E10 (€/L)',
  lpg: 'Autogas LPG (at the pump) (€/L)',
  propane_lt2000: 'Propane in bulk (<2000L) (€/L)',
  propane_ge2000: 'Propane in bulk (>=2000L) (€/L)',
  petrole_c_pompe: 'Other kerosene type C (at the pump) (€/L)',
};
const MOIS = { JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06', JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12' };

/** Lecture CSV minimale (guillemets doubles, virgules). */
function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { cells.push(cur); cur = ''; } else cur += c;
    }
    cells.push(cur); rows.push(cells);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
/** « 22OCT26 » → « 2026-10-22 ». */
export function isoDay(s) {
  const m = /^(\d{2})([A-Z]{3})(\d{2})$/.exec(s.trim().toUpperCase());
  if (!m || !MOIS[m[2]]) throw new Error(`Jour illisible : ${s}`);
  return `20${m[3]}-${MOIS[m[2]]}-${m[1]}`;
}
const num = (s) => (s === '' || s == null ? null : Math.round(Number(s) * 10000) / 10000);

async function lire(view, offline) {
  if (offline) return readFileSync(join(offline, `${view}.csv`), 'utf8');
  const url = `${API_BASE}${view}/result/CSV`;
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'MazoutMax data refresh (contact via site)' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (essai === 3) throw new Error(`${url} : ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 3000 * essai));
    }
  }
}

export function build(csv, fetchedAt) {
  const daily = parseCsv(csv.daily), monthly = parseCsv(csv.monthly), yearly = parseCsv(csv.yearly), last = parseCsv(csv.last);
  const products = {};
  for (const [key, label] of Object.entries(PRODUCTS)) {
    const d = daily.filter((r) => r.Product === label && num(r['Price incl. VAT']) != null)
      .map((r) => [isoDay(r.Day), num(r['Price incl. VAT'])]).sort((a, b) => a[0].localeCompare(b[0]));
    if (d.length < 300) throw new Error(`${label} : ${d.length} jours seulement, attendu au moins 300`);
    for (let i = 1; i < d.length; i++) {
      const gap = (Date.parse(d[i][0]) - Date.parse(d[i - 1][0])) / 864e5;
      if (gap !== 1) throw new Error(`${label} : trou de ${gap} jours avant ${d[i][0]}`);
    }
    if (d.some(([, p]) => p < 0.2 || p > 5)) throw new Error(`${label} : prix hors bornes plausibles`);
    const m = monthly.filter((r) => r.Product === label && num(r['Average price incl. VAT']) != null)
      .map((r) => [`${r.Year}-${String(r.Month).padStart(2, '0')}`, num(r['Average price incl. VAT'])]).sort((a, b) => a[0].localeCompare(b[0]));
    const y = yearly.filter((r) => r.Product === label && num(r['Average price incl. VAT']) != null)
      .map((r) => [String(r.Year), num(r['Average price incl. VAT'])]).sort((a, b) => a[0].localeCompare(b[0]));
    const l = last.find((r) => r.Product === label);
    products[key] = {
      label,
      daily: d,
      monthly: m,
      yearly: y,
      last: l ? { day: isoDay(l.Day), incl: num(l['Price incl. VAT']), excl: num(l['Price excl. VAT']) } : null,
    };
  }
  const lastDay = products.mazout_lt2000.daily.at(-1)[0];
  return {
    _lisezmoi: 'Généré par scripts/update-data.mjs depuis be.STAT (Statbel), tarif officiel des produits pétroliers du SPF Économie, CC BY 4.0. Ne pas éditer à la main.',
    fetched_at: fetchedAt,
    last_day: lastDay,
    views: VIEWS,
    products,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--offline');
  const offline = i > 0 ? process.argv[i + 1] : null;
  const csv = {};
  for (const [k, v] of Object.entries(VIEWS)) csv[k] = await lire(v, offline);
  const fetchedAt = new Date().toISOString().slice(0, 19) + 'Z';
  const data = build(csv, fetchedAt);
  const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
  if (before && before.last_day > data.last_day) throw new Error(`Série plus ancienne que la précédente (${data.last_day} < ${before.last_day}) : fichier conservé`);
  writeFileSync(OUT, JSON.stringify(data) + '\n');
  console.log(`tarif.json : ${Object.keys(data.products).length} produits, dernier jour publié ${data.last_day}, relevé ${fetchedAt}`);
}
