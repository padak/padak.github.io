---
name: brain-bench-case
description: Use when creating, extending or reviewing a detective / cold-case / murder-mystery puzzle game for the Brain Bench section of padak.github.io (brain-bench/), or any case-file game where players read witness statements and evidence and must name the culprit — including requests like "vyrob detektivní hru", "nový případ", "odložený případ", "case file game", "murder mystery for kids".
---

# Brain Bench detective case

A case game is a **proof, not a story**: from the player file alone there must be exactly one culprit, and every innocent must be cleared by independent evidence. Every gate below exists because skipping it shipped a real defect in the first case (`brain-bench/odlozeny-pripad/`, the reference implementation — copy its renderer and data shape).

## Workflow (gates are mandatory)

1. **Ask first, in one batch, only what the brief leaves open:** crime type and how dark, city and year, play time, number of players and devices, how the answer is checked, hint style and scoring, audience age. If the brief answers everything, state your defaults in one line and go. Then work alone.
   - **Deadline check:** the gates below take a full working session (each Astra pass 2–5 min, builds 15–30 min, images several minutes). If the owner wants it sooner, say so at once and offer a smaller case, never skipped gates.
2. **Case bible** `brain-bench/<slug>/CASE.md` (English, spoilers): minute-level true timeline, cast table (role, motive, alibi, truth), why the original investigation failed, the solution chain with document letters, how each innocent is eliminated, hint ladder.
3. **Gate — Astra on the narrative** (`second-opinion` skill; command: `codex exec -m gpt-6-astra -c model_reasoning_effort="medium" -s read-only --skip-git-repo-check -o r1.md "$(cat q1.md)" < /dev/null`, run in the background) with the bible. Ask for: logic holes, uniqueness, every elimination, giveaway documents, difficulty for the age, red herrings, why the police failed, hints. Incorporate or rebut each point in writing.
4. **Write `case.json`** (Czech player text; same shape as the reference). Budget by play time: 30 min ≈ 12–16 documents and ~1 500 words; 45 min ≈ 20–25 documents and ~2 000–2 500 words. The briefing states the rules: one culprit from the listed suspects, acting alone; which sources are truthful; suspects may lie; how scoring and penalties work.
5. **Gate — Astra on the puzzle:** export with `python3 .claude/skills/brain-bench-case/export_player.py brain-bench/<slug>/case.json <outdir>`, send `player.txt` + `solution.txt`. Ask for contradictions (quote both places), uniqueness, giveaways, form fairness, Czech language, hints.
6. **Gate — blind solve:** a fresh subagent reads **only** `player.txt` (name the forbidden files explicitly), fills every form answer, gives the reasoning chain, ambiguities and difficulty. Wrong answer or a reported loose end = fix the content. Re-run after any substantial content change.
7. **Images** (Nano Banana): see Images below.
8. **Build** (delegate to a subagent with the reference renderer as the base): document looks per Document realism below; iPad first, phone reader mode; verify with Playwright at 375×812, 820×1180, 1180×820 (no console errors, no horizontal scroll, every document opens, wrong and correct accusation, hints).
9. **Gate — text diff around any visual pass:** `python3 .claude/skills/brain-bench-case/doctext.py snapshot <case.json> <file>` before, `... check <case.json> <file>` after. Any change not made on purpose is a defect.
10. **Ship:** branch, PR (bind it and turn on Auto-fix per the owner's global rules), merge, then `curl` the live `case.json` and images until they return 200; add the game card to `brain-bench/index.html` and a dated line in `README.md`.

## Framing

- The player is a detective working from a file; the case can be any crime (murder, theft, robbery, burglary). "Cold case" means a shelved police file reopened years later; for a recent case use "the file from the investigation team" instead. The briefing names the player's role and the year of the events.
- Two devices: the main device has timer, hints and the accusation form; the other device is read-only (reader mode) so both players can read different documents at once. Keep this split.
- Real cities and streets are fine; every firm, school, bank, insurer, church choir, auction house and person is fictional (e.g. "ZUŠ Lesná" invented, not a real school's name).
- Motives such as debt or gambling are fine for 13–15-year-olds if shown as a problem, never glamorised; no gore, no sexual content.

## Puzzle rules

| Rule | Why (defect it prevents) |
|---|---|
| An alibi must cover the **attack time**, not a later event | "In the theatre at 20:31" did not clear someone for a 19:55 blow |
| Alibis need an **independent** witness or record (not family, partner, or a log the suspect signed himself) | A wife's "home all evening" turned out to mean "I was upstairs" |
| No single document names the culprit; the decisive link needs **2+ documents** | A letter saying "only technician X services this shop" solved it in one step |
| An account, card or code identifies a **tool, not a person** — close it in the file (e.g. "only I use my card", roster of all who know the code) | Astra: "service code 00 ≠ Lang" until the other five technicians were accounted for |
| Physical mechanics stated in the file: which doors lock how, what the alarm zone covers, where the keypad is | Blind solver: "door locked from inside, yet he left through the yard?" |
| Each red herring has an incriminating act **and** a documented resolution | A lie about the last visit, resolved by the theatre alibi |
| Motive is support, never proof | Debts alone fit two suspects |
| Don't draw conclusions the evidence can't carry (a "dry receipt" doesn't date when it was thrown away) | Astra flagged invented inferences in the solution text |
| Numbers must compute: autopsy temperature vs time of death, travel times on a map document | Players will do the maths |
| The briefing and the shelving decision must not point at the key document | "A newly found attachment P" sent players straight to the answer |
| Original log printouts carry no highlight on the key rows | Highlighted rows were a free hint |
| Fictional names for firms, banks, insurers; nothing near a real brand | "Kooperace pojišťovna" ≈ real Kooperativa |

## Accusation form

Every question has exactly **one** answer defensible from the file. Ask about facts the file proves (who, alarm method, weapon, documented pressure, "which two documents prove X at 19:31"), not reconstructions it only suggests (how exactly he got in). The evidence question names the fact to prove and does not leak the culprit. Never ask "which suspect lied" or anything else several people fit. Store the solution base64-encoded (UTF-8 JSON). A wrong submission says how many answers are wrong, never which, and adds a penalty.

## Hints

Separate tracks by topic (e.g. alarm, alibi, receipt, motive), 2–3 steps each from nudge to near-solution. Defaults: hint steps +1, +2, +3 minutes; wrong accusation +5 minutes. Show the penalty before revealing, charge once, keep revealed hints visible, and offer "give up and show the solution" behind a confirmation.

## Images

- Nano Banana `generate_image`; if the default or Pro model returns **404 NOT_FOUND**, use `model_tier: "flash"` (Gemini 2.5 Flash Image). An empty result means retry once with a simpler prompt.
- **Never** put case-critical text or numbers in a generated image. Receipts, tickets, logs, plans, maps, body diagrams and stamps are inline SVG/HTML; camera date stamps and CCTV/video timestamps are an HTML overlay on a still frame (field `imageStamp`).
- Check every image against the text (setting, items shown, people) and fix the one that's wrong. For the same person in two pictures, generate the second from the first (`input_image_path_1`), then crop.
- Convert the PNG output to JPEG, ~1 200 px and quality 72 (`sips -s format jpeg -s formatOptions 72 -Z 1200`), and delete `*_thumb.jpeg`.

## Document realism (do this in the first build, not after feedback)

- Interviews: police interrogation record — header (fictional badge, department, case number, form code, page), field box, short caution, typed Q/A, "Přečteno, schváleno, podepsáno", two signatures, stamp, portrait clipped with a paperclip.
- Letters and forms on fictional letterheads; contracts with signature lines; bank statement and official notices with seals; handwritten notes in ink.
- Forensic report as a lab form with a neutral body-map SVG; the police cover sheet with a real-looking rubber stamp.
- Portraits for every suspect; photos for stolen items; a floor plan and a map with travel times.
- No gore, a content note on the start screen, a fiction notice.

## Common mistakes

- Writing the documents before the bible is reviewed: contradictions multiply.
- Running only one Astra pass: the first pass is on the story, the second on the actual text. Both found different defects.
- Trusting your own read for solvability; only the blind solver catches what you know but never wrote.
- Treating visual polish as optional: the owner judges each document by how real it looks.
