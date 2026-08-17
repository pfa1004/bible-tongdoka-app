import { BOOK_DETAILED_INTROS } from '../src/data/bookIntrosData.ts';
import { BIBLE_BOOKS } from '../src/data/bibleData.ts';

const keys = Object.keys(BOOK_DETAILED_INTROS);
console.log("Found intros keys count:", keys.length);

BIBLE_BOOKS.forEach(b => {
  if (!BOOK_DETAILED_INTROS[b.id]) {
    console.log("MISSING BOOK INTRO:", b.id, b.name);
  }
});
