import { defineGuide, type Helpers } from '../../lib/guide-types';

const LT = 'mazout_lt2000' as const;

/** Variation entre le premier des 365 derniers jours publiés et le jour de référence (même fenêtre que l'outil). */
const evoAn = (h: Helpers, k: Parameters<Helpers['M']['series']>[0]) => {
  const s = h.M.series(k).filter((p) => p[0] <= h.today).slice(-365);
  return s.length > 1 ? Math.round((s[s.length - 1][1] - s[0][1]) * 10000) / 10000 : null;
};
/** Repères calculés sur la série : extrêmes d'un an, plus forte hausse et plus forte baisse d'un jour, plus gros écart entre deux mois. */
const reperes = (h: Helpers) => {
  const r = h.M.range(LT, 365, h.today);
  const ch = h.M.changes(LT).filter((c) => c.day <= h.today);
  const up = ch.reduce((a, c) => (c.delta > a.delta ? c : a), ch[0]);
  const dn = ch.reduce((a, c) => (c.delta < a.delta ? c : a), ch[0]);
  const mo = h.M.monthly(LT);
  let saut = { from: mo[0][0], to: mo[0][0], d: 0 };
  for (let i = 1; i < mo.length; i++) { const d = mo[i][1] - mo[i - 1][1]; if (Math.abs(d) > Math.abs(saut.d)) saut = { from: mo[i - 1][0], to: mo[i][0], d }; }
  const an = evoAn(h, LT);
  const ans = h.M.yearly(LT);
  return { r, up, dn, saut, an, mo, ans, now: h.M.priceOn(LT, h.today)! };
};
/** « 2026-03 » → « mars 2026 » dans la langue de la page. */
const mois = (h: Helpers, ym: string) => new Date(`${ym}-15T12:00:00Z`).toLocaleDateString(h.T('fr-BE', 'nl-BE', 'en-GB'), { month: 'long', year: 'numeric', timeZone: 'UTC' });
const tableProduits = (h: Helpers) => h.M.FAMILLE.chauffage.map((k) => {
  const r = h.M.range(k, 365, h.today), e = evoAn(h, k);
  return [h.M.NOM[k][h.lang], h.l3(h.M.priceOn(k, h.today)!), `${h.l3(r.min[1])} (${h.date(r.min[0])})`, `${h.l3(r.max[1])} (${h.date(r.max[0])})`, e == null ? '–' : h.cts(e)];
});
const tableAns = (h: Helpers) => {
  const keys = ['mazout_lt2000', 'mazout_ge2000', 'mazout_pompe'] as const;
  return h.M.yearly(LT).map(([y]) => [y, ...keys.map((k) => { const p = h.M.yearly(k).find((x) => x[0] === y); return p ? h.l3(p[1]) : '–'; })]);
};

export default defineGuide({
  id: 'historique-mazout',
  group: 'mazout',
  order: 3,
  tool: 'historique',
  toolArg: 'chauffage',
  related: ['quand-commander-mazout', 'mazout-demain', 'budget-chauffage', 'historique-carburants'],
  sources: ['bestatJour', 'bestatMois', 'bestatAn', 'fondsPrix', 'statbelLicence'],
  fr: {
    slug: 'historique-prix-mazout',
    nav: 'Historique du prix du mazout',
    card: 'La courbe d’un an du prix maximum, les extrêmes et les moyennes annuelles depuis 2024.',
    title: 'Historique prix mazout : courbe d’un an et moyennes 2026',
    description: 'Historique du prix maximum du mazout en Belgique : courbe de 30 jours à un an, plus bas et plus haut datés, moyennes mensuelles et annuelles, année 2026.',
    h1: 'Historique du prix du mazout',
    intro: 'Le prix maximum officiel du mazout et des autres combustibles de chauffage jour par jour sur un an, avec les extrêmes, la moyenne et l’écart chiffré sur votre volume.',
    resume: (h) => {
      const { r, an, ans, now } = reperes(h);
      const y = ans[ans.length - 1], y0 = ans[ans.length - 2];
      return `Sur les 365 derniers jours publiés par Statbel, le prix maximum du mazout de chauffage livré en moins de 2 000 litres est descendu au plus bas à ${h.l3(r.min[1])} le litre, le ${h.date(r.min[0])}, et monté au plus haut à ${h.l3(r.max[1])}, le ${h.date(r.max[0])}, pour une moyenne de ${h.l3(r.mean)} TVA comprise. Le ${h.date(h.today)}, il vaut ${h.l3(now)}${an == null ? '' : `, soit ${an > 0 ? 'une hausse' : an < 0 ? 'une baisse' : 'aucun changement'} de ${h.cts(an).replace(/^[+−]/, '')} par litre en un an`}. ${y && y0 ? `La moyenne officielle de ${y[0]} à ce jour est de ${h.l3(y[1])}, contre ${h.l3(y0[1])} pour ${y0[0]}.` : ''} Pour une livraison de 1 500 litres, l’écart entre le jour le moins cher et le plus cher de l’année atteint ${h.eur((r.max[1] - r.min[1]) * 1500)}. L’outil trace la courbe sur 30 jours, trois mois, six mois ou un an, pour le mazout aux deux paliers de livraison, à la pompe, ainsi que pour le pétrole lampant et le propane en vrac, et chiffre la variation sur le volume que vous indiquez.`;
    },
    faqs: (h) => {
      const { up, dn, saut } = reperes(h);
      return [
        { q: 'Quelle a été la plus forte hausse du mazout en un seul jour cette année ?', a: `Sur la série d’un an, la plus forte hausse d’un jour à l’autre est celle du ${h.date(up.day)} : ${h.cts(up.delta)} par litre sous 2 000 litres. La plus forte baisse date du ${h.date(dn.day)}, à ${h.cts(dn.delta)}. Sur 1 500 litres, ces deux journées représentent respectivement ${h.eur(Math.abs(up.delta) * 1500)} et ${h.eur(Math.abs(dn.delta) * 1500)} d’écart sur le montant maximum.` },
        { q: 'Les moyennes mensuelles de Statbel sont-elles celles du prix que j’ai payé ?', a: 'Non. Statbel publie la moyenne du prix maximum officiel sur le mois, pas une moyenne des factures réelles. Les négociants vendent souvent sous ce plafond, avec des remises qui varient selon le volume et la période. Les moyennes servent donc de repère sur le niveau du tarif, pas de mesure de ce que les ménages ont réellement déboursé.' },
        { q: 'Pourquoi l’historique du mazout ne remonte-t-il pas avant 2024 sur cette page ?', a: `Parce que le gasoil de chauffage 50S a disparu le 1er avril 2024, remplacé par les qualités H0 et H7. La série que publie Statbel pour le produit actuel commence donc après ce changement, et les moyennes annuelles affichées partent de ${h.M.yearly(LT)[0][0]}. Comparer avec les années du 50S mélangerait deux produits différents.` },
        { q: 'Quel mois a connu le plus gros changement de prix moyen du mazout ?', a: `Parmi les moyennes mensuelles officielles des 24 derniers mois, l’écart le plus marqué entre deux mois consécutifs sépare ${mois(h, saut.from)} et ${mois(h, saut.to)} : ${h.cts(saut.d)} par litre en moyenne. Sur une citerne de 2 000 litres, c’est ${h.eur(Math.abs(saut.d) * 2000)} de différence sur le montant maximum d’une livraison.` },
        { q: 'Puis-je réutiliser les données de l’historique du mazout pour mon propre tableau ?', a: 'Les séries viennent de be.STAT, la base de données de Statbel, publiées en données ouvertes sous licence CC BY 4.0 : la réutilisation est permise à condition de citer Statbel comme source. Cette page n’ajoute aucune donnée propre à la série officielle ; elle la met en forme, calcule les extrêmes et les écarts, et renvoie aux tableaux d’origine.' },
      ];
    },
    body: (h) => {
      const { saut, mo } = reperes(h);
      const dernier = mo[mo.length - 1];
      return `
<h2>Lire la courbe</h2>
<p>Choisissez un produit et une période : la courbe trace le prix maximum de chaque jour, les deux lignes fines marquent le plus bas et le plus haut de la période. Le résultat donne la variation entre le premier et le dernier jour affichés, et la traduit en euros sur le volume indiqué : 1 000 litres par défaut pour une livraison de mazout, 20 litres pour un achat à la pompe. Les plus bas et plus hauts sont datés, ce qui permet de retrouver un devis ou une facture de la même semaine.</p>
<p>La courbe ne lisse rien. Les marches que l’on voit sont de vrais changements de tarif, et les paliers plats correspondent aux jours où le même prix maximum est resté en vigueur, comme souvent le week-end. Une variation forte sur trente jours peut donc disparaître sur un an, et l’inverse.</p>
<h2>Les combustibles de chauffage sur un an</h2>
${h.table(['Produit', 'Aujourd’hui', 'Plus bas (date)', 'Plus haut (date)', 'Sur un an'], tableProduits(h), `Prix maximums TVA comprise, en euros par litre, au ${h.date(h.today)}. Source : série quotidienne be.STAT.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Les six produits suivent le même mouvement de fond, avec des amplitudes différentes. Les deux paliers du mazout livré gardent un écart quasi constant entre eux ; le mazout à la pompe, vendu en petites quantités, est le plus cher des trois. Le propane en vrac et le pétrole lampant de type C ont leur propre tarif officiel, qui obéit à la même logique de prix maximum.</p>
<h2>Moyennes annuelles officielles</h2>
${h.table(['Année', '&lt; 2 000 L', '≥ 2 000 L', 'Pompe'], tableAns(h), 'Moyennes annuelles du prix maximum, TVA comprise ; l’année en cours est incomplète.', ['l', 'r', 'r', 'r'])}
<p>Ces moyennes sont celles que Statbel calcule dans ses ${h.src('bestatAn', 'tableaux annuels')} et ses ${h.src('bestatMois', 'moyennes mensuelles')}. La dernière moyenne mensuelle complète, celle de ${mois(h, dernier[0])}, s’établit à ${h.l3(dernier[1])} sous 2 000 litres. Sur 24 mois, le plus gros écart d’un mois à l’autre sépare ${mois(h, saut.from)} et ${mois(h, saut.to)}, avec ${h.cts(saut.d)} par litre : un rappel que le niveau du mazout peut changer nettement en quelques semaines.</p>
<h2>Ce que l’historique permet de vérifier</h2>
<p>L’historique sert d’abord à contrôler une facture passée. Le prix maximum d’un jour reste le plafond légal de ce jour-là, et ${h.src('fondsPrix', 'le Fonds Social Chauffage rappelle')} qu’aucune vente ne peut le dépasser. Si vous retrouvez sur la courbe le jour de votre livraison et que le prix facturé dépasse le maximum de ce jour au palier qui correspond à votre volume, la question mérite d’être posée au négociant.</p>
<p>Il sert ensuite à remettre un prix du jour en perspective, sans en tirer une prévision. Le guide ${h.a('quand-commander-mazout', 'quand commander son mazout')} examine ce que les mois passés disent, et surtout ce qu’ils ne disent pas, du bon moment pour commander. Pour les carburants routiers, l’${h.a('historique-carburants', 'historique des carburants')} applique le même outil au diesel, à l’essence et au LPG.</p>
<p>Les données viennent de la ${h.src('bestatJour', 'série quotidienne be.STAT')}, en données ouvertes de Statbel. La page est reconstruite quand une nouvelle ligne y est publiée ; le dernier jour couvert est le ${h.date(h.M.LAST_DAY)}.</p>`;
    },
  },
  nl: {
    slug: 'mazoutprijs-evolutie',
    nav: 'Evolutie van de mazoutprijs',
    card: 'De curve van een jaar maximumprijs, de uitersten en de jaargemiddelden sinds 2024.',
    title: 'Mazoutprijs evolutie: curve over een jaar, gemiddelden 2026',
    description: 'Evolutie van de maximumprijs van mazout in België: curve van 30 dagen tot een jaar, laagste en hoogste prijs met datum, maand- en jaargemiddelden, 2026.',
    h1: 'Evolutie van de mazoutprijs',
    intro: 'De officiële maximumprijs van mazout en de andere brandstoffen voor verwarming dag per dag over een jaar, met de uitersten, het gemiddelde en het verschil op uw volume.',
    resume: (h) => {
      const { r, an, ans, now } = reperes(h);
      const y = ans[ans.length - 1], y0 = ans[ans.length - 2];
      return `Over de laatste 365 dagen die Statbel publiceerde, zakte de maximumprijs van mazout bij levering van minder dan 2.000 liter tot ${h.l3(r.min[1])} per liter, op ${h.date(r.min[0])}, en klom hij tot ${h.l3(r.max[1])}, op ${h.date(r.max[0])}, met een gemiddelde van ${h.l3(r.mean)} inclusief btw. Op ${h.date(h.today)} bedraagt hij ${h.l3(now)}${an == null ? '' : `, ${an > 0 ? 'een stijging' : an < 0 ? 'een daling' : 'geen verandering'} van ${h.cts(an).replace(/^[+−]/, '')} per liter in een jaar`}. ${y && y0 ? `Het officiële gemiddelde van ${y[0]} tot nu is ${h.l3(y[1])}, tegenover ${h.l3(y0[1])} in ${y0[0]}.` : ''} Bij een levering van 1.500 liter loopt het verschil tussen de goedkoopste en de duurste dag van het jaar op tot ${h.eur((r.max[1] - r.min[1]) * 1500)}. De tool tekent de curve over 30 dagen, drie maanden, zes maanden of een jaar, voor mazout in de twee leveringsschijven en aan de pomp, en ook voor lampolie en propaan in bulk, en rekent de wijziging om op het volume dat u invult.`;
    },
    faqs: (h) => {
      const { up, dn, saut } = reperes(h);
      return [
        { q: 'Wat was dit jaar de grootste stijging van de mazoutprijs op één dag?', a: `In de reeks van een jaar is de grootste stijging van de ene dag op de andere die van ${h.date(up.day)}: ${h.cts(up.delta)} per liter onder 2.000 liter. De grootste daling dateert van ${h.date(dn.day)}, met ${h.cts(dn.delta)}. Op 1.500 liter betekenen die twee dagen respectievelijk ${h.eur(Math.abs(up.delta) * 1500)} en ${h.eur(Math.abs(dn.delta) * 1500)} verschil op het maximumbedrag.` },
        { q: 'Zijn de maandgemiddelden van Statbel de prijs die ik betaald heb?', a: 'Nee. Statbel publiceert het gemiddelde van de officiële maximumprijs over de maand, geen gemiddelde van echte facturen. Handelaars verkopen vaak onder dat plafond, met kortingen die verschillen naargelang het volume en de periode. De gemiddelden zijn dus een houvast voor het niveau van het tarief, geen meting van wat gezinnen werkelijk betaalden.' },
        { q: 'Waarom gaat de evolutie van de mazoutprijs op deze pagina niet terug tot vóór 2024?', a: `Omdat gasolie verwarming 50S op 1 april 2024 verdween en werd vervangen door de kwaliteiten H0 en H7. De reeks die Statbel voor het huidige product publiceert, begint dus na die wissel, en de getoonde jaargemiddelden starten in ${h.M.yearly(LT)[0][0]}. Vergelijken met de jaren van 50S zou twee verschillende producten door elkaar halen.` },
        { q: 'In welke maand veranderde de gemiddelde mazoutprijs het sterkst?', a: `Bij de officiële maandgemiddelden van de laatste 24 maanden ligt het grootste verschil tussen twee opeenvolgende maanden tussen ${mois(h, saut.from)} en ${mois(h, saut.to)}: gemiddeld ${h.cts(saut.d)} per liter. Op een tank van 2.000 liter is dat ${h.eur(Math.abs(saut.d) * 2000)} verschil op het maximumbedrag van een levering.` },
        { q: 'Mag ik de gegevens over de evolutie van de mazoutprijs zelf hergebruiken?', a: 'De reeksen komen uit be.STAT, de databank van Statbel, als open data onder de licentie CC BY 4.0: hergebruik is toegestaan als u Statbel als bron vermeldt. Deze pagina voegt geen eigen gegevens toe aan de officiële reeks; ze zet ze in beeld, berekent de uitersten en de verschillen en verwijst naar de oorspronkelijke tabellen.' },
      ];
    },
    body: (h) => {
      const { saut, mo } = reperes(h);
      const dernier = mo[mo.length - 1];
      return `
<h2>De curve lezen</h2>
<p>Kies een product en een periode: de curve tekent de maximumprijs van elke dag, de twee dunne lijnen markeren de laagste en de hoogste prijs van de periode. Het resultaat toont de wijziging tussen de eerste en de laatste getoonde dag en zet die om in euro op het ingevulde volume: standaard 1.000 liter voor een mazoutlevering, 20 liter voor een aankoop aan de pomp. De laagste en hoogste prijs staan met hun datum, zodat u een offerte of factuur van dezelfde week kunt terugvinden.</p>
<p>De curve strijkt niets glad. De trapjes die u ziet, zijn echte tariefwijzigingen, en de vlakke stukken zijn dagen waarop dezelfde maximumprijs bleef gelden, zoals vaak in het weekend. Een sterke wijziging over dertig dagen kan dus wegvallen over een jaar, en omgekeerd.</p>
<h2>De brandstoffen voor verwarming over een jaar</h2>
${h.table(['Product', 'Vandaag', 'Laagste (datum)', 'Hoogste (datum)', 'Over een jaar'], tableProduits(h), `Maximumprijzen incl. btw, in euro per liter, op ${h.date(h.today)}. Bron: dagreeks be.STAT.`, ['l', 'r', 'r', 'r', 'r'])}
<p>De zes producten volgen dezelfde grote beweging, met verschillende uitslagen. De twee schijven van geleverde mazout houden onderling een bijna vast verschil; mazout aan de pomp, verkocht in kleine hoeveelheden, is de duurste van de drie. Propaan in bulk en lampolie type C hebben hun eigen officiële tarief, dat dezelfde logica van een maximumprijs volgt.</p>
<h2>Officiële jaargemiddelden</h2>
${h.table(['Jaar', '&lt; 2.000 l', '≥ 2.000 l', 'Pomp'], tableAns(h), 'Jaargemiddelden van de maximumprijs, incl. btw; het lopende jaar is onvolledig.', ['l', 'r', 'r', 'r'])}
<p>Deze gemiddelden berekent Statbel zelf in zijn ${h.src('bestatAn', 'jaartabellen')} en ${h.src('bestatMois', 'maandgemiddelden')}. Het laatste volledige maandgemiddelde, dat van ${mois(h, dernier[0])}, bedraagt ${h.l3(dernier[1])} onder 2.000 liter. Over 24 maanden ligt het grootste verschil van maand tot maand tussen ${mois(h, saut.from)} en ${mois(h, saut.to)}, met ${h.cts(saut.d)} per liter: een herinnering dat het niveau van mazout op enkele weken duidelijk kan veranderen.</p>
<h2>Wat u met de evolutie kunt nagaan</h2>
<p>De evolutie dient eerst om een oude factuur te controleren. De maximumprijs van een dag blijft het wettelijke plafond van die dag, en ${h.src('fondsPrix', 'het Sociaal Verwarmingsfonds herinnert eraan')} dat geen enkele verkoop erboven mag gaan. Vindt u op de curve de dag van uw levering terug en ligt de gefactureerde prijs boven het maximum van die dag in de schijf van uw volume, dan stelt u die vraag best aan de handelaar.</p>
<p>Daarna helpt ze om een prijs van vandaag in perspectief te zetten, zonder er een voorspelling uit af te leiden. De gids ${h.a('quand-commander-mazout', 'wanneer mazout bestellen')} bekijkt wat de voorbije maanden zeggen, en vooral wat ze niet zeggen, over het goede moment. Voor wegbrandstoffen past de ${h.a('historique-carburants', 'evolutie van de brandstofprijzen')} dezelfde tool toe op diesel, benzine en LPG.</p>
<p>De gegevens komen uit de ${h.src('bestatJour', 'dagreeks be.STAT')}, open data van Statbel. De pagina wordt opnieuw opgebouwd als er een nieuwe regel verschijnt; de laatst gedekte dag is ${h.date(h.M.LAST_DAY)}.</p>`;
    },
  },
  en: {
    slug: 'heating-oil-price-history',
    nav: 'Heating oil price history',
    card: 'One year of the maximum price on a curve, with highs, lows and yearly averages since 2024.',
    title: 'Heating oil price history: one-year chart and averages 2026',
    description: 'History of the heating oil maximum price in Belgium: a chart from 30 days to a year, dated lows and highs, and official monthly and yearly averages, 2026.',
    h1: 'Heating oil price history',
    intro: 'The official maximum price of heating oil and the other heating fuels, day by day over a year, with the highs and lows, the average and the gap priced on your volume.',
    resume: (h) => {
      const { r, an, ans, now } = reperes(h);
      const y = ans[ans.length - 1], y0 = ans[ans.length - 2];
      return `Over the last 365 days published by Statbel, the Belgian statistics office, the maximum price of heating oil delivered in quantities under 2,000 litres fell as low as ${h.l3(r.min[1])} a litre, on ${h.date(r.min[0])}, and rose as high as ${h.l3(r.max[1])}, on ${h.date(r.max[0])}, for an average of ${h.l3(r.mean)} including VAT. On ${h.date(h.today)} it stands at ${h.l3(now)}${an == null ? '' : `, ${an > 0 ? 'a rise' : an < 0 ? 'a fall' : 'no change'} of ${h.cts(an).replace(/^[+−]/, '')} a litre over a year`}. ${y && y0 ? `The official average for ${y[0]} so far is ${h.l3(y[1])}, against ${h.l3(y0[1])} for ${y0[0]}.` : ''} On a 1,500-litre delivery, the gap between the cheapest and the dearest day of the year comes to ${h.eur((r.max[1] - r.min[1]) * 1500)}. The tool draws the curve over 30 days, three months, six months or a year, for heating oil in both delivery bands and at the pump, and for kerosene and bulk propane too, and prices the change on the volume you enter.`;
    },
    faqs: (h) => {
      const { up, dn, saut } = reperes(h);
      return [
        { q: 'What was the biggest one-day rise in the heating oil price this year?', a: `Over the one-year series, the largest day-on-day rise came on ${h.date(up.day)}: ${h.cts(up.delta)} a litre under 2,000 litres. The largest fall was on ${h.date(dn.day)}, at ${h.cts(dn.delta)}. On 1,500 litres those two days are worth ${h.eur(Math.abs(up.delta) * 1500)} and ${h.eur(Math.abs(dn.delta) * 1500)} respectively on the maximum amount.` },
        { q: 'Are Statbel’s monthly averages the price I actually paid?', a: 'No. Statbel publishes the average of the official maximum price over the month, not an average of real invoices. Dealers often sell below that ceiling, with discounts that vary with volume and season. The averages are a guide to the level of the tariff, not a measure of what households actually spent.' },
        { q: 'Why does this heating oil price history not go back before 2024?', a: `Because heating gas oil 50S disappeared on 1 April 2024 and was replaced by the H0 and H7 grades. The series Statbel publishes for the current product therefore starts after that switch, and the yearly averages shown begin in ${h.M.yearly(LT)[0][0]}. Comparing with the 50S years would mix two different products.` },
        { q: 'Which month saw the largest change in the average heating oil price?', a: `Among the official monthly averages of the last 24 months, the sharpest gap between two consecutive months lies between ${mois(h, saut.from)} and ${mois(h, saut.to)}: ${h.cts(saut.d)} a litre on average. On a 2,000-litre tank, that is ${h.eur(Math.abs(saut.d) * 2000)} difference on the maximum amount of one delivery.` },
        { q: 'Can I reuse the heating oil price history data in my own spreadsheet?', a: 'The series come from be.STAT, Statbel’s database, released as open data under the CC BY 4.0 licence: reuse is allowed provided Statbel is credited as the source. This page adds no data of its own to the official series; it charts it, works out the highs, lows and gaps, and links back to the original tables.' },
      ];
    },
    body: (h) => {
      const { saut, mo } = reperes(h);
      const dernier = mo[mo.length - 1];
      return `
<h2>Reading the curve</h2>
<p>Pick a product and a period: the curve plots each day’s maximum price, and the two thin lines mark the period’s low and high. The result gives the change between the first and last days shown and turns it into euros on the volume entered: 1,000 litres by default for a heating oil delivery, 20 litres for a purchase at the pump. Lows and highs carry their date, so you can match them with a quote or invoice from the same week.</p>
<p>The curve smooths nothing. The steps you see are real tariff changes, and the flat stretches are days on which the same maximum price stayed in force, as often happens over the weekend. A sharp move over thirty days can therefore vanish over a year, and the other way round.</p>
<h2>Heating fuels over a year</h2>
${h.table(['Product', 'Today', 'Low (date)', 'High (date)', 'Over a year'], tableProduits(h), `Maximum prices including VAT, in euros per litre, on ${h.date(h.today)}. Source: be.STAT daily series.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The six products share the same underlying movement, with different swings. The two bands of delivered heating oil keep an almost constant gap between them; heating oil at the pump, sold in small quantities, is the dearest of the three. Bulk propane and type C kerosene have their own official tariff, built on the same maximum-price logic.</p>
<h2>Official yearly averages</h2>
${h.table(['Year', '&lt; 2,000 L', '≥ 2,000 L', 'Pump'], tableAns(h), 'Yearly averages of the maximum price, including VAT; the current year is incomplete.', ['l', 'r', 'r', 'r'])}
<p>These averages are the ones Statbel itself computes in its ${h.src('bestatAn', 'yearly tables')} and ${h.src('bestatMois', 'monthly averages')}. The latest complete monthly average, for ${mois(h, dernier[0])}, is ${h.l3(dernier[1])} under 2,000 litres. Over 24 months, the biggest month-to-month gap lies between ${mois(h, saut.from)} and ${mois(h, saut.to)}, at ${h.cts(saut.d)} a litre: a reminder that the level of heating oil can shift markedly within a few weeks.</p>
<h2>What the history lets you check</h2>
<p>The history is first a way to check a past invoice. A day’s maximum price remains the legal ceiling for that day, and ${h.src('fondsPrix', 'the Social Heating Fund points out')} that no sale may exceed it. If you find your delivery day on the curve and the price invoiced is above that day’s maximum in the band matching your volume, it is a fair question to put to the dealer.</p>
<p>It also puts today’s price in perspective, without turning it into a forecast. The guide on ${h.a('quand-commander-mazout', 'when to order heating oil')} looks at what past months say, and above all what they do not say, about the right moment to order. For road fuels, the ${h.a('historique-carburants', 'fuel price history')} applies the same tool to diesel, petrol and LPG.</p>
<p>The data come from the ${h.src('bestatJour', 'be.STAT daily series')}, Statbel open data. The page is rebuilt when a new row is published; the last day covered is ${h.date(h.M.LAST_DAY)}.</p>`;
    },
  },
});
