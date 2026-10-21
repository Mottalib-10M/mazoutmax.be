/** Petits outils communs aux mini-simulateurs (fichier ignoré par le registre : préfixe « _ »). */
import { formatMoney, formatPercent, formatNumber } from '../format';
export type L = 'fr' | 'nl' | 'en';
export const T = <A>(l: L, fr: A, nl: A, en: A) => (l === 'en' ? en : l === 'nl' ? nl : fr);
export const eur = (x: number, l: L, d = 0) => formatMoney(x, d, l);
/** Prix au litre à 3 décimales, comme le tarif officiel. */
export const l3 = (x: number, l: L) => formatMoney(x, 3, l);
export const pct = (x: number, l: L, d = 1) => formatPercent(x, d, l);
export const num = (x: number, l: L, d = 0) => formatNumber(x, d, l);
import { displayDate } from '../format';
import { LANG_TAGS } from '../../data/site-config';
/** « 22 octobre 2026 » / « 22 oktober 2026 » / « 22 October 2026 ». */
export const jour = (iso: string, l: L) => displayDate(iso, LANG_TAGS[l]);
