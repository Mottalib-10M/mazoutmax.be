/**
 * Registre des mini-simulateurs (RECETTE §9.3) : un fichier par sujet dans `lib/minis/<kind>.ts`,
 * chargé ici automatiquement. Chaque fichier exporte `default` : (lang) => MiniSpec, et appelle le
 * moteur du site (lib/engine), jamais un second calcul.
 */
import type { MiniSpec } from './mini-types';
export type Lang = 'fr' | 'nl' | 'en';
type Factory = (l: Lang) => MiniSpec;
const mods = import.meta.glob<{ default: Factory }>(['./minis/*.ts', '!./minis/_*.ts'], { eager: true });
export const MINIS: Record<string, Factory> = Object.fromEntries(
  Object.entries(mods).map(([f, m]) => [f.split('/').pop()!.replace(/\.ts$/, ''), m.default]),
);
export function getSpec(kind: string, lang: string): MiniSpec {
  const f = MINIS[kind];
  if (!f) throw new Error(`Mini-simulateur inconnu : ${kind} (créer src/lib/minis/${kind}.ts)`);
  return f(lang === 'en' ? 'en' : lang === 'nl' ? 'nl' : 'fr');
}
