/** Coûts calculés sur le prix maximum : livraison de citerne, plein, budgets, allocation du Fonds Social Chauffage. */
import { P } from './params';

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Le tarif officiel distingue les commandes de moins de 2 000 litres et celles d'au moins 2 000 litres. */
export const palier = (litres: number): 'lt2000' | 'ge2000' => (litres >= P.seuil_litres ? 'ge2000' : 'lt2000');

/** Coût maximum d'une livraison : volume × prix du palier qui s'applique à ce volume. */
export function livraison(litres: number, pLt: number, pGe: number) {
  const v = Math.max(0, litres);
  const t = palier(v);
  const prix = t === 'ge2000' ? pGe : pLt;
  return { palier: t, prix, total: r2(v * prix), tva: r2((v * prix * P.tva) / (1 + P.tva)) };
}

/** Le seuil de 2 000 litres : à partir de quel volume il coûte autant de commander 2 000 litres. */
export function seuil2000(litres: number, pLt: number, pGe: number) {
  const cur = livraison(litres, pLt, pGe);
  const a2000 = livraison(P.seuil_litres, pLt, pGe);
  // volume sous 2 000 litres qui coûte autant que 2 000 litres au palier supérieur
  const equivalent = (P.seuil_litres * pGe) / pLt;
  return {
    actuel: cur, a2000, equivalent,
    surcout2000: r2(a2000.total - cur.total), litresEnPlus: Math.max(0, P.seuil_litres - litres),
    economieParLitre: r2((pLt - pGe) * 1000) / 1000,
    // coût d'un litre supplémentaire si l'on monte à 2 000 litres
    coutMarginal: litres < P.seuil_litres && litres > 0 ? (a2000.total - cur.total) / (P.seuil_litres - litres) : null,
  };
}

/** Budget annuel de chauffage au mazout : litres par an × prix, et le mois moyen. */
export function budgetChauffage(litresAn: number, prix: number) {
  const total = r2(Math.max(0, litresAn) * prix);
  return { total, mois: r2(total / 12) };
}

/** Plein d'un réservoir. */
export const plein = (litres: number, prix: number) => r2(Math.max(0, litres) * prix);

/** Budget carburant d'une voiture : kilomètres par an × consommation aux 100 km × prix. */
export function budgetVoiture(kmAn: number, conso100: number, prix: number) {
  const litres = (Math.max(0, kmAn) * Math.max(0, conso100)) / 100;
  const total = r2(litres * prix);
  return { litres, total, mois: r2(total / 12), parKm: kmAn > 0 ? total / kmAn : 0 };
}

/** Écart entre deux prix au litre sur un volume (deux produits, ou prix payé et prix maximum). */
export const ecart = (litres: number, a: number, b: number) => r2(Math.max(0, litres) * (a - b));

/** Allocation de volume du Fonds Social Chauffage (barème en vigueur, plafond de litres par année civile). */
export function allocation(prixFacture: number, litres: number, dejaAides = 0) {
  const ligne = P.fonds.bareme.find((b) => b.jusqua == null || prixFacture < b.jusqua)!;
  const restant = Math.max(0, P.fonds.litres_max_an - Math.max(0, dejaAides));
  const retenus = Math.min(Math.max(0, litres), restant);
  return { cents: ligne.cents, litresRetenus: retenus, montant: r2((retenus * ligne.cents) / 100), plafondAtteint: litres > restant };
}

/** Plafond de revenus du Fonds Social Chauffage (catégorie 2) selon le nombre de personnes à charge. */
export const plafondRevenus = (charges: number) => r2(P.fonds.revenu_plafond + Math.max(0, Math.floor(charges)) * P.fonds.revenu_par_charge);
