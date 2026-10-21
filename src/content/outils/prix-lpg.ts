import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Prix du LPG (autogaz) : prix maximum, seuil de rentabilité au kilomètre face à l'essence et au diesel, rythme, propane. */
const K = 'lpg' as const;
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');
const r2 = (x: number) => Math.round(x * 100) / 100;

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const s = M.situation(K, t), p = s.price!;
  const pE = M.priceOn('e10_95', t)!, pD = M.priceOn('diesel_b7', t)!;
  const mois = M.monthly(K).slice(-12);
  return {
    M, t, s, p, pE, pD, ratioE: pE / p, ratioD: pD / p, st: M.changeStats(K), stE: M.changeStats('e10_95'),
    r: M.range(K, 365, t), e364: M.evolution(K, 364, t), lc: M.lastChange(K, t), mois,
    pProp: M.priceOn('propane_lt2000', t), y: M.yearly(K), last: M.lastTariff(K),
  };
}
type DD = ReturnType<typeof D>;

function demain(h: Helpers, d: DD) {
  const tm = d.s.tomorrow;
  if (tm.official) return tm.delta === 0
    ? h.T(`Le tarif de demain, ${h.date(tm.day)}, est publié et ne change rien au LPG.`, `Het tarief van morgen, ${h.date(tm.day)}, is gepubliceerd en verandert niets aan LPG.`, `Tomorrow’s tariff, for ${h.date(tm.day)}, is out and leaves LPG unchanged.`)
    : h.T(`Le tarif de demain, ${h.date(tm.day)}, est publié : ${h.l3(tm.price)} (${h.cts(tm.delta)}).`, `Het tarief van morgen, ${h.date(tm.day)}, is gepubliceerd: ${h.l3(tm.price)} (${h.cts(tm.delta)}).`, `Tomorrow’s tariff, for ${h.date(tm.day)}, is out: ${h.l3(tm.price)} (${h.cts(tm.delta)}).`);
  return h.T(`Le tarif de demain, ${h.date(tm.day)}, n’est pas encore publié ; l’estimation de l’outil, qui n’a rien d’officiel, reste à ${h.l3(tm.est.central)}.`, `Het tarief van morgen, ${h.date(tm.day)}, is nog niet gepubliceerd; de schatting in de tool, die niets officieels heeft, blijft op ${h.l3(tm.est.central)}.`, `Tomorrow’s tariff, for ${h.date(tm.day)}, is not out yet; the tool’s estimate, which is in no way official, stays at ${h.l3(tm.est.central)}.`);
}

const resume = (h: Helpers) => {
  const d = D(h);
  return h.T(
    `Le prix maximum officiel du LPG, ou autogaz, est de ${h.l3(d.p)} le litre à la pompe en Belgique le ${h.date(d.t)}, TVA de 21 % comprise, contre ${h.l3(d.pE)} pour l’essence 95 E10 et ${h.l3(d.pD)} pour le diesel B7. Ce plafond est fixé par le SPF Économie dans le cadre du contrat-programme entre l’État et la fédération Energia, et aucune station qui vend du LPG ne peut le dépasser. ${demain(h, d)} Au litre, le 95 E10 vaut ${h.num(d.ratioE, 2)} fois le prix du LPG : une voiture au LPG reste donc moins chère au kilomètre tant qu’elle ne consomme pas plus de ${h.num(d.ratioE, 2)} fois autant de litres qu’en essence. En un an, le tarif du LPG a changé ${h.num(d.st.changed)} fois, entre ${h.l3(d.r.min[1])} le ${h.date(d.r.min[0])} et ${h.l3(d.r.max[1])} le ${h.date(d.r.max[0])}.`,
    `De officiële maximumprijs van LPG, of autogas, bedraagt op ${h.date(d.t)} ${h.l3(d.p)} per liter aan de pomp in België, inclusief 21 % btw, tegenover ${h.l3(d.pE)} voor benzine 95 E10 en ${h.l3(d.pD)} voor diesel B7. Dat plafond wordt vastgelegd door de FOD Economie in het kader van de programmaovereenkomst tussen de Staat en de federatie Energia, en geen enkel station dat LPG verkoopt, mag het overschrijden. ${demain(h, d)} Per liter kost 95 E10 ${h.num(d.ratioE, 2)} keer de prijs van LPG: een LPG-wagen blijft dus goedkoper per kilometer zolang hij niet meer dan ${h.num(d.ratioE, 2)} keer zoveel liter verbruikt als op benzine. In een jaar veranderde het LPG-tarief ${h.num(d.st.changed)} keer, tussen ${h.l3(d.r.min[1])} op ${h.date(d.r.min[0])} en ${h.l3(d.r.max[1])} op ${h.date(d.r.max[0])}.`,
    `The official maximum price of LPG, or autogas, is ${h.l3(d.p)} a litre at the pump in Belgium on ${h.date(d.t)}, including 21% VAT, against ${h.l3(d.pE)} for 95 E10 petrol and ${h.l3(d.pD)} for diesel B7. The ceiling is set by the FPS Economy under the programme agreement between the State and the Energia federation, and no station selling LPG may exceed it. ${demain(h, d)} Per litre, 95 E10 costs ${h.num(d.ratioE, 2)} times the price of LPG: an LPG car therefore stays cheaper per kilometre as long as it burns no more than ${h.num(d.ratioE, 2)} times as many litres as it would on petrol. Over a year the LPG tariff changed ${h.num(d.st.changed)} times, between ${h.l3(d.r.min[1])} on ${h.date(d.r.min[0])} and ${h.l3(d.r.max[1])} on ${h.date(d.r.max[0])}.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  const ex = r2(6 * d.ratioE * 10) / 10;
  const moins = d.st.changed < d.stE.changed && d.st.changed < d.M.changeStats('diesel_b7').changed;
  return [
    {
      q: h.T('Rouler au LPG revient-il vraiment moins cher qu’à l’essence ?', 'Is rijden op LPG echt goedkoper dan op benzine?', 'Is driving on LPG really cheaper than on petrol?'),
      a: h.T(
        `Au litre, oui : aujourd’hui, le LPG est plafonné à ${h.l3(d.p)} contre ${h.l3(d.pE)} pour le 95 E10. Au kilomètre, tout dépend de votre consommation. Le seuil se calcule : en divisant les deux prix, on obtient ${h.num(d.ratioE, 2)}. Une voiture qui brûle 6 litres d’essence aux 100 km reste moins chère au LPG tant qu’elle en consomme moins de ${h.num(ex, 1)} litres. Entrez vos chiffres réels dans le budget carburant.`,
        `Per liter wel: vandaag is LPG begrensd op ${h.l3(d.p)} tegenover ${h.l3(d.pE)} voor 95 E10. Per kilometer hangt alles af van uw verbruik. De drempel is te berekenen: de twee prijzen delen geeft ${h.num(d.ratioE, 2)}. Een wagen die 6 liter benzine per 100 km verbruikt, blijft op LPG goedkoper zolang hij er minder dan ${h.num(ex, 1)} liter verbruikt. Vul uw echte cijfers in bij het brandstofbudget.`,
        `Per litre, yes: today LPG is capped at ${h.l3(d.p)} against ${h.l3(d.pE)} for 95 E10. Per kilometre it all depends on consumption. The break-even point is simple: dividing the two prices gives ${h.num(d.ratioE, 2)}. A car burning 6 litres of petrol per 100 km stays cheaper on LPG as long as it uses less than ${h.num(ex, 1)} litres of it. Enter your real figures in the fuel budget.`),
    },
    {
      q: h.T('Pourquoi une voiture au LPG consomme-t-elle plus de litres ?', 'Waarom verbruikt een LPG-wagen meer liter?', 'Why does an LPG car use more litres?'),
      a: h.T(
        'Parce qu’un litre de gaz de pétrole liquéfié contient moins d’énergie qu’un litre d’essence. Le moteur doit donc en brûler davantage pour parcourir la même distance. L’écart dépend du véhicule, du système d’injection et de la conduite : seul votre propre relevé, plein après plein, le donne de façon fiable. C’est ce chiffre qu’il faut comparer au seuil calculé sur cette page.',
        'Omdat een liter vloeibaar petroleumgas minder energie bevat dan een liter benzine. De motor moet er dus meer van verbranden om dezelfde afstand af te leggen. Het verschil hangt af van de wagen, het injectiesysteem en de rijstijl: alleen uw eigen meting, tankbeurt na tankbeurt, geeft het betrouwbaar. Dat cijfer vergelijkt u met de drempel die op deze pagina berekend wordt.',
        'Because a litre of liquefied petroleum gas holds less energy than a litre of petrol. The engine therefore has to burn more of it to cover the same distance. The gap depends on the car, the injection system and the driving: only your own record, fill-up after fill-up, gives it reliably. That is the figure to compare with the break-even point worked out on this page.'),
    },
    {
      q: h.T('Le prix maximum du LPG change-t-il souvent ?', 'Verandert de maximumprijs van LPG vaak?', 'Does the LPG maximum price change often?'),
      a: h.T(
        `${moins ? 'Moins souvent que celui de l’essence et du diesel.' : 'Pas moins souvent que les autres carburants, sur la dernière année.'} Sur les 365 derniers jours, le LPG a reçu ${h.num(d.st.changed)} nouveaux tarifs, ${h.num(d.st.up)} hausses et ${h.num(d.st.down)} baisses, contre ${h.num(d.stE.changed)} pour l’essence 95 E10. ${d.lc ? `Le dernier changement date du ${h.date(d.lc.day)}, avec ${h.cts(d.lc.price - d.lc.before)} par litre.` : ''} Quand il bouge, c’est en moyenne de ${c(h, d.st.meanAbs)} par litre.`,
        `${moins ? 'Minder vaak dan dat van benzine en diesel.' : 'Niet minder vaak dan de andere brandstoffen, over het voorbije jaar.'} Over de voorbije 365 dagen kreeg LPG ${h.num(d.st.changed)} nieuwe tarieven, ${h.num(d.st.up)} stijgingen en ${h.num(d.st.down)} dalingen, tegenover ${h.num(d.stE.changed)} voor benzine 95 E10. ${d.lc ? `De laatste wijziging dateert van ${h.date(d.lc.day)}, met ${h.cts(d.lc.price - d.lc.before)} per liter.` : ''} Als hij beweegt, is het gemiddeld ${c(h, d.st.meanAbs)} per liter.`,
        `${moins ? 'Less often than petrol and diesel.' : 'No less often than the other fuels, over the past year.'} Over the last 365 days LPG got ${h.num(d.st.changed)} new tariffs, ${h.num(d.st.up)} rises and ${h.num(d.st.down)} cuts, against ${h.num(d.stE.changed)} for 95 E10 petrol. ${d.lc ? `The latest change dates from ${h.date(d.lc.day)}, at ${h.cts(d.lc.price - d.lc.before)} a litre.` : ''} When it moves, it does so by ${c(h, d.st.meanAbs)} a litre on average.`).replace(/\s+/g, ' '),
    },
    {
      q: h.T('Toutes les stations-service vendent-elles du LPG ?', 'Verkoopt elk tankstation LPG?', 'Does every filling station sell LPG?'),
      a: h.T(
        'Non, une partie seulement des stations dispose d’une pompe LPG, et le réseau est bien moins dense que pour l’essence ou le diesel. Le prix maximum, lui, est le même partout : toute station qui en vend doit rester sous le plafond du jour. Avant un long trajet, repérer les stations équipées sur l’itinéraire évite de devoir basculer sur le réservoir d’essence.',
        'Nee, slechts een deel van de stations heeft een LPG-pomp, en het netwerk is veel minder dicht dan voor benzine of diesel. De maximumprijs is wel overal dezelfde: elk station dat LPG verkoopt, moet onder het plafond van de dag blijven. Wie een lange rit plant, zoekt beter vooraf de uitgeruste stations op de route op, om niet op de benzinetank te moeten overschakelen.',
        'No, only some stations have an LPG pump, and the network is far thinner than for petrol or diesel. The maximum price, however, is the same everywhere: any station selling it must stay under that day’s ceiling. Before a long trip, finding the equipped stations along the route saves having to switch over to the petrol tank.'),
    },
    {
      q: h.T('Le LPG de la pompe et le propane en citerne ont-ils le même prix ?', 'Hebben LPG aan de pomp en propaan in een tank dezelfde prijs?', 'Do pump LPG and bulk propane in a tank cost the same?'),
      a: h.T(
        `Non, ce sont des lignes distinctes du tarif officiel. Le propane livré en vrac pour le chauffage a ses propres prix maximums, par palier de volume ; ${d.pProp != null ? `aujourd’hui, moins de 2 000 litres de propane sont plafonnés à ${h.l3(d.pProp)} le litre, contre ${h.l3(d.p)} pour le LPG à la pompe.` : 'ils ne suivent pas forcément le même calendrier que le LPG à la pompe.'} Le tarif de la pompe ne s’applique qu’au plein du véhicule.`,
        `Nee, het zijn aparte regels in het officiële tarief. Propaan dat in bulk geleverd wordt voor verwarming heeft eigen maximumprijzen, per volumeschijf; ${d.pProp != null ? `vandaag is propaan onder 2.000 liter begrensd op ${h.l3(d.pProp)} per liter, tegenover ${h.l3(d.p)} voor LPG aan de pomp.` : 'die volgen niet noodzakelijk dezelfde kalender als LPG aan de pomp.'} Het pomptarief geldt alleen voor het tanken van een voertuig.`,
        `No, they are separate lines of the official tariff. Propane delivered in bulk for heating has its own maximum prices, by volume band; ${d.pProp != null ? `today, under 2,000 litres of propane is capped at ${h.l3(d.pProp)} a litre, against ${h.l3(d.p)} for LPG at the pump.` : 'they do not necessarily follow the same calendar as pump LPG.'} The pump tariff applies only to filling a vehicle.`),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const seuils = [5, 6, 7, 8].map((conso) => [h.T(`${h.num(conso)} L/100 km`, `${h.num(conso)} l/100 km`, `${h.num(conso)} L/100 km`), h.eur(conso * d.pE, 2), `${h.num(conso * d.ratioE, 1)} L`]);
  const tSeuil = h.table(
    h.T(['Consommation en essence', 'Coût de 100 km en 95 E10', 'Consommation LPG à ne pas dépasser'], ['Verbruik op benzine', 'Kost van 100 km op 95 E10', 'Maximaal LPG-verbruik'], ['Petrol consumption', 'Cost of 100 km on 95 E10', 'LPG consumption not to exceed']),
    seuils,
    h.T(`Seuil de rentabilité au ${h.date(d.t)} : au-delà de ces consommations, le LPG coûte plus cher au kilomètre que le 95 E10. Les consommations sont des exemples à remplacer par les vôtres.`, `Rendabiliteitsdrempel op ${h.date(d.t)}: boven dit verbruik kost LPG per kilometer meer dan 95 E10. De verbruikscijfers zijn voorbeelden, te vervangen door de uwe.`, `Break-even point on ${h.date(d.t)}: above these figures, LPG costs more per kilometre than 95 E10. The consumption figures are examples to replace with your own.`),
    ['l', 'r', 'r']);
  const tMois = h.table(
    h.T(['Mois', 'Moyenne LPG'], ['Maand', 'Gemiddelde LPG'], ['Month', 'LPG average']),
    d.mois.map(([ym, v]) => [new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(h.T('fr-BE', 'nl-BE', 'en-GB'), { month: 'long', year: 'numeric', timeZone: 'UTC' }), h.l3(v)]),
    h.T('Moyennes mensuelles du prix maximum, TVA comprise, publiées par Statbel.', 'Maandgemiddelden van de maximumprijs, incl. btw, gepubliceerd door Statbel.', 'Monthly averages of the maximum price, VAT included, published by Statbel.'),
    ['l', 'r']);
  const an = d.e364 == null ? '' : d.e364 === 0
    ? h.T('Sur un an, le prix du LPG est revenu exactement à son point de départ.', 'Over een jaar staat de LPG-prijs precies weer op zijn vertrekpunt.', 'Over a year the LPG price is back exactly where it started.')
    : h.T(`Sur un an, le LPG a ${d.e364 > 0 ? 'pris' : 'perdu'} ${c(h, d.e364)} par litre.`, `Over een jaar is LPG ${c(h, d.e364)} per liter ${d.e364 > 0 ? 'duurder' : 'goedkoper'} geworden.`, `Over a year LPG has ${d.e364 > 0 ? 'gained' : 'lost'} ${c(h, d.e364)} a litre.`);
  const y0 = d.y[0], y1 = d.y[d.y.length - 1];
  return h.T(`
<h2>Le bon calcul : le prix au kilomètre, pas au litre</h2>
<p>Comparer un litre de LPG à un litre d’essence ne dit pas grand-chose, parce qu’une voiture au LPG en consomme davantage. La bonne question est : jusqu’à quelle consommation le LPG reste-t-il gagnant ? La réponse tient dans le rapport des deux prix maximums. Aujourd’hui, il est de ${h.num(d.ratioE, 2)} face au 95 E10 et de ${h.num(d.ratioD, 2)} face au diesel B7.</p>
${tSeuil}
<p>Pour chiffrer votre cas, la page ${h.a('budget-carburant', 'budget carburant')} calcule le coût annuel à partir de vos kilomètres et de votre consommation réelle : faites le calcul une fois en LPG et une fois en essence, avec les chiffres de votre propre voiture.</p>
<h2>Douze mois de prix du LPG</h2>
${tMois}
<p>${an} Sur les moyennes annuelles de Statbel, le LPG est passé de ${y0 ? h.l3(y0[1]) : '—'} en ${y0?.[0] ?? ''} à ${y1 ? h.l3(y1[1]) : '—'} en ${y1?.[0] ?? ''}, année en cours. Ces séries se consultent sur ${h.src('bestatMois', 'be.STAT')} ; toutes les courbes, carburant par carburant, sont sur la page ${h.a('historique-carburants', 'historique des prix des carburants')}.</p>
<h2>Un plafond, pas un prix imposé</h2>
<p>Comme pour l’essence et le diesel, le prix maximum du LPG est un plafond légal : vendre au-dessus est interdit, vendre en dessous est permis. ${d.last?.excl != null ? `Le dernier tarif publié, celui du ${h.date(d.last.day)}, se compose de ${h.l3(d.last.excl)} hors TVA et de 21 % de TVA.` : ''} Le prix de la pompe peut donc différer d’une station à l’autre, mais jamais vers le haut. Le tableau de tous les carburants du jour est sur la page ${h.a('prix-carburant', 'prix des carburants')}.</p>
<h2>Ce que fait l’outil</h2>
<p>L’outil affiche le prix maximum du LPG du jour et de demain, la date du dernier changement, le coût d’un plein du volume que vous indiquez et ce que ce plein a gagné ou perdu sur 7 jours, 30 jours et un an. Les chiffres viennent de la série quotidienne ${h.src('bestatJour', 'be.STAT')} ; la page ${h.a('method', 'méthode')} explique l’estimation du lendemain.</p>`,
  `
<h2>De juiste rekensom: de prijs per kilometer, niet per liter</h2>
<p>Een liter LPG vergelijken met een liter benzine zegt weinig, omdat een LPG-wagen er meer van verbruikt. De juiste vraag is: tot welk verbruik blijft LPG voordeliger? Het antwoord zit in de verhouding tussen de twee maximumprijzen. Vandaag bedraagt die ${h.num(d.ratioE, 2)} tegenover 95 E10 en ${h.num(d.ratioD, 2)} tegenover diesel B7.</p>
${tSeuil}
<p>Om uw eigen geval te berekenen, rekent de pagina ${h.a('budget-carburant', 'brandstofbudget')} de jaarkost uit op basis van uw kilometers en uw werkelijke verbruik: maak de berekening één keer met LPG en één keer met benzine, met de cijfers van uw eigen wagen.</p>
<h2>Twaalf maanden LPG-prijzen</h2>
${tMois}
<p>${an} Volgens de jaargemiddelden van Statbel ging LPG van ${y0 ? h.l3(y0[1]) : '—'} in ${y0?.[0] ?? ''} naar ${y1 ? h.l3(y1[1]) : '—'} in ${y1?.[0] ?? ''}, lopend jaar. Die reeksen zijn te raadplegen op ${h.src('bestatMois', 'be.STAT')}; alle curves, brandstof per brandstof, staan op de pagina ${h.a('historique-carburants', 'evolutie van de brandstofprijzen')}.</p>
<h2>Een plafond, geen opgelegde prijs</h2>
<p>Net als voor benzine en diesel is de maximumprijs van LPG een wettelijk plafond: erboven verkopen is verboden, eronder mag. ${d.last?.excl != null ? `Het laatst gepubliceerde tarief, dat van ${h.date(d.last.day)}, bestaat uit ${h.l3(d.last.excl)} exclusief btw en 21 % btw.` : ''} De prijs aan de pomp kan dus van station tot station verschillen, maar nooit naar boven. De tabel van alle brandstoffen van vandaag staat op de pagina ${h.a('prix-carburant', 'brandstofprijzen')}.</p>
<h2>Wat de tool doet</h2>
<p>De tool toont de maximumprijs van LPG voor vandaag en morgen, de datum van de laatste wijziging, de kost van een tankbeurt van het volume dat u opgeeft en wat die tankbeurt over 7 dagen, 30 dagen en een jaar duurder of goedkoper werd. De cijfers komen uit de dagreeks ${h.src('bestatJour', 'be.STAT')}; de pagina ${h.a('method', 'methode')} legt de schatting voor morgen uit.</p>`,
  `
<h2>The right sum: price per kilometre, not per litre</h2>
<p>Comparing a litre of LPG with a litre of petrol says little, because an LPG car burns more of it. The real question is: up to what consumption does LPG still come out ahead? The answer lies in the ratio between the two maximum prices. Today it is ${h.num(d.ratioE, 2)} against 95 E10 and ${h.num(d.ratioD, 2)} against diesel B7.</p>
${tSeuil}
<p>To price your own case, the ${h.a('budget-carburant', 'fuel budget')} page works out the yearly cost from your mileage and real consumption: run it once on LPG and once on petrol, with your own car’s figures.</p>
<h2>Twelve months of LPG prices</h2>
${tMois}
<p>${an} On Statbel’s yearly averages, LPG went from ${y0 ? h.l3(y0[1]) : '—'} in ${y0?.[0] ?? ''} to ${y1 ? h.l3(y1[1]) : '—'} in ${y1?.[0] ?? ''}, the current year. These series can be consulted on ${h.src('bestatMois', 'be.STAT')}; every curve, fuel by fuel, is on the ${h.a('historique-carburants', 'fuel price history')} page.</p>
<h2>A ceiling, not a set price</h2>
<p>As with petrol and diesel, the LPG maximum price is a legal ceiling: selling above it is forbidden, selling below it is allowed. ${d.last?.excl != null ? `The latest tariff published, for ${h.date(d.last.day)}, is made up of ${h.l3(d.last.excl)} excluding VAT plus 21% VAT.` : ''} The pump price can therefore differ from one station to another, but never upwards. Every fuel of the day is listed on the ${h.a('prix-carburant', 'fuel prices')} page.</p>
<h2>What the tool does</h2>
<p>The tool shows today’s and tomorrow’s LPG maximum price, the date of the latest change, the cost of a fill-up of the volume you enter and how much that fill-up has gained or lost over 7 days, 30 days and a year. The figures come from the ${h.src('bestatJour', 'be.STAT')} daily series; the ${h.a('method', 'method')} page explains the next-day estimate.</p>`);
};

export default defineGuide({
  id: 'prix-lpg',
  group: 'carburants',
  order: 6,
  tool: 'produit',
  toolArg: 'lpg',
  related: ['prix-carburant', 'budget-carburant', 'prix-essence', 'historique-carburants'],
  sources: ['bestatJour', 'bestatMois', 'bestatAn', 'spfTarif', 'fondsPrix'],
  fr: {
    slug: 'prix-lpg',
    nav: 'Prix du LPG',
    card: 'Prix maximum de l’autogaz et seuil de rentabilité face à l’essence.',
    title: 'Prix LPG 2026 : prix maximum de l’autogaz en Belgique',
    description: 'Prix du LPG aujourd’hui en Belgique : prix maximum officiel de l’autogaz, prix de demain, consommation jusqu’à laquelle il bat l’essence, et douze mois.',
    h1: 'Prix du LPG aujourd’hui',
    intro: 'Le prix maximum officiel de l’autogaz, celui de demain, et la consommation jusqu’à laquelle il reste plus avantageux que l’essence.',
    resume, faqs, body,
  },
  nl: {
    slug: 'lpg-prijs',
    nav: 'LPG-prijs',
    card: 'Maximumprijs van autogas en de rendabiliteitsdrempel tegenover benzine.',
    title: 'LPG-prijs 2026: officiële maximumprijs autogas vandaag',
    description: 'LPG-prijs vandaag in België: officiële maximumprijs van autogas, de prijs van morgen, het verbruik tot waar LPG goedkoper blijft dan benzine, en twaalf maanden.',
    h1: 'LPG-prijs vandaag',
    intro: 'De officiële maximumprijs van autogas, die van morgen, en het verbruik tot waar LPG voordeliger blijft dan benzine.',
    resume, faqs, body,
  },
  en: {
    slug: 'lpg-price',
    nav: 'LPG price',
    card: 'Maximum price of autogas and the break-even point against petrol.',
    title: 'LPG price Belgium 2026: official autogas maximum today',
    description: 'LPG price in Belgium today: the official autogas maximum, tomorrow’s price, the consumption up to which LPG stays cheaper than petrol, and twelve months.',
    h1: 'LPG price today',
    intro: 'The official maximum price of autogas, tomorrow’s price, and the consumption up to which LPG stays cheaper than petrol.',
    resume, faqs, body,
  },
});
