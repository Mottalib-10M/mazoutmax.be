import { defineGuide, type Helpers } from '../../lib/guide-types';

const LT = 'mazout_lt2000' as const, GE = 'mazout_ge2000' as const;
const VOL = [1000, 1500, 2000, 2500, 3000];

const base = (h: Helpers) => {
  const k = (l: number) => (l >= h.P.seuil_litres ? GE : LT);
  const pr = (l: number) => h.M.priceOn(k(l), h.today)!;
  const rg = (l: number) => h.M.range(k(l), 365, h.today);
  const b2 = h.M.budgetChauffage(2000, pr(2000));
  const r2 = rg(2000);
  const ans = h.M.yearly(GE);
  return { k, pr, rg, b2, r2, ans, tva2: (b2.total * h.P.tva) / (1 + h.P.tva) };
};
const lignes = (h: Helpers) => {
  const { pr, rg } = base(h);
  return VOL.map((v) => {
    const r = rg(v);
    return [`${h.num(v)} L`, h.eur(h.M.budgetChauffage(v, pr(v)).total), h.eur(h.M.budgetChauffage(v, pr(v)).mois), h.eur(h.M.budgetChauffage(v, r.min[1]).total), h.eur(h.M.budgetChauffage(v, r.max[1]).total)];
  });
};

export default defineGuide({
  id: 'budget-chauffage',
  group: 'mazout',
  order: 4,
  tool: 'budgetChauffage',
  related: ['allocation-chauffage', 'mazout-2000-litres', 'historique-mazout', 'quand-commander-mazout'],
  sources: ['bestatJour', 'bestatAn', 'bestatDernier'],
  fr: {
    slug: 'budget-chauffage-mazout',
    nav: 'Budget de chauffage au mazout',
    card: 'Votre consommation annuelle chiffrée au prix maximum du jour, au plus bas et au plus haut de l’année.',
    title: 'Budget chauffage mazout : coût annuel au prix maximum 2026',
    description: 'Budget de chauffage au mazout : coût d’une année au prix maximum du jour, par mois, au plus bas et au plus haut d’un an et aux moyennes officielles, 2026.',
    h1: 'Budget de chauffage au mazout',
    intro: 'Vos litres brûlés par an, chiffrés au prix maximum du jour, puis aux extrêmes de l’année et aux moyennes officielles des trois dernières années.',
    resume: (h) => {
      const { b2, r2, pr, tva2, ans } = base(h);
      const a = ans[ans.length - 2];
      return `Une maison qui brûle 2 000 litres de mazout par an et se fait livrer en une fois paie, au prix maximum du ${h.date(h.today)}, au plus ${h.eur(b2.total)} pour l’année, soit ${h.eur(b2.mois)} par mois, à ${h.l3(pr(2000))} le litre au palier de 2 000 litres. Dans ce montant, la TVA de ${h.pct(h.P.tva, 0)} pèse ${h.eur(tva2)}. Le même volume aurait coûté ${h.eur(h.M.budgetChauffage(2000, r2.min[1]).total)} au prix le plus bas des douze derniers mois, le ${h.date(r2.min[0])}, et ${h.eur(h.M.budgetChauffage(2000, r2.max[1]).total)} au plus haut, le ${h.date(r2.max[0])} : l’écart de ${h.eur(h.M.budgetChauffage(2000, r2.max[1] - r2.min[1]).total)} montre à quel point le budget dépend du jour de la commande. ${a ? `À la moyenne officielle de ${a[0]}, il serait de ${h.eur(h.M.budgetChauffage(2000, a[1]).total)}.` : ''} L’outil refait ce calcul sur votre propre consommation, prise sur une année complète de factures, et le compare au prix que vous avez réellement payé lors de votre dernière livraison.`;
    },
    faqs: (h) => {
      const { pr } = base(h);
      return [
        { q: 'Comment connaître ma consommation annuelle de mazout pour remplir le budget ?', a: 'Additionnez les litres de toutes les livraisons d’une année complète et corrigez de la différence de niveau de la citerne entre le début et la fin de l’année, lue sur la jauge. Une seule livraison ne suffit pas : elle peut couvrir plus ou moins de douze mois. Sur deux ou trois hivers, la moyenne lisse les années douces et les années froides.' },
        { q: 'Faut-il compter le budget de chauffage au palier de 2 000 litres ou en dessous ?', a: `L’outil choisit le palier d’après le volume annuel saisi, comme si tout était livré en une fois. Si vous faites livrer deux fois 1 000 litres, chaque livraison est au palier inférieur, à ${h.l3(pr(1000))} le litre au ${h.date(h.today)} au lieu de ${h.l3(pr(2000))}. Saisissez alors le volume d’une livraison et multipliez, ou comparez les deux cas avec le seuil de 2 000 litres.` },
        { q: 'Le budget de chauffage calculé ici comprend-il l’entretien de la chaudière ?', a: 'Non. Le calcul ne porte que sur le combustible, au prix maximum officiel TVA comprise. L’entretien, le ramonage, l’électricité du brûleur et de la pompe de circulation, ou une éventuelle assurance de la citerne s’ajoutent à part. Pour un budget complet de chauffage, ajoutez ces postes à partir de vos propres factures.' },
        { q: 'Pourquoi comparer mon budget à la moyenne d’une année passée ?', a: 'Parce qu’un prix du jour isolé peut tomber sur un pic ou un creux. Les moyennes annuelles publiées par Statbel donnent un niveau plus stable : si votre budget au prix du jour s’en écarte beaucoup, c’est que le tarif actuel est loin de son niveau habituel, ce qui peut justifier de fractionner les commandes ou de reporter une partie de l’achat.' },
      ];
    },
    body: (h) => {
      const { b2, ans } = base(h);
      return `
<h2>Ce que fait l’outil</h2>
<p>Vous indiquez les litres brûlés sur une année. L’outil choisit le palier du tarif officiel qui correspond à ce volume, moins de 2 000 litres ou 2 000 litres et plus, prend le prix maximum du jour dans la ${h.src('bestatJour', 'série be.STAT')} et multiplie. Le résultat est un plafond : ce que coûterait l’année si tout était acheté aujourd’hui au prix maximum. Il le divise par douze pour donner un budget mensuel, puis refait le calcul au prix le plus bas et au plus haut des 365 derniers jours, et aux moyennes annuelles officielles des dernières années publiées par Statbel dans ses ${h.src('bestatAn', 'tableaux annuels')}.</p>
<p>Le second champ, facultatif, reçoit le prix au litre de votre dernière facture, TVA comprise. Une ligne supplémentaire montre alors ce que l’année vous coûterait à ce prix-là, ce qui permet de voir d’un coup d’œil si votre négociant se situait loin sous le plafond ou tout près.</p>
<h2>Le budget selon le volume, au prix du jour et aux extrêmes</h2>
${h.table(['Litres par an', 'Au prix du jour', 'Par mois', 'Au plus bas d’un an', 'Au plus haut d’un an'], lignes(h), `Budgets maximums TVA comprise, au palier qui correspond au volume, prix du ${h.date(h.today)} et extrêmes des 365 derniers jours.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Le saut entre 1 500 et 2 000 litres n’est pas proportionnel : à partir de 2 000 litres, tout le volume passe au palier moins cher. Une consommation annuelle juste sous le seuil gagne donc à être livrée en une fois si la citerne le permet, comme le détaille le ${h.a('mazout-2000-litres', 'calcul du seuil de 2 000 litres')}.</p>
<h2>Lisser la dépense sur l’année</h2>
<p>Le mazout se paie à la livraison, pas au mois. Le chiffre mensuel de l’outil, ${h.eur(b2.mois)} pour 2 000 litres au prix du jour, sert surtout à mettre de côté chaque mois la somme qui paiera la prochaine citerne. Certains négociants proposent aussi un paiement échelonné ; dans ce cas, comparez le total payé au montant maximum de la livraison au jour convenu, car le prix maximum s’applique au litre livré, quelle que soit la façon de le régler.</p>
<p>${ans.length >= 2 ? `Les moyennes officielles aident à fixer un ordre de grandeur. Sur 2 000 litres, la moyenne de ${ans[ans.length - 2][0]} donnait ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 2][1]).total)} ; celle de ${ans[ans.length - 1][0]} jusqu’ici donne ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 1][1]).total)}. ` : ''}Prévoir sur la plus haute des deux évite les mauvaises surprises ; l’${h.a('historique-mazout', 'historique du prix du mazout')} montre comment le tarif s’est déplacé entre-temps.</p>
<h2>Quand le budget dépasse vos moyens</h2>
<p>Si la facture de mazout pèse trop lourd, le Fonds Social Chauffage verse, par l’intermédiaire du CPAS, une allocation par litre aux ménages qui remplissent ses conditions de statut ou de revenus. Le montant dépend du prix facturé et ne couvre qu’un nombre limité de litres par an. L’${h.a('allocation-chauffage', 'allocation chauffage')} calcule ce qu’elle représenterait sur votre livraison et rappelle les délais à respecter.</p>
<p>Pour décider du moment de la prochaine commande, le guide ${h.a('quand-commander-mazout', 'quand commander son mazout')} rassemble ce que la série officielle permet, ou non, d’en dire.</p>`;
    },
  },
  nl: {
    slug: 'stookbudget-mazout',
    nav: 'Stookbudget voor mazout',
    card: 'Uw jaarverbruik berekend tegen de maximumprijs van vandaag, de laagste en de hoogste van het jaar.',
    title: 'Stookbudget mazout: jaarkost tegen de maximumprijs 2026',
    description: 'Stookbudget voor mazout: wat een jaar kost tegen de maximumprijs van vandaag, per maand, tegen de laagste en hoogste prijs en de jaargemiddelden, 2026.',
    h1: 'Stookbudget voor mazout',
    intro: 'Uw verbruikte liters per jaar, berekend tegen de maximumprijs van vandaag, dan tegen de uitersten van het jaar en de officiële gemiddelden van de laatste drie jaar.',
    resume: (h) => {
      const { b2, r2, pr, tva2, ans } = base(h);
      const a = ans[ans.length - 2];
      return `Een woning die 2.000 liter mazout per jaar verbruikt en die in één keer laat leveren, betaalt tegen de maximumprijs van ${h.date(h.today)} hoogstens ${h.eur(b2.total)} voor het jaar, of ${h.eur(b2.mois)} per maand, tegen ${h.l3(pr(2000))} per liter in de schijf vanaf 2.000 liter. Daarin weegt de btw van ${h.pct(h.P.tva, 0)} ${h.eur(tva2)}. Hetzelfde volume had ${h.eur(h.M.budgetChauffage(2000, r2.min[1]).total)} gekost tegen de laagste prijs van de voorbije twaalf maanden, op ${h.date(r2.min[0])}, en ${h.eur(h.M.budgetChauffage(2000, r2.max[1]).total)} tegen de hoogste, op ${h.date(r2.max[0])}: het verschil van ${h.eur(h.M.budgetChauffage(2000, r2.max[1] - r2.min[1]).total)} toont hoezeer het budget afhangt van de dag van bestellen. ${a ? `Tegen het officiële gemiddelde van ${a[0]} zou het ${h.eur(h.M.budgetChauffage(2000, a[1]).total)} zijn.` : ''} De tool maakt dezelfde berekening op uw eigen verbruik, gemeten over een volledig jaar facturen, en vergelijkt die met de prijs die u bij uw laatste levering echt betaalde.`;
    },
    faqs: (h) => {
      const { pr } = base(h);
      return [
        { q: 'Hoe ken ik mijn jaarverbruik aan mazout om het stookbudget in te vullen?', a: 'Tel de liters van alle leveringen van een volledig jaar op en corrigeer voor het verschil in tankpeil tussen begin en einde van het jaar, afgelezen op de peilmeter. Eén levering volstaat niet: ze kan meer of minder dan twaalf maanden dekken. Over twee of drie winters vlakt het gemiddelde zachte en koude jaren uit.' },
        { q: 'Reken ik het stookbudget in de schijf vanaf 2.000 liter of eronder?', a: `De tool kiest de schijf op basis van het ingevulde jaarvolume, alsof alles in één keer geleverd wordt. Laat u twee keer 1.000 liter leveren, dan valt elke levering in de lagere schijf, tegen ${h.l3(pr(1000))} per liter op ${h.date(h.today)} in plaats van ${h.l3(pr(2000))}. Vul dan het volume van één levering in en vermenigvuldig, of vergelijk beide gevallen met de drempel van 2.000 liter.` },
        { q: 'Zit het onderhoud van de ketel in dit stookbudget?', a: 'Nee. De berekening gaat alleen over de brandstof, tegen de officiële maximumprijs inclusief btw. Onderhoud, schoorsteenvegen, de elektriciteit van brander en circulatiepomp of een eventuele verzekering van de tank komen er apart bij. Voor een volledig verwarmingsbudget telt u die posten erbij op basis van uw eigen facturen.' },
        { q: 'Waarom mijn budget vergelijken met het gemiddelde van een vorig jaar?', a: 'Omdat een losse dagprijs op een piek of een dal kan vallen. De jaargemiddelden van Statbel geven een stabieler niveau: wijkt uw budget tegen de prijs van vandaag daar sterk van af, dan staat het huidige tarief ver van zijn gewone niveau, wat een reden kan zijn om de bestelling te spreiden of een deel van de aankoop uit te stellen.' },
      ];
    },
    body: (h) => {
      const { b2, ans } = base(h);
      return `
<h2>Wat de tool doet</h2>
<p>U vult de liters in die u over een jaar verbruikt. De tool kiest de schijf van het officiële tarief die bij dat volume hoort, minder dan 2.000 liter of 2.000 liter en meer, neemt de maximumprijs van vandaag uit de ${h.src('bestatJour', 'be.STAT-reeks')} en vermenigvuldigt. Het resultaat is een plafond: wat het jaar zou kosten als alles vandaag tegen de maximumprijs werd gekocht. Hij deelt het door twaalf voor een maandbudget en herhaalt de berekening tegen de laagste en de hoogste prijs van de laatste 365 dagen en tegen de officiële jaargemiddelden die Statbel in zijn ${h.src('bestatAn', 'jaartabellen')} publiceert.</p>
<p>Het tweede, optionele veld krijgt de literprijs van uw laatste factuur, inclusief btw. Een extra regel toont dan wat het jaar u tegen die prijs zou kosten, zodat u in één oogopslag ziet of uw handelaar ver onder het plafond zat of er vlak tegenaan.</p>
<h2>Het budget per volume, tegen de dagprijs en de uitersten</h2>
${h.table(['Liter per jaar', 'Tegen de dagprijs', 'Per maand', 'Laagste van een jaar', 'Hoogste van een jaar'], lignes(h), `Maximumbudgetten incl. btw, in de schijf die bij het volume hoort, prijs van ${h.date(h.today)} en uitersten van de laatste 365 dagen.`, ['l', 'r', 'r', 'r', 'r'])}
<p>De sprong tussen 1.500 en 2.000 liter is niet evenredig: vanaf 2.000 liter valt het hele volume in de goedkopere schijf. Een jaarverbruik net onder de drempel laat u dus beter in één keer leveren als de tank het toelaat, zoals de ${h.a('mazout-2000-litres', 'berekening van de drempel van 2.000 liter')} toont.</p>
<h2>De uitgave over het jaar spreiden</h2>
<p>Mazout betaalt u bij de levering, niet per maand. Het maandcijfer van de tool, ${h.eur(b2.mois)} voor 2.000 liter tegen de dagprijs, dient vooral om elke maand het bedrag opzij te zetten dat de volgende tank betaalt. Sommige handelaars bieden ook gespreide betaling aan; vergelijk dan het totaal met het maximumbedrag van de levering op de afgesproken dag, want de maximumprijs geldt per geleverde liter, ongeacht hoe u betaalt.</p>
<p>${ans.length >= 2 ? `De officiële gemiddelden geven een orde van grootte. Op 2.000 liter gaf het gemiddelde van ${ans[ans.length - 2][0]} ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 2][1]).total)}; dat van ${ans[ans.length - 1][0]} tot nu geeft ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 1][1]).total)}. ` : ''}Wie op het hoogste van de twee rekent, vermijdt verrassingen; de ${h.a('historique-mazout', 'evolutie van de mazoutprijs')} toont hoe het tarief intussen bewoog.</p>
<h2>Als het budget te zwaar weegt</h2>
<p>Weegt de mazoutfactuur te zwaar, dan betaalt het Sociaal Verwarmingsfonds via het OCMW een toelage per liter aan gezinnen die aan de voorwaarden van statuut of inkomen voldoen. Het bedrag hangt af van de gefactureerde prijs en dekt maar een beperkt aantal liter per jaar. De ${h.a('allocation-chauffage', 'verwarmingstoelage')} berekent wat ze op uw levering zou opleveren en herinnert aan de termijnen.</p>
<p>Voor het moment van de volgende bestelling bundelt de gids ${h.a('quand-commander-mazout', 'wanneer mazout bestellen')} wat de officiële reeks daar wel en niet over zegt.</p>`;
    },
  },
  en: {
    slug: 'heating-oil-budget',
    nav: 'Heating oil budget',
    card: 'Your yearly consumption priced at today’s maximum price and at the year’s lowest and highest.',
    title: 'Heating oil budget: yearly cost at the maximum price 2026',
    description: 'Heating oil budget for a Belgian home: a year’s cost at today’s maximum price, per month, at the year’s low and high and at official yearly averages, 2026.',
    h1: 'Heating oil budget',
    intro: 'The litres you burn in a year, priced at today’s maximum price, then at the year’s extremes and at the official averages of the last three years.',
    resume: (h) => {
      const { b2, r2, pr, tva2, ans } = base(h);
      const a = ans[ans.length - 2];
      return `A house that burns 2,000 litres of heating oil a year and takes it in one delivery pays, at the maximum price of ${h.date(h.today)}, no more than ${h.eur(b2.total)} for the year, or ${h.eur(b2.mois)} a month, at ${h.l3(pr(2000))} a litre in the 2,000-litre band. Within that sum, the ${h.pct(h.P.tva, 0)} VAT accounts for ${h.eur(tva2)}. The same volume would have cost ${h.eur(h.M.budgetChauffage(2000, r2.min[1]).total)} at the lowest price of the past twelve months, on ${h.date(r2.min[0])}, and ${h.eur(h.M.budgetChauffage(2000, r2.max[1]).total)} at the highest, on ${h.date(r2.max[0])}: the gap of ${h.eur(h.M.budgetChauffage(2000, r2.max[1] - r2.min[1]).total)} shows how much the budget depends on the day you order. ${a ? `At the official ${a[0]} average it would be ${h.eur(h.M.budgetChauffage(2000, a[1]).total)}.` : ''} The tool repeats this calculation on your own consumption, taken from a full year of invoices, and compares it with the price you actually paid at your last delivery.`;
    },
    faqs: (h) => {
      const { pr } = base(h);
      return [
        { q: 'How do I find my yearly heating oil consumption to fill in the budget?', a: 'Add up the litres of every delivery over a full year and adjust for the difference in tank level between the start and the end of that year, read on the gauge. A single delivery is not enough: it may cover more or less than twelve months. Over two or three winters, the average evens out mild and cold years.' },
        { q: 'Should the heating budget use the 2,000-litre band or the band below?', a: `The tool picks the band from the yearly volume entered, as if everything were delivered at once. If you have two deliveries of 1,000 litres, each falls in the lower band, at ${h.l3(pr(1000))} a litre on ${h.date(h.today)} instead of ${h.l3(pr(2000))}. In that case enter the volume of one delivery and multiply, or compare both cases with the 2,000-litre threshold.` },
        { q: 'Does this heating oil budget include boiler servicing?', a: 'No. The calculation covers the fuel only, at the official maximum price including VAT. Servicing, chimney sweeping, electricity for the burner and circulation pump, or any tank insurance come on top. For a full heating budget, add those items from your own bills.' },
        { q: 'Why compare my budget with a past year’s average?', a: 'Because a single day’s price may land on a peak or a trough. The yearly averages published by Statbel give a steadier level: if your budget at today’s price is far from it, the current tariff is far from its usual level, which can be a reason to split orders or put off part of the purchase.' },
      ];
    },
    body: (h) => {
      const { b2, ans } = base(h);
      return `
<h2>What the tool does</h2>
<p>You enter the litres burnt over a year. The tool picks the band of the official tariff that matches that volume, under 2,000 litres or 2,000 litres and over, takes the day’s maximum price from the ${h.src('bestatJour', 'be.STAT series')} and multiplies. The result is a ceiling: what the year would cost if everything were bought today at the maximum price. It divides by twelve for a monthly budget, then repeats the calculation at the lowest and highest prices of the last 365 days and at the official yearly averages Statbel publishes in its ${h.src('bestatAn', 'yearly tables')}.</p>
<p>The second, optional field takes the price per litre on your last invoice, VAT included. An extra line then shows what the year would cost at that price, so you can see at a glance whether your dealer was well under the ceiling or close to it.</p>
<h2>The budget by volume, at today’s price and at the extremes</h2>
${h.table(['Litres a year', 'At today’s price', 'A month', 'At the year’s low', 'At the year’s high'], lignes(h), `Maximum budgets including VAT, in the band matching the volume, prices of ${h.date(h.today)} and extremes of the last 365 days.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The jump between 1,500 and 2,000 litres is not proportional: from 2,000 litres, the whole volume moves to the cheaper band. A yearly consumption just under the threshold is therefore better delivered in one go if the tank allows, as the ${h.a('mazout-2000-litres', '2,000-litre threshold calculation')} sets out.</p>
<h2>Spreading the cost over the year</h2>
<p>Heating oil is paid for on delivery, not monthly. The tool’s monthly figure, ${h.eur(b2.mois)} for 2,000 litres at today’s price, is mainly a way to put aside each month the sum that will pay for the next tankful. Some dealers also offer staged payment; if so, compare the total paid with the maximum amount for the delivery on the agreed day, since the maximum price applies per litre delivered, however you settle it.</p>
<p>${ans.length >= 2 ? `The official averages give an order of magnitude. On 2,000 litres, the ${ans[ans.length - 2][0]} average gave ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 2][1]).total)}; the ${ans[ans.length - 1][0]} average so far gives ${h.eur(h.M.budgetChauffage(2000, ans[ans.length - 1][1]).total)}. ` : ''}Planning on the higher of the two avoids surprises; the ${h.a('historique-mazout', 'heating oil price history')} shows how the tariff has moved in between.</p>
<h2>When the budget is more than you can manage</h2>
<p>If the heating oil bill weighs too heavily, the Social Heating Fund pays, through the CPAS/OCMW (the municipal public social welfare centre), an allowance per litre to households that meet its status or income conditions. The amount depends on the price invoiced and covers only a limited number of litres a year. The ${h.a('allocation-chauffage', 'heating allowance')} page works out what it would mean on your delivery and recalls the deadlines.</p>
<p>To decide when to place the next order, the guide on ${h.a('quand-commander-mazout', 'when to order heating oil')} gathers what the official series can, and cannot, say about it.</p>`;
    },
  },
});
