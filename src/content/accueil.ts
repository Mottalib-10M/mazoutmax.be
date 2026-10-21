/** Accueil (page pilier) : texte des trois langues. Rendu par components/HomePage.astro.
 *  Tous les chiffres viennent du moteur (tarif be.STAT du jour) : aucun prix n'est écrit en dur. */
import type { Helpers, PageText, Lang } from '../lib/guide-types';
import type { Prod } from '../lib/engine/tarif';

type Home = Omit<PageText, 'slug' | 'card' | 'nav'> & { calcTitle: string };

/** Les chiffres du jour, partagés par les trois langues. */
const jour = (h: Helpers) => {
  const M = h.M, d = h.today;
  const lt = M.situation('mazout_lt2000', d), ge = M.situation('mazout_ge2000', d);
  const p = (k: Prod) => M.priceOn(k, d)!;
  const t = lt.tomorrow;
  const demain = t.official ? t.price : t.est.central;
  const lc = M.lastChange('mazout_lt2000', d);
  const an = M.range('mazout_lt2000', 365, d);
  const ys = M.yearly('mazout_lt2000');
  return { M, d, lt, ge, p, t, demain, lc, an, ys, e30: M.evolution('mazout_lt2000', 30, d)!, e364: M.evolution('mazout_lt2000', 364, d)!, ecart: p('mazout_lt2000') - p('mazout_ge2000') };
};

/** Phrase sur le tarif de demain : officiel (avec la variation) ou estimation (avec sa probabilité). */
const phraseDemain = (h: Helpers) => {
  const { t, demain } = jour(h);
  if (t.official) {
    if (t.delta === 0) return h.T(`Le tarif officiel du ${h.date(t.day)} est déjà publié : il reste à ${h.l3(t.price)} le litre, sans changement.`, `Het officiële tarief van ${h.date(t.day)} is al gepubliceerd: het blijft ${h.l3(t.price)} per liter, ongewijzigd.`, `The official tariff for ${h.date(t.day)} is already published: it stays at ${h.l3(t.price)} a litre, unchanged.`);
    return h.T(`Le tarif officiel du ${h.date(t.day)} est déjà publié : ${h.l3(t.price)} le litre, soit ${h.cts(t.delta)} par rapport à aujourd’hui.`, `Het officiële tarief van ${h.date(t.day)} is al gepubliceerd: ${h.l3(t.price)} per liter, of ${h.cts(t.delta)} tegenover vandaag.`, `The official tariff for ${h.date(t.day)} is already published: ${h.l3(t.price)} a litre, ${h.cts(t.delta)} compared with today.`);
  }
  return h.T(`Le tarif du ${h.date(t.day)} n’est pas encore publié ; notre estimation est de ${h.l3(demain)} le litre, avec ${h.pct(t.est.prob, 0)} de chances qu’un nouveau prix entre en vigueur ce jour-là.`, `Het tarief van ${h.date(t.day)} is nog niet gepubliceerd; onze schatting is ${h.l3(demain)} per liter, met ${h.pct(t.est.prob, 0)} kans dat die dag een nieuwe prijs ingaat.`, `The tariff for ${h.date(t.day)} is not published yet; our estimate is ${h.l3(demain)} a litre, with a ${h.pct(t.est.prob, 0)} chance that a new price comes in that day.`);
};
const sens = (h: Helpers, x: number, fr: [string, string, string], nl: [string, string, string], en: [string, string, string]) => h.T(...([fr, nl, en].map((a) => (x > 0 ? a[0] : x < 0 ? a[1] : a[2])) as [string, string, string]));

const resume = (h: Helpers) => {
  const { p, d } = jour(h);
  return h.T(
    `Le ${h.date(d)}, le prix maximum officiel du mazout de chauffage en Belgique est de ${h.l3(p('mazout_lt2000'))} le litre pour une livraison de moins de 2 000 litres et de ${h.l3(p('mazout_ge2000'))} à partir de 2 000 litres, TVA de 21 % comprise ; à la pompe, il est de ${h.l3(p('mazout_pompe'))}. Ce prix est fixé par le SPF Économie dans le cadre du contrat-programme conclu entre l’État belge et le secteur pétrolier, puis diffusé par Statbel : aucun négociant ne peut facturer davantage, mais tous peuvent vendre moins cher. ${phraseDemain(h)} Le calculateur ci-dessus applique le bon palier à votre volume, donne la TVA contenue et l’écart entre une livraison aujourd’hui et demain. Le tableau qui suit reprend les treize produits du tarif officiel, du diesel B7 au LPG, relus sur be.STAT cinq fois par jour, sans adresse, sans e-mail et sans numéro de téléphone à laisser.`,
    `Op ${h.date(d)} bedraagt de officiële maximumprijs van mazout (gasolie verwarming) in België ${h.l3(p('mazout_lt2000'))} per liter voor een levering van minder dan 2.000 liter en ${h.l3(p('mazout_ge2000'))} vanaf 2.000 liter, inclusief 21 % btw; aan de pomp is dat ${h.l3(p('mazout_pompe'))}. Die prijs wordt vastgelegd door de FOD Economie in het kader van de programmaovereenkomst tussen de Belgische Staat en de petroleumsector, en verspreid door Statbel: geen enkele handelaar mag meer aanrekenen, maar iedereen mag goedkoper verkopen. ${phraseDemain(h)} De rekenhulp hierboven past de juiste schijf toe op uw volume, toont de inbegrepen btw en het verschil tussen een levering vandaag en morgen. De tabel daaronder bevat de dertien producten van het officiële tarief, van diesel B7 tot LPG, vijf keer per dag opgehaald op be.STAT, zonder adres, e-mail of telefoonnummer achter te laten.`,
    `On ${h.date(d)}, Belgium’s official maximum price for heating oil (mazout) is ${h.l3(p('mazout_lt2000'))} a litre for a delivery of under 2,000 litres and ${h.l3(p('mazout_ge2000'))} from 2,000 litres, 21% VAT included; at the pump it is ${h.l3(p('mazout_pompe'))}. The price is set by the FPS Economy under the programme contract between the Belgian State and the oil sector, then released by Statbel: no dealer may charge more, but any dealer may sell for less. ${phraseDemain(h)} The calculator above applies the right band to your volume, shows the VAT included and the difference between a delivery today and tomorrow. The table below lists all thirteen products of the official tariff, from diesel B7 to LPG, read from be.STAT five times a day, with no address, email or phone number to leave.`);
};

const MOIS: Record<Lang, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const mois = (h: Helpers, ym: string) => { const [y, m] = ym.split('-').map(Number); return `${MOIS[h.lang][m - 1]} ${y}`; };

const body = (h: Helpers) => {
  const J = jour(h); const { M, d, p, t, an, ys } = J;
  const T = h.T;
  const recul = (k: Prod, n: number) => M.priceNear(k, M.addDays(d, -n));
  const prods: Prod[] = ['mazout_lt2000', 'mazout_ge2000', 'mazout_pompe', 'diesel_b7', 'e10_95', 'lpg'];
  const tabEvo = h.table(
    [T('Produit', 'Product', 'Product'), h.date(d), T('il y a 7 jours', '7 dagen eerder', '7 days earlier'), T('il y a 30 jours', '30 dagen eerder', '30 days earlier'), T('il y a un an', 'een jaar eerder', 'a year earlier')],
    prods.map((k) => [M.NOM[k][h.lang], h.l3(p(k)), ...[7, 30, 364].map((n) => { const v = recul(k, n); return v == null ? '–' : h.l3(v); })]),
    T('Prix maximums TVA comprise, en euros par litre (be.STAT, Statbel).', 'Maximumprijzen incl. btw, in euro per liter (be.STAT, Statbel).', 'Maximum prices including VAT, in euros per litre (be.STAT, Statbel).'),
    ['l', 'r', 'r', 'r', 'r']);
  const wd = [1, 2, 3, 4, 5, 6, 0].map((x) => ({ x, s: M.changeStats('mazout_lt2000', x) }));
  const tabWd = h.table(
    [T('Jour', 'Dag', 'Day'), T('Nouveaux tarifs', 'Nieuwe tarieven', 'New tariffs'), T('Hausses', 'Stijgingen', 'Rises'), T('Baisses', 'Dalingen', 'Falls')],
    wd.map(({ x, s }) => [M.nomJour(x, h.lang), `${h.num(s.changed)} / ${h.num(s.days)}`, h.num(s.up), h.num(s.down)]),
    T('Mazout de moins de 2 000 litres : jours où un nouveau prix maximum est entré en vigueur, sur les 365 derniers jours.', 'Mazout onder 2.000 liter: dagen waarop een nieuwe maximumprijs inging, over de laatste 365 dagen.', 'Heating oil under 2,000 litres: days on which a new maximum price came in, over the last 365 days.'),
    ['l', 'r', 'r', 'r']);
  const top = [...wd].sort((a, b) => b.s.prob - a.s.prob)[0];
  const calme = [...wd].sort((a, b) => a.s.prob - b.s.prob)[0];
  const bt = M.backtest('mazout_lt2000', 364), bt4 = M.backtest('mazout_lt2000', 28);
  const mens = M.monthly('mazout_lt2000').slice(-12);
  const mMax = [...mens].sort((a, b) => b[1] - a[1])[0], mMin = [...mens].sort((a, b) => a[1] - b[1])[0];
  const tabMois = h.table([T('Mois', 'Maand', 'Month'), T('Moyenne < 2 000 L', 'Gemiddelde < 2.000 l', 'Average < 2,000 L'), T('Moyenne ≥ 2 000 L', 'Gemiddelde ≥ 2.000 l', 'Average ≥ 2,000 L')],
    mens.map(([ym, v]) => [mois(h, ym), h.l3(v), (() => { const g = M.monthly('mazout_ge2000').find((x) => x[0] === ym); return g ? h.l3(g[1]) : '–'; })()]),
    T('Moyennes mensuelles publiées par Statbel, TVA comprise.', 'Maandgemiddelden gepubliceerd door Statbel, incl. btw.', 'Monthly averages published by Statbel, VAT included.'), ['l', 'r', 'r']);
  const vols = [1000, 1500, 2000, 3000];
  const tabBudget = h.table([T('Litres par an', 'Liter per jaar', 'Litres a year'), T('Au prix du jour', 'Tegen de prijs van vandaag', 'At today’s price'), ...ys.slice(-2, -1).map(([y]) => T(`Au prix moyen ${y}`, `Tegen gemiddelde ${y}`, `At the ${y} average`))],
    vols.map((v) => { const k: Prod = v >= 2000 ? 'mazout_ge2000' : 'mazout_lt2000'; const yk = M.yearly(k).slice(-2, -1)[0]; return [h.num(v), h.eur(M.budgetChauffage(v, p(k)).total), ...(yk ? [h.eur(M.budgetChauffage(v, yk[1]).total)] : [])]; }),
    T('Coût annuel au prix maximum du palier correspondant au volume.', 'Jaarkost tegen de maximumprijs van de schijf die bij het volume hoort.', 'Yearly cost at the maximum price of the band matching the volume.'), ['r', 'r', 'r']);
  const al = M.allocation(p('mazout_lt2000'), 1000);
  const ya = ys.at(-2), yb = ys.at(-1);

  return `
<h2>${T('Le prix du mazout aujourd’hui, en chiffres', 'De mazoutprijs vandaag, in cijfers', 'Today’s heating oil price in figures')}</h2>
<p>${T(
    `Sur trente jours, le prix maximum du mazout de moins de 2 000 litres ${sens(h, J.e30, ['a augmenté', 'a baissé', 'n’a pas bougé'], ['', '', ''], ['', '', ''])}${J.e30 !== 0 ? ` de ${h.cts(J.e30).replace(/^[+−]/, '')} par litre` : ''} ; sur un an, l’écart est de ${h.cts(J.e364)}. Le dernier changement date du ${J.lc ? h.date(J.lc.day) : '–'}${J.lc ? `, de ${h.l3(J.lc.before)} à ${h.l3(J.lc.price)}` : ''}. Sur les 365 derniers jours, le litre a coûté au plus bas ${h.l3(an.min[1])} (le ${h.date(an.min[0])}) et au plus haut ${h.l3(an.max[1])} (le ${h.date(an.max[0])}), pour une moyenne de ${h.l3(an.mean)}.`,
    `Over dertig dagen is de maximumprijs van mazout onder 2.000 liter ${sens(h, J.e30, ['', '', ''], ['gestegen', 'gedaald', 'niet veranderd'], ['', '', ''])}${J.e30 !== 0 ? ` met ${h.cts(J.e30).replace(/^[+−]/, '')} per liter` : ''}; over een jaar bedraagt het verschil ${h.cts(J.e364)}. De laatste wijziging dateert van ${J.lc ? h.date(J.lc.day) : '–'}${J.lc ? `, van ${h.l3(J.lc.before)} naar ${h.l3(J.lc.price)}` : ''}. Over de laatste 365 dagen kostte de liter op zijn laagst ${h.l3(an.min[1])} (op ${h.date(an.min[0])}) en op zijn hoogst ${h.l3(an.max[1])} (op ${h.date(an.max[0])}), voor een gemiddelde van ${h.l3(an.mean)}.`,
    `Over thirty days, the maximum price of heating oil under 2,000 litres has ${sens(h, J.e30, ['', '', ''], ['', '', ''], ['risen', 'fallen', 'not moved'])}${J.e30 !== 0 ? ` by ${h.cts(J.e30).replace(/^[+−]/, '')} a litre` : ''}; over a year the difference is ${h.cts(J.e364)}. The last change was on ${J.lc ? h.date(J.lc.day) : '–'}${J.lc ? `, from ${h.l3(J.lc.before)} to ${h.l3(J.lc.price)}` : ''}. Over the last 365 days a litre cost at its lowest ${h.l3(an.min[1])} (on ${h.date(an.min[0])}) and at its highest ${h.l3(an.max[1])} (on ${h.date(an.max[0])}), with an average of ${h.l3(an.mean)}.`)}</p>
${tabEvo}
<p>${T(
    `Les trois lignes du mazout bougent ensemble : le tarif officiel les recalcule le même jour, à partir des mêmes cotations. L’écart entre le palier de moins de 2 000 litres et celui de 2 000 litres et plus reste donc presque constant, ${h.cts(J.ecart).replace(/^[+−]/, '')} par litre aujourd’hui. Le diesel, l’essence et le LPG suivent leur propre rythme, plus lent, détaillé sur la page ${h.a('prix-carburant', 'prix des carburants')}.`,
    `De drie mazoutlijnen bewegen samen: het officiële tarief herberekent ze op dezelfde dag, op basis van dezelfde noteringen. Het verschil tussen de schijf onder 2.000 liter en die vanaf 2.000 liter blijft dus bijna constant, vandaag ${h.cts(J.ecart).replace(/^[+−]/, '')} per liter. Diesel, benzine en LPG volgen hun eigen, tragere ritme, uitgewerkt op de pagina ${h.a('prix-carburant', 'brandstofprijzen')}.`,
    `The three heating-oil lines move together: the official tariff recalculates them on the same day, from the same quotations. The gap between the under-2,000-litre band and the 2,000-litres-or-more band therefore stays almost constant, ${h.cts(J.ecart).replace(/^[+−]/, '')} a litre today. Diesel, petrol and LPG follow their own, slower pace, set out on the ${h.a('prix-carburant', 'fuel prices')} page.`)}</p>

<h2>${T('Demain : tarif publié ou estimation', 'Morgen: gepubliceerd tarief of schatting', 'Tomorrow: published tariff or estimate')}</h2>
<p>${phraseDemain(h)} ${T(
    'Le tarif d’un jour est souvent connu dès la veille : quand Statbel l’a mis en ligne, le site l’affiche tel quel et l’appelle tarif officiel. Tant qu’il ne l’est pas, nous affichons une estimation, et nous l’appelons estimation.',
    'Het tarief van een dag is vaak al de dag ervoor bekend: zodra Statbel het online zet, toont de site het zoals het is en noemt het officieel tarief. Zolang dat niet zo is, tonen we een schatting, en noemen we het een schatting.',
    'A day’s tariff is often known the day before: once Statbel has put it online, the site shows it as it is and calls it the official tariff. Until then we show an estimate, and we call it an estimate.')}</p>
<p>${T(
    `Le prix maximum suit des cotations internationales payantes, que personne ne peut consulter librement : refaire le calcul officiel à l’avance est impossible. Notre estimation part donc du dernier tarif publié, l’hypothèse qui s’est le moins trompée sur un an, et l’entoure des variations réellement observées le même jour de la semaine. Sur 52 semaines, son écart moyen avec le tarif réellement publié a été de ${h.cts(bt.mae).replace(/^[+−±]/, '')} par litre, et de ${h.cts(bt4.mae).replace(/^[+−±]/, '')} sur les quatre dernières semaines ; l’écart est resté sous un cent dans ${h.pct(bt.within1c, 0)} des cas. La méthode complète est sur la page ${h.a('contrat-programme', 'contrat-programme')}.`,
    `De maximumprijs volgt betalende internationale noteringen die niemand vrij kan raadplegen: de officiële berekening vooraf overdoen is onmogelijk. Onze schatting vertrekt dus van het laatst gepubliceerde tarief, de veronderstelling die zich over een jaar het minst vergiste, en omringt het met de schommelingen die op dezelfde weekdag werkelijk zijn waargenomen. Over 52 weken bedroeg de gemiddelde afwijking met het echt gepubliceerde tarief ${h.cts(bt.mae).replace(/^[+−±]/, '')} per liter, en ${h.cts(bt4.mae).replace(/^[+−±]/, '')} over de laatste vier weken; in ${h.pct(bt.within1c, 0)} van de gevallen bleef de afwijking onder een cent. De volledige methode staat op de pagina ${h.a('contrat-programme', 'programmaovereenkomst')}.`,
    `The maximum price follows paid international quotations that nobody can consult freely: redoing the official calculation in advance is impossible. Our estimate therefore starts from the last published tariff, the assumption that was wrong least often over a year, and frames it with the changes actually seen on the same weekday. Over 52 weeks its average gap with the tariff actually published was ${h.cts(bt.mae).replace(/^[+−±]/, '')} a litre, and ${h.cts(bt4.mae).replace(/^[+−±]/, '')} over the last four weeks; the gap stayed under one cent in ${h.pct(bt.within1c, 0)} of cases. The full method is on the ${h.a('contrat-programme', 'programme contract')} page.`)}</p>
${tabWd}
<p>${T(
    `Le ${M.nomJour(top.x, 'fr')} est le jour où un nouveau tarif entre le plus souvent en vigueur (${h.num(top.s.changed)} fois sur ${h.num(top.s.days)}), le ${M.nomJour(calme.x, 'fr')} celui où il change le moins (${h.num(calme.s.changed)} fois). Pour suivre le lendemain jour après jour, ouvrez la page ${h.a('mazout-demain', 'prix du mazout demain')}.`,
    `Op ${M.nomJour(top.x, 'nl')} gaat het vaakst een nieuw tarief in (${h.num(top.s.changed)} keer op ${h.num(top.s.days)}), op ${M.nomJour(calme.x, 'nl')} het minst (${h.num(calme.s.changed)} keer). Wie morgen dag na dag wil volgen, opent de pagina ${h.a('mazout-demain', 'mazoutprijs morgen')}.`,
    `${M.nomJour(top.x, 'en')} is the day a new tariff most often comes into force (${h.num(top.s.changed)} times out of ${h.num(top.s.days)}), ${M.nomJour(calme.x, 'en')} the day it changes least (${h.num(calme.s.changed)} times). To follow tomorrow day by day, open the ${h.a('mazout-demain', 'heating oil price tomorrow')} page.`)}</p>

<h2>${T('Moins de 2 000 litres ou plus : ce que change le palier', 'Minder of meer dan 2.000 liter: wat de schijf verandert', 'Under or over 2,000 litres: what the band changes')}</h2>
<p>${T(
    `Le tarif officiel prévoit deux prix de livraison. Dès 2 000 litres, tout le volume passe au prix inférieur, aujourd’hui ${h.l3(p('mazout_ge2000'))} au lieu de ${h.l3(p('mazout_lt2000'))}. Il ne s’agit pas d’une remise sur les litres au-delà du seuil : c’est l’ensemble de la commande qui change de prix. Conséquence pratique : une commande un peu sous 2 000 litres peut coûter presque autant qu’une commande de 2 000 litres, qui remplit davantage la citerne. Le volume qui coûte exactement autant que 2 000 litres est de ${h.num(M.seuil2000(1500, p('mazout_lt2000'), p('mazout_ge2000')).equivalent)} litres au tarif du jour.`,
    `Het officiële tarief kent twee leveringsprijzen. Vanaf 2.000 liter gaat het hele volume naar de lagere prijs, vandaag ${h.l3(p('mazout_ge2000'))} in plaats van ${h.l3(p('mazout_lt2000'))}. Het is geen korting op de liters boven de drempel: de hele bestelling krijgt een andere prijs. Praktisch gevolg: een bestelling net onder 2.000 liter kan bijna evenveel kosten als een bestelling van 2.000 liter, die de tank meer vult. Het volume dat precies evenveel kost als 2.000 liter is vandaag ${h.num(M.seuil2000(1500, p('mazout_lt2000'), p('mazout_ge2000')).equivalent)} liter.`,
    `The official tariff has two delivery prices. From 2,000 litres the whole volume moves to the lower price, today ${h.l3(p('mazout_ge2000'))} instead of ${h.l3(p('mazout_lt2000'))}. It is not a discount on the litres above the threshold: the whole order changes price. In practice, an order just under 2,000 litres can cost almost as much as a 2,000-litre order, which fills more of the tank. The volume costing exactly as much as 2,000 litres is ${h.num(M.seuil2000(1500, p('mazout_lt2000'), p('mazout_ge2000')).equivalent)} litres at today’s tariff.`)}</p>
<!--mini:seuil-->
<p>${T(
    `Votre citerne doit évidemment pouvoir recevoir le volume, et une commande groupée entre voisins atteint plus facilement le seuil. Le calcul détaillé, avec le prix de chaque litre supplémentaire, est sur la page ${h.a('mazout-2000-litres', 'mazout : moins ou plus de 2 000 litres')}.`,
    `Uw tank moet het volume uiteraard kunnen opnemen, en een groepsaankoop met buren haalt de drempel makkelijker. De gedetailleerde berekening, met de prijs van elke extra liter, staat op de pagina ${h.a('mazout-2000-litres', 'mazout: minder of meer dan 2.000 liter')}.`,
    `Your tank must of course be able to take the volume, and a joint order with neighbours reaches the threshold more easily. The detailed calculation, with the price of each extra litre, is on the ${h.a('mazout-2000-litres', 'heating oil under or over 2,000 litres')} page.`)}</p>

<h2>${T('Ce que dit le prix maximum, et ce qu’il ne dit pas', 'Wat de maximumprijs zegt, en wat niet', 'What the maximum price says, and what it does not')}</h2>
<p>${T(
    `Le prix maximum est un plafond légal, TVA comprise : vendre au-dessus est interdit, vendre en dessous est permis et fréquent. Le chiffre affiché ici n’est donc pas le prix que vous paierez, mais celui qu’on ne peut pas vous dépasser. Si un devis vous est proposé, comparez-le au maximum du jour de livraison ; le guide ${h.a('prix-maximum', 'prix maximum du mazout')} explique comment lire une facture et ce que recouvrent les trois lignes du tarif.`,
    `De maximumprijs is een wettelijk plafond, inclusief btw: erboven verkopen is verboden, eronder verkopen mag en gebeurt vaak. Het getoonde cijfer is dus niet de prijs die u zult betalen, maar die welke u niet mag worden overschreden. Krijgt u een offerte, vergelijk ze dan met het maximum van de leveringsdag; de gids ${h.a('prix-maximum', 'maximumprijs van mazout')} legt uit hoe u een factuur leest en wat de drie lijnen van het tarief betekenen.`,
    `The maximum price is a legal ceiling, VAT included: selling above it is forbidden, selling below it is allowed and common. The figure shown here is therefore not the price you will pay, but the price nobody may charge you above. If you get a quote, compare it with the maximum for the delivery day; the ${h.a('prix-maximum', 'maximum price of heating oil')} guide explains how to read an invoice and what the three tariff lines cover.`)}</p>
<p>${T(
    'Depuis le 1er avril 2024, le gasoil de chauffage 50S a disparu du tarif ; les lignes officielles portent la mention H0/H7. Le prix « à la pompe » vise le mazout acheté en petite quantité à une station, en bidon par exemple.',
    'Sinds 1 april 2024 is gasolie verwarming 50S uit het tarief verdwenen; de officiële lijnen vermelden H0/H7. De prijs « aan de pomp » geldt voor mazout dat in kleine hoeveelheid aan een station wordt gekocht, bijvoorbeeld in een jerrycan.',
    'Since 1 April 2024, 50S heating gasoil has disappeared from the tariff; the official lines are labelled H0/H7. The “at the pump” price covers heating oil bought in small quantities at a filling station, in a jerrycan for instance.')}</p>

<h2>${T('Douze mois de prix du mazout', 'Twaalf maanden mazoutprijs', 'Twelve months of heating oil prices')}</h2>
${tabMois}
<p>${T(
    `Sur ces douze mois, la moyenne la plus haute est celle de ${mois(h, mMax[0])} (${h.l3(mMax[1])}), la plus basse celle de ${mois(h, mMin[0])} (${h.l3(mMin[1])}).${ya && yb ? ` En moyenne annuelle, le litre de moins de 2 000 litres est passé de ${h.l3(ya[1])} en ${ya[0]} à ${h.l3(yb[1])} en ${yb[0]} (année en cours).` : ''} La courbe jour par jour et les moyennes de chaque produit sont sur la page ${h.a('historique-mazout', 'historique du prix du mazout')}.`,
    `Over die twaalf maanden is het hoogste gemiddelde dat van ${mois(h, mMax[0])} (${h.l3(mMax[1])}), het laagste dat van ${mois(h, mMin[0])} (${h.l3(mMin[1])}).${ya && yb ? ` Als jaargemiddelde ging de liter onder 2.000 liter van ${h.l3(ya[1])} in ${ya[0]} naar ${h.l3(yb[1])} in ${yb[0]} (lopend jaar).` : ''} De dagcurve en de gemiddelden van elk product staan op de pagina ${h.a('historique-mazout', 'evolutie van de mazoutprijs')}.`,
    `Over these twelve months the highest average is ${mois(h, mMax[0])} (${h.l3(mMax[1])}), the lowest ${mois(h, mMin[0])} (${h.l3(mMin[1])}).${ya && yb ? ` As a yearly average, a litre under 2,000 litres went from ${h.l3(ya[1])} in ${ya[0]} to ${h.l3(yb[1])} in ${yb[0]} (year to date).` : ''} The day-by-day curve and the averages of every product are on the ${h.a('historique-mazout', 'heating oil price history')} page.`)}</p>

<h2>${T('Ce que coûte une année de chauffage', 'Wat een jaar verwarming kost', 'What a year of heating costs')}</h2>
<p>${T(
    'Une maison chauffée au mazout brûle chaque année un volume qui dépend de sa taille, de son isolation et de l’hiver ; vos factures d’une année complète le donnent mieux que n’importe quelle moyenne. Le tableau chiffre quatre volumes au prix maximum du jour et au prix moyen de l’année précédente.',
    'Een huis dat met mazout wordt verwarmd verbruikt elk jaar een volume dat afhangt van de grootte, de isolatie en de winter; uw facturen van een volledig jaar geven dat beter weer dan eender welk gemiddelde. De tabel rekent vier volumes door tegen de maximumprijs van vandaag en tegen de gemiddelde prijs van het vorige jaar.',
    'A house heated with oil burns a volume each year that depends on its size, insulation and the winter; your invoices for a full year give it better than any average. The table prices four volumes at today’s maximum price and at the previous year’s average price.')}</p>
${tabBudget}
<p>${T(
    `Pour votre propre volume, le ${h.a('budget-chauffage', 'budget de chauffage au mazout')} compare le prix du jour au plus bas et au plus haut de l’année, et à ce que vous avez payé à la dernière livraison.`,
    `Voor uw eigen volume vergelijkt het ${h.a('budget-chauffage', 'stookbudget voor mazout')} de prijs van vandaag met de laagste en hoogste van het jaar, en met wat u bij de laatste levering betaalde.`,
    `For your own volume, the ${h.a('budget-chauffage', 'heating oil budget')} compares today’s price with the year’s lowest and highest, and with what you paid at your last delivery.`)}</p>

<h2>${T('Une aide : le Fonds Social Chauffage', 'Een tegemoetkoming: het Sociaal Verwarmingsfonds', 'Help: the Social Heating Fund')}</h2>
<p>${T(
    `Les ménages aux revenus modestes peuvent obtenir une allocation par litre livré, versée par le Fonds Social Chauffage et demandée au CPAS de la commune dans les ${h.num(h.P.fonds.delai_jours)} jours qui suivent la livraison. Son montant dépend du prix facturé : au prix maximum du jour, il serait de ${h.num(al.cents)} cents par litre, soit ${h.eur(al.montant)} pour 1 000 litres, dans la limite de ${h.num(h.P.fonds.litres_max_an)} litres par année civile. Les conditions de revenus et le barème complet sont sur la page ${h.a('allocation-chauffage', 'allocation de chauffage')}.`,
    `Gezinnen met een bescheiden inkomen kunnen een toelage per geleverde liter krijgen, betaald door het Sociaal Verwarmingsfonds en aangevraagd bij het OCMW van de gemeente binnen ${h.num(h.P.fonds.delai_jours)} dagen na de levering. Het bedrag hangt af van de gefactureerde prijs: tegen de maximumprijs van vandaag zou het ${h.num(al.cents)} cent per liter zijn, of ${h.eur(al.montant)} voor 1.000 liter, binnen de grens van ${h.num(h.P.fonds.litres_max_an)} liter per kalenderjaar. De inkomensvoorwaarden en de volledige schaal staan op de pagina ${h.a('allocation-chauffage', 'verwarmingstoelage')}.`,
    `Households on modest incomes can get an allowance per litre delivered, paid by the Social Heating Fund and claimed at the municipality’s CPAS/OCMW (public social welfare centre) within ${h.num(h.P.fonds.delai_jours)} days of delivery. The amount depends on the invoiced price: at today’s maximum price it would be ${h.num(al.cents)} cents a litre, or ${h.eur(al.montant)} for 1,000 litres, up to ${h.num(h.P.fonds.litres_max_an)} litres per calendar year. Income conditions and the full scale are on the ${h.a('allocation-chauffage', 'heating allowance')} page.`)}</p>

<h2>${T('Diesel, essence et LPG', 'Diesel, benzine en LPG', 'Diesel, petrol and LPG')}</h2>
<p>${T(
    `Le même tarif officiel plafonne les carburants routiers. Aujourd’hui, le diesel B7 est au plus à ${h.l3(p('diesel_b7'))}, l’essence 95 E10 à ${h.l3(p('e10_95'))}, la 98 E5 à ${h.l3(p('e5_98'))} et le LPG à ${h.l3(p('lpg'))}. Leur prix change bien moins souvent que celui du mazout : ${h.num(M.changeStats('diesel_b7').changed)} nouveaux tarifs en un an pour le diesel, ${h.num(M.changeStats('e10_95').changed)} pour l’essence 95 E10, contre ${h.num(M.changeStats('mazout_lt2000').changed)} pour le mazout. Voir ${h.a('prix-diesel', 'prix du diesel')}, ${h.a('prix-essence', 'prix de l’essence')} et ${h.a('diesel-demain', 'diesel demain')}.`,
    `Hetzelfde officiële tarief begrenst de wegbrandstoffen. Vandaag kost diesel B7 hoogstens ${h.l3(p('diesel_b7'))}, benzine 95 E10 ${h.l3(p('e10_95'))}, 98 E5 ${h.l3(p('e5_98'))} en LPG ${h.l3(p('lpg'))}. Hun prijs verandert veel minder vaak dan die van mazout: ${h.num(M.changeStats('diesel_b7').changed)} nieuwe tarieven in een jaar voor diesel, ${h.num(M.changeStats('e10_95').changed)} voor benzine 95 E10, tegenover ${h.num(M.changeStats('mazout_lt2000').changed)} voor mazout. Zie ${h.a('prix-diesel', 'dieselprijs')}, ${h.a('prix-essence', 'benzineprijs')} en ${h.a('diesel-demain', 'dieselprijs morgen')}.`,
    `The same official tariff caps road fuels. Today diesel B7 costs at most ${h.l3(p('diesel_b7'))}, 95 E10 petrol ${h.l3(p('e10_95'))}, 98 E5 ${h.l3(p('e5_98'))} and LPG ${h.l3(p('lpg'))}. Their price changes far less often than heating oil’s: ${h.num(M.changeStats('diesel_b7').changed)} new tariffs in a year for diesel, ${h.num(M.changeStats('e10_95').changed)} for 95 E10 petrol, against ${h.num(M.changeStats('mazout_lt2000').changed)} for heating oil. See ${h.a('prix-diesel', 'diesel price')}, ${h.a('prix-essence', 'petrol price')} and ${h.a('diesel-demain', 'diesel price tomorrow')}.`)}</p>

<h2>${T('D’où viennent les chiffres', 'Waar de cijfers vandaan komen', 'Where the figures come from')}</h2>
<p>${T(
    `Chaque prix vient du ${h.src('bestatJour', 'tarif officiel des produits pétroliers diffusé par Statbel sur be.STAT')}, publié en données ouvertes sous ${h.src('statbelLicence', 'licence CC BY 4.0')}. Les moyennes viennent des tableaux ${h.src('bestatMois', 'mensuels')} et ${h.src('bestatAn', 'annuels')} de la même source. Le site les relit cinq fois par jour ; dernier relevé le ${h.date(M.FETCHED_AT.slice(0, 10))}, dernier jour publié le ${h.date(M.LAST_DAY)}. Le cadre du contrat-programme est décrit dans la ${h.src('chambreContrat', 'proposition de loi DOC 56 1452/001 de la Chambre')}, et la règle du prix maximum par le ${h.src('fondsPrix', 'Fonds Social Chauffage')}.`,
    `Elke prijs komt uit het ${h.src('bestatJour', 'officiële tarief van de aardolieproducten dat Statbel op be.STAT verspreidt')}, als open data gepubliceerd onder ${h.src('statbelLicence', 'licentie CC BY 4.0')}. De gemiddelden komen uit de ${h.src('bestatMois', 'maand')}- en ${h.src('bestatAn', 'jaartabellen')} van dezelfde bron. De site haalt ze vijf keer per dag op; laatste opvraging op ${h.date(M.FETCHED_AT.slice(0, 10))}, laatst gepubliceerde dag ${h.date(M.LAST_DAY)}. Het kader van de programmaovereenkomst staat in het ${h.src('chambreContrat', 'wetsvoorstel DOC 56 1452/001 van de Kamer')}, de regel van de maximumprijs bij het ${h.src('fondsPrix', 'Sociaal Verwarmingsfonds')}.`,
    `Every price comes from the ${h.src('bestatJour', 'official tariff of petroleum products released by Statbel on be.STAT')}, published as open data under the ${h.src('statbelLicence', 'CC BY 4.0 licence')}. The averages come from the ${h.src('bestatMois', 'monthly')} and ${h.src('bestatAn', 'yearly')} tables of the same source. The site reads them five times a day; last reading on ${h.date(M.FETCHED_AT.slice(0, 10))}, last day published ${h.date(M.LAST_DAY)}. The programme contract framework is described in the Chamber’s ${h.src('chambreContrat', 'bill DOC 56 1452/001')}, and the maximum-price rule by the ${h.src('fondsPrix', 'Social Heating Fund')}.`)} ${T(`Détail des formules et des tests : ${h.a('method', 'méthode et sources')}.`, `Formules en tests in detail: ${h.a('method', 'methode en bronnen')}.`, `Formulas and tests in detail: ${h.a('method', 'method and sources')}.`)}</p>

<h2>${T('Pourquoi ce site', 'Waarom deze site', 'Why this site')}</h2>
<p>${T(
    'Ce site fait mieux que le premier résultat Google parce qu’il donne le prix maximum officiel du jour et du lendemain relu directement chez Statbel cinq fois par jour, chiffre votre livraison au palier exact sans demander d’adresse, d’e-mail ni de numéro de téléphone, et publie l’écart réel de son estimation au lieu d’une prévision sans preuve. Il ne vend pas de mazout, ne transmet aucune demande à un négociant et ne touche aucune commission.',
    'Deze site doet het beter dan het eerste resultaat in Google omdat hij de officiële maximumprijs van vandaag en morgen vijf keer per dag rechtstreeks bij Statbel ophaalt, uw levering in de juiste schijf berekent zonder om een adres, e-mail of telefoonnummer te vragen, en de werkelijke afwijking van zijn schatting publiceert in plaats van een voorspelling zonder bewijs. Hij verkoopt geen mazout, stuurt geen aanvraag door naar een handelaar en ontvangt geen commissie.',
    'This site does better than the first Google result because it gives today’s and tomorrow’s official maximum price read directly from Statbel five times a day, prices your delivery in the exact band without asking for an address, email or phone number, and publishes the real error of its estimate instead of an unproven forecast. It sells no heating oil, passes no request on to a dealer and takes no commission.')}</p>
`;
};

const faqs = (h: Helpers) => {
  const { p, M } = { ...jour(h) };
  const bt = M.backtest('mazout_lt2000', 364);
  return [
    {
      q: h.T('À quelle heure le nouveau prix du mazout est-il connu ?', 'Hoe laat is de nieuwe mazoutprijs bekend?', 'When is the new heating oil price known?'),
      a: h.T(
        'Le SPF Économie fixe le tarif et Statbel le diffuse ; le tarif d’un jour figure souvent dans la série dès la veille. Le site relit be.STAT cinq fois par jour : dès que le lendemain y apparaît, la ligne « demain » passe d’estimation à tarif officiel. Si le relevé du jour n’a pas encore eu lieu, la page affiche le dernier jour publié et le signale clairement.',
        'De FOD Economie legt het tarief vast en Statbel verspreidt het; het tarief van een dag staat vaak al de dag ervoor in de reeks. De site haalt be.STAT vijf keer per dag op: zodra morgen erin staat, gaat de lijn « morgen » van schatting naar officieel tarief. Is de opvraging van vandaag nog niet gebeurd, dan toont de pagina de laatst gepubliceerde dag en meldt dat duidelijk.',
        'The FPS Economy sets the tariff and Statbel releases it; a day’s tariff is often in the series the day before. The site reads be.STAT five times a day: as soon as tomorrow appears, the “tomorrow” line switches from estimate to official tariff. If today’s reading has not happened yet, the page shows the last published day and says so clearly.'),
    },
    {
      q: h.T('Un négociant peut-il me facturer plus que le prix maximum ?', 'Mag een handelaar meer aanrekenen dan de maximumprijs?', 'Can a dealer charge me more than the maximum price?'),
      a: h.T(
        `Non. Le prix maximum, TVA comprise, est un plafond : le dépasser est interdit, quel que soit le négociant. Il peut en revanche vendre moins cher, et beaucoup le font. Comparez votre facture au maximum du jour de livraison et du bon palier : aujourd’hui ${h.l3(p('mazout_lt2000'))} sous 2 000 litres, ${h.l3(p('mazout_ge2000'))} à partir de 2 000 litres. En cas de dépassement, demandez d’abord une correction au vendeur.`,
        `Nee. De maximumprijs, inclusief btw, is een plafond: erboven gaan is verboden, voor elke handelaar. Hij mag wel goedkoper verkopen, en velen doen dat. Vergelijk uw factuur met het maximum van de leveringsdag en de juiste schijf: vandaag ${h.l3(p('mazout_lt2000'))} onder 2.000 liter, ${h.l3(p('mazout_ge2000'))} vanaf 2.000 liter. Bij een overschrijding vraagt u eerst de verkoper om een correctie.`,
        `No. The maximum price, VAT included, is a ceiling: going above it is forbidden for every dealer. A dealer may, however, sell for less, and many do. Compare your invoice with the maximum for the delivery day and the right band: today ${h.l3(p('mazout_lt2000'))} under 2,000 litres and ${h.l3(p('mazout_ge2000'))} from 2,000 litres. If it is exceeded, first ask the seller to correct it.`),
    },
    {
      q: h.T('L’estimation de demain est-elle fiable ?', 'Is de schatting voor morgen betrouwbaar?', 'How reliable is the estimate for tomorrow?'),
      a: h.T(
        `Elle n’est qu’une estimation, et nous publions son erreur : sur un an, l’écart moyen avec le tarif réellement publié a été de ${h.cts(bt.mae).replace(/^[+−±]/, '')} par litre, sous un cent dans ${h.pct(bt.within1c, 0)} des cas. Elle repose sur le dernier tarif connu et sur les variations observées le même jour de la semaine. Elle disparaît dès que le tarif officiel du lendemain est publié.`,
        `Het is slechts een schatting, en we publiceren de fout: over een jaar was de gemiddelde afwijking met het echt gepubliceerde tarief ${h.cts(bt.mae).replace(/^[+−±]/, '')} per liter, onder een cent in ${h.pct(bt.within1c, 0)} van de gevallen. Ze steunt op het laatst bekende tarief en op de schommelingen die op dezelfde weekdag zijn waargenomen. Ze verdwijnt zodra het officiële tarief van morgen gepubliceerd is.`,
        `It is only an estimate, and we publish its error: over a year the average gap with the tariff actually published was ${h.cts(bt.mae).replace(/^[+−±]/, '')} a litre, under one cent in ${h.pct(bt.within1c, 0)} of cases. It rests on the last known tariff and on the changes seen on the same weekday. It disappears as soon as tomorrow’s official tariff is published.`),
    },
    {
      q: h.T('Pourquoi le mazout est-il moins cher à partir de 2 000 litres ?', 'Waarom is mazout goedkoper vanaf 2.000 liter?', 'Why is heating oil cheaper from 2,000 litres?'),
      a: h.T(
        `Le tarif officiel prévoit un prix de livraison plus bas pour les commandes d’au moins 2 000 litres, appliqué à tout le volume. L’écart est aujourd’hui de ${h.cts(p('mazout_lt2000') - p('mazout_ge2000')).replace(/^[+−]/, '')} par litre. Une commande juste sous le seuil peut donc coûter presque autant que 2 000 litres ; le calculateur du seuil indique le volume à partir duquel il vaut mieux monter à 2 000 litres, si la citerne le permet.`,
        `Het officiële tarief voorziet een lagere leveringsprijs voor bestellingen van minstens 2.000 liter, toegepast op het hele volume. Het verschil bedraagt vandaag ${h.cts(p('mazout_lt2000') - p('mazout_ge2000')).replace(/^[+−]/, '')} per liter. Een bestelling net onder de drempel kan dus bijna evenveel kosten als 2.000 liter; de drempelberekening toont vanaf welk volume u beter naar 2.000 liter gaat, als de tank het toelaat.`,
        `The official tariff sets a lower delivery price for orders of at least 2,000 litres, applied to the whole volume. The gap today is ${h.cts(p('mazout_lt2000') - p('mazout_ge2000')).replace(/^[+−]/, '')} a litre. An order just under the threshold can therefore cost almost as much as 2,000 litres; the threshold calculator shows the volume from which it is better to go up to 2,000 litres, if the tank allows it.`),
    },
    {
      q: h.T('Le prix maximum affiché comprend-il la TVA ?', 'Is de getoonde maximumprijs inclusief btw?', 'Does the maximum price shown include VAT?'),
      a: h.T(
        `Oui. Tous les prix du site sont les prix maximums TVA de 21 % comprise, tels que Statbel les publie. Hors TVA, le litre de mazout de moins de 2 000 litres vaut aujourd’hui ${h.l3(p('mazout_lt2000') / (1 + h.P.tva))}. Le calculateur de livraison donne la part de TVA contenue dans le montant, utile pour lire une facture ou un devis qui sépare les deux.`,
        `Ja. Alle prijzen op de site zijn maximumprijzen inclusief 21 % btw, zoals Statbel ze publiceert. Zonder btw kost de liter mazout onder 2.000 liter vandaag ${h.l3(p('mazout_lt2000') / (1 + h.P.tva))}. De leveringsberekening toont het btw-deel in het bedrag, handig om een factuur of offerte te lezen die beide afzonderlijk vermeldt.`,
        `Yes. Every price on the site is a maximum price including 21% VAT, as Statbel publishes it. Excluding VAT, a litre of heating oil under 2,000 litres is worth ${h.l3(p('mazout_lt2000') / (1 + h.P.tva))} today. The delivery calculator shows the VAT share of the amount, which helps when reading an invoice or quote that lists both separately.`),
    },
    {
      q: h.T('Quelle différence entre le mazout livré et le mazout à la pompe ?', 'Wat is het verschil tussen geleverde mazout en mazout aan de pomp?', 'What is the difference between delivered heating oil and pump heating oil?'),
      a: h.T(
        `Le tarif officiel fixe un prix pour les livraisons en citerne, en deux paliers selon le volume, et un prix plus élevé pour le mazout acheté à la pompe en petite quantité. Aujourd’hui, le maximum à la pompe est de ${h.l3(p('mazout_pompe'))}, contre ${h.l3(p('mazout_lt2000'))} livré sous 2 000 litres. Les trois prix sont recalculés le même jour.`,
        `Het officiële tarief legt een prijs vast voor leveringen in de tank, in twee schijven naargelang het volume, en een hogere prijs voor mazout die in kleine hoeveelheid aan de pomp wordt gekocht. Vandaag is het maximum aan de pomp ${h.l3(p('mazout_pompe'))}, tegenover ${h.l3(p('mazout_lt2000'))} geleverd onder 2.000 liter. De drie prijzen worden op dezelfde dag herberekend.`,
        `The official tariff sets a price for tank deliveries, in two bands by volume, and a higher price for heating oil bought in small quantities at the pump. Today the maximum at the pump is ${h.l3(p('mazout_pompe'))}, against ${h.l3(p('mazout_lt2000'))} delivered under 2,000 litres. All three prices are recalculated on the same day, from the same quotations.`),
    },
    {
      q: h.T('Le site vend-il du mazout ou transmet-il mes coordonnées ?', 'Verkoopt de site mazout of geeft hij mijn gegevens door?', 'Does the site sell heating oil or pass on my details?'),
      a: h.T(
        'Non. MazoutMax est un site d’information édité par Radif Partners, sans lien avec un négociant, le SPF Économie ou Statbel. Aucun formulaire ne demande votre adresse, votre e-mail ou votre téléphone, et les calculs se font dans votre navigateur. Pour commander, adressez-vous directement au négociant de votre choix, avec le prix maximum du jour en tête.',
        'Nee. MazoutMax is een informatiesite van Radif Partners, zonder band met een handelaar, de FOD Economie of Statbel. Geen enkel formulier vraagt naar uw adres, e-mail of telefoon, en de berekeningen gebeuren in uw browser. Om te bestellen wendt u zich rechtstreeks tot de handelaar van uw keuze, met de maximumprijs van de dag in het achterhoofd.',
        'No. MazoutMax is an information site published by Radif Partners, with no link to any dealer, the FPS Economy or Statbel. No form asks for your address, email or phone, and the calculations run in your browser. To order, contact the dealer of your choice directly, with the day’s maximum price in mind.'),
    },
  ];
};

const base = { resume, faqs, body };
export const HOME: Record<Lang, Home> = {
  fr: {
    ...base,
    title: 'Prix mazout aujourd’hui et demain : tarif officiel 2026',
    description: 'Prix maximum officiel du mazout aujourd’hui et demain en Belgique, coût de votre livraison sous ou dès 2 000 litres et tous les carburants, sans téléphone.',
    h1: 'Prix du mazout aujourd’hui et demain',
    intro: 'Le prix maximum officiel du jour et du lendemain, le montant de votre livraison, et une estimation chiffrée quand demain n’est pas encore publié.',
    calcTitle: 'Tous les prix maximums, aujourd’hui et demain',
  },
  nl: {
    ...base,
    title: 'Mazoutprijs vandaag en morgen: officieel tarief 2026',
    description: 'Officiële maximumprijs van mazout vandaag en morgen in België, berekening van uw levering onder of boven 2.000 liter en alle brandstofprijzen, zonder telefoon.',
    h1: 'Mazoutprijs vandaag en morgen',
    intro: 'De officiële maximumprijs van vandaag en morgen, het bedrag van uw levering, en een onderbouwde schatting zolang morgen nog niet gepubliceerd is.',
    calcTitle: 'Alle maximumprijzen, vandaag en morgen',
  },
  en: {
    ...base,
    title: 'Heating oil price today and tomorrow: official tariff 2026',
    description: 'Belgium’s official maximum heating oil price today and tomorrow, the cost of your delivery under or over 2,000 litres and every road fuel, with no phone number.',
    h1: 'Heating oil price today and tomorrow',
    intro: 'Today’s and tomorrow’s official maximum price, the cost of your delivery, and a measured estimate while tomorrow is not yet published.',
    calcTitle: 'All maximum prices, today and tomorrow',
  },
};
