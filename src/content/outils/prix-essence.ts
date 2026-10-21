import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Prix de l'essence : 95 E10, 95 E5, 98 E5, 98 E10 ; compatibilité E10, écart 95/98, prix du lendemain. */
const KEYS = ['e10_95', 'e5_95', 'e5_98', 'e10_98'] as const;
type K = (typeof KEYS)[number];
const c = (h: Helpers, d: number) => h.cts(Math.abs(d)).replace(/^[+−]/, '');

function D(h: Helpers) {
  const M = h.M, t = h.today;
  const p = Object.fromEntries(KEYS.map((k) => [k, M.priceOn(k, t)!])) as Record<K, number>;
  const s = M.situation('e10_95', t);
  const st = M.changeStats('e10_95');
  const r = M.range('e10_95', 365, t);
  const g5 = Math.round((p.e5_95 - p.e10_95) * 1000) / 1000;
  const g98 = Math.round((p.e5_98 - p.e10_95) * 1000) / 1000;
  const g98b = Math.round((p.e5_98 - p.e10_98) * 1000) / 1000;
  const gap5Mean = M.range('e5_95', 365, t).mean - r.mean;
  return { M, t, p, s, st, r, g5, g98, g98b, gap5Mean, C: h.P.contrat, lc: M.lastChange('e10_95', t) };
}
type DD = ReturnType<typeof D>;

/** « plus cher de x » / « moins cher de x » / « au même prix », dans les trois langues. */
function vs(h: Helpers, g: number) {
  if (g === 0) return h.T('au même prix maximum', 'aan dezelfde maximumprijs', 'at the same maximum price');
  return g > 0 ? h.T(`${c(h, g)} plus cher au litre`, `${c(h, g)} duurder per liter`, `${c(h, g)} dearer a litre`) : h.T(`${c(h, g)} moins cher au litre`, `${c(h, g)} goedkoper per liter`, `${c(h, g)} cheaper a litre`);
}

function demain(h: Helpers, d: DD) {
  const tm = d.s.tomorrow;
  if (tm.official) return tm.delta === 0
    ? h.T(`Le tarif officiel du ${h.date(tm.day)} est connu : le 95 E10 y reste au même prix.`, `Het officiële tarief voor ${h.date(tm.day)} is bekend: 95 E10 blijft dan even duur.`, `The official tariff for ${h.date(tm.day)} is known: 95 E10 stays at the same price.`)
    : h.T(`Le tarif officiel du ${h.date(tm.day)} est connu : le 95 E10 passera à ${h.l3(tm.price)} (${h.cts(tm.delta)}).`, `Het officiële tarief voor ${h.date(tm.day)} is bekend: 95 E10 gaat dan naar ${h.l3(tm.price)} (${h.cts(tm.delta)}).`, `The official tariff for ${h.date(tm.day)} is known: 95 E10 moves to ${h.l3(tm.price)} (${h.cts(tm.delta)}).`);
  return h.T(`Pour le ${h.date(tm.day)}, aucun tarif officiel n’est encore paru ; l’estimation affichée par l’outil part du dernier prix publié et n’engage personne.`, `Voor ${h.date(tm.day)} is nog geen officieel tarief verschenen; de schatting in de tool vertrekt van de laatst gepubliceerde prijs en is niet bindend.`, `For ${h.date(tm.day)} no official tariff has appeared yet; the estimate in the tool starts from the last published price and binds no one.`);
}

const resume = (h: Helpers) => {
  const d = D(h);
  return h.T(
    `Le prix maximum officiel de l’essence 95 E10 en Belgique est de ${h.l3(d.p.e10_95)} le litre le ${h.date(d.t)}, TVA de 21 % comprise. Le 95 E5 se vend au plus ${h.l3(d.p.e5_95)}, soit ${vs(h, d.g5)} que l’E10, et le 98 E5 au plus ${h.l3(d.p.e5_98)}, contre ${h.l3(d.p.e10_98)} pour le 98 E10. Le SPF Économie fixe ces plafonds au titre du contrat-programme passé entre l’État et la fédération Energia ; aucune station ne peut les dépasser. ${demain(h, d)} En un an, le 95 E10 a connu ${h.num(d.st.changed)} nouveaux tarifs, dont ${h.num(d.st.up)} à la hausse, pour un mouvement moyen de ${c(h, d.st.meanAbs)} ; son prix a évolué entre ${h.l3(d.r.min[1])} et ${h.l3(d.r.max[1])}, avec une moyenne de ${h.l3(d.r.mean)}. Un plein de 40 litres de 95 E10 coûte au plus ${h.eur(d.p.e10_95 * 40, 2)} aujourd’hui, et ${h.eur(d.p.e5_98 * 40, 2)} en 98 E5.`,
    `De officiële maximumprijs van benzine 95 E10 in België bedraagt op ${h.date(d.t)} ${h.l3(d.p.e10_95)} per liter, inclusief 21 % btw. 95 E5 kost hoogstens ${h.l3(d.p.e5_95)}, dus ${vs(h, d.g5)} dan E10, en 98 E5 hoogstens ${h.l3(d.p.e5_98)}, tegenover ${h.l3(d.p.e10_98)} voor 98 E10. De FOD Economie legt die plafonds vast op grond van de programmaovereenkomst tussen de Staat en de federatie Energia; geen enkel tankstation mag erboven gaan. ${demain(h, d)} In een jaar kende 95 E10 ${h.num(d.st.changed)} nieuwe tarieven, waarvan ${h.num(d.st.up)} stijgingen, met een gemiddelde beweging van ${c(h, d.st.meanAbs)}; de prijs lag tussen ${h.l3(d.r.min[1])} en ${h.l3(d.r.max[1])}, met een gemiddelde van ${h.l3(d.r.mean)}. Een tankbeurt van 40 liter 95 E10 kost vandaag hoogstens ${h.eur(d.p.e10_95 * 40, 2)}, en ${h.eur(d.p.e5_98 * 40, 2)} met 98 E5.`,
    `The official maximum price of 95 E10 petrol in Belgium is ${h.l3(d.p.e10_95)} a litre on ${h.date(d.t)}, including 21% VAT. 95 E5 sells for at most ${h.l3(d.p.e5_95)}, which is ${vs(h, d.g5)} than E10, and 98 E5 for at most ${h.l3(d.p.e5_98)}, against ${h.l3(d.p.e10_98)} for 98 E10. The FPS Economy sets these ceilings under the programme agreement between the State and the Energia federation; no station may go above them. ${demain(h, d)} Over a year 95 E10 has had ${h.num(d.st.changed)} new tariffs, ${h.num(d.st.up)} of them rises, with an average move of ${c(h, d.st.meanAbs)}; its price ranged between ${h.l3(d.r.min[1])} and ${h.l3(d.r.max[1])}, averaging ${h.l3(d.r.mean)}. A 40-litre fill-up of 95 E10 costs at most ${h.eur(d.p.e10_95 * 40, 2)} today, and ${h.eur(d.p.e5_98 * 40, 2)} in 98 E5.`);
};

const faqs = (h: Helpers) => {
  const d = D(h);
  return [
    {
      q: h.T('Que signifient « 95 », « 98 », « E5 » et « E10 » à la pompe ?', 'Wat betekenen 95, 98, E5 en E10 aan de pomp?', 'What do 95, 98, E5 and E10 mean at the pump?'),
      a: h.T(
        'Le nombre est l’indice d’octane, qui mesure la résistance de l’essence à l’auto-allumage : 95 pour l’essence courante, 98 pour la super. La lettre E suivie d’un chiffre indique la part maximale d’éthanol : jusqu’à 5 % pour l’E5, jusqu’à 10 % pour l’E10. Le tarif officiel donne un prix maximum distinct pour chacune des quatre combinaisons.',
        'Het getal is het octaangetal, dat aangeeft hoe goed de benzine bestand is tegen zelfontbranding: 95 voor gewone benzine, 98 voor super. De letter E met een cijfer geeft het maximale aandeel ethanol: tot 5 % voor E5, tot 10 % voor E10. Het officiële tarief geeft een aparte maximumprijs voor elk van de vier combinaties.',
        'The number is the octane rating, which measures how well the petrol resists self-ignition: 95 for regular, 98 for super. The letter E with a figure gives the maximum share of ethanol: up to 5% for E5, up to 10% for E10. The official tariff gives a separate maximum price for each of the four combinations.'),
    },
    {
      q: h.T('Comment savoir si ma voiture accepte l’essence E10 ?', 'Hoe weet ik of mijn auto E10-benzine verdraagt?', 'How do I know whether my car can take E10 petrol?'),
      a: h.T(
        'Regardez l’étiquette collée dans la trappe à carburant ou le manuel du véhicule : un cercle marqué E10 signifie que le moteur l’accepte, et le pistolet de la pompe porte le même symbole. Beaucoup de voitures essence récentes l’acceptent, pas toutes, et certains modèles plus anciens ne sont validés qu’en E5. En cas de doute, le constructeur ou votre garage peut vous répondre avec le numéro de châssis.',
        'Kijk naar het label in de tankklep of in de handleiding van de wagen: een cirkel met E10 betekent dat de motor het verdraagt, en het pistool aan de pomp draagt hetzelfde symbool. Veel recente benzinewagens zijn geschikt, niet allemaal, en sommige oudere modellen zijn enkel voor E5 goedgekeurd. Twijfelt u, dan kan de constructeur of uw garage het nagaan met het chassisnummer.',
        'Look at the label inside the fuel filler flap or in the owner’s manual: a circle marked E10 means the engine accepts it, and the pump nozzle carries the same symbol. Many recent petrol cars take it, though not all, and some older models are approved for E5 only. When in doubt, the manufacturer or your garage can check from the chassis number.'),
    },
    {
      q: h.T('Combien coûte l’essence 95 E5 de plus que l’E10 ?', 'Hoeveel meer kost 95 E5 dan 95 E10?', 'How much more does 95 E5 cost than 95 E10?'),
      a: h.T(
        `Le ${h.date(d.t)}, le 95 E5 est ${vs(h, d.g5)} que le 95 E10, soit ${h.eur(Math.abs(d.g5) * 40, 2)} sur un plein de 40 litres. Sur les 365 derniers jours, l’écart moyen entre leurs prix maximums a été de ${c(h, d.gap5Mean)} par litre. Rouler à l’E5 n’a donc de sens que si votre moteur n’accepte pas l’E10 ou si le constructeur le recommande.`,
        `Op ${h.date(d.t)} is 95 E5 ${vs(h, d.g5)} dan 95 E10, of ${h.eur(Math.abs(d.g5) * 40, 2)} op een tankbeurt van 40 liter. Over de voorbije 365 dagen bedroeg het gemiddelde verschil tussen hun maximumprijzen ${c(h, d.gap5Mean)} per liter. E5 tanken is dus pas zinvol als uw motor geen E10 verdraagt of als de constructeur het aanraadt.`,
        `On ${h.date(d.t)} 95 E5 is ${vs(h, d.g5)} than 95 E10, or ${h.eur(Math.abs(d.g5) * 40, 2)} on a 40-litre fill-up. Over the last 365 days the average gap between their maximum prices was ${c(h, d.gap5Mean)} a litre. Using E5 therefore only makes sense if your engine cannot take E10 or the manufacturer recommends it.`),
    },
    {
      q: h.T('Faut-il prendre du 98 plutôt que du 95 ?', 'Moet ik 98 tanken in plaats van 95?', 'Should I fill up with 98 instead of 95?'),
      a: h.T(
        `Seulement si le moteur le demande. Le manuel indique l’indice d’octane minimum ; un moteur prévu pour du 95 ne tire en général aucun avantage notable du 98. Le supplément se chiffre facilement : aujourd’hui, le 98 E5 est ${vs(h, d.g98)} que le 95 E10, soit ${h.eur(Math.abs(d.g98) * 40, 2)} sur 40 litres et ${h.eur(Math.abs(d.g98) * 1000, 0)} sur 1 000 litres roulés dans l’année.`,
        `Alleen als de motor erom vraagt. De handleiding vermeldt het minimale octaangetal; een motor die voor 95 ontworpen is, haalt doorgaans geen merkbaar voordeel uit 98. De meerprijs is snel berekend: vandaag is 98 E5 ${vs(h, d.g98)} dan 95 E10, of ${h.eur(Math.abs(d.g98) * 40, 2)} op 40 liter en ${h.eur(Math.abs(d.g98) * 1000, 0)} op 1.000 liter per jaar.`,
        `Only if the engine calls for it. The manual gives the minimum octane rating; an engine designed for 95 generally gains nothing noticeable from 98. The extra cost is easy to work out: today 98 E5 is ${vs(h, d.g98)} than 95 E10, which is ${h.eur(Math.abs(d.g98) * 40, 2)} on 40 litres and ${h.eur(Math.abs(d.g98) * 1000, 0)} on 1,000 litres over a year.`),
    },
    {
      q: h.T('Pourquoi le 98 E5 et le 98 E10 ont-ils chacun leur prix maximum ?', 'Waarom hebben 98 E5 en 98 E10 elk een eigen maximumprijs?', 'Why do 98 E5 and 98 E10 each have their own maximum price?'),
      a: h.T(
        `Parce que le tarif officiel calcule un plafond par produit, et que la part d’éthanol modifie la composition du carburant vendu. ${d.g98b === 0 ? `Le ${h.date(d.t)}, les deux plafonds se rejoignent exactement, à ${h.l3(d.p.e5_98)}.` : `Le ${h.date(d.t)}, le 98 E5 est ${vs(h, d.g98b)} que le 98 E10.`} Toutes les stations ne proposent pas les deux : celle qui n’a que l’un des deux applique le plafond de ce produit-là.`,
        `Omdat het officiële tarief per product een plafond berekent en het aandeel ethanol de samenstelling van de verkochte brandstof verandert. ${d.g98b === 0 ? `Op ${h.date(d.t)} vallen beide plafonds precies samen, op ${h.l3(d.p.e5_98)}.` : `Op ${h.date(d.t)} is 98 E5 ${vs(h, d.g98b)} dan 98 E10.`} Niet elk tankstation biedt beide aan: een station met slechts één van de twee past het plafond van dat product toe.`,
        `Because the official tariff sets a ceiling per product, and the share of ethanol changes the make-up of the fuel sold. ${d.g98b === 0 ? `On ${h.date(d.t)} the two ceilings coincide exactly, at ${h.l3(d.p.e5_98)}.` : `On ${h.date(d.t)} 98 E5 is ${vs(h, d.g98b)} than 98 E10.`} Not every station sells both: one that stocks only one of them applies that product’s ceiling.`),
    },
  ];
};

const body = (h: Helpers) => {
  const d = D(h), M = d.M;
  const rows = KEYS.map((k) => {
    const s = M.situation(k, d.t), tm = s.tomorrow, r = M.range(k, 365, d.t), last = M.lastTariff(k);
    return [M.NOM[k][h.lang], h.l3(s.price!), tm.official ? h.l3(tm.price) : `${h.l3(tm.est.central)} (${h.T('estimation', 'schatting', 'estimate')})`, last?.excl != null ? h.l3(last.excl) : '—', h.l3(r.mean)];
  });
  const tbl = h.table(
    h.T(['Essence', 'Aujourd’hui', 'Demain', 'Dernier tarif hors TVA', 'Moyenne sur un an'], ['Benzine', 'Vandaag', 'Morgen', 'Laatste tarief excl. btw', 'Gemiddelde over een jaar'], ['Petrol', 'Today', 'Tomorrow', 'Latest tariff excl. VAT', 'One-year average']),
    rows,
    h.T(`Prix maximums au litre, TVA comprise sauf mention, au ${h.date(d.t)}.`, `Maximumprijzen per liter, incl. btw tenzij anders vermeld, op ${h.date(d.t)}.`, `Maximum prices a litre, VAT included unless stated, on ${h.date(d.t)}.`),
    ['l', 'r', 'r', 'r', 'r']);
  const C = d.C;
  const moins = [...KEYS].sort((a, b) => d.p[a] - d.p[b])[0];
  const e10min = d.p.e10_95 <= d.p[moins];
  const dE10 = C.tarif_27_mars.e10_95 - C.tarif_28_fevrier.e10_95, d98 = C.tarif_27_mars.e5_98 - C.tarif_28_fevrier.e5_98, dB7 = C.tarif_27_mars.diesel_b7 - C.tarif_28_fevrier.diesel_b7;
  const lc = d.lc ? h.T(`Le dernier changement du 95 E10 date du ${h.date(d.lc.day)} (${h.cts(d.lc.price - d.lc.before)} par litre).`, `De laatste wijziging van 95 E10 dateert van ${h.date(d.lc.day)} (${h.cts(d.lc.price - d.lc.before)} per liter).`, `The latest change to 95 E10 dates from ${h.date(d.lc.day)} (${h.cts(d.lc.price - d.lc.before)} a litre).`) : '';
  return h.T(`
<h2>Quatre essences, quatre plafonds</h2>
<p>La pompe propose jusqu’à quatre essences, et le tarif officiel fixe un prix maximum pour chacune. Le 95 E10 est la référence de la plupart des voitures à essence ; le 95 E5 contient moins d’éthanol ; le 98, en E5 ou en E10, a un indice d’octane plus élevé. ${lc}</p>
${tbl}
<p>La colonne hors TVA reprend le dernier tarif publié par Statbel sur ${h.src('bestatDernier', 'be.STAT')}. La TVA de 21 % s’ajoute ensuite, et c’est le prix TVA comprise que la station ne peut pas dépasser.</p>
<h2>L’E10, la question à régler une fois</h2>
<p>La seule vraie décision, pour la plupart des conducteurs, est de savoir si leur voiture accepte l’E10. Si c’est le cas, ${e10min ? 'le 95 E10 est aujourd’hui l’essence la moins chère de la pompe et rien n’oblige à payer davantage' : `le choix reste ouvert, car c’est aujourd’hui le ${M.COURT[moins].fr} qui a le plafond le plus bas`}. Aujourd’hui, l’E5 coûte ${vs(h, d.g5)} ; sur les douze derniers mois, l’écart moyen a été de ${c(h, d.gap5Mean)}. Si la voiture n’accepte pas l’E10, le choix se fait entre le 95 E5 et le 98 E5, et la page ${h.a('prix-carburant', 'prix des carburants')} compare deux produits au choix sur le volume que vous indiquez.</p>
<h2>Le 98 : un supplément à chiffrer</h2>
<p>Le 98 E5 est ${vs(h, d.g98)} que le 95 E10 ce jour. Si le constructeur exige du 98, ce supplément fait partie du coût du véhicule ; s’il recommande simplement du 95, il ne sert à rien. Pour le traduire en budget annuel, la page ${h.a('budget-carburant', 'budget carburant')} part de vos kilomètres et de votre consommation réelle.</p>
<h2>Ce que montre le printemps 2026</h2>
<p>Le projet de loi ${h.src('chambreContrat', C.doc_chambre)} déposé à la Chambre le 30 mars 2026 cite deux tarifs officiels. Entre le 28 février et le 27 mars 2026, le 95 E10 est passé de ${h.l3(C.tarif_28_fevrier.e10_95)} à ${h.l3(C.tarif_27_mars.e10_95)}, soit ${h.cts(dE10)}, et le 98 E5 de ${h.l3(C.tarif_28_fevrier.e5_98)} à ${h.l3(C.tarif_27_mars.e5_98)}, soit ${h.cts(d98)}, quand le diesel B7 prenait ${h.cts(dB7)} sur la même période. L’essence ne réagit donc pas toujours avec la même ampleur que le diesel ; le prix de ce dernier est suivi sur la page ${h.a('prix-diesel', 'prix du diesel')}.</p>
<h2>Ce que fait l’outil</h2>
<p>Choisissez l’essence et le volume de votre plein : l’outil affiche le prix maximum du jour, celui du lendemain (le tarif officiel s’il est publié, sinon une estimation), la date du dernier changement, le coût du plein et l’effet sur ce plein des variations sur 7 jours, 30 jours et un an. Pour le lendemain seul, avec la fréquence de changement propre à l’essence, voyez ${h.a('essence-demain', 'prix de l’essence demain')}.</p>`,
  `
<h2>Vier benzines, vier plafonds</h2>
<p>Aan de pomp staan tot vier soorten benzine, en het officiële tarief legt voor elk een maximumprijs vast. 95 E10 is de referentie voor de meeste benzinewagens; 95 E5 bevat minder ethanol; 98, als E5 of E10, heeft een hoger octaangetal. ${lc}</p>
${tbl}
<p>De kolom zonder btw neemt het laatste tarief over dat Statbel publiceert op ${h.src('bestatDernier', 'be.STAT')}. Daarbovenop komt 21 % btw, en het is de prijs inclusief btw die het tankstation niet mag overschrijden.</p>
<h2>E10: één keer uitzoeken</h2>
<p>Voor de meeste bestuurders is de enige echte keuze of hun auto E10 verdraagt. Is dat zo, dan ${e10min ? 'is 95 E10 vandaag de goedkoopste benzine aan de pomp en hoeft u niet meer te betalen' : `blijft de keuze open, want vandaag heeft ${M.COURT[moins].nl} het laagste plafond`}. Vandaag is E5 ${vs(h, d.g5)}; over de voorbije twaalf maanden bedroeg het gemiddelde verschil ${c(h, d.gap5Mean)}. Verdraagt de auto geen E10, dan kiest u tussen 95 E5 en 98 E5, en de pagina ${h.a('prix-carburant', 'brandstofprijzen')} vergelijkt twee producten naar keuze op het volume dat u opgeeft.</p>
<h2>98: een meerprijs om uit te rekenen</h2>
<p>98 E5 is vandaag ${vs(h, d.g98)} dan 95 E10. Eist de constructeur 98, dan hoort die meerprijs bij de kost van de wagen; raadt hij gewoon 95 aan, dan levert hij niets op. Om hem om te zetten in een jaarbudget vertrekt de pagina ${h.a('budget-carburant', 'brandstofbudget')} van uw kilometers en uw werkelijke verbruik.</p>
<h2>Wat de lente van 2026 toont</h2>
<p>Het wetsvoorstel ${h.src('chambreContrat', C.doc_chambre)}, op 30 maart 2026 bij de Kamer ingediend, vermeldt twee officiële tarieven. Tussen 28 februari en 27 maart 2026 ging 95 E10 van ${h.l3(C.tarif_28_fevrier.e10_95)} naar ${h.l3(C.tarif_27_mars.e10_95)}, of ${h.cts(dE10)}, en 98 E5 van ${h.l3(C.tarif_28_fevrier.e5_98)} naar ${h.l3(C.tarif_27_mars.e5_98)}, of ${h.cts(d98)}, terwijl diesel B7 in dezelfde periode ${h.cts(dB7)} opliep. Benzine reageert dus niet altijd even sterk als diesel; die prijs volgt u op de pagina ${h.a('prix-diesel', 'dieselprijs')}.</p>
<h2>Wat de tool doet</h2>
<p>Kies de benzine en het volume van uw tankbeurt: de tool toont de maximumprijs van vandaag, die van morgen (het officiële tarief als het gepubliceerd is, anders een schatting), de datum van de laatste wijziging, de kost van de tankbeurt en het effect van de schommelingen over 7 dagen, 30 dagen en een jaar. Voor morgen alleen, met de wijzigingsfrequentie van benzine, ziet u ${h.a('essence-demain', 'benzineprijs morgen')}.</p>`,
  `
<h2>Four petrols, four ceilings</h2>
<p>The pump offers up to four kinds of petrol, and the official tariff sets a maximum price for each. 95 E10 is the reference for most petrol cars; 95 E5 contains less ethanol; 98, as E5 or E10, has a higher octane rating. ${lc}</p>
${tbl}
<p>The excluding-VAT column repeats the latest tariff Statbel publishes on ${h.src('bestatDernier', 'be.STAT')}. 21% VAT is then added, and it is the VAT-inclusive price that the station may not exceed.</p>
<h2>E10: a question to settle once</h2>
<p>For most drivers the only real decision is whether their car can take E10. If it can, ${e10min ? '95 E10 is today the cheapest petrol at the pump and there is no reason to pay more' : `the choice stays open, since ${M.COURT[moins].en} has the lowest ceiling today`}. Today E5 is ${vs(h, d.g5)}; over the last twelve months the average gap was ${c(h, d.gap5Mean)}. If the car cannot take E10, the choice is between 95 E5 and 98 E5, and the ${h.a('prix-carburant', 'fuel prices')} page compares any two products on the volume you enter.</p>
<h2>98: an extra worth pricing</h2>
<p>98 E5 is ${vs(h, d.g98)} than 95 E10 today. If the manufacturer requires 98, that extra is part of the cost of the car; if it simply recommends 95, it buys nothing. To turn it into a yearly figure, the ${h.a('budget-carburant', 'fuel budget')} page starts from your mileage and your real consumption.</p>
<h2>What spring 2026 shows</h2>
<p>The bill ${h.src('chambreContrat', C.doc_chambre)}, tabled in the Chamber on 30 March 2026, quotes two official tariffs. Between 28 February and 27 March 2026, 95 E10 went from ${h.l3(C.tarif_28_fevrier.e10_95)} to ${h.l3(C.tarif_27_mars.e10_95)}, a move of ${h.cts(dE10)}, and 98 E5 from ${h.l3(C.tarif_28_fevrier.e5_98)} to ${h.l3(C.tarif_27_mars.e5_98)}, a move of ${h.cts(d98)}, while diesel B7 gained ${h.cts(dB7)} over the same weeks. Petrol therefore does not always react as sharply as diesel; that price is tracked on the ${h.a('prix-diesel', 'diesel price')} page.</p>
<h2>What the tool does</h2>
<p>Pick the petrol and the size of your fill-up: the tool shows today’s maximum price, tomorrow’s (the official tariff if published, otherwise an estimate), the date of the latest change, the cost of the fill-up and how the moves over 7 days, 30 days and a year affect it. For tomorrow alone, with petrol’s own pattern of changes, see ${h.a('essence-demain', 'petrol price tomorrow')}.</p>`);
};

export default defineGuide({
  id: 'prix-essence',
  group: 'carburants',
  order: 4,
  tool: 'produit',
  toolArg: 'essence',
  related: ['essence-demain', 'prix-carburant', 'prix-diesel', 'budget-carburant', 'historique-carburants'],
  sources: ['bestatJour', 'bestatDernier', 'spfTarif', 'chambreContrat', 'fondsPrix'],
  fr: {
    slug: 'prix-essence',
    nav: 'Prix de l’essence',
    card: 'Prix maximum du 95 E10, du 95 E5 et du 98 aujourd’hui et demain.',
    title: 'Prix essence 2026 : 95 E10, 95 E5 et 98, prix maximum belge',
    description: 'Prix de l’essence aujourd’hui en Belgique : prix maximum officiel du 95 E10, du 95 E5 et du 98, prix de demain, écart E5/E10 et coût de votre plein en 2026.',
    h1: 'Prix de l’essence aujourd’hui',
    intro: 'Le prix maximum officiel des quatre essences vendues en Belgique, celui de demain et le coût de votre plein.',
    resume, faqs, body,
  },
  nl: {
    slug: 'benzineprijs',
    nav: 'Benzineprijs',
    card: 'Maximumprijs van 95 E10, 95 E5 en 98 vandaag en morgen.',
    title: 'Benzineprijs 2026: maximumprijs 95 E10, 95 E5 en 98 vandaag',
    description: 'Benzineprijs vandaag in België: officiële maximumprijs van 95 E10, 95 E5 en 98, de prijs van morgen, het verschil tussen E5 en E10 en de kost van uw tankbeurt.',
    h1: 'Benzineprijs vandaag',
    intro: 'De officiële maximumprijs van de vier benzinesoorten in België, die van morgen en wat uw tankbeurt kost.',
    resume, faqs, body,
  },
  en: {
    slug: 'petrol-price',
    nav: 'Petrol price',
    card: 'Maximum price of 95 E10, 95 E5 and 98 petrol today and tomorrow.',
    title: 'Petrol price Belgium 2026: 95 E10, 95 E5 and 98 maximum',
    description: 'Petrol price in Belgium today: the official maximum for 95 E10, 95 E5 and 98, tomorrow’s price, the E5 to E10 gap and what your fill-up costs, updated for 2026.',
    h1: 'Petrol price today',
    intro: 'The official maximum price of the four petrols sold in Belgium, tomorrow’s price and what your fill-up costs.',
    resume, faqs, body,
  },
});
