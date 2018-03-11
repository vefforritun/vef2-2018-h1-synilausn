# Að fylla gagnagrunn af bókum

Í `.env` þarf að skilgreina `DATABASE_URL` sem gagnagrunn geyma mun gögn og `GOOGLE_BOOKS_API_KEY` sem er API lykill að þjónustu Google sem mun sjá okkkur fyrir upplýsingum um bækur.

Allar `sql` skipanir má keyra með `query.js <nafn á sql scriptu í sql/>`, t.d. `node query.js import.sql`.

1. Safna saman lista af bókum með a.m.k. ISBN13 gildi, aukalega titli og höfundi
  a. Hægt að nota t.d. excel eða e-ð spreadsheet forrit til að safna saman
  b. Sjá dæmi í `import.sql`
2. Keyra `import.sql` og búa þar með til töfluna `import` til að geyma upplýsingar um import
3. Keyra `import.js` þar til allt er sótt
  a. sækir N bækur í röð (`batchSize` breyta í kóða með gildi `100`) frá Google Books eftir ISBN13
  b. uppfærir færslu í `import` töflu með gögnum, dálkar sem uppfærðir eru heita allir `import_` eitthvað
  c. ef bók finnst ekki eru dálkar settir sem tómi strengur nema `import_title` settur sem `Not found`
4. Skoða gögn og hugsanlega henda út einhverju sem á ekki við
5. Útbúa töflur fyrir verkefni með því að keyra `schema.sql`
6. Keyra gögn á milli `import` töflu og `books` töflu með `copy.sql`
  a. einhverra hluta vegna skilar API bókinni `Genreflecting` í ca. 1% tilvika (!?) það er gert ráð fyrir því þegar við færum á milli taflna
  b. í öðrum tilfellum er bók í bókflokk gefið nafn bókaflokks (t.d. `Saga`). Við getum fundið þessi tilvik með því að keyra `SELECT imported_title, count(*) FROM import GROUP BY imported_title HAVING count(*) > 1;` (veljum úr öllum færslum, hópuðum eftir `imported_title` titil og fjölda tilvika þar sem tilvik eru fleiri en eitt). Gerum ráð fyrir þessu í scriptu

Ef allt gekk eftir ættu núna `category` og `books` töflur að innihalda gögn 🎉

## Útbúa CSV úr töflu

Til að færa öll gögn úr töflu í `csv` skrá er `csv.sql` keyrt sem nýtir innbyggða virkni í postgres til að exporta gögnum.

## Útbúa töflu úr CSV

Tvær leiðir til að færa gögn úr `csv` skrá inn í gagngagrunn: nota innbyggða virkni í postgres og skrifa kóða. Þessi lausn notar kóða í `import_from_csv.js`.
