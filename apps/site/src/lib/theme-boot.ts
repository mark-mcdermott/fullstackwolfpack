// The theme applied before first paint, so there is no flash of the wrong one.
//
// It has to run inline in <head>, which means it cannot import — a deferred or
// bundled script lands after the first paint and the flash is exactly what we
// are avoiding. So it is a *string*, spliced into both shells with `set:html`,
// which is what keeps the marketing pages and the applet on one copy instead of
// two that drift.
//
// Kept deliberately blunt: no consts, no optional chaining, no arrow functions.
// This is the first thing that runs on every page and it must never throw.
//
// The `!== 'light'` is the fallback that matters — an empty store, or the bare
// 'dark'/'light' this key used to hold, resolves to the system preference,
// which is the default. Mirrors `storedChoice` in @fw/ui's ThemeToggle.
export const THEME_BOOT = `try{
  var c = localStorage.getItem('theme') || 'system';
  var d = c === 'dark' || (c !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', d);
}catch(e){}`
