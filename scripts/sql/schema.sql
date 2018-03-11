
CREATE TABLE users (
  id serial primary key,
  username character varying(255) NOT NULL UNIQUE,
  password character varying(255) NOT NULL,
  name character varying(255) NOT NULL,
  image character varying(255)
);

CREATE TABLE categories (
  id serial primary key,
  title character varying(255) NOT NULL UNIQUE
);

CREATE TABLE books (
  id serial primary key,
  title character varying(255) NOT NULL UNIQUE,
  author text NOT NULL,
  description text NOT NULL,
  isbn10 character varying(10),
  isbn13 character varying(13) NOT NULL UNIQUE,
  category serial references categories(id),

  published character varying(10),
  pageCount character varying(10),
  language character varying(2)
);

CREATE TABLE read_books (
  id serial primary key,
  book_id serial references books(id),
  user_id serial references users(id),
  rating integer,
  review text
);
