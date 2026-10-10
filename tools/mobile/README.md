# Underdeck: z PC buildu mobilní web

Hra běží na https://dettbob.github.io/Underdeck/ (GitHub Pages z větve `main`).

## Nový build z PC
1. Ulož nový PC build (jeden .html soubor).
2. `python3 tools/mobilize.py cesta/k/Underdeck.html`
3. Skript přepíše `index.html` a zvýší verzi cache v `sw.js`. Ikony a manifest se nemění.
4. Zkontroluj hru v telefonní velikosti, pak commit a push na `main`. Pages se aktualizují do pár minut.

## Když skript nahlásí chybu
PC build změnil kus kódu, na který se úprava napojuje. Úpravu pak dodělej ručně podle názvu kroku v `mobilize.py`.
Části, které se vkládají beze změny, jsou v této složce:
- `mobile.css` – rozložení pro telefon, popisky na dotyk, okno zálohy
- `touch.js` – klepnutí/podržení zobrazí popis karty, odemknutí zvuku na iOS
- `save.js` – ukládání rozehrané hry (`ud_run`), Pokračovat, záloha přes kód
- `backup.html` – okno „Záloha postupu“

## Uložená data (localStorage)
`ud_meta` diamanty a vylepšení, `ud_stats` statistiky, `ud_run` rozehraná hra, `ud_vmus`/`ud_vsfx` hlasitost.
Rozehraná hra je uložený stav `S` a `CARDS`. Když nový build změní jejich tvar, starý `ud_run` může přestat sedět;
`runLoad()` ho v tom případě ignoruje a diamanty zůstanou.
