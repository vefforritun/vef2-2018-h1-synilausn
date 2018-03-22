const xss = require('xss');
const { paged, query, conditionalUpdate } = require('../db');
const { validateBook } = require('../validation');

async function categoriesRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const categories = await paged('SELECT * FROM categories', { offset, limit });

  return res.json(categories);
}

async function categoriesPostRoute(req, res) {
  const { title } = req.body;

  if (typeof title !== 'string' || title.length === 0) {
    return res.status(400).json({
      errors: [{ field: 'title', message: 'Title is required and must not be empty' }],
    });
  }

  const cat = await query('SELECT * FROM categories WHERE title = $1', [title]);

  if (cat.rows.length > 0) {
    return res.status(400).json({
      errors: [{ field: 'title', message: `Category "${title}" already exists` }],
    });
  }

  const q = 'INSERT INTO categories (title) VALUES ($1) RETURNING *';
  const result = await query(q, [xss(title)]);

  return res.status(201).json(result.rows[0]);
}

async function booksRoute(req, res) {
  const { offset = 0, limit = 10, search = '' } = req.query;

  let q = `
    SELECT
      books.*, categories.title AS categoryTitle
    FROM books
    LEFT JOIN categories ON books.category = categories.id
    ORDER BY title ASC
  `;
  const values = [];

  if (typeof search === 'string' && search !== '') {
    q = `
      SELECT * FROM books
      WHERE
        to_tsvector('english', title) @@ plainto_tsquery('english', $1)
        OR
        to_tsvector('english', description) @@ plainto_tsquery('english', $1)
      ORDER BY title ASC
    `;
    values.push(search);
  }

  const books = await paged(q, { offset, limit, values });

  return res.json(books);
}

async function booksPostRoute(req, res) {
  const validationMessage = await validateBook(req.body);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const q = `INSERT INTO books
    (title, isbn13, author, description, category, isbn10, published, pageCount, language)
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`;

  const data = [
    xss(req.body.title),
    xss(req.body.isbn13),
    xss(req.body.author),
    xss(req.body.description),
    Number(xss(req.body.category)),
    xss(req.body.isbn10),
    xss(req.body.published),
    xss(req.body.pageCount),
    xss(req.body.language),
  ];

  const result = await query(q, data);

  return res.status(201).json(result.rows[0]);
}

async function bookRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const book = await query(`
    SELECT
      books.*, categories.title AS categoryTitle
    FROM books
    LEFT JOIN categories ON books.category = categories.id
    WHERE books.id = $1
  `, [id]);

  if (book.rows.length === 0) {
    return res.status(404).json({ error: 'Book not found' });
  }

  return res.json(book.rows[0]);
}

async function bookPatchRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const book = await query('SELECT * FROM books WHERE id = $1', [id]);

  if (book.rows.length === 0) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const validationMessage = await validateBook(req.body, id, true);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const isset = f => typeof f === 'string' || typeof f === 'number';

  const fields = [
    isset(req.body.title) ? 'title' : null,
    isset(req.body.isbn13) ? 'isbn13' : null,
    isset(req.body.author) ? 'author' : null,
    isset(req.body.category) ? 'category' : null,
    isset(req.body.description) ? 'description' : null,
    isset(req.body.isbn10) ? 'isbn10' : null,
    isset(req.body.published) ? 'published' : null,
    isset(req.body.pageCount) ? 'pageCount' : null,
    isset(req.body.language) ? 'language' : null,
  ];

  const values = [
    isset(req.body.title) ? xss(req.body.title) : null,
    isset(req.body.isbn13) ? xss(req.body.isbn13) : null,
    isset(req.body.author) ? xss(req.body.author) : null,
    isset(req.body.category) ? xss(req.body.category) : null,
    isset(req.body.description) ? xss(req.body.description) : null,
    isset(req.body.isbn10) ? xss(req.body.isbn10) : null,
    isset(req.body.published) ? xss(req.body.published) : null,
    isset(req.body.pageCount) ? xss(req.body.pageCount) : null,
    isset(req.body.language) ? xss(req.body.language) : null,
  ];

  const result = await conditionalUpdate('books', id, fields, values);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  return res.status(201).json(result.rows[0]);
}

module.exports = {
  categoriesRoute,
  categoriesPostRoute,
  booksRoute,
  booksPostRoute,
  bookRoute,
  bookPatchRoute,
};
