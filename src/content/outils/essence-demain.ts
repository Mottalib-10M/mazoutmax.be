import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Essence demain : les quatre essences au lendemain, co-mouvement 95/98, comparaison avec le diesel, ce que rate l'estimation. */
const KEYS = ['e10_95', 'e5_95', 'e5_98', 'e10_98'] as const;
const K = 'e10_95' as const;
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const s = M.situation(K, t), tm = s.tomorrow, wdT = M.weekday(tm.day);
  const ch95 = M.changes(K).filter((x) => x.delta !== 0).map((x) => x.day);
  const ch98 = new Set(M.changes('e5_98').filter((x) => x.delta !== 0).map((x) => x.day));
  const ensemble = ch95.filter((x) => ch98.has(x)).length;
  const parJour = [1, 2, 3, 4, 5, 6, 0].map((wd) => ({ wd, n: M.changeStats(K, wd).changed }));
  const top = [...parJour].sort((a, b) => b.n - a.n)[0];
  return {
    M, t, s, tm, wdT, st: M.changeStats(K), stD: M.changeStats('diesel_b7'), stT: M.changeStats(K, wdT),
    bt52: M.backtest(K, 364), bt4: M.backtest(K, 28), ch95: ch95.length, ensemble, top,
    big: M.changes(K).reduce((m, x) => (Math.abs(x.delta) > Math.abs(m.delta) ? x : m), { day: '', delta: 0 }),
  };
}
type DD = ReturnType<typeof D>;

function etat(h: Helpers, d: DD) {
  const tm = d.tm;
  if (tm.official) return tm.delta === 0
    ? h.T(`Le tarif officiel de demain, ${h.date(tm.day)}, est publié : l’essence 95 E10 reste à ${h.l3(tm.price)} le litre, sans changement.`, `Het officiële tarief van morgen, ${h.date(tm.day)}, is gepubliceerd: benzine 95 E10 blijft op ${h.l3(tm.price)} per liter, ongewijzigd.`, `Tomorrow’s official tariff, for ${h.date(tm.day)}, is out: 95 E10 petrol stays at ${h.l3(tm.price)} a litre, unchanged.`)
    : h.T(`Le tarif officiel de demain, ${h.date(tm.day)}, est publié : l’essence 95 E10 passe à ${h.l3(tm.price)} le litre, soit ${h.cts(tm.delta)} par rapport à aujourd’hui.`, `Het officiële tarief van morgen, ${h.date(tm.day)}, is gepubliceerd: benzine 95 E10 gaat naar ${h.l3(tm.price)} per liter, of ${h.cts(tm.delta)} tegenover vandaag.`, `Tomorrow’s official tariff, for ${h.date(tm.day)}, is out: 95 E10 petrol moves to ${h.l3(tm.price)} a litre, ${h.cts(tm.delta)} from today.`);
  return h.T(`Le tarif officiel de demain, ${h.date(tm.day)}, n’est pas encore paru. En attendant, notre estimation de l’essence 95 E10 est de ${h.l3(tm.est.central)} le litre ; ce n’est pas un tarif officiel, et elle sera remplacée dès la publication.`, `Het officiële tarief van morgen, ${h.date(tm.day)}, is nog niet verschenen. Intussen bedraagt onze schatting voor benzine 95 E10 ${h.l3(tm.est.central)} per liter; dat is geen officieel tarief, en ze wordt vervangen zodra het gepubliceerd is.`, `Tomorrow’s official tariff, for ${h.date(tm.day)}, has not appeared yet. Meanwhile our estimate for 95 E10 petrol is ${h.l3(tm.est.central)} a litre; it is not an official tariff, and it will be replaced as soon as one is published.`);
}

function rythme(h: Helpers, d: DD) {
  const moins = d.st.changed < d.stD.changed, egal = d.st.changed === d.stD.changed;
  return h.T(
    `Sur un an, le prix maximum du 95 E10 a changé ${h.num(d.st.changed)} fois, ${egal ? 'autant que' : moins ? 'moins souvent que' : 'plus souvent que'} le diesel B7 (${h.num(d.stD.changed)} fois)`,
    `Over een jaar veranderde de maximumprijs van 95 E10 ${h.num(d.st.changed)} keer, ${egal ? 'even vaak als' : moins ? 'minder vaak dan' : 'vaker dan'} diesel B7 (${h.num(d.stD.changed)} keer)`,
    `Over a year the maximum price of 95 E10 changed ${h.num(d.st.changed)} times, ${egal ? 'as often as' : moins ? 'less often than' : 'more often than'} diesel B7 (${h.num(d.stD.changed)} times)`);
}

/** Part des changements du 95 E10 partagés par le 98 E5, en mots. */
function tog(h: Helpers, d: DD) {
  const r = d.ch95 ? d.ensemble / d.ch95 : 0;
  return r >= 0.9 ? h.T('Presque toujours ensemble, mais pas forcément du même montant.', 'Bijna altijd samen, maar niet noodzakelijk met hetzelfde bedrag.', 'Almost always together, though not necessarily by the same amount.')
    : r >= 0.5 ? h.T('Le plus souvent ensemble, sans que ce soit la règle.', 'Meestal samen, maar dat is geen regel.', 'Usually together, though it is not a rule.')
      : h.T('Pas nécessairement : chaque essence a son propre calendrier de changements.', 'Niet noodzakelijk: elke benzine heeft haar eigen wijzigingskalender.', 'Not necessarily: each petrol has its own calendar of changes.');
}

const resume = (h: Helpers) => {
  const d = D(h);
  return h.T(
    `${etat(h, d)} Les prix maximums de l’essence sont fixés par le SPF Économie selon le contrat-programme conclu entre l’État belge et la fédération pétrolière Energia ; ils suivent des cotations internationales payantes et non publiées, si bien que personne ne peut recalculer à l’avance le tarif du lendemain. ${rythme(h, d)}, avec un mouvement moyen de ${c(h, d.st.meanAbs)} par litre quand il bouge. Reprendre le prix du jour comme estimation du lendemain a vu juste à un centime près ${h.pct(d.bt52.within1c, 0)} des jours sur 52 semaines, pour une erreur moyenne de ${c(h, d.bt52.mae)} par litre, ${c(h, d.bt4.mae)} sur les 4 dernières semaines. Les jours où le 95 E10 a changé, le 98 E5 a changé lui aussi ${h.num(d.ensemble)} fois sur ${h.num(d.ch95)}.`,
    `${etat(h, d)} De maximumprijzen van benzine worden vastgelegd door de FOD Economie volgens de programmaovereenkomst tussen de Belgische Staat en de petroleumfederatie Energia; ze volgen betalende internationale noteringen die niet gepubliceerd worden, zodat niemand het tarief van morgen vooraf kan herberekenen. ${rythme(h, d)}, met een gemiddelde beweging van ${c(h, d.st.meanAbs)} per liter als hij wijzigt. De prijs van vandaag overnemen als schatting voor morgen was over 52 weken op ${h.pct(d.bt52.within1c, 0)} van de dagen juist tot op een cent, met een gemiddelde fout van ${c(h, d.bt52.mae)} per liter, en ${c(h, d.bt4.mae)} over de laatste 4 weken. Op de dagen dat 95 E10 wijzigde, wijzigde ook 98 E5 ${h.num(d.ensemble)} keer op ${h.num(d.ch95)}.`,
    `${etat(h, d)} Maximum petrol prices are set by the FPS Economy under the programme agreement between the Belgian State and the petroleum federation Energia; they follow international quotations that are paid for and not published, so nobody can recompute tomorrow’s tariff in advance. ${rythme(h, d)}, with an average move of ${c(h, d.st.meanAbs)} a litre when it moves. Taking today’s price as the estimate for tomorrow was right to within a cent on ${h.pct(d.bt52.within1c, 0)} of days over 52 weeks, with an average error of ${c(h, d.bt52.mae)} a litre, and ${c(h, d.bt4.mae)} over the last 4 weeks. On the days 95 E10 changed, 98 E5 changed too ${h.num(d.ensemble)} times out of ${h.num(d.ch95)}.`);
};

const faqs = (h: Helpers) => {
  const d = D(h), tm = d.tm;
  const sens = tm.official
    ? (tm.delta < 0 ? h.T('Oui : le tarif officiel publié pour demain est plus bas que celui du jour.', 'Ja: het officiële tarief voor morgen ligt lager dan dat van vandaag.', 'Yes: the official tariff published for tomorrow is lower than today’s.')
      : tm.delta > 0 ? h.T('Non : le tarif officiel publié pour demain est plus élevé que celui du jour.', 'Nee: het officiële tarief voor morgen ligt hoger dan dat van vandaag.', 'No: the official tariff published for tomorrow is higher than today’s.')
        : h.T('Non : le tarif officiel publié pour demain est identique à celui du jour.', 'Nee: het officiële tarief voor morgen is hetzelfde als dat van vandaag.', 'No: the official tariff published for tomorrow is the same as today’s.'))
    : h.T('On ne le sait pas encore : le tarif de demain n’est pas publié.', 'Dat is nog niet bekend: het tarief van morgen is niet gepubliceerd.', 'Not yet known: tomorrow’s tariff has not been published.');
  const etroite = !tm.official && tm.est.low === tm.est.high;
  return [
    {
      q: h.T('Le prix de l’essence baisse-t-il demain ?', 'Daalt de benzineprijs morgen?', 'Is the petrol price going down tomorrow?'),
      a: h.T(
        `${sens} La réponse vaut pour le prix maximum, celui que la station ne peut pas dépasser ; le prix affiché à la pompe peut être inférieur et changer à un autre moment. Un ${d.M.nomJour(d.wdT, 'fr')}, le 95 E10 a reçu un nouveau tarif ${h.num(d.stT.changed)} fois sur ${h.num(d.stT.days)} au cours de l’année écoulée.`,
        `${sens} Het antwoord geldt voor de maximumprijs, die het tankstation niet mag overschrijden; de prijs aan de pomp kan lager liggen en op een ander moment wijzigen. Op een ${d.M.nomJour(d.wdT, 'nl')} kreeg 95 E10 het voorbije jaar ${h.num(d.stT.changed)} keer op ${h.num(d.stT.days)} een nieuw tarief.`,
        `${sens} The answer concerns the maximum price, which the station may not exceed; the price shown at the pump may be lower and change at another time. On a ${d.M.nomJour(d.wdT, 'en')}, 95 E10 got a new tariff ${h.num(d.stT.changed)} times out of ${h.num(d.stT.days)} over the past year.`),
    },
    {
      q: h.T('Pourquoi la fourchette de l’estimation de l’essence est-elle parfois réduite à un seul prix ?', 'Waarom is de vork van de benzineschatting soms één enkele prijs?', 'Why is the petrol estimate’s range sometimes a single price?'),
      a: h.T(
        `Parce qu’elle reprend les variations observées le même jour de la semaine sur un an, en écartant les 10 % les plus fortes dans chaque sens. Quand l’essence n’a pas changé la grande majorité de ces jours-là, la fourchette se resserre sur le dernier prix publié. ${etroite ? 'C’est le cas pour demain.' : 'Ce n’est pas le cas pour demain.'} Une fourchette étroite ne garantit rien : un changement reste possible.`,
        `Omdat ze de schommelingen van dezelfde weekdag over een jaar overneemt en daarbij de sterkste 10 % in elke richting weglaat. Wijzigde benzine op de overgrote meerderheid van die dagen niet, dan krimpt de vork tot de laatst gepubliceerde prijs. ${etroite ? 'Dat is het geval voor morgen.' : 'Dat is voor morgen niet het geval.'} Een smalle vork garandeert niets: een wijziging blijft mogelijk.`,
        `Because it uses the moves seen on the same weekday over a year, leaving out the strongest 10% in each direction. When petrol did not change on the great majority of those days, the range narrows to the last published price. ${etroite ? 'That is the case for tomorrow.' : 'That is not the case for tomorrow.'} A narrow range guarantees nothing: a change is still possible.`),
    },
    {
      q: h.T('Le 95 et le 98 changent-ils de prix le même jour ?', 'Wijzigen 95 en 98 op dezelfde dag van prijs?', 'Do 95 and 98 change price on the same day?'),
      a: h.T(
        `${tog(h, d)} Sur les 365 derniers jours, le 95 E10 a reçu ${h.num(d.ch95)} nouveaux tarifs et le 98 E5 a bougé le même jour ${h.num(d.ensemble)} fois. L’outil permet de choisir l’essence : la carte « demain » se recalcule alors pour ce produit, avec son propre historique de changements.`,
        `${tog(h, d)} Over de voorbije 365 dagen kreeg 95 E10 ${h.num(d.ch95)} nieuwe tarieven en bewoog 98 E5 ${h.num(d.ensemble)} keer op dezelfde dag. In de tool kiest u de benzinesoort: de kaart “morgen” wordt dan herberekend voor dat product, met zijn eigen wijzigingsgeschiedenis.`,
        `${tog(h, d)} Over the last 365 days 95 E10 got ${h.num(d.ch95)} new tariffs and 98 E5 moved on the same day ${h.num(d.ensemble)} times. The tool lets you choose the petrol: the “tomorrow” card is then recalculated for that product, with its own history of changes.`),
    },
    {
      q: h.T('Peut-on connaître le prix de l’essence de la semaine prochaine ?', 'Kan ik de benzineprijs van volgende week al kennen?', 'Can I know next week’s petrol price?'),
      a: h.T(
        'Non. Le seul prix certain au-delà d’aujourd’hui est le tarif officiel de demain, une fois publié. Tout chiffre annoncé plus loin est une prévision, pas un prix maximum : le tarif dépend de cotations internationales du jour, que personne ne peut lire à l’avance. Cette page s’en tient donc au lendemain, avec une estimation clairement signalée tant que le tarif manque.',
        'Nee. De enige zekere prijs na vandaag is het officiële tarief van morgen, zodra het gepubliceerd is. Elk cijfer voor later is een voorspelling, geen maximumprijs: het tarief hangt af van internationale noteringen van de dag zelf, die niemand vooraf kan lezen. Deze pagina beperkt zich dus tot morgen, met een duidelijk aangeduide schatting zolang het tarief ontbreekt.',
        'No. The only certain price beyond today is tomorrow’s official tariff, once published. Any figure given further out is a forecast, not a maximum price: the tariff depends on that day’s international quotations, which nobody can read in advance. This page therefore sticks to tomorrow, with a clearly labelled estimate while the tariff is missing.'),
    },
    {
      q: h.T('Quelle a été la plus forte variation de l’essence en un jour cette année ?', 'Wat was de grootste dagelijkse wijziging van de benzineprijs dit jaar?', 'What was the largest one-day move in the petrol price this year?'),
      a: d.big.day
        ? h.T(
          `Sur les 365 derniers jours, le plus gros changement du 95 E10 est entré en vigueur le ${h.date(d.big.day)} : ${h.cts(d.big.delta)} par litre d’un coup, soit ${h.eur(Math.abs(d.big.delta) * 40, 2)} sur un plein de 40 litres. Ce sont ces jours-là que l’estimation « demain comme aujourd’hui » manque, d’où l’intérêt d’attendre le tarif officiel quand il est sur le point de paraître.`,
          `Over de voorbije 365 dagen ging de grootste wijziging van 95 E10 in op ${h.date(d.big.day)}: ${h.cts(d.big.delta)} per liter in één keer, of ${h.eur(Math.abs(d.big.delta) * 40, 2)} op een tankbeurt van 40 liter. Precies die dagen mist de schatting “morgen zoals vandaag”, en daarom loont het om op het officiële tarief te wachten als het bijna verschijnt.`,
          `Over the last 365 days the largest change to 95 E10 took effect on ${h.date(d.big.day)}: ${h.cts(d.big.delta)} a litre in one go, or ${h.eur(Math.abs(d.big.delta) * 40, 2)} on a 40-litre fill-up. Those are the days the “tomorrow like today” estimate misses, which is why it pays to wait for the official tariff when it is about to come out.`)
        : h.T('Le tarif du 95 E10 n’a pas changé une seule fois sur les 365 derniers jours, ce qui est exceptionnel : le prix maximum est resté au même niveau toute l’année, et l’estimation du lendemain ne s’est donc jamais trompée sur la période observée par cette page.', 'Het tarief van 95 E10 is de voorbije 365 dagen geen enkele keer gewijzigd, wat uitzonderlijk is: de maximumprijs bleef het hele jaar op hetzelfde niveau, en de schatting voor morgen zat in de door deze pagina bekeken periode dus nooit fout.', 'The 95 E10 tariff did not change once over the last 365 days, which is exceptional: the maximum price stayed at the same level all year, so the next-day estimate was never wrong over the period this page looks at.'),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const rows = KEYS.map((k) => {
    const s = M.situation(k, d.t), tm = s.tomorrow;
    const dem = tm.official ? tm.price : tm.est.central;
    return [M.COURT[k][h.lang], h.l3(s.price!), tm.official ? h.l3(tm.price) : `${h.l3(dem)} (${h.T('estimation', 'schatting', 'estimate')})`, tm.official ? (tm.delta === 0 ? h.T('inchangé', 'ongewijzigd', 'unchanged') : h.cts(tm.delta)) : h.T('non publié', 'niet gepubliceerd', 'not published'), h.eur(dem * 40, 2)];
  });
  const tbl = h.table(
    h.T(['Essence', 'Aujourd’hui', 'Demain', 'Variation officielle', 'Plein de 40 L demain'], ['Benzine', 'Vandaag', 'Morgen', 'Officiële wijziging', 'Tankbeurt van 40 l morgen'], ['Petrol', 'Today', 'Tomorrow', 'Official change', '40 L fill-up tomorrow']),
    rows,
    h.T(`Prix maximums au litre, TVA comprise, du ${h.date(d.t)} au ${h.date(d.tm.day)}.`, `Maximumprijzen per liter, incl. btw, van ${h.date(d.t)} tot ${h.date(d.tm.day)}.`, `Maximum prices a litre, VAT included, from ${h.date(d.t)} to ${h.date(d.tm.day)}.`),
    ['l', 'r', 'r', 'r', 'r']);
  const amp = d.st.meanAbs > d.stD.meanAbs;
  return h.T(`
<h2>Les quatre essences, d’aujourd’hui à demain</h2>
<p>Le tableau met côte à côte le prix maximum du jour et celui du lendemain pour chacune des essences du tarif officiel. Quand le tarif de demain est publié, la colonne « variation » donne le mouvement exact ; sinon, la valeur affichée est une estimation, et le coût du plein qui en découle aussi.</p>
${tbl}
<h2>L’essence bouge-t-elle comme le diesel ?</h2>
<p>${rythme(h, d)}. Quand elle change, l’essence 95 E10 bouge en moyenne de ${c(h, d.st.meanAbs)} par litre, contre ${c(h, d.stD.meanAbs)} pour le diesel : ses mouvements sont donc ${amp ? 'plus amples' : 'moins amples'} en moyenne. Le jour de la semaine où un nouveau tarif de l’essence est entré en vigueur le plus souvent est le ${M.nomJour(d.top.wd, 'fr')}, avec ${h.num(d.top.n)} changements. Le détail par jour pour le diesel se trouve sur la page ${h.a('diesel-demain', 'prix du diesel demain')}.</p>
<h2>Ce que le tarif de demain change à la pompe</h2>
<p>Le tarif officiel publié pour demain fixe le plafond de toute la journée, dans toutes les stations. Il ne dit pas à quel prix une station vendra : elle reste libre d’afficher moins que le maximum. Il sert à deux choses. D’abord, savoir si le plafond monte ou descend, et donc s’il vaut la peine d’avancer ou de retarder un plein. Ensuite, vérifier après coup que le prix payé ne dépassait pas le maximum du jour de l’achat. Le prix du jour et l’évolution sur un an de chaque essence sont sur la page ${h.a('prix-essence', 'prix de l’essence')}.</p>
<h2>Comment se construit l’estimation, et ce qu’elle rate</h2>
<p>Le contrat-programme, dont l’annexe technique date du 9 octobre 2006, calcule le prix maximum à partir de cotations que le site ne peut pas lire. L’estimation reprend donc le dernier tarif publié, puis l’entoure des variations observées le même jour de la semaine sur les 52 dernières semaines. Elle a vu juste à un centime près ${h.pct(d.bt52.within1c, 0)} des jours ; elle rate, par construction, les jours où un nouveau tarif tombe. Le détail du calcul et de la mesure d’erreur est sur la page ${h.a('method', 'méthode')}, et les données viennent de la série ${h.src('bestatJour', 'be.STAT')} de Statbel.</p>`,
  `
<h2>De vier benzines, van vandaag tot morgen</h2>
<p>De tabel zet de maximumprijs van vandaag en die van morgen naast elkaar voor elke benzine uit het officiële tarief. Is het tarief van morgen gepubliceerd, dan geeft de kolom “wijziging” de exacte beweging; anders is de getoonde waarde een schatting, net als de kost van de tankbeurt die eruit volgt.</p>
${tbl}
<h2>Beweegt benzine zoals diesel?</h2>
<p>${rythme(h, d)}. Als ze wijzigt, beweegt benzine 95 E10 gemiddeld ${c(h, d.st.meanAbs)} per liter, tegenover ${c(h, d.stD.meanAbs)} voor diesel: haar bewegingen zijn gemiddeld dus ${amp ? 'groter' : 'kleiner'}. De weekdag waarop het vaakst een nieuw benzinetarief inging, is ${M.nomJour(d.top.wd, 'nl')}, met ${h.num(d.top.n)} wijzigingen. Het overzicht per dag voor diesel staat op de pagina ${h.a('diesel-demain', 'dieselprijs morgen')}.</p>
<h2>Wat het tarief van morgen aan de pomp betekent</h2>
<p>Het officiële tarief voor morgen legt het plafond vast voor de hele dag, in alle tankstations. Het zegt niet tegen welke prijs een station zal verkopen: het blijft vrij om minder dan het maximum te vragen. Het dient voor twee dingen. Eerst om te weten of het plafond stijgt of daalt, en dus of het loont een tankbeurt te vervroegen of uit te stellen. Daarna om achteraf te controleren dat de betaalde prijs niet boven het maximum van de aankoopdag lag. De prijs van vandaag en het verloop over een jaar van elke benzine staan op de pagina ${h.a('prix-essence', 'benzineprijs')}.</p>
<h2>Hoe de schatting tot stand komt, en wat ze mist</h2>
<p>De programmaovereenkomst, waarvan de technische bijlage dateert van 9 oktober 2006, berekent de maximumprijs op basis van noteringen die de site niet kan lezen. De schatting neemt dus het laatst gepubliceerde tarief over en omringt het met de schommelingen van dezelfde weekdag over de laatste 52 weken. Ze was op ${h.pct(d.bt52.within1c, 0)} van de dagen juist tot op een cent; per definitie mist ze de dagen waarop een nieuw tarief valt. De berekening en de foutmeting staan op de pagina ${h.a('method', 'methode')}, en de gegevens komen uit de ${h.src('bestatJour', 'be.STAT')}-reeks van Statbel.</p>`,
  `
<h2>The four petrols, from today to tomorrow</h2>
<p>The table sets today’s maximum price beside tomorrow’s for each petrol in the official tariff. When tomorrow’s tariff is out, the “change” column gives the exact move; otherwise the value shown is an estimate, and so is the fill-up cost that follows from it.</p>
${tbl}
<h2>Does petrol move like diesel?</h2>
<p>${rythme(h, d)}. When it changes, 95 E10 petrol moves by ${c(h, d.st.meanAbs)} a litre on average, against ${c(h, d.stD.meanAbs)} for diesel: its moves are therefore ${amp ? 'larger' : 'smaller'} on average. The weekday on which a new petrol tariff most often took effect is ${M.nomJour(d.top.wd, 'en')}, with ${h.num(d.top.n)} changes. The day-by-day breakdown for diesel is on the ${h.a('diesel-demain', 'diesel price tomorrow')} page.</p>
<h2>What tomorrow’s tariff changes at the pump</h2>
<p>The official tariff published for tomorrow sets the ceiling for the whole day, at every station. It does not say what a station will charge: it remains free to sell below the maximum. It is useful in two ways. First, to know whether the ceiling is going up or down, and so whether to bring a fill-up forward or put it off. Second, to check afterwards that the price you paid was not above the maximum for the day you bought. Today’s price and the one-year trend for each petrol are on the ${h.a('prix-essence', 'petrol price')} page.</p>
<h2>How the estimate is built, and what it misses</h2>
<p>The programme agreement, whose technical annex dates from 9 October 2006, works out the maximum price from quotations this site cannot read. The estimate therefore takes the last published tariff and frames it with the moves seen on the same weekday over the last 52 weeks. It was right to within a cent on ${h.pct(d.bt52.within1c, 0)} of days; by design it misses the days when a new tariff lands. The calculation and the error measurement are on the ${h.a('method', 'method')} page, and the data come from Statbel’s ${h.src('bestatJour', 'be.STAT')} series.</p>`);
};

export default defineGuide({
  id: 'essence-demain',
  group: 'carburants',
  order: 5,
  tool: 'demain',
  toolArg: 'essence',
  related: ['prix-essence', 'diesel-demain', 'prix-carburant', 'historique-carburants'],
  sources: ['bestatJour', 'spfTarif', 'fondsPrix'],
  fr: {
    slug: 'prix-essence-demain',
    nav: 'Prix de l’essence demain',
    card: 'Le prix maximum du 95 et du 98 pour demain, officiel ou estimé.',
    title: 'Prix essence demain 2026 : 95 et 98, tarif ou estimation',
    description: 'Prix de l’essence demain en Belgique : tarif officiel du 95 E10, du 95 E5 et du 98 dès sa parution, sinon une estimation dont la précision est mesurée sur 1 an.',
    h1: 'Prix de l’essence demain',
    intro: 'Le prix maximum de l’essence pour demain, 95 et 98 : le tarif officiel s’il est publié, sinon une estimation signalée.',
    resume, faqs, body,
  },
  nl: {
    slug: 'benzineprijs-morgen',
    nav: 'Benzineprijs morgen',
    card: 'De maximumprijs van 95 en 98 voor morgen, officieel of geschat.',
    title: 'Benzineprijs morgen 2026: 95 en 98, tarief of schatting',
    description: 'Benzineprijs morgen in België: het officiële tarief van 95 E10, 95 E5 en 98 zodra het verschijnt, anders een schatting waarvan de nauwkeurigheid gemeten wordt.',
    h1: 'Benzineprijs morgen',
    intro: 'De maximumprijs van benzine voor morgen, 95 en 98: het officiële tarief als het gepubliceerd is, anders een aangeduide schatting.',
    resume, faqs, body,
  },
  en: {
    slug: 'petrol-price-tomorrow',
    nav: 'Petrol price tomorrow',
    card: 'Tomorrow’s maximum price for 95 and 98 petrol, official or estimated.',
    title: 'Petrol price tomorrow 2026: 95 and 98, tariff or estimate',
    description: 'Petrol price tomorrow in Belgium: the official tariff for 95 E10, 95 E5 and 98 once it is out, otherwise an estimate with its accuracy measured over a year.',
    h1: 'Petrol price tomorrow',
    intro: 'The maximum price of petrol for tomorrow, 95 and 98: the official tariff if published, otherwise a labelled estimate.',
    resume, faqs, body,
  },
});
