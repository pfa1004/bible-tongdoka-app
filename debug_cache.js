const fs = require('fs');

const BIBLE_BOOKS = require('./src/data/bibleData.ts').BIBLE_BOOKS;
// we can't easily require ts, let's just write a script to check localStorage in the browser?
// No, the agent runs on the server side. The cache is in localStorage on the client.
