import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Budget carburant d'une voiture : kilomètres × consommation × prix maximum du jour, et sensibilité au prix de l'année. */
const KM = 15000, CONSO = 6;
const KT = ['diesel_b7', 'e10_95', 'e5_98'] as const;

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const pD = M.priceOn('diesel_b7', t)!, pE = M.priceOn('e10_95', t)!;
  const bD = M.budgetVoiture(KM, CONSO, pD), bE = M.budgetVoiture(KM, CONSO, pE);
  const rD = M.range('diesel_b7', 365, t), rE = M.range('e10_95', 365, t);
  return {
    M, t, pD, pE, bD, bE, rD, rE,
    minD: M.budgetVoiture(KM, CONSO, rD.min[1]).total, maxD: M.budgetVoiture(KM, CONSO, rD.max[1]).total,
    minE: M.budgetVoiture(KM, CONSO, rE.min[1]).total, maxE: M.budgetVoiture(KM, CONSO, rE.max[1]).total,
  };
}

const resume = (h: Helpers) => {
  const d = D(h);
  return h.T(
    `Une voiture qui roule ${h.num(KM)} kilomètres par an en consommant ${h.num(CONSO)} litres aux 100 km brûle ${h.num(d.bD.litres)} litres de carburant. Au prix maximum officiel du ${h.date(d.t)}, cela représente au plus ${h.eur(d.bD.total)} par an en diesel B7 (${h.l3(d.pD)} le litre), soit ${h.eur(d.bD.mois)} par mois, et ${h.eur(d.bE.total)} en essence 95 E10 (${h.l3(d.pE)} le litre). Le même trajet annuel aurait coûté au plus ${h.eur(d.minD)} en diesel au prix le plus bas des douze derniers mois, le ${h.date(d.rD.min[0])}, et ${h.eur(d.maxD)} au plus haut, le ${h.date(d.rD.max[0])}. Chaque centime de hausse au litre ajoute ${h.eur(d.bD.litres * 0.01, 2)} à la facture annuelle. Ces chiffres sont un exemple tiré des valeurs par défaut de l’outil : remplacez-les par vos kilomètres et votre consommation réelle. Le prix maximum est fixé par le SPF Économie selon le contrat-programme ; une station peut vendre moins cher, si bien que le budget obtenu est un plafond.`,
    `Een wagen die ${h.num(KM)} kilometer per jaar rijdt en ${h.num(CONSO)} liter per 100 km verbruikt, verbrandt ${h.num(d.bD.litres)} liter brandstof. Tegen de officiële maximumprijs van ${h.date(d.t)} is dat hoogstens ${h.eur(d.bD.total)} per jaar met diesel B7 (${h.l3(d.pD)} per liter), of ${h.eur(d.bD.mois)} per maand, en ${h.eur(d.bE.total)} met benzine 95 E10 (${h.l3(d.pE)} per liter). Hetzelfde jaartraject had met diesel hoogstens ${h.eur(d.minD)} gekost tegen de laagste prijs van de voorbije twaalf maanden, op ${h.date(d.rD.min[0])}, en ${h.eur(d.maxD)} tegen de hoogste, op ${h.date(d.rD.max[0])}. Elke cent stijging per liter voegt ${h.eur(d.bD.litres * 0.01, 2)} toe aan de jaarrekening. Die cijfers zijn een voorbeeld op basis van de standaardwaarden van de tool: vervang ze door uw kilometers en uw werkelijke verbruik. De maximumprijs wordt vastgelegd door de FOD Economie volgens de programmaovereenkomst; een station mag goedkoper verkopen, zodat het berekende budget een plafond is.`,
    `A car driven ${h.num(KM)} kilometres a year at ${h.num(CONSO)} litres per 100 km burns ${h.num(d.bD.litres)} litres of fuel. At the official maximum price of ${h.date(d.t)}, that comes to at most ${h.eur(d.bD.total)} a year on diesel B7 (${h.l3(d.pD)} a litre), or ${h.eur(d.bD.mois)} a month, and ${h.eur(d.bE.total)} on 95 E10 petrol (${h.l3(d.pE)} a litre). The same year of driving would have cost at most ${h.eur(d.minD)} on diesel at the lowest price of the last twelve months, on ${h.date(d.rD.min[0])}, and ${h.eur(d.maxD)} at the highest, on ${h.date(d.rD.max[0])}. Each cent added to the litre price puts ${h.eur(d.bD.litres * 0.01, 2)} on the yearly bill. These figures are an example built from the tool’s default values: replace them with your own mileage and real consumption. The maximum price is set by the FPS Economy under the programme agreement; a station may sell for less, so the budget you get is a ceiling.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  return [
    {
      q: h.T('Comment mesurer la consommation réelle de ma voiture ?', 'Hoe meet ik het werkelijke verbruik van mijn auto?', 'How do I measure my car’s real fuel consumption?'),
      a: h.T(
        'Faites le plein jusqu’à l’arrêt du pistolet et remettez le compteur journalier à zéro. Au plein suivant, refaites le plein de la même façon et notez les litres versés : divisez-les par les kilomètres parcourus et multipliez par 100. Répétez l’opération sur trois ou quatre pleins pour lisser les écarts. C’est ce chiffre, et non celui du catalogue, qu’il faut entrer dans l’outil.',
        'Tank vol tot het pistool afslaat en zet de dagteller op nul. Tank bij de volgende beurt op dezelfde manier vol en noteer de getankte liters: deel ze door de gereden kilometers en vermenigvuldig met 100. Herhaal dat over drie of vier tankbeurten om uitschieters af te vlakken. Dat cijfer, en niet dat van de folder, vult u in de tool in.',
        'Fill the tank until the nozzle clicks off and reset the trip meter. At the next fill-up, fill it the same way and note the litres added: divide them by the kilometres driven and multiply by 100. Repeat over three or four fill-ups to smooth out the swings. That figure, not the brochure one, is what to enter in the tool.'),
    },
    {
      q: h.T(`Combien coûte une année de carburant pour ${h.num(KM)} km ?`, `Wat kost een jaar brandstof voor ${h.num(KM)} km?`, `What does a year of fuel cost for ${h.num(KM)} km?`),
      a: h.T(
        `À ${h.num(CONSO)} litres aux 100 km, ${h.num(KM)} km demandent ${h.num(d.bD.litres)} litres. Au prix maximum du ${h.date(d.t)}, la facture annuelle atteint au plus ${h.eur(d.bD.total)} en diesel B7 et ${h.eur(d.bE.total)} en essence 95 E10. À 5 litres aux 100 km, elle tombe à ${h.eur(d.M.budgetVoiture(KM, 5, d.pD).total)} en diesel ; à 8 litres, elle monte à ${h.eur(d.M.budgetVoiture(KM, 8, d.pD).total)}.`,
        `Bij ${h.num(CONSO)} liter per 100 km vragen ${h.num(KM)} km ${h.num(d.bD.litres)} liter. Tegen de maximumprijs van ${h.date(d.t)} bedraagt de jaarrekening hoogstens ${h.eur(d.bD.total)} met diesel B7 en ${h.eur(d.bE.total)} met benzine 95 E10. Bij 5 liter per 100 km zakt ze naar ${h.eur(d.M.budgetVoiture(KM, 5, d.pD).total)} met diesel; bij 8 liter stijgt ze naar ${h.eur(d.M.budgetVoiture(KM, 8, d.pD).total)}.`,
        `At ${h.num(CONSO)} litres per 100 km, ${h.num(KM)} km take ${h.num(d.bD.litres)} litres. At the maximum price of ${h.date(d.t)}, the yearly bill comes to at most ${h.eur(d.bD.total)} on diesel B7 and ${h.eur(d.bE.total)} on 95 E10 petrol. At 5 litres per 100 km it drops to ${h.eur(d.M.budgetVoiture(KM, 5, d.pD).total)} on diesel; at 8 litres it rises to ${h.eur(d.M.budgetVoiture(KM, 8, d.pD).total)}.`),
    },
    {
      q: h.T('Le budget carburant calculé est-il un maximum ou une moyenne ?', 'Is het berekende brandstofbudget een maximum of een gemiddelde?', 'Is the calculated fuel budget a maximum or an average?'),
      a: h.T(
        'Un maximum. L’outil applique le prix maximum officiel du jour à tous vos kilomètres de l’année. Comme les stations peuvent vendre sous ce plafond, et comme le prix change en cours d’année, la dépense réelle sera différente : plus basse si vous faites le plein dans des stations moins chères, plus haute ou plus basse selon l’évolution des tarifs. Les lignes « prix le plus bas » et « prix le plus haut » encadrent ce risque.',
        'Een maximum. De tool past de officiële maximumprijs van vandaag toe op al uw kilometers van het jaar. Omdat stations onder dat plafond mogen verkopen en de prijs in de loop van het jaar verandert, zal de echte uitgave anders uitvallen: lager als u bij goedkopere stations tankt, hoger of lager naargelang de tarieven evolueren. De regels “laagste prijs” en “hoogste prijs” omkaderen dat risico.',
        'A maximum. The tool applies today’s official maximum price to all your kilometres for the year. Since stations may sell below that ceiling, and the price changes during the year, real spending will differ: lower if you fill up at cheaper stations, higher or lower depending on how tariffs move. The “lowest price” and “highest price” lines frame that risk.'),
    },
    {
      q: h.T('Que coûte une hausse d’un centime par litre sur une année ?', 'Wat kost een stijging van één cent per liter over een jaar?', 'What does a one-cent rise per litre cost over a year?'),
      a: h.T(
        `Exactement un centime multiplié par vos litres annuels. Pour ${h.num(d.bD.litres)} litres, soit ${h.num(KM)} km à ${h.num(CONSO)} litres aux 100 km, cela fait ${h.eur(d.bD.litres * 0.01, 2)} par an. Sur les douze derniers mois, l’écart entre le plus bas et le plus haut du diesel B7 a été de ${h.cts(d.rD.max[1] - d.rD.min[1]).replace(/^[+−]/, '')}, ce qui donne l’ordre de grandeur des variations possibles d’un budget.`,
        `Precies één cent maal uw liters per jaar. Voor ${h.num(d.bD.litres)} liter, of ${h.num(KM)} km aan ${h.num(CONSO)} liter per 100 km, is dat ${h.eur(d.bD.litres * 0.01, 2)} per jaar. Over de voorbije twaalf maanden bedroeg het verschil tussen de laagste en de hoogste stand van diesel B7 ${h.cts(d.rD.max[1] - d.rD.min[1]).replace(/^[+−]/, '')}, wat een idee geeft van hoe sterk een budget kan schommelen.`,
        `Exactly one cent times your yearly litres. For ${h.num(d.bD.litres)} litres, which is ${h.num(KM)} km at ${h.num(CONSO)} litres per 100 km, that makes ${h.eur(d.bD.litres * 0.01, 2)} a year. Over the last twelve months the gap between the lowest and highest diesel B7 price was ${h.cts(d.rD.max[1] - d.rD.min[1]).replace(/^[+−]/, '')}, which gives the scale of how far a budget can swing.`),
    },
    {
      q: h.T('Comment comparer le budget d’une voiture diesel et d’une voiture essence ?', 'Hoe vergelijk ik het budget van een diesel- en een benzinewagen?', 'How do I compare the budget of a diesel car and a petrol car?'),
      a: h.T(
        'Faites deux calculs avec les mêmes kilomètres, mais avec la consommation propre à chaque moteur : une version diesel et une version essence d’un même modèle ne consomment pas autant. Choisissez le carburant dans l’outil, entrez la consommation correspondante, notez le budget, puis recommencez. Le carburant le moins cher au litre n’est pas toujours celui qui coûte le moins sur l’année.',
        'Maak twee berekeningen met dezelfde kilometers, maar met het verbruik dat bij elke motor hoort: een diesel- en een benzineversie van hetzelfde model verbruiken niet evenveel. Kies de brandstof in de tool, vul het bijbehorende verbruik in, noteer het budget en begin opnieuw. De brandstof die per liter het goedkoopst is, is niet altijd die welke over het jaar het minst kost.',
        'Run two calculations with the same mileage but with each engine’s own consumption: diesel and petrol versions of the same model do not burn the same amount. Pick the fuel in the tool, enter the matching consumption, note the budget, then start again. The fuel that is cheapest per litre is not always the one that costs least over the year.'),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const consos = [4, 5, 6, 7, 8, 9];
  const t100 = h.table(
    [h.T('Consommation', 'Verbruik', 'Consumption'), ...KT.map((k) => M.COURT[k][h.lang])],
    consos.map((cc) => [h.T(`${h.num(cc)} L/100 km`, `${h.num(cc)} l/100 km`, `${h.num(cc)} L/100 km`), ...KT.map((k) => h.eur(cc * M.priceOn(k, d.t)!, 2))]),
    h.T(`Coût maximum de 100 km au prix du ${h.date(d.t)}. Les consommations sont des exemples : la vôtre se mesure au plein.`, `Maximale kost van 100 km tegen de prijs van ${h.date(d.t)}. De verbruikscijfers zijn voorbeelden: het uwe meet u bij het tanken.`, `Maximum cost of 100 km at the price of ${h.date(d.t)}. The consumption figures are examples: yours is measured at the pump.`),
    ['l', 'r', 'r', 'r']);
  const tAn = h.table(
    [h.T('Prix appliqué', 'Toegepaste prijs', 'Price applied'), M.COURT.diesel_b7[h.lang], M.COURT.e10_95[h.lang]],
    [
      [h.T('Plus bas sur un an', 'Laagste over een jaar', 'Lowest over a year'), h.eur(d.minD), h.eur(d.minE)],
      [h.T('Moyenne sur un an', 'Gemiddelde over een jaar', 'Average over a year'), h.eur(M.budgetVoiture(KM, CONSO, d.rD.mean).total), h.eur(M.budgetVoiture(KM, CONSO, d.rE.mean).total)],
      [h.T('Aujourd’hui', 'Vandaag', 'Today'), h.eur(d.bD.total), h.eur(d.bE.total)],
      [h.T('Plus haut sur un an', 'Hoogste over een jaar', 'Highest over a year'), h.eur(d.maxD), h.eur(d.maxE)],
    ],
    h.T(`Budget annuel maximum pour ${h.num(KM)} km à ${h.num(CONSO)} L/100 km.`, `Maximaal jaarbudget voor ${h.num(KM)} km aan ${h.num(CONSO)} l/100 km.`, `Maximum yearly budget for ${h.num(KM)} km at ${h.num(CONSO)} L/100 km.`),
    ['l', 'r', 'r']);
  return h.T(`
<h2>Le calcul en une ligne</h2>
<p>Le budget carburant d’une année se résume à une multiplication : kilomètres par an, multipliés par la consommation aux 100 km, divisés par 100, multipliés par le prix au litre. L’outil fait ce calcul au prix maximum officiel du jour, pour le carburant que vous choisissez, puis le refait au prix le plus bas et au prix le plus haut des douze derniers mois, pour montrer l’amplitude possible.</p>
<h2>Ce que coûtent 100 km aujourd’hui</h2>
${t100}
<p>Le tableau permet de lire directement le coût d’un trajet : un aller-retour de 40 km dans une voiture à 6 litres aux 100 km coûte au plus ${h.eur(0.4 * 6 * d.pD, 2)} en diesel et ${h.eur(0.4 * 6 * d.pE, 2)} en essence 95 E10. Pour le LPG, dont la consommation en litres est plus élevée, la page ${h.a('prix-lpg', 'prix du LPG')} calcule la consommation à partir de laquelle il cesse d’être avantageux.</p>
<h2>Une année de prix, un budget qui bouge</h2>
<p>Sur les 365 derniers jours, le prix maximum du diesel a changé ${h.num(M.changeStats('diesel_b7').changed)} fois et celui de l’essence 95 E10 ${h.num(M.changeStats('e10_95').changed)} fois. Appliquer celui du jour à toute une année donne une photographie, pas une prévision. Le tableau suivant reprend l’exemple de ${h.num(KM)} km à ${h.num(CONSO)} litres aux 100 km avec les prix extrêmes et moyens des 365 derniers jours.</p>
${tAn}
<p>L’écart entre la ligne la plus basse et la plus haute dit combien un budget voiture dépend du moment. Les courbes complètes sont sur la page ${h.a('historique-carburants', 'historique des prix des carburants')}.</p>
<h2>Un plafond, pas une facture</h2>
<p>Le prix maximum est fixé par le ${h.src('spfTarif', 'SPF Économie')} et repris chaque jour par Statbel sur ${h.src('bestatJour', 'be.STAT')}. Une station peut vendre en dessous : le budget calculé ici est donc ce que l’année vous coûterait au pire au tarif du jour. Pour comparer deux carburants sur un même plein, voyez ${h.a('prix-carburant', 'prix des carburants')} ; pour le chauffage au mazout, le même calcul existe sur ${h.a('budget-chauffage', 'budget chauffage')}.</p>`,
  `
<h2>De berekening in één regel</h2>
<p>Het brandstofbudget van een jaar komt neer op een vermenigvuldiging: kilometers per jaar, maal het verbruik per 100 km, gedeeld door 100, maal de prijs per liter. De tool maakt die berekening tegen de officiële maximumprijs van vandaag, voor de brandstof die u kiest, en herhaalt ze tegen de laagste en de hoogste prijs van de voorbije twaalf maanden, om de mogelijke spreiding te tonen.</p>
<h2>Wat 100 km vandaag kost</h2>
${t100}
<p>Uit de tabel leest u meteen de kost van een rit af: een heen-en-terugrit van 40 km met een wagen die 6 liter per 100 km verbruikt, kost hoogstens ${h.eur(0.4 * 6 * d.pD, 2)} met diesel en ${h.eur(0.4 * 6 * d.pE, 2)} met benzine 95 E10. Voor LPG, waarvan het verbruik in liter hoger ligt, berekent de pagina ${h.a('prix-lpg', 'LPG-prijs')} vanaf welk verbruik het niet langer voordelig is.</p>
<h2>Een jaar prijzen, een budget dat beweegt</h2>
<p>Over de voorbije 365 dagen veranderde de maximumprijs van diesel ${h.num(M.changeStats('diesel_b7').changed)} keer en die van benzine 95 E10 ${h.num(M.changeStats('e10_95').changed)} keer. De prijs van vandaag toepassen op een heel jaar geeft een momentopname, geen voorspelling. De volgende tabel neemt het voorbeeld van ${h.num(KM)} km aan ${h.num(CONSO)} liter per 100 km met de uiterste en gemiddelde prijzen van de voorbije 365 dagen.</p>
${tAn}
<p>Het verschil tussen de laagste en de hoogste regel toont hoe sterk een autobudget van het moment afhangt. De volledige curves staan op de pagina ${h.a('historique-carburants', 'evolutie van de brandstofprijzen')}.</p>
<h2>Een plafond, geen factuur</h2>
<p>De maximumprijs wordt vastgelegd door de ${h.src('spfTarif', 'FOD Economie')} en elke dag door Statbel overgenomen op ${h.src('bestatJour', 'be.STAT')}. Een station mag lager verkopen: het budget dat hier berekend wordt, is dus wat het jaar u in het slechtste geval kost tegen het tarief van vandaag. Om twee brandstoffen op dezelfde tankbeurt te vergelijken, ziet u ${h.a('prix-carburant', 'brandstofprijzen')}; voor verwarming met mazout bestaat dezelfde berekening op ${h.a('budget-chauffage', 'verwarmingsbudget')}.</p>`,
  `
<h2>The calculation in one line</h2>
<p>A year’s fuel budget comes down to one multiplication: kilometres a year, times consumption per 100 km, divided by 100, times the price per litre. The tool does this at today’s official maximum price for the fuel you choose, then repeats it at the lowest and highest prices of the last twelve months, to show the possible spread.</p>
<h2>What 100 km costs today</h2>
${t100}
<p>The table gives the cost of a trip at a glance: a 40 km round trip in a car using 6 litres per 100 km costs at most ${h.eur(0.4 * 6 * d.pD, 2)} on diesel and ${h.eur(0.4 * 6 * d.pE, 2)} on 95 E10 petrol. For LPG, which burns more litres, the ${h.a('prix-lpg', 'LPG price')} page works out the consumption above which it stops paying off.</p>
<h2>A year of prices, a budget that moves</h2>
<p>Over the last 365 days the maximum price of diesel changed ${h.num(M.changeStats('diesel_b7').changed)} times and that of 95 E10 petrol ${h.num(M.changeStats('e10_95').changed)} times. Applying today’s price to a whole year gives a snapshot, not a forecast. The next table takes the example of ${h.num(KM)} km at ${h.num(CONSO)} litres per 100 km with the extreme and average prices of the last 365 days.</p>
${tAn}
<p>The gap between the lowest and highest lines shows how much a car budget depends on timing. The full curves are on the ${h.a('historique-carburants', 'fuel price history')} page.</p>
<h2>A ceiling, not a bill</h2>
<p>The maximum price is set by the ${h.src('spfTarif', 'FPS Economy')} and taken up every day by Statbel on ${h.src('bestatJour', 'be.STAT')}. A station may sell for less, so the budget worked out here is what the year would cost you at worst at today’s tariff. To compare two fuels on the same fill-up, see ${h.a('prix-carburant', 'fuel prices')}; for heating with oil, the same calculation is on ${h.a('budget-chauffage', 'heating budget')}.</p>`);
};

export default defineGuide({
  id: 'budget-carburant',
  group: 'carburants',
  order: 8,
  tool: 'budgetVoiture',
  related: ['prix-carburant', 'prix-diesel', 'prix-essence', 'prix-lpg', 'historique-carburants'],
  sources: ['bestatJour', 'spfTarif', 'fondsPrix'],
  fr: {
    slug: 'budget-carburant',
    nav: 'Budget carburant',
    card: 'Le coût annuel de votre voiture au prix maximum du jour, et sa fourchette sur un an.',
    title: 'Budget carburant 2026 : coût annuel de votre voiture',
    description: 'Budget carburant de votre voiture en Belgique : coût annuel et mensuel au prix maximum officiel du jour, coût de 100 km et effet des prix extrêmes de l’année.',
    h1: 'Budget carburant de votre voiture',
    intro: 'Ce que vos kilomètres de l’année coûtent au plus, au prix maximum officiel du jour, et ce qu’ils auraient coûté au plus bas et au plus haut de l’année.',
    resume, faqs, body,
  },
  nl: {
    slug: 'brandstofbudget',
    nav: 'Brandstofbudget',
    card: 'De jaarkost van uw wagen tegen de maximumprijs van vandaag, en de spreiding over een jaar.',
    title: 'Brandstofbudget 2026: wat kost tanken u per jaar in België?',
    description: 'Brandstofbudget van uw wagen in België: jaar- en maandkost tegen de officiële maximumprijs van vandaag, kost van 100 km en de laagste en hoogste prijs.',
    h1: 'Brandstofbudget van uw wagen',
    intro: 'Wat uw kilometers van het jaar hoogstens kosten tegen de officiële maximumprijs van vandaag, en wat ze gekost hadden tegen de laagste en de hoogste prijs.',
    resume, faqs, body,
  },
  en: {
    slug: 'fuel-budget',
    nav: 'Fuel budget',
    card: 'Your car’s yearly fuel cost at today’s maximum price, and its range over a year.',
    title: 'Fuel budget 2026: the yearly cost of running your car today',
    description: 'Fuel budget for your car in Belgium: yearly and monthly cost at today’s official maximum price, the cost of 100 km and the year’s lowest and highest prices.',
    h1: 'Your car’s fuel budget',
    intro: 'What your year of driving costs at most at today’s official maximum price, and what it would have cost at the year’s lowest and highest prices.',
    resume, faqs, body,
  },
});
