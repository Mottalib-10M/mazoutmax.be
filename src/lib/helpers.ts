/** Fabrique les outils d'écriture (`Helpers`) passés au corps de chaque page. */
import { route, ROUTES, type Locale } from '../i18n/routes';
import { P, sourceUrl } from './engine/params';
import type { SourceKey } from './engine/params';
import * as M from './engine/index';
import type { Helpers } from './guide-types';
import { formatMoney, formatNumber, formatPercent, displayDate } from './format';
import { LANG_TAGS } from '../data/site-config';

/** « < 2 000 L » dans une cellule : un « < » suivi d'une espace ou d'un chiffre n'est pas une balise. */
const lt = (s: string) => s.replace(/<(?=[\s\d])/g, '&lt;');
const esc = (s: string | number) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;');
/** Jour cité par les pages : le jour du build, ou le dernier jour publié s'il est antérieur. */
export { REF as REF_DAY } from './minis/_ref';
import { REF as REF_DAY } from './minis/_ref';

export function helpers(lang: Locale): Helpers {
  const T = <A,>(fr: A, nl: A, en: A) => (lang === 'en' ? en : lang === 'nl' ? nl : fr);
  return {
    lang, P, M, T, today: REF_DAY,
    l3: (n) => formatMoney(n, 3, lang),
    cts: (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${formatNumber(Math.abs(d) * 100, 1, lang)} ${T('c', 'cent', 'c')}`,
    a: (id, text) => (ROUTES.some((r) => r.id === id) ? `<a href="${route(id, lang)}">${text}</a>` : text),
    eur: (n, d = 0) => formatMoney(n, d, lang),
    num: (n, d = 0) => formatNumber(n, d, lang),
    pct: (x, d = 1) => formatPercent(x, d, lang),
    date: (iso) => displayDate(iso, LANG_TAGS[lang]),
    src: (key: SourceKey, text?: string) => { const s = P.sources[key]; return `<a href="${sourceUrl(key, lang)}" target="_blank" rel="nofollow noopener noreferrer">${text ?? s.label[lang]}</a>`; },
    table: (headers, rows, caption, align = []) => {
      const al = (i: number) => (align[i] === 'r' ? 'text-right' : 'text-left');
      return `<div class="not-prose my-6 overflow-x-auto"><table class="w-full text-sm">${caption ? `<caption class="mb-2 text-left text-sm text-navy-600">${caption}</caption>` : ''}<thead><tr>${headers.map((h, i) => `<th scope="col" class="border-b border-navy-300 bg-navy-50 px-3 py-2 font-semibold text-navy-900 ${al(i)}">${lt(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, ri) => `<tr class="${ri % 2 ? 'bg-navy-50/40' : ''}">${r.map((c, i) => `<td class="tabular-nums border-b border-navy-100 px-3 py-2 text-navy-800 ${al(i)}">${typeof c === 'number' ? esc(formatNumber(c, 0, lang)) : lt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    },
  };
}
