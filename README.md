# Fullstack Wolfpack

This is the code for my blog & tutorial site, http://fullstackwolfpack.com.

## Based on static-blog-generator

I built this based on Anton Fisher's Node & Nunjucks <a href="https://github.com/antonfisher/static-blog-generator">static-blog-generator</a> that I found on GitHub. I've modified it to accommodate lessons (a new content type) and my preferred workflow (src & dist folders).

### Built with Node, Gulp, Nunjucks & Markdown

I used Fisher's Node, Nunjucks & markdown static-blog-generator because:
- I like to write my blog posts & lessons in markdown
- I plan to write my flashcards in a modified version markdown (so I can make many quickly)
- I wanted a templating system (like Nunjucks or Twig) to separate content from structure so when I write blogs/lessons, I can just write the copy quickly without worrying writing a bunch of HTML markup.  This also eliminates a lot duplicate boilerplate layout HTML markup.
- I wanted this site to be free of all bloat and load really fast, like in < 10kb. I wanted to avoid webfonts and also webapp frameworks like Angular for the sake of speed.

### Todo

- I knocked this all out quickly this weekend and there's plenty to refactor and beautify.
- Thinking of adding some barebones ajax calls to avoid page reload when clicking links.  Not sure if that's silly and that I should just do it in something like Angular or not.  I'm thinking I don't need all the rich functionality of Angular and might be able to sort of a minimal version with lower overhead. I'm sure I'm not the first to think of this&mdash;more to be researched on this.

### Instructions

I built this for me, but if you want to fire this up for whatever reason here's how:

`git clone https://github.com/mark-mcdermott/fullstackwolfpack.git`

`cd fullstackwolfpack/af-static-blog-generator`

`npm install`

`npm start`

### License

All blog and lesson content is copyrighted by me and not for reuse in any way.  Since the Gulp blog generator code was originally Anton Fisher's before I modified it, I've included his MIT license and his readme in the af-static-blog-generator folder.
