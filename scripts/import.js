/* eslint-disable no-await-in-loop */

require('dotenv').config();
require('isomorphic-fetch');

const { query } = require('../db');

const {
  GOOGLE_BOOKS_API_KEY: API_KEY,
} = process.env;

if (!API_KEY) {
  console.error('Missing GOOGLE_BOOKS_API_KEY from .env');
  process.exit(1);
}

async function fetchBook(isbn13) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${isbn13}&key=${API_KEY}`;

  const response = await fetch(url);

  if (response.status >= 400) {
    throw new Error(`Server responded with ${response.status}`);
  }

  const result = await response.json();

  const {
    items: [{
      volumeInfo: {
        title = 'Not found',
        authors: [author = ''] = [],
        publishedDate = '',
        description = '',
        pageCount = '',
        categories: [category = ''] = [],
        language = '',
        industryIdentifiers = [],
      } = {},
    } = {}] = [],
  } = result;

  // finna isbn10 eða skila tómu niðurstöðunni
  const isbn10 = (industryIdentifiers.find(i => i.type === 'ISBN_10') ||
                 { identifier: '' }).identifier;

  return {
    title,
    author,
    publishedDate,
    description,
    pageCount,
    category,
    language,
    isbn10,
    isbn13,
  };
}

async function importBook(id, data) {
  const q = `UPDATE import SET
  imported_title = $1,
  imported_author = $2,
  imported_publishedDate = $3,
  imported_description = $4,
  imported_pageCount = $5,
  imported_category = $6,
  imported_language = $7,
  imported_isbn10 = $8,
  imported_isbn13 = $9,
  imported = $10
  WHERE id = $11
  `;

  const values = [
    data.title,
    data.author,
    data.publishedDate,
    data.description,
    data.pageCount,
    data.category,
    data.language,
    data.isbn10,
    data.isbn13,
    true,
    id,
  ];

  await query(q, values);

  return true;
}

async function importNextBook() {
  const result = await query('SELECT * FROM import WHERE imported = false ORDER BY id LIMIT 1');

  if (result.length === 0) {
    return false;
  }

  const [{
    id,
    title,
    isbn13,
  }] = result;

  console.info(`Importing ${id} – ${title} – ${isbn13}`);

  const data = await fetchBook(isbn13);

  await importBook(id, data);

  return true;
}

async function importBooks() {
  console.info('Starting import');

  const batchSize = 100;

  let counter = 0;
  let imported = false;
  do {
    try {
      imported = await importNextBook();
    } catch (error) {
      console.error('Error importing, exiting', error);
      process.exit(1);
    }
    counter += 1;
  } while (imported && counter < batchSize);

  console.info('Finished');
}

importBooks().catch((err) => {
  console.error('Error importing', err);
});
