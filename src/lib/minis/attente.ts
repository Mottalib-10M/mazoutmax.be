/** Mini-simulateur : ce qu'a coûté ou rapporté le fait d'attendre une semaine ou un mois, sur un an d'historique. */
import * as M from '../engine/index';
import { REF } from './_ref';
import { T, eur, num, pct, type L } from './_kit';
export default (l: L) => ({
  title: T(l, 'Attendre avant de commander : gagné ou perdu ?', 'Wachten met bestellen: winst of verlies?', 'Waiting before ordering: gain or loss?'),
  cta: T(l, 'Voir l’historique du prix', 'De prijsgeschiedenis bekijken', 'See the price history'),
  inputs: [
    { id: 'litres', label: T(l, 'Litres', 'Liter', 'Litres'), def: 1500, unit: 'L', max: 20000 },
    { id: 'jours', label: T(l, 'Attente', 'Wachttijd', 'Wait'), def: 7, options: [{ value: '7', label: T(l, '7 jours', '7 dagen', '7 days') }, { value: '14', label: T(l, '14 jours', '14 dagen', '14 days') }, { value: '30', label: T(l, '30 jours', '30 dagen', '30 days') }] },
  ],
  run: (v: Record<string, number>) => {
    const s = M.series('mazout_lt2000').filter((p) => p[0] <= REF);
    const n = v.jours;
    const d: number[] = [];
    for (let i = n; i < s.length; i++) d.push(s[i][1] - s[i - n][1]);
    const moins = d.filter((x) => x < 0).length;
    const moy = d.reduce((t, x) => t + x, 0) / (d.length || 1);
    const sg = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${eur(Math.abs(x) * v.litres, l)}`;
    return {
      head: [T(l, 'Effet moyen de l’attente sur un an', 'Gemiddeld effect van wachten over een jaar', 'Average effect of waiting over a year'), sg(moy)] as [string, string],
      rows: [
        [T(l, 'Attentes qui ont fait baisser la facture', 'Wachttijden die de factuur verlaagden', 'Waits that lowered the bill'), pct(moins / (d.length || 1), l, 0)],
        [T(l, 'Pire cas', 'Slechtste geval', 'Worst case'), sg(Math.max(...d))],
        [T(l, 'Meilleur cas', 'Beste geval', 'Best case'), sg(Math.min(...d))],
        [T(l, 'Périodes comparées', 'Vergeleken periodes', 'Periods compared'), num(d.length, l)],
      ] as Array<[string, string]>,
      note: T(l, 'Le passé ne prédit pas le prix : ce calcul montre seulement ce qu’aurait donné l’attente sur les 365 derniers jours.', 'Het verleden voorspelt de prijs niet: deze berekening toont alleen wat wachten de voorbije 365 dagen had opgeleverd.', 'The past does not predict the price: this only shows what waiting would have done over the last 365 days.'),
    };
  },
});
