import { defineGuide, type Helpers } from '../../lib/guide-types';

const K = 'mazout_lt2000' as const;
const TAG = { fr: 'fr-BE', nl: 'nl-BE', en: 'en-GB' } as const;
const mois = (h: Helpers, ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(TAG[h.lang], { month: 'long', timeZone: 'UTC' });
const moisAn = (h: Helpers, ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(TAG[h.lang], { month: 'long', year: 'numeric', timeZone: 'UTC' });
const moy = (xs: number[]) => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : NaN);

/** Ce qu'aurait donné une attente de n jours, sur la série publiée (même calcul que le mini-simulateur « attente »). */
const attente = (h: Helpers, n: number) => {
  const s = h.M.series(K).filter((p) => p[0] <= h.today);
  const d: number[] = [];
  for (let i = n; i < s.length; i++) d.push(s[i][1] - s[i - n][1]);
  return { n, count: d.length, baisse: d.filter((x) => x < 0).length / (d.length || 1), mean: moy(d), pire: Math.max(...d), mieux: Math.min(...d) };
};

const D = (h: Helpers) => {
  const now = h.M.priceOn(K, h.today)!;
  const ge = h.M.priceOn('mazout_ge2000', h.today)!;
  const r = h.M.range(K, 365, h.today);
  const e30 = h.M.evolution(K, 30, h.today);
  const m = h.M.monthly(K);
  const y = h.M.yearly(K);
  const douze = m.slice(-12);
  const bas = douze.reduce((a, b) => (b[1] < a[1] ? b : a));
  const haut = douze.reduce((a, b) => (b[1] > a[1] ? b : a));
  const ete = douze.filter((p) => ['06', '07', '08'].includes(p[0].slice(5))).map((p) => p[1]);
  const hiver = douze.filter((p) => ['12', '01', '02'].includes(p[0].slice(5))).map((p) => p[1]);
  const annees = [...new Set(m.map((p) => p[0].slice(0, 4)))].sort();
  // Écart le plus grand entre deux années pour un même mois calendaire.
  let gap = { mm: '', a: ['', 0] as [string, number], b: ['', 0] as [string, number], d: 0 };
  for (let i = 1; i <= 12; i++) {
    const mm = String(i).padStart(2, '0');
    const xs = m.filter((p) => p[0].slice(5) === mm);
    if (xs.length < 2) continue;
    const lo = xs.reduce((a, b) => (b[1] < a[1] ? b : a)), hi = xs.reduce((a, b) => (b[1] > a[1] ? b : a));
    if (hi[1] - lo[1] > gap.d) gap = { mm, a: lo, b: hi, d: hi[1] - lo[1] };
  }
  const dim = h.M.changeStats(K, 0), lun = h.M.changeStats(K, 1);
  return { now, ge, r, e30, m, y, douze, bas, haut, ete: moy(ete), hiver: moy(hiver), nEte: ete.length, nHiver: hiver.length, annees, gap, dim, lun, a7: attente(h, 7), a30: attente(h, 30), deux: 2000 * (now - ge) };
};
const tableMois = (h: Helpers, d: ReturnType<typeof D>, first: string, cap: string) => {
  const rows: Array<Array<string | number>> = [];
  for (let i = 1; i <= 12; i++) {
    const mm = String(i).padStart(2, '0');
    rows.push([mois(h, `2026-${mm}`), ...d.annees.map((a) => { const p = d.m.find((x) => x[0] === `${a}-${mm}`); return p ? h.l3(p[1]) : '–'; })]);
  }
  return h.table([first, ...d.annees], rows, cap, ['l', ...d.annees.map(() => 'r' as const)]);
};
const tableAttente = (h: Helpers, d: ReturnType<typeof D>, heads: string[], lbl: (n: number) => string, cap: string) => h.table(heads, [d.a7, d.a30].map((a) => [
  lbl(a.n), h.pct(a.baisse, 0), se(h, a.mean * 1500), se(h, a.pire * 1500), se(h, a.mieux * 1500),
]), cap, ['l', 'r', 'r', 'r', 'r']);
const signe = (x: number) => (x > 0 ? 1 : x < 0 ? -1 : 0);
/** Montant signé, avec le vrai signe moins. */
const se = (h: Helpers, x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${h.eur(Math.abs(x))}`;

export default defineGuide({
  id: 'quand-commander-mazout',
  group: 'comprendre',
  order: 12,
  mini: 'attente',
  miniHref: 'historique-mazout',
  related: ['historique-mazout', 'mazout-2000-litres', 'mazout-demain', 'budget-chauffage', 'allocation-chauffage'],
  sources: ['bestatJour', 'bestatMois', 'bestatAn', 'fondsDemande', 'fondsMontant'],
  fr: {
    slug: 'quand-commander-mazout',
    nav: 'Quand commander du mazout',
    card: 'Ce que l’historique dit vraiment du bon moment, du volume et des saisons.',
    title: 'Commander du mazout en 2026 : moment, volume et saisons',
    description: 'Commander du mazout au bon moment : ce que montrent un an de prix maximums, les moyennes mensuelles, l’effet d’une attente et le palier de 2 000 litres.',
    h1: 'Quand commander du mazout ? Ce que disent les données',
    intro: 'Pas de prédiction du marché ici : l’historique officiel, ce qu’il montre et ce qu’il ne permet pas de conclure.',
    resume: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `Personne ne connaît le prix maximum du mazout dans un mois, et l’historique officiel ne le prédit pas. Il permet en revanche de mesurer ce qu’auraient donné les choix du passé. Le ${h.date(h.today)}, le litre livré en moins de 2 000 litres plafonne à ${h.l3(d.now)}, ${pos > 0 ? 'au-dessus' : pos < 0 ? 'en dessous' : 'au niveau'} de sa moyenne des 365 derniers jours (${h.l3(d.r.mean)}), dans une fourchette allant de ${h.l3(d.r.min[1])} à ${h.l3(d.r.max[1])}. Sur la même année, attendre 30 jours avant de commander a fait baisser la facture dans ${h.pct(d.a30.baisse, 0)} des cas ; sur 1 500 litres, l’effet moyen de cette attente a été de ${se(h, d.a30.mean * 1500)}. Les moyennes mensuelles de Statbel ne dessinent pas de saison fiable : le même mois de ${mois(h, `2026-${d.gap.mm}`)} a coûté ${h.l3(d.gap.a[1])} en ${d.gap.a[0].slice(0, 4)} et ${h.l3(d.gap.b[1])} en ${d.gap.b[0].slice(0, 4)}. Le levier le plus sûr reste le volume : monter à 2 000 litres change le prix du litre de ${h.cts(d.ge - d.now)}.`;
    },
    faqs: (h) => {
      const d = D(h);
      const s = signe(d.ete - d.hiver);
      return [
        { q: 'Le mazout a-t-il été moins cher en été qu’en hiver sur les douze derniers mois ?', a: `Sur les douze derniers mois publiés par Statbel, la moyenne des mois d’été (juin à août) est de ${h.l3(d.ete)} le litre, contre ${h.l3(d.hiver)} pour l’hiver (décembre à février) : l’été a donc été ${s < 0 ? 'moins cher' : s > 0 ? 'plus cher' : 'au même niveau'}. Une seule année ne fait pas une règle, et le prix suit les marchés internationaux bien plus que le thermomètre belge.` },
        { q: 'Attendre un mois avant de commander a-t-il souvent fait baisser la facture de mazout ?', a: `Sur les ${h.num(d.a30.count)} périodes de 30 jours observées dans l’année, l’attente a fait baisser le prix dans ${h.pct(d.a30.baisse, 0)} des cas. Pour 1 500 litres, le meilleur cas a fait gagner ${h.eur(-d.a30.mieux * 1500)} et le pire a coûté ${h.eur(d.a30.pire * 1500)} de plus. Ces chiffres décrivent le passé récent ; ils ne disent rien du mois qui vient.` },
        { q: 'Deux livraisons de 1 000 litres coûtent-elles plus cher qu’une seule de 2 000 litres ?', a: `Oui, au tarif du ${h.date(h.today)} : deux livraisons de 1 000 litres sont facturées au maximum ${h.l3(d.now)} le litre, une livraison de 2 000 litres au maximum ${h.l3(d.ge)}. L’écart atteint ${h.eur(d.deux)} sur les 2 000 litres, à condition que la citerne puisse recevoir ce volume en une fois et que le négociant applique le tarif plein dans les deux cas.` },
        { q: 'Commander en décembre ou en janvier change-t-il l’aide du Fonds Social Chauffage ?', a: `Cela peut compter. Le Fonds Social Chauffage plafonne l’aide à ${h.num(h.P.fonds.litres_max_an)} litres par famille et par année civile : une livraison de début janvier entre dans le quota de la nouvelle année. La demande se fait au CPAS de la commune dans les ${h.num(h.P.fonds.delai_jours)} jours qui suivent la livraison, avec la facture et une copie de la carte d’identité.` },
        { q: 'Une estimation du prix de demain suffit-elle pour décider de commander aujourd’hui ?', a: 'Elle donne un ordre de grandeur, pas une certitude. Quand le tarif de demain est déjà publié, la page du prix de demain l’affiche et la question ne se pose plus. Sinon, l’estimation repose sur le dernier tarif publié et sur les variations passées du même jour de la semaine ; elle ne voit pas venir un mouvement brusque des marchés.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `
<h2>Ce que montrent les 365 derniers jours</h2>
<p>Le prix maximum du mazout livré en moins de 2 000 litres vaut ${h.l3(d.now)} le ${h.date(h.today)}. Sur un an, il est descendu au plus bas à ${h.l3(d.r.min[1])} le ${h.date(d.r.min[0])} et monté au plus haut à ${h.l3(d.r.max[1])} le ${h.date(d.r.max[0])}, pour une moyenne de ${h.l3(d.r.mean)}. Le prix du jour se situe donc ${pos > 0 ? `${h.cts(pos).replace(/^[+−]/, '')} au-dessus` : pos < 0 ? `${h.cts(-pos).replace(/^[+−]/, '')} en dessous` : 'exactement au niveau'} de cette moyenne. ${d.e30 != null ? `Sur 30 jours, la variation est de ${h.cts(d.e30)} par litre.` : ''} La courbe complète et le prix à n’importe quelle date se trouvent sur la page ${h.a('historique-mazout', 'historique du prix du mazout')}.</p>
<p>Ces chiffres viennent de la série officielle publiée par Statbel sur ${h.src('bestatJour', 'be.STAT')}. Ils décrivent ce qui a été, et c’est tout : savoir que le prix est au-dessus de sa moyenne ne dit pas qu’il va redescendre.</p>
<h2>Attendre : ce que cela a vraiment donné</h2>
<p>La tentation la plus courante est d’attendre une baisse. Le mini-simulateur en haut de page fait le compte sur votre volume ; le tableau ci-dessous le fait pour 1 500 litres, en comparant chaque jour de l’année au prix de 7 et de 30 jours plus tard.</p>
${tableAttente(h, d, ['Attente', 'Cas où la facture a baissé', 'Effet moyen', 'Pire cas', 'Meilleur cas'], (n) => `${h.num(n)} jours`, 'Effet d’une attente sur une commande de 1 500 litres au prix maximum sous 2 000 litres, sur les 365 derniers jours.')}
<p>${d.a30.baisse > 0.5 ? 'Sur cette année-là, l’attente a plus souvent fait gagner que perdre' : d.a30.baisse < 0.5 ? 'Sur cette année-là, l’attente a plus souvent fait perdre que gagner' : 'Sur cette année-là, l’attente a fait gagner aussi souvent que perdre'}, mais l’écart entre le meilleur et le pire cas montre surtout l’ampleur du pari. Une citerne presque vide n’attend pas : se retrouver sans chauffage pour gagner quelques centimes n’a pas de sens, et une livraison urgente laisse peu de marge pour comparer les offres.</p>
<h2>Les saisons : moins nettes qu’on le croit</h2>
<p>On entend souvent qu’il faut remplir sa citerne en été. Les ${h.src('bestatMois', 'moyennes mensuelles de Statbel')} permettent de le vérifier sur deux ans.</p>
${tableMois(h, d, 'Mois', 'Moyenne mensuelle du prix maximum du mazout sous 2 000 litres, TVA comprise, en euros par litre (be.STAT). « – » : mois hors de la période publiée.')}
<p>Sur les douze derniers mois publiés, le mois le moins cher a été ${moisAn(h, d.bas[0])} (${h.l3(d.bas[1])}) et le plus cher ${moisAn(h, d.haut[0])} (${h.l3(d.haut[1])}). L’été a coûté en moyenne ${h.l3(d.ete)} le litre et l’hiver ${h.l3(d.hiver)}. Mais d’une année à l’autre, le même mois peut changer du tout au tout : ${mois(h, `2026-${d.gap.mm}`)} est passé de ${h.l3(d.gap.a[1])} en ${d.gap.a[0].slice(0, 4)} à ${h.l3(d.gap.b[1])} en ${d.gap.b[0].slice(0, 4)}. Le prix maximum suit les cotations internationales des produits pétroliers, et ce qui s’y passe pèse davantage que la saison de chauffe en Belgique. Deux ans de données ne suffisent pas pour affirmer qu’un mois est structurellement moins cher qu’un autre.</p>
<h2>Les moyennes annuelles</h2>
${h.table(['Année', 'Prix maximum moyen', 'Coût de 1 500 litres'], d.y.map(([a, p]) => [a, h.l3(p), h.eur(p * 1500)]), 'Moyennes annuelles du prix maximum du mazout sous 2 000 litres publiées par Statbel (be.STAT) ; l’année en cours est partielle.', ['l', 'r', 'r'])}
<p>Les ${h.src('bestatAn', 'moyennes annuelles')} rappellent que le budget d’une année dépend d’abord du niveau général des prix, sur lequel aucun ménage n’a prise. Pour chiffrer votre propre consommation, la page ${h.a('budget-chauffage', 'budget chauffage au mazout')} applique ces moyennes à vos litres.</p>
<h2>Le jour de la semaine</h2>
<p>Le tarif change souvent, mais pas n’importe quand. Sur un an, ${h.pct(1 - h.M.changeStats(K, 0).prob, 0)} des dimanches et ${h.pct(1 - h.M.changeStats(K, 1).prob, 0)} des lundis ont gardé le prix de la veille. Le reste de la semaine, un nouveau tarif est la règle plutôt que l’exception ; le guide du ${h.a('contrat-programme', 'contrat-programme')} en donne le décompte complet. Ce rythme ne dit pas si le prochain changement sera une hausse ou une baisse, et il ne permet donc pas de choisir un jour gagnant à coup sûr.</p>
<h2>Le volume compte plus que la date</h2>
<p>Contrairement au marché, le palier de volume est un levier que vous contrôlez. Le ${h.date(h.today)}, le litre livré à partir de 2 000 litres plafonne à ${h.l3(d.ge)}, contre ${h.l3(d.now)} en dessous. Commander 2 000 litres en une fois plutôt qu’en deux livraisons de 1 000 litres réduit le maximum facturable de ${h.eur(d.deux)}. Ce calcul suppose une citerne assez grande ; la page ${h.a('mazout-2000-litres', 'mazout 2 000 litres')} indique à partir de quel volume il vaut la peine de compléter jusqu’au seuil.</p>
<h2>Le calendrier de l’aide</h2>
<p>Pour les ménages qui peuvent prétendre à l’allocation du Fonds Social Chauffage, le moment de la livraison a deux effets. L’aide est plafonnée par année civile, si bien qu’une livraison de janvier compte pour la nouvelle année. Et la demande doit être introduite auprès de la cellule énergie du CPAS de la commune dans les ${h.num(h.P.fonds.delai_jours)} jours suivant la livraison, avec le formulaire, une copie de la facture et de la carte d’identité, selon la page ${h.src('fondsDemande', 'comment demander')} du Fonds. Le montant se calcule sur la page ${h.a('allocation-chauffage', 'allocation chauffage')}.</p>
<h2>Ce que les données ne disent pas</h2>
<p>Elles ne disent pas où ira le prix demain, ni la semaine prochaine. Elles ne disent pas non plus ce que facturera votre négociant, qui peut descendre sous le plafond. Ce qu’elles permettent, c’est de mettre des chiffres sur une décision : le prix du jour face à l’année écoulée, le coût réel d’une attente passée, l’écart entre les deux paliers. Avant de commander, un coup d’œil au ${h.a('mazout-demain', 'prix du mazout de demain')} indique si un nouveau tarif est déjà publié.</p>`;
    },
  },
  nl: {
    slug: 'wanneer-mazout-bestellen',
    nav: 'Wanneer mazout bestellen',
    card: 'Wat de geschiedenis echt zegt over het juiste moment, het volume en de seizoenen.',
    title: 'Mazout bestellen in 2026: moment, volume en seizoenen',
    description: 'Mazout bestellen op het juiste moment: wat een jaar maximumprijzen, de maandgemiddelden, het effect van wachten en de schijf vanaf 2.000 liter laten zien.',
    h1: 'Wanneer mazout bestellen? Wat de cijfers zeggen',
    intro: 'Geen marktvoorspelling hier: de officiële geschiedenis, wat ze laat zien en wat je er niet uit kunt afleiden.',
    resume: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `Niemand kent de maximumprijs van mazout over een maand, en de officiële geschiedenis voorspelt hem niet. Ze laat wel toe te meten wat keuzes uit het verleden zouden hebben opgeleverd. Op ${h.date(h.today)} ligt het plafond voor een liter geleverd onder 2.000 liter op ${h.l3(d.now)}, ${pos > 0 ? 'boven' : pos < 0 ? 'onder' : 'op het niveau van'} het gemiddelde van de laatste 365 dagen (${h.l3(d.r.mean)}), binnen een vork van ${h.l3(d.r.min[1])} tot ${h.l3(d.r.max[1])}. In datzelfde jaar verlaagde 30 dagen wachten met bestellen de factuur in ${h.pct(d.a30.baisse, 0)} van de gevallen; op 1.500 liter was het gemiddelde effect van dat wachten ${se(h, d.a30.mean * 1500)}. De maandgemiddelden van Statbel tonen geen betrouwbaar seizoenspatroon: dezelfde maand ${mois(h, `2026-${d.gap.mm}`)} kostte ${h.l3(d.gap.a[1])} in ${d.gap.a[0].slice(0, 4)} en ${h.l3(d.gap.b[1])} in ${d.gap.b[0].slice(0, 4)}. De zekerste hefboom blijft het volume: naar 2.000 liter gaan verandert de literprijs met ${h.cts(d.ge - d.now)}.`;
    },
    faqs: (h) => {
      const d = D(h);
      const s = signe(d.ete - d.hiver);
      return [
        { q: 'Was mazout de voorbije twaalf maanden goedkoper in de zomer dan in de winter?', a: `Over de laatste twaalf maanden die Statbel publiceerde, is het gemiddelde van de zomermaanden (juni tot augustus) ${h.l3(d.ete)} per liter, tegenover ${h.l3(d.hiver)} voor de winter (december tot februari): de zomer was dus ${s < 0 ? 'goedkoper' : s > 0 ? 'duurder' : 'even duur'}. Eén jaar maakt geen regel, en de prijs volgt de internationale markten veel meer dan de Belgische thermometer.` },
        { q: 'Heeft een maand wachten met bestellen de mazoutfactuur vaak verlaagd?', a: `Van de ${h.num(d.a30.count)} periodes van 30 dagen in het voorbije jaar verlaagde wachten de prijs in ${h.pct(d.a30.baisse, 0)} van de gevallen. Voor 1.500 liter leverde het beste geval ${h.eur(-d.a30.mieux * 1500)} winst op en kostte het slechtste ${h.eur(d.a30.pire * 1500)} meer. Die cijfers beschrijven het recente verleden; over de komende maand zeggen ze niets.` },
        { q: 'Kosten twee leveringen van 1.000 liter meer dan één levering van 2.000 liter?', a: `Ja, tegen het tarief van ${h.date(h.today)}: twee leveringen van 1.000 liter worden aan maximaal ${h.l3(d.now)} per liter gefactureerd, een levering van 2.000 liter aan maximaal ${h.l3(d.ge)}. Het verschil bedraagt ${h.eur(d.deux)} op de 2.000 liter, op voorwaarde dat de tank dat volume in één keer aankan en de handelaar in beide gevallen het volle tarief toepast.` },
        { q: 'Maakt bestellen in december of januari verschil voor de steun van het Verwarmingsfonds?', a: `Dat kan meetellen. Het Sociaal Verwarmingsfonds beperkt de steun tot ${h.num(h.P.fonds.litres_max_an)} liter per gezin en per kalenderjaar: een levering begin januari valt onder het quotum van het nieuwe jaar. De aanvraag gebeurt bij het OCMW van de gemeente binnen ${h.num(h.P.fonds.delai_jours)} dagen na de levering, met de factuur en een kopie van de identiteitskaart.` },
        { q: 'Volstaat een schatting van de prijs van morgen om vandaag te beslissen?', a: 'Ze geeft een grootteorde, geen zekerheid. Is het tarief van morgen al gepubliceerd, dan toont de pagina met de prijs van morgen het en is de vraag beantwoord. Anders steunt de schatting op het laatst gepubliceerde tarief en op de vroegere schommelingen van dezelfde weekdag; een plotse beweging op de markten ziet ze niet aankomen.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `
<h2>Wat de laatste 365 dagen laten zien</h2>
<p>De maximumprijs van mazout bij levering onder 2.000 liter bedraagt ${h.l3(d.now)} op ${h.date(h.today)}. Over een jaar zakte hij tot ${h.l3(d.r.min[1])} op ${h.date(d.r.min[0])} en klom hij tot ${h.l3(d.r.max[1])} op ${h.date(d.r.max[0])}, met een gemiddelde van ${h.l3(d.r.mean)}. De prijs van vandaag ligt dus ${pos > 0 ? `${h.cts(pos).replace(/^[+−]/, '')} boven` : pos < 0 ? `${h.cts(-pos).replace(/^[+−]/, '')} onder` : 'precies op'} dat gemiddelde. ${d.e30 != null ? `Over 30 dagen bedraagt de wijziging ${h.cts(d.e30)} per liter.` : ''} De volledige curve en de prijs op elke datum vindt u op de pagina ${h.a('historique-mazout', 'evolutie van de mazoutprijs')}.</p>
<p>Die cijfers komen uit de officiële reeks die Statbel op ${h.src('bestatJour', 'be.STAT')} publiceert. Ze beschrijven wat geweest is, meer niet: weten dat de prijs boven zijn gemiddelde ligt, betekent niet dat hij zal dalen.</p>
<h2>Wachten: wat het echt opleverde</h2>
<p>De meest voorkomende reflex is wachten op een daling. De kleine rekentool bovenaan maakt de rekening voor uw volume; de tabel hieronder doet het voor 1.500 liter, door elke dag van het jaar te vergelijken met de prijs 7 en 30 dagen later.</p>
${tableAttente(h, d, ['Wachttijd', 'Gevallen met lagere factuur', 'Gemiddeld effect', 'Slechtste geval', 'Beste geval'], (n) => `${h.num(n)} dagen`, 'Effect van wachten op een bestelling van 1.500 liter tegen de maximumprijs onder 2.000 liter, over de laatste 365 dagen.')}
<p>${d.a30.baisse > 0.5 ? 'In dat jaar leverde wachten vaker winst dan verlies op' : d.a30.baisse < 0.5 ? 'In dat jaar leverde wachten vaker verlies dan winst op' : 'In dat jaar leverde wachten even vaak winst als verlies op'}, maar het verschil tussen het beste en het slechtste geval toont vooral hoe groot de gok is. Een bijna lege tank wacht niet: zonder verwarming vallen om enkele centen te winnen heeft geen zin, en een dringende levering laat weinig ruimte om offertes te vergelijken.</p>
<h2>De seizoenen: minder duidelijk dan gedacht</h2>
<p>Vaak hoor je dat je je tank in de zomer moet vullen. Met de ${h.src('bestatMois', 'maandgemiddelden van Statbel')} kun je dat over twee jaar nagaan.</p>
${tableMois(h, d, 'Maand', 'Maandgemiddelde van de maximumprijs van mazout onder 2.000 liter, incl. btw, in euro per liter (be.STAT). « – »: maand buiten de gepubliceerde periode.')}
<p>Over de laatste twaalf gepubliceerde maanden was ${moisAn(h, d.bas[0])} de goedkoopste maand (${h.l3(d.bas[1])}) en ${moisAn(h, d.haut[0])} de duurste (${h.l3(d.haut[1])}). De zomer kostte gemiddeld ${h.l3(d.ete)} per liter en de winter ${h.l3(d.hiver)}. Maar van jaar tot jaar kan dezelfde maand helemaal anders uitvallen: ${mois(h, `2026-${d.gap.mm}`)} ging van ${h.l3(d.gap.a[1])} in ${d.gap.a[0].slice(0, 4)} naar ${h.l3(d.gap.b[1])} in ${d.gap.b[0].slice(0, 4)}. De maximumprijs volgt de internationale noteringen van aardolieproducten, en wat daar gebeurt weegt zwaarder dan het stookseizoen in België. Twee jaar gegevens volstaan niet om te stellen dat een maand structureel goedkoper is dan een andere.</p>
<h2>De jaargemiddelden</h2>
${h.table(['Jaar', 'Gemiddelde maximumprijs', 'Kost van 1.500 liter'], d.y.map(([a, p]) => [a, h.l3(p), h.eur(p * 1500)]), 'Jaargemiddelden van de maximumprijs van mazout onder 2.000 liter, gepubliceerd door Statbel (be.STAT); het lopende jaar is onvolledig.', ['l', 'r', 'r'])}
<p>De ${h.src('bestatAn', 'jaargemiddelden')} herinneren eraan dat het budget van een jaar vooral afhangt van het algemene prijsniveau, waarop geen gezin vat heeft. Om uw eigen verbruik door te rekenen, past de pagina ${h.a('budget-chauffage', 'stookbudget mazout')} die gemiddelden toe op uw liters.</p>
<h2>De dag van de week</h2>
<p>Het tarief verandert vaak, maar niet op elk moment. Over een jaar behielden ${h.pct(1 - h.M.changeStats(K, 0).prob, 0)} van de zondagen en ${h.pct(1 - h.M.changeStats(K, 1).prob, 0)} van de maandagen de prijs van de dag ervoor. De rest van de week is een nieuw tarief eerder regel dan uitzondering; de gids over de ${h.a('contrat-programme', 'programmaovereenkomst')} geeft de volledige telling. Dat ritme zegt niet of de volgende wijziging een stijging of een daling wordt, en laat dus niet toe met zekerheid een winnende dag te kiezen.</p>
<h2>Het volume telt meer dan de datum</h2>
<p>Anders dan de markt is de volumeschijf een hefboom die u zelf in handen hebt. Op ${h.date(h.today)} ligt het plafond voor een liter geleverd vanaf 2.000 liter op ${h.l3(d.ge)}, tegenover ${h.l3(d.now)} daaronder. 2.000 liter in één keer bestellen in plaats van in twee leveringen van 1.000 liter verlaagt het maximaal factureerbare bedrag met ${h.eur(d.deux)}. Die berekening veronderstelt een tank die groot genoeg is; de pagina ${h.a('mazout-2000-litres', 'mazout 2.000 liter')} geeft aan vanaf welk volume aanvullen tot de drempel de moeite loont.</p>
<h2>De kalender van de steun</h2>
<p>Voor gezinnen die aanspraak kunnen maken op de toelage van het Sociaal Verwarmingsfonds heeft het moment van levering twee gevolgen. De steun is per kalenderjaar beperkt, zodat een levering in januari meetelt voor het nieuwe jaar. En de aanvraag moet bij de energiecel van het OCMW van de gemeente binnen ${h.num(h.P.fonds.delai_jours)} dagen na de levering gebeuren, met het formulier en een kopie van de factuur en van de identiteitskaart, volgens de pagina ${h.src('fondsDemande', 'toelage aanvragen')} van het Fonds. Het bedrag berekent u op de pagina ${h.a('allocation-chauffage', 'verwarmingstoelage')}.</p>
<h2>Wat de cijfers niet zeggen</h2>
<p>Ze zeggen niet waar de prijs morgen of volgende week heen gaat. Ze zeggen ook niet wat uw handelaar zal aanrekenen, want hij mag onder het plafond blijven. Wat ze wel doen, is cijfers op een beslissing plakken: de prijs van vandaag tegenover het voorbije jaar, de echte kost van vroeger wachten, het verschil tussen de twee schijven. Een blik op de ${h.a('mazout-demain', 'mazoutprijs van morgen')} vóór u bestelt, toont of er al een nieuw tarief gepubliceerd is.</p>`;
    },
  },
  en: {
    slug: 'when-to-order-heating-oil',
    nav: 'When to order heating oil',
    card: 'What the price history really says about timing, volume and seasons.',
    title: 'Ordering heating oil in 2026: timing, volume and seasons',
    description: 'Ordering heating oil at the right time in Belgium: what a year of maximum prices, the monthly averages, the effect of waiting and the 2,000-litre band show.',
    h1: 'When to order heating oil: what the data say',
    intro: 'No market forecast here: the official history, what it shows and what it does not allow you to conclude.',
    resume: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `Nobody knows what the maximum price of heating oil will be in a month, and the official history does not predict it. What it can do is measure how past choices would have turned out. On ${h.date(h.today)} a litre delivered in orders under 2,000 litres is capped at ${h.l3(d.now)}, ${pos > 0 ? 'above' : pos < 0 ? 'below' : 'level with'} its average over the last 365 days (${h.l3(d.r.mean)}), within a range of ${h.l3(d.r.min[1])} to ${h.l3(d.r.max[1])}. Over that year, waiting 30 days before ordering lowered the bill in ${h.pct(d.a30.baisse, 0)} of cases; on 1,500 litres the average effect of that wait was ${se(h, d.a30.mean * 1500)}. Statbel’s monthly averages show no reliable seasonal pattern: the same month of ${mois(h, `2026-${d.gap.mm}`)} cost ${h.l3(d.gap.a[1])} in ${d.gap.a[0].slice(0, 4)} and ${h.l3(d.gap.b[1])} in ${d.gap.b[0].slice(0, 4)}. The surest lever is volume: moving up to 2,000 litres changes the price per litre by ${h.cts(d.ge - d.now)}.`;
    },
    faqs: (h) => {
      const d = D(h);
      const s = signe(d.ete - d.hiver);
      return [
        { q: 'Was heating oil cheaper in summer than in winter over the last twelve months?', a: `Over the last twelve months published by Statbel, the summer months (June to August) averaged ${h.l3(d.ete)} a litre, against ${h.l3(d.hiver)} for winter (December to February): summer was therefore ${s < 0 ? 'cheaper' : s > 0 ? 'dearer' : 'level'}. One year does not make a rule, and the price follows international markets far more than the Belgian thermometer.` },
        { q: 'Did waiting a month before ordering heating oil often lower the bill?', a: `Of the ${h.num(d.a30.count)} thirty-day periods observed over the year, waiting lowered the price in ${h.pct(d.a30.baisse, 0)} of cases. For 1,500 litres, the best case saved ${h.eur(-d.a30.mieux * 1500)} and the worst cost ${h.eur(d.a30.pire * 1500)} more. These figures describe the recent past; they say nothing about the month ahead.` },
        { q: 'Do two 1,000-litre deliveries cost more than a single 2,000-litre one?', a: `Yes, at the tariff of ${h.date(h.today)}: two 1,000-litre deliveries are billed at a maximum of ${h.l3(d.now)} a litre, one 2,000-litre delivery at a maximum of ${h.l3(d.ge)}. The gap comes to ${h.eur(d.deux)} on the 2,000 litres, provided the tank can take that volume in one go and the dealer charges the full tariff in both cases.` },
        { q: 'Does ordering in December or January affect the Social Heating Fund allowance?', a: `It can matter. The Social Heating Fund caps support at ${h.num(h.P.fonds.litres_max_an)} litres per household per calendar year, so a delivery in early January counts towards the new year’s quota. You apply at the CPAS/OCMW, the municipal social welfare centre, within ${h.num(h.P.fonds.delai_jours)} days of delivery, bringing the invoice and a copy of your identity card.` },
        { q: 'Is an estimate of tomorrow’s price enough to decide on ordering today?', a: 'It gives an order of magnitude, not a certainty. When tomorrow’s tariff is already published, the tomorrow’s price page shows it and the question is settled. Otherwise the estimate rests on the last published tariff and on past changes for the same weekday; it cannot see a sudden market move coming.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const pos = d.now - d.r.mean;
      return `
<h2>What the last 365 days show</h2>
<p>The maximum price of heating oil delivered in orders under 2,000 litres is ${h.l3(d.now)} on ${h.date(h.today)}. Over a year it fell as low as ${h.l3(d.r.min[1])} on ${h.date(d.r.min[0])} and rose as high as ${h.l3(d.r.max[1])} on ${h.date(d.r.max[0])}, for an average of ${h.l3(d.r.mean)}. Today’s price therefore stands ${pos > 0 ? `${h.cts(pos).replace(/^[+−]/, '')} above` : pos < 0 ? `${h.cts(-pos).replace(/^[+−]/, '')} below` : 'exactly at'} that average. ${d.e30 != null ? `Over 30 days the change is ${h.cts(d.e30)} a litre.` : ''} The full curve and the price on any date are on the ${h.a('historique-mazout', 'heating oil price history')} page.</p>
<p>These figures come from the official series published by Statbel on ${h.src('bestatJour', 'be.STAT')}. They describe what has been, nothing more: knowing the price is above its average does not mean it will come down.</p>
<h2>Waiting: what it actually did</h2>
<p>The most common instinct is to wait for a fall. The small calculator at the top does the sum for your own volume; the table below does it for 1,500 litres, comparing every day of the year with the price 7 and 30 days later.</p>
${tableAttente(h, d, ['Wait', 'Cases where the bill fell', 'Average effect', 'Worst case', 'Best case'], (n) => `${h.num(n)} days`, 'Effect of waiting on a 1,500-litre order at the maximum price under 2,000 litres, over the last 365 days.')}
<p>${d.a30.baisse > 0.5 ? 'In that year, waiting gained more often than it lost' : d.a30.baisse < 0.5 ? 'In that year, waiting lost more often than it gained' : 'In that year, waiting gained as often as it lost'}, but the gap between the best and worst cases mostly shows how big the gamble is. A nearly empty tank cannot wait: going without heating to save a few cents makes no sense, and an urgent delivery leaves little room to compare offers.</p>
<h2>The seasons: less clear-cut than people think</h2>
<p>You often hear that the tank should be filled in summer. ${h.src('bestatMois', 'Statbel’s monthly averages')} make it possible to check this over two years.</p>
${tableMois(h, d, 'Month', 'Monthly average of the maximum price of heating oil under 2,000 litres, VAT included, in euros per litre (be.STAT). “–”: month outside the published period.')}
<p>Over the last twelve published months, the cheapest month was ${moisAn(h, d.bas[0])} (${h.l3(d.bas[1])}) and the dearest ${moisAn(h, d.haut[0])} (${h.l3(d.haut[1])}). Summer averaged ${h.l3(d.ete)} a litre and winter ${h.l3(d.hiver)}. Yet from one year to the next the same month can turn out completely differently: ${mois(h, `2026-${d.gap.mm}`)} went from ${h.l3(d.gap.a[1])} in ${d.gap.a[0].slice(0, 4)} to ${h.l3(d.gap.b[1])} in ${d.gap.b[0].slice(0, 4)}. The maximum price follows international quotations for petroleum products, and what happens there weighs more than the Belgian heating season. Two years of data are not enough to claim that one month is structurally cheaper than another.</p>
<h2>Yearly averages</h2>
${h.table(['Year', 'Average maximum price', 'Cost of 1,500 litres'], d.y.map(([a, p]) => [a, h.l3(p), h.eur(p * 1500)]), 'Yearly averages of the maximum price of heating oil under 2,000 litres published by Statbel (be.STAT); the current year is partial.', ['l', 'r', 'r'])}
<p>The ${h.src('bestatAn', 'yearly averages')} are a reminder that a year’s budget depends first on the general price level, which no household controls. To price your own consumption, the ${h.a('budget-chauffage', 'heating oil budget')} page applies these averages to your litres.</p>
<h2>The day of the week</h2>
<p>The tariff changes often, but not at any time. Over a year, ${h.pct(1 - h.M.changeStats(K, 0).prob, 0)} of Sundays and ${h.pct(1 - h.M.changeStats(K, 1).prob, 0)} of Mondays kept the previous day’s price. For the rest of the week a new tariff is the rule rather than the exception; the guide to the ${h.a('contrat-programme', 'programme contract')} gives the full count. This rhythm does not say whether the next change will be a rise or a fall, so it cannot be used to pick a sure winning day.</p>
<h2>Volume matters more than the date</h2>
<p>Unlike the market, the volume band is a lever you control. On ${h.date(h.today)} a litre delivered in orders of 2,000 litres or more is capped at ${h.l3(d.ge)}, against ${h.l3(d.now)} below that. Ordering 2,000 litres at once rather than in two 1,000-litre deliveries cuts the maximum that can be billed by ${h.eur(d.deux)}. The calculation assumes a tank that is large enough; the ${h.a('mazout-2000-litres', 'heating oil 2,000 litres')} page shows from what volume it is worth topping up to the threshold.</p>
<h2>The allowance calendar</h2>
<p>For households that may qualify for the Social Heating Fund allowance, the timing of delivery has two effects. Support is capped per calendar year, so a January delivery counts towards the new year. And the application must reach the energy unit of the municipal CPAS/OCMW within ${h.num(h.P.fonds.delai_jours)} days of delivery, with the form and copies of the invoice and identity card, according to the Fund’s ${h.src('fondsDemande', 'how to apply')} page. The amount is worked out on the ${h.a('allocation-chauffage', 'heating allowance')} page.</p>
<h2>What the data do not say</h2>
<p>They do not say where the price will go tomorrow or next week. Nor do they say what your dealer will charge, since dealers may stay below the cap. What they do is put numbers on a decision: today’s price against the past year, the real cost of past waiting, the gap between the two bands. Before ordering, a look at ${h.a('mazout-demain', 'tomorrow’s heating oil price')} shows whether a new tariff has already been published.</p>`;
    },
  },
});
