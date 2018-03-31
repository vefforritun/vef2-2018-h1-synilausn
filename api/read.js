const xss = require('xss');
const { findById } = require('../users');
const { query, paged } = require('../db');
const { validateRead } = require('../validation');

async function userReadRoute(req, res) {
  const { id } = req.params;
  const { offset = 0 } = req.query;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'User not found' });
  }

  const read = await paged('SELECT * FROM read_books WHERE user_id = $1', { offset, values: [id] });

  return res.json(read);
}

async function meReadRoute(req, res) {
  const { id } = req.user;
  const { offset = 0 } = req.query;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'You not found' });
  }

  const read = await paged('SELECT * FROM read_books WHERE user_id = $1', { offset, values: [id] });

  return res.json(read);
}

async function meReadPostRoute(req, res) {
  const { id } = req.user;
  const validationMessage = await validateRead(req.body);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const q = `
    INSERT INTO
      read_books
      (book_id, user_id, rating, review)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    xss(req.body.bookId),
    id,
    xss(req.body.rating),
    xss(req.body.review || ''),
  ];

  const result = await query(q, values);

  return res.status(201).json(result.rows[0]);
}

async function meReadDeleteRoute(req, res) {
  const { id: readId } = req.params;
  const { id: userId } = req.user;

  const user = await findById(userId);

  if (user === null) {
    return res.status(404).json({ error: 'You not found' });
  }

  if (!Number.isInteger(Number(readId))) {
    return res.status(404).json({ error: 'Read entry not found' });
  }

  const del = await query('DELETE FROM read_books WHERE id = $1', [readId]);

  if (del.rowCount === 1) {
    return res.status(204).json({});
  }

  return res.status(404).json({ error: 'Read entry not found' });
}

module.exports = {
  userReadRoute,
  meReadRoute,
  meReadPostRoute,
  meReadDeleteRoute,
};
