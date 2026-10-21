import { defineGuide, type Helpers } from '../../lib/guide-types';

const LT = 'mazout_lt2000' as const, GE = 'mazout_ge2000' as const, PO = 'mazout_pompe' as const;

/** Ce que la page dit de demain, calculé sur le jour de référence du build. */
const etat = (h: Helpers) => {
  const s = h.M.situation(LT, h.today);
  const t = s.tomorrow;
  const est = t.official ? h.M.estimate(LT, h.M.addDays(t.day, 1)) : t.est;
  return { s, t, est, wd: h.M.weekday(t.day), bt52: h.M.backtest(LT, 364), bt4: h.M.backtest(LT, 28), lc: h.M.lastChange(LT, h.M.LAST_DAY) };
};
/** Les dix derniers jours publiés, du plus récent au plus ancien. */
const dixJours = (h: Helpers) => {
  const out: string[][] = [];
  for (let i = 0; i < 10; i++) {
    const d = h.M.addDays(h.M.LAST_DAY, -i), p = h.M.priceOn(LT, d), q = h.M.priceOn(GE, d), r = h.M.priceOn(PO, d), v = h.M.priceOn(LT, h.M.addDays(d, -1));
    if (p == null || q == null || r == null) continue;
    out.push([`${h.M.nomJour(h.M.weekday(d), h.lang)} ${h.date(d)}`, h.l3(p), h.l3(q), h.l3(r), v == null ? '–' : Math.abs(p - v) < 1e-9 ? '=' : h.cts(p - v)]);
  }
  return out;
};

export default defineGuide({
  id: 'mazout-demain',
  group: 'mazout',
  order: 1,
  tool: 'demain',
  toolArg: 'mazout',
  related: ['contrat-programme', 'mazout-2000-litres', 'historique-mazout', 'quand-commander-mazout', 'prix-maximum'],
  sources: ['bestatJour', 'bestatDernier', 'fondsPrix', 'chambreContrat'],
  fr: {
    slug: 'prix-mazout-demain',
    nav: 'Prix du mazout demain',
    card: 'Le prix maximum de demain dès sa publication, sinon une estimation chiffrée et son erreur mesurée.',
    title: 'Prix mazout demain : tarif officiel ou estimation, 2026',
    description: 'Prix maximum du mazout demain en Belgique : le tarif officiel dès sa publication, sinon une estimation avec fourchette et erreur mesurée sur un an, en 2026.',
    h1: 'Prix du mazout demain',
    intro: 'Le prix maximum du mazout de chauffage pour le lendemain : le tarif officiel s’il est déjà publié, une estimation clairement signalée s’il ne l’est pas encore.',
    resume: (h) => {
      const { s, t, bt52, lc } = etat(h);
      const dem = t.official
        ? `Le tarif du ${h.date(t.day)} est déjà publié : ${h.l3(t.price)} le litre, ${t.delta === 0 ? 'sans changement par rapport à la veille' : `soit ${h.cts(t.delta)} par rapport à la veille`}. C’est un prix officiel, pas une estimation.`
        : `Le tarif du ${h.date(t.day)} n’est pas encore publié ; notre estimation reprend le dernier prix connu, ${h.l3(t.est.central)}, dans une fourchette de ${h.l3(t.est.low)} à ${h.l3(t.est.high)} tirée des variations observées le même jour de la semaine.`;
      return `Le ${h.date(s.today)}, le prix maximum du mazout de chauffage livré en moins de 2 000 litres est de ${h.l3(s.price!)} le litre, TVA de ${h.pct(h.P.tva, 0)} comprise, selon le tarif officiel que le SPF Économie fixe et que Statbel publie sur be.STAT. ${dem} Ce prix maximum change souvent : sur les ${h.num(h.M.changeStats(LT).days)} derniers jours de la série, un nouveau tarif est entré en vigueur ${h.num(h.M.changeStats(LT).changed)} fois${lc ? `, la dernière fois le ${h.date(lc.day)}` : ''}. Quand le tarif du lendemain manque encore, la meilleure estimation disponible reste le dernier prix publié : sur un an, elle s’est écartée du vrai tarif de ${h.cts(bt52.mae).replace(/^[+−]/, '')} en moyenne par litre. Le négociant peut toujours facturer moins que ce maximum, jamais plus.`;
    },
    faqs: (h) => {
      const { bt52 } = etat(h);
      return [
        { q: 'À quelle heure le prix maximum du mazout de demain est-il connu ?', a: 'Le SPF Économie fixe le nouveau tarif la veille de son entrée en vigueur, puis Statbel le reprend dans be.STAT. L’heure de mise en ligne n’est pas garantie et varie d’un jour à l’autre. Cette page est reconstruite à partir de be.STAT : dès que la ligne du lendemain y figure, l’estimation disparaît et le tarif officiel prend sa place, avec la mention de sa date.' },
        { q: 'Pourquoi votre estimation du mazout de demain est-elle simplement le prix d’aujourd’hui ?', a: `Parce que le tarif suit des cotations internationales payantes et non publiées, que personne ne peut recalculer à l’avance. Sur un an, reprendre le dernier prix publié a donné un écart moyen de ${h.cts(bt52.mae).replace(/^[+−]/, '')} par litre, et l’écart est resté sous un centime ${h.pct(bt52.within1c, 0)} des jours. La fourchette affichée vient des variations réellement observées le même jour de la semaine.` },
        { q: 'Le prix de demain vaut-il aussi pour une commande passée aujourd’hui ?', a: 'Le tarif officiel fixe un prix maximum par jour. Ce que vous paierez dépend des conditions de votre bon de commande et du jour de livraison convenu avec le négociant : demandez-lui par écrit quel jour de tarif il applique. L’outil vous laisse chiffrer les deux jours pour voir ce que représente l’écart sur votre volume.' },
        { q: 'Le prix maximum du mazout de demain est-il le même à Liège, Gand et Bruxelles ?', a: 'Oui. Le tarif officiel est national : un seul prix maximum par produit et par jour pour toute la Belgique, quelle que soit la région. Les écarts que vous constatez entre négociants viennent de leurs remises sous ce plafond, des frais qu’ils incluent ou non dans leur offre et du volume commandé, jamais d’un maximum régional.' },
        { q: 'Que signifie « estimation » à côté du prix de demain sur cette page ?', a: 'Que le tarif officiel du lendemain n’est pas encore publié et que le chiffre affiché est notre calcul, pas un prix légal. Il ne peut pas servir de référence face à un négociant. Dès que be.STAT publie la ligne du lendemain, la page se reconstruit et affiche le tarif officiel, avec la variation exacte par rapport à la veille.' },
      ];
    },
    body: (h) => {
      const { t, est, bt52, bt4, wd } = etat(h);
      const st = h.M.changeStats(LT, wd);
      return `
<h2>Ce que l’outil affiche, et d’où vient chaque chiffre</h2>
<p>La première ligne donne le prix maximum du jour, la deuxième celui du lendemain. Quand be.STAT a déjà publié le tarif de demain, c’est ce tarif officiel qui s’affiche, avec sa variation en centimes. Quand il manque, l’outil affiche une estimation, toujours nommée comme telle, avec trois repères : la fourchette des variations observées ce jour de la semaine, la probabilité qu’un nouveau tarif entre en vigueur ce jour-là et l’écart moyen de l’estimation sur quatre et cinquante-deux semaines. Le champ « litres commandés » traduit la différence entre aujourd’hui et demain en euros sur votre propre volume.</p>
<p>${t.official ? `Au moment de cette version de la page, le tarif du ${h.date(t.day)} est connu. Le jour suivant, un ${h.M.nomJour(h.M.weekday(est.day), 'fr')}, n’a pas encore de tarif : pour lui, l’estimation centrale serait ${h.l3(est.central)}, entre ${h.l3(est.low)} et ${h.l3(est.high)}.` : `Au moment de cette version de la page, le tarif du ${h.date(t.day)} n’est pas encore publié. Sur un an, un nouveau tarif est entré en vigueur ${h.num(st.changed)} ${h.M.nomJour(wd, 'fr')}s sur ${h.num(st.days)}.`} Les chiffres viennent de la série quotidienne ${h.src('bestatJour', 'be.STAT du tarif officiel')} ; le détail hors TVA et TVA comprise figure dans la ${h.src('bestatDernier', 'vue du dernier tarif')}.</p>
<h2>Les dix derniers jours du tarif</h2>
${h.table(['Jour', '&lt; 2 000 L', '≥ 2 000 L', 'Pompe', 'Variation &lt; 2 000 L'], dixJours(h), 'Prix maximums TVA comprise, en euros par litre, du jour le plus récent publié au plus ancien.', ['l', 'r', 'r', 'r', 'r'])}
<p>Le tableau montre le rythme réel du prix : plusieurs jours de suite peuvent porter une variation, puis le même tarif reste en place sur plusieurs jours. Les trois colonnes bougent ensemble, car les deux paliers de livraison et le prix à la pompe dérivent du même calcul. Pour remonter plus loin, l’${h.a('historique-mazout', 'historique du prix du mazout')} affiche la courbe sur un an et les extrêmes.</p>
<h2>Pourquoi demain ne se calcule pas à l’avance</h2>
<p>Le prix maximum découle du ${h.a('contrat-programme', 'contrat-programme')} conclu entre l’État belge et la fédération pétrolière Energia. Son annexe technique, datée du ${h.date(h.P.contrat.annexe_date)}, fait suivre au tarif les cotations internationales des produits. Ces cotations sont payantes et ne sont pas publiées : personne, en dehors de l’administration et des abonnés, ne peut recalculer le prix officiel de demain avant sa publication. Un site qui annonce un tarif précis pour le lendemain avant be.STAT donne donc sa propre prévision.</p>
<p>Nous avons fait un autre choix : afficher le dernier tarif connu comme valeur centrale, parce que c’est sur la série elle-même l’estimateur qui se trompe le moins, et publier son erreur. Sur les quatre dernières semaines, l’écart moyen entre ce chiffre et le vrai tarif du lendemain a été de ${h.cts(bt4.mae).replace(/^[+−]/, '')} par litre ; sur cinquante-deux semaines, de ${h.cts(bt52.mae).replace(/^[+−]/, '')}. ${bt4.mae > bt52.mae ? 'Le mois écoulé a donc été plus agité que la moyenne de l’année.' : 'Le mois écoulé a donc été plus calme que la moyenne de l’année.'} La ${h.a('method', 'méthode')} détaille le calcul.</p>
<h2>Utiliser le prix de demain pour une commande</h2>
<p>Sur une livraison de 1 500 litres, chaque centime de variation pèse ${h.eur(15)}. C’est peu à l’échelle d’une saison, mais l’écart entre deux jours voisins dépasse parfois plusieurs centimes. Si le tarif de demain est publié et plus bas, il peut valoir la peine de convenir avec le négociant d’une livraison le lendemain ; s’il est plus haut, de confirmer la commande au prix du jour. Pour savoir si monter à 2 000 litres change le calcul, passez par le ${h.a('mazout-2000-litres', 'calcul du seuil de 2 000 litres')}.</p>
<p>Gardez en tête que le tarif fixe un plafond. ${h.src('fondsPrix', 'Le Fonds Social Chauffage le rappelle')} : vendre au-dessus du prix maximum est interdit, vendre en dessous est permis et courant. Le devis d’un négociant se compare donc au maximum du jour de livraison, comme l’explique le guide du ${h.a('prix-maximum', 'prix maximum du mazout')}.</p>
<!--tarif:chauffage-->`;
    },
  },
  nl: {
    slug: 'mazoutprijs-morgen',
    nav: 'Mazoutprijs morgen',
    card: 'De maximumprijs van morgen zodra hij gepubliceerd is, anders een schatting met haar gemeten afwijking.',
    title: 'Mazoutprijs morgen: officieel tarief of schatting, 2026',
    description: 'Mazoutprijs voor morgen in België: het officiële maximumtarief zodra het gepubliceerd is, anders een schatting met vork en gemeten afwijking over een jaar.',
    h1: 'Mazoutprijs morgen',
    intro: 'De maximumprijs van mazout voor morgen: het officiële tarief als het al gepubliceerd is, een duidelijk aangegeven schatting als dat nog niet zo is.',
    resume: (h) => {
      const { s, t, bt52, lc } = etat(h);
      const all = h.M.changeStats(LT);
      const dem = t.official
        ? `Het tarief voor ${h.date(t.day)} is al gepubliceerd: ${h.l3(t.price)} per liter, ${t.delta === 0 ? 'ongewijzigd tegenover de dag ervoor' : `of ${h.cts(t.delta)} tegenover de dag ervoor`}. Dat is een officiële prijs, geen schatting.`
        : `Het tarief voor ${h.date(t.day)} is nog niet gepubliceerd; onze schatting neemt de laatst bekende prijs over, ${h.l3(t.est.central)}, binnen een vork van ${h.l3(t.est.low)} tot ${h.l3(t.est.high)} op basis van de schommelingen op dezelfde weekdag.`;
      return `Op ${h.date(s.today)} bedraagt de maximumprijs van mazout bij een levering van minder dan 2.000 liter ${h.l3(s.price!)} per liter, inclusief ${h.pct(h.P.tva, 0)} btw, volgens het officiële tarief dat de FOD Economie vastlegt en Statbel op be.STAT publiceert. ${dem} Die maximumprijs verandert vaak: over de laatste ${h.num(all.days)} dagen van de reeks trad ${h.num(all.changed)} keer een nieuw tarief in werking${lc ? `, de laatste keer op ${h.date(lc.day)}` : ''}. Zolang het tarief van morgen ontbreekt, blijft de laatst gepubliceerde prijs de beste beschikbare schatting: over een jaar week die gemiddeld ${h.cts(bt52.mae).replace(/^[+−]/, '')} per liter af van het echte tarief. De handelaar mag altijd minder aanrekenen dan dit maximum, nooit meer.`;
    },
    faqs: (h) => {
      const { bt52 } = etat(h);
      return [
        { q: 'Hoe laat is de officiële mazoutprijs van morgen bekend?', a: 'De FOD Economie legt het nieuwe tarief vast de dag voor het in werking treedt, waarna Statbel het in be.STAT opneemt. Een vast uur van publicatie is er niet, het verschilt van dag tot dag. Deze pagina wordt opgebouwd uit be.STAT: zodra de regel van morgen erin staat, verdwijnt de schatting en verschijnt het officiële tarief, met de datum erbij.' },
        { q: 'Waarom is jullie schatting van de mazoutprijs voor morgen gewoon de prijs van vandaag?', a: `Omdat het tarief internationale noteringen volgt die betalend en niet openbaar zijn, zodat niemand het vooraf kan narekenen. Over een jaar gaf de laatst gepubliceerde prijs een gemiddelde afwijking van ${h.cts(bt52.mae).replace(/^[+−]/, '')} per liter, en op ${h.pct(bt52.within1c, 0)} van de dagen bleef de afwijking onder één cent. De getoonde vork komt uit de echte schommelingen op dezelfde weekdag.` },
        { q: 'Geldt de prijs van morgen ook voor een bestelling die ik vandaag plaats?', a: 'Het officiële tarief legt per dag een maximumprijs vast. Wat u betaalt, hangt af van uw bestelbon en van de leverdag die u met de handelaar afspreekt: vraag hem schriftelijk welke dag van het tarief hij toepast. Met de tool kunt u beide dagen doorrekenen en zien wat het verschil op uw volume betekent.' },
        { q: 'Is de maximumprijs van mazout morgen dezelfde in Antwerpen, Luik en Brussel?', a: 'Ja. Het officiële tarief is nationaal: één maximumprijs per product en per dag voor heel België, ongeacht het gewest. De verschillen tussen handelaars komen van hun kortingen onder dat plafond, van de kosten die ze al dan niet in hun offerte opnemen en van het bestelde volume, nooit van een regionaal maximum.' },
        { q: 'Wat betekent „schatting” naast de prijs van morgen op deze pagina?', a: 'Dat het officiële tarief van morgen nog niet gepubliceerd is en dat het getoonde cijfer onze berekening is, geen wettelijke prijs. U kunt het niet als referentie tegenover een handelaar gebruiken. Zodra be.STAT de regel van morgen publiceert, wordt de pagina opnieuw opgebouwd en ziet u het officiële tarief met de exacte wijziging tegenover de dag ervoor.' },
      ];
    },
    body: (h) => {
      const { t, est, bt52, bt4, wd } = etat(h);
      const st = h.M.changeStats(LT, wd);
      return `
<h2>Wat de tool toont en waar elk cijfer vandaan komt</h2>
<p>De eerste regel geeft de maximumprijs van vandaag, de tweede die van morgen. Heeft be.STAT het tarief van morgen al gepubliceerd, dan ziet u dat officiële tarief met de wijziging in cent. Ontbreekt het nog, dan toont de tool een schatting, altijd zo genoemd, met drie houvasten: de vork van de schommelingen op die weekdag, de kans dat die dag een nieuw tarief ingaat en de gemiddelde afwijking van de schatting over vier en tweeënvijftig weken. Het veld „bestelde liters” zet het verschil tussen vandaag en morgen om in euro op uw eigen volume.</p>
<p>${t.official ? `Bij deze versie van de pagina is het tarief van ${h.date(t.day)} bekend. De dag daarna, een ${h.M.nomJour(h.M.weekday(est.day), 'nl')}, heeft nog geen tarief: daarvoor zou de centrale schatting ${h.l3(est.central)} zijn, tussen ${h.l3(est.low)} en ${h.l3(est.high)}.` : `Bij deze versie van de pagina is het tarief van ${h.date(t.day)} nog niet gepubliceerd. Over een jaar trad op ${h.num(st.changed)} van de ${h.num(st.days)} ${h.M.nomJour(wd, 'nl')}en een nieuw tarief in werking.`} De cijfers komen uit de dagelijkse reeks ${h.src('bestatJour', 'be.STAT van het officiële tarief')}; de prijzen zonder en met btw staan in het ${h.src('bestatDernier', 'overzicht van het laatste tarief')}.</p>
<h2>De laatste tien dagen van het tarief</h2>
${h.table(['Dag', '&lt; 2.000 l', '≥ 2.000 l', 'Pomp', 'Wijziging &lt; 2.000 l'], dixJours(h), 'Maximumprijzen incl. btw, in euro per liter, van de meest recente gepubliceerde dag naar de oudste.', ['l', 'r', 'r', 'r', 'r'])}
<p>De tabel toont het echte ritme van de prijs: soms wijzigt hij een paar dagen na elkaar, daarna blijft hetzelfde tarief enkele dagen staan. De drie kolommen bewegen samen, want de twee leveringsschijven en de pompprijs volgen uit dezelfde berekening. Wie verder terug wil kijken, vindt in de ${h.a('historique-mazout', 'evolutie van de mazoutprijs')} de curve over een jaar en de uitersten.</p>
<h2>Waarom morgen niet vooraf te berekenen is</h2>
<p>De maximumprijs volgt uit de ${h.a('contrat-programme', 'programmaovereenkomst')} tussen de Belgische Staat en de petroleumfederatie Energia. De technische bijlage van ${h.date(h.P.contrat.annexe_date)} laat het tarief de internationale productnoteringen volgen. Die noteringen zijn betalend en worden niet gepubliceerd: buiten de administratie en de abonnees kan niemand de officiële prijs van morgen narekenen voor hij verschijnt. Een site die vóór be.STAT een precieze prijs voor morgen aankondigt, geeft dus zijn eigen voorspelling.</p>
<p>Wij kiezen anders: het laatst bekende tarief als centrale waarde tonen, omdat dat op de reeks zelf de schatter is die het minst afwijkt, en de fout ervan publiceren. Over de laatste vier weken bedroeg de gemiddelde afwijking tussen dat cijfer en het echte tarief van morgen ${h.cts(bt4.mae).replace(/^[+−]/, '')} per liter; over tweeënvijftig weken ${h.cts(bt52.mae).replace(/^[+−]/, '')}. ${bt4.mae > bt52.mae ? 'De voorbije maand was dus woeliger dan het jaargemiddelde.' : 'De voorbije maand was dus rustiger dan het jaargemiddelde.'} De ${h.a('method', 'methode')} beschrijft de berekening.</p>
<h2>De prijs van morgen gebruiken bij een bestelling</h2>
<p>Bij een levering van 1.500 liter weegt elke cent schommeling ${h.eur(15)}. Op een heel stookseizoen is dat weinig, maar tussen twee opeenvolgende dagen loopt het verschil soms op tot meerdere centen. Is het tarief van morgen gepubliceerd en lager, dan kan het lonen om met de handelaar een levering morgen af te spreken; is het hoger, dan bevestigt u beter tegen de prijs van vandaag. Of naar 2.000 liter gaan de rekensom verandert, ziet u bij de ${h.a('mazout-2000-litres', 'berekening van de drempel van 2.000 liter')}.</p>
<p>Onthoud dat het tarief een plafond is. ${h.src('fondsPrix', 'Het Sociaal Verwarmingsfonds herinnert eraan')}: boven de maximumprijs verkopen is verboden, eronder verkopen mag en gebeurt vaak. De offerte van een handelaar vergelijkt u dus met het maximum van de leverdag, zoals de gids over de ${h.a('prix-maximum', 'maximumprijs van mazout')} uitlegt.</p>
<!--tarif:chauffage-->`;
    },
  },
  en: {
    slug: 'heating-oil-price-tomorrow',
    nav: 'Heating oil price tomorrow',
    card: 'Tomorrow’s maximum price as soon as it is published, otherwise an estimate with its measured error.',
    title: 'Heating oil price tomorrow: official tariff or estimate 2026',
    description: 'Tomorrow’s heating oil maximum price in Belgium: the official tariff once published, otherwise an estimate with its range and its error measured over a year.',
    h1: 'Heating oil price tomorrow',
    intro: 'Tomorrow’s maximum price for heating oil (mazout): the official tariff when it has been published, a clearly labelled estimate when it has not.',
    resume: (h) => {
      const { s, t, bt52, lc } = etat(h);
      const all = h.M.changeStats(LT);
      const dem = t.official
        ? `The tariff for ${h.date(t.day)} has already been published: ${h.l3(t.price)} a litre, ${t.delta === 0 ? 'unchanged from the day before' : `${h.cts(t.delta)} on the day before`}. That is an official price, not an estimate.`
        : `The tariff for ${h.date(t.day)} has not been published yet; our estimate carries over the last known price, ${h.l3(t.est.central)}, within a range of ${h.l3(t.est.low)} to ${h.l3(t.est.high)} drawn from the changes seen on the same weekday.`;
      return `On ${h.date(s.today)}, the maximum price of heating oil delivered in quantities under 2,000 litres is ${h.l3(s.price!)} a litre, including ${h.pct(h.P.tva, 0)} VAT, according to the official tariff set by the Belgian FPS Economy and published by Statbel, the national statistics office, on be.STAT. ${dem} This maximum price moves often: over the last ${h.num(all.days)} days of the series a new tariff came into force ${h.num(all.changed)} times${lc ? `, most recently on ${h.date(lc.day)}` : ''}. While tomorrow’s tariff is still missing, the best estimate available remains the last published price: over a year it was off the real tariff by ${h.cts(bt52.mae).replace(/^[+−]/, '')} a litre on average. A dealer may always charge less than this maximum, never more.`;
    },
    faqs: (h) => {
      const { bt52 } = etat(h);
      return [
        { q: 'At what time is tomorrow’s official heating oil price known in Belgium?', a: 'The FPS Economy sets the new tariff the day before it takes effect, and Statbel then adds it to be.STAT. There is no guaranteed publication time; it varies from day to day. This page is rebuilt from be.STAT: as soon as tomorrow’s row appears, the estimate disappears and the official tariff takes its place, with its date.' },
        { q: 'Why is your estimate of tomorrow’s heating oil price simply today’s price?', a: `Because the tariff follows international quotations that are paid for and not published, so nobody can recompute it in advance. Over a year, carrying the last published price forward gave an average error of ${h.cts(bt52.mae).replace(/^[+−]/, '')} a litre, and the error stayed under one cent on ${h.pct(bt52.within1c, 0)} of days. The range shown comes from the changes actually seen on the same weekday.` },
        { q: 'Does tomorrow’s price also apply to an order I place today?', a: 'The official tariff sets a maximum price for each day. What you pay depends on the terms of your order form and on the delivery day agreed with the dealer: ask them in writing which day’s tariff they apply. The tool lets you price both days so you can see what the gap means on your own volume.' },
        { q: 'Is tomorrow’s maximum heating oil price the same in Antwerp, Liège and Brussels?', a: 'Yes. The official tariff is national: one maximum price per product and per day for the whole of Belgium, whatever the region. Differences you see between dealers come from their discounts below that ceiling, from the charges they do or do not include in a quote and from the volume ordered, never from a regional maximum.' },
        { q: 'What does “estimate” next to tomorrow’s price on this page mean?', a: 'It means tomorrow’s official tariff has not been published yet and the figure shown is our own calculation, not a legal price. It cannot serve as a reference with a dealer. As soon as be.STAT publishes tomorrow’s row, the page rebuilds and shows the official tariff, with the exact change from the day before.' },
      ];
    },
    body: (h) => {
      const { t, est, bt52, bt4, wd } = etat(h);
      const st = h.M.changeStats(LT, wd);
      return `
<h2>What the tool shows, and where each figure comes from</h2>
<p>The first line gives today’s maximum price, the second tomorrow’s. When be.STAT has already published tomorrow’s tariff, that official figure appears with its change in cents. When it is missing, the tool shows an estimate, always labelled as such, with three markers: the range of changes seen on that weekday, the chance that a new tariff takes effect that day, and the average error of the estimate over four and fifty-two weeks. The “litres ordered” field turns the gap between today and tomorrow into euros on your own volume.</p>
<p>${t.official ? `In this version of the page, the tariff for ${h.date(t.day)} is known. The following day, a ${h.M.nomJour(h.M.weekday(est.day), 'en')}, has no tariff yet: for it the central estimate would be ${h.l3(est.central)}, between ${h.l3(est.low)} and ${h.l3(est.high)}.` : `In this version of the page, the tariff for ${h.date(t.day)} has not been published yet. Over a year, a new tariff took effect on ${h.num(st.changed)} ${h.M.nomJour(wd, 'en')}s out of ${h.num(st.days)}.`} The figures come from the daily ${h.src('bestatJour', 'be.STAT series of the official tariff')}; prices excluding and including VAT are in the ${h.src('bestatDernier', 'latest tariff view')}.</p>
<h2>The last ten days of the tariff</h2>
${h.table(['Day', '&lt; 2,000 L', '≥ 2,000 L', 'Pump', 'Change &lt; 2,000 L'], dixJours(h), 'Maximum prices including VAT, in euros per litre, from the latest published day back to the oldest.', ['l', 'r', 'r', 'r', 'r'])}
<p>The table shows the real rhythm of the price: it can move several days running, then the same tariff stays in place for a few days. The three columns move together, because both delivery bands and the pump price come out of the same calculation. To look further back, the ${h.a('historique-mazout', 'heating oil price history')} draws the curve over a year with its highs and lows.</p>
<h2>Why tomorrow cannot be worked out in advance</h2>
<p>The maximum price comes from the ${h.a('contrat-programme', 'programme contract')} between the Belgian State and Energia, the federation of the petroleum sector. Its technical annex, dated ${h.date(h.P.contrat.annexe_date)}, makes the tariff follow international product quotations. Those quotations are paid for and not published, so nobody outside the administration and the subscribers can recompute tomorrow’s official price before it is released. A site that announces an exact price for tomorrow before be.STAT is giving its own forecast.</p>
<p>We chose differently: we show the last known tariff as the central value, because on the series itself it is the estimator that errs least, and we publish its error. Over the last four weeks, the average gap between that figure and the real next-day tariff was ${h.cts(bt4.mae).replace(/^[+−]/, '')} a litre; over fifty-two weeks it was ${h.cts(bt52.mae).replace(/^[+−]/, '')}. ${bt4.mae > bt52.mae ? 'The past month was therefore rougher than the yearly average.' : 'The past month was therefore calmer than the yearly average.'} The ${h.a('method', 'method page')} sets out the calculation.</p>
<h2>Using tomorrow’s price when you order</h2>
<p>On a 1,500-litre delivery, every cent of movement is worth ${h.eur(15)}. Over a heating season that is small, but the gap between two neighbouring days sometimes reaches several cents. If tomorrow’s tariff is out and lower, it can be worth agreeing a delivery for the next day with the dealer; if it is higher, it may be better to confirm at today’s price. To see whether going up to 2,000 litres changes the sums, use the ${h.a('mazout-2000-litres', '2,000-litre threshold calculation')}.</p>
<p>Bear in mind that the tariff is a ceiling. ${h.src('fondsPrix', 'As the Social Heating Fund points out')}, selling above the maximum price is forbidden, while selling below it is allowed and common. A dealer’s quote is therefore compared with the maximum for the delivery day, as the guide to the ${h.a('prix-maximum', 'maximum price of heating oil')} explains.</p>
<!--tarif:chauffage-->`;
    },
  },
});
