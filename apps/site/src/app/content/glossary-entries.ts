import { glossarySlug, type GlossaryEntry } from '@/core/glossary'

// Glossary entries — the content behind a linked term's popover and its
// /glossary/:slug page.
//
// Written to the same rule the lessons are: an entry may not lean on a term
// that has no entry of its own. That is what makes "but what is *that*?"
// terminate instead of handing the reader another word to look up — the failure
// the tutorials had in the first place, which would be trivial to recreate one
// level down. `glossaryIssues` enforces the `see` half of it, and the prose is
// grounded in the machine (frames, function values, when things run) rather
// than in more jargon.
//
// Static rather than fetched: a popover has to open instantly, and these are
// small. Split per topic if the set ever gets big enough to matter.
export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    slug: 'stack-frame',
    term: 'stack frame',
    short: `The private workspace JavaScript makes for one call — it holds that call’s parameters and locals, and it normally disappears when the call returns.`,
    see: ['reference-error', 'function-value', 'closure', 'heap'],
    body: `Calling a function creates a **frame**: a small private workspace for that one call. Its parameters and its local variables live there, and nothing outside can reach them.

\`\`\`js
function addTax(price) {
  const tax = price * 0.2;   // tax lives in this call's frame
  return price + tax;
}
addTax(10);
\`\`\`

While \`addTax(10)\` runs there is a frame holding \`price = 10\` and \`tax = 2\`. When it returns, that frame is discarded and both names are gone — not emptied, *gone*. Asking for \`tax\` afterwards is not a variable holding nothing, it is a name that does not exist, which is why you get a ReferenceError rather than \`undefined\`.

Every call gets its own frame, including a second call to the same function. That is why two counters built by the same factory do not share a number: each call built its own workspace.

The one exception is the whole point of closures: if a function value created inside the call is still reachable afterwards, it still links to that frame, so the frame cannot be thrown away.`,
  },
  {
    slug: 'function-value',
    term: 'function value',
    short: `A function is a value, like a number or a string — writing one creates it and stores it; it does not run it.`,
    see: ['stack-frame', 'closure'],
    body: `Writing a function produces a **value** you can store, pass around, and put in an array. Running it is a separate event that happens later, when something calls it.

\`\`\`js
console.log('one');

const shout = function () {
  console.log('two');
};

console.log('three');
\`\`\`

This prints \`one\` then \`three\`. Never \`two\` — the body was written, not executed. It runs only at \`shout()\`.

That gap is where most surprising JavaScript lives. A function pushed into an array during a loop is *created* on each iteration, but none of the bodies run until something calls them, possibly long after the loop has finished. If you expect the body to run where you see it written, the behaviour of deferred callbacks is unexplainable.

Two separate moments, and they can be far apart: **created** when the definition line runs, **executed** each time it is called.`,
  },
  {
    slug: 'lexical-scope',
    term: 'lexical scope',
    short: `A function can see the variables of wherever it was written — not of whoever called it.`,
    see: ['dynamic-scope', 'free-variable', 'closure', 'stack-frame'],
    body: `When a function body uses a name it did not declare, JavaScript decides where to look by **where the function was written in the source**. Reading outward from its position in the file gives you everything it can reach.

\`\`\`js
const name = 'written-here';

function show() {
  console.log(name);       // not declared in show
}

function caller() {
  const name = 'called-from-here';
  show();
}

caller();   // prints "written-here"
\`\`\`

\`caller\`'s own \`name\` is invisible to \`show\`, even though \`show\` ran inside it. The alternative rule — look outward from wherever the function was *called* — is dynamic scope, and JavaScript does not use it.

The practical payoff: you can read a function on its own and know what names it depends on, without knowing who calls it. That property is also what makes closures safe to reason about, since the frame a function links to is decided when it is written, not when it runs.`,
  },
  {
    slug: 'dynamic-scope',
    term: 'dynamic scope',
    short: `The rule JavaScript does *not* use: resolving names by who called you, rather than by where you were written.`,
    see: ['lexical-scope'],
    body: `Under **dynamic scope**, a function that uses a name it did not declare looks outward from wherever it was *called*. Under lexical scope — what JavaScript actually does — it looks outward from where it was *written*.

The distinction only becomes visible when the two disagree:

\`\`\`js
const label = 'outer';

function report() { return label; }

function wrapper() {
  const label = 'inner';
  return report();
}

wrapper();
\`\`\`

JavaScript returns \`'outer'\`, because \`report\` sits next to the outer \`label\` in the source. A dynamically scoped language would return \`'inner'\`, because \`report\` ran inside \`wrapper\`.

It is worth knowing this rule exists even though JavaScript rejects it, because "lexical scope" is defined against it. Saying a function sees where it was *written* is only meaningful once you know the alternative was to see where it was *called*. Bash variables and Emacs Lisp's classic behaviour work the dynamic way.`,
  },
  {
    slug: 'free-variable',
    term: 'free variable',
    short: `A name a function uses but never declares — neither its parameter nor its local, so it must be resolved somewhere outside.`,
    see: ['lexical-scope', 'closure', 'stack-frame'],
    body: `Inside any function body, each name is one of two things: declared here, or not. A name that is **not** declared here — not a parameter, not a local — is a *free variable*, and the engine has to resolve it somewhere outside.

\`\`\`js
function outer() {
  const secret = 42;
  function inner() {
    return secret;    // free variable in inner
  }
  return inner;
}
\`\`\`

\`secret\` is free in \`inner\`. Lexical scope decides where to look for it: outward from where \`inner\` was written, which finds it in \`outer\`.

The term is worth having because it names the exact thing a closure captures. A function with no free variables has nothing to close over — it is self-contained. A function with free variables needs the frames they live in to stay alive, which is what keeps them from being discarded when the enclosing call returns.`,
  },
  {
    slug: 'closure',
    term: 'closure',
    short: `A function value together with the frame it was written inside — which is why that frame is not discarded when its call returns.`,
    see: ['stack-frame', 'function-value', 'free-variable', 'lexical-scope'],
    body: `A **closure** is not a feature you switch on. It is what you have whenever a function value outlives the call that created it.

A function value, when created, keeps a link to the frame it was written inside — lexical scope requires that, since it has to resolve its free variables later. So if the function is still reachable after its enclosing call returns, that frame cannot be thrown away. Something still points at it.

\`\`\`js
function makeCounter() {
  let n = 0;
  return function () { return ++n; };
}

const next = makeCounter();
next(); // 1
next(); // 2
\`\`\`

Both calls read and write the *same* \`n\`, because both go through the same link to the same frame.

The detail that catches people: a closure captures the **variable**, not the value. It is a link to a slot, not a copy of what was in it. That is why the second call sees \`1\` rather than \`0\` — and why several functions created in one \`var\` loop all end up reading the same slot, which holds whatever the loop left there.`,
  },
  {
    slug: 'reference-error',
    term: 'ReferenceError',
    short: `The error for a name that does not exist at all — as distinct from a variable that exists and holds undefined.`,
    see: ['stack-frame'],
    body: `A **ReferenceError** means the name could not be resolved anywhere: there is no such variable. That is a different situation from a variable that exists but has no value yet.

\`\`\`js
let x;
console.log(x);   // undefined  — x exists, holds nothing

console.log(y);   // ReferenceError: y is not defined
\`\`\`

The distinction matters most just after a call returns. A call's locals live in its frame, and the frame is discarded when the call ends — so those names are gone, not emptied. Reaching for one afterwards is a ReferenceError, not \`undefined\`.

Guessing \`undefined\` there is the common mistake, and it is worth correcting deliberately: \`undefined\` is a *value*, and a variable has to exist in order to hold it.`,
  },
  {
    slug: 'call-stack',
    term: 'call stack',
    short: `The pile of frames for the calls that are currently running — the top one is the call happening right now.`,
    see: ['stack-frame', 'heap'],
    body: `Calls do not happen side by side. When one function calls another, the first is not finished — it is waiting. So the frames pile up, and the pile is the **call stack**.

\`\`\`js
function outer() {
  return inner();      // outer is not done; it is waiting on inner
}
function inner() {
  return 1;
}
outer();
\`\`\`

While \`inner\` runs, both frames exist: \`outer\` underneath, \`inner\` on top. It is a stack because only the top one can finish next — \`inner\` returns, its frame is popped, and \`outer\` resumes with the answer.

This is also what a stack trace is. The list of function names in an error is a photograph of the stack at the moment things went wrong, read top-down: the call that threw, then whoever called it, all the way to the bottom.

Two things follow from the shape. Only one thing runs at a time, so nothing on the stack is happening "simultaneously". And an unbounded chain of calls — a recursion with no base case — never pops anything, which is a stack overflow: the pile has a size limit.`,
  },
  {
    slug: 'heap',
    term: 'heap',
    short: `The other place values live — the one with no fixed lifetime, where anything that has to outlive the call that made it is kept.`,
    see: ['stack-frame', 'call-stack', 'reference', 'closure'],
    body: `A frame disappears when its call returns. So there has to be somewhere else — otherwise no value could ever outlive the function that created it, and \`return\` would be useless.

That somewhere is the **heap**. Where the stack is strictly ordered (the top frame finishes next, always), the heap has no order and no schedule: things stay as long as something can still reach them, and are cleaned up when nothing can.

\`\`\`js
function makeUser() {
  const u = { name: 'ada' };   // the object goes on the heap
  return u;                    // the frame is discarded; the object is not
}
const user = makeUser();       // still here
\`\`\`

The frame for \`makeUser\` held \`u\`, and \`u\` held a reference to the object. The frame is gone. The object is not, because \`user\` still reaches it.

This is the missing half of how closures work. Saying "the frame is kept alive" sounds like an exception carved out for closures, and it is fairer to say the variables that a surviving function still needs are kept on the heap, so returning does not take them with it. Nothing is being rescued from the stack — it was never only on the stack.

Worth being precise about one thing: none of this involves a fixed memory address you could write down. A JavaScript engine moves heap values around as it collects garbage. What you hold is a reference, and the engine keeps it pointing at the right thing.`,
  },
  {
    slug: 'reference',
    term: 'reference',
    short: `What a variable actually holds when the value is an object, an array, or a function — a way to reach the thing, not the thing itself.`,
    see: ['heap', 'stack-frame', 'closure', 'free-variable'],
    body: `A variable holding a number holds the number. A variable holding an object holds a **reference** — a way to reach an object that lives on the heap. Two variables can hold references to the same object, and then they are two names for one thing.

\`\`\`js
const a = { n: 1 };
const b = a;      // b holds a reference to the same object
b.n = 2;
console.log(a.n); // 2 — one object, reached two ways
\`\`\`

Nothing was copied. \`b = a\` copied the reference, not the object.

This is the idea that makes the \`var\` loop make sense. A closure captures the variable, not a snapshot of its value — which is to say it keeps a way to reach the slot rather than a copy of what was in it:

\`\`\`js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(function () { return i; });   // creating a function, not running it
}
fns[0]();   // 3
\`\`\`

There is one \`i\` here, in one slot, and all three functions reach the same slot. The loop runs to completion first — pushing a function is not calling it, so none of those bodies have executed yet — and it leaves \`3\` behind. Later, all three read that slot and all three see \`3\`.

Swap \`var\` for \`let\` and each iteration gets its own slot to reach, so the three functions reach three different ones and return \`0\`, \`1\`, \`2\`.`,
  },
]

const BY_SLUG = new Map(GLOSSARY_ENTRIES.map((e) => [e.slug, e]))

export function glossaryEntry(slug: string): GlossaryEntry | undefined {
  return BY_SLUG.get(slug)
}

export function hasGlossaryEntry(term: string): boolean {
  return BY_SLUG.has(glossarySlug(term))
}
