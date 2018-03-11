
INSERT INTO categories (title) (SELECT category AS title FROM import GROUP BY category);

INSERT INTO books (title, author, description, isbn10, isbn13, published, pageCount, language, category)
(
SELECT
  (
    CASE
      WHEN (
        SELECT
          count(titleCheck.*)
        FROM
          import AS titleCheck
        WHERE titleCheck.imported_title = 'Saga'
        GROUP BY titleCheck.imported_title
        HAVING count(*) > 1
      ) > 1 THEN title
      WHEN imported_title <> 'Not found' THEN imported_title
      ELSE title
    END
  ) as title,
  (CASE WHEN imported_title <> 'Not found' THEN imported_author ELSE author END) as author,
  imported_description AS description,
  imported_isbn10 AS isbn10,
  isbn13,
  imported_publishedDate AS published,
  imported_pageCount AS pageCount,
  imported_language AS language,
  (SELECT id FROM categories AS c WHERE c.title = category) AS category
FROM
  import
WHERE
  imported = true AND
  imported_title <> 'Genreflecting'
)