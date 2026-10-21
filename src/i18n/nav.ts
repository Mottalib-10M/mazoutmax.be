import { route, type Locale } from './routes';
import { PAGES, pageById, GROUPS } from '../lib/guides';
import type { Group } from '../lib/guide-types';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const CORE: Record<Locale, Record<string, string>> = {
  fr: { home: 'Prix du mazout aujourd’hui', method: 'Méthode et sources', about: 'À propos', widget: 'Intégrer le tableau', contact: 'Contact', editorial: 'Charte éditoriale', privacy: 'Confidentialité', terms: 'Mentions légales', cookies: 'Cookies' },
  nl: { home: 'Mazoutprijs vandaag', method: 'Methode en bronnen', about: 'Over ons', widget: 'Tabel insluiten', contact: 'Contact', editorial: 'Redactiestatuut', privacy: 'Privacy', terms: 'Disclaimer', cookies: 'Cookies' },
  en: { home: 'Heating oil price today', method: 'Method and sources', about: 'About', widget: 'Embed the table', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies' },
};
const GROUP_LABEL: Record<Locale, Record<Group, string>> = {
  fr: { mazout: 'Mazout', carburants: 'Carburants', comprendre: 'Comprendre le prix' },
  nl: { mazout: 'Mazout', carburants: 'Brandstoffen', comprendre: 'De prijs begrijpen' },
  en: { mazout: 'Heating oil', carburants: 'Road fuels', comprendre: 'Understanding the price' },
};
const SITE: Record<Locale, string> = { fr: 'Le site', nl: 'De site', en: 'Site' };
export const label = (id: string, lang: Locale) => CORE[lang][id] ?? pageById(id)?.[lang].nav ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
const inGroup = (g: Group, lang: Locale) => PAGES.filter((p) => p.group === g).sort((a, b) => Number(!!b.tool) - Number(!!a.tool) || a.order - b.order).map((p) => link(p.id, lang));
export function navCategories(lang: Locale): NavCategory[] {
  return GROUPS.map((g) => ({ label: GROUP_LABEL[lang][g], links: inGroup(g, lang) })).filter((c) => c.links.length);
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang), { label: SITE[lang], links: ['home', 'method', 'about', 'contact', 'editorial', 'widget', 'terms', 'privacy', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (_lang: Locale): NavLink[] => [];
