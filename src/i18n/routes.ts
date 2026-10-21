import { makeRouter, type RouteDef } from './routes-core';
import { PAGES } from '../lib/guides';
export const LOCALES = ['fr', 'nl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
const R = (id: string, fr: string, nl: string, en: string, noindex = false): RouteDef<Locale> => ({ id, paths: { fr: `/fr/${fr}/`, nl: `/nl/${nl}/`, en: `/en/${en}/` }, ...(noindex ? { noindex } : {}) });
/** Pages du cœur. Les guides et les pages outils viennent de `src/content/` (lib/guides.ts). */
const CORE: RouteDef<Locale>[] = [
  { id: 'home', paths: { fr: '/fr/', nl: '/nl/', en: '/en/' } },
  R('method', 'methode', 'methode', 'method'),
  R('about', 'a-propos', 'over-ons', 'about'),
  R('widget', 'widget', 'widget', 'widget', true),
  R('contact', 'contact', 'contact', 'contact', true),
  R('editorial', 'charte-editoriale', 'redactiestatuut', 'editorial-policy', true),
  R('privacy', 'confidentialite', 'privacy', 'privacy', true),
  R('terms', 'mentions-legales', 'disclaimer', 'legal-notice', true),
  R('cookies', 'cookies', 'cookies', 'cookies', true),
];
export const ROUTES: RouteDef<Locale>[] = [
  CORE[0],
  ...PAGES.map((p) => R(p.id, p.fr.slug, p.nl.slug, p.en.slug)),
  ...CORE.slice(1),
];
export const { NOINDEX_PATHS, route, altPaths } = makeRouter(LOCALES, ROUTES);
