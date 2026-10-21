import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Historique des prix des carburants : moyennes annuelles, douze derniers mois, printemps 2026, lecture d'une courbe en escalier. */
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');
const KA = ['diesel_b7', 'e10_95', 'e5_98', 'lpg'] as const;
const KM = ['diesel_b7', 'e10_95', 'lpg'] as const;

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const rD = M.range('diesel_b7', 365, t), rE = M.range('e10_95', 365, t), rL = M.range('lpg', 365, t);
  const yD = M.yearly('diesel_b7'), yE = M.yearly('e10_95');
  const yrs = yD.map(([y]) => y);
  const cur = yrs[yrs.length - 1], prev = yrs[yrs.length - 2], first = yrs[0];
  const yv = (k: (typeof KA)[number], y: string) => M.yearly(k).find((p) => p[0] === y)?.[1] ?? null;
  const stD = M.changeStats('diesel_b7');
  return {
    M, t, rD, rE, rL, yD, yE, yrs, cur, prev, first, yv, stD,
    eD: M.evolution('diesel_b7', 364, t), eE: M.evolution('e10_95', 364, t), eL: M.evolution('lpg', 364, t),
    pD: M.priceOn('diesel_b7', t)!, pE: M.priceOn('e10_95', t)!, pL: M.priceOn('lpg', t)!,
    debut: M.series('diesel_b7')[0][0], C: h.P.contrat,
  };
}
type DD = ReturnType<typeof D>;

/** « a pris / a perdu x » selon le signe, sur un an. */
function evo(h: Helpers, e: number | null) {
  if (e == null) return h.T('sans point de comparaison', 'zonder vergelijkingspunt', 'with no comparison point');
  if (e === 0) return h.T('sans variation', 'zonder verschil', 'with no change');
  return e > 0 ? h.T(`en hausse de ${c(h, e)}`, `${c(h, e)} hoger`, `up ${c(h, e)}`) : h.T(`en baisse de ${c(h, e)}`, `${c(h, e)} lager`, `down ${c(h, e)}`);
}
const mois = (h: Helpers, ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(h.T('fr-BE', 'nl-BE', 'en-GB'), { month: 'long', year: 'numeric', timeZone: 'UTC' });

const resume = (h: Helpers) => {
  const d = D(h);
  const yC = d.yv('diesel_b7', d.cur), yF = d.yv('diesel_b7', d.first);
  return h.T(
    `Sur les 365 derniers jours, le prix maximum officiel du diesel B7 en Belgique est allé de ${h.l3(d.rD.min[1])} le ${h.date(d.rD.min[0])} à ${h.l3(d.rD.max[1])} le ${h.date(d.rD.max[0])} ; au ${h.date(d.t)}, il s’établit à ${h.l3(d.pD)}, ${evo(h, d.eD)} sur un an. L’essence 95 E10 est à ${h.l3(d.pE)}, ${evo(h, d.eE)}, après un plus bas de ${h.l3(d.rE.min[1])} et un plus haut de ${h.l3(d.rE.max[1])}, et le LPG à ${h.l3(d.pL)}, ${evo(h, d.eL)}. Sur les moyennes annuelles publiées par Statbel, le diesel B7 est passé de ${yF != null ? h.l3(yF) : '—'} en ${d.first} à ${yC != null ? h.l3(yC) : '—'} en ${d.cur}, année en cours. Ces prix sont des plafonds fixés par le SPF Économie selon le contrat-programme conclu entre l’État et la fédération Energia : ils retracent ce qu’un plein pouvait coûter au plus chaque jour. En un an, le tarif du diesel a changé ${h.num(d.stD.changed)} fois, soit en moyenne un nouveau prix tous les ${h.num(d.stD.days / Math.max(1, d.stD.changed), 1)} jours.`,
    `Over de voorbije 365 dagen ging de officiële maximumprijs van diesel B7 in België van ${h.l3(d.rD.min[1])} op ${h.date(d.rD.min[0])} naar ${h.l3(d.rD.max[1])} op ${h.date(d.rD.max[0])}; op ${h.date(d.t)} bedraagt hij ${h.l3(d.pD)}, ${evo(h, d.eD)} dan een jaar geleden. Benzine 95 E10 staat op ${h.l3(d.pE)}, ${evo(h, d.eE)}, na een laagste stand van ${h.l3(d.rE.min[1])} en een hoogste van ${h.l3(d.rE.max[1])}, en LPG op ${h.l3(d.pL)}, ${evo(h, d.eL)}. Volgens de jaargemiddelden van Statbel ging diesel B7 van ${yF != null ? h.l3(yF) : '—'} in ${d.first} naar ${yC != null ? h.l3(yC) : '—'} in ${d.cur}, lopend jaar. Het zijn plafonds die de FOD Economie vastlegt volgens de programmaovereenkomst tussen de Staat en de federatie Energia: ze tonen wat een tankbeurt elke dag hoogstens kon kosten. In een jaar veranderde het dieseltarief ${h.num(d.stD.changed)} keer, gemiddeld een nieuwe prijs om de ${h.num(d.stD.days / Math.max(1, d.stD.changed), 1)} dagen.`,
    `Over the last 365 days the official maximum price of diesel B7 in Belgium ranged from ${h.l3(d.rD.min[1])} on ${h.date(d.rD.min[0])} to ${h.l3(d.rD.max[1])} on ${h.date(d.rD.max[0])}; on ${h.date(d.t)} it stands at ${h.l3(d.pD)}, ${evo(h, d.eD)} on a year earlier. 95 E10 petrol is at ${h.l3(d.pE)}, ${evo(h, d.eE)}, after a low of ${h.l3(d.rE.min[1])} and a high of ${h.l3(d.rE.max[1])}, and LPG at ${h.l3(d.pL)}, ${evo(h, d.eL)}. On the yearly averages Statbel publishes, diesel B7 went from ${yF != null ? h.l3(yF) : '—'} in ${d.first} to ${yC != null ? h.l3(yC) : '—'} in ${d.cur}, the current year. These prices are ceilings set by the FPS Economy under the programme agreement between the State and the Energia federation: they trace what a fill-up could cost at most on each day. Over a year the diesel tariff changed ${h.num(d.stD.changed)} times, a new price every ${h.num(d.stD.days / Math.max(1, d.stD.changed), 1)} days on average.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  const aD = d.yv('diesel_b7', d.cur), bD = d.yv('diesel_b7', d.prev), aE = d.yv('e10_95', d.cur), bE = d.yv('e10_95', d.prev);
  const cmp = (a: number | null, b: number | null) => (a == null || b == null ? null : Math.round((a - b) * 1000) / 1000);
  const dD = cmp(aD, bD), dE = cmp(aE, bE);
  const s = (x: number | null) => x == null ? '—' : x === 0 ? h.T('stable', 'gelijk', 'flat') : h.cts(x);
  return [
    {
      q: h.T('Quel a été le prix maximum le plus élevé du diesel sur les douze derniers mois ?', 'Wat was de hoogste maximumprijs van diesel in de voorbije twaalf maanden?', 'What was the highest maximum price of diesel over the last twelve months?'),
      a: h.T(
        `Le plafond le plus haut du diesel B7 sur les 365 derniers jours a été de ${h.l3(d.rD.max[1])} le litre, atteint le ${h.date(d.rD.max[0])}, et le plus bas de ${h.l3(d.rD.min[1])}, le ${h.date(d.rD.min[0])}. Sur un plein de 50 litres, l’écart entre ces deux jours représente ${h.eur((d.rD.max[1] - d.rD.min[1]) * 50, 2)}. L’outil donne les mêmes repères sur 30 jours, 3 mois ou 6 mois.`,
        `Het hoogste plafond van diesel B7 in de voorbije 365 dagen bedroeg ${h.l3(d.rD.max[1])} per liter, op ${h.date(d.rD.max[0])}, en het laagste ${h.l3(d.rD.min[1])}, op ${h.date(d.rD.min[0])}. Op een tankbeurt van 50 liter is het verschil tussen die twee dagen ${h.eur((d.rD.max[1] - d.rD.min[1]) * 50, 2)}. De tool geeft dezelfde ijkpunten over 30 dagen, 3 maanden of 6 maanden.`,
        `The highest B7 diesel ceiling over the last 365 days was ${h.l3(d.rD.max[1])} a litre, reached on ${h.date(d.rD.max[0])}, and the lowest ${h.l3(d.rD.min[1])}, on ${h.date(d.rD.min[0])}. On a 50-litre fill-up the gap between those two days comes to ${h.eur((d.rD.max[1] - d.rD.min[1]) * 50, 2)}. The tool gives the same markers over 30 days, 3 months or 6 months.`),
    },
    {
      q: h.T(`Les carburants sont-ils plus chers en ${h.P.year} qu’en ${h.P.year - 1} ?`, `Is brandstof in ${h.P.year} duurder dan in ${h.P.year - 1}?`, `Is fuel dearer in ${h.P.year} than in ${h.P.year - 1}?`),
      a: h.T(
        `D’après les moyennes annuelles de Statbel, le diesel B7 affiche ${s(dD)} par litre entre ${d.prev} et ${d.cur}, et l’essence 95 E10 ${s(dE)}. La moyenne de l’année en cours n’est pas définitive : elle porte sur les mois déjà écoulés et bougera jusqu’en décembre. Le tableau des moyennes annuelles, sur cette page, remonte jusqu’à ${d.first}.`,
        `Volgens de jaargemiddelden van Statbel geeft diesel B7 ${s(dD)} per liter tussen ${d.prev} en ${d.cur}, en benzine 95 E10 ${s(dE)}. Het gemiddelde van het lopende jaar is niet definitief: het slaat op de maanden die al voorbij zijn en verandert nog tot december. De tabel met jaargemiddelden op deze pagina gaat terug tot ${d.first}.`,
        `According to Statbel’s yearly averages, diesel B7 shows ${s(dD)} a litre between ${d.prev} and ${d.cur}, and 95 E10 petrol ${s(dE)}. The current year’s average is not final: it covers the months already gone and will move until December. The yearly averages table on this page goes back to ${d.first}.`),
    },
    {
      q: h.T('Pourquoi la courbe du prix des carburants est-elle en escalier ?', 'Waarom heeft de curve van de brandstofprijs de vorm van een trap?', 'Why does the fuel price curve look like a staircase?'),
      a: h.T(
        'Parce que le prix maximum ne bouge pas en continu : il reste fixe jusqu’à ce qu’un nouveau tarif officiel entre en vigueur, puis saute d’un coup. Chaque marche correspond à une décision publiée par le SPF Économie. Les longues marches signalent des périodes calmes sur les cotations internationales, les marches serrées des semaines agitées où les tarifs se succèdent.',
        'Omdat de maximumprijs niet continu beweegt: hij blijft vast tot er een nieuw officieel tarief ingaat, en springt dan in één keer. Elke trede is een door de FOD Economie gepubliceerde beslissing. Lange treden wijzen op rustige periodes op de internationale noteringen, korte treden op woelige weken waarin de tarieven elkaar snel opvolgen.',
        'Because the maximum price does not move continuously: it stays fixed until a new official tariff takes effect, then jumps in one go. Each step is a decision published by the FPS Economy. Long steps point to calm periods in international quotations, short ones to hectic weeks when tariffs follow one another quickly.'),
    },
    {
      q: h.T('Les moyennes mensuelles sont-elles des prix réellement payés à la pompe ?', 'Zijn de maandgemiddelden prijzen die echt aan de pomp betaald werden?', 'Are the monthly averages prices actually paid at the pump?'),
      a: h.T(
        'Non. Statbel calcule ces moyennes sur le prix maximum officiel, et non sur les prix affichés par les stations. Comme une station peut vendre sous le maximum, le prix moyen réellement payé a pu être un peu plus bas. Ces moyennes restent la référence la plus solide pour comparer deux mois ou deux années, parce qu’elles reposent sur le même tarif national.',
        'Nee. Statbel berekent die gemiddelden op de officiële maximumprijs, en niet op de prijzen die stations afficheren. Omdat een station onder het maximum mag verkopen, kan de gemiddeld betaalde prijs iets lager hebben gelegen. Die gemiddelden blijven wel de stevigste referentie om twee maanden of twee jaren te vergelijken, omdat ze op hetzelfde nationale tarief steunen.',
        'No. Statbel computes these averages from the official maximum price, not from the prices stations display. Since a station may sell below the maximum, the average price actually paid may have been slightly lower. These averages are still the soundest reference for comparing two months or two years, because they rest on the same national tariff.'),
    },
    {
      q: h.T('Puis-je réutiliser l’historique des prix des carburants ?', 'Mag ik de historische brandstofprijzen hergebruiken?', 'Can I reuse the fuel price history?'),
      a: h.T(
        'Oui. Les séries du tarif officiel sont publiées par Statbel en données ouvertes, sous licence CC BY 4.0 : vous pouvez les copier, les analyser et les republier, à condition de citer Statbel comme source. Les liens vers les séries quotidienne, mensuelle et annuelle de be.STAT figurent sur cette page ; la page méthode explique comment ce site les lit.',
        'Ja. De reeksen van het officiële tarief worden door Statbel als open data gepubliceerd, onder licentie CC BY 4.0: u mag ze kopiëren, analyseren en opnieuw publiceren, op voorwaarde dat u Statbel als bron vermeldt. De links naar de dagelijkse, maandelijkse en jaarlijkse reeksen van be.STAT staan op deze pagina; de methodepagina legt uit hoe deze site ze leest.',
        'Yes. The official tariff series are published by Statbel as open data under the CC BY 4.0 licence: you may copy, analyse and republish them, provided you credit Statbel as the source. Links to the daily, monthly and yearly be.STAT series are on this page; the method page explains how this site reads them.'),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const tAn = h.table(
    [h.T('Année', 'Jaar', 'Year'), ...KA.map((k) => M.COURT[k][h.lang])],
    d.yrs.map((y) => [y === d.cur ? h.T(`${y} (en cours)`, `${y} (lopend)`, `${y} (to date)`) : y, ...KA.map((k) => { const v = d.yv(k, y); return v == null ? '—' : h.l3(v); })]),
    h.T('Moyennes annuelles du prix maximum au litre, TVA comprise (Statbel, be.STAT).', 'Jaargemiddelden van de maximumprijs per liter, incl. btw (Statbel, be.STAT).', 'Yearly averages of the maximum price a litre, VAT included (Statbel, be.STAT).'),
    ['l', 'r', 'r', 'r', 'r']);
  const ms = M.monthly('diesel_b7').slice(-12).map(([ym]) => ym);
  const mv = (k: (typeof KM)[number], ym: string) => M.monthly(k).find((p) => p[0] === ym)?.[1] ?? null;
  const tMois = h.table(
    [h.T('Mois', 'Maand', 'Month'), ...KM.map((k) => M.COURT[k][h.lang])],
    ms.map((ym) => [mois(h, ym), ...KM.map((k) => { const v = mv(k, ym); return v == null ? '—' : h.l3(v); })]),
    h.T('Moyennes mensuelles du prix maximum au litre, TVA comprise, des douze derniers mois publiés.', 'Maandgemiddelden van de maximumprijs per liter, incl. btw, over de laatste twaalf gepubliceerde maanden.', 'Monthly averages of the maximum price a litre, VAT included, over the last twelve months published.'),
    ['l', 'r', 'r', 'r']);
  const C = d.C, f = C.tarif_28_fevrier, m = C.tarif_27_mars;
  const tCh = h.table(
    [h.T('Carburant', 'Brandstof', 'Fuel'), h.T('28 février 2026', '28 februari 2026', '28 February 2026'), h.T('27 mars 2026', '27 maart 2026', '27 March 2026'), h.T('Variation', 'Verschil', 'Change')],
    (['diesel_b7', 'e10_95', 'e5_98'] as const).map((k) => [M.COURT[k][h.lang], h.l3(f[k]), h.l3(m[k]), h.cts(m[k] - f[k])]),
    h.T(`Tarifs officiels cités par le document ${C.doc_chambre} de la Chambre (30 mars 2026).`, `Officiële tarieven vermeld in Kamerdocument ${C.doc_chambre} (30 maart 2026).`, `Official tariffs quoted in Chamber document ${C.doc_chambre} (30 March 2026).`),
    ['l', 'r', 'r', 'r']);
  const pas = d.stD.days / Math.max(1, d.stD.changed);
  return h.T(`
<h2>${h.num(d.yrs.length)} années de moyennes annuelles</h2>
<p>Le tableau reprend les moyennes annuelles du prix maximum publiées par Statbel pour quatre carburants. L’année en cours n’est pas close : sa moyenne porte sur les mois déjà écoulés.</p>
${tAn}
<h2>Les douze derniers mois</h2>
${tMois}
<p>Les moyennes mensuelles, publiées sur ${h.src('bestatMois', 'be.STAT')}, lissent les mouvements d’un mois. Pour voir le détail au jour près, l’outil en haut de page trace la courbe quotidienne du carburant choisi et chiffre la variation sur le volume que vous indiquez.</p>
<h2>Le printemps 2026 dans les documents de la Chambre</h2>
<p>Le projet de loi ${h.src('chambreContrat', C.doc_chambre)}, déposé le 30 mars 2026, consacré au contrat-programme et aux tarifs officiels, cite les prix maximums de deux dates proches. En un mois, les plafonds du diesel et de l’essence ont nettement monté, et pas dans les mêmes proportions :</p>
${tCh}
<p>Les séries quotidiennes de be.STAT permettent de vérifier ces niveaux et de suivre la suite. La page ${h.a('contrat-programme', 'contrat-programme')} explique le mécanisme qui transmet ces mouvements au prix maximum.</p>
<h2>Lire une courbe de prix maximum</h2>
<p>La courbe d’un prix maximum avance par marches : elle reste plate tant qu’aucun nouveau tarif n’entre en vigueur, puis saute. Sur un an, le diesel a changé de tarif ${h.num(d.stD.changed)} fois, soit une marche tous les ${h.num(pas, 1)} jours en moyenne. Deux repères aident à la lecture : le plus bas et le plus haut de la période, que l’outil date au jour près, et la moyenne, qui dit ce qu’un plein régulier a coûté au plus. La comparaison du jour entre tous les carburants est sur la page ${h.a('prix-carburant', 'prix des carburants')}, et l’historique du mazout de chauffage sur ${h.a('historique-mazout', 'historique du prix du mazout')}.</p>
<h2>Sources</h2>
<p>Série quotidienne : ${h.src('bestatJour', 'be.STAT, 365 derniers jours')} ; moyennes mensuelles : ${h.src('bestatMois', 'be.STAT, 24 derniers mois')} ; moyennes annuelles : ${h.src('bestatAn', 'be.STAT, 8 dernières années')}. Données Statbel sous ${h.src('statbelLicence', 'licence CC BY 4.0')}, la série quotidienne commençant le ${h.date(d.debut)}.</p>`,
  `
<h2>${h.num(d.yrs.length)} jaar jaargemiddelden</h2>
<p>De tabel toont de jaargemiddelden van de maximumprijs die Statbel voor vier brandstoffen publiceert. Het lopende jaar is niet afgesloten: het gemiddelde slaat op de maanden die al voorbij zijn.</p>
${tAn}
<h2>De voorbije twaalf maanden</h2>
${tMois}
<p>De maandgemiddelden, gepubliceerd op ${h.src('bestatMois', 'be.STAT')}, vlakken de bewegingen binnen een maand af. Voor het detail per dag tekent de tool bovenaan de dagcurve van de gekozen brandstof en rekent hij het verschil uit op het volume dat u opgeeft.</p>
<h2>De lente van 2026 in de Kamerdocumenten</h2>
<p>Het wetsvoorstel ${h.src('chambreContrat', C.doc_chambre)}, ingediend op 30 maart 2026 en gewijd aan de programmaovereenkomst en de officiële tarieven, vermeldt de maximumprijzen op twee nabije data. In een maand stegen de plafonds van diesel en benzine duidelijk, en niet in dezelfde mate:</p>
${tCh}
<p>Met de dagreeksen van be.STAT zijn die niveaus te controleren en is het vervolg te volgen. De pagina ${h.a('contrat-programme', 'programmaovereenkomst')} legt het mechanisme uit dat die bewegingen doorgeeft aan de maximumprijs.</p>
<h2>Een curve van maximumprijzen lezen</h2>
<p>De curve van een maximumprijs gaat met treden vooruit: ze blijft vlak zolang er geen nieuw tarief ingaat, en springt dan. Over een jaar veranderde het dieseltarief ${h.num(d.stD.changed)} keer, gemiddeld een trede om de ${h.num(pas, 1)} dagen. Twee ijkpunten helpen bij het lezen: de laagste en de hoogste stand van de periode, die de tool tot op de dag dateert, en het gemiddelde, dat zegt wat een regelmatige tankbeurt hoogstens kostte. De vergelijking van vandaag tussen alle brandstoffen staat op de pagina ${h.a('prix-carburant', 'brandstofprijzen')}, en de evolutie van mazout op ${h.a('historique-mazout', 'evolutie van de mazoutprijs')}.</p>
<h2>Bronnen</h2>
<p>Dagreeks: ${h.src('bestatJour', 'be.STAT, laatste 365 dagen')}; maandgemiddelden: ${h.src('bestatMois', 'be.STAT, laatste 24 maanden')}; jaargemiddelden: ${h.src('bestatAn', 'be.STAT, laatste 8 jaar')}. Gegevens van Statbel onder ${h.src('statbelLicence', 'licentie CC BY 4.0')}; de dagreeks begint op ${h.date(d.debut)}.</p>`,
  `
<h2>${h.num(d.yrs.length)} years of yearly averages</h2>
<p>The table shows the yearly averages of the maximum price that Statbel publishes for four fuels. The current year is not closed: its average covers the months already gone.</p>
${tAn}
<h2>The last twelve months</h2>
${tMois}
<p>The monthly averages, published on ${h.src('bestatMois', 'be.STAT')}, smooth out the moves within a month. For day-level detail, the tool at the top draws the daily curve of the chosen fuel and prices the change on the volume you enter.</p>
<h2>Spring 2026 in the Chamber documents</h2>
<p>The bill ${h.src('chambreContrat', C.doc_chambre)}, tabled on 30 March 2026 and devoted to the programme agreement and the official tariffs, quotes the maximum prices on two close dates. In a month the diesel and petrol ceilings rose sharply, and not in the same proportion:</p>
${tCh}
<p>The be.STAT daily series make it possible to check these levels and follow what came next. The ${h.a('contrat-programme', 'programme agreement')} page explains the mechanism that passes these moves on to the maximum price.</p>
<h2>Reading a maximum price curve</h2>
<p>A maximum price curve moves in steps: it stays flat while no new tariff takes effect, then jumps. Over a year the diesel tariff changed ${h.num(d.stD.changed)} times, one step every ${h.num(pas, 1)} days on average. Two markers help when reading it: the period’s low and high, which the tool dates to the day, and the average, which tells you what a regular fill-up cost at most. Today’s comparison of every fuel is on the ${h.a('prix-carburant', 'fuel prices')} page, and the heating oil record on ${h.a('historique-mazout', 'heating oil price history')}.</p>
<h2>Sources</h2>
<p>Daily series: ${h.src('bestatJour', 'be.STAT, last 365 days')}; monthly averages: ${h.src('bestatMois', 'be.STAT, last 24 months')}; yearly averages: ${h.src('bestatAn', 'be.STAT, last 8 years')}. Statbel data under the ${h.src('statbelLicence', 'CC BY 4.0 licence')}; the daily series starts on ${h.date(d.debut)}.</p>`);
};

export default defineGuide({
  id: 'historique-carburants',
  group: 'carburants',
  order: 7,
  tool: 'historique',
  toolArg: 'carburants',
  related: ['prix-carburant', 'prix-diesel', 'prix-essence', 'historique-mazout', 'contrat-programme'],
  sources: ['bestatJour', 'bestatMois', 'bestatAn', 'chambreContrat', 'statbelLicence'],
  fr: {
    slug: 'historique-prix-carburant',
    nav: 'Historique des prix des carburants',
    card: 'Courbe du diesel, de l’essence et du LPG sur un an, et les moyennes annuelles.',
    title: 'Historique prix carburant 2026 : diesel, essence et LPG',
    description: 'Historique du prix des carburants en Belgique : courbe du diesel, de l’essence et du LPG sur un an, plus bas et plus haut datés, moyennes par mois et par an.',
    h1: 'Historique des prix des carburants',
    intro: 'La courbe du prix maximum de chaque carburant sur un an, ses plus bas et plus hauts, et les moyennes mensuelles et annuelles publiées par Statbel.',
    resume, faqs, body,
  },
  nl: {
    slug: 'brandstofprijzen-evolutie',
    nav: 'Evolutie brandstofprijzen',
    card: 'Curve van diesel, benzine en LPG over een jaar, en de jaargemiddelden.',
    title: 'Brandstofprijzen evolutie 2026: diesel, benzine en LPG',
    description: 'Evolutie van de brandstofprijzen in België: curve van diesel, benzine en LPG over een jaar, laagste en hoogste stand, maand- en jaargemiddelden van Statbel.',
    h1: 'Evolutie van de brandstofprijzen',
    intro: 'De curve van de maximumprijs van elke brandstof over een jaar, de laagste en hoogste stand, en de maand- en jaargemiddelden van Statbel.',
    resume, faqs, body,
  },
  en: {
    slug: 'fuel-price-history',
    nav: 'Fuel price history',
    card: 'Diesel, petrol and LPG curves over a year, and the yearly averages.',
    title: 'Fuel price history Belgium 2026: diesel, petrol and LPG',
    description: 'Fuel price history in Belgium: the diesel, petrol and LPG curve over a year, dated lows and highs, and the monthly and yearly averages from Statbel, 2026.',
    h1: 'Fuel price history',
    intro: 'The maximum price curve of each fuel over a year, its lows and highs, and the monthly and yearly averages published by Statbel.',
    resume, faqs, body,
  },
});
