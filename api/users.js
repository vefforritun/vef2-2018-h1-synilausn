const cloudinary = require('cloudinary');
const multer = require('multer');

const { findById, updateUser } = require('../users');
const { query, paged } = require('../db');
const { validateUser } = require('../validation');

const uploads = multer({ dest: './temp' });

const {
  CLOUDINARY_CLOUD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('Missing cloudinary config, uploading images will not work');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// leyfum abstraction sem users.js gefur okkur að leka aðeins hérna
async function usersRoute(req, res) {
  const { offset = 0 } = req.query;
  const users = await paged('SELECT * FROM users', { offset });

  users.items.map((i) => {
    delete i.password; // eslint-disable-line
    return i;
  });

  return res.json(users);
}

async function userRoute(req, res) {
  const { id } = req.params;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'User not found' });
  }

  delete user.password;

  return res.json(user);
}

async function meRoute(req, res) {
  const { id } = req.user;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'You not found' });
  }

  delete user.password;

  return res.json(user);
}

async function mePatchRoute(req, res) {
  const { id } = req.user;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'You not found' });
  }

  const { password, name } = req.body;

  const validationMessage = await validateUser({ password, name }, true);

  if (validationMessage.length > 0) {
    return res.status(400).json({ errors: validationMessage });
  }

  const result = await updateUser(id, password, name);

  if (!result) {
    return res.status(400).json({ error: 'Nothing to patch' });
  }

  delete result.password;
  return res.status(200).json(result);
}

async function meProfileRoute(req, res, next) {
  const { file: { path } = {} } = req;
  const { id } = req.user;

  const user = await findById(id);

  if (user === null) {
    return res.status(404).json({ error: 'You not found' });
  }

  if (!path) {
    return res.status(400).json({ error: 'Unable to read image' });
  }

  let upload = null;

  try {
    upload = await cloudinary.v2.uploader.upload(path);
  } catch (error) {
    if (error.http_code && error.http_code === 400) {
      return res.status(400).json({ error: error.message });
    }

    console.error('Unable to upload file to cloudinary:', path);
    return next(error);
  }

  const q = 'UPDATE users SET image = $1 WHERE id = $2 RETURNING *';

  const result = await query(q, [upload.secure_url, user.id]);

  const row = result.rows[0];
  delete row.password;

  return res.status(201).json(row);
}

async function meProfileRouteWithMulter(req, res, next) {
  uploads.single('profile')(req, res, (err) => {
    if (err) {
      if (err.message === 'Unexpected field') {
        return res.status(400).json({ error: 'Unable to read image' });
      }

      return next(err);
    }

    return meProfileRoute(req, res, next);
  });
}

module.exports = {
  usersRoute,
  userRoute,
  meRoute,
  mePatchRoute,
  meProfileRouteWithMulter,
};
