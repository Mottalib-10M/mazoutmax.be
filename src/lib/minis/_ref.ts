/** Jour de référence des mini-simulateurs : le jour du build, ramené au dernier jour publié. */
import { LAST_DAY } from '../engine/tarif';
import { BUILD_TODAY } from '../today';
export const REF = BUILD_TODAY > LAST_DAY ? LAST_DAY : BUILD_TODAY;
