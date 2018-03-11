-- Tekur gögn úr books töflu og vistar sem CSV í /tmp/books.csv
COPY (
  SELECT
    title, author, description, isbn10, isbn13, published, pageCount, language,
    (SELECT c.title FROM categories AS c WHERE c.id = category) AS category
  FROM
    books
  ORDER BY title
) TO '/tmp/books.csv' WITH (FORMAT CSV, HEADER);
