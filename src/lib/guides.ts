/** Registre des guides et des pages outils : chaque fichier de `src/content/` est chargé ici. */
import type { PageDef, Group } from './guide-types';
const mods = import.meta.glob<{ default: PageDef }>(['../content/guides/*.ts', '../content/outils/*.ts'], { eager: true });
export const PAGES: PageDef[] = Object.entries(mods)
  .map(([file, m]) => {
    const g = m.default;
    const base = file.split('/').pop()!.replace(/\.ts$/, '');
    if (g.id !== base) throw new Error(`${file} : id « ${g.id} » différent du nom du fichier`);
    return g;
  })
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const GROUPS: Group[] = ['mazout', 'carburants', 'comprendre'];
export const pageById = (id: string) => PAGES.find((p) => p.id === id);
