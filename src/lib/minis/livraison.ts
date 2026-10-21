/** Mini-simulateur : coût maximum d'une livraison de mazout au tarif officiel du jour. */
import * as M from '../engine/index';
import { REF } from './_ref';
import { T, eur, l3, jour, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Combien coûte votre livraison au prix maximum ?', 'Hoeveel kost uw levering tegen de maximumprijs?', 'What does your delivery cost at the maximum price?'),
  cta: T(l, 'Comparer avec le prix de demain', 'Vergelijken met de prijs van morgen', 'Compare with tomorrow’s price'),
  inputs: [{ id: 'litres', label: T(l, 'Litres commandés', 'Bestelde liters', 'Litres ordered'), def: 1500, unit: 'L', max: 20000 }],
  run: (v: Record<string, number>) => {
    const pLt = M.priceOn('mazout_lt2000', REF)!, pGe = M.priceOn('mazout_ge2000', REF)!;
    const c = M.livraison(v.litres, pLt, pGe);
    return {
      head: [T(l, 'Montant maximum TVA comprise', 'Maximumbedrag incl. btw', 'Maximum amount incl. VAT'), eur(c.total, l)] as [string, string],
      rows: [
        [T(l, 'Prix maximum appliqué', 'Toegepaste maximumprijs', 'Maximum price applied'), `${l3(c.prix, l)}/L`],
        [T(l, 'Palier', 'Schijf', 'Band'), c.palier === 'ge2000' ? T(l, '2 000 litres et plus', 'vanaf 2.000 liter', '2,000 litres or more') : T(l, 'moins de 2 000 litres', 'minder dan 2.000 liter', 'under 2,000 litres')],
        [T(l, 'Dont TVA (21 %)', 'Waarvan btw (21 %)', 'Of which VAT (21%)'), eur(c.tva, l)],
      ] as Array<[string, string]>,
      note: T(l, `Tarif officiel du ${jour(REF, l)} (be.STAT, Statbel).`, `Officieel tarief van ${jour(REF, l)} (be.STAT, Statbel).`, `Official tariff for ${jour(REF, l)} (be.STAT, Statbel).`),
    };
  },
});
