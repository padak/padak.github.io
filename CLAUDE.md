# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is an educational web application repository ("Terka – rodinná cvičení") for school exercises targeting a 7th-grade Czech student. Covers Czech language, English language, and History. Hosted on GitHub Pages at https://padak.github.io/

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
    └── img/                            # Scanned textbook images (JPEG)
```

### Data Structure
- **JSON data files**: Store exercise content separately from presentation
  - `cj/slovni_druhy_test.json`: `{sentences: [{id, sentence, word, correct, options, hint}]}` — 50 items
  - `cj/vyjmenovana_slova_test.json`: `{categories: {B: {base, examples}, L: ...}, settings}` — y/i pairs per category
  - `en/english_tenses_test.json`: `{sentences: [{id, sentence, correct, options, hint}]}` — 100 items
  - `dejepis/questions.json`: `{tema: [{nazev, otazky: [{id, otazka, odpovedi, spravna, obtiznost, vysvetleni}]}]}` — 4 themes
  - `dejepis/cesky-stat-questions.json`: Same structure as above — 1 theme, 30 questions
  - `dejepis/posledni-premyslovci-questions.json`: Same structure — 1 theme, 50 questions
  - `dejepis/lucemburkove-questions.json`: Same structure — 6 themes, 50 questions

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
The history section follows a repeatable pattern per topic:
1. `{topic}-questions.json` — question data
2. `{topic}-test-mobil.html` — mobile test
3. `{topic}-flashcards.html` — flashcards
4. Add cards to `dejepis/index.html` under a new `<h2>` section

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
