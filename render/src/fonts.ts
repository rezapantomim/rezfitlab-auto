import { loadFont as loadHead } from '@remotion/google-fonts/Anton';
import { loadFont as loadBody } from '@remotion/google-fonts/Inter';

// latin-ext carries the Turkish letters (ğ ş ı İ)
export const HEAD = loadHead('normal', { subsets: ['latin', 'latin-ext'] }).fontFamily;
export const BODY = loadBody('normal', { weights: ['400', '600', '800'], subsets: ['latin', 'latin-ext'] }).fontFamily;
