/**
 * Lecture du tarif officiel (be.STAT) : prix d'un jour, tarif de demain s'il est publié,
 * évolution, moyennes, et estimation du prochain jour non publié.
 *
 * Estimation (méthode publiée sur la page Méthode) : le contrat-programme calcule le prix
 * maximum à partir de cotations internationales payantes que le site ne peut pas lire. On
 * n'invente donc pas de cotation : le prix central estimé est le dernier tarif publié (sur les
 * 365 derniers jours, c'est l'estimateur qui se trompe le moins, voir les tests), entouré de
 * la fourchette des variations réellement observées le même jour de la semaine, avec la
 * probabilité qu'un nouveau tarif entre en vigueur ce jour-là. L'écart moyen constaté de cet
 * estimateur sur 4 et 52 semaines est publié à côté.
 */
import { TARIF } from './params';

export type Prod = keyof typeof TARIF.products;
export type Pt = [string, number];
export const PRODS = Object.keys(TARIF.products) as Prod[];
export const LAST_DAY: string = TARIF.last_day;
export const FETCHED_AT: string = TARIF.fetched_at;

const S = TARIF.products as Record<Prod, { daily: Pt[]; monthly: Pt[]; yearly: Pt[]; last: { day: string; incl: number; excl: number | null } | null }>;
export const series = (k: Prod): Pt[] => S[k].daily;
export const monthly = (k: Prod): Pt[] => S[k].monthly;
export const yearly = (k: Prod): Pt[] => S[k].yearly;
export const lastTariff = (k: Prod) => S[k].last;

export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
/** 0 = dimanche … 6 = samedi. */
export const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/** Prix maximum en vigueur un jour donné (null hors de la série). */
export function priceOn(k: Prod, day: string): number | null {
  const s = series(k);
  if (day < s[0][0] || day > s[s.length - 1][0]) return null;
  const i = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${s[0][0]}T00:00:00Z`)) / 864e5);
  return s[i]?.[0] === day ? s[i][1] : (s.find((p) => p[0] === day)?.[1] ?? null);
}

/** Dernier jour d'entrée en vigueur d'un nouveau tarif, au plus tard `day`. */
export function lastChange(k: Prod, day: string = LAST_DAY): { day: string; price: number; before: number } | null {
  const s = series(k).filter((p) => p[0] <= day);
  for (let i = s.length - 1; i > 0; i--) if (Math.abs(s[i][1] - s[i - 1][1]) > 1e-9) return { day: s[i][0], price: s[i][1], before: s[i - 1][1] };
  return null;
}

/** Variations jour à jour de la série (la variation du jour d est prix(d) − prix(d − 1)). */
export function changes(k: Prod): Array<{ day: string; delta: number }> {
  const s = series(k);
  return s.slice(1).map((p, i) => ({ day: p[0], delta: Math.round((p[1] - s[i][1]) * 10000) / 10000 }));
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const pos = (a.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi] - a[lo]) * (pos - lo);
};

export interface ChangeStats { days: number; changed: number; prob: number; p10: number; p90: number; meanAbs: number; up: number; down: number }
/** Fréquence et ampleur des changements, sur toute la série ou pour un jour de la semaine. */
export function changeStats(k: Prod, wd?: number): ChangeStats {
  const c = changes(k).filter((x) => wd === undefined || weekday(x.day) === wd);
  const nz = c.filter((x) => Math.abs(x.delta) > 1e-9);
  return {
    days: c.length, changed: nz.length, prob: c.length ? nz.length / c.length : 0,
    p10: quantile(c.map((x) => x.delta), 0.1), p90: quantile(c.map((x) => x.delta), 0.9),
    meanAbs: nz.length ? nz.reduce((t, x) => t + Math.abs(x.delta), 0) / nz.length : 0,
    up: nz.filter((x) => x.delta > 0).length, down: nz.filter((x) => x.delta < 0).length,
  };
}

/** Écart moyen (valeur absolue) de l'estimateur « pas de changement » sur les n derniers jours. */
export function backtest(k: Prod, n = 364): { days: number; mae: number; within1c: number } {
  const c = changes(k).slice(-n);
  const mae = c.reduce((t, x) => t + Math.abs(x.delta), 0) / (c.length || 1);
  return { days: c.length, mae, within1c: c.filter((x) => Math.abs(x.delta) <= 0.01 + 1e-9).length / (c.length || 1) };
}

export interface Estimate { day: string; central: number; low: number; high: number; prob: number; mae4w: number; mae52w: number; basis: ChangeStats }
/** Estimation pour `day`, à partir du dernier tarif publié. */
export function estimate(k: Prod, day: string = addDays(LAST_DAY, 1)): Estimate {
  const base = priceOn(k, LAST_DAY)!;
  const st = changeStats(k, weekday(day));
  return {
    day, central: base, low: Math.min(base, base + st.p10), high: Math.max(base, base + st.p90), prob: st.prob,
    mae4w: backtest(k, 28).mae, mae52w: backtest(k, 364).mae, basis: st,
  };
}

export interface Situation { today: string; price: number | null; stale: boolean; tomorrow: { day: string; official: true; price: number; delta: number } | { day: string; official: false; est: Estimate } }
/** Ce que le site affiche « aujourd'hui » et « demain » pour un jour de référence. */
export function situation(k: Prod, today: string): Situation {
  const stale = today > LAST_DAY;
  const ref = stale ? LAST_DAY : today;
  const price = priceOn(k, ref);
  const tom = addDays(ref, 1);
  const pt = priceOn(k, tom);
  if (pt != null && price != null) return { today: ref, price, stale, tomorrow: { day: tom, official: true, price: pt, delta: Math.round((pt - price) * 10000) / 10000 } };
  return { today: ref, price, stale, tomorrow: { day: tom, official: false, est: estimate(k, tom) } };
}

/** Prix d'un jour passé ; si ce jour précède de 3 jours au plus le début de la fenêtre de 365 jours,
 *  le premier jour de la série (« il y a un an » vu depuis la veille du dernier jour publié). */
export function priceNear(k: Prod, day: string): number | null {
  const s0 = series(k)[0][0];
  return priceOn(k, day < s0 && Date.parse(s0) - Date.parse(day) <= 3 * 864e5 ? s0 : day);
}

/** Variation sur n jours (prix du dernier jour publié moins prix n jours plus tôt). */
export function evolution(k: Prod, n: number, day: string = LAST_DAY): number | null {
  const a = priceOn(k, day), b = priceNear(k, addDays(day, -n));
  return a == null || b == null ? null : Math.round((a - b) * 10000) / 10000;
}
export function range(k: Prod, n = 365, day: string = LAST_DAY): { min: Pt; max: Pt; mean: number } {
  const s = series(k).filter((p) => p[0] <= day).slice(-n);
  let min = s[0], max = s[0];
  for (const p of s) { if (p[1] < min[1]) min = p; if (p[1] > max[1]) max = p; }
  return { min, max, mean: s.reduce((t, p) => t + p[1], 0) / s.length };
}
/** Moyenne d'un mois calendaire calculée sur la série quotidienne (null si le mois est incomplet). */
export function monthMean(k: Prod, ym: string): number | null {
  const s = series(k).filter((p) => p[0].startsWith(ym));
  const [y, m] = ym.split('-').map(Number);
  const nDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return s.length === nDays ? s.reduce((t, p) => t + p[1], 0) / s.length : null;
}
