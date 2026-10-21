/**
 * Tests qui bloquent la publication : lecture du tarif be.STAT, recoupement avec les tarifs cités
 * par la Chambre, coûts au palier de 2 000 litres, barème du Fonds Social Chauffage, estimation.
 */
import { describe, it, expect } from 'vitest';
import * as M from './index';
import { P } from './params';
// @ts-expect-error module JavaScript sans types
import { isoDay, build } from '../../../scripts/update-data.mjs';
import { getSpec, MINIS } from '../mini-specs';

const PRODS = M.PRODS;

describe('série be.STAT', () => {
  it('13 produits, au moins 300 jours chacun, sans trou ni doublon', () => {
    expect(PRODS.length).toBe(13);
    for (const k of PRODS) {
      const s = M.series(k);
      expect(s.length).toBeGreaterThanOrEqual(300);
      for (let i = 1; i < s.length; i++) expect(s[i][0]).toBe(M.addDays(s[i - 1][0], 1));
      expect(s[s.length - 1][0]).toBe(M.LAST_DAY);
    }
  });
  it('prix plausibles (entre 0,20 et 5 € le litre) et 3 décimales', () => {
    for (const k of PRODS) for (const [, p] of M.series(k)) {
      expect(p).toBeGreaterThan(0.2); expect(p).toBeLessThan(5);
      expect(Math.round(p * 1000) / 1000).toBeCloseTo(p, 9);
    }
  });
  it('le palier de 2 000 litres est toujours moins cher que le palier inférieur', () => {
    const lt = M.series('mazout_lt2000'), ge = M.series('mazout_ge2000');
    lt.forEach(([d, p], i) => { expect(ge[i][0]).toBe(d); expect(ge[i][1]).toBeLessThan(p); });
  });
  it('dernier tarif : TVA de 21 % entre prix hors TVA et TVA comprise', () => {
    for (const k of PRODS) {
      const l = M.lastTariff(k);
      if (!l || l.excl == null) continue;
      expect(l.incl / l.excl).toBeCloseTo(1 + P.tva, 2);
      expect(M.priceOn(k, l.day)).toBeCloseTo(l.incl, 3);
    }
  });
  it('dates be.STAT « 22OCT26 » lues en ISO', () => {
    expect(isoDay('22OCT26')).toBe('2026-10-22');
    expect(isoDay('01JAN27')).toBe('2027-01-01');
    expect(isoDay('29FEB28')).toBe('2028-02-29');
  });
  it('le script refuse une série vide ou tronquée', () => {
    const vide = 'Day,Product,Price incl. VAT\n';
    expect(() => build({ daily: vide, monthly: vide, yearly: vide, last: vide }, '2026-10-21T00:00:00Z')).toThrow();
  });
});

describe('recoupement avec la Chambre (DOC 56 1452/001)', () => {
  // Tarifs officiels à 4 décimales cités par la proposition de loi ; be.STAT les arrondit à 3.
  for (const [jour, t] of [['2026-02-28', P.contrat.tarif_28_fevrier], ['2026-03-27', P.contrat.tarif_27_mars]] as const) {
    for (const [k, v] of Object.entries(t) as Array<[M.Prod, number]>) {
      const p = M.priceOn(k, jour);
      it.runIf(p != null)(`${k} le ${jour} : ${v}`, () => { expect(Math.abs(p! - v)).toBeLessThanOrEqual(0.0006); });
    }
  }
});

describe('coûts', () => {
  it('livraison : palier selon le volume, au centime', () => {
    expect(M.livraison(1500, 1.588, 1.544)).toMatchObject({ palier: 'lt2000', prix: 1.588, total: 2382 });
    expect(M.livraison(2000, 1.588, 1.544)).toMatchObject({ palier: 'ge2000', prix: 1.544, total: 3088 });
    expect(M.livraison(1999, 1.588, 1.544).total).toBe(3174.41);
    // TVA contenue : 3 088 € TTC → 3 088 × 0,21 / 1,21
    expect(M.livraison(2000, 1.588, 1.544).tva).toBe(535.93);
  });
  it('seuil de 2 000 litres : volume équivalent et coût marginal', () => {
    const s = M.seuil2000(1500, 1.588, 1.544);
    expect(s.equivalent).toBeCloseTo(1944.58, 2);
    expect(s.surcout2000).toBe(706);
    expect(s.coutMarginal).toBeCloseTo(1.412, 3);
    expect(M.seuil2000(2500, 1.588, 1.544).coutMarginal).toBeNull();
  });
  it('budgets', () => {
    expect(M.budgetChauffage(2000, 1.5)).toEqual({ total: 3000, mois: 250 });
    expect(M.plein(50, 2.002)).toBe(100.1);
    const v = M.budgetVoiture(15000, 6, 2.444);
    expect(v.litres).toBe(900); expect(v.total).toBe(2199.6); expect(v.mois).toBe(183.3);
  });
  it('Fonds Social Chauffage : barème de 14 à 20 cents et plafond de 1 500 litres', () => {
    expect(M.allocation(1.20, 1000)).toMatchObject({ cents: 14, montant: 140 });
    expect(M.allocation(1.35, 1000).cents).toBe(15);
    expect(M.allocation(1.3749, 1000).cents).toBe(15);
    expect(M.allocation(1.375, 1000).cents).toBe(16);
    expect(M.allocation(1.45, 1000).cents).toBe(19);
    expect(M.allocation(1.475, 1000).cents).toBe(20);
    expect(M.allocation(1.90, 2000)).toMatchObject({ cents: 20, litresRetenus: 1500, montant: 300, plafondAtteint: true });
    expect(M.allocation(1.60, 1000, 1000)).toMatchObject({ litresRetenus: 500, montant: 100 });
    expect(M.plafondRevenus(0)).toBe(25817.27);
    expect(M.plafondRevenus(2)).toBe(35371.99);
  });
});

describe('estimation du jour suivant', () => {
  it('un tarif publié pour demain est affiché comme officiel, jamais comme estimation', () => {
    const veille = M.addDays(M.LAST_DAY, -1);
    const s = M.situation('mazout_lt2000', veille);
    expect(s.tomorrow.official).toBe(true);
  });
  it('au-delà du dernier jour publié : estimation, fourchette qui contient le prix central', () => {
    const s = M.situation('mazout_lt2000', M.LAST_DAY);
    expect(s.tomorrow.official).toBe(false);
    if (!s.tomorrow.official) {
      const e = s.tomorrow.est;
      expect(e.central).toBe(M.priceOn('mazout_lt2000', M.LAST_DAY));
      expect(e.low).toBeLessThanOrEqual(e.central); expect(e.high).toBeGreaterThanOrEqual(e.central);
      expect(e.prob).toBeGreaterThanOrEqual(0); expect(e.prob).toBeLessThanOrEqual(1);
    }
  });
  it('page en retard : le jour affiché est ramené au dernier jour publié', () => {
    const s = M.situation('diesel_b7', M.addDays(M.LAST_DAY, 5));
    expect(s.stale).toBe(true); expect(s.today).toBe(M.LAST_DAY);
  });
  it('l’estimateur « pas de changement » se trompe moins qu’un prolongement de la dernière variation', () => {
    for (const k of ['mazout_lt2000', 'diesel_b7', 'e10_95'] as M.Prod[]) {
      const s = M.series(k);
      let momentum = 0;
      for (let i = 2; i < s.length; i++) momentum += Math.abs(s[i][1] - (s[i - 1][1] + (s[i - 1][1] - s[i - 2][1])));
      momentum /= s.length - 2;
      expect(M.backtest(k, 364).mae).toBeLessThan(momentum);
    }
  });
  it('statistiques par jour de la semaine : 7 groupes qui couvrent toute la série', () => {
    const tot = [0, 1, 2, 3, 4, 5, 6].reduce((t, wd) => t + M.changeStats('mazout_lt2000', wd).days, 0);
    expect(tot).toBe(M.changes('mazout_lt2000').length);
  });
  it('évolution et extrêmes', () => {
    expect(M.evolution('mazout_lt2000', 0)).toBe(0);
    const r = M.range('mazout_lt2000', 365);
    expect(r.min[1]).toBeLessThanOrEqual(r.mean); expect(r.max[1]).toBeGreaterThanOrEqual(r.mean);
  });
});

describe('mini-simulateurs', () => {
  it('chaque mini-simulateur répond dans les trois langues, sans valeur manquante', () => {
    expect(Object.keys(MINIS).length).toBeGreaterThan(0);
    for (const kind of Object.keys(MINIS)) for (const l of ['fr', 'nl', 'en']) {
      const s = getSpec(kind, l);
      const out = s.run(Object.fromEntries(s.inputs.map((i) => [i.id, i.def])));
      const txt = JSON.stringify(out);
      expect(txt).not.toMatch(/NaN|undefined|Infinity/);
      expect(out.rows.length).toBeGreaterThanOrEqual(2);
    }
  });
});
