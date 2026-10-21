/** Mini-simulateur : fréquence des nouveaux tarifs selon le jour de la semaine, sur un an. */
import * as M from '../engine/index';
import { T, pct, num, l3, type L } from './_kit';
const PRODS: M.Prod[] = ['mazout_lt2000', 'diesel_b7', 'e10_95', 'lpg'];
export default (l: L) => ({
  title: T(l, 'Le prix change-t-il souvent ce jour-là ?', 'Verandert de prijs vaak op die dag?', 'Does the price often change on that day?'),
  cta: T(l, 'Voir le prix de demain', 'De prijs van morgen bekijken', 'See tomorrow’s price'),
  inputs: [
    { id: 'p', label: T(l, 'Produit', 'Product', 'Product'), def: 0, options: PRODS.map((k, i) => ({ value: String(i), label: M.COURT[k][l] })) },
    { id: 'j', label: T(l, 'Jour de la semaine', 'Weekdag', 'Day of the week'), def: 2, options: [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: M.nomJour(d, l) })) },
  ],
  run: (v: Record<string, number>) => {
    const k = PRODS[v.p] ?? PRODS[0];
    const s = M.changeStats(k, v.j);
    return {
      head: [T(l, 'Part des jours avec un nouveau tarif', 'Aandeel dagen met een nieuw tarief', 'Share of days with a new tariff'), pct(s.prob, l, 0)] as [string, string],
      rows: [
        [T(l, 'Jours observés', 'Waargenomen dagen', 'Days observed'), num(s.days, l)],
        [T(l, 'Hausses / baisses', 'Stijgingen / dalingen', 'Rises / falls'), `${num(s.up, l)} / ${num(s.down, l)}`],
        [T(l, 'Variation moyenne quand il change', 'Gemiddelde wijziging als hij verandert', 'Average change when it moves'), s.changed ? `${l3(s.meanAbs, l)}/L` : '–'],
      ] as Array<[string, string]>,
    };
  },
});
