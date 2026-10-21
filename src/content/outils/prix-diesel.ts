import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Prix du diesel : B7 et B10, tarif du jour, lendemain, mouvements de l'année, lecture professionnelle. */
const B7 = 'diesel_b7' as const, B10 = 'diesel_b10' as const;
/** Centimes sans signe (« 1,2 c »). */
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const s7 = M.situation(B7, t), s10 = M.situation(B10, t);
  const p7 = s7.price!, p10 = s10.price!;
  const gap = Math.round((p7 - p10) * 1000) / 1000;
  const st = M.changeStats(B7), stE = M.changeStats('e10_95');
  const r7 = M.range(B7, 365, t), r10 = M.range(B10, 365, t);
  const last = M.lastTariff(B7), last10 = M.lastTariff(B10);
  return { M, t, s7, s10, p7, p10, gap, st, stE, r7, r10, last, last10, lc: M.lastChange(B7, t), e30: M.evolution(B7, 30, t), e30b: M.evolution(B10, 30, t), e364: M.evolution(B7, 364, t), C: h.P.contrat };
}

/** Phrase « demain » du B7 : tarif officiel publié ou estimation, jamais présentée comme un fait. */
function demain(h: Helpers, d: ReturnType<typeof D>) {
  const tm = d.s7.tomorrow;
  if (tm.official) {
    if (tm.delta === 0) return h.T(`Pour le ${h.date(tm.day)}, le tarif officiel est déjà publié et le B7 ne bouge pas.`, `Voor ${h.date(tm.day)} is het officiële tarief al gepubliceerd en blijft B7 ongewijzigd.`, `For ${h.date(tm.day)} the official tariff is already out and B7 stays where it is.`);
    return h.T(`Pour le ${h.date(tm.day)}, le tarif officiel est déjà publié : ${h.l3(tm.price)}, soit ${h.cts(tm.delta)} par litre.`, `Voor ${h.date(tm.day)} is het officiële tarief al gepubliceerd: ${h.l3(tm.price)}, of ${h.cts(tm.delta)} per liter.`, `For ${h.date(tm.day)} the official tariff is already out: ${h.l3(tm.price)}, a move of ${h.cts(tm.delta)} a litre.`);
  }
  const e = tm.est;
  return h.T(`Le tarif du ${h.date(tm.day)} n’est pas encore publié : notre estimation, qui n’est pas un tarif officiel, reste à ${h.l3(e.central)}, dans une fourchette de ${h.l3(e.low)} à ${h.l3(e.high)}.`, `Het tarief voor ${h.date(tm.day)} is nog niet gepubliceerd: onze schatting, geen officieel tarief, blijft op ${h.l3(e.central)}, met een vork van ${h.l3(e.low)} tot ${h.l3(e.high)}.`, `The tariff for ${h.date(tm.day)} is not out yet: our estimate, which is not an official tariff, stays at ${h.l3(e.central)}, within a range of ${h.l3(e.low)} to ${h.l3(e.high)}.`);
}

function gapPhrase(h: Helpers, d: ReturnType<typeof D>) {
  if (d.gap === 0) return h.T('exactement le même prix que le B7', 'precies dezelfde prijs als B7', 'exactly the same price as B7');
  return d.gap > 0
    ? h.T(`${c(h, d.gap)} de moins que le B7`, `${c(h, d.gap)} minder dan B7`, `${c(h, d.gap)} less than B7`)
    : h.T(`${c(h, d.gap)} de plus que le B7`, `${c(h, d.gap)} meer dan B7`, `${c(h, d.gap)} more than B7`);
}

const resume = (h: Helpers) => {
  const d = D(h);
  return h.T(
    `Le prix maximum officiel du diesel B7 en Belgique est de ${h.l3(d.p7)} le litre le ${h.date(d.t)}, TVA de 21 % comprise, et celui du diesel B10 de ${h.l3(d.p10)}, soit ${gapPhrase(h, d)}. Ces plafonds sont fixés par le SPF Économie dans le cadre du contrat-programme conclu entre l’État belge et la fédération pétrolière Energia : une station ne peut pas vendre plus cher, elle peut vendre moins cher. ${demain(h, d)} Sur les 365 derniers jours, le tarif du B7 a changé ${h.num(d.st.changed)} fois, ${h.num(d.st.up)} hausses pour ${h.num(d.st.down)} baisses, avec un mouvement moyen de ${c(h, d.st.meanAbs)} par litre à chaque changement ; il a oscillé entre ${h.l3(d.r7.min[1])} le ${h.date(d.r7.min[0])} et ${h.l3(d.r7.max[1])} le ${h.date(d.r7.max[0])}. Un plein de 50 litres de B7 coûte au plus ${h.eur(d.p7 * 50, 2)} au tarif du jour.`,
    `De officiële maximumprijs van diesel B7 in België bedraagt op ${h.date(d.t)} ${h.l3(d.p7)} per liter, inclusief 21 % btw, en die van diesel B10 ${h.l3(d.p10)}, dus ${gapPhrase(h, d)}. Die plafonds legt de FOD Economie vast in het kader van de programmaovereenkomst tussen de Belgische Staat en de petroleumfederatie Energia: een tankstation mag niet duurder verkopen, wel goedkoper. ${demain(h, d)} Over de voorbije 365 dagen veranderde het B7-tarief ${h.num(d.st.changed)} keer, ${h.num(d.st.up)} stijgingen tegenover ${h.num(d.st.down)} dalingen, met een gemiddelde beweging van ${c(h, d.st.meanAbs)} per liter bij elke wijziging; de prijs schommelde tussen ${h.l3(d.r7.min[1])} op ${h.date(d.r7.min[0])} en ${h.l3(d.r7.max[1])} op ${h.date(d.r7.max[0])}. Een tankbeurt van 50 liter B7 kost vandaag hoogstens ${h.eur(d.p7 * 50, 2)}.`,
    `The official maximum price of diesel B7 in Belgium is ${h.l3(d.p7)} a litre on ${h.date(d.t)}, including 21% VAT, and diesel B10 is capped at ${h.l3(d.p10)}, which is ${gapPhrase(h, d)}. These ceilings are set by the FPS Economy under the programme agreement between the Belgian State and the petroleum federation Energia: a filling station may not charge more, though it may charge less. ${demain(h, d)} Over the last 365 days the B7 tariff changed ${h.num(d.st.changed)} times, ${h.num(d.st.up)} rises against ${h.num(d.st.down)} cuts, with an average move of ${c(h, d.st.meanAbs)} a litre each time; it ranged from ${h.l3(d.r7.min[1])} on ${h.date(d.r7.min[0])} to ${h.l3(d.r7.max[1])} on ${h.date(d.r7.max[0])}. A 50-litre fill-up of B7 costs at most ${h.eur(d.p7 * 50, 2)} at today’s tariff.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  const plusSouvent = d.st.changed > d.stE.changed, egal = d.st.changed === d.stE.changed;
  return [
    {
      q: h.T('Quelle différence entre le diesel B7 et le diesel B10 ?', 'Wat is het verschil tussen diesel B7 en diesel B10?', 'What is the difference between diesel B7 and diesel B10?'),
      a: h.T(
        `Le chiffre indique la part maximale de biodiesel mélangé au gazole : jusqu’à 7 % en volume pour le B7, jusqu’à 10 % pour le B10. Les deux ont leur propre ligne dans le tarif officiel et donc leur propre prix maximum. Le ${h.date(d.t)}, le B10 est plafonné à ${h.l3(d.p10)} contre ${h.l3(d.p7)} pour le B7.`,
        `Het cijfer geeft het maximale aandeel biodiesel in de diesel aan: tot 7 % in volume voor B7, tot 10 % voor B10. Beide hebben een eigen regel in het officiële tarief en dus een eigen maximumprijs. Op ${h.date(d.t)} is B10 begrensd op ${h.l3(d.p10)} tegenover ${h.l3(d.p7)} voor B7.`,
        `The number gives the maximum share of biodiesel blended into the diesel: up to 7% by volume for B7, up to 10% for B10. Each has its own line in the official tariff and therefore its own maximum price. On ${h.date(d.t)} B10 is capped at ${h.l3(d.p10)} against ${h.l3(d.p7)} for B7.`),
    },
    {
      q: h.T('Ma voiture diesel peut-elle rouler au B10 ?', 'Mag mijn dieselwagen B10 tanken?', 'Can my diesel car run on B10?'),
      a: h.T(
        'Pas forcément. Tous les constructeurs n’autorisent pas le B10 sur tous leurs moteurs, surtout les plus anciens. La réponse figure dans le carnet d’entretien ou sur l’étiquette de compatibilité collée près de la trappe à carburant, qui reprend le même symbole que le pistolet de la pompe. En cas de doute, le B7 reste le carburant diesel accepté par le plus grand nombre de véhicules.',
        'Niet noodzakelijk. Niet elke constructeur laat B10 toe in al zijn motoren, zeker niet in oudere. Het antwoord staat in het onderhoudsboekje of op het compatibiliteitslabel bij de tankklep, met hetzelfde symbool als op het pistool aan de pomp. Twijfelt u, dan blijft B7 de diesel die door de meeste voertuigen aanvaard wordt.',
        'Not necessarily. Not every manufacturer approves B10 for all its engines, older ones especially. The answer is in the service book or on the compatibility label near the fuel filler flap, which carries the same symbol as the pump nozzle. When in doubt, B7 remains the diesel accepted by the widest range of vehicles.'),
    },
    {
      q: h.T('Le prix du diesel change-t-il plus souvent que celui de l’essence ?', 'Verandert de dieselprijs vaker dan de benzineprijs?', 'Does the diesel price change more often than the petrol price?'),
      a: h.T(
        `Sur les 365 derniers jours, le tarif du B7 a changé ${h.num(d.st.changed)} fois et celui de l’essence 95 E10 ${h.num(d.stE.changed)} fois. ${egal ? 'Les deux carburants ont donc bougé aussi souvent l’un que l’autre.' : plusSouvent ? 'Le diesel a donc bougé plus souvent, ce qui rend son prix du lendemain un peu moins prévisible.' : 'Le diesel a donc bougé moins souvent sur la période.'} Chaque nouveau tarif suit les cotations internationales du produit concerné, qui ne varient pas au même rythme pour le gazole et pour l’essence.`,
        `Over de voorbije 365 dagen veranderde het B7-tarief ${h.num(d.st.changed)} keer en dat van benzine 95 E10 ${h.num(d.stE.changed)} keer. ${egal ? 'Beide brandstoffen bewogen dus even vaak.' : plusSouvent ? 'Diesel bewoog dus vaker, waardoor de prijs van morgen iets minder voorspelbaar is.' : 'Diesel bewoog in die periode dus minder vaak.'} Elk nieuw tarief volgt de internationale noteringen van het betrokken product, en die schommelen voor diesel en benzine niet in hetzelfde ritme.`,
        `Over the last 365 days the B7 tariff changed ${h.num(d.st.changed)} times and the 95 E10 petrol tariff ${h.num(d.stE.changed)} times. ${egal ? 'Both fuels therefore moved equally often.' : plusSouvent ? 'Diesel therefore moved more often, which makes its next-day price slightly less predictable.' : 'Diesel therefore moved less often over the period.'} Each new tariff follows the international quotations for the product concerned, and those do not move at the same pace for diesel and for petrol.`),
    },
    {
      q: h.T('Le diesel est-il moins cher hors TVA pour une entreprise ?', 'Hoeveel kost diesel zonder btw voor een bedrijf?', 'What does diesel cost excluding VAT for a business?'),
      a: d.last && d.last.excl != null
        ? h.T(
          `Le dernier tarif officiel publié, celui du ${h.date(d.last.day)}, fixe le B7 à ${h.l3(d.last.excl)} hors TVA et ${h.l3(d.last.incl)} TVA comprise. La TVA belge sur le carburant est de 21 %. La part que votre entreprise peut récupérer dépend de l’usage du véhicule et des règles fiscales qui vous concernent : votre comptable la détermine, le prix maximum ne la change pas.`,
          `Het laatst gepubliceerde officiële tarief, dat van ${h.date(d.last.day)}, legt B7 vast op ${h.l3(d.last.excl)} exclusief btw en ${h.l3(d.last.incl)} inclusief btw. De Belgische btw op brandstof bedraagt 21 %. Welk deel uw bedrijf kan recupereren, hangt af van het gebruik van het voertuig en van de fiscale regels die voor u gelden: uw boekhouder bepaalt dat, de maximumprijs verandert er niets aan.`,
          `The latest official tariff published, for ${h.date(d.last.day)}, sets B7 at ${h.l3(d.last.excl)} excluding VAT and ${h.l3(d.last.incl)} including VAT. Belgian VAT on fuel is 21%. How much of it your business can recover depends on how the vehicle is used and on the tax rules that apply to you: your accountant works that out, and the maximum price does not change it.`)
        : h.T(
          'Le tarif officiel publie le prix maximum hors TVA et TVA comprise ; la TVA belge sur le carburant est de 21 %. La part que votre entreprise peut récupérer dépend de l’usage du véhicule et des règles fiscales qui vous concernent : votre comptable la détermine, et le prix maximum affiché à la pompe, lui, s’entend toujours TVA comprise.',
          'Het officiële tarief vermeldt de maximumprijs exclusief en inclusief btw; de Belgische btw op brandstof bedraagt 21 %. Welk deel uw bedrijf kan recupereren, hangt af van het gebruik van het voertuig en van de fiscale regels die voor u gelden: uw boekhouder bepaalt dat, en de maximumprijs aan de pomp is altijd inclusief btw.',
          'The official tariff gives the maximum price excluding and including VAT; Belgian VAT on fuel is 21%. How much your business can recover depends on how the vehicle is used and on the tax rules that apply to you: your accountant works that out, and the maximum shown at the pump always includes VAT.'),
    },
    {
      q: h.T('Que faire si une station affiche un diesel au-dessus du maximum ?', 'Wat als een tankstation diesel boven de maximumprijs aanrekent?', 'What if a station charges more than the maximum for diesel?'),
      a: h.T(
        'Vérifiez d’abord la date : le maximum qui s’applique est celui du jour de votre plein, pas celui de la veille. Si le prix affiché dépasse bien le plafond de ce jour-là, la vente est interdite par le système des prix maximums. Gardez le ticket, notez l’adresse et l’heure : ConsumerConnect, le service consommateurs du SPF Économie, rappelle que la loi interdit de dépasser les prix maximums et permet de signaler l’infraction à ses services d’inspection (consumerconnect.be, rubrique Énergie, produits pétroliers).',
        'Controleer eerst de datum: de maximumprijs die telt, is die van de dag van uw tankbeurt, niet die van de dag ervoor. Ligt de prijs echt boven het plafond van die dag, dan is de verkoop verboden door het systeem van maximumprijzen. Bewaar het ticket en noteer adres en uur: ConsumerConnect, de consumentendienst van de FOD Economie, herinnert eraan dat de wet hogere prijzen dan de maximumprijzen verbiedt, en laat u de inbreuk melden aan de inspectiediensten (consumerconnect.be, thema Energie, aardolieproducten).',
        'Check the date first: the maximum that applies is the one for the day you filled up, not the day before. If the displayed price really is above that day’s ceiling, the sale breaches the maximum price system. Keep the receipt and note the address and time: ConsumerConnect, the FPS Economy’s consumer service, states that the law prohibits prices above the set maximums and lets you report the infringement to its inspection services (consumerconnect.be, Energy theme, petroleum products).'),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h);
  const row = (k: typeof B7 | typeof B10, p: number, e30: number | null, r: { min: [string, number]; max: [string, number]; mean: number }) => {
    const s = d.M.situation(k, d.t), tm = s.tomorrow;
    return [d.M.NOM[k][h.lang], h.l3(p), tm.official ? h.l3(tm.price) : `${h.l3(tm.est.central)} (${h.T('estimation', 'schatting', 'estimate')})`, e30 == null ? '—' : h.cts(e30), h.l3(r.min[1]), h.l3(r.max[1]), h.l3(r.mean)];
  };
  const tbl = h.table(
    h.T(['Carburant', 'Aujourd’hui', 'Demain', 'Sur 30 jours', 'Plus bas sur un an', 'Plus haut', 'Moyenne'], ['Brandstof', 'Vandaag', 'Morgen', 'Over 30 dagen', 'Laagste over een jaar', 'Hoogste', 'Gemiddelde'], ['Fuel', 'Today', 'Tomorrow', 'Over 30 days', 'Lowest over a year', 'Highest', 'Average']),
    [row(B7, d.p7, d.e30, d.r7), row(B10, d.p10, d.e30b, d.r10)],
    h.T(`Prix maximum au litre, TVA comprise, au ${h.date(d.t)} (série quotidienne be.STAT).`, `Maximumprijs per liter, incl. btw, op ${h.date(d.t)} (dagreeks be.STAT).`, `Maximum price a litre, VAT included, on ${h.date(d.t)} (be.STAT daily series).`),
    ['l', 'r', 'r', 'r', 'r', 'r', 'r']);
  const centime1000 = h.eur(10, 0);
  const an = d.e364 == null ? '' : d.e364 === 0
    ? h.T('Sur un an, le B7 revient exactement à son niveau d’il y a douze mois.', 'Over een jaar staat B7 precies op het niveau van twaalf maanden geleden.', 'Over a year, B7 is back exactly where it stood twelve months ago.')
    : h.T(`Sur un an, le B7 a ${d.e364 > 0 ? 'gagné' : 'perdu'} ${c(h, d.e364)} par litre, soit ${h.eur(Math.abs(d.e364) * 1000, 0)} sur 1 000 litres.`, `Over een jaar is B7 ${c(h, d.e364)} per liter ${d.e364 > 0 ? 'duurder' : 'goedkoper'} geworden, of ${h.eur(Math.abs(d.e364) * 1000, 0)} op 1.000 liter.`, `Over a year B7 has ${d.e364 > 0 ? 'risen' : 'fallen'} by ${c(h, d.e364)} a litre, or ${h.eur(Math.abs(d.e364) * 1000, 0)} on 1,000 litres.`);
  const lc = d.lc
    ? h.T(`Le dernier nouveau tarif du B7 est entré en vigueur le ${h.date(d.lc.day)}, avec une variation de ${h.cts(d.lc.price - d.lc.before)} par litre.`, `Het laatste nieuwe B7-tarief ging in op ${h.date(d.lc.day)}, met een wijziging van ${h.cts(d.lc.price - d.lc.before)} per liter.`, `The latest new B7 tariff took effect on ${h.date(d.lc.day)}, with a change of ${h.cts(d.lc.price - d.lc.before)} a litre.`)
    : '';
  const C = d.C;
  const yE = new Map(d.M.yearly('e10_95'));
  const yrs = d.M.yearly(B7).filter(([y]) => yE.has(y));
  const plusCher = yrs.filter(([y, v]) => v > yE.get(y)!).length;
  const y0 = yrs[0]?.[0] ?? '', y1 = yrs[yrs.length - 1]?.[0] ?? '';
  const pE = d.M.priceOn('e10_95', d.t)!;
  return h.T(`
<h2>B7 ou B10 : deux lignes du tarif officiel</h2>
<p>Le tarif officiel des produits pétroliers donne deux prix pour le diesel routier. Le B7 contient jusqu’à 7 % de biodiesel, le B10 jusqu’à 10 %. Ils se vendent côte à côte, mais leur prix maximum est calculé séparément et l’écart entre les deux varie d’un jour à l’autre. Le tableau reprend les deux, du jour au lendemain et sur un an.</p>
${tbl}
<p>${lc} ${an} Le détail jour par jour se trouve sur la page ${h.a('historique-carburants', 'historique des prix des carburants')}, et le prix du lendemain, avec la fréquence de changement propre au diesel, sur ${h.a('diesel-demain', 'prix du diesel demain')}.</p>
<h2>Pour un indépendant ou une flotte : le maximum comme repère de contrôle</h2>
<p>Quand on fait beaucoup de kilomètres, le prix maximum sert d’abord à vérifier. Le prix payé à la pompe, ou celui qui apparaît sur un relevé de carte carburant, ne peut pas dépasser le maximum du jour de la transaction. Comparer les deux ligne par ligne suffit à repérer une erreur de date ou de produit. Chaque centime au litre représente ${centime1000} sur 1 000 litres : sur un véhicule qui avale plusieurs milliers de litres par an, l’écart entre deux semaines peut peser plus que prévu. La page ${h.a('budget-carburant', 'budget carburant')} traduit ce prix en coût annuel à partir de vos kilomètres et de votre consommation.</p>
<h2>Diesel ou essence : lequel coûte le plus ?</h2>
<p>Les deux prix suivent des cotations internationales différentes, et rien ne fixe l’ordre entre eux. Sur les moyennes annuelles publiées par Statbel de ${y0} à ${y1}, le B7 a été plus cher que l’essence 95 E10 ${h.num(plusCher)} année${plusCher > 1 ? 's' : ''} sur ${h.num(yrs.length)}, l’année en cours comprise. Le projet de loi ${h.src('chambreContrat', `${C.doc_chambre} de la Chambre`)}, déposé le 30 mars 2026, cite le tarif du B7 à ${h.l3(C.tarif_28_fevrier.diesel_b7)} au 28 février 2026 et à ${h.l3(C.tarif_27_mars.diesel_b7)} au 27 mars 2026, contre ${h.l3(C.tarif_27_mars.e10_95)} pour l’essence 95 E10 à cette dernière date. Aujourd’hui, le B7 est ${d.p7 > pE ? `plus cher que l’essence 95 E10, de ${c(h, d.p7 - pE)}` : d.p7 < pE ? `moins cher que l’essence 95 E10, de ${c(h, d.p7 - pE)}` : 'au même prix que l’essence 95 E10'} ; la comparaison de tous les carburants figure sur la page ${h.a('prix-carburant', 'prix des carburants')}.</p>
<h2>Ce que l’outil calcule</h2>
<p>L’outil lit la série quotidienne publiée par Statbel sur ${h.src('bestatJour', 'be.STAT')} : le prix maximum du jour, celui du lendemain s’il est publié, sinon une estimation clairement signalée, puis le coût de votre plein et l’effet sur ce plein des mouvements sur 7 jours, 30 jours et un an. Le calcul de l’estimation est décrit sur la page ${h.a('method', 'méthode')}.</p>`,
  `
<h2>B7 of B10: twee regels in het officiële tarief</h2>
<p>Het officiële tarief van de aardolieproducten geeft twee prijzen voor diesel voor het wegverkeer. B7 bevat tot 7 % biodiesel, B10 tot 10 %. Ze staan naast elkaar aan de pomp, maar hun maximumprijs wordt apart berekend en het verschil tussen beide verandert van dag tot dag. De tabel toont ze allebei, van vandaag tot morgen en over een jaar.</p>
${tbl}
<p>${lc} ${an} Het verloop dag per dag staat op de pagina ${h.a('historique-carburants', 'evolutie van de brandstofprijzen')}, en de prijs van morgen, met de wijzigingsfrequentie die eigen is aan diesel, op ${h.a('diesel-demain', 'dieselprijs morgen')}.</p>
<h2>Voor zelfstandigen en wagenparken: het maximum als controlepunt</h2>
<p>Wie veel kilometers rijdt, gebruikt de maximumprijs in de eerste plaats om te controleren. De prijs aan de pomp, of die op het overzicht van een tankkaart, mag niet hoger liggen dan het maximum van de dag van de transactie. Beide regel per regel naast elkaar leggen volstaat om een fout in datum of product te vinden. Elke cent per liter is ${centime1000} op 1.000 liter: bij een voertuig dat duizenden liters per jaar verbruikt, kan het verschil tussen twee weken zwaarder doorwegen dan verwacht. De pagina ${h.a('budget-carburant', 'brandstofbudget')} zet de prijs om in een jaarkost op basis van uw kilometers en uw verbruik.</p>
<h2>Diesel of benzine: wat is duurder?</h2>
<p>Beide prijzen volgen verschillende internationale noteringen, en niets legt de volgorde vast. Op de jaargemiddelden die Statbel van ${y0} tot ${y1} publiceert, was B7 ${h.num(plusCher)} van de ${h.num(yrs.length)} jaren duurder dan benzine 95 E10, het lopende jaar inbegrepen. Het wetsvoorstel ${h.src('chambreContrat', `${C.doc_chambre} van de Kamer`)}, ingediend op 30 maart 2026, vermeldt het B7-tarief op ${h.l3(C.tarif_28_fevrier.diesel_b7)} op 28 februari 2026 en op ${h.l3(C.tarif_27_mars.diesel_b7)} op 27 maart 2026, tegenover ${h.l3(C.tarif_27_mars.e10_95)} voor benzine 95 E10 op die laatste datum. Vandaag is B7 ${d.p7 > pE ? `${c(h, d.p7 - pE)} duurder dan` : d.p7 < pE ? `${c(h, d.p7 - pE)} goedkoper dan` : 'even duur als'} benzine 95 E10; de vergelijking van alle brandstoffen staat op de pagina ${h.a('prix-carburant', 'brandstofprijzen')}.</p>
<h2>Wat de tool berekent</h2>
<p>De tool leest de dagreeks die Statbel publiceert op ${h.src('bestatJour', 'be.STAT')}: de maximumprijs van vandaag, die van morgen als ze gepubliceerd is, anders een duidelijk aangeduide schatting, en daarna de kost van uw tankbeurt en het effect daarop van de bewegingen over 7 dagen, 30 dagen en een jaar. De berekening van de schatting staat op de pagina ${h.a('method', 'methode')}.</p>`,
  `
<h2>B7 or B10: two lines of the official tariff</h2>
<p>The official petroleum products tariff gives two prices for road diesel. B7 contains up to 7% biodiesel, B10 up to 10%. They are sold side by side, but each maximum price is worked out separately and the gap between them shifts from day to day. The table sets out both, from today to tomorrow and over a year.</p>
${tbl}
<p>${lc} ${an} The day-by-day record is on the ${h.a('historique-carburants', 'fuel price history')} page, and tomorrow’s price, with diesel’s own pattern of changes, on ${h.a('diesel-demain', 'diesel price tomorrow')}.</p>
<h2>For sole traders and fleets: the maximum as a checkpoint</h2>
<p>When you drive a lot, the maximum price is first of all a way to check. The price paid at the pump, or the one on a fuel card statement, cannot exceed the maximum for the day of the transaction. Setting the two side by side, line by line, is enough to spot a wrong date or a wrong product. Each cent a litre is ${centime1000} on 1,000 litres: for a vehicle that burns through thousands of litres a year, the difference between two weeks can weigh more than expected. The ${h.a('budget-carburant', 'fuel budget')} page turns the price into a yearly cost from your mileage and consumption.</p>
<h2>Diesel or petrol: which costs more?</h2>
<p>The two prices follow different international quotations, and nothing fixes their order. On the yearly averages Statbel publishes from ${y0} to ${y1}, B7 was dearer than 95 E10 petrol in ${h.num(plusCher)} year${plusCher === 1 ? '' : 's'} out of ${h.num(yrs.length)}, the current year included. The Chamber bill ${h.src('chambreContrat', C.doc_chambre)}, tabled on 30 March 2026, quotes the B7 tariff at ${h.l3(C.tarif_28_fevrier.diesel_b7)} on 28 February 2026 and ${h.l3(C.tarif_27_mars.diesel_b7)} on 27 March 2026, against ${h.l3(C.tarif_27_mars.e10_95)} for 95 E10 petrol on that second date. Today B7 is ${d.p7 > pE ? `${c(h, d.p7 - pE)} dearer than` : d.p7 < pE ? `${c(h, d.p7 - pE)} cheaper than` : 'priced the same as'} 95 E10 petrol; every fuel is compared on the ${h.a('prix-carburant', 'fuel prices')} page.</p>
<h2>What the tool works out</h2>
<p>The tool reads the daily series that Statbel publishes on ${h.src('bestatJour', 'be.STAT')}: today’s maximum price, tomorrow’s if it has been published, otherwise a clearly labelled estimate, then the cost of your fill-up and how the moves over 7 days, 30 days and a year affect it. How the estimate is built is set out on the ${h.a('method', 'method')} page.</p>`);
};

export default defineGuide({
  id: 'prix-diesel',
  group: 'carburants',
  order: 2,
  tool: 'produit',
  toolArg: 'diesel',
  related: ['diesel-demain', 'prix-carburant', 'prix-essence', 'budget-carburant', 'historique-carburants'],
  sources: ['bestatJour', 'bestatDernier', 'spfTarif', 'chambreContrat', 'fondsPrix', 'ccPrixMax'],
  fr: {
    slug: 'prix-diesel',
    nav: 'Prix du diesel',
    card: 'Prix maximum du diesel B7 et B10 aujourd’hui, demain et sur un an.',
    title: 'Prix diesel 2026 : prix maximum B7 et B10 en Belgique',
    description: 'Prix du diesel B7 et B10 aujourd’hui en Belgique : prix maximum officiel du SPF Économie, prix de demain, coût de votre plein et évolution sur un an, en 2026.',
    h1: 'Prix du diesel aujourd’hui',
    intro: 'Le prix maximum officiel du diesel B7 et B10, celui de demain dès qu’il est publié, et le coût de votre plein.',
    resume, faqs, body,
  },
  nl: {
    slug: 'dieselprijs',
    nav: 'Dieselprijs',
    card: 'Maximumprijs van diesel B7 en B10 vandaag, morgen en over een jaar.',
    title: 'Dieselprijs 2026: officiële maximumprijs B7 en B10 vandaag',
    description: 'Dieselprijs vandaag in België: officiële maximumprijs van B7 en B10 van de FOD Economie, prijs van morgen, kost van een tankbeurt en verloop over een jaar.',
    h1: 'Dieselprijs vandaag',
    intro: 'De officiële maximumprijs van diesel B7 en B10, die van morgen zodra ze gepubliceerd is, en wat uw tankbeurt kost.',
    resume, faqs, body,
  },
  en: {
    slug: 'diesel-price',
    nav: 'Diesel price',
    card: 'Maximum price of diesel B7 and B10 today, tomorrow and over a year.',
    title: 'Diesel price Belgium 2026: official B7 and B10 maximum',
    description: 'Diesel price in Belgium today: the official B7 and B10 maximum set by the FPS Economy, tomorrow’s price, the cost of a fill-up and the trend over a year, 2026.',
    h1: 'Diesel price today',
    intro: 'The official maximum price of diesel B7 and B10, tomorrow’s as soon as it is published, and what your fill-up costs.',
    resume, faqs, body,
  },
});
