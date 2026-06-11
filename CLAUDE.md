# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is an educational web application repository ("Terka – rodinná cvičení") for school exercises targeting a 7th-grade Czech student. Covers Czech language, English language, and History. Hosted on GitHub Pages at https://padak.github.io/

The goal is that the student **learns** the material by practising it — so a test must *teach*, not just grade. Every question carries an explanation of why the correct answer is right (`oduvodneni`) and why each wrong answer is wrong (`proc_spatne`).

## Content Workflow

The end-to-end process for building a topic — read source photos → author the questions JSON → **review via `/second-opinion` (Codex)** → add support data (timeline, glossary, cheat sheet) → build the HTML pages → publish to GitHub Pages — is documented in [CONTRIBUTING.md](CONTRIBUTING.md). Read it before authoring a new test. The `/second-opinion` review is a mandatory quality gate: a test that teaches a wrong fact is worse than no test.

## Architecture

### Directory Layout

```
├── index.html              # (not yet created — README.md serves as hub)
├── README.md               # Link hub with all exercises
├── cj/                     # Czech language exercises
│   ├── slovni_druhy_test.json          # 50 sentences — word categorization into 10 parts of speech
│   ├── slovni-druhy-test.html          # Desktop test
│   ├── slovni-druhy-test-mobil.html    # Mobile test
│   ├── vyjmenovana_slova_test.json     # Exception words (y/i) — categories B,L,M,P,S,V,Z
│   ├── vyjmenovana-slova-test.html     # Desktop test
│   └── vyjmenovana-slova-test-mobil.html # Mobile test
├── en/                     # English language exercises
│   ├── english_tenses_test.json        # 100 sentences — Present Simple vs Continuous
│   ├── english-tenses-practice.html    # Desktop test
│   └── english-tenses-practice-mobile.html # Mobile test
└── dejepis/                # History exercises (7th grade)
    ├── index.html                      # Landing page with all history topics
    ├── questions.json                  # 40 questions — Early Middle Ages (4 themes)
    ├── cesky-stat-questions.json       # 30 questions — Origins of Czech State
    ├── posledni-premyslovci-questions.json # 50 questions — Last Přemyslovci dynasty
    ├── dejepis-test.html               # Desktop test (Early Middle Ages)
    ├── dejepis-test-mobil.html         # Mobile test
    ├── dejepis-flashcards.html         # Flashcards
    ├── dejepis-intro.html              # Prep page (timeline, glossary, cheat sheet)
    ├── story.html / story.md           # Narrative text covering the material
    ├── ucebnice.html / ucebnice.md     # OCR transcription of textbook pages
    ├── cesky-stat-test.html            # Desktop test (Czech State)
    ├── cesky-stat-test-mobil.html      # Mobile test
    ├── cesky-stat-flashcards.html      # Flashcards
    ├── posledni-premyslovci-test-mobil.html # Mobile test (Přemyslovci)
    ├── posledni-premyslovci-flashcards.html # Flashcards
    ├── lucemburkove-questions.json     # 50 questions — Luxembourg dynasty
    ├── lucemburkove-test-mobil.html    # Mobile test (Lucemburkové)
    ├── lucemburkove-flashcards.html    # Flashcards (blue/teal theme)
    ├── husitska-revoluce-questions.json # 50 questions — Hussite Revolution
    ├── husitska-revoluce-test-mobil.html # Mobile test (Husitská revoluce)
    ├── husitska-revoluce-flashcards.html # Flashcards (red/amber theme)
    ├── husitska-revoluce-intro.html    # Prep page with cheat sheet (Husitská revoluce)
    ├── konec-stredoveku-questions.json # 50 questions — End of Middle Ages (35 teacher + 15 textbook)
    ├── konec-stredoveku-test-mobil.html # Mobile test (Konec středověku) - filter by source
    ├── konec-stredoveku-flashcards.html # Flashcards (gold/violet theme)
    ├── konec-stredoveku-intro.html     # Prep page with cheat sheet (Konec středověku)
    └── img/                            # Scanned textbook images (JPEG)
```

### Data Structure
- **JSON data files**: Store exercise content separately from presentation
  - `cj/slovni_druhy_test.json`: `{sentences: [{id, sentence, word, correct, options, hint}]}` — 50 items
  - `cj/vyjmenovana_slova_test.json`: `{categories: {B: {base, examples}, L: ...}, settings}` — y/i pairs per category
  - `en/english_tenses_test.json`: `{sentences: [{id, sentence, correct, options, hint}]}` — 100 items
  - `dejepis/*-questions.json`: **One file per topic** is the single source of truth for that topic's test, flashcards and intro page. Top-level shape:
    ```
    {jazyk, rocnik, tema: [...names], zdroj, hlavni_osy: [...], terminologie: {section: [{pojem, vysvetleni}]}, casova_osa: [{rok, udalost}], otazky: [...]}
    ```
    Each entry in the flat `otazky` array:
    ```
    {id, tema, obtiznost, typ, otazka, spravna_odpoved, spatne_odpovedi: [...3], oduvodneni, proc_spatne: {"<wrong answer text>": "why it's wrong"}}
    ```
    Sub-themes are the distinct values of each question's `tema` field, not a nested structure. `oduvodneni` explains why the correct answer is right; `proc_spatne` maps each wrong answer string to why that specific choice is wrong (keys must match `spatne_odpovedi` exactly).
  - Per-file specifics:
    - `questions.json` — Early Middle Ages, 40 questions
    - `cesky-stat-questions.json` — 30 questions
    - `posledni-premyslovci-questions.json` — 50 questions
    - `lucemburkove-questions.json` — 50 questions
    - `husitska-revoluce-questions.json` — 50 questions
    - `konec-stredoveku-questions.json` — 50 questions; variant shape with split sources: `zdroj_ucitelka`/`zdroj_ucebnice`, `kategorie`, `hlavni_osy_ucitelka`/`hlavni_osy_ucebnice`, and a `zdroj_kategorie` (`ucitelka`|`ucebnice`) field per question so the test can filter by source (35 teacher + 15 textbook bonus)

### HTML Applications
All HTML files are **self-contained** with inline CSS and JavaScript, loading data from JSON files via fetch API.

#### Exercise Types
1. **Tests** (desktop + mobile) — Multiple-choice with immediate feedback, score tracking, final results
2. **Flashcards** — Flippable cards with keyboard navigation (arrows + space), topic filtering
3. **Intro/prep pages** — Timeline, glossary, cheat sheet (dejepis only)
4. **Story pages** — Narrative text for reading comprehension (dejepis only)
5. **Textbook pages** — OCR transcription with referenced images (dejepis only)

#### Desktop vs Mobile
- **Desktop version**: Full-featured with sidebar guides
- **Mobile version** (`-mobile.html` or `-mobil.html`): Touch-optimized with collapsible guides

## Development Commands

### Local Testing
```bash
# Serve files locally (required for JSON loading due to CORS)
python3 -m http.server
# Then open: http://localhost:8000/
```

### Deployment
```bash
# Files are served directly via GitHub Pages
git push origin main
# Access at: https://padak.github.io/[path]
```

## Key Implementation Patterns

### Adding New Exercises
1. Create JSON data file following the existing structure for that subject:
   - Czech language (`cj/`): sentence-based with word/options/correct/hint
   - History (`dejepis/`): theme-grouped with questions, answers array, correct index, difficulty, explanation
2. Create HTML file(s) that:
   - Load data via fetch from relative JSON path
   - Handle CORS errors with helpful message about local server
   - Implement immediate feedback on user selection
   - Track score and show final results
3. For history topics, consider creating the full set: test (mobile), flashcards, and optionally intro/story pages
4. Update `dejepis/index.html` or `README.md` with links to new content

### Adding New History Topics
The history section follows a repeatable pattern per topic (full step-by-step process in [CONTRIBUTING.md](CONTRIBUTING.md)):
1. `{topic}-questions.json` — question data, plus `terminologie` / `casova_osa` / `hlavni_osy_*` that power the flashcards and intro page from the same file
2. **Review the questions via `/second-opinion`** for factual accuracy before building any HTML
3. `{topic}-test-mobil.html` — mobile test
4. `{topic}-flashcards.html` — flashcards
5. `{topic}-intro.html` — timeline + glossary + cheat sheet (recommended)
6. Add cards to `dejepis/index.html` under a new `<h2>` section, and links to `README.md`

### Mobile Optimization
Mobile versions should:
- Use larger touch targets (min 44x44px)
- Implement collapsible guides with details/summary elements
- Grid layout for options (2 columns on mobile)
- Simplified feedback messages

### Visual Style
- Gradient backgrounds (purple/indigo tones)
- White card-based layouts with rounded corners and shadows
- Consistent color scheme: primary `#4f46e5` / `#4338ca`, text `#1f2937`, muted `#6b7280`

## File Naming Conventions
- Czech language content: `cj/` directory
- English language content: `en/` directory
- History content: `dejepis/` directory
- Mobile versions: append `-mobile` or `-mobil` to filename
- Data files: `_test.json` (cj, en) or `-questions.json` (dejepis)
- HTML filenames use kebab-case, JSON filenames use snake_case or kebab-case
