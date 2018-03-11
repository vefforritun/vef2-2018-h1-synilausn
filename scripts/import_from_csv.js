/* eslint-disable no-await-in-loop */

require('dotenv').config();

const csvdata = require('csvdata');
const { query } = require('../db');

async function importCategories(rows) {
  const categories = [];

  // finna einstaka flokka
  rows.forEach((row) => {
    if (categories.indexOf(row.category) < 0) {
      categories.push(row.category);
    }
  });

  // breyta hverjum einstökum flokk í insert fyrir þann flokk
  const q = 'INSERT INTO categories (title) VALUES ($1) RETURNING *';
  const inserts = categories.map(c => query(q, [c]));

  // inserta öllu og bíða
  const results = await Promise.all(inserts);

  const mapped = {};

  // skila á forminu { NAFN: id, .. } svo það sé auðvelt að fletta upp
  results.forEach((r) => {
    const [{
      id,
      title,
    }] = r.rows;

    mapped[title] = id;
  });

  return mapped;
}

async function importBook(row, categories) {
  const q = `
    INSERT INTO
      books
      (title, author, description, isbn10, isbn13, published, pageCount, language, category)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

  const category = categories[row.category];
  const pageCount = parseInt(row.pagecount, 10);
  const pageCountValue = Number.isNaN(pageCount) ? null : pageCount;

  const values = [
    row.title,
    row.author,
    row.description,
    row.isbn10,
    row.isbn13,
    row.published,
    pageCountValue,
    row.language,
    category,
  ];

  return query(q, values);
}

async function importData() {
  console.info('Starting import');

  const file = './data/books.csv';

  const rows = await csvdata.load(file);

  const categories = await importCategories(rows);

  console.info('Categories created');

  for (let i = 0; i < rows.length; i += 1) {
    await importBook(rows[i], categories);
    console.info(`Imported ${rows[i].title}`);
  }

  console.info('Finished!');
}

importData().catch((err) => {
  console.error('Error importing', err);
});
