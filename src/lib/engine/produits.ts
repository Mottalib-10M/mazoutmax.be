/** Noms des produits du tarif officiel dans les trois langues, et familles utilisées par les pages. */
import type { Prod } from './tarif';

export type L3 = { fr: string; nl: string; en: string };
export const NOM: Record<Prod, L3> = {
  mazout_lt2000: { fr: 'Mazout de chauffage, moins de 2 000 litres', nl: 'Mazout (gasolie verwarming), minder dan 2.000 liter', en: 'Heating oil, under 2,000 litres' },
  mazout_ge2000: { fr: 'Mazout de chauffage, 2 000 litres et plus', nl: 'Mazout (gasolie verwarming), vanaf 2.000 liter', en: 'Heating oil, 2,000 litres or more' },
  mazout_pompe: { fr: 'Mazout de chauffage à la pompe', nl: 'Mazout aan de pomp', en: 'Heating oil at the pump' },
  diesel_b7: { fr: 'Diesel B7', nl: 'Diesel B7', en: 'Diesel B7' },
  diesel_b10: { fr: 'Diesel B10', nl: 'Diesel B10', en: 'Diesel B10' },
  e10_95: { fr: 'Essence 95 E10', nl: 'Benzine 95 E10', en: 'Petrol 95 E10' },
  e5_95: { fr: 'Essence 95 E5', nl: 'Benzine 95 E5', en: 'Petrol 95 E5' },
  e5_98: { fr: 'Essence 98 E5', nl: 'Benzine 98 E5', en: 'Petrol 98 E5' },
  e10_98: { fr: 'Essence 98 E10', nl: 'Benzine 98 E10', en: 'Petrol 98 E10' },
  lpg: { fr: 'LPG (autogaz) à la pompe', nl: 'LPG (autogas) aan de pomp', en: 'LPG (autogas) at the pump' },
  propane_lt2000: { fr: 'Propane en vrac, moins de 2 000 litres', nl: 'Propaan in bulk, minder dan 2.000 liter', en: 'Bulk propane, under 2,000 litres' },
  propane_ge2000: { fr: 'Propane en vrac, 2 000 litres et plus', nl: 'Propaan in bulk, vanaf 2.000 liter', en: 'Bulk propane, 2,000 litres or more' },
  petrole_c_pompe: { fr: 'Pétrole lampant (type C) à la pompe', nl: 'Lampolie (type C) aan de pomp', en: 'Kerosene (type C) at the pump' },
};
/** Nom court, pour les tableaux et les boutons. */
export const COURT: Record<Prod, L3> = {
  mazout_lt2000: { fr: 'Mazout < 2 000 L', nl: 'Mazout < 2.000 l', en: 'Heating oil < 2,000 L' },
  mazout_ge2000: { fr: 'Mazout ≥ 2 000 L', nl: 'Mazout ≥ 2.000 l', en: 'Heating oil ≥ 2,000 L' },
  mazout_pompe: { fr: 'Mazout à la pompe', nl: 'Mazout aan de pomp', en: 'Heating oil, pump' },
  diesel_b7: { fr: 'Diesel B7', nl: 'Diesel B7', en: 'Diesel B7' },
  diesel_b10: { fr: 'Diesel B10', nl: 'Diesel B10', en: 'Diesel B10' },
  e10_95: { fr: '95 E10', nl: '95 E10', en: '95 E10' },
  e5_95: { fr: '95 E5', nl: '95 E5', en: '95 E5' },
  e5_98: { fr: '98 E5', nl: '98 E5', en: '98 E5' },
  e10_98: { fr: '98 E10', nl: '98 E10', en: '98 E10' },
  lpg: { fr: 'LPG', nl: 'LPG', en: 'LPG' },
  propane_lt2000: { fr: 'Propane < 2 000 L', nl: 'Propaan < 2.000 l', en: 'Propane < 2,000 L' },
  propane_ge2000: { fr: 'Propane ≥ 2 000 L', nl: 'Propaan ≥ 2.000 l', en: 'Propane ≥ 2,000 L' },
  petrole_c_pompe: { fr: 'Pétrole lampant', nl: 'Lampolie', en: 'Kerosene' },
};
/** Familles : le premier produit est celui que la page met en avant. */
export const FAMILLE: Record<string, Prod[]> = {
  mazout: ['mazout_lt2000', 'mazout_ge2000', 'mazout_pompe'],
  diesel: ['diesel_b7', 'diesel_b10'],
  essence: ['e10_95', 'e5_95', 'e5_98', 'e10_98'],
  e5_98: ['e5_98', 'e10_98', 'e10_95'],
  lpg: ['lpg'],
  carburants: ['diesel_b7', 'diesel_b10', 'e10_95', 'e5_95', 'e5_98', 'e10_98', 'lpg'],
  chauffage: ['mazout_lt2000', 'mazout_ge2000', 'mazout_pompe', 'petrole_c_pompe', 'propane_lt2000', 'propane_ge2000'],
  tout: ['mazout_lt2000', 'mazout_ge2000', 'mazout_pompe', 'diesel_b7', 'diesel_b10', 'e10_95', 'e5_95', 'e5_98', 'e10_98', 'lpg', 'petrole_c_pompe', 'propane_lt2000', 'propane_ge2000'],
};
/** Volume type du calcul : une livraison de citerne pour le mazout, un plein pour une voiture. */
export const VOLUME_TYPE: Partial<Record<Prod, number>> = { mazout_lt2000: 1000, mazout_ge2000: 2000, mazout_pompe: 20, petrole_c_pompe: 20, propane_lt2000: 1000, propane_ge2000: 2000 };
export const volumeType = (k: Prod) => VOLUME_TYPE[k] ?? 50;
const JOURS: L3[] = [
  { fr: 'dimanche', nl: 'zondag', en: 'Sunday' }, { fr: 'lundi', nl: 'maandag', en: 'Monday' }, { fr: 'mardi', nl: 'dinsdag', en: 'Tuesday' },
  { fr: 'mercredi', nl: 'woensdag', en: 'Wednesday' }, { fr: 'jeudi', nl: 'donderdag', en: 'Thursday' }, { fr: 'vendredi', nl: 'vrijdag', en: 'Friday' }, { fr: 'samedi', nl: 'zaterdag', en: 'Saturday' },
];
export const nomJour = (wd: number, l: keyof L3) => JOURS[wd][l];
