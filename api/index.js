const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();

const {
  categoriesRoute,
  categoriesPostRoute,
  booksRoute,
  booksPostRoute,
  bookRoute,
  bookPatchRoute,
} = require('./books');

const {
  usersRoute,
  userRoute,
  meRoute,
  mePatchRoute,
  meProfileRouteWithMulter,
} = require('./users');

const {
  userReadRoute,
  meReadRoute,
  meReadPostRoute,
  meReadDeleteRoute,
} = require('./read');

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

function indexRoute(req, res) {
  return res.json({
    authentication: {
      register: '/register',
      login: '/login',
    },
    books: {
      books: '/books',
      book: '/book/{id}',
    },
    categories: '/categories',
    users: {
      users: '/users',
      user: '/users/{id}',
      read: '/users/{id}/read',
    },
    me: {
      me: '/users/me',
      profile: '/users/me/profile',
      read: '/users/me/read',
    },
  });
}

router.get('/', indexRoute);

router.get('/users', requireAuth, catchErrors(usersRoute));
router.get('/users/me', requireAuth, catchErrors(meRoute));
router.get('/users/:id', requireAuth, catchErrors(userRoute));
router.patch('/users/me', requireAuth, catchErrors(mePatchRoute));
router.post('/users/me/profile', requireAuth, catchErrors(meProfileRouteWithMulter));
router.get('/categories', catchErrors(categoriesRoute));
router.post('/categories', requireAuth, catchErrors(categoriesPostRoute));
router.get('/books', catchErrors(booksRoute));
router.post('/books', requireAuth, catchErrors(booksPostRoute));
router.get('/books/:id', catchErrors(bookRoute));
router.patch('/books/:id', requireAuth, catchErrors(bookPatchRoute));
router.get('/users/me/read', requireAuth, catchErrors(meReadRoute));
router.get('/users/:id/read', requireAuth, catchErrors(userReadRoute));
router.post('/users/me/read', requireAuth, catchErrors(meReadPostRoute));
router.delete('/users/me/read/:id', requireAuth, catchErrors(meReadDeleteRoute));

module.exports = router;
