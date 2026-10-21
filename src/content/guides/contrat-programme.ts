import { defineGuide, type Helpers } from '../../lib/guide-types';

type L = 'fr' | 'nl' | 'en';
const ORDRE = [1, 2, 3, 4, 5, 6, 0];
const CONTRAT_KEYS = ['mazout_lt2000', 'mazout_ge2000', 'diesel_b7', 'e10_95', 'e5_98'] as const;

/** Tout ce que la page affirme sur la cadence et l'estimation est calculé ici, à partir de la série be.STAT. */
const D = (h: Helpers) => {
  const k = 'mazout_lt2000' as const;
  const jours = ORDRE.map((wd) => ({ wd, m: h.M.changeStats(k, wd), d: h.M.changeStats('diesel_b7', wd) }));
  const tri = [...jours].sort((a, b) => b.m.prob - a.m.prob);
  const top = tri[0];
  const calmes = jours.filter((j) => j.m.prob < 0.1);
  const all = h.M.changeStats(k), dsl = h.M.changeStats('diesel_b7');
  const bt52 = h.M.backtest(k, 364), bt4 = h.M.backtest(k, 28), btD = h.M.backtest('diesel_b7', 364);
  const est = h.M.estimate(k);
  const lundi = jours.find((j) => j.wd === 1)!.m;
  const c28 = h.P.contrat.tarif_28_fevrier, c27 = h.P.contrat.tarif_27_mars;
  return { jours, top, calmes, all, dsl, bt52, bt4, btD, est, lundi, c28, c27 };
};
const nomL = (h: Helpers, wd: number) => h.M.nomJour(wd, h.lang as L);
const liste = (h: Helpers, xs: string[]) => {
  const et = h.T(' et ', ' en ', ' and ');
  return xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')}${et}${xs[xs.length - 1]}`;
};
const prixC = (h: Helpers, k: string, x: number) => (k.startsWith('mazout') ? h.eur(x, 4) : h.l3(x));
const tableContrat = (h: Helpers, d: ReturnType<typeof D>, heads: string[], cap: string) => h.table(heads, CONTRAT_KEYS.map((k) => [
  h.M.COURT[k][h.lang as L].replace('<', '&lt;'), prixC(h, k, d.c28[k]), prixC(h, k, d.c27[k]), h.cts(d.c27[k] - d.c28[k]),
]), cap, ['l', 'r', 'r', 'r']);
const tableJours = (h: Helpers, d: ReturnType<typeof D>, heads: string[], cap: string) => h.table(heads, d.jours.map((j) => [
  nomL(h, j.wd), `${h.num(j.m.changed)} / ${h.num(j.m.days)}`, h.pct(j.m.prob, 0), `${h.num(j.d.changed)} / ${h.num(j.d.days)}`,
]), cap, ['l', 'r', 'r', 'r']);

export default defineGuide({
  id: 'contrat-programme',
  group: 'comprendre',
  order: 11,
  mini: 'frequence',
  miniHref: 'mazout-demain',
  related: ['mazout-demain', 'prix-maximum', 'diesel-demain', 'historique-mazout', 'method'],
  sources: ['chambreContrat', 'fondsPrix', 'spfTarif', 'bestatJour'],
  fr: {
    slug: 'contrat-programme-prix-petrole',
    nav: 'Contrat-programme',
    card: 'Comment et quand le prix maximum change, et pourquoi demain reste une estimation.',
    title: 'Contrat-programme pétrole 2026 : quand le prix change',
    description: 'Contrat-programme des prix pétroliers : qui l’a signé, les jours où le prix maximum du mazout change et la précision mesurée de l’estimation du lendemain.',
    h1: 'Le contrat-programme : comment le prix maximum change',
    intro: 'Le calendrier réel des nouveaux tarifs, compté sur un an, et ce qu’il permet de dire du lendemain.',
    resume: (h) => {
      const d = D(h);
      return `Le prix maximum des produits pétroliers belges est fixé par le SPF Économie selon le contrat-programme conclu entre l’État belge et Energia, la fédération du secteur pétrolier. Son annexe technique, datée du 9 octobre 2006, fait suivre au prix les cotations internationales des produits pétroliers ; ces cotations sont payantes et ne sont pas publiées, si bien que personne ne peut recalculer à l’avance le prix officiel du lendemain. Sur les ${h.num(d.all.days)} derniers jours de la série be.STAT, le prix maximum du mazout livré en moins de 2 000 litres a changé ${h.num(d.all.changed)} fois, ${h.num(d.all.up)} hausses et ${h.num(d.all.down)} baisses ; c’est le ${nomL(h, d.top.wd)} qu’un nouveau tarif tombe le plus souvent (${h.pct(d.top.m.prob, 0)} des ${nomL(h, d.top.wd)}s). Le diesel B7 n’a changé que ${h.num(d.dsl.changed)} fois. Tant que le tarif de demain n’est pas publié, ce site affiche une estimation : le dernier prix publié, avec la fourchette observée le même jour de la semaine. Sur 52 semaines, elle s’est écartée du tarif réel de ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} par litre en moyenne.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Qui a signé le contrat-programme qui encadre les prix pétroliers en Belgique ?', a: 'Le contrat-programme est un accord entre l’État belge et Energia, la fédération qui représente le secteur pétrolier. C’est en l’appliquant que le SPF Économie publie le prix maximum de chaque produit. Son annexe technique date du 9 octobre 2006. Le Fonds Social Chauffage et la Chambre des représentants, dans une proposition de loi de mars 2026, décrivent ce cadre.' },
        { q: 'Le prix maximum du mazout peut-il changer un lundi ?', a: d.lundi.changed === 0
          ? `Sur les ${h.num(d.lundi.days)} lundis de la dernière année, aucun n’a apporté de nouveau tarif pour le mazout livré en moins de 2 000 litres : le prix du lundi était chaque fois celui du dimanche. Ce constat décrit le passé ; rien n’interdit qu’un lundi fasse exception, et la page du prix de demain affiche le tarif officiel dès qu’il paraît.`
          : `Oui : sur les ${h.num(d.lundi.days)} lundis de la dernière année, ${h.num(d.lundi.changed)} ont apporté un nouveau tarif pour le mazout livré en moins de 2 000 litres, soit ${h.pct(d.lundi.prob, 0)}. Les autres lundis, le prix était celui de la veille. La page du prix de demain affiche le tarif officiel dès qu’il paraît.` },
        { q: 'Pourquoi le prix maximum du diesel bouge-t-il moins souvent que celui du mazout ?', a: `Les chiffres le montrent sans ambiguïté : sur un an, ${h.num(d.dsl.changed)} nouveaux tarifs pour le diesel B7 contre ${h.num(d.all.changed)} pour le mazout sous 2 000 litres. Le contrat-programme n’applique pas la même cadence à tous les produits, et ses règles de calcul reposent sur des cotations que le public ne voit pas. Quand le diesel change, l’écart moyen est de ${h.l3(d.dsl.meanAbs)} par litre.` },
        { q: 'De combien l’estimation du prix de demain s’est-elle trompée sur un an ?', a: `Sur les ${h.num(d.bt52.days)} derniers jours, reprendre le dernier tarif publié s’est écarté du tarif officiel du lendemain de ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} par litre en moyenne, et l’écart est resté sous un centime ${h.pct(d.bt52.within1c, 0)} du temps. Sur les quatre dernières semaines, l’écart moyen est de ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. Ces chiffres sont recalculés à chaque mise à jour.` },
        { q: 'Pourquoi ne peut-on pas déduire le tarif de demain du prix du baril de brut ?', a: 'Parce que le contrat-programme ne part pas du brut : il suit les cotations internationales des produits pétroliers eux-mêmes, et ces cotations sont payantes et ne sont pas publiées. Le prix du baril donne une tendance générale, pas le chiffre du tarif. Personne en dehors du circuit officiel ne peut donc recalculer à l’avance le prix maximum de demain ; on peut seulement l’estimer.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const e = d.est;
      const diffMaz = d.c27.mazout_lt2000 - d.c28.mazout_lt2000;
      return `
<h2>Un accord entre l’État et le secteur pétrolier</h2>
<p>Le prix maximum n’est pas décidé au jour le jour par un ministre. Il découle d’un contrat-programme, un accord conclu entre l’État belge et Energia, la fédération du secteur pétrolier, que le SPF Économie applique en publiant le ${h.src('spfTarif', 'tarif officiel')}. Le ${h.src('fondsPrix', 'Fonds Social Chauffage')} rappelle les deux conséquences pour le client : le tarif fixe un plafond par produit, et vendre au-dessus est interdit.</p>
<p>La méthode de calcul est décrite dans une annexe technique datée du 9 octobre 2006. Elle fait suivre au prix maximum les cotations internationales des produits pétroliers. Ces cotations sont payantes et ne sont pas publiées : le grand public, les journalistes et ce site voient le résultat, le tarif, mais pas les chiffres d’entrée. C’est la raison pour laquelle personne ne peut recalculer à l’avance le prix officiel du lendemain.</p>
<h2>Ce que montre la proposition de loi de mars 2026</h2>
<p>Le contrat-programme a fait l’objet, au printemps 2026, d’une proposition de loi déposée à la Chambre. La ${h.src('chambreContrat', 'proposition de loi DOC 56 1452/001 du 30 mars 2026')} cite les tarifs officiels de deux dates, le 28 février et le 27 mars 2026, pour illustrer la vitesse à laquelle le prix maximum suit les marchés.</p>
${tableContrat(h, d, ['Produit', '28 février 2026', '27 mars 2026', 'Écart par litre'], 'Prix maximums TVA comprise cités par la proposition de loi DOC 56 1452/001 (mazout à quatre décimales, comme dans le document).')}
<p>En un mois, le plafond du mazout livré en moins de 2 000 litres ${diffMaz > 0 ? 'a augmenté' : diffMaz < 0 ? 'a baissé' : 'est resté stable'} de ${h.cts(Math.abs(diffMaz)).replace(/^[+−]/, '')} par litre, soit ${h.pct(Math.abs(diffMaz) / d.c28.mazout_lt2000, 0)} ${diffMaz >= 0 ? 'de plus' : 'de moins'}. Sur une citerne de 1 500 litres, l’écart entre ces deux dates représente ${h.eur(Math.abs(diffMaz) * 1500)}.</p>
<h2>À quelle fréquence le prix maximum change</h2>
<p>La série publiée par Statbel sur ${h.src('bestatJour', 'be.STAT')} permet de compter les nouveaux tarifs jour par jour. Le tableau classe les ${h.num(d.all.days)} derniers jours selon le jour de la semaine où un nouveau prix est entré en vigueur, pour le mazout livré en moins de 2 000 litres et, pour comparaison, le diesel B7.</p>
${tableJours(h, d, ['Jour', 'Mazout : nouveaux tarifs', 'Mazout : part des jours', 'Diesel B7 : nouveaux tarifs'], `Jours où le prix maximum a changé par rapport à la veille, sur les ${h.num(d.all.days)} derniers jours de la série be.STAT.`)}
<p>Pour le mazout, le jour le plus actif est le ${nomL(h, d.top.wd)} : ${h.num(d.top.m.changed)} ${nomL(h, d.top.wd)}s sur ${h.num(d.top.m.days)} ont apporté un nouveau tarif. ${d.calmes.length
  ? `À l’inverse, le prix ne change presque jamais ${liste(h, d.calmes.map((j) => `le ${nomL(h, j.wd)}`))} : le tarif en vigueur la veille y reste généralement valable.`
  : 'Aucun jour de la semaine n’est épargné : tous ont connu des changements fréquents sur la période.'} Le diesel suit un tout autre rythme, avec ${h.num(d.dsl.changed)} changements sur l’année contre ${h.num(d.all.changed)} pour le mazout. Le mini-simulateur en haut de page fait le même compte pour un produit et un jour de votre choix.</p>
<h2>Hausses, baisses et ampleur</h2>
<p>Sur l’année, le mazout a connu ${h.num(d.all.up)} hausses et ${h.num(d.all.down)} baisses. Quand il change, il bouge en moyenne de ${h.l3(d.all.meanAbs)} par litre. Une journée sur dix, la variation est inférieure à ${h.cts(d.all.p10)}, et une sur dix supérieure à ${h.cts(d.all.p90)} : la plupart des changements sont modestes, mais ils s’additionnent. Sur 1 500 litres, une variation moyenne pèse ${h.eur(d.all.meanAbs * 1500)} sur la facture. La page ${h.a('historique-mazout', 'historique du prix du mazout')} montre comment ces petits pas ont dessiné la courbe de l’année.</p>
<h2>Pourquoi demain ne peut être qu’estimé</h2>
<p>Un nouveau tarif est publié avant d’entrer en vigueur : quand le prix de demain est connu, la page ${h.a('mazout-demain', 'prix du mazout demain')} affiche ce tarif officiel. Tant qu’il ne l’est pas, aucune source publique ne permet de le calculer. Un site qui annonce « le prix de demain » avant la publication donne donc, au mieux, une estimation, et il devrait le dire. Ici, chaque chiffre de ce type est étiqueté comme tel et remplacé par le tarif officiel dès sa parution.</p>
<h2>Comment ce site estime le prochain jour non publié</h2>
<p>L’estimation ne prétend pas deviner le marché. Elle part du dernier tarif publié, qui sert de valeur centrale, et l’entoure de la fourchette des variations observées le même jour de la semaine sur un an, entre le premier et le neuvième décile. Elle donne aussi la probabilité qu’un nouveau tarif entre en vigueur ce jour-là, d’après la même année d’observations. Pour le ${h.date(e.day)}, prochain jour sans tarif publié, cela donne une valeur centrale de ${h.l3(e.central)}, une fourchette de ${h.l3(e.low)} à ${h.l3(e.high)} et une probabilité de changement de ${h.pct(e.prob, 0)}.</p>
<p>Pourquoi partir du dernier prix plutôt que d’une tendance ? Parce que, mesuré sur la série, c’est l’estimateur qui se trompe le moins. Sur ${h.num(d.bt52.days)} jours, l’écart moyen entre le dernier tarif publié et le tarif officiel du lendemain a été de ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} par litre, et l’écart est resté sous un centime ${h.pct(d.bt52.within1c, 0)} du temps. Sur les quatre dernières semaines, il atteint ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. Pour le diesel B7, qui change plus rarement, l’écart moyen sur un an tombe à ${h.cts(d.btD.mae).replace(/^[+−]/, '')}. La ${h.a('method', 'page de méthode')} détaille ces calculs.</p>
<h2>Les limites, écrites noir sur blanc</h2>
<p>La fourchette décrit ce qui s’est passé, pas ce qui va se passer. Une semaine agitée sur les marchés peut produire une variation plus forte que toutes celles de l’année, et l’estimation ne le verra pas venir. Elle ne remplace jamais le tarif officiel ; elle sert à donner un ordre de grandeur à celui qui doit décider aujourd’hui d’une commande livrée demain. Pour savoir ce que dit vraiment la règle du plafond, voir le guide du ${h.a('prix-maximum', 'prix maximum du mazout')} ; pour les carburants, la même logique s’applique au ${h.a('diesel-demain', 'prix du diesel demain')}.</p>`;
    },
  },
  nl: {
    slug: 'programmaovereenkomst-aardolie',
    nav: 'Programmaovereenkomst',
    card: 'Hoe en wanneer de maximumprijs verandert, en waarom morgen een schatting blijft.',
    title: 'Programmaovereenkomst aardolie 2026: wanneer prijs wijzigt',
    description: 'Programmaovereenkomst voor aardolieprijzen: wie ze tekende, op welke dagen de maximumprijs van mazout wijzigt en hoe juist de schatting van morgen is.',
    h1: 'De programmaovereenkomst: hoe de maximumprijs verandert',
    intro: 'De werkelijke kalender van de nieuwe tarieven, geteld over een jaar, en wat die over morgen zegt.',
    resume: (h) => {
      const d = D(h);
      return `De maximumprijs van de Belgische aardolieproducten wordt door de FOD Economie vastgelegd volgens de programmaovereenkomst tussen de Belgische Staat en Energia, de federatie van de aardoliesector. De technische bijlage, gedateerd op 9 oktober 2006, laat de prijs de internationale noteringen van aardolieproducten volgen; die noteringen zijn betalend en worden niet gepubliceerd, zodat niemand de officiële prijs van morgen vooraf kan narekenen. Over de laatste ${h.num(d.all.days)} dagen van de be.STAT-reeks veranderde de maximumprijs van mazout bij levering van minder dan 2.000 liter ${h.num(d.all.changed)} keer, ${h.num(d.all.up)} stijgingen en ${h.num(d.all.down)} dalingen; op ${nomL(h, d.top.wd)} valt het vaakst een nieuw tarief (${h.pct(d.top.m.prob, 0)} van de ${nomL(h, d.top.wd)}en). Diesel B7 wijzigde maar ${h.num(d.dsl.changed)} keer. Zolang het tarief van morgen niet gepubliceerd is, toont deze site een schatting: de laatst gepubliceerde prijs, met de vork die op dezelfde weekdag werd waargenomen. Over 52 weken week die gemiddeld ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} per liter af van het echte tarief.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Wie tekende de programmaovereenkomst die de aardolieprijzen in België regelt?', a: 'De programmaovereenkomst is een akkoord tussen de Belgische Staat en Energia, de federatie die de aardoliesector vertegenwoordigt. Door ze toe te passen publiceert de FOD Economie de maximumprijs van elk product. De technische bijlage dateert van 9 oktober 2006. Het Sociaal Verwarmingsfonds en de Kamer van volksvertegenwoordigers, in een wetsvoorstel van maart 2026, beschrijven dat kader.' },
        { q: 'Kan de maximumprijs van mazout op een maandag veranderen?', a: d.lundi.changed === 0
          ? `Van de ${h.num(d.lundi.days)} maandagen van het voorbije jaar bracht er geen enkele een nieuw tarief voor mazout onder 2.000 liter: de prijs van maandag was telkens die van zondag. Dat beschrijft het verleden; niets verbiedt dat een maandag een uitzondering wordt, en de pagina met de prijs van morgen toont het officiële tarief zodra het verschijnt.`
          : `Ja: van de ${h.num(d.lundi.days)} maandagen van het voorbije jaar brachten er ${h.num(d.lundi.changed)} een nieuw tarief voor mazout onder 2.000 liter, of ${h.pct(d.lundi.prob, 0)}. De andere maandagen gold de prijs van de dag ervoor. De pagina met de prijs van morgen toont het officiële tarief zodra het verschijnt.` },
        { q: 'Waarom verandert de maximumprijs van diesel minder vaak dan die van mazout?', a: `De cijfers zijn duidelijk: over een jaar ${h.num(d.dsl.changed)} nieuwe tarieven voor diesel B7 tegenover ${h.num(d.all.changed)} voor mazout onder 2.000 liter. De programmaovereenkomst past niet op elk product hetzelfde ritme toe, en de berekening steunt op noteringen die het publiek niet ziet. Als diesel verandert, is het verschil gemiddeld ${h.l3(d.dsl.meanAbs)} per liter.` },
        { q: 'Hoeveel week de schatting van de prijs van morgen over een jaar af?', a: `Over de laatste ${h.num(d.bt52.days)} dagen week het laatst gepubliceerde tarief gemiddeld ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} per liter af van het officiële tarief van de volgende dag, en bleef het verschil ${h.pct(d.bt52.within1c, 0)} van de tijd onder één cent. Over de laatste vier weken is de gemiddelde afwijking ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. Deze cijfers worden bij elke update herberekend.` },
        { q: 'Waarom kun je het tarief van morgen niet afleiden uit de prijs van een vat ruwe olie?', a: 'Omdat de programmaovereenkomst niet van ruwe olie vertrekt: ze volgt de internationale noteringen van de aardolieproducten zelf, en die noteringen zijn betalend en worden niet gepubliceerd. De olieprijs geeft een algemene richting, niet het cijfer van het tarief. Niemand buiten het officiële circuit kan de maximumprijs van morgen dus vooraf narekenen; je kunt hem alleen schatten.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const e = d.est;
      const diffMaz = d.c27.mazout_lt2000 - d.c28.mazout_lt2000;
      return `
<h2>Een akkoord tussen de Staat en de aardoliesector</h2>
<p>De maximumprijs wordt niet dag na dag door een minister beslist. Hij volgt uit een programmaovereenkomst, een akkoord tussen de Belgische Staat en Energia, de federatie van de aardoliesector, dat de FOD Economie toepast door het ${h.src('spfTarif', 'officiële tarief')} te publiceren. Het ${h.src('fondsPrix', 'Sociaal Verwarmingsfonds')} wijst op de twee gevolgen voor de klant: het tarief legt per product een plafond vast, en verkopen boven dat plafond is verboden.</p>
<p>De rekenmethode staat in een technische bijlage van 9 oktober 2006. Ze laat de maximumprijs de internationale noteringen van aardolieproducten volgen. Die noteringen zijn betalend en worden niet gepubliceerd: het publiek, de pers en deze site zien het resultaat, het tarief, maar niet de invoercijfers. Daarom kan niemand de officiële prijs van morgen vooraf narekenen.</p>
<h2>Wat het wetsvoorstel van maart 2026 laat zien</h2>
<p>Over de programmaovereenkomst werd in het voorjaar van 2026 een wetsvoorstel ingediend in de Kamer. Het ${h.src('chambreContrat', 'wetsvoorstel DOC 56 1452/001 van 30 maart 2026')} vermeldt de officiële tarieven van twee data, 28 februari en 27 maart 2026, om te tonen hoe snel de maximumprijs de markten volgt.</p>
${tableContrat(h, d, ['Product', '28 februari 2026', '27 maart 2026', 'Verschil per liter'], 'Maximumprijzen incl. btw zoals vermeld in wetsvoorstel DOC 56 1452/001 (mazout met vier decimalen, zoals in het document).')}
<p>Op een maand ${diffMaz > 0 ? 'steeg' : diffMaz < 0 ? 'daalde' : 'veranderde'} het plafond van mazout bij levering onder 2.000 liter ${diffMaz === 0 ? 'niet' : `met ${h.cts(Math.abs(diffMaz)).replace(/^[+−]/, '')} per liter, of ${h.pct(Math.abs(diffMaz) / d.c28.mazout_lt2000, 0)}`}. Op een tank van 1.500 liter betekent het verschil tussen die twee data ${h.eur(Math.abs(diffMaz) * 1500)}.</p>
<h2>Hoe vaak de maximumprijs verandert</h2>
<p>Met de reeks die Statbel op ${h.src('bestatJour', 'be.STAT')} publiceert, kun je de nieuwe tarieven dag per dag tellen. De tabel deelt de laatste ${h.num(d.all.days)} dagen in volgens de weekdag waarop een nieuwe prijs in werking trad, voor mazout onder 2.000 liter en, ter vergelijking, diesel B7.</p>
${tableJours(h, d, ['Dag', 'Mazout: nieuwe tarieven', 'Mazout: aandeel dagen', 'Diesel B7: nieuwe tarieven'], `Dagen waarop de maximumprijs veranderde tegenover de dag ervoor, over de laatste ${h.num(d.all.days)} dagen van de be.STAT-reeks.`)}
<p>Voor mazout is ${nomL(h, d.top.wd)} de drukste dag: ${h.num(d.top.m.changed)} van de ${h.num(d.top.m.days)} ${nomL(h, d.top.wd)}en brachten een nieuw tarief. ${d.calmes.length
  ? `Op ${liste(h, d.calmes.map((j) => nomL(h, j.wd)))} verandert de prijs daarentegen bijna nooit: het tarief van de vorige dag blijft er doorgaans gelden.`
  : 'Geen enkele weekdag blijft gespaard: elke dag kende in die periode vaak wijzigingen.'} Diesel volgt een heel ander ritme, met ${h.num(d.dsl.changed)} wijzigingen over het jaar tegenover ${h.num(d.all.changed)} voor mazout. De kleine rekentool bovenaan maakt dezelfde telling voor een product en een dag naar keuze.</p>
<h2>Stijgingen, dalingen en omvang</h2>
<p>Over het jaar kende mazout ${h.num(d.all.up)} stijgingen en ${h.num(d.all.down)} dalingen. Als de prijs verandert, beweegt hij gemiddeld ${h.l3(d.all.meanAbs)} per liter. Eén dag op tien is de wijziging kleiner dan ${h.cts(d.all.p10)}, en één op tien groter dan ${h.cts(d.all.p90)}: de meeste stappen zijn bescheiden, maar ze tellen op. Op 1.500 liter weegt een gemiddelde wijziging ${h.eur(d.all.meanAbs * 1500)} op de factuur. De pagina ${h.a('historique-mazout', 'evolutie van de mazoutprijs')} toont hoe die kleine stappen de curve van het jaar tekenden.</p>
<h2>Waarom morgen alleen geschat kan worden</h2>
<p>Een nieuw tarief wordt gepubliceerd voor het in werking treedt: is de prijs van morgen bekend, dan toont de pagina ${h.a('mazout-demain', 'mazoutprijs morgen')} dat officiële tarief. Zolang dat niet zo is, laat geen enkele openbare bron toe hem te berekenen. Een site die vóór de publicatie « de prijs van morgen » aankondigt, geeft dus hooguit een schatting, en zou dat moeten zeggen. Hier krijgt elk zulk cijfer dat etiket en wordt het vervangen door het officiële tarief zodra dat verschijnt.</p>
<h2>Hoe deze site de volgende ongepubliceerde dag schat</h2>
<p>De schatting doet niet alsof ze de markt kan raden. Ze vertrekt van het laatst gepubliceerde tarief, dat de centrale waarde is, met daarrond de vork van de wijzigingen die het voorbije jaar op dezelfde weekdag werden waargenomen, tussen het eerste en het negende deciel. Ze geeft ook de kans dat die dag een nieuw tarief in werking treedt, op basis van hetzelfde jaar waarnemingen. Voor ${h.date(e.day)}, de volgende dag zonder gepubliceerd tarief, geeft dat een centrale waarde van ${h.l3(e.central)}, een vork van ${h.l3(e.low)} tot ${h.l3(e.high)} en een kans op wijziging van ${h.pct(e.prob, 0)}.</p>
<p>Waarom van de laatste prijs vertrekken en niet van een trend? Omdat dat, gemeten op de reeks, de schatter is die zich het minst vergist. Over ${h.num(d.bt52.days)} dagen bedroeg de gemiddelde afwijking tussen het laatst gepubliceerde tarief en het officiële tarief van de volgende dag ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} per liter, en bleef het verschil ${h.pct(d.bt52.within1c, 0)} van de tijd onder één cent. Over de laatste vier weken is dat ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. Voor diesel B7, dat minder vaak verandert, zakt de gemiddelde afwijking over een jaar tot ${h.cts(d.btD.mae).replace(/^[+−]/, '')}. De ${h.a('method', 'methodepagina')} beschrijft die berekeningen in detail.</p>
<h2>De grenzen, zwart op wit</h2>
<p>De vork beschrijft wat er gebeurd is, niet wat er zal gebeuren. Een woelige week op de markten kan een grotere wijziging opleveren dan alle andere van het jaar, en de schatting ziet die niet aankomen. Ze vervangt nooit het officiële tarief; ze geeft een grootteorde aan wie vandaag moet beslissen over een bestelling die morgen geleverd wordt. Wat de regel van het plafond precies inhoudt, leest u in de gids over de ${h.a('prix-maximum', 'maximumprijs van mazout')}; voor brandstoffen geldt dezelfde logica bij de ${h.a('diesel-demain', 'dieselprijs van morgen')}.</p>`;
    },
  },
  en: {
    slug: 'programme-contract-fuel-prices',
    nav: 'Programme contract',
    card: 'How and when the maximum price changes, and why tomorrow remains an estimate.',
    title: 'Programme contract fuel prices 2026: when prices change',
    description: 'Belgium’s programme contract on oil prices: who signed it, on which days the heating oil maximum price changes, and how accurate the estimate of tomorrow is.',
    h1: 'The programme contract: how the maximum price changes',
    intro: 'The real calendar of new tariffs, counted over a year, and what it allows us to say about tomorrow.',
    resume: (h) => {
      const d = D(h);
      return `Maximum prices for petroleum products in Belgium are set by the FPS Economy under the programme contract between the Belgian State and Energia, the petroleum sector federation. Its technical annex, dated 9 October 2006, makes the price follow international quotations for petroleum products; those quotations are paid for and not published, so nobody can recompute tomorrow’s official price in advance. Over the last ${h.num(d.all.days)} days of the be.STAT series, the maximum price of heating oil delivered in orders under 2,000 litres changed ${h.num(d.all.changed)} times, ${h.num(d.all.up)} rises and ${h.num(d.all.down)} falls; a new tariff most often lands on a ${nomL(h, d.top.wd)} (${h.pct(d.top.m.prob, 0)} of ${nomL(h, d.top.wd)}s). Diesel B7 changed only ${h.num(d.dsl.changed)} times. Until tomorrow’s tariff is published, this site shows an estimate: the last published price, framed by the range seen on the same weekday. Over 52 weeks it was off the actual tariff by ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} a litre on average.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Who signed the programme contract that governs oil prices in Belgium?', a: 'The programme contract is an agreement between the Belgian State and Energia, the federation representing the petroleum sector. By applying it, the FPS Economy, the federal economy ministry, publishes the maximum price of each product. Its technical annex dates from 9 October 2006. The Social Heating Fund and the Chamber of Representatives, in a bill tabled in March 2026, both describe this framework.' },
        { q: 'Can the maximum price of heating oil change on a Monday?', a: d.lundi.changed === 0
          ? `Of the ${h.num(d.lundi.days)} Mondays in the past year, none brought a new tariff for heating oil delivered under 2,000 litres: Monday’s price was each time Sunday’s. That describes the past; nothing rules out a Monday exception, and the tomorrow’s price page shows the official tariff as soon as it appears.`
          : `Yes: of the ${h.num(d.lundi.days)} Mondays in the past year, ${h.num(d.lundi.changed)} brought a new tariff for heating oil delivered under 2,000 litres, or ${h.pct(d.lundi.prob, 0)}. On the other Mondays the price stayed at the previous day’s level. The tomorrow’s price page shows the official tariff as soon as it appears.` },
        { q: 'Why does the diesel maximum price move less often than heating oil’s?', a: `The figures are clear: over a year, ${h.num(d.dsl.changed)} new tariffs for diesel B7 against ${h.num(d.all.changed)} for heating oil under 2,000 litres. The programme contract does not apply the same rhythm to every product, and its calculation rests on quotations the public cannot see. When diesel does change, the average move is ${h.l3(d.dsl.meanAbs)} a litre.` },
        { q: 'How far off was the estimate of tomorrow’s price over a year?', a: `Over the last ${h.num(d.bt52.days)} days, carrying forward the last published tariff missed the next day’s official tariff by ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} a litre on average, and stayed within one cent ${h.pct(d.bt52.within1c, 0)} of the time. Over the last four weeks the average error is ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. These figures are recomputed at every update.` },
        { q: 'Why can’t tomorrow’s tariff be worked out from the price of a barrel of crude?', a: 'Because the programme contract does not start from crude oil: it follows international quotations for the petroleum products themselves, and those quotations are paid for and not published. The crude price shows a general direction, not the figure in the tariff. Nobody outside the official process can therefore recompute tomorrow’s maximum price in advance; it can only be estimated.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const e = d.est;
      const diffMaz = d.c27.mazout_lt2000 - d.c28.mazout_lt2000;
      return `
<h2>An agreement between the State and the oil sector</h2>
<p>The maximum price is not decided day by day by a minister. It flows from a programme contract, an agreement between the Belgian State and Energia, the oil sector federation, which the FPS Economy applies by publishing the ${h.src('spfTarif', 'official tariff')}. The ${h.src('fondsPrix', 'Social Heating Fund')} spells out the two consequences for customers: the tariff sets a ceiling for each product, and selling above that ceiling is forbidden.</p>
<p>The calculation method is set out in a technical annex dated 9 October 2006. It makes the maximum price follow international quotations for petroleum products. Those quotations are paid for and not published: the public, the press and this site see the result, the tariff, but not the input figures. That is why nobody can recompute tomorrow’s official price in advance.</p>
<h2>What the March 2026 bill shows</h2>
<p>In spring 2026 a bill on the programme contract was tabled in the Chamber of Representatives. ${h.src('chambreContrat', 'Bill DOC 56 1452/001 of 30 March 2026')} quotes the official tariffs for two dates, 28 February and 27 March 2026, to show how quickly the maximum price tracks the markets.</p>
${tableContrat(h, d, ['Product', '28 February 2026', '27 March 2026', 'Change per litre'], 'Maximum prices including VAT as quoted in bill DOC 56 1452/001 (heating oil to four decimals, as in the document).')}
<p>Within a month, the cap on heating oil delivered under 2,000 litres ${diffMaz > 0 ? 'rose' : diffMaz < 0 ? 'fell' : 'did not move'}${diffMaz === 0 ? '' : ` by ${h.cts(Math.abs(diffMaz)).replace(/^[+−]/, '')} a litre, or ${h.pct(Math.abs(diffMaz) / d.c28.mazout_lt2000, 0)}`}. On a 1,500-litre tank, the gap between those two dates comes to ${h.eur(Math.abs(diffMaz) * 1500)}.</p>
<h2>How often the maximum price changes</h2>
<p>The series Statbel publishes on ${h.src('bestatJour', 'be.STAT')} makes it possible to count new tariffs day by day. The table sorts the last ${h.num(d.all.days)} days by the weekday on which a new price came into force, for heating oil under 2,000 litres and, for comparison, diesel B7.</p>
${tableJours(h, d, ['Day', 'Heating oil: new tariffs', 'Heating oil: share of days', 'Diesel B7: new tariffs'], `Days on which the maximum price changed from the day before, over the last ${h.num(d.all.days)} days of the be.STAT series.`)}
<p>For heating oil, the busiest day is ${nomL(h, d.top.wd)}: ${h.num(d.top.m.changed)} out of ${h.num(d.top.m.days)} ${nomL(h, d.top.wd)}s brought a new tariff. ${d.calmes.length
  ? `On ${liste(h, d.calmes.map((j) => nomL(h, j.wd)))}, by contrast, the price almost never changes: the previous day’s tariff usually carries over.`
  : 'No weekday is spared: every day saw frequent changes over the period.'} Diesel follows quite another rhythm, with ${h.num(d.dsl.changed)} changes over the year against ${h.num(d.all.changed)} for heating oil. The small calculator at the top runs the same count for any product and day you pick.</p>
<h2>Rises, falls and their size</h2>
<p>Over the year heating oil saw ${h.num(d.all.up)} rises and ${h.num(d.all.down)} falls. When it changes, it moves by ${h.l3(d.all.meanAbs)} a litre on average. One day in ten the change is below ${h.cts(d.all.p10)}, and one in ten above ${h.cts(d.all.p90)}: most steps are small, but they add up. On 1,500 litres, an average move is worth ${h.eur(d.all.meanAbs * 1500)} on the bill. The ${h.a('historique-mazout', 'heating oil price history')} page shows how these small steps drew the year’s curve.</p>
<h2>Why tomorrow can only be estimated</h2>
<p>A new tariff is published before it takes effect: once tomorrow’s price is known, the ${h.a('mazout-demain', 'heating oil price tomorrow')} page shows that official tariff. Until then, no public source makes it possible to calculate it. A site announcing “tomorrow’s price” before publication is therefore giving an estimate at best, and ought to say so. Here, every such figure carries that label and is replaced by the official tariff as soon as it appears.</p>
<h2>How this site estimates the next unpublished day</h2>
<p>The estimate does not pretend to read the market. It starts from the last published tariff, used as the central value, and frames it with the range of changes seen on the same weekday over a year, between the first and ninth deciles. It also gives the probability that a new tariff takes effect that day, from the same year of observations. For ${h.date(e.day)}, the next day without a published tariff, that gives a central value of ${h.l3(e.central)}, a range of ${h.l3(e.low)} to ${h.l3(e.high)} and a probability of change of ${h.pct(e.prob, 0)}.</p>
<p>Why start from the last price rather than a trend? Because, measured on the series, it is the estimator that errs least. Over ${h.num(d.bt52.days)} days, the average gap between the last published tariff and the next day’s official tariff was ${h.cts(d.bt52.mae).replace(/^[+−]/, '')} a litre, and the gap stayed under one cent ${h.pct(d.bt52.within1c, 0)} of the time. Over the last four weeks it was ${h.cts(d.bt4.mae).replace(/^[+−]/, '')}. For diesel B7, which changes less often, the yearly average error drops to ${h.cts(d.btD.mae).replace(/^[+−]/, '')}. The ${h.a('method', 'method page')} sets out these calculations.</p>
<h2>The limits, in black and white</h2>
<p>The range describes what happened, not what will happen. A turbulent week on the markets can produce a bigger move than any other in the year, and the estimate will not see it coming. It never replaces the official tariff; it gives an order of magnitude to anyone who must decide today on an order delivered tomorrow. For what the cap rule actually says, see the guide to the ${h.a('prix-maximum', 'maximum price of heating oil')}; for road fuels, the same logic applies to ${h.a('diesel-demain', 'tomorrow’s diesel price')}.</p>`;
    },
  },
});
