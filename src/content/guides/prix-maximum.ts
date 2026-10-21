import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Chiffres du jour de référence, tous lus dans le tarif officiel (be.STAT). */
const D = (h: Helpers) => {
  const p = (k: 'mazout_lt2000' | 'mazout_ge2000' | 'mazout_pompe' | 'petrole_c_pompe' | 'propane_lt2000' | 'propane_ge2000') => h.M.priceOn(k, h.today)!;
  const lt = p('mazout_lt2000'), ge = p('mazout_ge2000'), po = p('mazout_pompe');
  const last = h.M.lastTariff('mazout_lt2000')!;
  const tvaL = last.excl != null ? last.incl - last.excl : last.incl - last.incl / (1 + h.P.tva);
  const r = h.M.range('mazout_lt2000', 365, h.today);
  return { lt, ge, po, pet: p('petrole_c_pompe'), prLt: p('propane_lt2000'), prGe: p('propane_ge2000'), last, tvaL, r, bande: lt - ge, pompe: po - lt };
};

export default defineGuide({
  id: 'prix-maximum',
  group: 'comprendre',
  order: 10,
  mini: 'ecart',
  miniHref: 'mazout-demain',
  related: ['mazout-demain', 'contrat-programme', 'mazout-2000-litres', 'quand-commander-mazout', 'allocation-chauffage'],
  sources: ['fondsPrix', 'spfTarif', 'bestatJour', 'bestatDernier', 'chambreContrat'],
  fr: {
    slug: 'prix-maximum-mazout',
    nav: 'Prix maximum du mazout',
    card: 'Qui fixe le plafond, ce qu’il comprend et comment vérifier un devis ou une facture.',
    title: 'Prix maximum du mazout 2026 : règle, TVA et facture',
    description: 'Prix maximum du mazout en Belgique : qui le fixe, ce que comprennent les trois prix du tarif, la TVA, le H0 et le H7, et comment contrôler votre devis en 2026.',
    h1: 'Le prix maximum du mazout, expliqué',
    intro: 'Un plafond légal, publié pour chaque jour : ce qu’il couvre, ce qu’il ne dit pas, et comment s’en servir face à un devis.',
    resume: (h) => {
      const d = D(h);
      return `Le prix maximum du mazout est le prix le plus élevé qu’un vendeur peut demander en Belgique pour un litre de gasoil de chauffage, TVA comprise. Le SPF Économie le fixe en application du contrat-programme conclu entre l’État belge et Energia, la fédération du secteur pétrolier, et vendre au-dessus est interdit. Le tarif officiel du ${h.date(h.today)} donne trois prix : ${h.l3(d.lt)} le litre livré en moins de 2 000 litres, ${h.l3(d.ge)} à partir de 2 000 litres et ${h.l3(d.po)} à la pompe. Le prix réellement payé peut être plus bas, jamais plus haut. Depuis le 1er avril 2024, l’ancien gasoil de chauffage 50S a disparu et le tarif vise le H0 et le H7. La TVA de ${h.pct(h.P.tva, 0)} est comprise dans le plafond : dans le dernier tarif publié, elle pèse ${h.l3(d.tvaL)} par litre. Sur les 365 derniers jours, le maximum sous 2 000 litres est allé de ${h.l3(d.r.min[1])} le ${h.date(d.r.min[0])} à ${h.l3(d.r.max[1])} le ${h.date(d.r.max[0])}.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Un négociant a-t-il le droit de facturer le mazout au-dessus du prix maximum du jour ?', a: `Non. Le prix maximum fixé par le SPF Économie est un plafond, et le Fonds Social Chauffage rappelle que vendre au-dessus est interdit. Le négociant peut appliquer une remise, pas un supplément sur le litre. Si une facture dépasse le tarif officiel du jour de livraison, par exemple ${h.l3(d.lt)} le litre sous 2 000 litres au ${h.date(h.today)}, demandez la correction par écrit en joignant le tarif publié.` },
        { q: 'Le H7 et le H0 ont-ils un prix maximum différent ?', a: 'Non. Depuis la disparition du 50S le 1er avril 2024, le tarif officiel publie une seule ligne « gasoil de chauffage H0/H7 » par palier de volume. Le plafond est donc le même pour les deux qualités : le négociant qui vous vend du H7 ne peut pas dépasser le prix maximum publié pour cette ligne, quel que soit le nom commercial qu’il donne au produit.' },
        { q: 'Pourquoi le litre de mazout acheté à la pompe a-t-il un plafond à part ?', a: `Parce que le tarif officiel traite la pompe comme un circuit de vente distinct de la livraison en citerne, avec son propre prix. Au ${h.date(h.today)}, le mazout à la pompe plafonne à ${h.l3(d.po)}, soit ${h.cts(d.pompe)} par rapport au litre livré en moins de 2 000 litres. Pour quelques bidons, c’est ce plafond qui compte ; pour remplir une citerne, ce sont les deux paliers de livraison.` },
        { q: 'Le pétrole lampant et le propane en vrac ont-ils aussi un prix maximum ?', a: `Oui. Le même tarif officiel fixe un prix maximum pour le pétrole lampant de type C à la pompe, ${h.l3(d.pet)} le litre au ${h.date(h.today)}, et pour le propane en vrac, ${h.l3(d.prLt)} en moins de 2 000 litres et ${h.l3(d.prGe)} à partir de 2 000 litres. La règle est identique : le vendeur peut faire moins cher, jamais plus cher.` },
        { q: 'Où consulter soi-même le tarif officiel publié pour une date précise ?', a: 'Le SPF Économie publie le tarif officiel des produits pétroliers sur son site, et Statbel en diffuse la série sur be.STAT, jour par jour, avec les prix hors TVA et TVA comprise. Ce site relit be.STAT et affiche le résultat dans ses tableaux. Pour une facture ancienne, la page historique remonte les 365 derniers jours, ce qui suffit pour la plupart des contrôles.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const hTva = d.last.excl != null ? d.last.excl : d.last.incl / (1 + h.P.tva);
      return `
<h2>Qui fixe le prix maximum, et sur quelle base</h2>
<p>Le prix du mazout n’est pas libre en Belgique, il est plafonné. Le SPF Économie publie le ${h.src('spfTarif', 'tarif officiel des produits pétroliers')} en application du contrat-programme passé entre l’État belge et Energia, la fédération qui représente le secteur pétrolier. Le ${h.src('fondsPrix', 'Fonds Social Chauffage')} le résume en une phrase : il est interdit de vendre au-dessus du prix maximum. Le détail du mécanisme, et la raison pour laquelle personne ne peut recalculer à l’avance le tarif du lendemain, est expliqué dans le guide du ${h.a('contrat-programme', 'contrat-programme')}.</p>
<p>Ce site n’est ni le SPF Économie, ni Statbel, ni le Fonds. Il lit la série publiée sur ${h.src('bestatJour', 'be.STAT')} et la met en forme ; en cas de doute, c’est la publication officielle qui fait foi.</p>
<h2>Les trois prix du mazout dans le tarif</h2>
<p>Le tarif ne donne pas un prix du mazout, mais trois. Deux concernent la livraison en citerne et dépendent du volume livré : moins de 2 000 litres, ou 2 000 litres et plus. Le troisième vise le mazout acheté à la pompe, en petite quantité.</p>
${h.table(['Ligne du tarif', `Prix maximum au ${h.date(h.today)}`, 'Écart avec le palier inférieur'], [
  ['Livré, moins de 2 000 litres', h.l3(d.lt), '–'],
  ['Livré, 2 000 litres et plus', h.l3(d.ge), h.cts(-d.bande)],
  ['À la pompe', h.l3(d.po), h.cts(d.pompe)],
], 'Prix maximums TVA comprise, en euros par litre, tarif officiel relu sur be.STAT.', ['l', 'r', 'r'])}
<p>L’écart entre les deux paliers de livraison est aujourd’hui de ${h.cts(d.bande).replace(/^[+−]/, '')} par litre. Sur 1 500 litres, cela représente ${h.eur(1500 * d.bande)} : c’est la question traitée par la page ${h.a('mazout-2000-litres', 'mazout 2 000 litres')}, qui calcule à partir de quel volume monter au palier supérieur devient rentable. Le tableau suivant reprend le jour et le lendemain pour les trois lignes ; il se met à jour à chaque publication.</p>
<!--tarif:mazout-->
<h2>Prix payé et prix maximum : deux choses différentes</h2>
<p>Le prix maximum est un plafond, pas un prix conseillé. Un négociant peut proposer moins, par exemple sur une grosse commande ou pour se démarquer d’un concurrent. Ce qu’il ne peut pas faire, c’est dépasser le plafond du jour, TVA comprise. Le petit outil en tête de page compare votre devis au maximum du jour : s’il est en dessous, la différence est la remise que vous obtenez ; s’il est au-dessus, la facture n’est pas conforme.</p>
<p>Deux pièges reviennent dans les devis. Le premier est le palier : un devis pour 1 800 litres doit se comparer au prix sous 2 000 litres, pas à celui du palier supérieur, plus bas. Le second est la date : le tarif change souvent, parfois plusieurs jours de suite, si bien qu’un devis accepté un mardi peut être confronté à un autre plafond le jour de la livraison. Pour comparer, prenez le tarif du jour qui figure sur le bon de livraison ou la facture ; si la date retenue n’est pas claire, demandez-la au vendeur avant de payer.</p>
<h2>H0, H7 et l’ancien 50S</h2>
<p>Jusqu’au 31 mars 2024, le tarif officiel visait le gasoil de chauffage 50S, sous ce nom. Le Fonds Social Chauffage indique que le 50S a disparu le 1er avril 2024 et qu’il est remplacé par le H0 et le H7. Dans la série be.STAT, le produit s’appelle désormais « gasoil de chauffage (H0/H7) », avec une seule ligne par palier. Les comparaisons avec des prix d’avant avril 2024 restent possibles, mais elles mettent face à face deux produits qui n’étaient pas exactement les mêmes.</p>
<h2>La TVA est déjà dans le plafond</h2>
<p>Le prix maximum se lit TVA comprise, au taux de ${h.pct(h.P.tva, 0)}. Dans le dernier tarif publié, celui du ${h.date(d.last.day)}, le litre livré en moins de 2 000 litres vaut ${h.l3(hTva)} hors TVA et ${h.l3(d.last.incl)} TVA comprise : la taxe représente ${h.l3(d.tvaL)} par litre. Un devis exprimé hors TVA doit donc être majoré de ${h.pct(h.P.tva, 0)} avant d’être comparé au plafond. À l’inverse, un ménage ne récupère pas cette TVA ; elle fait partie du prix qu’il paie.</p>
<h2>Contrôler une facture en quatre gestes</h2>
<ol>
<li>Repérez sur la facture le volume livré et la date de livraison.</li>
<li>Choisissez la ligne du tarif qui correspond : moins de 2 000 litres, ou 2 000 litres et plus.</li>
<li>Lisez le prix maximum de ce jour-là, sur la page ${h.a('historique-mazout', 'historique du prix du mazout')} ou directement sur be.STAT.</li>
<li>Comparez avec le prix unitaire TVA comprise de la facture ; multipliez l’écart par le volume pour connaître le montant en jeu.</li>
</ol>
<p>Le plafond donne aussi un ordre de grandeur utile avant de commander : ${h.a('mazout-demain', 'le prix maximum de demain')} est affiché dès sa publication, et une estimation, présentée comme telle, le remplace tant qu’il n’est pas publié.</p>
<h2>Ce que le prix maximum ne dit pas</h2>
<p>Le plafond ne renseigne ni sur la qualité du service, ni sur le délai de livraison, ni sur le prix que pratique un négociant en particulier. Il ne tient pas compte non plus des aides : un ménage qui y a droit peut obtenir une allocation du Fonds Social Chauffage, calculée sur le prix facturé ; la page ${h.a('allocation-chauffage', 'allocation chauffage')} en fait le calcul. Enfin, le prix maximum suit les cotations internationales des produits pétroliers : il monte et descend avec elles, et la Chambre a rappelé dans sa ${h.src('chambreContrat', 'proposition de loi de mars 2026')} à quel point il peut bouger en quelques semaines.</p>`;
    },
  },
  nl: {
    slug: 'maximumprijs-mazout',
    nav: 'Maximumprijs mazout',
    card: 'Wie het plafond vastlegt, wat erin zit en hoe u een offerte of factuur nakijkt.',
    title: 'Maximumprijs mazout 2026: regels, btw en uw factuur',
    description: 'Maximumprijs van mazout in België: wie hem vastlegt, wat de drie prijzen van het tarief inhouden, de btw, H0 en H7, en hoe u uw offerte in 2026 controleert.',
    h1: 'De maximumprijs van mazout uitgelegd',
    intro: 'Een wettelijk plafond, voor elke dag gepubliceerd: wat het dekt, wat het niet zegt en hoe u het naast een offerte legt.',
    resume: (h) => {
      const d = D(h);
      return `De maximumprijs van mazout is de hoogste prijs die een verkoper in België mag vragen voor een liter gasolie voor verwarming, btw inbegrepen. De FOD Economie legt hem vast op grond van de programmaovereenkomst tussen de Belgische Staat en Energia, de federatie van de aardoliesector, en verkopen boven dat maximum is verboden. Het officiële tarief van ${h.date(h.today)} kent drie prijzen: ${h.l3(d.lt)} per liter bij levering van minder dan 2.000 liter, ${h.l3(d.ge)} vanaf 2.000 liter en ${h.l3(d.po)} aan de pomp. De prijs die u werkelijk betaalt, mag lager liggen, nooit hoger. Sinds 1 april 2024 bestaat de vroegere gasolie 50S niet meer; het tarief geldt voor H0 en H7. De btw van ${h.pct(h.P.tva, 0)} zit in het plafond: in het laatst gepubliceerde tarief is dat ${h.l3(d.tvaL)} per liter. Over de voorbije 365 dagen schommelde het maximum onder 2.000 liter tussen ${h.l3(d.r.min[1])} op ${h.date(d.r.min[0])} en ${h.l3(d.r.max[1])} op ${h.date(d.r.max[0])}.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Mag een handelaar mazout duurder aanrekenen dan de maximumprijs van die dag?', a: `Nee. De maximumprijs van de FOD Economie is een plafond, en het Sociaal Verwarmingsfonds herinnert eraan dat verkopen boven dat maximum verboden is. De handelaar mag korting geven, geen toeslag op de liter. Ligt een factuur boven het officiële tarief van de leverdag, bijvoorbeeld ${h.l3(d.lt)} per liter onder 2.000 liter op ${h.date(h.today)}, vraag dan schriftelijk een correctie en voeg het gepubliceerde tarief bij.` },
        { q: 'Hebben H7 en H0 een verschillende maximumprijs?', a: 'Nee. Sinds het verdwijnen van 50S op 1 april 2024 publiceert het officiële tarief één regel « gasolie verwarming H0/H7 » per volumeschijf. Het plafond is dus hetzelfde voor beide kwaliteiten: wie u H7 verkoopt, mag de voor die regel gepubliceerde maximumprijs niet overschrijden, welke handelsnaam hij het product ook geeft.' },
        { q: 'Waarom heeft mazout aan de pomp een apart plafond?', a: `Omdat het officiële tarief de pomp als een ander verkoopkanaal behandelt dan de levering in de tank, met een eigen prijs. Op ${h.date(h.today)} ligt het maximum aan de pomp op ${h.l3(d.po)}, of ${h.cts(d.pompe)} tegenover de geleverde liter onder 2.000 liter. Voor een paar jerrycans telt dat plafond; om een tank te vullen tellen de twee leveringsschijven.` },
        { q: 'Gelden er ook maximumprijzen voor lampolie en propaan in bulk?', a: `Ja. Hetzelfde officiële tarief legt een maximumprijs vast voor lampolie type C aan de pomp, ${h.l3(d.pet)} per liter op ${h.date(h.today)}, en voor propaan in bulk, ${h.l3(d.prLt)} onder 2.000 liter en ${h.l3(d.prGe)} vanaf 2.000 liter. De regel is dezelfde: de verkoper mag goedkoper zijn, nooit duurder.` },
        { q: 'Waar kunt u zelf het officiële tarief van een bepaalde datum opzoeken?', a: 'De FOD Economie publiceert het officiële tarief van de aardolieproducten op zijn website, en Statbel verspreidt de reeks op be.STAT, dag per dag, zonder en met btw. Deze site leest be.STAT en toont het resultaat in zijn tabellen. Voor een oudere factuur gaat de pagina met de prijsevolutie 365 dagen terug, wat voor de meeste controles volstaat.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const hTva = d.last.excl != null ? d.last.excl : d.last.incl / (1 + h.P.tva);
      return `
<h2>Wie de maximumprijs vastlegt, en op welke basis</h2>
<p>De prijs van mazout is in België niet vrij, hij is begrensd. De FOD Economie publiceert het ${h.src('spfTarif', 'officiële tarief van de aardolieproducten')} op grond van de programmaovereenkomst tussen de Belgische Staat en Energia, de federatie die de aardoliesector vertegenwoordigt. Het ${h.src('fondsPrix', 'Sociaal Verwarmingsfonds')} vat het samen: verkopen boven de maximumprijs is verboden. Hoe het mechanisme werkt, en waarom niemand het tarief van morgen vooraf kan narekenen, leest u in de gids over de ${h.a('contrat-programme', 'programmaovereenkomst')}.</p>
<p>Deze site is niet de FOD Economie, niet Statbel en niet het Fonds. Hij leest de reeks die op ${h.src('bestatJour', 'be.STAT')} verschijnt en zet ze overzichtelijk op een rij; bij twijfel geldt de officiële publicatie.</p>
<h2>De drie mazoutprijzen in het tarief</h2>
<p>Het tarief geeft niet één mazoutprijs, maar drie. Twee gaan over levering in de tank en hangen af van het geleverde volume: minder dan 2.000 liter, of 2.000 liter en meer. De derde geldt voor mazout die u in kleine hoeveelheden aan de pomp koopt.</p>
${h.table(['Regel van het tarief', `Maximumprijs op ${h.date(h.today)}`, 'Verschil met de lagere schijf'], [
  ['Geleverd, minder dan 2.000 liter', h.l3(d.lt), '–'],
  ['Geleverd, vanaf 2.000 liter', h.l3(d.ge), h.cts(-d.bande)],
  ['Aan de pomp', h.l3(d.po), h.cts(d.pompe)],
], 'Maximumprijzen incl. btw, in euro per liter, officieel tarief zoals gelezen op be.STAT.', ['l', 'r', 'r'])}
<p>Het verschil tussen de twee leveringsschijven bedraagt vandaag ${h.cts(d.bande).replace(/^[+−]/, '')} per liter. Op 1.500 liter is dat ${h.eur(1500 * d.bande)}: daarover gaat de pagina ${h.a('mazout-2000-litres', 'mazout 2.000 liter')}, die berekent vanaf welk volume de hogere schijf de moeite loont. De tabel hieronder toont vandaag en morgen voor de drie regels en wordt bij elke publicatie bijgewerkt.</p>
<!--tarif:mazout-->
<h2>Betaalde prijs en maximumprijs zijn niet hetzelfde</h2>
<p>De maximumprijs is een bovengrens, geen adviesprijs. Een handelaar mag minder vragen, bijvoorbeeld bij een grote bestelling of om zich van een concurrent te onderscheiden. Wat hij niet mag, is het plafond van de dag overschrijden, btw inbegrepen. De kleine rekentool bovenaan legt uw offerte naast het maximum van vandaag: ligt ze eronder, dan is het verschil uw korting; ligt ze erboven, dan is de factuur niet in orde.</p>
<p>In offertes duiken twee valkuilen op. De eerste is de schijf: een offerte voor 1.800 liter vergelijkt u met de prijs onder 2.000 liter, niet met de lagere prijs van de hogere schijf. De tweede is de datum: het tarief verandert vaak, soms dagen na elkaar, zodat een offerte die u op dinsdag aanvaardt op de leverdag tegenover een ander plafond kan staan. Neem voor de vergelijking het tarief van de dag die op de leveringsbon of factuur staat; is die datum niet duidelijk, vraag het dan aan de verkoper voor u betaalt.</p>
<h2>H0, H7 en de vroegere 50S</h2>
<p>Tot 31 maart 2024 gold het officiële tarief voor gasolie verwarming 50S, onder die naam. Volgens het Sociaal Verwarmingsfonds verdween 50S op 1 april 2024 en kwamen H0 en H7 in de plaats. In de be.STAT-reeks heet het product sindsdien « gasolie verwarming (H0/H7) », met één regel per schijf. Vergelijkingen met prijzen van vóór april 2024 blijven mogelijk, maar zetten twee producten tegenover elkaar die niet helemaal dezelfde waren.</p>
<h2>De btw zit al in het plafond</h2>
<p>De maximumprijs is een prijs inclusief ${h.pct(h.P.tva, 0)} btw. In het laatst gepubliceerde tarief, dat van ${h.date(d.last.day)}, kost de geleverde liter onder 2.000 liter ${h.l3(hTva)} zonder btw en ${h.l3(d.last.incl)} met btw: de belasting bedraagt ${h.l3(d.tvaL)} per liter. Een offerte zonder btw moet u dus met ${h.pct(h.P.tva, 0)} verhogen voor u ze met het plafond vergelijkt. Een gezin recupereert die btw niet; ze maakt deel uit van wat het betaalt.</p>
<h2>Een factuur nakijken in vier stappen</h2>
<ol>
<li>Zoek op de factuur het geleverde volume en de leverdatum.</li>
<li>Kies de regel van het tarief die erbij hoort: minder dan 2.000 liter, of vanaf 2.000 liter.</li>
<li>Lees de maximumprijs van die dag af op de pagina ${h.a('historique-mazout', 'evolutie van de mazoutprijs')} of rechtstreeks op be.STAT.</li>
<li>Vergelijk met de eenheidsprijs incl. btw op de factuur en vermenigvuldig het verschil met het volume om het bedrag te kennen.</li>
</ol>
<p>Het plafond geeft ook vóór de bestelling een bruikbare grootteorde: ${h.a('mazout-demain', 'de maximumprijs van morgen')} verschijnt zodra hij gepubliceerd is, en tot dan staat er een schatting, die ook zo wordt genoemd.</p>
<h2>Wat de maximumprijs niet vertelt</h2>
<p>Het plafond zegt niets over de service, de levertermijn of de prijs die één bepaalde handelaar hanteert. Het houdt ook geen rekening met steun: wie er recht op heeft, kan een toelage van het Sociaal Verwarmingsfonds krijgen, berekend op de gefactureerde prijs; de pagina ${h.a('allocation-chauffage', 'verwarmingstoelage')} rekent ze uit. De maximumprijs volgt ten slotte de internationale noteringen van aardolieproducten: hij stijgt en daalt mee, en de Kamer liet in haar ${h.src('chambreContrat', 'wetsvoorstel van maart 2026')} zien hoe snel hij op enkele weken kan bewegen.</p>`;
    },
  },
  en: {
    slug: 'maximum-price-heating-oil',
    nav: 'Maximum price of heating oil',
    card: 'Who sets the cap, what it includes and how to check a quote or an invoice.',
    title: 'Maximum price of heating oil 2026: rules, VAT, invoice',
    description: 'Maximum price of heating oil in Belgium: who sets it, the three prices in the tariff, VAT, the H0 and H7 grades, and how to check a quote or an invoice in 2026.',
    h1: 'The maximum price of heating oil, explained',
    intro: 'A legal cap, published for every day: what it covers, what it leaves out and how to hold it against a quote.',
    resume: (h) => {
      const d = D(h);
      return `The maximum price of heating oil (mazout, as it is called in Belgium) is the highest price a seller may charge for a litre of heating gasoil, VAT included. The FPS Economy, Belgium’s federal economy ministry, sets it under the programme contract between the Belgian State and Energia, the petroleum sector federation, and selling above it is forbidden. The official tariff for ${h.date(h.today)} gives three prices: ${h.l3(d.lt)} a litre delivered in quantities under 2,000 litres, ${h.l3(d.ge)} from 2,000 litres and ${h.l3(d.po)} at the pump. What you actually pay may be lower, never higher. Since 1 April 2024 the former 50S heating gasoil has gone, and the tariff covers the H0 and H7 grades. The ${h.pct(h.P.tva, 0)} VAT is inside the cap: in the latest published tariff it accounts for ${h.l3(d.tvaL)} a litre. Over the last 365 days the maximum under 2,000 litres has ranged from ${h.l3(d.r.min[1])} on ${h.date(d.r.min[0])} to ${h.l3(d.r.max[1])} on ${h.date(d.r.max[0])}.`;
    },
    faqs: (h) => {
      const d = D(h);
      return [
        { q: 'Can a Belgian dealer charge more than the day’s maximum price for heating oil?', a: `No. The maximum price set by the FPS Economy is a ceiling, and the Social Heating Fund points out that selling above it is forbidden. A dealer may give a discount, not a surcharge on the litre. If an invoice is above the official tariff for the delivery day, for instance ${h.l3(d.lt)} a litre under 2,000 litres on ${h.date(h.today)}, ask in writing for a correction and attach the published tariff.` },
        { q: 'Do H7 and H0 heating oil have different maximum prices?', a: 'No. Since 50S disappeared on 1 April 2024, the official tariff publishes a single “heating gasoil H0/H7” line for each volume band. The cap is therefore the same for both grades: a dealer selling you H7 cannot go above the maximum published for that line, whatever trade name the product is given.' },
        { q: 'Why does heating oil bought at the pump have its own cap?', a: `Because the official tariff treats the pump as a separate sales channel from tank delivery, with its own price. On ${h.date(h.today)} the pump maximum is ${h.l3(d.po)}, which is ${h.cts(d.pompe)} compared with a litre delivered in an order under 2,000 litres. For a few jerrycans that is the cap that counts; for filling a tank, the two delivery bands apply.` },
        { q: 'Are kerosene and bulk propane price-capped as well?', a: `Yes. The same official tariff sets a maximum price for type C kerosene at the pump, ${h.l3(d.pet)} a litre on ${h.date(h.today)}, and for bulk propane, ${h.l3(d.prLt)} under 2,000 litres and ${h.l3(d.prGe)} from 2,000 litres. The rule is the same as for heating oil: the seller may charge less, never more.` },
        { q: 'Where can I look up the official tariff for a specific date myself?', a: 'The FPS Economy publishes the official tariff of petroleum products on its website, and Statbel, the Belgian statistics office, releases the series on be.STAT, day by day, excluding and including VAT. This site reads be.STAT and shows the result in its tables. For an older invoice, the history page goes back 365 days, which covers most checks.' },
      ];
    },
    body: (h) => {
      const d = D(h);
      const hTva = d.last.excl != null ? d.last.excl : d.last.incl / (1 + h.P.tva);
      return `
<h2>Who sets the maximum price, and on what basis</h2>
<p>Heating oil is not freely priced in Belgium; it is capped. The FPS Economy publishes the ${h.src('spfTarif', 'official tariff of petroleum products')} under the programme contract between the Belgian State and Energia, the federation representing the oil sector. The ${h.src('fondsPrix', 'Social Heating Fund')} sums it up in a sentence: selling above the maximum price is forbidden. How the mechanism works, and why nobody can recompute tomorrow’s tariff in advance, is covered in the guide to the ${h.a('contrat-programme', 'programme contract')}.</p>
<p>This site is not the FPS Economy, nor Statbel, nor the Fund. It reads the series published on ${h.src('bestatJour', 'be.STAT')} and lays it out; if in doubt, the official publication prevails.</p>
<h2>The three heating oil prices in the tariff</h2>
<p>The tariff does not give one price for heating oil but three. Two apply to tank deliveries and depend on the volume delivered: under 2,000 litres, or 2,000 litres and more. The third applies to heating oil bought at the pump in small quantities.</p>
${h.table(['Tariff line', `Maximum price on ${h.date(h.today)}`, 'Gap with the lower band'], [
  ['Delivered, under 2,000 litres', h.l3(d.lt), '–'],
  ['Delivered, 2,000 litres or more', h.l3(d.ge), h.cts(-d.bande)],
  ['At the pump', h.l3(d.po), h.cts(d.pompe)],
], 'Maximum prices including VAT, in euros per litre, official tariff as read on be.STAT.', ['l', 'r', 'r'])}
<p>The gap between the two delivery bands is ${h.cts(d.bande).replace(/^[+−]/, '')} a litre today. On 1,500 litres that comes to ${h.eur(1500 * d.bande)}: this is the question taken up on the ${h.a('mazout-2000-litres', 'heating oil 2,000 litres')} page, which works out from what volume moving up to the higher band pays. The table below shows today and tomorrow for the three lines and refreshes with each publication.</p>
<!--tarif:mazout-->
<h2>Price paid and maximum price are not the same thing</h2>
<p>The maximum price is a ceiling, not a recommended price. A dealer may quote less, for instance on a large order or to stand out from a competitor. What a dealer may not do is exceed the day’s cap, VAT included. The small calculator at the top of this page sets your quote against today’s maximum: if it is below, the gap is your discount; if it is above, the invoice is not compliant.</p>
<p>Two traps come up in quotes. The first is the band: a quote for 1,800 litres must be compared with the under-2,000 price, not with the lower price of the upper band. The second is the date: the tariff changes often, sometimes several days running, so a quote accepted on a Tuesday may meet a different cap on delivery day. For the comparison, take the tariff for the day shown on the delivery note or invoice; if the date used is unclear, ask the seller before paying.</p>
<h2>H0, H7 and the former 50S</h2>
<p>Until 31 March 2024 the official tariff covered 50S heating gasoil, under that name. The Social Heating Fund states that 50S disappeared on 1 April 2024 and was replaced by H0 and H7. In the be.STAT series the product has since been called “heating gasoil (H0/H7)”, with one line per band. Comparisons with prices from before April 2024 remain possible, but they set two products side by side that were not quite the same.</p>
<h2>VAT is already inside the cap</h2>
<p>The maximum price is quoted including VAT at ${h.pct(h.P.tva, 0)}. In the latest published tariff, for ${h.date(d.last.day)}, a litre delivered under 2,000 litres costs ${h.l3(hTva)} excluding VAT and ${h.l3(d.last.incl)} including it: the tax accounts for ${h.l3(d.tvaL)} a litre. A quote given excluding VAT must therefore be raised by ${h.pct(h.P.tva, 0)} before it is compared with the cap. Households do not reclaim this VAT; it is part of the price they pay.</p>
<h2>Checking an invoice in four steps</h2>
<ol>
<li>Find the volume delivered and the delivery date on the invoice.</li>
<li>Pick the matching tariff line: under 2,000 litres, or 2,000 litres and more.</li>
<li>Read that day’s maximum on the ${h.a('historique-mazout', 'heating oil price history')} page or directly on be.STAT.</li>
<li>Compare it with the unit price including VAT on the invoice, and multiply the gap by the volume to see the amount at stake.</li>
</ol>
<p>The cap is also a useful yardstick before ordering: ${h.a('mazout-demain', 'tomorrow’s maximum price')} appears as soon as it is published, and until then an estimate, labelled as such, takes its place.</p>
<h2>What the maximum price does not tell you</h2>
<p>The cap says nothing about service quality, delivery times or the price any one dealer charges. Nor does it take support into account: households that qualify can receive an allowance from the Social Heating Fund, worked out on the invoiced price, through their CPAS/OCMW, the municipal social welfare centre; the ${h.a('allocation-chauffage', 'heating allowance')} page does the sum. Lastly, the maximum price follows international quotations for petroleum products: it rises and falls with them, and the Chamber of Representatives showed in its ${h.src('chambreContrat', 'March 2026 bill')} how far it can move within a few weeks.</p>`;
    },
  },
});
