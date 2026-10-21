import { defineGuide, type Helpers } from '../../lib/guide-types';

const LT = 'mazout_lt2000' as const, GE = 'mazout_ge2000' as const;
const VOLUMES = [500, 1000, 1500, 1800, 1900, 1950, 2000, 2500, 3000];

const prix = (h: Helpers) => {
  const pLt = h.M.priceOn(LT, h.today)!, pGe = h.M.priceOn(GE, h.today)!;
  const s = h.M.seuil2000(1500, pLt, pGe);
  // écart entre les deux paliers sur toute la série : il bouge peu ou pas
  const ecarts = h.M.series(LT).map(([d, p]) => Math.round((p - h.M.priceOn(GE, d)!) * 1000) / 1000);
  return { pLt, pGe, s, eMin: Math.min(...ecarts), eMax: Math.max(...ecarts), jours: ecarts.length };
};
/** Montant signé avec un vrai signe moins. */
const ecartTxt = (h: Helpers, d: number) => (Math.round(d) === 0 ? h.eur(0) : `${d > 0 ? '+' : '−'}${h.eur(Math.abs(d))}`);
const lignes = (h: Helpers, pLt: number, pGe: number) => VOLUMES.map((v) => {
  const c = h.M.livraison(v, pLt, pGe);
  return [`${h.num(v)} L`, c.palier === 'ge2000' ? h.T('≥ 2 000 L', '≥ 2.000 l', '≥ 2,000 L') : h.T('&lt; 2 000 L', '&lt; 2.000 l', '&lt; 2,000 L'), h.l3(c.prix), h.eur(c.total), ecartTxt(h, h.M.livraison(h.P.seuil_litres, pLt, pGe).total - c.total)];
});

export default defineGuide({
  id: 'mazout-2000-litres',
  group: 'mazout',
  order: 2,
  tool: 'seuil',
  related: ['mazout-demain', 'budget-chauffage', 'quand-commander-mazout', 'prix-maximum'],
  sources: ['bestatJour', 'bestatDernier', 'fondsPrix'],
  fr: {
    slug: 'mazout-2000-litres',
    nav: 'Mazout : le seuil de 2 000 litres',
    card: 'Combien coûte le passage à 2 000 litres, et à partir de quel volume il devient gagnant.',
    title: 'Mazout 2 000 litres : seuil du prix maximum calculé 2026',
    description: 'Mazout à 2 000 litres ou moins : écart entre les deux paliers du prix maximum, coût des litres en plus et volume où 2 000 litres coûtent moins, en 2026.',
    h1: 'Mazout : le seuil de 2 000 litres',
    intro: 'Le tarif officiel prévoit un prix plus bas dès 2 000 litres livrés. L’outil dit ce que coûtent les litres en plus et quand la grosse commande coûte moins que la petite.',
    resume: (h) => {
      const { pLt, pGe, s, eMin, eMax } = prix(h);
      return `Le prix maximum belge du mazout de chauffage a deux paliers de livraison : moins de 2 000 litres, et 2 000 litres ou plus. Le ${h.date(h.today)}, le premier est à ${h.l3(pLt)} le litre et le second à ${h.l3(pGe)}, TVA comprise, soit ${h.cts(pLt - pGe).replace(/^[+−]/, '')} de moins par litre au palier supérieur. ${eMin === eMax ? `Sur toute la série d’un an, cet écart n’a pas bougé.` : `Sur la série d’un an, cet écart est resté compris entre ${h.cts(eMin).replace(/^[+−]/, '')} et ${h.cts(eMax).replace(/^[+−]/, '')}.`} Pour une commande prévue de 1 500 litres, monter à 2 000 litres coûte ${h.eur(s.surcout2000)} de plus au total au prix maximum, soit ${h.l3(s.coutMarginal ?? 0)} par litre supplémentaire, un peu moins que le prix du palier inférieur. Le volume qui coûte autant que 2 000 litres est de ${h.num(s.equivalent)} litres : au-delà, commander 2 000 litres revient moins cher que la commande d’origine. Le gain dépend donc surtout de la place libre dans votre citerne.`;
    },
    faqs: (h) => {
      const { pLt, pGe, s } = prix(h);
      return [
        { q: 'Le palier de 2 000 litres s’applique-t-il à tout le volume ou seulement aux litres au-delà ?', a: `À tout le volume. Le tarif officiel donne un prix maximum par litre selon le palier de la livraison : une commande de 2 000 litres se calcule entièrement à ${h.l3(pGe)} au ${h.date(h.today)}, une commande de 1 999 litres entièrement à ${h.l3(pLt)}. C’est ce saut d’un bloc qui rend le calcul du seuil utile.` },
        { q: 'Je commande 1 900 litres : est-ce que je paie plus que pour 2 000 litres ?', a: `Au prix maximum du ${h.date(h.today)}, 1 900 litres coûtent ${h.eur(h.M.livraison(1900, pLt, pGe).total)} et 2 000 litres ${h.eur(s.a2000.total)}. ${h.M.livraison(1900, pLt, pGe).total > s.a2000.total ? 'La petite commande coûte donc plus cher que la grande : si la citerne a la place, 2 000 litres sont plus avantageux.' : 'La petite commande reste donc moins chère au total, même si chaque litre y coûte plus.'} Le volume d’équilibre du jour est de ${h.num(s.equivalent)} litres ; le tableau de cette page fait la même comparaison pour d’autres volumes.` },
        { q: 'Peut-on grouper sa commande de mazout avec un voisin pour atteindre 2 000 litres ?', a: 'Le tarif officiel fixe des prix maximums par palier de livraison, sans dire comment un négociant traite plusieurs citernes livrées lors d’une même tournée. Certains proposent un prix commun pour des commandes regroupées, d’autres non. Demandez au négociant, par écrit, quel prix il applique à chaque adresse avant de vous engager.' },
        { q: 'Ma citerne de 1 500 litres m’empêche-t-elle de profiter du palier de 2 000 litres ?', a: 'Oui, pour une seule livraison : on ne peut pas faire livrer plus que la place libre dans la citerne. Le palier supérieur intéresse surtout les citernes de 3 000 litres et plus, remplies quand le niveau est assez bas. Dans le doute, faites relever le niveau par la jauge avant de commander et retirez une marge de sécurité.' },
      ];
    },
    body: (h) => {
      const { pLt, pGe, s } = prix(h);
      return `
<h2>Le coût d’une livraison selon le volume</h2>
${h.table(['Volume', 'Palier', 'Prix maximum', 'Montant', 'Écart avec 2 000 L'], lignes(h, pLt, pGe), `Prix maximums TVA comprise du ${h.date(h.today)}. La dernière colonne donne ce que coûte en plus (ou en moins) une livraison de 2 000 litres.`, ['l', 'l', 'r', 'r', 'r'])}
<p>Le tableau se lit de haut en bas : le montant grimpe avec le volume jusqu’à 2 000 litres, où le prix du litre change de palier. Juste en dessous du seuil, l’écart avec une livraison de 2 000 litres devient faible, puis négatif : vers ${h.num(s.equivalent)} litres, la grosse commande coûte autant que la petite, et au-delà elle coûte moins, tout en apportant plus de mazout.</p>
<h2>Comment l’outil fait le calcul</h2>
<p>L’outil prend les deux prix maximums du jour publiés par Statbel dans la ${h.src('bestatJour', 'série be.STAT du tarif officiel')}. Il chiffre votre commande au palier qui la concerne, puis la même commande portée à 2 000 litres au palier supérieur. La différence est le supplément à payer ; divisée par le nombre de litres ajoutés, elle donne le prix réel de chaque litre en plus. Aujourd’hui, ce litre supplémentaire vous revient à ${h.l3(s.coutMarginal ?? 0)}, contre ${h.l3(pLt)} pour un litre au palier inférieur : les litres ajoutés profitent de la remise appliquée à toute la commande.</p>
<p>Le volume d’équilibre se calcule simplement : 2 000 litres multipliés par le prix du palier supérieur, divisés par le prix du palier inférieur. Si vous comptiez commander plus que ce volume, passer à 2 000 litres coûte moins cher au total. En dessous, la grosse commande coûte plus, mais le prix de chaque litre ajouté reste plus bas que le prix du jour.</p>
<h2>Ce que le calcul ne dit pas</h2>
<p>Le calcul part du prix maximum. Un négociant peut facturer moins, et ses remises ne suivent pas toujours le même écart entre paliers : comparez les deux devis réels avant de trancher. Il ne tient pas compte non plus de la place dans la citerne, qui reste la vraie limite, ni de votre trésorerie : avancer quelques centaines d’euros pour du mazout brûlé l’hiver suivant n’a de sens que si la dépense est soutenable. Le ${h.a('budget-chauffage', 'budget de chauffage')} aide à situer la commande dans l’année.</p>
<p>Enfin, le prix maximum change souvent. Le même calcul fait demain peut donner un supplément différent ; le ${h.a('mazout-demain', 'prix du mazout de demain')} indique si un nouveau tarif est déjà publié. Le guide ${h.a('quand-commander-mazout', 'quand commander son mazout')} regarde, lui, ce que l’historique dit des périodes de commande.</p>
<p>Un dernier repère : la ${h.src('fondsPrix', 'page du Fonds Social Chauffage sur les prix officiels')} rappelle que le prix maximum s’applique aussi au prix à la pompe, pour qui achète le mazout en bidons. Ce prix-là est plus élevé que les deux paliers de livraison, et n’intervient pas dans le seuil de 2 000 litres.</p>
<!--tarif:mazout-->`;
    },
  },
  nl: {
    slug: 'mazout-2000-liter',
    nav: 'Mazout: de drempel van 2.000 liter',
    card: 'Wat de stap naar 2.000 liter kost, en vanaf welk volume hij voordelig wordt.',
    title: 'Mazout 2.000 liter: drempel van de maximumprijs in 2026',
    description: 'Mazout vanaf 2.000 liter of minder: verschil tussen de twee schijven van de maximumprijs, kost van de extra liters en het volume waarboven het loont, 2026.',
    h1: 'Mazout: de drempel van 2.000 liter',
    intro: 'Het officiële tarief kent een lagere prijs vanaf 2.000 geleverde liter. De tool toont wat de extra liters kosten en wanneer de grote bestelling minder kost dan de kleine.',
    resume: (h) => {
      const { pLt, pGe, s, eMin, eMax } = prix(h);
      return `De Belgische maximumprijs van mazout kent twee leveringsschijven: minder dan 2.000 liter, en 2.000 liter of meer. Op ${h.date(h.today)} staat de eerste op ${h.l3(pLt)} per liter en de tweede op ${h.l3(pGe)}, inclusief btw, dus ${h.cts(pLt - pGe).replace(/^[+−]/, '')} minder per liter in de hogere schijf. ${eMin === eMax ? 'Over de hele reeks van een jaar is dat verschil niet veranderd.' : `Over de reeks van een jaar bleef dat verschil tussen ${h.cts(eMin).replace(/^[+−]/, '')} en ${h.cts(eMax).replace(/^[+−]/, '')}.`} Wie 1.500 liter wilde bestellen, betaalt voor 2.000 liter ${h.eur(s.surcout2000)} meer in totaal tegen de maximumprijs, of ${h.l3(s.coutMarginal ?? 0)} per extra liter, iets minder dan de prijs van de lagere schijf. Het volume dat evenveel kost als 2.000 liter is ${h.num(s.equivalent)} liter: daarboven is 2.000 liter bestellen goedkoper dan de oorspronkelijke bestelling. De winst hangt dus vooral af van de vrije ruimte in uw tank.`;
    },
    faqs: (h) => {
      const { pLt, pGe, s } = prix(h);
      return [
        { q: 'Geldt de schijf van 2.000 liter voor het hele volume of alleen voor de liters erboven?', a: `Voor het hele volume. Het officiële tarief geeft een maximumprijs per liter volgens de schijf van de levering: een bestelling van 2.000 liter wordt op ${h.date(h.today)} volledig tegen ${h.l3(pGe)} berekend, een bestelling van 1.999 liter volledig tegen ${h.l3(pLt)}. Precies die sprong in één keer maakt de berekening van de drempel nuttig.` },
        { q: 'Ik bestel 1.900 liter: betaal ik dan meer dan voor 2.000 liter?', a: `Tegen de maximumprijs van ${h.date(h.today)} kost 1.900 liter ${h.eur(h.M.livraison(1900, pLt, pGe).total)} en 2.000 liter ${h.eur(s.a2000.total)}. ${h.M.livraison(1900, pLt, pGe).total > s.a2000.total ? 'De kleine bestelling kost dus meer dan de grote: als de tank de ruimte heeft, is 2.000 liter voordeliger.' : 'De kleine bestelling blijft dus goedkoper in totaal, ook al kost elke liter er meer.'} Het evenwichtsvolume van vandaag is ${h.num(s.equivalent)} liter; de tabel op deze pagina maakt dezelfde vergelijking voor andere volumes.` },
        { q: 'Kan ik samen met een buur mazout bestellen om aan 2.000 liter te komen?', a: 'Het officiële tarief legt maximumprijzen per leveringsschijf vast, maar zegt niet hoe een handelaar meerdere tanks in dezelfde ronde behandelt. Sommige handelaars bieden een gezamenlijke prijs voor gegroepeerde bestellingen, andere niet. Vraag de handelaar schriftelijk welke prijs hij per adres toepast voor u zich vastlegt.' },
        { q: 'Kan ik met een tank van 1.500 liter wel profiteren van de schijf van 2.000 liter?', a: 'Niet bij één levering: u kunt niet meer laten leveren dan de vrije ruimte in de tank. De hogere schijf is vooral interessant voor tanks van 3.000 liter en meer, die gevuld worden als het peil laag genoeg staat. Laat bij twijfel het peil met de peilmeter controleren voor u bestelt, en houd een veiligheidsmarge aan.' },
      ];
    },
    body: (h) => {
      const { pLt, pGe, s } = prix(h);
      return `
<h2>De kost van een levering per volume</h2>
${h.table(['Volume', 'Schijf', 'Maximumprijs', 'Bedrag', 'Verschil met 2.000 l'], lignes(h, pLt, pGe), `Maximumprijzen incl. btw van ${h.date(h.today)}. De laatste kolom toont wat een levering van 2.000 liter meer (of minder) kost.`, ['l', 'l', 'r', 'r', 'r'])}
<p>De tabel leest u van boven naar onder: het bedrag stijgt met het volume tot 2.000 liter, waar de literprijs van schijf wisselt. Net onder de drempel wordt het verschil met een levering van 2.000 liter klein en daarna negatief: rond ${h.num(s.equivalent)} liter kost de grote bestelling evenveel als de kleine, en daarboven kost ze minder terwijl u meer mazout krijgt.</p>
<h2>Hoe de tool rekent</h2>
<p>De tool neemt de twee maximumprijzen van de dag die Statbel publiceert in de ${h.src('bestatJour', 'be.STAT-reeks van het officiële tarief')}. Hij berekent uw bestelling in de schijf die erop van toepassing is, en daarna dezelfde bestelling aangevuld tot 2.000 liter in de hogere schijf. Het verschil is de meerprijs; gedeeld door het aantal extra liters geeft het de werkelijke prijs van elke liter meer. Vandaag kost die extra liter u ${h.l3(s.coutMarginal ?? 0)}, tegenover ${h.l3(pLt)} voor een liter in de lagere schijf: de toegevoegde liters genieten mee van de korting op de hele bestelling.</p>
<p>Het evenwichtsvolume is eenvoudig: 2.000 liter maal de prijs van de hogere schijf, gedeeld door de prijs van de lagere schijf. Wilde u meer bestellen dan dat volume, dan kost 2.000 liter in totaal minder. Daaronder kost de grote bestelling meer, maar blijft elke extra liter goedkoper dan de prijs van de dag.</p>
<h2>Wat de berekening niet zegt</h2>
<p>De berekening vertrekt van de maximumprijs. Een handelaar mag minder aanrekenen, en zijn kortingen volgen niet altijd hetzelfde verschil tussen de schijven: vergelijk de twee echte offertes voor u beslist. Ze houdt ook geen rekening met de ruimte in de tank, die de echte grens blijft, en evenmin met uw budget: een paar honderd euro vooruit betalen voor mazout die u pas de volgende winter stookt, heeft alleen zin als de uitgave haalbaar is. Het ${h.a('budget-chauffage', 'stookbudget')} helpt om de bestelling in het jaar te plaatsen.</p>
<p>De maximumprijs verandert bovendien vaak. Dezelfde berekening morgen kan een andere meerprijs geven; de ${h.a('mazout-demain', 'mazoutprijs van morgen')} toont of er al een nieuw tarief gepubliceerd is. De gids ${h.a('quand-commander-mazout', 'wanneer mazout bestellen')} bekijkt wat de geschiedenis zegt over het moment van bestellen.</p>
<p>Nog een houvast: de ${h.src('fondsPrix', 'pagina van het Sociaal Verwarmingsfonds over de officiële prijzen')} herinnert eraan dat de maximumprijs ook voor de pompprijs geldt, voor wie mazout in jerrycans koopt. Die prijs ligt hoger dan de twee leveringsschijven en speelt geen rol bij de drempel van 2.000 liter.</p>
<!--tarif:mazout-->`;
    },
  },
  en: {
    slug: 'heating-oil-2000-litres',
    nav: 'Heating oil: the 2,000-litre threshold',
    card: 'What moving up to 2,000 litres costs, and from which volume it pays off.',
    title: 'Heating oil 2,000 litres: maximum price threshold 2026',
    description: 'Heating oil at 2,000 litres or less: the gap between the two maximum price bands, the cost of the extra litres and the volume where 2,000 L costs less.',
    h1: 'Heating oil: the 2,000-litre threshold',
    intro: 'The official tariff sets a lower price once 2,000 litres are delivered. The tool shows what the extra litres cost and when the big order costs less than the small one.',
    resume: (h) => {
      const { pLt, pGe, s, eMin, eMax } = prix(h);
      return `The Belgian maximum price of heating oil (mazout) has two delivery bands: under 2,000 litres, and 2,000 litres or more. On ${h.date(h.today)} the first stands at ${h.l3(pLt)} a litre and the second at ${h.l3(pGe)}, VAT included, so ${h.cts(pLt - pGe).replace(/^[+−]/, '')} less per litre in the upper band. ${eMin === eMax ? 'Over the whole one-year series that gap has not moved.' : `Over the one-year series that gap stayed between ${h.cts(eMin).replace(/^[+−]/, '')} and ${h.cts(eMax).replace(/^[+−]/, '')}.`} If you meant to order 1,500 litres, going up to 2,000 litres costs ${h.eur(s.surcout2000)} more in total at the maximum price, or ${h.l3(s.coutMarginal ?? 0)} per extra litre, slightly below the lower band’s price. The volume that costs as much as 2,000 litres is ${h.num(s.equivalent)} litres: above it, ordering 2,000 litres is cheaper than the original order. The gain therefore depends mostly on the free space in your tank.`;
    },
    faqs: (h) => {
      const { pLt, pGe, s } = prix(h);
      return [
        { q: 'Does the 2,000-litre band apply to the whole delivery or only to the litres above it?', a: `To the whole delivery. The official tariff gives a maximum price per litre according to the delivery band: a 2,000-litre order is priced entirely at ${h.l3(pGe)} on ${h.date(h.today)}, a 1,999-litre order entirely at ${h.l3(pLt)}. That all-or-nothing step is what makes the threshold calculation worthwhile.` },
        { q: 'If I order 1,900 litres, do I pay more than for 2,000 litres?', a: `At the maximum price of ${h.date(h.today)}, 1,900 litres cost ${h.eur(h.M.livraison(1900, pLt, pGe).total)} and 2,000 litres ${h.eur(s.a2000.total)}. ${h.M.livraison(1900, pLt, pGe).total > s.a2000.total ? 'The smaller order therefore costs more than the larger one: if the tank has room, 2,000 litres is the better deal.' : 'The smaller order therefore stays cheaper in total, even though each litre costs more.'} Today’s break-even volume is ${h.num(s.equivalent)} litres, and the table on this page shows the same comparison for other volumes.` },
        { q: 'Can I pool a heating oil order with a neighbour to reach 2,000 litres?', a: 'The official tariff sets maximum prices per delivery band but says nothing about how a dealer treats several tanks filled on the same round. Some dealers offer a joint price for pooled orders, others do not. Ask the dealer in writing which price they will apply at each address before you commit.' },
        { q: 'Does a 1,500-litre tank stop me from using the 2,000-litre band?', a: 'For a single delivery, yes: you cannot have more delivered than the free space in the tank. The upper band mostly suits tanks of 3,000 litres or more, filled when the level is low enough. If in doubt, read the gauge before ordering and keep a safety margin.' },
      ];
    },
    body: (h) => {
      const { pLt, pGe, s } = prix(h);
      return `
<h2>What a delivery costs, by volume</h2>
${h.table(['Volume', 'Band', 'Maximum price', 'Amount', 'Gap to 2,000 L'], lignes(h, pLt, pGe), `Maximum prices including VAT on ${h.date(h.today)}. The last column shows how much more (or less) a 2,000-litre delivery would cost.`, ['l', 'l', 'r', 'r', 'r'])}
<p>Read the table from top to bottom: the amount rises with the volume up to 2,000 litres, where the price per litre switches band. Just below the threshold the gap to a 2,000-litre delivery shrinks, then turns negative: at around ${h.num(s.equivalent)} litres the big order costs the same as the small one, and above that it costs less while bringing more oil.</p>
<h2>How the tool works it out</h2>
<p>The tool takes the two maximum prices of the day published by Statbel in the ${h.src('bestatJour', 'be.STAT series of the official tariff')}. It prices your order in the band that applies, then the same order topped up to 2,000 litres in the upper band. The difference is the extra cost; divided by the number of added litres, it gives the real price of each extra litre. Today that extra litre costs you ${h.l3(s.coutMarginal ?? 0)}, against ${h.l3(pLt)} for a litre in the lower band: the added litres benefit from the discount applied to the whole order.</p>
<p>The break-even volume is simple: 2,000 litres times the upper-band price, divided by the lower-band price. If you planned to order more than that, going to 2,000 litres costs less in total. Below it, the big order costs more, but each added litre is still cheaper than the day’s price.</p>
<h2>What the calculation leaves out</h2>
<p>The calculation starts from the maximum price. A dealer may charge less, and their discounts do not always keep the same gap between bands: compare the two real quotes before deciding. Nor does it account for the room in your tank, which remains the real limit, or for your cash flow: paying a few hundred euros ahead for oil you will burn next winter only makes sense if the outlay is affordable. The ${h.a('budget-chauffage', 'heating oil budget')} helps place the order within the year.</p>
<p>The maximum price also changes often. The same calculation tomorrow may give a different extra cost; the ${h.a('mazout-demain', 'heating oil price for tomorrow')} shows whether a new tariff is already out. The guide on ${h.a('quand-commander-mazout', 'when to order heating oil')} looks at what the history says about order timing.</p>
<p>One last pointer: the ${h.src('fondsPrix', 'Social Heating Fund’s page on official prices')} notes that the maximum price also covers the pump price, for people who buy heating oil in cans. That price is higher than both delivery bands and plays no part in the 2,000-litre threshold.</p>
<!--tarif:mazout-->`;
    },
  },
});
