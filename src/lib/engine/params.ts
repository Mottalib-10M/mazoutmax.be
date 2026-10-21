/** Paramètres fixes (RECETTE §4) et tarif officiel du jour (be.STAT), lus une seule fois. */
import raw from '../../data/params-2026.json';
import tarif from '../../data/tarif.json';
export const P = raw;
export type Params = typeof raw;
export type SourceKey = keyof typeof raw.sources;
export const YEAR_PARAMS = raw.year;
export const TARIF = tarif;
