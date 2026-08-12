import type { SeedLesson } from './seed-content'

// Hand-authored lessons, merged into the generated courses by seed-content.ts.
//
// This file exists because `npm run gen:builtins` overwrites
// seed-content.generated.ts wholesale — anything written by hand in there would
// be destroyed by the next run. Content that must survive regeneration lives
// here instead.
//
// The first of these is the execution-model lesson the rest of the JavaScript
// course silently assumed. Every generated lesson reached for the same machine —
// "its local n should be gone", "the engine looks outward", "every invocation
// builds a brand-new box" — and none of them taught it, so each explanation
// bottomed out in something the reader had never been shown. It is written to
// the standard the generator is being held to, and doubles as the reference for
// what "one idea, shown not asserted" is supposed to look like.

export const AUTHORED_JS_EXECUTION_MODEL: SeedLesson = {
  id: 'authored-js-machine',
  title: 'How JavaScript Actually Runs Your Code',
  estMinutes: 61,
  glossary: [
    'stack frame',
    'function value',
    'lexical scope',
    'dynamic scope',
    'closure',
    'ReferenceError',
    'free variable',
  ],
  segments: [
    {
      id: 'authored-js-machine-s1',
      type: 'hook',
      title: 'A bug you have probably already hit',
      estMinutes: 2,
      markdown: `You write a loop that makes three functions. Each one should report its own number.

\`\`\`js
const handlers = [];
for (var i = 0; i < 3; i++) {
  handlers.push(function () { return i; });
}

handlers[0](); // 3
handlers[1](); // 3
handlers[2](); // 3
\`\`\`

Three. Every time. Not \`0\`, \`1\`, \`2\`.

Most people meet this, try \`let\` because someone said to, see it work, and move on without ever knowing why. By the end of this lesson you will be able to explain every step of it — not recognise it, *explain* it.

Getting there needs two things almost no JavaScript tutorial teaches directly: **what exists in memory at each moment**, and **when each line actually runs**. Everything else in this course sits on top of those two.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s2',
      type: 'mechanism',
      title: 'Your program is a sequence of moments',
      estMinutes: 3,
      markdown: `Start with the boring case, because the interesting one is built from it.

JavaScript runs your statements one at a time, top to bottom. After each one, something is true about memory that was not true before. Watch it line by line — the right-hand column (the comments) is *everything that exists* at that moment.

\`\`\`js
const price = 10;        // price = 10
const tax = price * 0.2; // price = 10, tax = 2
const total = price + tax;
                         // price = 10, tax = 2, total = 12
console.log(total);      // prints 12
\`\`\`

Four lines, four moments. Line 2 could not have run before line 1, because \`price\` did not exist yet.

That is the whole idea, and it sounds too obvious to state. It is worth stating because almost every confusing thing in JavaScript is a case where **the order you read the lines is not the order they run**. Hold on to the two questions:

- *What exists right now?*
- *When does this line actually run?*`,
      questions: []
    },
    {
      id: 'authored-js-machine-s3',
      type: 'mechanism',
      title: 'Calling a function opens a frame',
      estMinutes: 5,
      markdown: `When you call a function, JavaScript makes a private workspace for that call. The usual name is a **stack frame**; call it a frame.

The frame holds the function's parameters and its local variables. It exists for exactly as long as the call does.

\`\`\`js
function addTax(price) {
  const tax = price * 0.2;
  return price + tax;
}

const total = addTax(10);
console.log(total); // 12
\`\`\`

Line by line, with the frame drawn as an indented block:

\`\`\`
console.log runs last; start at the call.

addTax(10) called
  ┌─ frame for this call ─────────┐
  │ price = 10                    │  parameter bound to the argument
  │ tax   = 2                     │  after \`const tax = price * 0.2\`
  │ returns 12                    │  price + tax
  └───────────────────────────────┘
  frame discarded

total = 12
\`\`\`

The frame is created by the *call*, not by the function existing. And when the call returns, the frame is thrown away — \`price\` and \`tax\` are gone. Nothing outside can reach them, because there is no longer anything to reach.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s4',
      type: 'predict',
      title: 'Can you reach a local afterwards?',
      estMinutes: 1,
      markdown: `\`\`\`js
function addTax(price) {
  const tax = price * 0.2;
  return price + tax;
}

addTax(10);
console.log(tax);
\`\`\`

The call has finished. What happens on the last line?`,
      questions: [
        {
          id: 'authored-js-machine-s4-q1',
          type: 'mcq',
          prompt: 'What does `console.log(tax)` do here?',
          options: [
            'Prints 2 — tax was set during the call',
            'Prints undefined — tax exists but has no value now',
            'Throws a ReferenceError — tax is not defined',
            'Prints 12 — tax holds the returned value',
          ],
          correctIndex: 2,
          explanation:
            'The frame for that call was discarded when addTax returned, and `tax` lived in it. There is no variable called tax at the top level, so the name cannot be resolved at all — that is a ReferenceError, which is different from a variable that exists and holds undefined.',
        },
      ]
    },
    {
      id: 'authored-js-machine-s5',
      type: 'reveal',
      title: 'The frame is gone, not empty',
      estMinutes: 3,
      markdown: `A \`ReferenceError\`.

If you guessed **undefined**, that is the belief worth replacing, and it is a common one. \`undefined\` means *the variable exists and holds no value yet*. That is a different situation. Here the variable does not exist — its frame was discarded when the call returned, and with it every name inside.

\`\`\`js
let x;            // x exists, holds undefined
console.log(x);   // undefined

console.log(y);   // ReferenceError: y is not defined
\`\`\`

So the default rule is: **a call's locals die with the call.** Remember that this is the *default*, because the whole of the next few segments is about the one situation where it does not happen.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s6',
      type: 'mechanism',
      title: 'Writing a function is not running it',
      estMinutes: 6,
      markdown: `This is the single idea that makes the opening bug explicable, and it is almost never said out loud.

A function definition is a **value**. Writing one produces a thing you can store, pass around, and put in an array — exactly like a number or a string. It does not run.

\`\`\`js
console.log('one');

const shout = function () {
  console.log('two');
};

console.log('three');
\`\`\`

That prints:

\`\`\`
one
three
\`\`\`

Never \`two\`. Line by line:

\`\`\`
line 1  prints "one"
line 3  creates a function value, stores it in shout   <- nothing runs
line 7  prints "three"
\`\`\`

The body \`console.log('two')\` was *written*, not *executed*. It runs only when someone calls it:

\`\`\`js
shout();  // now it prints "two"
\`\`\`

So there are two separate events, and they can happen at very different times:

| event | when |
|---|---|
| the function is **created** | when the definition line runs |
| the function **body runs** | later, each time it is called |

Every remaining confusion in this lesson is a case of those two happening further apart than you expected.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s7',
      type: 'predict',
      title: 'How many lines does this print?',
      estMinutes: 1,
      markdown: `\`\`\`js
const jobs = [];

for (var i = 0; i < 3; i++) {
  jobs.push(function () {
    console.log('working');
  });
}

console.log('done');
\`\`\`

Nothing calls anything in \`jobs\`.`,
      questions: [
        {
          id: 'authored-js-machine-s7-q1',
          type: 'mcq',
          prompt: 'What does this print?',
          options: [
            'working, working, working, then done',
            'done, then working three times',
            'Just: done',
            'Just: working',
          ],
          correctIndex: 2,
          explanation:
            'The loop runs three times and each iteration creates a function value and pushes it into the array. Creating a function does not run its body, and nothing in this code ever calls one — so "working" is never printed. Only the final line runs.',
        },
      ]
    },
    {
      id: 'authored-js-machine-s8',
      type: 'reveal',
      title: 'Three functions were made and none were run',
      estMinutes: 4,
      markdown: `Just \`done\`.

The loop absolutely ran — three times, immediately, before \`console.log('done')\`. Each iteration created a function value and pushed it into \`jobs\`. So after the loop, \`jobs.length\` is \`3\`.

What never happened is any of those bodies *running*. \`jobs\` is holding three unrun functions, like three unopened letters.

If you expected \`working\` to appear, the belief to discard is: **"the body is inside the loop, so the loop runs the body."** The loop runs the *creation*. Only a call runs the body.

Hold that clearly, because the opening bug is exactly this plus one more idea:

- the three functions are created **during** the loop
- the three functions are called **long after** it`,
      questions: []
    },
    {
      id: 'authored-js-machine-s9',
      type: 'mechanism',
      title: 'Where a name is looked up: lexical vs dynamic',
      estMinutes: 6,
      markdown: `When a function body uses a name it did not declare, JavaScript has to decide where to look. There are two possible rules, and it is worth seeing both, because the one JavaScript uses only means something next to the one it rejects.

**Lexical scope** (what JavaScript does): look outward from where the function was **written** in the source.

**Dynamic scope** (what some other languages do, e.g. classic Bash or Emacs Lisp): look outward from wherever the function was **called**.

Same code, the two rules disagree:

\`\`\`js
const name = 'written-here';

function show() {
  console.log(name);   // \`name\` is not declared inside show
}

function caller() {
  const name = 'called-from-here';
  show();
}

caller();
\`\`\`

- Under **lexical** scope, \`show\` was *written* next to the top-level \`name\`, so it prints \`written-here\`.
- Under **dynamic** scope, \`show\` was *called* from inside \`caller\`, so it would print \`called-from-here\`.

JavaScript is lexical, so it prints \`written-here\`. \`caller\`'s local \`name\` is invisible to \`show\`, no matter that \`show\` ran inside it.

The practical consequence: **you can work out what a function can see by reading the source**, without knowing who calls it. Where a function sits in the file is what determines what it can reach.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s10',
      type: 'predict',
      title: 'Which name wins?',
      estMinutes: 1,
      markdown: `\`\`\`js
const label = 'outer';

function report() {
  return label;
}

function wrapper() {
  const label = 'inner';
  return report();
}

wrapper();
\`\`\``,
      questions: [
        {
          id: 'authored-js-machine-s10-q1',
          type: 'mcq',
          prompt: 'What does `wrapper()` return?',
          options: [
            "'inner' — report ran inside wrapper",
            "'outer' — report was written next to the outer label",
            'undefined — report cannot see either one',
            'A ReferenceError',
          ],
          correctIndex: 1,
          explanation:
            "JavaScript resolves names lexically: by where `report` is written, not by who calls it. `report` sits at the top level, next to the outer `label`, so that is what it sees. wrapper's local `label` would only win under dynamic scope, which JavaScript does not use.",
        },
      ]
    },
    {
      id: 'authored-js-machine-s11',
      type: 'reveal',
      title: 'Written-where beats called-from',
      estMinutes: 3,
      markdown: `\`'outer'\`.

If you picked \`'inner'\`, you applied dynamic scope — a reasonable guess, and the rule several other languages use. It is simply not JavaScript's.

The belief to discard: **"a function can see the variables of whoever called it."** It cannot. It sees the variables of wherever it was *written*, and it never gets a view into its caller's frame.

This is why you can read a function in isolation and know what names it depends on. That property is what makes the next idea safe.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s12',
      type: 'mechanism',
      title: 'A frame someone still points at is not discarded',
      estMinutes: 8,
      markdown: `Earlier: a call's locals die with the call. Here is the exception, and it follows from the two rules you now have.

A function value, when created, keeps a link to the frame it was **written inside**. That is what lexical scope requires — it has to be able to look outward later.

So if a function value *outlives* the call that created it, the frame it points at cannot be thrown away. Something still needs it.

\`\`\`js
function makeCounter() {
  let n = 0;
  return function () {
    n = n + 1;
    return n;
  };
}

const next = makeCounter();
next(); // 1
next(); // 2
\`\`\`

Line by line:

\`\`\`
makeCounter() called
  ┌─ frame A ─────────────────────┐
  │ n = 0                         │
  │ create a function value       │  it links back to frame A
  │ return that function value    │
  └───────────────────────────────┘
  frame A is NOT discarded — the returned
  function still links to it

next  -> the returned function (linked to frame A)

next()  runs the body: reads n from frame A (0), writes 1, returns 1
next()  runs the body: reads n from frame A (1), writes 2, returns 2
\`\`\`

Both calls read and write **the same \`n\`**, because both go through the same link, to the same frame.

That pairing — a function value plus the frame it links to — is what the word **closure** names. There is nothing extra to it: it is a frame that outlived its call because something still points at it.

Note carefully what is captured. Not the *value* \`0\`. The **variable** — the slot in frame A. That is why the second call sees \`1\` and not \`0\`.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s13',
      type: 'predict',
      title: 'Now the opening bug',
      estMinutes: 2,
      markdown: `You have every piece. Read it deliberately.

\`\`\`js
const handlers = [];

for (var i = 0; i < 3; i++) {
  handlers.push(function () { return i; });
}

handlers[0]();
\`\`\`

\`var i\` is not scoped to the loop body — there is exactly one \`i\` for the whole function, and the loop reuses it.`,
      questions: [
        {
          id: 'authored-js-machine-s13-q1',
          type: 'mcq',
          prompt: 'What does `handlers[0]()` return, and why?',
          options: [
            '0 — it captured i when i was 0',
            '3 — it reads i now, and the loop left i at 3',
            'undefined — i is out of scope by then',
            'A ReferenceError',
          ],
          correctIndex: 1,
          explanation:
            'All three functions were created during the loop and all three link to the same frame, which holds the single `var i`. None of their bodies ran during the loop. By the time you call one, the loop has finished and left i at 3 — so reading i now gives 3.',
        },
      ]
    },
    {
      id: 'authored-js-machine-s14',
      type: 'reveal',
      title: 'Why it is 3, step by step',
      estMinutes: 6,
      markdown: `\`3\`.

Here is the full sequence. The key thing to notice is that **nothing was deferred about the pushing** — every push happened during the loop, immediately.

\`\`\`
i = 0   create function #1, push it      handlers = [f1]
        (f1 links to the frame holding i. Its body does NOT run.)
i = 1   create function #2, push it      handlers = [f1, f2]
i = 2   create function #3, push it      handlers = [f1, f2, f3]
i = 3   3 < 3 is false -> loop ends, and i stays 3

--- the loop is completely over. Three unrun functions exist. ---

handlers[0]()   NOW f1's body runs for the first time
                it reads i from the frame it links to
                that i is 3
                returns 3
\`\`\`

If you were expecting the loop to somehow finish before the pushes happened, swap that around: **the pushes happen during the loop; only the calls happen after.** The gap is between creating a function and running it, and in this code that gap spans the entire loop.

And because \`var i\` is one variable for the whole function, all three functions link to one frame holding one \`i\`. They do not have three separate captured values. They share one slot — and by the time anyone reads it, it says 3.

Two independent facts, both required:

1. creating a function does not run it — so the reads happen after the loop
2. \`var i\` is a single shared variable — so there is only one slot to read

Change either one and the bug disappears. That is the next segment.`,
      questions: []
    },
    {
      id: 'authored-js-machine-s15',
      type: 'derive',
      title: 'Make each function keep its own number',
      estMinutes: 8,
      markdown: `You know why it breaks. Now make it work — and notice which of the two facts you are changing.

Write \`makeCounters()\` so that it returns an array of three functions where the first returns \`0\`, the second \`1\`, the third \`2\`.

The smallest fix is one keyword. \`let\` is scoped to the loop *body*, so each iteration gets its **own** \`i\` — a fresh slot per iteration instead of one shared slot. Each function then links to a different frame.

When it passes, look at what changed: you did not change when the functions run. You changed how many slots there are.`,
      questions: [],
      exercise: {
        id: 'authored-js-machine-s15-ex',
        prompt:
          'Return an array of three functions. Calling the function at index k must return k.',
        starterCode:
          'function makeCounters() {\n  const out = [];\n  // your loop here\n  return out;\n}',
        tests: [
          { name: 'first returns 0', expression: 'makeCounters()[0]()', expected: 0 },
          { name: 'second returns 1', expression: 'makeCounters()[1]()', expected: 1 },
          { name: 'third returns 2', expression: 'makeCounters()[2]()', expected: 2 },
        ],
        solution:
          'function makeCounters() {\n  const out = [];\n  for (let i = 0; i < 3; i++) {\n    out.push(function () { return i; });\n  }\n  return out;\n}',
        hint: 'Only one word of the loop header needs to change. Ask yourself how many `i` slots exist.',
      }
    },
    {
      id: 'authored-js-machine-s16',
      type: 'check',
      title: 'Check',
      estMinutes: 2,
      markdown: `Two questions on the machine, not the vocabulary.`,
      questions: [
        {
          id: 'authored-js-machine-s16-q1',
          type: 'mcq',
          prompt:
            'A function value is created inside a call, stored somewhere outside, and the call returns. What happens to that call\'s frame?',
          options: [
            'It is discarded like any other frame',
            'It is kept, because the stored function still links to it',
            'It is copied into the stored function',
            'It is kept only if the function used the word closure',
          ],
          correctIndex: 1,
          explanation:
            'A function links to the frame it was written inside, so while that function is reachable the frame cannot be discarded. Nothing is copied — the function reads the original slots, which is why later writes are visible to it.',
        },
        {
          id: 'authored-js-machine-s16-q2',
          type: 'mcq',
          prompt:
            'In the `var` loop, why do all three functions return the same number?',
          options: [
            'Because their bodies all ran at the end of the loop',
            'Because var copies i into each function at creation',
            'Because there is one shared i, and none of the bodies ran until after the loop',
            'Because functions cannot capture loop variables at all',
          ],
          correctIndex: 2,
          explanation:
            'Both facts are needed. One `var i` means one slot for all three to link to, and creating a function does not run it — so every read happens after the loop, when that single slot holds 3.',
        },
      ]
    },
  ],
}

// Keyed by topic slug: lessons to prepend to that topic's generated course.
export const AUTHORED_LESSONS: Record<string, SeedLesson[]> = {
  javascript: [AUTHORED_JS_EXECUTION_MODEL],
}
