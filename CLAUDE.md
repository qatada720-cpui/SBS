# SafeBusinessSelling — Claude instructies

## Testregel

Na elke nieuwe feature die gebouwd is, geef je altijd een testinstructie met:

1. **Wat te testen** — welke pagina of functie
2. **Hoe te testen** — exacte stappen (geen vage beschrijving)
3. **Wat het resultaat moet zijn** — wat je verwacht te zien als het werkt
4. **Waar te controleren in Supabase** — welke tabel of bucket je moet checken als er DB/Storage betrokken is

Formaat dat je altijd gebruikt na een build:

```
## Test: [naam van de feature]

**Stappen:**
1. Start dev server: `! npm run dev`
2. Ga naar [pagina/url]
3. Doe [actie]
4. Controleer [wat je ziet]

**Verwacht resultaat:** [beschrijving]

**Supabase check:** [tabel/bucket/kolom om te controleren]
```
