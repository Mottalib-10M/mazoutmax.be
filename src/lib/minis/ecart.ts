/** Mini-simulateur : prix payé face au prix maximum officiel du jour. */
import * as M from '../engine/index';
import { REF } from './_ref';
import { T, eur, l3, num, jour, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Votre devis est-il sous le prix maximum ?', 'Ligt uw offerte onder de maximumprijs?', 'Is your quote below the maximum price?'),
  cta: T(l, 'Calculer le montant de la livraison', 'Het bedrag van de levering berekenen', 'Work out the delivery amount'),
  inputs: [
    { id: 'prix', label: T(l, 'Prix proposé, TVA comprise', 'Voorgestelde prijs, incl. btw', 'Price quoted, VAT included'), def: Math.round((M.priceOn('mazout_lt2000', REF)! - 0.05) * 100) / 100, unit: '€/L', max: 5, decimals: 3 },
    { id: 'litres', label: T(l, 'Litres', 'Liter', 'Litres'), def: 1500, unit: 'L', max: 20000 },
  ],
  run: (v: Record<string, number>) => {
    const pLt = M.priceOn('mazout_lt2000', REF)!, pGe = M.priceOn('mazout_ge2000', REF)!;
    const max = v.litres >= 2000 ? pGe : pLt;
    const diff = M.ecart(v.litres, max, v.prix);
    return {
      head: [diff >= 0 ? T(l, 'Sous le maximum de', 'Onder het maximum met', 'Below the maximum by') : T(l, 'Au-dessus du maximum de', 'Boven het maximum met', 'Above the maximum by'), eur(Math.abs(diff), l, 2)] as [string, string],
      rows: [
        [T(l, `Prix maximum du ${jour(REF, l)}`, `Maximumprijs van ${jour(REF, l)}`, `Maximum price on ${jour(REF, l)}`), `${l3(max, l)}/L`],
        [T(l, 'Votre prix', 'Uw prijs', 'Your price'), `${l3(v.prix, l)}/L`],
        [T(l, 'Écart par litre', 'Verschil per liter', 'Difference per litre'), `${num((max - v.prix) * 100, l, 1)} c`],
      ] as Array<[string, string]>,
      note: diff < 0 ? T(l, 'Un prix au-dessus du maximum est interdit : demandez la correction au négociant.', 'Een prijs boven het maximum is verboden: vraag de handelaar om correctie.', 'A price above the maximum is not allowed: ask the dealer to correct it.') : undefined,
    };
  },
});
