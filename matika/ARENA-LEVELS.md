# Adding an arena level

The maze, collision detection, 360-degree controls, spiders, cartoon NPC guides, audio, themes and
gate progression are shared by all levels. Level 1 currently teaches percentages.
Levels 2 and 3 are disabled placeholders until their questions are authored.
The guides talk via E / the Talk button. A laser hit tickles them: they laugh,
flee along a reachable path, and return to patrol without affecting math scores.

1. Add a question module exporting a factory that returns an array of 1–24 questions.
2. Import that factory in `arena-levels.js` and register an available level with
   `id`, `number`, `title`, `createQuestions`, optional `displayTitle`, `sectors`,
   `junctions` (zero-based gate indices), and `lesson` (final recap).
3. Each question must provide `text`, `skill`, `hint`, `explanation`, and three
   `options`. Every option has a unique `label`, exactly one has `correct: true`,
   and incorrect options should include a `hint` explaining that misconception.
4. Follow the mandatory question review in [CONTRIBUTING.md](../CONTRIBUTING.md).
5. Verify walking to a gate, a wrong answer, the explanation, physically crossing
   the opened gate, the final reactor, and the level picker on desktop and mobile.

`loadLevel()` validates the shared question contract. Gate count, maze length,
progress bar and results come from the returned array, rather than a fixed 12.
The level picker enables only levels that have a question factory.

Run the collision, progression and NPC checks with `node --test matika/tests/*.test.mjs`.
