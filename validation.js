const users = require('./users');
const { query } = require('./db');

const invalidField = s => s !== undefined && typeof s !== 'string';
const isEmpty = s => s != null && !s;

async function validateUser({ username, password, name }, patch = false) {
  const validationMessages = [];

  // can't patch username
  if (!patch) {
    if (typeof username !== 'string' || username.length < 3) {
      validationMessages.push({
        field: 'username',
        message: 'Username is required and must be at least three letters',
      });
    }

    const user = await users.findByUsername(username);

    if (user) {
      validationMessages.push({
        field: 'username',
        message: 'Username is already registered',
      });
    }
  }

  if (!patch || password) {
    if (typeof password !== 'string' || password.length < 6) {
      validationMessages.push({
        field: 'password',
        message: 'Password must be at least six letters',
      });
    }
  }

  if (!patch || name || isEmpty(name)) {
    if (typeof name !== 'string' || name.length === 0) {
      validationMessages.push({
        field: 'name',
        message: 'Name is required and must not be empty',
      });
    }
  }

  return validationMessages;
}

async function validateBook({
  title,
  isbn13,
  author,
  category = null,
  description,
  isbn10,
  published,
  pageCount,
  language,
} = {}, id = null, patch = false) {
  const messages = [];

  if (!patch || title || isEmpty(title)) {
    if ((typeof title !== 'string' || title.length === 0)) {
      messages.push({
        field: 'title',
        message: 'Title is required and must not be empty',
      });
    }
  }

  if (!patch || title || isEmpty(title)) {
    const book = await query('SELECT * FROM books WHERE title = $1', [title]);

    // leyfum að uppfæra titil í sama titil
    if (book.rows.length > 0 && (Number(book.rows[0].id) !== Number(id))) {
      messages.push({ field: 'title', message: `Book "${title}" already exists` });
    }
  }

  if (!patch || isbn13 || isEmpty(isbn13)) {
    if (!/^[0-9]{13}$/.test(isbn13)) {
      messages.push({ field: 'isbn13', message: 'ISBN-13 value is invalid' });
    }

    const isbn13exists = await query('SELECT * FROM books WHERE isbn13 = $1', [isbn13]);

    // leyfum að uppfæra isbn13 í sama isbn13
    if (isbn13exists.rows.length > 0 && (Number(isbn13exists.rows[0].id) !== Number(id))) {
      messages.push({ field: 'isbn13', message: `ISBN-13 value "${isbn13}" already exists` });
    }
  }

  if (!patch || category || isEmpty(category)) {
    const err = { field: 'category', message: `Category with id "${category}" does not exist` };

    if (!Number.isInteger(Number(category))) {
      messages.push(err);
    } else {
      const catExists = await query('SELECT * FROM categories WHERE id = $1', [category]);
      if (catExists.rows.length === 0) {
        messages.push(err);
      }
    }
  }

  if (invalidField(language)) {
    messages.push({ field: 'language', message: 'Language must be a string' });
  }

  if (invalidField(author)) {
    messages.push({ field: 'author', message: 'Author must be a string' });
  }

  if (invalidField(description)) {
    messages.push({ field: 'description', message: 'Description must be a string' });
  }

  if (invalidField(published)) {
    messages.push({ field: 'published', message: 'Published must be a string' });
  }

  if (isbn10) {
    if (!/^[0-9]{10}$/.test(isbn10)) {
      messages.push({
        field: 'isbn10',
        message: 'ISBN-10 value is invalid',
      });
    }
  }

  if (pageCount) {
    if (!(Number.isInteger(Number(pageCount)) && Number(pageCount) > 0)) {
      messages.push({
        field: 'pageCount',
        message: 'pageCount must be an integer larger than 0',
      });
    }
  }

  return messages;
}

async function validateRead({ bookId, rating, review }) {
  const messages = [];

  if (!bookId || !Number.isInteger(Number(bookId))) {
    messages.push({ field: 'bookId', message: 'Book is required and must be an integer' });
  } else {
    const book = await query('SELECT * FROM books WHERE id = $1', [bookId]);

    if (book.rows.length === 0) {
      messages.push({ field: 'bookId', message: `Book "${bookId}" does not exists` });
    }
  }

  if (!rating || typeof rating !== 'number') {
    messages.push({ field: 'rating', message: 'Rating is required and must be a number' });
  } else if ([1, 2, 3, 4, 5].indexOf(rating) < 0) {
    messages.push({ field: 'rating', message: 'Rating must be 1, 2, 3, 4 or 5' });
  }

  if (invalidField(review)) {
    messages.push({ field: 'review', message: 'Review must be a string' });
  }

  return messages;
}

module.exports = {
  validateUser,
  validateBook,
  validateRead,
};
