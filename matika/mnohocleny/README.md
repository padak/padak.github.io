# Polynomial workshops

Entry point: `../mnohocleny.html`. Buildless ES modules, local assets, no dependencies or external requests.

## Learning scope

Original Czech exercises follow the supplied textbook photos, pages 22–28:

1. Terms, coefficients, variables and like terms; addition and subtraction.
2. Opposite expressions, plus/minus before brackets, nested brackets.
3. Multiplication by a number or monomial, including negative and decimal coefficients.
4. Polynomial multiplication: every term by every term; collecting the resulting terms.
5. Factoring out a common number or monomial; checking by expansion.
6. Division by a nonzero monomial; numerical fractions/decimals and explicit variable conditions.

The default Step by step mode contains 38 guided steps: ordinary signed arithmetic, hidden coefficients, explicit multiplication, branching distribution and checks. Each workshop also has four interactive examples, eight practice exercises with targeted hints and worked steps, and two printable paper exercises. All modes remain available regardless of progress. Hints and retries are unlimited.

The magical garden awards one water drop per distinct solved guided step or practice exercise (86 total). Twelve deterministic collectible rewards unlock at visible thresholds; repeats cannot farm rewards and mistakes never remove them. Children place or move unlocked plants and creatures in twelve plots. Progress and garden layout stay in the current browser/device, with an in-memory fallback if storage is unavailable. Existing practice progress is preserved. Direct lesson links use `?lesson=hidden-one#minus` or `?lesson=negative-monomial#distribute`.

## Files

- `content.mjs`: single source for original authored exercises, hints, explanations, examples and glossary.
- `algebra.mjs`: bounded polynomial parser and answer validation, without JavaScript evaluation. Adjacent factors after division form a monomial denominator, e.g. `12xy/3y`. Numerical coefficient fractions can be written as `3x/2` or `(3/2)x`.
- `garden.mjs`: deterministic reward thresholds and validated garden placement/persistence helpers.
- `app.mjs`: touch/keyboard interactions and progress. No account or server required.
- `style.css`: responsive layout, reduced-motion support and paper-only print styles.
- `../tests/mnohocleny.test.mjs`: identities, independent expected coefficient maps, invalid input, misconception feedback and domain conditions.

The checker accepts reordered terms and equivalent variable ordering. For collected answers it requires no brackets and no repeated monomials. Factoring exercises require a nontrivial monomial factor and one remaining bracket. Equivalent valid factorizations are accepted; a greatest common factor is not required. Extra variable denominators in student answers are rejected to avoid silently introducing new domain restrictions.

## Verification

```sh
python3 -m http.server 8765 --bind 127.0.0.1
node --test matika/tests/*.test.mjs
```

Open `http://127.0.0.1:8765/matika/mnohocleny.html`.

Local verification on 2026-10-19:

- All 60 authored identities and 48 canonical practice answers pass.
- All 48 practice answers submitted through Chromium, including required division conditions, and progress restored after reload.
- All six scenes exercised; wrong-pair feedback, zero-pair removal, undo, sign flips, multiplication cells, factoring and division checked.
- 72 layout combinations: six workshops × three modes × widths 320, 390, 768 and 1024, without document overflow.
- Touch-context interactions checked at 820px and 390px, including a stable slider element during value changes. This is browser emulation, not a physical iPad/Safari acceptance test.

Independent content review completed with OpenAI Codex (`gpt-5.6-terra`, medium) on 2026-10-19 after explicit user authorization. The reviewer verified all 60 algebraic answers and division conditions. Both findings were fixed with regression coverage: paper factoring tasks now declare their answer form, and zero powers of variable expressions are rejected rather than silently losing domain conditions. A separate local check also tightened factoring-form validation and bounded large polynomial expansions.

Guided mode and garden verification on 2026-10-19:

- All 14 automated tests pass, including all 38 guided identities, reward boundaries, persistence sanitization and movement without duplication.
- All 38 guided correct answers exercised through Chromium; replay does not add drops. Wrong answers reveal explanations without awarding drops; subsequent corrections can earn them.
- 96 layout combinations: six workshops × four modes × widths 320, 390, 768 and 820, without horizontal overflow. Garden dialog checked at all four widths.
- First reward placement and reload persistence verified.
- A second independent OpenAI Codex review verified the guided identities, answer indices, sign explanations and division conditions with no findings.
