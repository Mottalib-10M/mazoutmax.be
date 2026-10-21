/**
 * Outils du site. Chacun : un formulaire court, un résultat immédiat marqué data-resultat (kit.Shell),
 * le moteur du site (lib/engine), jamais un second calcul. Premier rendu = valeurs par défaut et jour
 * du build (propriété refDay) ; la date de Bruxelles est relue après hydratation (RECETTE §17.5).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import * as M from '../../lib/engine/index';
import { P } from '../../lib/engine/params';
import { brusselsNow } from '../../lib/today';
import { Shell, Row2, Head, Rows, Note, MethodLink, eur, T, type L } from '../calc/kit';
import { formatMoney, formatNumber, formatPercent, displayDate } from '../../lib/format';
import { LANG_TAGS } from '../../data/site-config';

type Prod = M.Prod;
const l3 = (x: number, l: L) => formatMoney(x, 3, l);
const pL = (x: number, l: L) => `${l3(x, l)}/L`;
const n0 = (x: number, l: L) => formatNumber(x, 0, l);
const pc = (x: number, l: L, d = 0) => formatPercent(x, d, l);
const dt = (iso: string, l: L) => displayDate(iso, LANG_TAGS[l]);
const wdName = (iso: string, l: L) => M.nomJour(M.weekday(iso), l);
/** Variation au litre, en centimes signés. */
export const cts = (d: number, l: L) => `${d > 0 ? '+' : d < 0 ? '−' : '±'}${formatNumber(Math.abs(d) * 100, 1, l)} ${T(l, 'c', 'cent', 'c')}`;
/** Montant signé avec un vrai signe moins (U+2212), jamais le trait d'union. */
const sgEur = (x: number, l: L, d = 0) => `${x > 0.004 ? '+' : x < -0.004 ? '−' : ''}${eur(Math.abs(x), l, d)}`;
const prodOpts = (keys: Prod[], l: L) => keys.map((k) => ({ value: k, label: M.NOM[k][l] }));

/** Jour de référence : celui du build au premier rendu, puis celui de Bruxelles, borné au dernier jour publié. */
export function useRefDay(refDay: string) {
  const [d, setD] = useState({ ref: refDay, stale: false });
  useEffect(() => {
    const now = brusselsNow().date;
    setD({ ref: now > M.LAST_DAY ? M.LAST_DAY : now, stale: now > M.LAST_DAY });
  }, []);
  return d;
}

function StaleNote({ stale, l }: { stale: boolean; l: L }) {
  if (!stale) return null;
  return <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{T(l,
    `Le tarif d’aujourd’hui n’est pas encore relu : prix affichés du ${dt(M.LAST_DAY, l)}, dernier jour publié.`,
    `Het tarief van vandaag is nog niet opgehaald: prijzen van ${dt(M.LAST_DAY, l)}, de laatst gepubliceerde dag.`,
    `Today’s tariff has not been read yet: prices shown are for ${dt(M.LAST_DAY, l)}, the last day published.`)}</p>;
}

/** Ligne « demain » : tarif officiel s'il est publié, sinon estimation étiquetée comme telle. */
function demainTexte(s: M.Situation, l: L): { value: string; label: string; sub: string } {
  const t = s.tomorrow;
  if (t.official) return {
    value: pL(t.price, l),
    label: T(l, `Prix maximum officiel du ${dt(t.day, l)}`, `Officiële maximumprijs op ${dt(t.day, l)}`, `Official maximum price on ${dt(t.day, l)}`),
    sub: t.delta === 0 ? T(l, 'inchangé par rapport à la veille', 'ongewijzigd tegenover de dag ervoor', 'unchanged from the day before') : T(l, `${cts(t.delta, l)} par litre par rapport à la veille`, `${cts(t.delta, l)} per liter tegenover de dag ervoor`, `${cts(t.delta, l)} a litre from the day before`),
  };
  const e = t.est;
  return {
    value: pL(e.central, l),
    label: T(l, `Estimation pour le ${dt(t.day, l)}`, `Schatting voor ${dt(t.day, l)}`, `Estimate for ${dt(t.day, l)}`),
    sub: T(l, `estimation, pas un tarif officiel · fourchette ${l3(e.low, l)} – ${l3(e.high, l)}`, `schatting, geen officieel tarief · vork ${l3(e.low, l)} – ${l3(e.high, l)}`, `estimate, not an official tariff · range ${l3(e.low, l)} – ${l3(e.high, l)}`),
  };
}

/* ---------------- Tableau du jour : tous les produits, aujourd'hui et demain ---------------- */
export function TarifJour({ lang = 'fr', refDay, famille = 'tout', caption }: { lang?: L; refDay: string; famille?: string; caption?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const keys = M.FAMILLE[famille] ?? M.FAMILLE.tout;
  const rows = keys.map((k) => ({ k, s: M.situation(k, ref) }));
  return (
    <div className="not-prose overflow-x-auto" data-chrome>
      <StaleNote stale={stale} l={lang} />
      <table className="journal mt-2 w-full text-sm">
        {caption && <caption className="mb-2 text-left text-sm text-navy-600">{caption}</caption>}
        <thead><tr>
          <th scope="col" className="px-2 py-2 text-left">{T(lang, 'Produit', 'Product', 'Product')}</th>
          <th scope="col" className="px-2 py-2 text-right">{dt(ref, lang)}</th>
          <th scope="col" className="px-2 py-2 text-right">{dt(M.addDays(ref, 1), lang)}</th>
        </tr></thead>
        <tbody>{rows.map(({ k, s }) => {
          const t = s.tomorrow;
          return (
            <tr key={k} className="border-b border-navy-100">
              <th scope="row" className="px-2 py-2 text-left font-normal text-navy-800">{M.NOM[k][lang]}</th>
              <td className="tabular-nums px-2 py-2 text-right font-semibold text-navy-900">{s.price != null ? l3(s.price, lang) : '–'}</td>
              <td className="tabular-nums px-2 py-2 text-right text-navy-800">{t.official
                ? <>{l3(t.price, lang)} <span className="text-xs text-navy-600">{t.delta === 0 ? '=' : cts(t.delta, lang)}</span></>
                : <>{l3(t.est.central, lang)} <span className="text-xs text-navy-600">{T(lang, 'estim.', 'schatting', 'est.')}</span></>}</td>
            </tr>
          );
        })}</tbody>
      </table>
      <p className="mt-2 text-xs text-navy-600">{T(lang,
        'Prix maximums TVA comprise, en euros par litre, tarif officiel publié par Statbel (be.STAT). « estim. » : le tarif du lendemain n’est pas encore publié, la valeur est une estimation.',
        'Maximumprijzen incl. btw, in euro per liter, officieel tarief gepubliceerd door Statbel (be.STAT). « schatting »: het tarief van de volgende dag is nog niet gepubliceerd, de waarde is een schatting.',
        'Maximum prices including VAT, in euros per litre, official tariff published by Statbel (be.STAT). “est.”: the next day’s tariff is not published yet, the value is an estimate.')}</p>
    </div>
  );
}

/* ---------------- Livraison de mazout : le montant maximum, aujourd'hui ou demain ---------------- */
export function LivraisonCalc({ lang = 'fr', refDay, methodHref, id = 'livraison' }: { lang?: L; refDay: string; methodHref?: string; id?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const [litres, setLitres] = useState(1500);
  const [quand, setQuand] = useState('0');
  const lt = M.situation('mazout_lt2000', ref), ge = M.situation('mazout_ge2000', ref);
  const prixDemain = (s: M.Situation) => (s.tomorrow.official ? s.tomorrow.price : s.tomorrow.est.central);
  const pLt = quand === '1' ? prixDemain(lt) : lt.price!, pGe = quand === '1' ? prixDemain(ge) : ge.price!;
  const c = M.livraison(litres, pLt, pGe);
  const auj = M.livraison(litres, lt.price!, ge.price!), dem = M.livraison(litres, prixDemain(lt), prixDemain(ge));
  const d = demainTexte(c.palier === 'ge2000' ? ge : lt, lang);
  const officiel = lt.tomorrow.official;
  const jourChoisi = quand === '1' ? M.addDays(ref, 1) : ref;
  return (
    <Shell id={id} form={<>
      <StaleNote stale={stale} l={lang} />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id={`${id}-litres`} label={T(lang, 'Litres à livrer', 'Te leveren liters', 'Litres to deliver')} value={litres} onChange={setLitres} unit="L" max={50000} help={T(lang, 'Le prix baisse à partir de 2 000 litres', 'Vanaf 2.000 liter daalt de prijs', 'The price drops from 2,000 litres')} lang={lang} />
        <Toggle id={`${id}-quand`} label={T(lang, 'Jour de livraison', 'Leverdag', 'Delivery day')} value={quand} onChange={setQuand} options={[{ value: '0', label: T(lang, 'Aujourd’hui', 'Vandaag', 'Today') }, { value: '1', label: T(lang, 'Demain', 'Morgen', 'Tomorrow') }]} />
      </div>
      <Rows rows={[
        [T(lang, `Mazout < 2 000 L, ${dt(ref, lang)}`, `Mazout < 2.000 l, ${dt(ref, lang)}`, `Heating oil < 2,000 L, ${dt(ref, lang)}`), pL(lt.price!, lang)],
        [T(lang, `Mazout ≥ 2 000 L, ${dt(ref, lang)}`, `Mazout ≥ 2.000 l, ${dt(ref, lang)}`, `Heating oil ≥ 2,000 L, ${dt(ref, lang)}`), pL(ge.price!, lang)],
        [officiel ? T(lang, 'Demain, tarif officiel publié', 'Morgen, officieel tarief gepubliceerd', 'Tomorrow, official tariff published') : T(lang, 'Demain, estimation', 'Morgen, schatting', 'Tomorrow, estimate'), d.value],
      ]} />
    </>} result={<>
      <Head label={T(lang, `Montant maximum, livraison du ${dt(jourChoisi, lang)}`, `Maximumbedrag, levering op ${dt(jourChoisi, lang)}`, `Maximum amount, delivery on ${dt(jourChoisi, lang)}`)} value={eur(c.total, lang)}
        sub={quand === '1' && !officiel ? T(lang, 'sur l’estimation du prix de demain', 'op basis van de geschatte prijs van morgen', 'based on the estimate of tomorrow’s price') : T(lang, 'au prix maximum officiel, TVA comprise', 'tegen de officiële maximumprijs, incl. btw', 'at the official maximum price, VAT included')} />
      <Rows rows={[
        [T(lang, 'Prix appliqué', 'Toegepaste prijs', 'Price applied'), pL(c.prix, lang)],
        [T(lang, 'Dont TVA (21 %)', 'Waarvan btw (21 %)', 'Of which VAT (21%)'), eur(c.tva, lang)],
        [T(lang, 'Écart demain − aujourd’hui', 'Verschil morgen − vandaag', 'Tomorrow minus today'), sgEur(dem.total - auj.total, lang)],
        ...(litres > 0 && litres < P.seuil_litres ? [[T(lang, 'Le même montant achèterait', 'Hetzelfde bedrag koopt', 'The same amount would buy'), `${n0(c.total / pGe, lang)} L ${T(lang, 'au palier de 2 000 L', 'in de schijf vanaf 2.000 l', 'in the 2,000 L band')}`] as [string, string]] : []),
      ]} />
      <Note>{T(lang, 'Le négociant peut vendre moins cher, jamais plus cher que ce prix maximum.', 'De handelaar mag goedkoper verkopen, nooit duurder dan deze maximumprijs.', 'A dealer may sell for less, never for more than this maximum price.')}</Note>
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Demain : tarif officiel s'il est publié, sinon estimation chiffrée ---------------- */
export function DemainCalc({ lang = 'fr', refDay, famille = 'mazout', methodHref }: { lang?: L; refDay: string; famille?: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const keys = M.FAMILLE[famille] ?? M.FAMILLE.mazout;
  const [k, setK] = useState<Prod>(keys[0]);
  const [litres, setLitres] = useState(M.volumeType(keys[0]));
  const s = M.situation(k, ref);
  const d = demainTexte(s, lang);
  const t = s.tomorrow;
  const pDemain = t.official ? t.price : t.est.central;
  const ecart = M.ecart(litres, pDemain, s.price!);
  const target = t.day;
  const st = M.changeStats(k, M.weekday(target));
  const e = !t.official ? t.est : null;
  return (
    <Shell id={`demain-${famille}`} form={<>
      <StaleNote stale={stale} l={lang} />
      <Row2>
        {keys.length > 1 ? <SelectField id={`demain-${famille}-produit`} label={T(lang, 'Produit', 'Product', 'Product')} value={k} onChange={(v) => { setK(v as Prod); setLitres(M.volumeType(v as Prod)); }} options={prodOpts(keys, lang)} /> : <div />}
        <NumberField id={`demain-${famille}-litres`} label={famille === 'mazout' ? T(lang, 'Litres commandés', 'Bestelde liters', 'Litres ordered') : T(lang, 'Litres du plein', 'Liters per tankbeurt', 'Litres per fill-up')} value={litres} onChange={setLitres} unit="L" max={50000} lang={lang} />
      </Row2>
      <Rows rows={[
        [T(lang, `Aujourd’hui, ${dt(ref, lang)}`, `Vandaag, ${dt(ref, lang)}`, `Today, ${dt(ref, lang)}`), pL(s.price!, lang)],
        [T(lang, `Demain, ${wdName(target, lang)}`, `Morgen, ${wdName(target, lang)}`, `Tomorrow, ${wdName(target, lang)}`), `${d.value}${t.official ? '' : ` (${T(lang, 'estimation', 'schatting', 'estimate')})`}`],
        [T(lang, `Nouveaux tarifs un ${wdName(target, lang)} sur un an`, `Nieuwe tarieven op een ${wdName(target, lang)}, afgelopen jaar`, `New tariffs on a ${wdName(target, lang)} over a year`), `${n0(st.changed, lang)} / ${n0(st.days, lang)}`],
      ]} />
    </>} result={<>
      <Head label={d.label} value={d.value} sub={d.sub} />
      <Rows rows={[
        [T(lang, `Écart sur ${n0(litres, lang)} litres`, `Verschil op ${n0(litres, lang)} liter`, `Difference on ${n0(litres, lang)} litres`), sgEur(ecart, lang, 2)],
        ...(e ? [
          [T(lang, 'Probabilité d’un nouveau tarif ce jour-là', 'Kans op een nieuw tarief die dag', 'Chance of a new tariff that day'), pc(e.prob, lang)] as [string, string],
          [T(lang, 'Écart moyen de l’estimation, 4 semaines', 'Gemiddelde afwijking van de schatting, 4 weken', 'Average error of the estimate, 4 weeks'), cts(e.mae4w, lang).replace(/^[+±−]/, '')] as [string, string],
          [T(lang, 'Écart moyen de l’estimation, 52 semaines', 'Gemiddelde afwijking van de schatting, 52 weken', 'Average error of the estimate, 52 weeks'), cts(e.mae52w, lang).replace(/^[+±−]/, '')] as [string, string],
        ] : [
          [T(lang, 'Statut', 'Status', 'Status'), T(lang, 'tarif officiel publié', 'officieel tarief gepubliceerd', 'official tariff published')] as [string, string],
        ]),
      ]} />
      <Note>{e
        ? T(lang, 'Estimation : dernier tarif publié, entouré des variations observées le même jour de la semaine sur un an. Ce n’est pas le tarif officiel, qui remplacera ce chiffre dès sa publication.', 'Schatting: laatst gepubliceerd tarief, met de schommelingen die het voorbije jaar op dezelfde weekdag zijn waargenomen. Het is niet het officiële tarief, dat dit cijfer vervangt zodra het is gepubliceerd.', 'Estimate: the last published tariff, framed by the changes seen on the same weekday over a year. It is not the official tariff, which replaces this figure as soon as it is published.')
        : T(lang, 'Prix maximum fixé par le SPF Économie et repris par Statbel : il s’applique toute la journée.', 'Maximumprijs vastgesteld door de FOD Economie en overgenomen door Statbel: hij geldt de hele dag.', 'Maximum price set by the FPS Economy and released by Statbel: it applies for the whole day.')}</Note>
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Seuil de 2 000 litres ---------------- */
export function SeuilCalc({ lang = 'fr', refDay, methodHref }: { lang?: L; refDay: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const [litres, setLitres] = useState(1500);
  const pLt = M.priceOn('mazout_lt2000', ref)!, pGe = M.priceOn('mazout_ge2000', ref)!;
  const s = M.seuil2000(litres, pLt, pGe);
  const dessous = litres < P.seuil_litres;
  return (
    <Shell id="seuil" form={<>
      <StaleNote stale={stale} l={lang} />
      <NumberField id="seuil-litres" label={T(lang, 'Litres que vous comptiez commander', 'Liters die u wilde bestellen', 'Litres you planned to order')} value={litres} onChange={setLitres} unit="L" max={50000} help={T(lang, 'Votre citerne doit pouvoir recevoir le volume', 'Uw tank moet het volume kunnen opnemen', 'Your tank must be able to take the volume')} lang={lang} />
      <Rows rows={[
        [T(lang, 'Moins de 2 000 litres', 'Minder dan 2.000 liter', 'Under 2,000 litres'), pL(pLt, lang)],
        [T(lang, '2 000 litres et plus', 'Vanaf 2.000 liter', '2,000 litres or more'), pL(pGe, lang)],
        [T(lang, 'Écart par litre', 'Verschil per liter', 'Difference per litre'), cts(pLt - pGe, lang).replace(/^[+−±]/, '')],
      ]} />
    </>} result={<>
      {dessous ? (<>
        <Head label={T(lang, `Passer à 2 000 litres coûte en plus`, `Naar 2.000 liter gaan kost extra`, `Going up to 2,000 litres costs an extra`)} value={eur(s.surcout2000, lang)}
          sub={T(lang, `pour ${n0(s.litresEnPlus, lang)} litres de plus, soit ${l3(s.coutMarginal ?? 0, lang)} le litre supplémentaire`, `voor ${n0(s.litresEnPlus, lang)} liter meer, of ${l3(s.coutMarginal ?? 0, lang)} per extra liter`, `for ${n0(s.litresEnPlus, lang)} more litres, i.e. ${l3(s.coutMarginal ?? 0, lang)} per extra litre`)} />
        <Rows rows={[
          [T(lang, `${n0(litres, lang)} litres au palier inférieur`, `${n0(litres, lang)} liter in de lagere schijf`, `${n0(litres, lang)} litres in the lower band`), eur(s.actuel.total, lang)],
          [T(lang, '2 000 litres au palier supérieur', '2.000 liter in de hogere schijf', '2,000 litres in the upper band'), eur(s.a2000.total, lang)],
          [T(lang, 'Volume qui coûte autant que 2 000 litres', 'Volume dat evenveel kost als 2.000 liter', 'Volume costing the same as 2,000 litres'), `${formatNumber(s.equivalent, 0, lang)} L`],
        ]} />
        <Note>{litres > s.equivalent
          ? T(lang, 'Au-delà de ce volume, commander 2 000 litres coûte moins cher que votre commande.', 'Boven dit volume kost 2.000 liter bestellen minder dan uw bestelling.', 'Above this volume, ordering 2,000 litres costs less than your order.')
          : T(lang, 'En dessous de ce volume, le palier supérieur coûte plus cher au total, même si le litre y est moins cher.', 'Onder dit volume kost de hogere schijf in totaal meer, ook al is de liter er goedkoper.', 'Below this volume the upper band costs more in total, even though each litre is cheaper.')}</Note>
      </>) : (<>
        <Head label={T(lang, 'Économie du palier de 2 000 litres', 'Besparing van de schijf vanaf 2.000 liter', 'Saving from the 2,000-litre band')} value={eur(M.ecart(litres, pLt, pGe), lang)} sub={T(lang, `sur ${n0(litres, lang)} litres, par rapport au prix sous 2 000 litres`, `op ${n0(litres, lang)} liter, tegenover de prijs onder 2.000 liter`, `on ${n0(litres, lang)} litres, compared with the under-2,000 price`)} />
        <Rows rows={[[T(lang, 'Montant maximum', 'Maximumbedrag', 'Maximum amount'), eur(s.actuel.total, lang)], [T(lang, 'Prix appliqué', 'Toegepaste prijs', 'Price applied'), pL(pGe, lang)]]} />
      </>)}
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Courbe SVG d'une série quotidienne ---------------- */
function Courbe({ pts, l, title }: { pts: M.Pt[]; l: L; title: string }) {
  if (pts.length < 2) return null;
  const W = 600, H = 200, pad = 36;
  const ys = pts.map((p) => p[1]);
  const lo = Math.min(...ys), hi = Math.max(...ys), span = hi - lo || 0.01;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad - 8);
  const y = (v: number) => 8 + (1 - (v - lo) / span) * (H - 36);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full" role="img" aria-label={title}>
      <line x1={pad} x2={W - 8} y1={y(hi)} y2={y(hi)} stroke="currentColor" className="text-navy-200" />
      <line x1={pad} x2={W - 8} y1={y(lo)} y2={y(lo)} stroke="currentColor" className="text-navy-200" />
      <text x={2} y={y(hi) + 4} fontSize="11" className="fill-navy-600">{formatNumber(hi, 3, l)}</text>
      <text x={2} y={y(lo) + 4} fontSize="11" className="fill-navy-600">{formatNumber(lo, 3, l)}</text>
      <path d={d} fill="none" stroke="var(--color-accent-500)" strokeWidth="2" />
      <text x={pad} y={H - 4} fontSize="11" className="fill-navy-600">{dt(pts[0][0], l)}</text>
      <text x={W - 8} y={H - 4} fontSize="11" textAnchor="end" className="fill-navy-600">{dt(pts[pts.length - 1][0], l)}</text>
    </svg>
  );
}

/* ---------------- Historique : prix à une date, courbe, moyennes ---------------- */
export function HistoriqueTool({ lang = 'fr', refDay, famille = 'mazout' }: { lang?: L; refDay: string; famille?: string }) {
  const { ref } = useRefDay(refDay);
  const keys = M.FAMILLE[famille] ?? M.FAMILLE.mazout;
  const [k, setK] = useState<Prod>(keys[0]);
  const [jours, setJours] = useState('365');
  const [litres, setLitres] = useState(M.volumeType(keys[0]));
  const n = Number(jours);
  const pts = useMemo(() => M.series(k).filter((p) => p[0] <= ref).slice(-n), [k, n, ref]);
  const r = M.range(k, n, ref);
  const now = M.priceOn(k, ref)!;
  const debut = pts[0];
  const evo = now - debut[1];
  return (
    <Shell id={`historique-${famille}`} form={<>
      <Row2>
        <SelectField id={`hist-${famille}-produit`} label={T(lang, 'Produit', 'Product', 'Product')} value={k} onChange={(v) => { setK(v as Prod); setLitres(M.volumeType(v as Prod)); }} options={prodOpts(keys, lang)} />
        <SelectField id={`hist-${famille}-periode`} label={T(lang, 'Période', 'Periode', 'Period')} value={jours} onChange={setJours} options={[['30', T(lang, '30 jours', '30 dagen', '30 days')], ['90', T(lang, '3 mois', '3 maanden', '3 months')], ['182', T(lang, '6 mois', '6 maanden', '6 months')], ['365', T(lang, '1 an', '1 jaar', '1 year')]].map(([value, label]) => ({ value, label }))} />
      </Row2>
      <NumberField id={`hist-${famille}-litres`} label={T(lang, 'Volume pour chiffrer l’écart', 'Volume om het verschil te berekenen', 'Volume to price the difference')} value={litres} onChange={setLitres} unit="L" max={50000} lang={lang} />
      <Courbe pts={pts} l={lang} title={T(lang, `Prix maximum ${M.NOM[k][lang]}, ${dt(debut[0], lang)} – ${dt(ref, lang)}`, `Maximumprijs ${M.NOM[k][lang]}, ${dt(debut[0], lang)} – ${dt(ref, lang)}`, `Maximum price ${M.NOM[k][lang]}, ${dt(debut[0], lang)} – ${dt(ref, lang)}`)} />
    </>} result={<>
      <Head label={T(lang, `Variation depuis le ${dt(debut[0], lang)}`, `Verschil sinds ${dt(debut[0], lang)}`, `Change since ${dt(debut[0], lang)}`)} value={cts(evo, lang)} sub={T(lang, `par litre, soit ${sgEur(evo * litres, lang)} sur ${n0(litres, lang)} litres`, `per liter, of ${sgEur(evo * litres, lang)} op ${n0(litres, lang)} liter`, `a litre, i.e. ${sgEur(evo * litres, lang)} on ${n0(litres, lang)} litres`)} />
      <Rows rows={[
        [T(lang, `Prix du ${dt(ref, lang)}`, `Prijs op ${dt(ref, lang)}`, `Price on ${dt(ref, lang)}`), pL(now, lang)],
        [T(lang, `Plus bas, ${dt(r.min[0], lang)}`, `Laagste, ${dt(r.min[0], lang)}`, `Lowest, ${dt(r.min[0], lang)}`), pL(r.min[1], lang)],
        [T(lang, `Plus haut, ${dt(r.max[0], lang)}`, `Hoogste, ${dt(r.max[0], lang)}`, `Highest, ${dt(r.max[0], lang)}`), pL(r.max[1], lang)],
        [T(lang, 'Moyenne de la période', 'Gemiddelde van de periode', 'Average for the period'), pL(r.mean, lang)],
      ]} />
    </>} />
  );
}

/* ---------------- Budget de chauffage au mazout ---------------- */
export function BudgetChauffageCalc({ lang = 'fr', refDay, methodHref }: { lang?: L; refDay: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const [litres, setLitres] = useState(2000);
  const [paye, setPaye] = useState(0);
  const k: Prod = litres >= P.seuil_litres ? 'mazout_ge2000' : 'mazout_lt2000';
  const now = M.priceOn(k, ref)!;
  const b = M.budgetChauffage(litres, now);
  const r = M.range(k, 365, ref);
  const ans = M.yearly(k);
  const rows: Array<[string, string]> = [
    [T(lang, `Au prix le plus bas sur un an (${dt(r.min[0], lang)})`, `Tegen de laagste prijs over een jaar (${dt(r.min[0], lang)})`, `At the lowest price over a year (${dt(r.min[0], lang)})`), eur(M.budgetChauffage(litres, r.min[1]).total, lang)],
    [T(lang, `Au prix le plus haut sur un an (${dt(r.max[0], lang)})`, `Tegen de hoogste prijs over een jaar (${dt(r.max[0], lang)})`, `At the highest price over a year (${dt(r.max[0], lang)})`), eur(M.budgetChauffage(litres, r.max[1]).total, lang)],
    ...ans.slice(-3).map(([y, p]) => [T(lang, `Au prix moyen de ${y}`, `Tegen de gemiddelde prijs van ${y}`, `At the ${y} average price`), eur(M.budgetChauffage(litres, p).total, lang)] as [string, string]),
  ];
  if (paye > 0) rows.push([T(lang, 'Au prix que vous avez payé', 'Tegen de prijs die u betaalde', 'At the price you paid'), eur(M.budgetChauffage(litres, paye).total, lang)]);
  return (
    <Shell id="budget-chauffage" form={<>
      <StaleNote stale={stale} l={lang} />
      <Row2>
        <NumberField id="budget-litres" label={T(lang, 'Litres brûlés par an', 'Liters verbruikt per jaar', 'Litres burnt a year')} value={litres} onChange={setLitres} unit="L" max={20000} help={T(lang, 'Vos factures d’une année complète', 'Uw facturen van een volledig jaar', 'Your invoices for a full year')} lang={lang} />
        <NumberField id="budget-paye" label={T(lang, 'Prix payé à la dernière livraison (facultatif)', 'Prijs bij de laatste levering (optioneel)', 'Price paid at the last delivery (optional)')} value={paye} onChange={setPaye} unit="€/L" max={5} decimals={3} lang={lang} />
      </Row2>
    </>} result={<>
      <Head label={T(lang, `Budget annuel au prix maximum du ${dt(ref, lang)}`, `Jaarbudget tegen de maximumprijs van ${dt(ref, lang)}`, `Yearly budget at the maximum price of ${dt(ref, lang)}`)} value={eur(b.total, lang)} sub={T(lang, `soit ${eur(b.mois, lang)} par mois, à ${pL(now, lang)}`, `of ${eur(b.mois, lang)} per maand, tegen ${pL(now, lang)}`, `i.e. ${eur(b.mois, lang)} a month, at ${pL(now, lang)}`)} />
      <Rows rows={rows} />
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Allocation du Fonds Social Chauffage ---------------- */
export function AllocationCalc({ lang = 'fr', refDay, methodHref }: { lang?: L; refDay: string; methodHref?: string }) {
  const { ref } = useRefDay(refDay);
  const defPrix = M.priceOn('mazout_lt2000', ref)!;
  // Valeur de départ arrondie au centime (lisible) ; trois décimales restent possibles à la saisie.
  const [prix, setPrix] = useState(Math.round(defPrix * 100) / 100);
  const [litres, setLitres] = useState(1000);
  const [deja, setDeja] = useState(0);
  const [charges, setCharges] = useState(0);
  const a = M.allocation(prix, litres, deja);
  const F = P.fonds;
  return (
    <Shell id="allocation" form={<>
      <Row2>
        <NumberField id="alloc-prix" label={T(lang, 'Prix au litre sur la facture, TVA comprise', 'Prijs per liter op de factuur, incl. btw', 'Price per litre on the invoice, VAT included')} value={prix} onChange={setPrix} unit="€/L" max={5} decimals={3} lang={lang} />
        <NumberField id="alloc-litres" label={T(lang, 'Litres livrés', 'Geleverde liters', 'Litres delivered')} value={litres} onChange={setLitres} unit="L" max={20000} lang={lang} />
      </Row2>
      <Row2>
        <NumberField id="alloc-deja" label={T(lang, 'Litres déjà aidés cette année', 'Liters dit jaar al gesteund', 'Litres already covered this year')} value={deja} onChange={setDeja} unit="L" max={F.litres_max_an} lang={lang} />
        <NumberField id="alloc-charges" label={T(lang, 'Personnes à charge', 'Personen ten laste', 'Dependants')} value={charges} onChange={setCharges} max={15} lang={lang} />
      </Row2>
    </>} result={<>
      <Head label={T(lang, 'Allocation possible pour cette livraison', 'Mogelijke toelage voor deze levering', 'Possible allowance for this delivery')} value={eur(a.montant, lang, 2)} sub={T(lang, `${n0(a.cents, lang)} cents par litre sur ${n0(a.litresRetenus, lang)} litres`, `${n0(a.cents, lang)} cent per liter op ${n0(a.litresRetenus, lang)} liter`, `${n0(a.cents, lang)} cents a litre on ${n0(a.litresRetenus, lang)} litres`)} />
      <Rows rows={[
        [T(lang, 'Plafond annuel du Fonds', 'Jaarplafond van het Fonds', 'Fund’s yearly cap'), `${n0(F.litres_max_an, lang)} L`],
        [T(lang, 'Revenus annuels bruts imposables à ne pas dépasser (catégorie 2)', 'Bruto belastbaar jaarinkomen dat niet overschreden mag worden (categorie 2)', 'Gross taxable yearly income not to exceed (category 2)'), eur(M.plafondRevenus(charges), lang, 2)],
        [T(lang, 'Délai pour la demande au CPAS', 'Termijn voor de aanvraag bij het OCMW', 'Deadline to apply at the CPAS/OCMW'), T(lang, `${n0(F.delai_jours, lang)} jours après la livraison`, `${n0(F.delai_jours, lang)} dagen na de levering`, `${n0(F.delai_jours, lang)} days after delivery`)],
      ]} />
      {a.plafondAtteint && <Note>{T(lang, `Le plafond de ${n0(F.litres_max_an, lang)} litres par année civile limite l’allocation.`, `Het plafond van ${n0(F.litres_max_an, lang)} liter per kalenderjaar beperkt de toelage.`, `The ${n0(F.litres_max_an, lang)}-litre cap per calendar year limits the allowance.`)}</Note>}
      <Note>{T(lang, 'Calcul indicatif : seul le CPAS décide de l’octroi, après examen de votre situation.', 'Indicatieve berekening: alleen het OCMW beslist over de toekenning, na onderzoek van uw situatie.', 'Indicative calculation: only the CPAS/OCMW decides, after reviewing your situation.')}</Note>
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Un carburant : prix du jour, plein, évolution ---------------- */
export function ProduitCalc({ lang = 'fr', refDay, famille = 'diesel', methodHref }: { lang?: L; refDay: string; famille?: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const keys = M.FAMILLE[famille] ?? M.FAMILLE.diesel;
  const [k, setK] = useState<Prod>(keys[0]);
  const [litres, setLitres] = useState(M.volumeType(keys[0]));
  const s = M.situation(k, ref);
  const d = demainTexte(s, lang);
  const lc = M.lastChange(k, ref);
  const e7 = M.evolution(k, 7, ref), e30 = M.evolution(k, 30, ref), e365 = M.evolution(k, 364, ref);
  return (
    <Shell id={`produit-${famille}`} form={<>
      <StaleNote stale={stale} l={lang} />
      <Row2>
        {keys.length > 1 ? <SelectField id={`produit-${famille}-choix`} label={T(lang, 'Carburant', 'Brandstof', 'Fuel')} value={k} onChange={(v) => setK(v as Prod)} options={prodOpts(keys, lang)} /> : <div />}
        <NumberField id={`produit-${famille}-litres`} label={T(lang, 'Litres du plein', 'Liters per tankbeurt', 'Litres per fill-up')} value={litres} onChange={setLitres} unit="L" max={2000} lang={lang} />
      </Row2>
      <Rows rows={[
        [T(lang, `Prix maximum du ${dt(ref, lang)}`, `Maximumprijs op ${dt(ref, lang)}`, `Maximum price on ${dt(ref, lang)}`), pL(s.price!, lang)],
        [d.label, `${d.value}${s.tomorrow.official ? '' : ` (${T(lang, 'estimation', 'schatting', 'estimate')})`}`],
        ...(lc ? [[T(lang, 'Dernier changement', 'Laatste wijziging', 'Last change'), `${dt(lc.day, lang)}, ${cts(lc.price - lc.before, lang)}`] as [string, string]] : []),
      ]} />
    </>} result={<>
      <Head label={T(lang, 'Un plein au prix maximum coûte', 'Een volle tank tegen de maximumprijs kost', 'A fill-up at the maximum price costs')} value={eur(M.plein(litres, s.price!), lang, 2)} sub={T(lang, `${n0(litres, lang)} litres de ${M.NOM[k][lang]}`, `${n0(litres, lang)} liter ${M.NOM[k][lang]}`, `${n0(litres, lang)} litres of ${M.NOM[k][lang]}`)} />
      <Rows rows={[
        ...(e7 != null ? [[T(lang, 'Sur 7 jours', 'Over 7 dagen', 'Over 7 days'), `${cts(e7, lang)} · ${sgEur(e7 * litres, lang, 2)}`] as [string, string]] : []),
        ...(e30 != null ? [[T(lang, 'Sur 30 jours', 'Over 30 dagen', 'Over 30 days'), `${cts(e30, lang)} · ${sgEur(e30 * litres, lang, 2)}`] as [string, string]] : []),
        ...(e365 != null ? [[T(lang, 'Sur un an', 'Over een jaar', 'Over a year'), `${cts(e365, lang)} · ${sgEur(e365 * litres, lang, 2)}`] as [string, string]] : []),
      ]} />
      <Note>{T(lang, 'À la pompe, le prix affiché peut être plus bas, jamais plus haut que le maximum.', 'Aan de pomp mag de prijs lager zijn, nooit hoger dan het maximum.', 'At the pump the price shown may be lower, never higher than the maximum.')}</Note>
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Tableau de tous les carburants + comparaison de deux produits ---------------- */
export function TableauCalc({ lang = 'fr', refDay, famille = 'carburants', methodHref }: { lang?: L; refDay: string; famille?: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const keys = M.FAMILLE[famille] ?? M.FAMILLE.carburants;
  const [a, setA] = useState<Prod>(keys[0]);
  const [b, setB] = useState<Prod>(keys[2] ?? keys[1] ?? keys[0]);
  const [litres, setLitres] = useState(50);
  const pa = M.priceOn(a, ref)!, pb = M.priceOn(b, ref)!;
  const tri = [...keys].sort((x, y) => M.priceOn(x, ref)! - M.priceOn(y, ref)!);
  return (
    <Shell id={`tableau-${famille}`} form={<>
      <StaleNote stale={stale} l={lang} />
      <Row2>
        <SelectField id={`tab-${famille}-a`} label={T(lang, 'Premier carburant', 'Eerste brandstof', 'First fuel')} value={a} onChange={(v) => setA(v as Prod)} options={prodOpts(keys, lang)} />
        <SelectField id={`tab-${famille}-b`} label={T(lang, 'Second carburant', 'Tweede brandstof', 'Second fuel')} value={b} onChange={(v) => setB(v as Prod)} options={prodOpts(keys, lang)} />
      </Row2>
      <NumberField id={`tab-${famille}-litres`} label={T(lang, 'Litres', 'Liter', 'Litres')} value={litres} onChange={setLitres} unit="L" max={5000} lang={lang} />
    </>} result={<>
      <Head label={T(lang, `Écart pour ${n0(litres, lang)} litres, ${dt(ref, lang)}`, `Verschil voor ${n0(litres, lang)} liter, ${dt(ref, lang)}`, `Difference for ${n0(litres, lang)} litres, ${dt(ref, lang)}`)} value={eur(Math.abs(M.ecart(litres, pa, pb)), lang, 2)}
        sub={pa === pb ? T(lang, 'même prix maximum', 'zelfde maximumprijs', 'same maximum price') : T(lang, `${M.COURT[pa < pb ? a : b][lang]} est le moins cher`, `${M.COURT[pa < pb ? a : b][lang]} is het goedkoopst`, `${M.COURT[pa < pb ? a : b][lang]} is cheaper`)} />
      <Rows rows={tri.map((k) => [M.NOM[k][lang], pL(M.priceOn(k, ref)!, lang)] as [string, string])} />
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

/* ---------------- Budget carburant d'une voiture ---------------- */
export function BudgetVoitureCalc({ lang = 'fr', refDay, methodHref }: { lang?: L; refDay: string; methodHref?: string }) {
  const { ref, stale } = useRefDay(refDay);
  const keys = M.FAMILLE.carburants;
  const [k, setK] = useState<Prod>('diesel_b7');
  const [km, setKm] = useState(15000);
  const [conso, setConso] = useState(6);
  const p = M.priceOn(k, ref)!;
  const v = M.budgetVoiture(km, conso, p);
  const r = M.range(k, 365, ref);
  return (
    <Shell id="budget-voiture" form={<>
      <StaleNote stale={stale} l={lang} />
      <SelectField id="bv-produit" label={T(lang, 'Carburant', 'Brandstof', 'Fuel')} value={k} onChange={(x) => setK(x as Prod)} options={prodOpts(keys, lang)} />
      <Row2>
        <NumberField id="bv-km" label={T(lang, 'Kilomètres par an', 'Kilometer per jaar', 'Kilometres a year')} value={km} onChange={setKm} unit="km" max={200000} lang={lang} />
        <NumberField id="bv-conso" label={T(lang, 'Consommation', 'Verbruik', 'Consumption')} value={conso} onChange={setConso} unit="L/100" max={40} decimals={1} help={T(lang, 'Moyenne réelle, pas celle du catalogue', 'Werkelijk gemiddelde, niet dat van de folder', 'Real average, not the brochure figure')} lang={lang} />
      </Row2>
    </>} result={<>
      <Head label={T(lang, 'Budget carburant par an, au prix maximum du jour', 'Brandstofbudget per jaar, tegen de maximumprijs van vandaag', 'Fuel budget a year, at today’s maximum price')} value={eur(v.total, lang)} sub={T(lang, `${eur(v.mois, lang)} par mois · ${n0(v.litres, lang)} litres à ${pL(p, lang)}`, `${eur(v.mois, lang)} per maand · ${n0(v.litres, lang)} liter tegen ${pL(p, lang)}`, `${eur(v.mois, lang)} a month · ${n0(v.litres, lang)} litres at ${pL(p, lang)}`)} />
      <Rows rows={[
        [T(lang, 'Coût par 100 km', 'Kost per 100 km', 'Cost per 100 km'), eur(v.parKm * 100, lang, 2)],
        [T(lang, `Au prix le plus bas sur un an`, `Tegen de laagste prijs over een jaar`, `At the lowest price over a year`), eur(M.budgetVoiture(km, conso, r.min[1]).total, lang)],
        [T(lang, `Au prix le plus haut sur un an`, `Tegen de hoogste prijs over een jaar`, `At the highest price over a year`), eur(M.budgetVoiture(km, conso, r.max[1]).total, lang)],
        [T(lang, 'Chaque centime de hausse coûte par an', 'Elke cent stijging kost per jaar', 'Each cent of increase costs a year'), eur(v.litres * 0.01, lang, 2)],
      ]} />
      <MethodLink href={methodHref} lang={lang} />
    </>} />
  );
}

