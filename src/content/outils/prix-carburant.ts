import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Prix des carburants : tous les carburants routiers du tarif officiel, aujourd'hui et demain, et comparaison de deux produits. */
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const keys = M.FAMILLE.carburants;
  const prix = keys.map((k) => ({ k, p: M.priceOn(k, t)!, s: M.situation(k, t) }));
  const tri = [...prix].sort((a, b) => a.p - b.p);
  const publie = prix.filter((x) => x.s.tomorrow.official);
  const bouge = publie.filter((x) => x.s.tomorrow.official && x.s.tomorrow.delta !== 0);
  const hausses = bouge.filter((x) => x.s.tomorrow.official && x.s.tomorrow.delta > 0).length;
  const sD = M.series('diesel_b7').filter((x) => x[0] <= t), mE = new Map(M.series('e10_95'));
  const jours = sD.slice(-365).filter(([dd]) => mE.has(dd));
  const dieselPlusCher = jours.filter(([dd, v]) => v > mE.get(dd)!).length;
  const ecartMoyen = jours.reduce((s, [dd, v]) => s + (v - mE.get(dd)!), 0) / (jours.length || 1);
  const pD = M.priceOn('diesel_b7', t)!, pE = M.priceOn('e10_95', t)!;
  return { M, t, keys, prix, tri, publie, bouge, hausses, jours: jours.length, dieselPlusCher, ecartMoyen, pD, pE, tom: M.addDays(t, 1) };
}
type DD = ReturnType<typeof D>;
/** Nom du produit dans une phrase : minuscule initiale (sauf LPG) et, en français, article (« le diesel B7 », « l’essence 98 E5 »). */
const nom = (h: Helpers, d: DD, k: string) => {
  const n = d.M.NOM[k as keyof typeof d.M.NOM][h.lang];
  const low = n.startsWith('LPG') ? n : n.charAt(0).toLowerCase() + n.slice(1);
  if (h.lang !== 'fr') return low;
  return /^[aeiouhé]/i.test(low) ? `l’${low}` : `le ${low}`;
};

/** Nombre de jours où le diesel B7 a dépassé le 95 E10, formulé sans tournure absurde aux extrêmes. */
function freq(h: Helpers, d: DD) {
  const n = d.dieselPlusCher, N = d.jours;
  if (n === N) return h.T(`sur les ${h.num(N)} derniers jours, le diesel a été plus cher que le 95 E10 chaque jour`, `over de laatste ${h.num(N)} dagen was diesel elke dag duurder dan 95 E10`, `over the last ${h.num(N)} days diesel was dearer than 95 E10 every single day`);
  if (n === 0) return h.T(`sur les ${h.num(N)} derniers jours, le diesel n’a jamais été plus cher que le 95 E10`, `over de laatste ${h.num(N)} dagen was diesel nooit duurder dan 95 E10`, `over the last ${h.num(N)} days diesel was never dearer than 95 E10`);
  return h.T(`sur les ${h.num(N)} derniers jours, le diesel a été plus cher que le 95 E10 pendant ${h.num(n)} jours`, `over de laatste ${h.num(N)} dagen was diesel op ${h.num(n)} dagen duurder dan 95 E10`, `over the last ${h.num(N)} days diesel was dearer than 95 E10 on ${h.num(n)} days`);
}

function demain(h: Helpers, d: DD) {
  const n = d.keys.length, np = d.publie.length, nb = d.bouge.length;
  if (np === 0) return h.T(
    `Les tarifs du ${h.date(d.tom)} ne sont pas encore publiés : pour demain, l’outil affiche une estimation par carburant, signalée comme telle.`,
    `De tarieven voor ${h.date(d.tom)} zijn nog niet gepubliceerd: voor morgen toont de tool per brandstof een schatting, die als zodanig is aangeduid.`,
    `The tariffs for ${h.date(d.tom)} are not out yet: for tomorrow the tool shows an estimate for each fuel, labelled as such.`);
  const tous = np === n;
  return h.T(
    `Pour le ${h.date(d.tom)}, les tarifs officiels de ${tous ? 'tous les carburants' : `${h.num(np)} carburants sur ${h.num(n)}`} sont déjà publiés : ${nb === 0 ? 'aucun prix ne change' : `${h.num(nb)} changent, dont ${h.num(d.hausses)} à la hausse`}.`,
    `Voor ${h.date(d.tom)} zijn de officiële tarieven van ${tous ? 'alle brandstoffen' : `${h.num(np)} van de ${h.num(n)} brandstoffen`} al gepubliceerd: ${nb === 0 ? 'geen enkele prijs verandert' : `${h.num(nb)} veranderen, waarvan ${h.num(d.hausses)} stijgen`}.`,
    `For ${h.date(d.tom)} the official tariffs of ${tous ? 'every fuel' : `${h.num(np)} fuels out of ${h.num(n)}`} are already out: ${nb === 0 ? 'no price changes' : `${h.num(nb)} change, ${h.num(d.hausses)} of them upwards`}.`);
}

const resume = (h: Helpers) => {
  const d = D(h);
  const lo = d.tri[0], hi = d.tri[d.tri.length - 1];
  const liste = d.prix.map((x) => `${d.M.COURT[x.k][h.lang]} ${h.l3(x.p)}`).join(', ');
  return h.T(
    `Les prix maximums officiels des carburants en Belgique au ${h.date(d.t)}, TVA de 21 % comprise, sont les suivants : ${liste}. Le moins cher au litre est ${nom(h, d, lo.k)}, le plus cher ${nom(h, d, hi.k)}, soit ${c(h, hi.p - lo.p)} d’écart. Ces prix sont des plafonds fixés par le SPF Économie au titre du contrat-programme conclu entre l’État belge et la fédération pétrolière Energia ; ils valent dans tout le pays, et une station peut vendre moins cher, jamais plus cher. ${demain(h, d)} Le diesel B7 est aujourd’hui ${d.pD > d.pE ? `plus cher que l’essence 95 E10, de ${c(h, d.pD - d.pE)}` : d.pD < d.pE ? `moins cher que l’essence 95 E10, de ${c(h, d.pD - d.pE)}` : 'au même prix que l’essence 95 E10'} ; ${freq(h, d)}.`,
    `De officiële maximumprijzen van de brandstoffen in België op ${h.date(d.t)}, inclusief 21 % btw, zijn: ${liste}. Per liter is ${nom(h, d, lo.k)} het goedkoopst en ${nom(h, d, hi.k)} het duurst, een verschil van ${c(h, hi.p - lo.p)}. Het zijn plafonds die de FOD Economie vastlegt op grond van de programmaovereenkomst tussen de Belgische Staat en de petroleumfederatie Energia; ze gelden in het hele land, en een tankstation mag goedkoper verkopen, nooit duurder. ${demain(h, d)} Diesel B7 is vandaag ${d.pD > d.pE ? `${c(h, d.pD - d.pE)} duurder dan` : d.pD < d.pE ? `${c(h, d.pD - d.pE)} goedkoper dan` : 'even duur als'} benzine 95 E10; ${freq(h, d)}.`,
    `The official maximum fuel prices in Belgium on ${h.date(d.t)}, including 21% VAT, are: ${liste}. Per litre the cheapest is ${nom(h, d, lo.k)} and the dearest ${nom(h, d, hi.k)}, a gap of ${c(h, hi.p - lo.p)}. These are ceilings set by the FPS Economy under the programme agreement between the Belgian State and the petroleum federation Energia; they apply across the country, and a station may sell for less, never for more. ${demain(h, d)} Diesel B7 is today ${d.pD > d.pE ? `${c(h, d.pD - d.pE)} dearer than` : d.pD < d.pE ? `${c(h, d.pD - d.pE)} cheaper than` : 'the same price as'} 95 E10 petrol; ${freq(h, d)}.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  const lo = d.tri[0], lo2 = d.tri.find((x) => x.k !== 'lpg')!;
  const lastE = d.M.lastTariff('e10_95'), lastD = d.M.lastTariff('diesel_b7');
  return [
    {
      q: h.T('Quel est le carburant le moins cher en Belgique aujourd’hui ?', 'Welke brandstof is vandaag het goedkoopst in België?', 'Which fuel is cheapest in Belgium today?'),
      a: h.T(
        `Au litre, c’est ${nom(h, d, lo.k)}, plafonné à ${h.l3(lo.p)} le ${h.date(d.t)}. ${lo.k === 'lpg' ? `Hors LPG, qui ne convient qu’aux voitures équipées, le moins cher est ${nom(h, d, lo2.k)}, à ${h.l3(lo2.p)}.` : ''} Le prix au litre ne suffit pas pour choisir : la consommation de votre moteur change le coût au kilomètre, que la page budget carburant calcule.`,
        `Per liter is dat ${nom(h, d, lo.k)}, begrensd op ${h.l3(lo.p)} op ${h.date(d.t)}. ${lo.k === 'lpg' ? `Zonder LPG, dat alleen voor uitgeruste wagens geschikt is, is ${nom(h, d, lo2.k)} het goedkoopst, tegen ${h.l3(lo2.p)}.` : ''} De literprijs volstaat niet om te kiezen: het verbruik van uw motor bepaalt de kost per kilometer, die de pagina brandstofbudget uitrekent.`,
        `Per litre it is ${nom(h, d, lo.k)}, capped at ${h.l3(lo.p)} on ${h.date(d.t)}. ${lo.k === 'lpg' ? `Leaving out LPG, which only suits converted or factory-fitted cars, the cheapest is ${nom(h, d, lo2.k)}, at ${h.l3(lo2.p)}.` : ''} Price per litre is not enough to choose: your engine’s consumption sets the cost per kilometre, which the fuel budget page works out.`).replace(/\s+/g, ' '),
    },
    {
      q: h.T('Le prix maximum des carburants est-il le même en Wallonie, en Flandre et à Bruxelles ?', 'Is de maximumprijs van brandstof dezelfde in Vlaanderen, Wallonië en Brussel?', 'Is the maximum fuel price the same in Flanders, Wallonia and Brussels?'),
      a: h.T(
        'Oui. Le tarif officiel est national : le SPF Économie publie un seul prix maximum par produit, valable dans toutes les stations du pays, en ville comme sur autoroute. Les prix réellement affichés peuvent différer d’une station à l’autre, parce que chacune peut vendre sous le plafond, mais aucune région ni aucun type de station n’a de maximum plus élevé.',
        'Ja. Het officiële tarief is nationaal: de FOD Economie publiceert één maximumprijs per product, geldig in alle tankstations van het land, in de stad en langs de snelweg. De prijzen die echt aan de pomp staan, kunnen per station verschillen, omdat elk station onder het plafond mag verkopen, maar geen enkel gewest of type station heeft een hoger maximum.',
        'Yes. The official tariff is national: the FPS Economy publishes one maximum price per product, valid at every station in the country, in town and on the motorway. The prices actually displayed can differ from station to station, because each may sell below the ceiling, but no region and no type of station has a higher maximum.'),
    },
    {
      q: h.T('La TVA est-elle comprise dans le prix maximum des carburants ?', 'Is de btw inbegrepen in de maximumprijs van brandstof?', 'Is VAT included in the maximum fuel price?'),
      a: lastE?.excl != null && lastD?.excl != null
        ? h.T(
          `Oui, le plafond qui s’applique à la pompe s’entend TVA de 21 % comprise. Le tarif publie aussi le prix hors TVA : au ${h.date(lastE.day)}, ${h.l3(lastE.excl)} pour le 95 E10 et ${h.l3(lastD.excl)} pour le diesel B7, avant TVA. Les autres taxes sur le carburant sont déjà incluses dans ces montants ; le prix maximum est donc bien le prix final au litre.`,
          `Ja, het plafond aan de pomp is inclusief 21 % btw. Het tarief vermeldt ook de prijs zonder btw: op ${h.date(lastE.day)} ${h.l3(lastE.excl)} voor 95 E10 en ${h.l3(lastD.excl)} voor diesel B7, vóór btw. De andere belastingen op brandstof zitten al in die bedragen; de maximumprijs is dus wel degelijk de eindprijs per liter.`,
          `Yes, the ceiling that applies at the pump includes 21% VAT. The tariff also gives the price excluding VAT: on ${h.date(lastE.day)}, ${h.l3(lastE.excl)} for 95 E10 and ${h.l3(lastD.excl)} for diesel B7, before VAT. The other taxes on fuel are already included in those amounts, so the maximum price really is the final price per litre.`)
        : h.T('Oui, le plafond qui s’applique à la pompe s’entend TVA de 21 % comprise, et les autres taxes sur le carburant y sont déjà incluses. Le tarif officiel publie aussi le prix hors TVA de chaque produit, utile aux professionnels qui récupèrent tout ou partie de la TVA selon leurs propres règles fiscales.', 'Ja, het plafond aan de pomp is inclusief 21 % btw, en de andere belastingen op brandstof zitten er al in. Het officiële tarief vermeldt ook de prijs zonder btw van elk product, handig voor professionals die volgens hun eigen fiscale regels de btw geheel of gedeeltelijk recupereren.', 'Yes, the ceiling at the pump includes 21% VAT, and the other taxes on fuel are already included. The official tariff also gives each product’s price excluding VAT, which helps businesses that recover some or all of the VAT under their own tax rules.'),
    },
    {
      q: h.T('Pourquoi le prix affiché à la pompe est-il souvent sous le prix maximum ?', 'Waarom ligt de prijs aan de pomp vaak onder de maximumprijs?', 'Why is the pump price often below the maximum?'),
      a: h.T(
        'Parce que le maximum est un plafond et non un prix imposé. Chaque station fixe son prix sous ce plafond selon sa politique commerciale : stations automatiques, enseignes de grande distribution ou stations d’autoroute ne font pas les mêmes choix. Le prix maximum reste le repère pour savoir combien un plein peut coûter au pire, et pour vérifier un ticket.',
        'Omdat het maximum een plafond is en geen opgelegde prijs. Elk tankstation bepaalt zijn prijs onder dat plafond volgens zijn eigen commerciële beleid: onbemande stations, supermarktketens en snelwegstations maken niet dezelfde keuzes. De maximumprijs blijft het richtpunt om te weten wat een tankbeurt in het slechtste geval kost, en om een ticket te controleren.',
        'Because the maximum is a ceiling, not a set price. Each station sets its own price below that ceiling according to its commercial policy: unmanned stations, supermarket chains and motorway stations do not make the same choices. The maximum price remains the benchmark for what a fill-up can cost at worst, and for checking a receipt.'),
    },
    {
      q: h.T('À quelle fréquence les prix des carburants de ce site sont-ils mis à jour ?', 'Hoe vaak worden de brandstofprijzen op deze site bijgewerkt?', 'How often are the fuel prices on this site updated?'),
      a: h.T(
        `Le site relit le tarif officiel publié par Statbel plusieurs fois par jour et se reconstruit à chaque lecture. Les prix affichés sur cette page datent du dernier relevé, le ${h.date(d.M.FETCHED_AT.slice(0, 10))}. Dans votre navigateur, l’outil recale ensuite la date sur l’heure de Bruxelles, pour basculer au bon moment sur le tarif du jour.`,
        `De site leest het door Statbel gepubliceerde officiële tarief meermaals per dag en wordt bij elke lezing opnieuw opgebouwd. De prijzen op deze pagina komen uit de laatste lezing, op ${h.date(d.M.FETCHED_AT.slice(0, 10))}. In uw browser zet de tool de datum daarna gelijk met de Brusselse tijd, zodat hij op het juiste moment overschakelt naar het tarief van de dag.`,
        `The site reads the official tariff published by Statbel several times a day and rebuilds itself each time. The prices on this page come from the latest reading, on ${h.date(d.M.FETCHED_AT.slice(0, 10))}. In your browser the tool then aligns the date with Brussels time, so it switches to the day’s tariff at the right moment.`),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const rows = d.prix.map(({ k, p, s }) => {
    const tm = s.tomorrow, last = M.lastTariff(k);
    return [M.NOM[k][h.lang], h.l3(p), tm.official ? h.l3(tm.price) : `${h.l3(tm.est.central)} (${h.T('estimation', 'schatting', 'estimate')})`, tm.official ? (tm.delta === 0 ? '=' : h.cts(tm.delta)) : '—', last?.excl != null ? h.l3(last.excl) : '—'];
  });
  const tbl = h.table(
    h.T(['Carburant', 'Aujourd’hui', 'Demain', 'Variation', 'Hors TVA (dernier tarif)'], ['Brandstof', 'Vandaag', 'Morgen', 'Wijziging', 'Zonder btw (laatste tarief)'], ['Fuel', 'Today', 'Tomorrow', 'Change', 'Excl. VAT (latest tariff)']),
    rows,
    h.T(`Prix maximums officiels au litre, TVA comprise sauf dernière colonne, au ${h.date(d.t)}.`, `Officiële maximumprijzen per liter, incl. btw behalve in de laatste kolom, op ${h.date(d.t)}.`, `Official maximum prices a litre, VAT included except in the last column, on ${h.date(d.t)}.`),
    ['l', 'r', 'r', 'r', 'r']);
  const gap50 = h.eur(Math.abs(d.pD - d.pE) * 50, 2);
  const moy = d.ecartMoyen;
  return h.T(`
<h2>Tous les carburants routiers, aujourd’hui et demain</h2>
<p>Le tableau reprend les sept carburants routiers du tarif officiel, du diesel au LPG. La colonne « demain » donne le tarif officiel quand il est publié ; sinon, elle affiche une estimation, qui n’engage personne. La dernière colonne reprend le prix hors TVA du dernier tarif publié.</p>
${tbl}
<p>Chaque carburant a sa page : ${h.a('prix-diesel', 'prix du diesel')}, ${h.a('prix-essence', 'prix de l’essence')} et ${h.a('prix-lpg', 'prix du LPG')}. Le mazout de chauffage, qui suit le même système, est traité à part, sur la page ${h.a('mazout-demain', 'prix du mazout demain')}.</p>
<h2>Qui fixe le prix des carburants en Belgique</h2>
<p>Le prix maximum des produits pétroliers n’est pas un prix libre. Il découle du contrat-programme passé entre l’État belge et la fédération pétrolière Energia, dont l’annexe technique date du 9 octobre 2006, et c’est le ${h.src('spfTarif', 'SPF Économie')} qui publie le tarif. Le calcul part de cotations internationales des produits, payantes et non publiées : personne ne peut donc recalculer à l’avance le tarif officiel. Vendre au-dessus du maximum est interdit, comme le rappelle le ${h.src('fondsPrix', 'Fonds Social Chauffage')} ; vendre en dessous est permis. Le fonctionnement du système est détaillé sur la page ${h.a('prix-maximum', 'prix maximum')}.</p>
<h2>Diesel ou essence : l’écart du jour et celui de l’année</h2>
<p>Le diesel B7 et l’essence 95 E10 sont les deux carburants que l’on compare le plus souvent. Aujourd’hui, l’écart entre eux est de ${c(h, d.pD - d.pE)} par litre, soit ${gap50} sur un plein de 50 litres, en faveur ${d.pD > d.pE ? 'de l’essence' : d.pD < d.pE ? 'du diesel' : 'd’aucun des deux'}. ${freq(h, d).charAt(0).toUpperCase() + freq(h, d).slice(1)}, avec un écart moyen de ${h.cts(moy)} par litre${moy < 0 ? ', ce qui signifie qu’il a été moins cher en moyenne' : ''}. Pour suivre l’évolution de ces deux prix dans le temps, la page ${h.a('historique-carburants', 'historique des prix des carburants')} trace chaque courbe sur un mois, trois mois, six mois ou un an.</p>
<h2>Comment se servir du comparateur</h2>
<p>L’outil en haut de page compare deux carburants au choix sur le volume que vous indiquez, au prix maximum du jour, et classe tous les carburants routiers du moins cher au plus cher. Il répond par exemple à la question : combien coûte en plus un plein de 98 plutôt que de 95 ? Pour passer du plein au budget annuel, utilisez la page ${h.a('budget-carburant', 'budget carburant')}, et pour le prix du lendemain, ${h.a('diesel-demain', 'diesel demain')} ou ${h.a('essence-demain', 'essence demain')}.</p>
<h2>D’où viennent les chiffres</h2>
<p>Tous les prix proviennent de la série quotidienne du tarif officiel publiée par Statbel sur ${h.src('bestatJour', 'be.STAT')}, réutilisée sous ${h.src('statbelLicence', 'licence CC BY 4.0')}. MazoutMax est un site indépendant, édité par Radif Partners : il n’est ni le SPF Économie ni Statbel, et ne vend pas de carburant. La page ${h.a('method', 'méthode')} décrit la lecture des données et le calcul de l’estimation.</p>`,
  `
<h2>Alle brandstoffen voor het wegverkeer, vandaag en morgen</h2>
<p>De tabel toont de zeven wegbrandstoffen uit het officiële tarief, van diesel tot LPG. De kolom “morgen” geeft het officiële tarief als het gepubliceerd is; anders toont ze een schatting, die niemand bindt. De laatste kolom geeft de prijs zonder btw van het laatst gepubliceerde tarief.</p>
${tbl}
<p>Elke brandstof heeft een eigen pagina: ${h.a('prix-diesel', 'dieselprijs')}, ${h.a('prix-essence', 'benzineprijs')} en ${h.a('prix-lpg', 'LPG-prijs')}. Mazout voor verwarming, die hetzelfde systeem volgt, staat apart, op de pagina ${h.a('mazout-demain', 'mazoutprijs morgen')}.</p>
<h2>Wie de brandstofprijzen in België vastlegt</h2>
<p>De maximumprijs van aardolieproducten is geen vrije prijs. Hij volgt uit de programmaovereenkomst tussen de Belgische Staat en de petroleumfederatie Energia, waarvan de technische bijlage dateert van 9 oktober 2006, en het is de ${h.src('spfTarif', 'FOD Economie')} die het tarief publiceert. De berekening vertrekt van internationale productnoteringen die betalend zijn en niet gepubliceerd worden: niemand kan het officiële tarief dus vooraf herberekenen. Boven het maximum verkopen is verboden, zoals het ${h.src('fondsPrix', 'Sociaal Verwarmingsfonds')} in herinnering brengt; eronder verkopen mag. De werking van het systeem staat op de pagina ${h.a('prix-maximum', 'maximumprijs')}.</p>
<h2>Diesel of benzine: het verschil van vandaag en van het jaar</h2>
<p>Diesel B7 en benzine 95 E10 zijn de twee brandstoffen die het vaakst vergeleken worden. Vandaag bedraagt het verschil ${c(h, d.pD - d.pE)} per liter, of ${gap50} op een tankbeurt van 50 liter, in het voordeel van ${d.pD > d.pE ? 'benzine' : d.pD < d.pE ? 'diesel' : 'geen van beide'}. ${freq(h, d).charAt(0).toUpperCase() + freq(h, d).slice(1)}, met een gemiddeld verschil van ${h.cts(moy)} per liter${moy < 0 ? ', wat betekent dat diesel gemiddeld goedkoper was' : ''}. Om beide prijzen in de tijd te volgen, tekent de pagina ${h.a('historique-carburants', 'evolutie van de brandstofprijzen')} elke curve over een maand, drie maanden, zes maanden of een jaar.</p>
<h2>Hoe u de vergelijker gebruikt</h2>
<p>De tool bovenaan vergelijkt twee brandstoffen naar keuze op het volume dat u opgeeft, tegen de maximumprijs van vandaag, en rangschikt alle wegbrandstoffen van goedkoop naar duur. Hij beantwoordt bijvoorbeeld de vraag: hoeveel meer kost een tankbeurt met 98 dan met 95? Om van tankbeurt naar jaarbudget te gaan, gebruikt u de pagina ${h.a('budget-carburant', 'brandstofbudget')}, en voor de prijs van morgen ${h.a('diesel-demain', 'diesel morgen')} of ${h.a('essence-demain', 'benzine morgen')}.</p>
<h2>Waar de cijfers vandaan komen</h2>
<p>Alle prijzen komen uit de dagreeks van het officiële tarief die Statbel publiceert op ${h.src('bestatJour', 'be.STAT')}, hergebruikt onder ${h.src('statbelLicence', 'licentie CC BY 4.0')}. MazoutMax is een onafhankelijke site, uitgegeven door Radif Partners: het is niet de FOD Economie of Statbel en verkoopt geen brandstof. De pagina ${h.a('method', 'methode')} beschrijft hoe de gegevens gelezen worden en hoe de schatting berekend wordt.</p>`,
  `
<h2>Every road fuel, today and tomorrow</h2>
<p>The table lists the seven road fuels in the official tariff, from diesel to LPG. The “tomorrow” column gives the official tariff once published; otherwise it shows an estimate, which binds no one. The last column repeats the excluding-VAT price of the latest published tariff.</p>
${tbl}
<p>Each fuel has its own page: ${h.a('prix-diesel', 'diesel price')}, ${h.a('prix-essence', 'petrol price')} and ${h.a('prix-lpg', 'LPG price')}. Heating oil, which follows the same system, is covered separately on the ${h.a('mazout-demain', 'heating oil price tomorrow')} page.</p>
<h2>Who sets fuel prices in Belgium</h2>
<p>The maximum price of petroleum products is not a free price. It comes from the programme agreement between the Belgian State and the petroleum federation Energia, whose technical annex dates from 9 October 2006, and it is the ${h.src('spfTarif', 'FPS Economy')} that publishes the tariff. The calculation starts from international product quotations that are paid for and not published, so nobody can recompute the official tariff in advance. Selling above the maximum is forbidden, as the ${h.src('fondsPrix', 'Social Heating Fund')} points out; selling below it is allowed. How the system works is explained on the ${h.a('prix-maximum', 'maximum price')} page.</p>
<h2>Diesel or petrol: today’s gap and the year’s</h2>
<p>Diesel B7 and 95 E10 petrol are the two fuels most often compared. Today the gap between them is ${c(h, d.pD - d.pE)} a litre, or ${gap50} on a 50-litre fill-up, in favour of ${d.pD > d.pE ? 'petrol' : d.pD < d.pE ? 'diesel' : 'neither'}. ${freq(h, d).charAt(0).toUpperCase() + freq(h, d).slice(1)}, with an average difference of ${h.cts(moy)} a litre${moy < 0 ? ', meaning diesel was cheaper on average' : ''}. To follow both prices over time, the ${h.a('historique-carburants', 'fuel price history')} page draws each curve over one month, three months, six months or a year.</p>
<h2>How to use the comparison tool</h2>
<p>The tool at the top compares any two fuels on the volume you enter, at today’s maximum price, and ranks every road fuel from cheapest to dearest. It answers questions such as: how much more does a fill-up of 98 cost than one of 95? To go from a fill-up to a yearly budget, use the ${h.a('budget-carburant', 'fuel budget')} page, and for tomorrow’s price, ${h.a('diesel-demain', 'diesel tomorrow')} or ${h.a('essence-demain', 'petrol tomorrow')}.</p>
<h2>Where the figures come from</h2>
<p>All prices come from the daily series of the official tariff that Statbel publishes on ${h.src('bestatJour', 'be.STAT')}, reused under the ${h.src('statbelLicence', 'CC BY 4.0 licence')}. MazoutMax is an independent site published by Radif Partners: it is neither the FPS Economy nor Statbel, and it does not sell fuel. The ${h.a('method', 'method')} page describes how the data are read and how the estimate is calculated.</p>`);
};

export default defineGuide({
  id: 'prix-carburant',
  group: 'carburants',
  order: 1,
  tool: 'tableau',
  toolArg: 'carburants',
  related: ['prix-diesel', 'prix-essence', 'prix-lpg', 'historique-carburants', 'budget-carburant'],
  sources: ['bestatJour', 'bestatDernier', 'spfTarif', 'fondsPrix', 'statbelLicence'],
  fr: {
    slug: 'prix-carburant',
    nav: 'Prix des carburants',
    card: 'Diesel, essence et LPG : tous les prix maximums du jour et de demain.',
    title: 'Prix carburant 2026 en Belgique : diesel, essence et LPG',
    description: 'Prix des carburants en Belgique aujourd’hui et demain : prix maximum officiel du diesel, de l’essence 95 et 98 et du LPG, et l’écart entre deux carburants.',
    h1: 'Prix des carburants aujourd’hui',
    intro: 'Les prix maximums officiels de tous les carburants routiers, aujourd’hui et demain, et l’écart entre deux carburants sur votre plein.',
    resume, faqs, body,
  },
  nl: {
    slug: 'brandstofprijzen',
    nav: 'Brandstofprijzen',
    card: 'Diesel, benzine en LPG: alle maximumprijzen van vandaag en morgen.',
    title: 'Brandstofprijzen 2026 in België: diesel, benzine en LPG',
    description: 'Brandstofprijzen in België vandaag en morgen: officiële maximumprijs van diesel, benzine 95 en 98 en LPG, en het verschil tussen twee soorten brandstof.',
    h1: 'Brandstofprijzen vandaag',
    intro: 'De officiële maximumprijzen van alle wegbrandstoffen, vandaag en morgen, en het verschil tussen twee brandstoffen op uw tankbeurt.',
    resume, faqs, body,
  },
  en: {
    slug: 'fuel-prices-belgium',
    nav: 'Fuel prices',
    card: 'Diesel, petrol and LPG: every maximum price for today and tomorrow.',
    title: 'Fuel prices Belgium 2026: diesel, petrol and LPG today',
    description: 'Fuel prices in Belgium today and tomorrow: the official maximum for diesel, 95 and 98 petrol and LPG, and the difference between two fuels on a fill-up.',
    h1: 'Fuel prices today',
    intro: 'The official maximum prices of every road fuel, today and tomorrow, and the difference between two fuels on your fill-up.',
    resume, faqs, body,
  },
});
