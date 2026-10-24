/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://mazoutmax.be";
export const SITE_NAMES: Record<string, string> = {"fr": "MazoutMax", "nl": "MazoutMax", "en": "MazoutMax"};
export const LANG_TAGS: Record<string, string> = {"fr": "fr-BE", "nl": "nl-BE", "en": "en-BE"};
export const OG_LOCALES: Record<string, string> = {"fr": "fr_BE", "nl": "nl_BE", "en": "en_GB"};
export const LOCALE_TAG = 'fr-BE';
/** Format des nombres par langue de page : belge en français et en néerlandais, britannique en anglais. */
export const LOCALE_BY_LANG: Record<string, string> = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' };
export const CURRENCY = 'EUR';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
import TARIF_JSON from './tarif.json';
/** Date du dernier relevé du tarif officiel (scripts/update-data.mjs) : elle bouge avec les données. */
export const LAST_UPDATED: string = TARIF_JSON.fetched_at.slice(0, 10);
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"fr": "Éditeur de calculateurs sur le prix maximum officiel du mazout et des carburants en Belgique", "nl": "Uitgever van rekenhulpen over de officiële maximumprijs van mazout en brandstoffen in België", "en": "Publisher of calculators on Belgium's official maximum price for heating oil and road fuels"};
export const AUTHOR_DESC: Record<string, string> = {"fr": "Radif Partners relit chaque jour le tarif officiel des produits pétroliers diffusé par Statbel sur be.STAT, puis le transforme en coût de livraison de citerne, en budget de chauffage et en prix du plein, sans demander d'adresse ni de numéro de téléphone.", "nl": "Radif Partners leest elke dag het officiële tarief van de aardolieproducten dat Statbel op be.STAT verspreidt, en rekent het om naar de kost van een tanklevering, een stookbudget en de prijs van een volle tank, zonder om een adres of telefoonnummer te vragen.", "en": "Radif Partners reads the official Belgian petroleum tariff released by Statbel on be.STAT every day and turns it into the cost of a tank delivery, a heating budget and the price of a full tank, without asking for an address or a phone number."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"fr": ["Prix maximum officiel du gasoil de chauffage", "Contrat-programme des produits pétroliers", "Prix du diesel B7 et de l'essence E10 en Belgique", "Allocation du Fonds Social Chauffage", "Budget de chauffage au mazout"], "nl": ["Officiële maximumprijs van huisbrandolie", "Programmaovereenkomst voor aardolieproducten", "Prijs van diesel B7 en benzine E10 in België", "Toelage van het Sociaal Verwarmingsfonds", "Stookbudget met mazout"], "en": ["Official maximum price of Belgian heating oil", "Belgian programme contract for petroleum products", "Diesel B7 and E10 petrol prices in Belgium", "Social Heating Fund allowance", "Heating-oil budgeting"]};
export const CONTACT_EMAIL = "contact@mazoutmax.be";
export const THEME_COLOR = '#A3141F';
export const LOGO_SYMBOL = 'L';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime : 'none' pour tous les sites (RECETTE §15.6, décision de l'éditeur du 2026-10-06) :
 *  aucun bandeau ; Clarity chargé en mode sans cookie (consentv2 denied) ; GA4 avec cookies si GA4_ID.
 *  'opt-in' / 'notice' ne servent plus qu'aux sites anciens qui les portent encore. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
/** Propriété Google Analytics 4 (décision de l'éditeur du 2026-10-17, RECETTE §15.6) : GA4 normal,
 *  avec cookies _ga / _ga_<ID> (390 jours), sans bandeau, publicité refusée. Créée par
 *  `seo-platform/scripts/create-ga4.ts accounts/372759688` (RECETTE §15.3, étape 15), puis
 *  pages légales régénérées : `python3 scripts/gen-legal-pages.py .`. Vide = pas de GA4. */
export const GA4_ID = 'G-JR1Y6XQ3RS';
/** Projet Microsoft Clarity (compte amradif), chargé sans cookie. Vide = aucune mesure. */
export const CLARITY_ID = 'z2609tsei8';
export const INDEXNOW_KEY = '766819f64a3d28ee5b8b7ddbec865c4f';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',            // raison sociale ou nom commercial exploité
  legalForm: '',  // vide : publication à titre personnel, pas de société
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "TVA",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
