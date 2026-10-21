/** Date et heure de Bruxelles au moment du build (constantes injectées par astro.config.mjs, les mêmes
 *  côté serveur et navigateur). Les pages statiques citent le tarif de ce jour ; les composants la
 *  corrigent après hydratation avec brusselsNow() (RECETTE §17.5). */
const TZ = 'Europe/Brussels';
export function brusselsNow(d = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d).split(':').map(Number);
  return { date, hour: h % 24, minute: m };
}
// Hors build Astro (tests vitest), les constantes n'existent pas : on lit l'horloge.
export const BUILD_TODAY: string = typeof __BUILD_DAY__ !== 'undefined' ? __BUILD_DAY__ : brusselsNow().date;
export const BUILD_HOUR: number = typeof __BUILD_HOUR__ !== 'undefined' ? __BUILD_HOUR__ : brusselsNow().hour;
