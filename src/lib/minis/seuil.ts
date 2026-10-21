/** Mini-simulateur : faut-il monter à 2 000 litres ? */
import * as M from '../engine/index';
import { REF } from './_ref';
import { T, eur, l3, num, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Monter à 2 000 litres : combien en plus ?', 'Naar 2.000 liter: hoeveel extra?', 'Going up to 2,000 litres: how much more?'),
  cta: T(l, 'Le calcul complet du seuil', 'De volledige berekening van de drempel', 'The full threshold calculation'),
  inputs: [{ id: 'litres', label: T(l, 'Litres prévus', 'Geplande liters', 'Litres planned'), def: 1500, unit: 'L', max: 1999 }],
  run: (v: Record<string, number>) => {
    const s = M.seuil2000(v.litres, M.priceOn('mazout_lt2000', REF)!, M.priceOn('mazout_ge2000', REF)!);
    return {
      head: [T(l, 'Supplément pour 2 000 litres', 'Meerprijs voor 2.000 liter', 'Extra for 2,000 litres'), eur(s.surcout2000, l)] as [string, string],
      rows: [
        [T(l, 'Litres en plus', 'Extra liters', 'Extra litres'), num(s.litresEnPlus, l)],
        [T(l, 'Prix du litre supplémentaire', 'Prijs per extra liter', 'Price of each extra litre'), s.coutMarginal != null ? `${l3(s.coutMarginal, l)}/L` : '–'],
        [T(l, 'Volume qui coûte autant que 2 000 L', 'Volume dat evenveel kost als 2.000 l', 'Volume costing as much as 2,000 L'), `${num(s.equivalent, l)} L`],
      ] as Array<[string, string]>,
    };
  },
});
