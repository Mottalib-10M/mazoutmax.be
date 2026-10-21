import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Diesel demain : tarif officiel du lendemain ou estimation, rythme des changements par jour de la semaine, erreur mesurée. */
const K = 'diesel_b7' as const;
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');
const SEMAINE = [1, 2, 3, 4, 5, 6, 0];

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const s = M.situation(K, t), tm = s.tomorrow;
  const wdT = M.weekday(tm.day);
  const parJour = SEMAINE.map((wd) => ({ wd, ...M.changeStats(K, wd) }));
  const top = [...parJour].sort((a, b) => b.changed - a.changed)[0];
  const calmes = parJour.filter((x) => x.changed === 0).map((x) => M.nomJour(x.wd, h.lang));
  return {
    M, t, s, tm, wdT, parJour, top, calmes, st: M.changeStats(K), stT: M.changeStats(K, wdT),
    bt52: M.backtest(K, 364), bt4: M.backtest(K, 28), pB10: M.priceOn('diesel_b10', t)!,
    pDemain: tm.official ? tm.price : tm.est.central,
  };
}
type DD = ReturnType<typeof D>;

/** Conseil de plein, qui dépend uniquement de ce qui est publié. */
function plein(h: Helpers, d: DD, litres = 60) {
  const tm = d.tm;
  if (!tm.official) return h.T(
    `Tant que le tarif de demain n’est pas publié, rien ne permet de dire s’il vaut mieux faire le plein aujourd’hui ou demain : un ${d.M.nomJour(d.wdT, 'fr')}, un nouveau tarif du diesel est entré en vigueur ${h.num(d.stT.changed)} fois sur ${h.num(d.stT.days)} au cours de l’année écoulée.`,
    `Zolang het tarief van morgen niet gepubliceerd is, valt niet te zeggen of u beter vandaag of morgen tankt: op een ${d.M.nomJour(d.wdT, 'nl')} ging het afgelopen jaar ${h.num(d.stT.changed)} keer op ${h.num(d.stT.days)} een nieuw dieseltarief in.`,
    `Until tomorrow’s tariff is published, nothing tells you whether to fill up today or tomorrow: on a ${d.M.nomJour(d.wdT, 'en')}, a new diesel tariff took effect ${h.num(d.stT.changed)} times out of ${h.num(d.stT.days)} over the past year.`);
  if (tm.delta === 0) return h.T(`Le tarif de demain étant identique, peu importe le jour du plein.`, `Omdat het tarief van morgen hetzelfde is, maakt de dag van uw tankbeurt niet uit.`, `With tomorrow’s tariff unchanged, it makes no difference which day you fill up.`);
  return tm.delta > 0
    ? h.T(`Le tarif de demain étant plus élevé, faire le plein de ${h.num(litres)} litres aujourd’hui évite jusqu’à ${h.eur(tm.delta * litres, 2)} de plus.`, `Omdat het tarief van morgen hoger ligt, bespaart een tankbeurt van ${h.num(litres)} liter vandaag tot ${h.eur(tm.delta * litres, 2)}.`, `With tomorrow’s tariff higher, filling ${h.num(litres)} litres today saves up to ${h.eur(tm.delta * litres, 2)}.`)
    : h.T(`Le tarif de demain étant plus bas, attendre demain pour un plein de ${h.num(litres)} litres réduit le maximum de ${h.eur(-tm.delta * litres, 2)}.`, `Omdat het tarief van morgen lager ligt, verlaagt wachten tot morgen het maximum voor ${h.num(litres)} liter met ${h.eur(-tm.delta * litres, 2)}.`, `With tomorrow’s tariff lower, waiting until tomorrow cuts the maximum on ${h.num(litres)} litres by ${h.eur(-tm.delta * litres, 2)}.`);
}

const resume = (h: Helpers) => {
  const d = D(h), tm = d.tm, p = d.s.price!;
  const etat = tm.official
    ? h.T(`Le prix maximum officiel du diesel B7 pour demain, ${d.M.nomJour(d.wdT, 'fr')} ${h.date(tm.day)}, est déjà publié : ${h.l3(tm.price)} le litre, ${tm.delta === 0 ? 'sans changement par rapport à' : `soit ${h.cts(tm.delta)} par rapport à`} aujourd’hui (${h.l3(p)}).`,
      `De officiële maximumprijs van diesel B7 voor morgen, ${d.M.nomJour(d.wdT, 'nl')} ${h.date(tm.day)}, is al gepubliceerd: ${h.l3(tm.price)} per liter, ${tm.delta === 0 ? 'ongewijzigd tegenover' : `of ${h.cts(tm.delta)} tegenover`} vandaag (${h.l3(p)}).`,
      `The official maximum price of diesel B7 for tomorrow, ${d.M.nomJour(d.wdT, 'en')} ${h.date(tm.day)}, has already been published: ${h.l3(tm.price)} a litre, ${tm.delta === 0 ? 'unchanged from' : `a move of ${h.cts(tm.delta)} from`} today (${h.l3(p)}).`)
    : h.T(`Le prix maximum officiel du diesel B7 pour demain, ${d.M.nomJour(d.wdT, 'fr')} ${h.date(tm.day)}, n’est pas encore publié. Notre estimation, qui n’est pas un tarif officiel, reste au dernier prix connu, ${h.l3(tm.est.central)} le litre, dans une fourchette de ${h.l3(tm.est.low)} à ${h.l3(tm.est.high)}.`,
      `De officiële maximumprijs van diesel B7 voor morgen, ${d.M.nomJour(d.wdT, 'nl')} ${h.date(tm.day)}, is nog niet gepubliceerd. Onze schatting, geen officieel tarief, blijft op de laatst bekende prijs, ${h.l3(tm.est.central)} per liter, met een vork van ${h.l3(tm.est.low)} tot ${h.l3(tm.est.high)}.`,
      `The official maximum price of diesel B7 for tomorrow, ${d.M.nomJour(d.wdT, 'en')} ${h.date(tm.day)}, has not been published yet. Our estimate, which is not an official tariff, stays at the last known price, ${h.l3(tm.est.central)} a litre, within a range of ${h.l3(tm.est.low)} to ${h.l3(tm.est.high)}.`);
  return h.T(
    `${etat} Le SPF Économie fixe ce plafond selon le contrat-programme qui lie l’État belge à la fédération Energia, à partir de cotations internationales payantes et non publiées : personne ne peut donc recalculer à l’avance le tarif officiel du lendemain. Ce qui se mesure, c’est le rythme des changements. Sur un an, le tarif du diesel a changé ${h.num(d.st.changed)} jours sur ${h.num(d.st.days)}, le plus souvent un ${d.M.nomJour(d.top.wd, 'fr')} (${h.num(d.top.changed)} fois). Reprendre le dernier tarif comme estimation du lendemain s’est trompé en moyenne de ${c(h, d.bt52.mae)} par litre sur 52 semaines et de ${c(h, d.bt4.mae)} sur les 4 dernières, et a vu juste à un centime près ${h.pct(d.bt52.within1c, 0)} des jours. ${plein(h, d)}`,
    `${etat} De FOD Economie legt dat plafond vast volgens de programmaovereenkomst tussen de Belgische Staat en de federatie Energia, op basis van betalende internationale noteringen die niet gepubliceerd worden: niemand kan het officiële tarief van morgen dus vooraf herberekenen. Wat wel te meten valt, is het ritme van de wijzigingen. Over een jaar veranderde het dieseltarief op ${h.num(d.st.changed)} van de ${h.num(d.st.days)} dagen, het vaakst op een ${d.M.nomJour(d.top.wd, 'nl')} (${h.num(d.top.changed)} keer). Het laatste tarief overnemen als schatting voor morgen zat over 52 weken gemiddeld ${c(h, d.bt52.mae)} per liter naast en over de laatste 4 weken ${c(h, d.bt4.mae)}, en was op ${h.pct(d.bt52.within1c, 0)} van de dagen juist tot op een cent. ${plein(h, d)}`,
    `${etat} The FPS Economy sets this ceiling under the programme agreement between the Belgian State and the Energia federation, from international quotations that are paid for and not published: nobody can therefore recompute tomorrow’s official tariff in advance. What can be measured is the rhythm of changes. Over a year the diesel tariff changed on ${h.num(d.st.changed)} days out of ${h.num(d.st.days)}, most often on a ${d.M.nomJour(d.top.wd, 'en')} (${h.num(d.top.changed)} times). Taking the last tariff as the estimate for the next day was off by ${c(h, d.bt52.mae)} a litre on average over 52 weeks and ${c(h, d.bt4.mae)} over the last 4, and was right to within a cent on ${h.pct(d.bt52.within1c, 0)} of days. ${plein(h, d)}`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  const calmes = d.calmes.length ? d.calmes.join(h.T(' et ', ' en ', ' and ')) : '';
  return [
    {
      q: h.T('À partir de quand le prix du diesel de demain est-il connu ?', 'Vanaf wanneer is de dieselprijs van morgen bekend?', 'From when is tomorrow’s diesel price known?'),
      a: h.T(
        'Dès que le SPF Économie publie le nouveau tarif officiel, la veille du jour où il entre en vigueur, et que Statbel le reprend dans sa série be.STAT. Cette page relit cette série plusieurs fois par jour : quand le lendemain y figure, la carte « demain » affiche le tarif officiel ; avant, elle affiche une estimation marquée comme telle.',
        'Zodra de FOD Economie het nieuwe officiële tarief bekendmaakt, de dag voordat het ingaat, en Statbel het opneemt in de be.STAT-reeks. Deze pagina leest die reeks meermaals per dag: staat morgen erin, dan toont de kaart “morgen” het officiële tarief; daarvoor toont ze een schatting die als zodanig is aangeduid.',
        'As soon as the FPS Economy publishes the new official tariff, the day before it takes effect, and Statbel adds it to its be.STAT series. This page reads that series several times a day: once tomorrow appears in it, the “tomorrow” card shows the official tariff; before that, it shows an estimate labelled as such.'),
    },
    {
      q: h.T('Quels jours de la semaine le prix du diesel change-t-il ?', 'Op welke weekdagen verandert de dieselprijs?', 'On which days of the week does the diesel price change?'),
      a: h.T(
        `Sur les douze derniers mois, un nouveau tarif du diesel est entré en vigueur le plus souvent un ${d.M.nomJour(d.top.wd, 'fr')}, ${h.num(d.top.changed)} fois sur ${h.num(d.top.days)}. ${calmes ? `Aucun changement n’a pris effet un ${calmes} sur la période.` : 'Chaque jour de la semaine a connu au moins un changement.'} Le tableau de cette page détaille les sept jours, avec le nombre de hausses et de baisses.`,
        `Over de voorbije twaalf maanden ging een nieuw dieseltarief het vaakst in op een ${d.M.nomJour(d.top.wd, 'nl')}, ${h.num(d.top.changed)} keer op ${h.num(d.top.days)}. ${calmes ? `Op een ${calmes} ging in die periode geen enkele wijziging in.` : 'Elke weekdag kende minstens één wijziging.'} De tabel op deze pagina geeft de zeven dagen, met het aantal stijgingen en dalingen.`,
        `Over the last twelve months a new diesel tariff most often took effect on a ${d.M.nomJour(d.top.wd, 'en')}, ${h.num(d.top.changed)} times out of ${h.num(d.top.days)}. ${calmes ? `No change took effect on a ${calmes} over the period.` : 'Every day of the week saw at least one change.'} The table on this page covers all seven days, with the number of rises and cuts.`),
    },
    {
      q: h.T('Quelle est la fiabilité de l’estimation du diesel pour demain ?', 'Hoe betrouwbaar is de schatting van de dieselprijs voor morgen?', 'How reliable is the estimate of tomorrow’s diesel price?'),
      a: h.T(
        `Elle est mesurée, pas promise. Sur les 52 dernières semaines, reprendre le dernier tarif publié s’est écarté du vrai tarif du lendemain de ${c(h, d.bt52.mae)} par litre en moyenne, et l’écart est resté sous un centime ${h.pct(d.bt52.within1c, 0)} des jours. Les jours où un nouveau tarif tombe, l’erreur est plus grande : c’est pourquoi la fourchette affichée s’appuie sur les variations réelles du même jour de la semaine.`,
        `Ze wordt gemeten, niet beloofd. Over de laatste 52 weken week het laatst gepubliceerde tarief gemiddeld ${c(h, d.bt52.mae)} per liter af van het echte tarief van de dag erna, en bleef de afwijking op ${h.pct(d.bt52.within1c, 0)} van de dagen onder een cent. Op dagen met een nieuw tarief is de fout groter: daarom steunt de getoonde vork op de echte schommelingen van dezelfde weekdag.`,
        `It is measured, not promised. Over the last 52 weeks, taking the last published tariff was off the real next-day tariff by ${c(h, d.bt52.mae)} a litre on average, and stayed within a cent on ${h.pct(d.bt52.within1c, 0)} of days. On days when a new tariff lands the error is larger, which is why the range shown rests on the real moves seen on the same weekday.`),
    },
    {
      q: h.T('Le tarif de demain vaut-il aussi pour le diesel B10 ?', 'Geldt het tarief van morgen ook voor diesel B10?', 'Does tomorrow’s tariff also apply to diesel B10?'),
      a: h.T(
        `Le B10 a son propre prix maximum, publié en même temps que celui du B7. Les deux bougent en général les mêmes jours, mais pas forcément du même montant. L’outil permet de passer d’un produit à l’autre : aujourd’hui, le B10 est plafonné à ${h.l3(d.pB10)} et le B7 à ${h.l3(d.s.price!)}. Vérifiez sur l’étiquette de la trappe que votre moteur accepte le B10.`,
        `B10 heeft een eigen maximumprijs, die samen met die van B7 wordt gepubliceerd. Ze bewegen meestal op dezelfde dagen, maar niet noodzakelijk met hetzelfde bedrag. In de tool schakelt u tussen beide producten: vandaag is B10 begrensd op ${h.l3(d.pB10)} en B7 op ${h.l3(d.s.price!)}. Controleer op het label bij de tankklep of uw motor B10 verdraagt.`,
        `B10 has its own maximum price, published at the same time as B7’s. The two usually move on the same days, but not necessarily by the same amount. The tool lets you switch between them: today B10 is capped at ${h.l3(d.pB10)} and B7 at ${h.l3(d.s.price!)}. Check the label by the filler flap that your engine accepts B10.`),
    },
    {
      q: h.T('Une station peut-elle appliquer le prix de demain dès ce soir ?', 'Mag een tankstation de prijs van morgen al vanavond aanrekenen?', 'Can a station charge tomorrow’s price this evening?'),
      a: h.T(
        'Pas s’il est plus élevé. Le maximum qui s’applique est celui du jour de la vente : tant que le nouveau tarif n’est pas en vigueur, la station reste tenue par celui du jour. Elle peut en revanche baisser ses prix quand elle veut, puisque le maximum est un plafond et non un prix imposé. Le ticket daté fait foi en cas de contestation.',
        'Niet als die hoger ligt. De maximumprijs die geldt, is die van de dag van verkoop: zolang het nieuwe tarief niet ingegaan is, blijft het station gebonden aan dat van vandaag. Verlagen mag het wel wanneer het wil, want het maximum is een plafond en geen opgelegde prijs. Bij betwisting telt het gedateerde ticket.',
        'Not if it is higher. The maximum that applies is the one for the day of sale: until the new tariff is in force, the station is bound by today’s. It may lower its prices whenever it likes, because the maximum is a ceiling, not a set price. The dated receipt is what counts if there is a dispute.'),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const tbl = h.table(
    h.T(['Jour d’entrée en vigueur', 'Nouveaux tarifs', 'Hausses', 'Baisses', 'Mouvement moyen'], ['Dag van inwerkingtreding', 'Nieuwe tarieven', 'Stijgingen', 'Dalingen', 'Gemiddelde beweging'], ['Day it takes effect', 'New tariffs', 'Rises', 'Cuts', 'Average move']),
    d.parJour.map((x) => [M.nomJour(x.wd, h.lang), `${h.num(x.changed)} / ${h.num(x.days)}`, h.num(x.up), h.num(x.down), x.changed ? c(h, x.meanAbs) : '—']),
    h.T('Diesel B7, 365 derniers jours : un changement compte le jour où le nouveau prix maximum s’applique.', 'Diesel B7, laatste 365 dagen: een wijziging telt op de dag waarop de nieuwe maximumprijs geldt.', 'Diesel B7, last 365 days: a change counts on the day the new maximum price applies.'),
    ['l', 'r', 'r', 'r', 'r']);
  const tm = d.tm;
  const statut = tm.official
    ? h.T(`À l’heure de cette mise à jour, le tarif officiel de demain est publié : la carte de l’outil l’affiche tel quel, sans estimation.`, `Bij deze update is het officiële tarief van morgen gepubliceerd: de kaart in de tool toont het zoals het is, zonder schatting.`, `At the time of this update, tomorrow’s official tariff is out: the tool’s card shows it as published, with no estimate.`)
    : h.T(`À l’heure de cette mise à jour, le tarif de demain n’est pas encore paru : l’outil affiche une estimation, avec ${h.pct(tm.est.prob, 0)} de chances, d’après l’année écoulée, qu’un nouveau tarif entre en vigueur ce ${M.nomJour(d.wdT, 'fr')}.`, `Bij deze update is het tarief van morgen nog niet verschenen: de tool toont een schatting, met volgens het voorbije jaar ${h.pct(tm.est.prob, 0)} kans dat er deze ${M.nomJour(d.wdT, 'nl')} een nieuw tarief ingaat.`, `At the time of this update, tomorrow’s tariff has not appeared: the tool shows an estimate, with a ${h.pct(tm.est.prob, 0)} chance, based on the past year, that a new tariff takes effect this ${M.nomJour(d.wdT, 'en')}.`);
  return h.T(`
<h2>Tarif officiel ou estimation : ce que dit la carte « demain »</h2>
<p>${statut} Le tarif publié la veille est un fait : il s’applique toute la journée suivante dans toutes les stations du pays, qui peuvent vendre en dessous mais pas au-dessus. L’estimation, elle, n’est qu’un repère. Le contrat-programme, dont l’annexe technique date du 9 octobre 2006, fait dépendre le prix maximum de cotations internationales du gazole que le site ne peut pas lire. Plutôt que d’inventer une cotation, l’estimation reprend le dernier tarif publié et l’entoure des variations réellement observées le même jour de la semaine.</p>
<h2>Le rythme du diesel, jour par jour</h2>
<p>Les changements de prix du diesel ne tombent pas au hasard dans la semaine. Le tableau compte, pour chaque jour, combien de fois un nouveau prix maximum a pris effet ce jour-là au cours des 365 derniers jours, et dans quel sens.</p>
${tbl}
<p>Sur l’ensemble de l’année, le diesel a connu ${h.num(d.st.up)} hausses et ${h.num(d.st.down)} baisses. Un jour donné, la probabilité d’un nouveau tarif reste donc ${d.st.prob < 0.5 ? 'minoritaire' : 'élevée'} : ${h.pct(d.st.prob, 0)} des jours en moyenne. C’est ce qui explique qu’un estimateur aussi simple que « demain comme aujourd’hui » se trompe peu la plupart du temps, et beaucoup les rares jours où le prix saute.</p>
<h2>Pour les gros rouleurs : décider du jour du plein</h2>
<p>${plein(h, d)} Pour un utilitaire ou une flotte, l’écart se multiplie par le nombre de pleins de la semaine ; l’outil le chiffre sur le volume que vous indiquez. Le prix d’aujourd’hui, le B10 et l’évolution sur un an se trouvent sur la page ${h.a('prix-diesel', 'prix du diesel')}, et le même calcul pour l’essence sur ${h.a('essence-demain', 'prix de l’essence demain')}.</p>
<h2>Les sources</h2>
<p>Les prix proviennent de la série quotidienne du tarif officiel publiée par Statbel sur ${h.src('bestatJour', 'be.STAT')}, sous licence ouverte CC BY 4.0. Les règles du contrat-programme sont résumées par le ${h.src('fondsPrix', 'Fonds Social Chauffage')} et le ${h.src('spfTarif', 'SPF Économie')}. Le calcul de l’estimation et de son erreur est décrit sur la page ${h.a('method', 'méthode')}.</p>`,
  `
<h2>Officieel tarief of schatting: wat de kaart “morgen” zegt</h2>
<p>${statut} Het tarief dat de dag ervoor gepubliceerd wordt, is een feit: het geldt de hele volgende dag in alle tankstations van het land, die lager mogen verkopen maar niet hoger. De schatting is alleen een richtpunt. De programmaovereenkomst, waarvan de technische bijlage dateert van 9 oktober 2006, laat de maximumprijs afhangen van internationale dieselnoteringen die de site niet kan lezen. In plaats van een notering te verzinnen, neemt de schatting het laatst gepubliceerde tarief over en omringt het met de schommelingen die echt werden waargenomen op dezelfde weekdag.</p>
<h2>Het ritme van diesel, dag per dag</h2>
<p>Prijswijzigingen van diesel vallen niet willekeurig in de week. De tabel telt voor elke dag hoe vaak er in de voorbije 365 dagen op die dag een nieuwe maximumprijs inging, en in welke richting.</p>
${tbl}
<p>Over het hele jaar kende diesel ${h.num(d.st.up)} stijgingen en ${h.num(d.st.down)} dalingen. Op een willekeurige dag is de kans op een nieuw tarief dus ${d.st.prob < 0.5 ? 'eerder klein' : 'groot'}: gemiddeld ${h.pct(d.st.prob, 0)} van de dagen. Daarom zit een eenvoudige schatter als “morgen zoals vandaag” meestal maar weinig naast, en flink naast op de zeldzame dagen dat de prijs springt.</p>
<h2>Voor veelrijders: de dag van de tankbeurt kiezen</h2>
<p>${plein(h, d)} Bij een bestelwagen of een wagenpark vermenigvuldigt het verschil zich met het aantal tankbeurten per week; de tool rekent het uit op het volume dat u opgeeft. De prijs van vandaag, B10 en het verloop over een jaar staan op de pagina ${h.a('prix-diesel', 'dieselprijs')}, en dezelfde berekening voor benzine op ${h.a('essence-demain', 'benzineprijs morgen')}.</p>
<h2>Bronnen</h2>
<p>De prijzen komen uit de dagreeks van het officiële tarief die Statbel publiceert op ${h.src('bestatJour', 'be.STAT')}, onder de open licentie CC BY 4.0. De regels van de programmaovereenkomst worden samengevat door het ${h.src('fondsPrix', 'Sociaal Verwarmingsfonds')} en de ${h.src('spfTarif', 'FOD Economie')}. De berekening van de schatting en van haar fout staat op de pagina ${h.a('method', 'methode')}.</p>`,
  `
<h2>Official tariff or estimate: what the “tomorrow” card says</h2>
<p>${statut} A tariff published the day before is a fact: it applies all of the next day in every station in the country, which may sell below it but not above. The estimate is only a guide. The programme agreement, whose technical annex dates from 9 October 2006, ties the maximum price to international diesel quotations that this site cannot read. Rather than invent a quotation, the estimate takes the last published tariff and frames it with the moves actually seen on the same weekday.</p>
<h2>Diesel’s rhythm, day by day</h2>
<p>Diesel price changes do not land at random in the week. The table counts, for each day, how many times a new maximum price took effect on that day over the last 365 days, and in which direction.</p>
${tbl}
<p>Over the whole year diesel saw ${h.num(d.st.up)} rises and ${h.num(d.st.down)} cuts. On any given day the chance of a new tariff is therefore ${d.st.prob < 0.5 ? 'fairly low' : 'high'}: ${h.pct(d.st.prob, 0)} of days on average. That is why an estimator as simple as “tomorrow like today” is only slightly off most of the time, and well off on the rare days when the price jumps.</p>
<h2>For high-mileage drivers: choosing the day to fill up</h2>
<p>${plein(h, d)} For a van or a fleet the difference multiplies by the number of fill-ups in the week; the tool works it out on the volume you enter. Today’s price, B10 and the trend over a year are on the ${h.a('prix-diesel', 'diesel price')} page, and the same calculation for petrol on ${h.a('essence-demain', 'petrol price tomorrow')}.</p>
<h2>Sources</h2>
<p>Prices come from the daily series of the official tariff that Statbel publishes on ${h.src('bestatJour', 'be.STAT')}, under the open CC BY 4.0 licence. The rules of the programme agreement are summarised by the ${h.src('fondsPrix', 'Social Heating Fund')} and the ${h.src('spfTarif', 'FPS Economy')}. How the estimate and its error are calculated is set out on the ${h.a('method', 'method')} page.</p>`);
};

export default defineGuide({
  id: 'diesel-demain',
  group: 'carburants',
  order: 3,
  tool: 'demain',
  toolArg: 'diesel',
  related: ['prix-diesel', 'essence-demain', 'prix-carburant', 'historique-carburants', 'method'],
  sources: ['bestatJour', 'spfTarif', 'fondsPrix', 'statbelLicence'],
  fr: {
    slug: 'prix-diesel-demain',
    nav: 'Prix du diesel demain',
    card: 'Le tarif officiel du diesel de demain dès sa publication, sinon une estimation mesurée.',
    title: 'Prix diesel demain 2026 : tarif officiel ou estimation',
    description: 'Prix du diesel demain en Belgique : tarif officiel dès sa parution, sinon une estimation dont l’erreur est mesurée, et les jours où le prix change le plus.',
    h1: 'Prix du diesel demain',
    intro: 'Le prix maximum du diesel pour demain : le tarif officiel s’il est publié, sinon une estimation, avec son erreur mesurée.',
    resume, faqs, body,
  },
  nl: {
    slug: 'dieselprijs-morgen',
    nav: 'Dieselprijs morgen',
    card: 'Het officiële dieseltarief van morgen zodra het verschijnt, anders een gemeten schatting.',
    title: 'Dieselprijs morgen 2026: officieel tarief of schatting',
    description: 'Dieselprijs morgen in België: officieel tarief zodra het verschijnt, anders een schatting met gemeten afwijking, en de dagen waarop de prijs het vaakst wijzigt.',
    h1: 'Dieselprijs morgen',
    intro: 'De maximumprijs van diesel voor morgen: het officiële tarief als het gepubliceerd is, anders een schatting met haar gemeten afwijking.',
    resume, faqs, body,
  },
  en: {
    slug: 'diesel-price-tomorrow',
    nav: 'Diesel price tomorrow',
    card: 'Tomorrow’s official diesel tariff once published, otherwise a measured estimate.',
    title: 'Diesel price tomorrow 2026: official tariff or estimate',
    description: 'Diesel price tomorrow in Belgium: the official tariff once it is out, otherwise an estimate with its measured error, and the weekdays when the price moves most.',
    h1: 'Diesel price tomorrow',
    intro: 'The maximum price of diesel for tomorrow: the official tariff if published, otherwise an estimate with its measured error.',
    resume, faqs, body,
  },
});
