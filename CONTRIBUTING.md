# CONTRIBUTING — How we build a test

This repo exists for one reason: **Terka learns the school material by practising it.**
Every test, flashcard deck and prep page is a means to that end. A test that only
*checks* knowledge is half the job — the real value is that going through it
*teaches* the material, including **why each wrong answer is wrong**.

This document describes the end-to-end workflow for turning a stack of study
photos into a published, self-teaching exercise. For repository structure,
naming conventions and visual style see [CLAUDE.md](CLAUDE.md).

> Communication about the work happens in Czech, but files (docs, code, JSON
> keys) stay as they are: the data is Czech (it's Czech school content), the
> documentation and code identifiers are English.

---

## The core idea: one JSON, many ways to learn

A single data file — `dejepis/{topic}-questions.json` — is the source of truth
for an entire topic. Multiple self-contained HTML pages read that same file via
`fetch()` and present it differently:

```
                         ┌─────────────────────────────┐
                         │  {topic}-questions.json     │
                         │                             │
   otazky[]  ───────────▶│  • otazky[]      (the test) │
   terminologie  ───────▶│  • terminologie  (glossary) │
   casova_osa  ─────────▶│  • casova_osa    (timeline) │
   hlavni_osy_*  ───────▶│  • hlavni_osy_*  (cheatsheet)│
                         └──────────────┬──────────────┘
                                        │ fetch()
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
   {topic}-test-mobil.html   {topic}-flashcards.html   {topic}-intro.html
   reads: otazky[],          reads: terminologie,      reads: casova_osa,
   zdroj_kategorie           casova_osa, otazky        terminologie,
                                                       hlavni_osy_*
```

Practical consequence: **enrich the JSON, not just the questions.** When you add
a topic, fill in `terminologie`, `casova_osa` and `hlavni_osy_*` too — that's
what powers the flashcards and the prep page for free.

---

## Workflow: from photo to published test

### 1. Collect the source material

Study photos (teacher's handouts, textbook pages) go into `dejepis/img/`. There
are usually two kinds of source, and we keep them distinct because the teacher's
material is mandatory and the textbook is bonus context:

- **Teacher's handouts** — the required scope. These define what *must* be in the test.
- **Textbook pages** — extra context that deepens understanding (optional).

### 2. Read the material

Read the photos carefully (OCR + visual reading). Extract the actual facts,
dates, names and cause-effect chains — not a vague summary. The questions can
only be as accurate as this reading. When two sources disagree or a date is
fuzzy, prefer the teacher's handout (that's what gets graded at school).

### 3. Author the questions JSON

Create `dejepis/{topic}-questions.json`. Use an existing file as a template —
[`konec-stredoveku-questions.json`](dejepis/konec-stredoveku-questions.json) is
the richest example (it also splits questions by source — see
`zdroj_kategorie`). The **question contract** is documented in detail
[below](#the-question-contract).

Aim for ~50 questions, mixed difficulty (`lehka` / `stredni` / `tezka`),
covering every sub-theme of the source material. Don't cluster all the easy
recall questions at the front — interleave difficulty so practising the whole
deck stays useful.

Once written, validate the JSON and the `proc_spatne` ↔ `spatne_odpovedi`
invariant (a typo'd key means the "why wrong" message silently never renders):

```bash
python3 -c "
import json,collections
d=json.load(open('dejepis/{topic}-questions.json'))
q=d['otazky']; errs=0; ids=set()
for o in q:
    if o['id'] in ids: print(o['id'],'duplicate id'); errs+=1
    ids.add(o['id'])
    if o['spravna_odpoved'] in o['spatne_odpovedi']: print(o['id'],'correct also in wrong'); errs+=1
    if set(o['proc_spatne'])!=set(o['spatne_odpovedi']): print(o['id'],'proc_spatne keys mismatch'); errs+=1
print(len(q),'questions,',errs,'errors')
print('difficulty:',dict(collections.Counter(o['obtiznost'] for o in q)))
"
```

### 4. Get a second opinion (mandatory quality gate)

Before building any HTML, **have the questions reviewed by another model** with
the [`/second-opinion`](/.claude) skill (Codex / OpenAI backend):

```
/second-opinion check the historical accuracy and the wrong-answer
explanations in dejepis/{topic}-questions.json
```

This is not optional polish — it's the safety net. A test that teaches a *wrong*
fact is worse than no test. The reviewer should check:

- **Factual accuracy** — are the correct answers actually correct? Dates, names, causality.
- **Distractor quality** — are the wrong answers *plausible* (a real misconception) rather than obviously silly?
- **Explanation soundness** — does `oduvodneni` truly justify the right answer, and does each `proc_spatne` entry correctly explain the specific error?

Fix everything the review surfaces before moving on.

**When the reviewer disagrees with the teacher's handout, the handout wins.**
The goal is the school grade: the answer the student writes must match what the
teacher taught. If a second opinion flags a teacher's simplification as
historically imprecise (real examples: "Rudolfův majestát guaranteed freedom for
*all* inhabitants", "the Thirty Years' War killed a third of *Europe*"), keep the
teacher's answer but tighten the *explanation* (`oduvodneni`) to add the accurate
nuance. Only change the actual `spravna_odpoved` when it's wrong by the teacher's
own material — not merely by stricter history. Surface these conflicts to the
parent rather than silently "correcting" them.

### 5. Fill in the support data

In the same JSON, populate the fields that power the other pages (step 1 of "one
JSON, many views"):

- `terminologie` — key terms grouped by sub-theme → glossary + flashcards
- `casova_osa` — `[{rok, udalost}]` → timeline on the intro page and flashcards
- `hlavni_osy_*` — the cheat-sheet bullets (the "if you remember nothing else" lines)

### 6. Create the HTML pages

Each topic gets the standard set (clone from the most recent topic — they're
self-contained with inline CSS/JS, so copy + adjust the `fetch()` filename, the
title, and the colour theme):

| File | Required? | Purpose |
|---|---|---|
| `{topic}-test-mobil.html` | yes | Mobile multiple-choice test with immediate feedback |
| `{topic}-flashcards.html` | yes | Flippable cards, keyboard nav, topic filtering |
| `{topic}-intro.html` | recommended | Timeline + glossary + cheat sheet (prep before the test) |
| `{topic}-test.html` | optional | Desktop test with sidebar guide |

Give each topic a distinct colour theme so the decks are visually
distinguishable (e.g. Husité = red/amber, Konec středověku = gold/violet).

### 7. Test locally

JSON loading needs a real HTTP server (CORS blocks `file://` fetch):

```bash
python3 -m http.server
# open http://localhost:8000/dejepis/{topic}-test-mobil.html
```

Click through: every question shows the right answer + `oduvodneni`, and a wrong
pick shows the matching `proc_spatne`. Check the flashcards and intro page load
their data too.

### 8. Wire up the links

Add the new topic to both hubs:

- [`README.md`](README.md) — the top-level link list (test · flashcards · intro)
- [`dejepis/index.html`](dejepis/index.html) — a card block under a new `<h2>`

### 9. Publish

GitHub Pages serves the files directly — pushing to `main` *is* the deploy:

```bash
git push origin main
# live at https://padak.github.io/dejepis/{topic}-test-mobil.html
```

---

## The question contract

Every entry in `otazky[]` follows this shape. The two explanation fields are
what make the test *teach* rather than just *grade*.

```json
{
  "id": "KS1",
  "tema": "Městská společnost na konci středověku",
  "zdroj_kategorie": "ucitelka",
  "obtiznost": "lehka",
  "typ": "single_choice",
  "otazka": "Kde žila většina obyvatel na konci středověku?",
  "spravna_odpoved": "Na vesnicích jako zemědělci",
  "spatne_odpovedi": [
    "Ve městech jako řemeslníci",
    "Na hradech jako vojáci",
    "V klášterech jako mniši"
  ],
  "oduvodneni": "V průběhu vrcholného a pozdního středověku se život prostých vesničanů téměř neměnil - většina obyvatel byli zemědělci na venkově.",
  "proc_spatne": {
    "Ve městech jako řemeslníci": "Řemeslníků bylo v poměru k zemědělcům málo - i v největších městech žila jen menšina lidí.",
    "Na hradech jako vojáci": "Hrady obývala jen úzká vrstva šlechty s družinou - rozhodně ne většina obyvatel.",
    "V klášterech jako mniši": "Kláštery byly jen pro mnichy/jeptišky - v žádné době nebyly většinou obyvatel."
  }
}
```

| Field | Meaning |
|---|---|
| `id` | Stable short id (topic prefix + number, e.g. `KS1`) |
| `tema` | Sub-theme — used for grouping / filtering |
| `zdroj_kategorie` | `ucitelka` (mandatory) or `ucebnice` (bonus). Only where the topic mixes sources; lets the test filter by source |
| `obtiznost` | `lehka` / `stredni` / `tezka` |
| `typ` | `single_choice` (current pages assume one correct answer) |
| `otazka` | The question text |
| `spravna_odpoved` | The single correct answer (string, not an index) |
| `spatne_odpovedi` | Array of 3 plausible distractors |
| `oduvodneni` | **Why the correct answer is right** — always shown after answering |
| `proc_spatne` | Map `wrong answer text → why that specific choice is wrong` — shown when the user picks that wrong answer |

**Note on the format:** answers are stored as *strings*, and `proc_spatne` keys
must match the `spatne_odpovedi` strings **exactly** (the HTML looks up
`question.proc_spatne[selectedAnswer]`). A typo in the key means no "why wrong"
message renders. There is no `spravna` index and no flat `vysvetleni` field —
that was an earlier format and is no longer used.

### What makes a good wrong answer

The distractors carry half the teaching value. A good wrong answer is a **real
misconception a 7th-grader could plausibly hold**, and its `proc_spatne` entry
names the *specific* confusion:

- ✅ Plausible-but-wrong: the right century but wrong ruler; the right person but wrong deed; a commonly swapped pair of terms.
- ❌ Throwaway: obviously absurd options, joke answers, or three near-identical wrongs. They teach nothing and make the right answer guessable.

Each `proc_spatne` line should leave the reader understanding *why they were
tempted and what the actual fact is* — not just "wrong".

---

## Quality checklist

Before publishing, confirm:

- [ ] Questions cover **every** sub-theme of the source photos (not just the easy bits)
- [ ] Difficulty is mixed and interleaved
- [ ] Every distractor is plausible; every `proc_spatne` explains the specific error
- [ ] `proc_spatne` keys match `spatne_odpovedi` strings exactly
- [ ] Czech text is correct, with full diacritics
- [ ] **Passed a `/second-opinion` review** for factual accuracy
- [ ] `terminologie`, `casova_osa`, `hlavni_osy_*` filled in (powers flashcards + intro)
- [ ] Pages load and work via local `http.server`
- [ ] Links added to `README.md` and `dejepis/index.html`
