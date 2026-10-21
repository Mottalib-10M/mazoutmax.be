import { defineGuide, type Helpers } from '../../lib/guide-types';

const LT = 'mazout_lt2000' as const;

const fonds = (h: Helpers) => {
  const F = h.P.fonds;
  const p = h.M.priceOn(LT, h.today)!;
  const a = h.M.allocation(p, 1000);
  const top = F.bareme[F.bareme.length - 1].cents, low = F.bareme[0].cents;
  return { F, p, a, top, low, maxAn: (F.litres_max_an * top) / 100 };
};
/** Barème : tranche de prix facturé → cents par litre, avec l'allocation sur 1 000 et 1 500 litres. */
const bareme = (h: Helpers) => {
  const B = h.P.fonds.bareme;
  return B.map((b, i) => {
    const de = i === 0 ? null : B[i - 1].jusqua!;
    const tranche = de == null ? h.T(`moins de ${h.l3(b.jusqua!)}`, `minder dan ${h.l3(b.jusqua!)}`, `under ${h.l3(b.jusqua!)}`)
      : b.jusqua == null ? h.T(`${h.l3(de)} ou plus`, `${h.l3(de)} of meer`, `${h.l3(de)} or more`)
        : h.T(`de ${h.l3(de)} à moins de ${h.l3(b.jusqua)}`, `van ${h.l3(de)} tot minder dan ${h.l3(b.jusqua)}`, `${h.l3(de)} to under ${h.l3(b.jusqua)}`);
    return [tranche, `${h.num(b.cents)} c`, h.eur((1000 * b.cents) / 100), h.eur((h.P.fonds.litres_max_an * b.cents) / 100)];
  });
};
/** Plafond de revenus pour 0 à 3 personnes à charge. */
const plafonds = (h: Helpers) => [0, 1, 2, 3].map((n) => [h.num(n), h.eur(h.M.plafondRevenus(n), 2)]);

export default defineGuide({
  id: 'allocation-chauffage',
  group: 'mazout',
  order: 5,
  tool: 'allocation',
  related: ['budget-chauffage', 'mazout-demain', 'prix-maximum', 'mazout-2000-litres'],
  sources: ['fondsMontant', 'fondsBedrag', 'fondsQui', 'fondsDemande', 'bestatJour'],
  fr: {
    slug: 'allocation-chauffage',
    nav: 'Allocation chauffage',
    card: 'Le montant de l’allocation du Fonds Social Chauffage sur votre facture, et les conditions à remplir.',
    title: 'Allocation chauffage mazout : montant par litre en 2026',
    description: 'Allocation du Fonds Social Chauffage pour le mazout : 14 à 20 cents par litre selon le prix facturé, plafond de 1 500 litres, revenus et délai, en 2026.',
    h1: 'Allocation chauffage du Fonds Social Chauffage',
    intro: 'Combien le Fonds Social Chauffage peut verser sur votre livraison de mazout, selon le prix facturé, les litres déjà aidés et votre composition de ménage.',
    resume: (h) => {
      const { F, p, a, top, low, maxAn } = fonds(h);
      return `Le Fonds Social Chauffage verse, par l’intermédiaire du CPAS de votre commune, une allocation de ${h.num(low)} à ${h.num(top)} cents par litre de combustible de chauffage, selon le prix au litre facturé TVA comprise : plus la facture est chère, plus l’aide par litre est élevée. Elle porte sur ${h.num(F.litres_max_an)} litres au plus par famille et par année civile, soit au maximum ${h.eur(maxAn)} par an au taux le plus haut. Pour le mazout ou le pétrole lampant de type C acheté à la pompe ou en petite quantité, l’allocation est un forfait annuel de ${h.eur(F.forfait_pompe)}. Au prix maximum du ${h.date(h.today)}, ${h.l3(p)} le litre sous 2 000 litres, une livraison de 1 000 litres donnerait ${h.eur(a.montant)}, à ${h.num(a.cents)} cents par litre. Depuis le ${h.date(F.revenus_depuis)}, la catégorie des bas revenus vise des revenus annuels bruts imposables de ${h.eur(F.revenu_plafond, 2)} au plus, majorés de ${h.eur(F.revenu_par_charge, 2)} par personne à charge. La demande se fait dans les ${h.num(F.delai_jours)} jours qui suivent la livraison.`;
    },
    faqs: (h) => {
      const { F, top } = fonds(h);
      return [
        { q: 'Quel est le montant maximum de l’allocation chauffage pour le mazout sur une année ?', a: `Le Fonds retient au plus ${h.num(F.litres_max_an)} litres par famille et par année civile. Au taux le plus élevé du barème, ${h.num(top)} cents par litre, cela fait ${h.eur((F.litres_max_an * top) / 100)} sur l’année. Si vous faites plusieurs livraisons, les litres s’additionnent jusqu’à ce plafond, et la demande se fait au CPAS dans les ${h.num(F.delai_jours)} jours qui suivent la livraison.` },
        { q: 'Mon prix au litre baisse grâce à une remise : l’allocation chauffage baisse-t-elle aussi ?', a: 'Oui, si la remise fait passer le prix facturé sous une limite du barème. Le Fonds se base sur le prix au litre qui figure sur la facture, TVA comprise, et non sur le prix maximum officiel du jour. Une remise de quelques centimes peut donc faire perdre un cent d’allocation par litre ; sur l’ensemble, la remise reste en général plus avantageuse.' },
        { q: 'Qui compte comme personne à charge pour le plafond de revenus du Fonds Social Chauffage ?', a: `Selon le Fonds, une personne à charge est un membre du ménage dont les revenus nets annuels restent sous ${h.eur(F.revenu_charge_max_net)}. Chacune relève le plafond de ${h.eur(F.revenu_par_charge, 2)} au-delà des ${h.eur(F.revenu_plafond, 2)} de base. Les revenus pris en compte sont les revenus bruts imposables de tout le ménage.` },
        { q: 'Quels documents apporter au CPAS pour demander l’allocation chauffage ?', a: 'La cellule énergie du CPAS demande le formulaire de demande, une copie de la facture ou du bon de livraison, une copie de la carte d’identité et, selon le cas, une preuve des revenus du ménage. En immeuble à chauffage collectif, il faut aussi une attestation du propriétaire ou du syndic indiquant le nombre d’appartements couverts par la facture.' },
        { q: 'J’achète mon mazout en bidons à la station : ai-je droit à l’allocation chauffage ?', a: `Oui, si vous remplissez les conditions. Pour le mazout ou le pétrole lampant de type C acheté à la pompe ou en petite quantité, le Fonds ne calcule pas par litre : il verse un forfait de ${h.eur(F.forfait_pompe)} par an. Gardez les tickets de caisse, car ils servent de preuve d’achat lors de la demande au CPAS.` },
      ];
    },
    body: (h) => {
      const { F } = fonds(h);
      return `
<h2>Le barème par litre</h2>
${h.table(['Prix facturé par litre, TVA comprise', 'Allocation par litre', 'Sur 1 000 litres', `Sur ${h.num(F.litres_max_an)} litres`], bareme(h), 'Barème du Fonds Social Chauffage relevé le 21 octobre 2026 ; les limites de prix sont exclues de la tranche qu’elles ferment.', ['l', 'r', 'r', 'r'])}
<p>Le barème est publié par le Fonds sur sa ${h.src('fondsMontant', 'page consacrée au montant')} (version néerlandaise : ${h.src('fondsBedrag', 'hoeveel bedraagt de toelage')}). Chaque limite de prix est exclue de la tranche qu’elle ferme : un prix facturé égal à une limite tombe dans la tranche suivante, plus favorable. L’outil applique exactement ce barème au prix que vous saisissez, en partant du prix maximum du jour si vous ne changez rien.</p>
<h2>Ce que fait l’outil</h2>
<p>Vous indiquez le prix au litre qui figure sur votre facture, les litres livrés, les litres déjà aidés depuis le 1er janvier et le nombre de personnes à charge. L’outil trouve la tranche du barème, retient les litres qui restent sous le plafond annuel de ${h.num(F.litres_max_an)} litres et calcule l’allocation possible pour cette livraison. Il affiche aussi le plafond de revenus qui correspond à votre ménage et le délai pour introduire la demande. Le calcul est indicatif : seul le CPAS décide, après avoir examiné votre situation.</p>
<h2>Qui peut en bénéficier</h2>
<p>D’après la ${h.src('fondsQui', 'page « Qui peut en bénéficier »')} du Fonds, trois catégories de ménages sont visées. La première regroupe les personnes qui ont droit à l’intervention majorée de l’assurance soins de santé, le statut BIM. La deuxième vise les ménages à bas revenus, sous le plafond ci-dessous. La troisième concerne les personnes en médiation de dettes ou en règlement collectif de dettes qui ne parviennent pas à payer leur facture de chauffage.</p>
${h.table(['Personnes à charge', 'Revenus annuels bruts imposables maximums'], plafonds(h), `Plafond de la catégorie des bas revenus en vigueur depuis le ${h.date(F.revenus_depuis)}.`, ['l', 'r'])}
<h2>Introduire la demande au CPAS</h2>
<p>La demande se fait auprès du CPAS de la commune où vous habitez, en général auprès de sa cellule énergie, dans les ${h.num(F.delai_jours)} jours qui suivent la livraison ; la date de livraison est celle qui figure sur la facture. La ${h.src('fondsDemande', 'page « Comment demander »')} du Fonds énumère les pièces : le formulaire, une copie de la facture ou de la preuve d’achat, une copie de la carte d’identité et, au besoin, une preuve des revenus. En chauffage collectif, l’attestation du propriétaire ou du syndic précise le nombre d’appartements compris dans la facture.</p>
<p>Le délai de ${h.num(F.delai_jours)} jours est le point qui fait le plus souvent perdre l’aide : notez-le dès la livraison. Pour vérifier en même temps que le prix facturé respecte le plafond légal du jour, comparez-le au ${h.a('mazout-demain', 'prix maximum du mazout')} et lisez le guide du ${h.a('prix-maximum', 'prix maximum')}. Pour situer l’aide dans la dépense d’une année, passez par le ${h.a('budget-chauffage', 'budget de chauffage')}.</p>
<p>Ce site n’est ni le Fonds Social Chauffage ni un CPAS : il reprend leurs règles publiées pour vous aider à préparer la demande, sans pouvoir l’introduire à votre place.</p>`;
    },
  },
  nl: {
    slug: 'verwarmingstoelage',
    nav: 'Verwarmingstoelage',
    card: 'Het bedrag van de toelage van het Sociaal Verwarmingsfonds op uw factuur, en de voorwaarden.',
    title: 'Verwarmingstoelage mazout: bedrag per liter in 2026',
    description: 'Toelage van het Sociaal Verwarmingsfonds voor mazout: 14 tot 20 cent per liter naargelang de factuurprijs, plafond van 1.500 liter en inkomensgrens, 2026.',
    h1: 'Verwarmingstoelage van het Sociaal Verwarmingsfonds',
    intro: 'Hoeveel het Sociaal Verwarmingsfonds kan uitbetalen op uw mazoutlevering, volgens de gefactureerde prijs, de al gesteunde liters en uw gezinssamenstelling.',
    resume: (h) => {
      const { F, p, a, top, low, maxAn } = fonds(h);
      return `Het Sociaal Verwarmingsfonds betaalt via het OCMW van uw gemeente een toelage van ${h.num(low)} tot ${h.num(top)} cent per liter brandstof voor verwarming, volgens de gefactureerde literprijs inclusief btw: hoe duurder de factuur, hoe hoger de steun per liter. Ze geldt voor hoogstens ${h.num(F.litres_max_an)} liter per gezin en per kalenderjaar, dus maximaal ${h.eur(maxAn)} per jaar tegen het hoogste tarief. Voor mazout of lampolie type C gekocht aan de pomp of in kleine hoeveelheden is de toelage een jaarlijks forfait van ${h.eur(F.forfait_pompe)}. Tegen de maximumprijs van ${h.date(h.today)}, ${h.l3(p)} per liter onder 2.000 liter, levert een levering van 1.000 liter ${h.eur(a.montant)} op, tegen ${h.num(a.cents)} cent per liter. Sinds ${h.date(F.revenus_depuis)} geldt voor de categorie lage inkomens een bruto belastbaar jaarinkomen van hoogstens ${h.eur(F.revenu_plafond, 2)}, verhoogd met ${h.eur(F.revenu_par_charge, 2)} per persoon ten laste. De aanvraag gebeurt binnen ${h.num(F.delai_jours)} dagen na de levering.`;
    },
    faqs: (h) => {
      const { F, top } = fonds(h);
      return [
        { q: 'Wat is de hoogste verwarmingstoelage voor mazout over een jaar?', a: `Het Fonds houdt rekening met hoogstens ${h.num(F.litres_max_an)} liter per gezin en per kalenderjaar. Tegen het hoogste tarief van de schaal, ${h.num(top)} cent per liter, is dat ${h.eur((F.litres_max_an * top) / 100)} over het jaar. Bij meerdere leveringen tellen de liters op tot dat plafond, en de aanvraag gebeurt bij het OCMW binnen ${h.num(F.delai_jours)} dagen na de levering.` },
        { q: 'Mijn literprijs daalt door een korting: daalt de verwarmingstoelage dan ook?', a: 'Ja, als de korting de gefactureerde prijs onder een grens van de schaal brengt. Het Fonds gaat uit van de literprijs op de factuur, inclusief btw, niet van de officiële maximumprijs van de dag. Een korting van een paar cent kan dus één cent toelage per liter kosten; in totaal blijft de korting meestal voordeliger.' },
        { q: 'Wie telt als persoon ten laste voor de inkomensgrens van het Verwarmingsfonds?', a: `Volgens het Fonds is een persoon ten laste een gezinslid met een netto jaarinkomen onder ${h.eur(F.revenu_charge_max_net)}. Elke persoon ten laste verhoogt de grens met ${h.eur(F.revenu_par_charge, 2)} boven de basis van ${h.eur(F.revenu_plafond, 2)}. Het inkomen dat telt, is het bruto belastbaar inkomen van het hele gezin.` },
        { q: 'Welke documenten breng ik mee naar het OCMW voor de verwarmingstoelage?', a: 'De energiecel van het OCMW vraagt het aanvraagformulier, een kopie van de factuur of de leveringsbon, een kopie van de identiteitskaart en, naargelang het geval, een bewijs van het gezinsinkomen. In een gebouw met collectieve verwarming is ook een attest van de eigenaar of de syndicus nodig met het aantal appartementen dat de factuur dekt.' },
        { q: 'Ik koop mazout in jerrycans aan het tankstation: heb ik recht op de verwarmingstoelage?', a: `Ja, als u aan de voorwaarden voldoet. Voor mazout of lampolie type C gekocht aan de pomp of in kleine hoeveelheden rekent het Fonds niet per liter: het betaalt een forfait van ${h.eur(F.forfait_pompe)} per jaar. Bewaar de kassabonnen, want ze dienen als aankoopbewijs bij de aanvraag bij het OCMW.` },
      ];
    },
    body: (h) => {
      const { F } = fonds(h);
      return `
<h2>De schaal per liter</h2>
${h.table(['Gefactureerde prijs per liter, incl. btw', 'Toelage per liter', 'Op 1.000 liter', `Op ${h.num(F.litres_max_an)} liter`], bareme(h), 'Schaal van het Sociaal Verwarmingsfonds, opgevraagd op 21 oktober 2026; de prijsgrenzen behoren niet tot de schijf die ze afsluiten.', ['l', 'r', 'r', 'r'])}
<p>Het Fonds publiceert de schaal op zijn ${h.src('fondsBedrag', 'pagina over het bedrag van de toelage')} (Franstalige versie: ${h.src('fondsMontant', 'quel est le montant')}). Elke prijsgrens hoort niet bij de schijf die ze afsluit: een gefactureerde prijs die precies op een grens valt, komt in de volgende, gunstigere schijf. De tool past precies die schaal toe op de prijs die u invult, en vertrekt van de maximumprijs van vandaag als u niets wijzigt.</p>
<h2>Wat de tool doet</h2>
<p>U vult de literprijs op uw factuur in, de geleverde liters, de liters die sinds 1 januari al gesteund werden en het aantal personen ten laste. De tool zoekt de schijf in de schaal, houdt de liters bij die onder het jaarplafond van ${h.num(F.litres_max_an)} liter blijven en berekent de mogelijke toelage voor deze levering. Hij toont ook de inkomensgrens voor uw gezin en de termijn voor de aanvraag. De berekening is indicatief: alleen het OCMW beslist, na onderzoek van uw situatie.</p>
<h2>Wie er recht op heeft</h2>
<p>Volgens de ${h.src('fondsQui', 'pagina over de rechthebbenden')} van het Fonds gaat het om drie categorieën gezinnen. De eerste zijn personen met recht op de verhoogde tegemoetkoming in de ziekteverzekering, het zogenaamde VT- of BIM-statuut. De tweede zijn gezinnen met een laag inkomen, onder de grens hieronder. De derde zijn personen in schuldbemiddeling of collectieve schuldenregeling die hun verwarmingsfactuur niet kunnen betalen.</p>
${h.table(['Personen ten laste', 'Maximaal bruto belastbaar jaarinkomen'], plafonds(h), `Grens van de categorie lage inkomens, van kracht sinds ${h.date(F.revenus_depuis)}.`, ['l', 'r'])}
<h2>De aanvraag bij het OCMW</h2>
<p>U dient de aanvraag in bij het OCMW van de gemeente waar u woont, meestal bij de energiecel, binnen ${h.num(F.delai_jours)} dagen na de levering; de leverdatum is die op de factuur. De ${h.src('fondsDemande', 'pagina over de aanvraag')} van het Fonds somt de stukken op: het formulier, een kopie van de factuur of het aankoopbewijs, een kopie van de identiteitskaart en zo nodig een inkomensbewijs. Bij collectieve verwarming vermeldt het attest van de eigenaar of syndicus het aantal appartementen dat in de factuur zit.</p>
<p>De termijn van ${h.num(F.delai_jours)} dagen is het punt waarop de toelage het vaakst verloren gaat: noteer hem meteen bij de levering. Om tegelijk na te gaan of de gefactureerde prijs het wettelijke plafond van de dag respecteert, vergelijkt u hem met de ${h.a('mazout-demain', 'maximumprijs van mazout')} en leest u de gids over de ${h.a('prix-maximum', 'maximumprijs')}. Om de steun in de uitgaven van een jaar te plaatsen, gebruikt u het ${h.a('budget-chauffage', 'stookbudget')}.</p>
<p>Deze site is noch het Sociaal Verwarmingsfonds noch een OCMW: hij neemt hun gepubliceerde regels over om u te helpen de aanvraag voor te bereiden, zonder ze in uw plaats te kunnen indienen.</p>`;
    },
  },
  en: {
    slug: 'heating-allowance',
    nav: 'Heating allowance',
    card: 'What the Social Heating Fund allowance comes to on your invoice, and the conditions to meet.',
    title: 'Heating allowance for heating oil: amount per litre 2026',
    description: 'Belgian Social Heating Fund allowance for heating oil: 14 to 20 cents a litre by invoiced price, a 1,500-litre cap, income limits and the 60-day deadline, 2026.',
    h1: 'Heating allowance from the Social Heating Fund',
    intro: 'How much the Social Heating Fund may pay on your heating oil delivery, depending on the invoiced price, the litres already covered and your household.',
    resume: (h) => {
      const { F, p, a, top, low, maxAn } = fonds(h);
      return `Belgium’s Social Heating Fund pays, through the CPAS/OCMW of your municipality (the local public social welfare centre), an allowance of ${h.num(low)} to ${h.num(top)} cents per litre of heating fuel, depending on the price per litre invoiced including VAT: the dearer the invoice, the higher the help per litre. It covers at most ${h.num(F.litres_max_an)} litres per household per calendar year, so no more than ${h.eur(maxAn)} a year at the highest rate. For heating oil or type C kerosene bought at the pump or in small quantities, the allowance is a flat ${h.eur(F.forfait_pompe)} a year. At the maximum price of ${h.date(h.today)}, ${h.l3(p)} a litre under 2,000 litres, a 1,000-litre delivery would bring ${h.eur(a.montant)}, at ${h.num(a.cents)} cents a litre. Since ${h.date(F.revenus_depuis)}, the low-income category covers gross taxable yearly income of up to ${h.eur(F.revenu_plafond, 2)}, plus ${h.eur(F.revenu_par_charge, 2)} per dependant. The application must be made within ${h.num(F.delai_jours)} days of delivery.`;
    },
    faqs: (h) => {
      const { F, top } = fonds(h);
      return [
        { q: 'What is the most the heating allowance can pay for heating oil in a year?', a: `The Fund takes into account at most ${h.num(F.litres_max_an)} litres per household per calendar year. At the top rate of the scale, ${h.num(top)} cents a litre, that comes to ${h.eur((F.litres_max_an * top) / 100)} over the year. With several deliveries the litres add up to that cap, and the claim is made at the CPAS/OCMW within ${h.num(F.delai_jours)} days of the delivery.` },
        { q: 'My dealer gives me a discount: does the heating allowance fall too?', a: 'Yes, if the discount takes the invoiced price below one of the scale’s limits. The Fund uses the price per litre shown on the invoice, VAT included, not the day’s official maximum price. A discount of a few cents can therefore cost one cent of allowance per litre; overall, the discount is usually still worth more.' },
        { q: 'Who counts as a dependant for the Social Heating Fund income limit?', a: `According to the Fund, a dependant is a household member whose net yearly income is below ${h.eur(F.revenu_charge_max_net)}. Each dependant raises the limit by ${h.eur(F.revenu_par_charge, 2)} above the base of ${h.eur(F.revenu_plafond, 2)}. The income that counts is the gross taxable income of the whole household.` },
        { q: 'Which documents should I take to the CPAS/OCMW to claim the heating allowance?', a: 'The CPAS/OCMW energy unit asks for the application form, a copy of the invoice or delivery note, a copy of your identity card and, where needed, proof of household income. In a building with collective heating you also need a certificate from the owner or the managing agent stating how many flats the invoice covers.' },
        { q: 'I buy heating oil in cans at a filling station: can I get the heating allowance?', a: `Yes, if you meet the conditions. For heating oil or type C kerosene bought at the pump or in small quantities, the Fund does not count per litre: it pays a flat ${h.eur(F.forfait_pompe)} a year. Keep the till receipts, as they serve as proof of purchase when you apply.` },
      ];
    },
    body: (h) => {
      const { F } = fonds(h);
      return `
<h2>The scale per litre</h2>
${h.table(['Invoiced price per litre, VAT included', 'Allowance per litre', 'On 1,000 litres', `On ${h.num(F.litres_max_an)} litres`], bareme(h), 'Social Heating Fund scale read on 21 October 2026; each price limit is excluded from the band it closes.', ['l', 'r', 'r', 'r'])}
<p>The Fund publishes the scale on its ${h.src('fondsMontant', 'page on the amount')} (Dutch version: ${h.src('fondsBedrag', 'hoeveel bedraagt de toelage')}); both pages are in French or Dutch only. Each price limit is excluded from the band it closes: an invoiced price exactly on a limit falls into the next, more generous band. The tool applies that scale exactly to the price you enter, starting from today’s maximum price if you change nothing.</p>
<h2>What the tool does</h2>
<p>You enter the price per litre on your invoice, the litres delivered, the litres already covered since 1 January and the number of dependants. The tool finds the band in the scale, keeps the litres that stay under the yearly cap of ${h.num(F.litres_max_an)} litres and works out the possible allowance for that delivery. It also shows the income limit for your household and the deadline to apply. The result is indicative: only the CPAS/OCMW decides, after reviewing your situation.</p>
<h2>Who is eligible</h2>
<p>According to the Fund’s ${h.src('fondsQui', 'eligibility page')}, three categories of households qualify. The first is people entitled to the increased reimbursement of health insurance, known in Belgium as BIM (French) or VT (Dutch) status. The second is low-income households, under the limit below. The third is people in debt mediation or a collective debt settlement who cannot pay their heating bill.</p>
${h.table(['Dependants', 'Maximum gross taxable yearly income'], plafonds(h), `Limit for the low-income category, in force since ${h.date(F.revenus_depuis)}.`, ['l', 'r'])}
<h2>Applying at the CPAS/OCMW</h2>
<p>You apply to the CPAS/OCMW of the municipality where you live, usually its energy unit, within ${h.num(F.delai_jours)} days of delivery; the delivery date is the one on the invoice. The Fund’s ${h.src('fondsDemande', 'page on applying')} lists the documents: the form, a copy of the invoice or proof of purchase, a copy of your identity card and, if needed, proof of income. With collective heating, the owner’s or managing agent’s certificate states how many flats the invoice includes.</p>
<p>The ${h.num(F.delai_jours)}-day deadline is where the allowance is most often lost: note it down on the day of delivery. To check at the same time that the invoiced price respects the day’s legal ceiling, compare it with the ${h.a('mazout-demain', 'heating oil maximum price')} and read the guide to the ${h.a('prix-maximum', 'maximum price')}. To see the allowance against a year’s spending, use the ${h.a('budget-chauffage', 'heating oil budget')}.</p>
<p>This site is neither the Social Heating Fund nor a CPAS/OCMW: it reproduces their published rules to help you prepare the application, and cannot submit it for you.</p>`;
    },
  },
});
