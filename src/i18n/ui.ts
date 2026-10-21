import type { Locale } from './routes';
const fr = {
  updatedOn: 'Mis à jour le', editorialPolicy: 'Charte éditoriale', contactLabel: 'Contact', reviewedBy: 'Vérifié par',
  skipToContent: 'Aller au contenu', mainNav: 'Navigation principale', breadcrumbLabel: 'Fil d’Ariane', breadcrumbHome: 'Accueil', menuOpen: 'Ouvrir le menu',
  faqTitle: 'Questions fréquentes', relatedCalculators: 'Pages et calculs associés', sourcesTitle: 'Sources', writtenBy: 'Rédigé par',
  asOf: 'Tarif officiel', lastUpdated: 'relevé le', footerValidated: 'Source : tarif officiel des produits pétroliers, Statbel (be.STAT)', footerBrowser: '100 % dans votre navigateur · aucune adresse ni aucun numéro demandés · gratuit',
  footerDisclaimer: 'Site indépendant édité par Radif Partners, sans lien avec le SPF Économie, Statbel, le Fonds Social Chauffage ni aucun négociant. Les prix affichés sont les prix maximums du tarif officiel publié par Statbel ; les montants sont des calculs à partir de vos saisies, et l’estimation du jour suivant n’est qu’une estimation. Votre facture fait foi. Aucune donnée collectée, aucune mise en relation commerciale.', footerPopular: '', notFound: 'Cette page n’existe pas.',
  readMore: 'Lire la suite',
};
const nl: typeof fr = {
  updatedOn: 'Bijgewerkt op', editorialPolicy: 'Redactiestatuut', contactLabel: 'Contact', reviewedBy: 'Nagekeken door',
  skipToContent: 'Naar de inhoud', mainNav: 'Hoofdnavigatie', breadcrumbLabel: 'Kruimelpad', breadcrumbHome: 'Home', menuOpen: 'Menu openen',
  faqTitle: 'Veelgestelde vragen', relatedCalculators: 'Verwante pagina’s en berekeningen', sourcesTitle: 'Bronnen', writtenBy: 'Geschreven door',
  asOf: 'Officieel tarief', lastUpdated: 'opgehaald op', footerValidated: 'Bron: officieel tarief van de aardolieproducten, Statbel (be.STAT)', footerBrowser: '100 % in uw browser · geen adres of telefoonnummer gevraagd · gratis',
  footerDisclaimer: 'Onafhankelijke site van Radif Partners, zonder band met de FOD Economie, Statbel, het Sociaal Verwarmingsfonds of een handelaar. De getoonde prijzen zijn de maximumprijzen uit het officiële tarief dat Statbel publiceert; de bedragen zijn berekeningen op basis van uw invoer, en de schatting voor de volgende dag is alleen een schatting. Uw factuur is bepalend. Geen gegevens verzameld, geen commerciële doorverwijzing.', footerPopular: '', notFound: 'Deze pagina bestaat niet.',
  readMore: 'Lees verder',
};
const en: typeof fr = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Checked by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Frequently asked questions', relatedCalculators: 'Related pages and calculations', sourcesTitle: 'Sources', writtenBy: 'Written by',
  asOf: 'Official tariff', lastUpdated: 'read on', footerValidated: 'Source: official tariff of petroleum products, Statbel (be.STAT)', footerBrowser: '100% in your browser · no address or phone number asked · free',
  footerDisclaimer: 'Independent site published by Radif Partners, with no link to the FPS Economy, Statbel, the Social Heating Fund or any dealer. Prices shown are the maximum prices of the official tariff published by Statbel; amounts are calculations from your inputs, and the next-day figure is an estimate only, which does not replace the official tariff. Your invoice is what counts. No data collected, no sales referrals.', footerPopular: '', notFound: 'This page does not exist.',
  readMore: 'Read more',
};
export function t(lang: Locale) { return lang === 'en' ? en : lang === 'nl' ? nl : fr; }
