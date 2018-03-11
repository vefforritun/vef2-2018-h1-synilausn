require('dotenv').config();

const fs = require('fs');
const util = require('util');
const path = require('path');

const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

const readFileAsync = util.promisify(fs.readFile);

const file = process.argv[2];

if (!file) {
  console.error('No sql file given.');
  process.exit(1);
}

async function query(q) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q);

    const { rows } = result;
    return rows;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

async function create() {
  const pathAndFile = path.join(__dirname, `sql/${file}`);

  const data = await readFileAsync(pathAndFile);

  await query(data.toString('utf-8'));

  console.info('Query run');
}

create().catch((err) => {
  console.error('Error running query:', err.message);
});
