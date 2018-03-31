# Hópverkefni 1 – sýnilausn

## Skipulag á verkefni

* `app.js` er inngangspunktur í verkefni og tengir auðkenningu og API
* `auth.js`
  - Stillir auðkenningu og exportar _subapp_ sem megin app notar
  - Exportar middleware sem krefst auðkenningar og setur `req.user`
* `api/` skilgreinir alla API endapunkta sem eru ekki auðkenning
* `db.js` hjálparföll fyrir tengingar við gagnagrunn
* `users.js` hjálparföll fyrir notendaumsjón
* `validation.js` hjálparföll fyrir staðfestingu á gögnum

## Uppsetning

* Búa til gagnagrunn fyrir verkefni, t.d. `h1`
* Setja `DATABASE_URL` í `.env`
* Keyra script til að útbúa skema, `node scripts/query schema.sql`
* Færa gögn úr `data/books.csv` inn í gagnagrunn: `node scripts/import_from_csv.js`
  - Ef eitthvað fer úrskeiðis er hægt að keyra `node scripts/query drop.sql` til að hreinsa gagnagrunn og byrja upp á nýtt
* Setja önnur gildi í `.env`:
  - `PORT`, port sem vefur keyrir á
  - `HOST`, host sem vefur keyrir á
  - `JWT_SECRET`, leyndarmál fyrir undirskrift á token
  - `JWT_TOKE_LIFETIME`, líftími token í sekúndum
  - `CLOUDINARY_URL`, stilling fyrir cloudinary, fengin úr cloudinary console
  - `CLOUDINARY_CLOUD`, stilling fyrir cloudinary, fengin úr cloudinary console
  - `CLOUDINARY_API_KEY`, stilling fyrir cloudinary, fengin úr cloudinary console
  - `CLOUDINARY_API_SECRET`, stilling fyrir cloudinary, fengin úr cloudinary console
* Keyra með `npm start`

### Uppsetning á Heroku

Setja upp `app` á Heroku og setja gildi í config, keyra viðeigandi script:

```bash
$ heroku run node scripts/query schema.sql
$ heroku run node scripts/import_from_csv
Starting import
```
