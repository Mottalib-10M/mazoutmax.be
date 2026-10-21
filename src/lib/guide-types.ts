/**
 * Une page (guide ou page outil) = UN fichier de données dans `src/content/guides/` ou `outils/`.
 * Il porte les trois langues (fr, nl, en), le texte, la FAQ, les sources, le mini-simulateur et les
 * liens ; le cœur du site (routes, menus, pied de page, sitemap, hreflang, schémas, maillage) le lit seul.
 */
import type { SourceKey, Params } from './engine/params';

export type Lang = 'fr' | 'nl' | 'en';
export type Group = 'mazout' | 'carburants' | 'comprendre';
/** Outil affiché en tête d'une page outil (components/outils/Tools.tsx). */
export type Tool = 'demain' | 'seuil' | 'historique' | 'budgetChauffage' | 'allocation' | 'produit' | 'tableau' | 'budgetVoiture';
export interface FAQ { q: string; a: string }

/** Outils d'écriture passés au corps : liens internes, nombres au format de la langue, moteur. */
export interface Helpers {
  lang: Lang;
  /** Choisit le texte de la langue de la page. */
  T: <A>(fr: A, nl: A, en: A) => A;
  a: (id: string, text: string) => string;
  eur: (n: number, decimals?: number) => string;
  num: (n: number, decimals?: number) => string;
  pct: (x: number, decimals?: number) => string;
  /** Prix au litre tel que le tarif officiel l'écrit, 3 décimales (« 1,588 € »). */
  l3: (n: number) => string;
  /** Variation au litre signée, en centimes (« +3,1 c »). */
  cts: (delta: number) => string;
  date: (iso: string) => string;
  table: (headers: string[], rows: Array<Array<string | number>>, caption?: string, align?: Array<'l' | 'r'>) => string;
  src: (key: SourceKey, text?: string) => string;
  P: Params;
  M: typeof import('./engine/index');
  /** Jour de référence du build (heure de Bruxelles), ramené au dernier jour publié si besoin. */
  today: string;
}

export interface PageText {
  slug: string;
  nav: string;
  card: string;
  /** 50 à 60 caractères, terme-clé en tête, année comprise (RECETTE §11). */
  title: string;
  /** 150 à 160 caractères. */
  description: string;
  h1: string;
  intro: string;
  /** Bloc citable : UN paragraphe d'au moins 120 mots (RECETTE §21). */
  resume: (h: Helpers) => string;
  faqs: (h: Helpers) => FAQ[];
  body: (h: Helpers) => string;
}

export interface PageDef {
  id: string;
  group: Group;
  order: number;
  mini?: string;
  miniHref?: string;
  tool?: Tool;
  /** Paramètre de l'outil : produit ('mazout', 'diesel', 'essence', 'e5_98', 'lpg'…) ou famille. */
  toolArg?: string;
  related: string[];
  sources: SourceKey[];
  fr: PageText;
  nl: PageText;
  en: PageText;
}
export const defineGuide = (g: PageDef): PageDef => g;
