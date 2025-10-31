# Dějepis - Raný středověk 📜

Kompletní vzdělávací sada pro procvičení látky o raném středověku (7. ročník ZŠ).

## 📚 Témata

- **Franská říše** - Merovejci, Karolínci, Karel Veliký, rozdělení říše
- **Vikingové** - Skandinávie, drakkary, Thing, osídlení Islandu
- **Byzantská říše** - Konstantinopol, Justinián, Theodora, Hagia Sofia
- **Arabská říše** - Muhammad, islám, pět pilířů, arabská věda

## 🎯 Jak se učit

### 1. Přečti si příběh 📖
Začni přečtením [story.md](story.md) - poutavý příběh, který pokrývá celou látku. Pomůže ti pochopit souvislosti a zapamatovat si klíčové události.

### 2. Projdi si přípravnou stránku 📝
Otevři [dejepis-intro.html](dejepis-intro.html) a prostuduj:
- **Časovou osu** - vizuální přehled událostí 476-1453
- **Slovníček pojmů** - klíčové termíny pro každé téma
- **Cheat Sheet** - rychlé shrnutí pro opakování

### 3. Procvičuj s flash cards 🃏
Použij [dejepis-flashcards.html](dejepis-flashcards.html):
- Interaktivní kartičky s otázkami a odpověďmi
- Kliknutím otočíš kartičku
- Klávesy: ← → pro navigaci, mezerník pro otočení

### 4. Vyzkoušej si test 🎯
Spusť [dejepis-test.html](dejepis-test.html) (desktop) nebo [dejepis-test-mobil.html](dejepis-test-mobil.html) (mobil):
- **34 otázek** celkem (9 Franská říše, 7 Vikingové, 10 Byzantská říše, 8 Arabská říše)
- Vyber si počet otázek, témata a obtížnost
- Okamžitá zpětná vazba s vysvětlením
- Sledování statistik

## 📂 Struktura souborů

```
dejepis/
├── questions.json              # 34 otázek s odpověďmi a odůvodněními
├── story.md                    # Poutavý příběh pokrývající látku
├── ucebnice.md                 # OCR přepis učebnice
├── dejepis-intro.html          # Přípravná stránka (časová osa, slovníček, cheat sheet)
├── dejepis-test.html           # Test (desktop verze)
├── dejepis-test-mobil.html     # Test (mobilní verze)
├── dejepis-flashcards.html     # Flash cards pro procvičování
└── README.md                   # Tento soubor
```

## 🚀 Spuštění

HTML soubory vyžadují lokální server kvůli načítání JSON dat:

```bash
# V terminálu ve složce terka_skola:
python3 -m http.server

# Pak otevři v prohlížeči:
# http://localhost:8000/dejepis/dejepis-intro.html
# http://localhost:8000/dejepis/dejepis-test.html
# http://localhost:8000/dejepis/dejepis-flashcards.html
```

## ✨ Funkce

### Test
- ✅ Filtrace podle tématu a obtížnosti
- ✅ Náhodné pořadí otázek a odpovědí
- ✅ Okamžitá zpětná vazba (správně/špatně)
- ✅ Detailní vysvětlení správné odpovědi
- ✅ Vysvětlení, proč jsou ostatní odpovědi špatně
- ✅ Statistiky (správně/celkem, procenta)
- ✅ Finální hodnocení

### Flash Cards
- ✅ Otočitelné kartičky
- ✅ Klávesová navigace (← → mezerník)
- ✅ Filtrace podle tématu
- ✅ Progress tracker

### Přípravná stránka
- ✅ Interaktivní časová osa
- ✅ Slovníček pojmů podle témat
- ✅ Cheat sheet pro rychlé opakování
- ✅ Odkazy na všechny materiály

## 📊 Statistika otázek

| Téma | Počet otázek | Lehká | Střední |
|------|--------------|-------|---------|
| Franská říše | 9 | 2 | 7 |
| Vikingové | 7 | 2 | 5 |
| Byzantská říše | 10 | 3 | 7 |
| Arabská říše | 8 | 2 | 6 |
| **Celkem** | **34** | **9** | **25** |

## 🎓 Tipy pro učení

1. **První krok**: Přečti si příběh 1-2× pro celkový přehled
2. **Druhý krok**: Prostuduj časovou osu a slovníček
3. **Třetí krok**: Procvičuj s flash cards (alespoň 2× projdi všechny)
4. **Čtvrtý krok**: Zkus test s malým počtem otázek (10-15)
5. **Finální test**: Když zvládáš 80%+, zkus celý test (všechny 34 otázek)

## 💡 Pro rodiče

Doporučené pořadí učení:
1. **Den 1**: Číst příběh + projít časovou osu
2. **Den 2**: Flash cards (50% otázek)
3. **Den 3**: Flash cards (zbytek) + první test (10 otázek)
4. **Den 4**: Opakování cheat sheetu + test (20 otázek)
5. **Den 5**: Finální test (všechny otázky)

## 🔗 Užitečné odkazy

- [GitHub Pages](https://padak.github.io/dejepis/dejepis-intro.html) - živá verze
- [Zpět na hlavní stránku](../)

---

Vytvořeno s láskou pro Terku 💝
