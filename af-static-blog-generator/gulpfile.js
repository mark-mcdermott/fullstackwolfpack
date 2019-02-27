var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var merge = require('merge-stream');
var cleanCss = require('gulp-clean-css');
var Remarkable = require('remarkable');
var highlightJs = require('highlight.js');
var nunjucksRender = require('gulp-nunjucks-render');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var getFileSize = require('gulp-filesize');
var reload = browserSync.reload;
var babel = require('gulp-babel');
var recursive = require("recursive-readdir");

var runningIndexFilesize = 0;
var homePageTargetWordCount = 150;

var markdown = new Remarkable({
    html: true,
    langPrefix: 'language-',
    linkify: true,
    typographer: true,
    xhtmlOut: true,
    highlight: function (str, lang) {
        if (lang && highlightJs.getLanguage(lang)) {
            try {
                return highlightJs.highlight(lang, str).value;
            } catch (err) {
                //--
            }
        }

        try {
            return highlightJs.highlightAuto(str).value;
        } catch (err) {
            //--
        }

        return '';
    }
});

var siteConfigFile = '../src/siteConfig.json';
var leftNavConfigFile = '../src/leftNavConfig.json';


try {
    siteConfigFile = JSON.parse(fs.readFileSync(siteConfigFile, {encoding: 'utf8'}));
} catch (e) {
    console.warn('WARNING: no config file:', siteConfigFile);
}

try {
    leftNavConfigFile = JSON.parse(fs.readFileSync(leftNavConfigFile, {encoding: 'utf8'}));
} catch (e) {
    console.warn('WARNING: no config file:', leftNavConfigFile);
}

var srcSourcesPath = '../src';
var pagesSourcesPath = '../src/content/pages';
var flashCardsSourcesPath = '../src/content/flashcards';
var lessonsSourcesPath = '../src/content/lessons';
var postsSourcesPath = '../src/content/blog-posts';
var blogImagesSourcesPath = '../src/content/blog-images';
var blogPdfsSourcesPath = '../src/content/blog-pdfs';
var themePath = ('../src');

nunjucksRender.setDefaults({
    // path: [themePath + '/templates'],
    path: [themePath + '/layouts'],
    envOptions: {
        autoescape: false
    }
});




// ---------------------------------------------
// generate lessons.json by crawling lessons dir
// ---------------------------------------------

let jsonStringBeg = "{\n\t\"leftNav\": [\n";
let jsonStringMid = "";
let jsonStringEnd = "\n\t]\n}";

function getSlugFromMdFile(file) {
  return file.split('.md')[0];
}

function getLinkFromSlug(path, slug) {
  return path + '/' + slug + '.html';
}

function getTitleFromSlug(slug) {
  let title = '';
  for (let word of slug.split('-')) {
    title += ' ' + word.charAt(0).toUpperCase() + word.slice(1);
  }
  title = title.slice(1);
  return title;
}

function getFileJsonString(file, path, isLastFile, isSubFile) {
  let fileJson = '';
  let slug = getSlugFromMdFile(file);
  let title = getTitleFromSlug(slug);
  let link = getLinkFromSlug(path, slug);
  fileJson += "\t\t{\n";
  fileJson += "\t\t\t\"name\": \"";
  if (isSubFile) fileJson += "&nbsp;&nbsp;";
  fileJson += title + "\",\n";
  fileJson += "\t\t\t\"link\": \"" + link + "\"";
  fileJson += "\n\t\t}";
  if (!isLastFile) fileJson += ",\n";
  return fileJson;
}

function getFullJsonString(stringBeg, stringMid, stringEnd) {
  let jsonStringFull = "";
  jsonStringFull += stringBeg;
  jsonStringFull += stringMid;
  jsonStringFull += stringEnd;
  return jsonStringFull;
}

// crawl lessons dir
fs.readdir(lessonsSourcesPath, function(err, filesAndDirs) {
  for (let i=0; i<filesAndDirs.length; i++) {

    // console.log(filesAndDirs);
    // TODO make a function here that sorts this filesAndDirs the way I need it
    // currently, the left nav is all in the wrong order

    let fileOrDir = filesAndDirs[i];

    // if file and not dir, get filename & title
    if (fileOrDir.includes('md')) {
      let file = fileOrDir;
      let path = '';
      let isLastFile = (i == filesAndDirs.length - 1) ? true : false;
      let isSubFile = false;
      let jsonForFile =  getFileJsonString(file, path, isLastFile, isSubFile);
      jsonStringMid += jsonForFile;

    // if dir and not file
    } else {
      let dir = fileOrDir;
      var fileArr = fs.readdirSync(lessonsSourcesPath + '/' + dir);
      for (let i=0; i<fileArr.length; i++) {
        let file = fileArr[i];
        let path = '/' + dir;
        let isLastFile = false;
        let isSubFile = true;
        let jsonForFile =  getFileJsonString(file, path, isLastFile, isSubFile);
        jsonStringMid += jsonForFile;
      }
    }
  }

  let jsonFileString = getFullJsonString(jsonStringBeg, jsonStringMid, jsonStringEnd);
  let fileName = 'leftNavConfig.json';
  let filePath = srcSourcesPath + '/' + fileName;
  fs.writeFile(filePath, jsonFileString, function(err) {
    if(err) {
        return console.log(err);
    }
  });
});








gulp.task('css', function () {
    var scssStream = gulp.src(themePath + '/scss/**/*.scss')
        .pipe(sass())
        .pipe(concat('scss'))
        .pipe(reload({stream: true}));

    var cssStream = gulp.src([
            './node_modules/normalize.css/normalize.css',
            './node_modules/highlight.js/styles/default.css'
        ])
        .pipe(concat('css'))
        .pipe(reload({stream: true}));

    return merge(scssStream, cssStream)
        .pipe(concat('style.min.css'))
        .pipe(cleanCss())
        .pipe(gulp.dest('../dist/'))
        .pipe(reload({stream: true}));
});







// gulp renderer creates the html files in dist/
gulp.task('renderer', function () {
    var formatDate = function (dateString) {
        return (new Date(dateString || +(new Date()))).toISOString().replace(/\.[0-9]+/, '');
    };

    var urlify = function (string) {
        return (string || '').toLowerCase().replace(/[^\w]/g, '-').replace(/--+/g, '-').replace(/^(-*)|(-*)$/g, '');
    };













// *** PARSE PAGES STARTS ***

    var pages = fs.readdirSync(pagesSourcesPath)
        .reverse()
        .map(function (fileName) {
            var page;
            var fileContent = fs.readFileSync(path.join(pagesSourcesPath, fileName), {encoding: 'utf8'});
            var match = ((new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g')).exec(fileContent) || []);
            var jsonHeader = match[1];
            var pageBody = match[3];
            if (!jsonHeader) {
               console.warn('WARNING: no json header in:', fileName);
               return null;
            } else {
               try {
                   page = JSON.parse(jsonHeader);
               } catch (e) {
                    console.warn('WARNING: bad json header in:', fileName);
                    return null;
               }
               var requiredParams = ['title', 'date', 'image'];
               for (var i in requiredParams) {
                   if (!page[requiredParams[i]]) {
                       console.warn('WARNING: no "', requiredParams[i], '" json param in:', fileName);
                       return null;
                   }
               }
            }
            if (!pageBody) {
                console.warn('WARNING: no lesson in:', fileName);
                return null;
            }
            page.body = markdown.render(pageBody);
            page.filename = urlify(page.title) + '.html';
            page.compileDest = 'dist/';
            return page;
        })
        .filter(function (lesson) {
            return (lesson !== null);
        });

    // *** PARSE PAGES ENDS ***















    // *** PARSE FLASHCARDS .FL FILE INTO .HTML ***
    //
    // src/content/flashcards/example.fl input file:
    //
    // Question 1
    // @@
    // Answer 1
    // --
    //
    // ??
    // Question 2
    // @@
    // Answer 2
    // --
    //
    // dist/flashcards/example.html output file:
    // ... (appropriate html header etc)
    // <div class="set">
    //   <div class="question">
    //     Question 1
    //   </div>
    //   <div class="answer">
    //     Answer 1
    //   </div>
    // </div>
    // ... (appropriate html footer etc)


    var flashcards = fs.readdirSync(flashCardsSourcesPath)
      .reverse()
      .map(function (fileName) {
        var flashcardPage = {};
        var fileContent = fs.readFileSync(path.join(flashCardsSourcesPath, fileName), {encoding: 'utf8'});
        var match = ((new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g')).exec(fileContent) || []);
        var jsonHeader = match[1];
        flashcardHeader = JSON.parse(jsonHeader);
        fileContent = match[3];
        var htmlContent = fileContent.replace(/\n```/, '<br>```');
        htmlContent = htmlContent.replace(/```/, '<pre><code>');
        htmlContent = htmlContent.replace(/~~~/, '</code></pre>');
        htmlContent = htmlContent.replace(/``/, '<code>');
        htmlContent = htmlContent.replace(/~~/, '</code>');
        htmlContent = htmlContent.replace(/\^\^(.*)\^\^/, "<sup>$1</sup>");
        htmlContent = htmlContent.replace(/vv(.*)vv/, "<sub>$1</sub>");
        // htmlContent = htmlContent.replace(/\n/g, ''); // remove blank lines
        htmlContent = htmlContent.replace(/\?\?/g, '\n\t\t\t<div class="set hide">\n\t\t\t\t<div class="question">\n'); // replaces ?? with open divs
        htmlContent = htmlContent.replace(/@@/g, '\n\t\t\t\t</div>\n\t\t\t\t<div class="answer hide">\n'); // replaces @@ with close div & open div class answer
        htmlContent = htmlContent.replace(/--/g, '\n\t\t\t\t</div>\n\t\t\t</div>'); // replace -- with two close divs
        flashcardPage.title = flashcardHeader.title;
        flashcardPage.body = htmlContent;
        var baseFilename = fileName.split('.')[0];
        flashcardPage.filename = baseFilename + '.html';
        flashcardPage.compileDest = 'dist/flashcards/';
        return flashcardPage;
      })
      .filter(function (flashcardPage) {
          return (flashcardPage !== null);
      });

    // *** PARSE FLASHCARDS ENDS ***




    // *** PARSE LESSONS BEGINS ***
    // goes through every file in src/content/lessons and parses it
    // outputs lessons array variable
    // lessons is an array of objects
    // each object contains individual lessons's details

    // example lesson object:
    //[ { title: 'lesson 2',
    // date: '12/21/19',
    // image: 'image2',
    // article: '<h1>Lesson 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf</p>\n',
    // datetimeISO: '2019-12-21T06:00:00Z',
    // dateArray: [ '12', '21', '19' ],
    // dateYear: '2019',
    // dateMonth: '12',
    // filename: 'lesson-2.html',
    // path: 'lessons/',
    // link: 'lessons/lesson-2.html',
    // compileDest: 'dist/lessons/',
    // imagePreview: 'image2',
    // preview: '<h1>Lesson 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf</p>\n',
    // previewIndexPade: '<h1>Lesson 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf&hellip; <a href="blog/2019/12/post-2.html">Read more</a></p>\n',
    // tags: [] },




            var lessons = [];
            recursive(lessonsSourcesPath, function (err, lessonsArr) {
              for (let lessonFile of lessonsArr) {
                var fileContent = fs.readFileSync(lessonFile, {encoding: 'utf8'});
                var match = ((new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g')).exec(fileContent) || []);
                var jsonHeader = match[1];
                var lessonBody = match[3];
                if (!jsonHeader) {
                   console.warn('WARNING: no json header in:', fileName);
                   return null;
                } else {
                   try {
                       lesson = JSON.parse(jsonHeader);
                   } catch (e) {
                        console.warn('WARNING: bad json header in:', fileName);
                        return null;
                   }
                   var requiredParams = ['title', 'date'];
                   for (var i in requiredParams) {
                       if (!lesson[requiredParams[i]]) {
                           console.warn('WARNING: no "', requiredParams[i], '" json param in:', fileName);
                           return null;
                       }
                   }
                }

                if (!lessonBody) {
                    console.warn('WARNING: no lesson in:', fileName);
                    return null;
                }

                lesson.body = markdown.render(lessonBody);
                lesson.datetimeISO = formatDate(lesson.date);
                lesson.path = lessonFile.split('../src/content/lessons/')[1];
                let splitPath = lesson.path.split('/');
                let oldFilename = splitPath[splitPath.length - 1];
                lesson.filename = splitPath[splitPath.length - 1].split('.md')[0] + '.html';
                if (splitPath.length == 1) {
                  lesson.path = '';
                } else {
                  lesson.path = lesson.path.split(oldFilename)[0];
                }
                lesson.link = 'lessons/' + lesson.filename;
                lesson.compileDest = 'dist/lessons/' + lesson.path;

                // from lessons array var, create /dist/lessons folder
                // dist/lessons contains files for each individual lesson

                gulp.src(themePath + '/page-templates/lesson.njk')
                    .pipe(nunjucksRender({
                        data: {
                            title: lesson.title,
                            slug: 'lesson-page',
                            siteConfig: siteConfigFile,
                            leftNav: leftNavConfigFile,
                            lesson: lesson,
                            pageType: 'Lesson'
                        }
                    }))
                    .pipe(rename(lesson.filename))
                    .pipe(gulp.dest(path.join('..', lesson.compileDest)))
                    .pipe(reload({stream: true}));

              }
            }, function() {
              console.log('hi!');
              // console.log(lessons);
            });

            // *** PARSE LESSONS ENDS ***
























    // *** PARSE POSTS BEGINS ***
    // goes through every file in src/content/posts and parses it
    // outputs posts array variable
    // posts is an array of objects
    // each object contains individual post's details

    // example post object:
    //[ { title: 'post 2',
    // date: '12/21/19',
    // image: 'image2',
    // article: '<h1>Post 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf</p>\n',
    // datetimeISO: '2019-12-21T06:00:00Z',
    // dateArray: [ '12', '21', '19' ],
    // dateYear: '2019',
    // dateMonth: '12',
    // filename: 'post-2.html',
    // path: 'blog/2019/12/',
    // link: 'blog/2019/12/post-2.html',
    // compileDest: 'dist/blog/2019/12/',
    // imagePreview: 'image2',
    // preview: '<h1>Post 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf</p>\n',
    // previewIndexPade: '<h1>Post 2</h1>\n<p>jdsfkjsd</p>\n<h2>Subtitle</h2>\n<p>kjsdkfljdl</p>\n<h3>Smaller Subtitle</h3>\n<p>sdkfjdsjf&hellip; <a href="blog/2019/12/post-2.html">Read more</a></p>\n',
    // tags: [] },


    var tagsMap = {};
    var posts = fs.readdirSync(postsSourcesPath)
        .reverse()
        .map(function (fileName) {

            if (fileName == '.DS_Store') {
              return null;
            }

            var post;
            var fileContent = fs.readFileSync(path.join(postsSourcesPath, fileName), {encoding: 'utf8'});
            var match = ((new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g')).exec(fileContent) || []);
            var jsonHeader = match[1];
            var article = match[3];

            if (!jsonHeader) {
                console.warn('WARNING: no json header in:', fileName);
                return null;
            } else {
                try {
                    post = JSON.parse(jsonHeader);
                } catch (e) {
                    console.warn('WARNING: bad json header in:', fileName);
                    return null;
                }

                var requiredParams = ['title', 'date'];
                for (var i in requiredParams) {
                    if (!post[requiredParams[i]]) {
                        console.warn('WARNING: no "', requiredParams[i], '" json param in:', fileName);
                        return null;
                    }
                }
            }

            if (!article) {
                console.warn('WARNING: no article in:', fileName);
                return null;
            }

            post.wordCount = article.split(' ').length;
            post.article = markdown.render(article);
            post.datetimeISO = formatDate(post.date);
            post.dateArray = post.date.split('/');
            post.dateYear = '20' + post.dateArray[2];
            post.dateMonth = post.dateArray[0];

            // if month is 1-9, add leading 0 to make it two digits
            if (post.dateMonth.length == 1) {
              post.dateMonth = '0' + post.dateMonth;
            }

            post.filename = urlify(post.title) + '.html';
            // post.path = 'blog/' + post.dateYear + '/' + post.dateMonth + '/';
            post.path = 'blog/';

            // post.link = [
            //         '/dist/blog',
            //         post.date.replace(/-/g, '/'),
            //         urlify(post.title)
            //     ].join('/') + '/';

            post.link = post.path + post.filename;
            post.compileDest = 'dist/' + post.path;

            // post.link = '/'
            // post.uuid = post.link.replace(/\//g, '-').replace(/-$/, '');
            post.imagePreview = (post.imagePreview || post.image);

            // post.preview = post.article.replace(/[\s\S]*<!-- preview -->([\s\S]*)<!-- \/preview -->[\s\S]*/g, '$1');

            // for google
            post.article = post.article.replace(
                /([\s\S]*)<!-- preview -->([\s\S]*)<!-- \/preview -->([\s\S]*)/g,
                '<span itemprop="headline"><p>$2</p></span> <span itemprop="articleBody">$3</span>'
            );

            post.tags = (post.tags ? post.tags.split(',') : []).map(function (tag) {
                var obj = {
                    title: tag,
                    link: ('/tags/' + urlify(tag) + '.html')
                };

                tagsMap[tag] = (tagsMap[tag] || obj);
                tagsMap[tag].posts = (tagsMap[tag].posts || []);
                tagsMap[tag].posts.push(post);

                return obj;
            });

            return post;

        })
        .filter(function (post) {
            return (post !== null);
        });

    let homePagePosts = [];
    let homePageWordCount = 0;
    let postCounter = 0;

    while (homePageWordCount < homePageTargetWordCount && postCounter < posts.length) {
      if (postCounter == 0 || posts[postCounter]['wordCount'] < homePageTargetWordCount) {
        homePagePosts.push(posts[postCounter]);
        homePageWordCount += posts[postCounter]['wordCount'];
      }
      postCounter++;
    }

    // *** PARSE POSTS ENDS ***









    // no idea what this does
    // TODO: google node rimraf
    rimraf.sync('../dist/blog/*');
    rimraf.sync('../dist/blog/*');
    rimraf.sync('../tags/*');

    gulp.src(themePath + '/images/**/*')
        .pipe(gulp.dest('../dist/images/'))
        .pipe(reload({stream: true}));






        // from flashcards array var, create /dist/flashcards folder
        // dist/flashcards contains files for each individual flashcard page
        flashcards.map(function (flashcardPage) {
          // console.log(flashcardPage.filename)
            gulp.src(themePath + '/page-templates/flashcards.njk')
                .pipe(nunjucksRender({
                    data: {
                        siteConfig: siteConfigFile,
                        leftNav: leftNavConfigFile,
                        slug: 'flashcard-page',
                        flashcardPage: flashcardPage,
                        title: flashcardPage.title,
                        pageType: 'Flashcards'
                    }
                }))
                .pipe(rename(flashcardPage.filename))
                .pipe(gulp.dest(path.join('..', flashcardPage.compileDest)))
                .pipe(reload({stream: true}));
        });




        // copy blog images to dist folder
        var imageDirs = fs.readdirSync(blogImagesSourcesPath);
        imageDirs.map(function (imageDir) {
          if (imageDir != '.DS_Store') {
            var images = fs.readdirSync(blogImagesSourcesPath + '/' + imageDir);
            images.map(function (image) {
              gulp.src(blogImagesSourcesPath + '/' + imageDir + '/' + image)
              .pipe(gulp.dest('../dist/images/'));
            });
          }
        });





        // copy blog pdfs to dist folder
        var pdfDirs = fs.readdirSync(blogPdfsSourcesPath);
        pdfDirs.map(function (pdfDir) {
          if (pdfDir != '.DS_Store') {
            var pdfs = fs.readdirSync(blogPdfsSourcesPath + '/' + pdfDir);
            pdfs.map(function (pdf) {
              gulp.src(blogPdfsSourcesPath + '/' + pdfDir + '/' + pdf)
              .pipe(gulp.dest('../dist/pdfs/'));
            });
          }
        });













      // from pages array var, outputs html files for each individual page
      pages.map(function (page) {
          gulp.src(themePath + '/page-templates/page.njk')
              .pipe(nunjucksRender({
                  data: {
                      title: page.title,
                      slug: page.title.replace(/\s+/g, '-').toLowerCase(),
                      siteConfig: siteConfigFile,
                      leftNav: leftNavConfigFile,
                      page: page,
                      pageType: 'Page'
                  }
              }))
              .pipe(rename(page.filename))
              .pipe(gulp.dest(path.join('..', page.compileDest)))
              .pipe(reload({stream: true}));
      });







    // from posts array var, create /dist/blog folder
    // dist/blog contains files for each individual post
    posts.map(function (post) {
        gulp.src(themePath + '/page-templates/post.njk')
            .pipe(nunjucksRender({
                data: {
                    title: post.title,
                    slug: 'post-page',
                    siteConfig: siteConfigFile,
                    leftNav: leftNavConfigFile,
                    post: post,
                    pageType: 'Post'
                }
            }))
            .pipe(rename(post.filename))
            .pipe(gulp.dest(path.join('..', post.compileDest)))
            .pipe(reload({stream: true}));
    });













    // output flashcard js file (from es6)

    function handleBabelError (error) {
        console.log(error.toString());
        this.emit('end');
    }

    gulp.src('../src/js/flashcards.js')
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .on('error', handleBabelError)
        .pipe(gulp.dest('../dist/'))









    // tag stuff
    // TODO: add tags & sitemap stuff back in (use AF's github repo as guide)
    var tags = [];
    for (let key in tagsMap) {
        if (tagsMap.hasOwnProperty(key)) {
            var tag = tagsMap[key];
            tags.push(tag);
        }
    }
    tags.sort(function(a, b) {
      var textA = a.title.toUpperCase();
      var textB = b.title.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    tags.map(function (tag) {
      tag.slug = tag.title.toLowerCase();
      tag.slug = tag.slug.replace(' ','-');
        gulp.src(themePath + '/page-templates/tags.njk')
            .pipe(nunjucksRender({
                data: {
                    tag: tag.title,
                    link: tag.link,
                    posts: tag.posts
                }
            }))
            .pipe(rename(tag.slug + '.html'))
            .pipe(gulp.dest('../dist/tags/'))
            .pipe(reload({stream: true}));
            return tag;
    });










    // create the blog page (has blog excerptsß)
    // uses posts array variable to add posts to homepage
    // return gulp.src(themePath + '/page-templates/index.html')
    gulp.src(themePath + '/page-templates/blog.njk')
        .pipe(nunjucksRender({
            data: {
                title: 'Blog',
                slug: 'blog',
                siteConfig: siteConfigFile,
                leftNav: leftNavConfigFile,
                posts: posts,
                pageType: 'Blog',
                filesizeKb: '?'
            }
        }))
        .pipe(rename('blog.html'))
        .pipe(gulp.dest('../dist/'))
        .pipe(reload({stream: true}));






    // create the homepage (index.html)
    // uses posts array variable to add posts to homepage
    // return gulp.src(themePath + '/page-templates/index.html')
    gulp.src(themePath + '/page-templates/home.njk')
        .pipe(nunjucksRender({
            data: {
                title: 'Home',
                slug: 'home',
                siteConfig: siteConfigFile,
                leftNav: leftNavConfigFile,
                posts: homePagePosts,
                pageType: 'Home',
                filesizeKb: '?'
            }
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('../dist/'))
        .pipe(reload({stream: true}));



      // add filesize to index footer
      // https://techoverflow.net/2012/09/16/how-to-get-filesize-in-node-js/
      function getFilesizeInKb(filename) {
        var stats = fs.statSync(filename);
        var fileSizeInBytes = stats.size;
        var fileSizeInKb = fileSizeInBytes / 1000;
        return fileSizeInKb;
      }
      var indexHtmlSize = getFilesizeInKb('../dist/index.html');
      var indexStylesSize = getFilesizeInKb('../dist/style.min.css');

      runningIndexFilesize = Math.ceil(runningIndexFilesize + indexHtmlSize + indexStylesSize);

      // now that we have filesize, render index again & add it to footer
      gulp.src(themePath + '/page-templates/home.njk')
          .pipe(nunjucksRender({
              data: {
                  title: 'Home',
                  slug: 'home',
                  siteConfig: siteConfigFile,
                  leftNav: leftNavConfigFile,
                  posts: homePagePosts,
                  pageType: 'Home',
                  filesizeKb: runningIndexFilesize
              }
          }))
          .pipe(rename('index.html'))
          .pipe(gulp.dest('../dist/'))
          .pipe(reload({stream: true}));







}); // end gulp renderer task






gulp.task('default', ['css', 'renderer'], function () {
    browserSync({
        server: {
            baseDir: '../dist/'
        }
    });

    gulp.watch('../content/posts/*.md', ['renderer']);
    gulp.watch([themePath + '/**/*.njk', themePath + '/**/*.xml', themePath + '/*.njk'], ['renderer']);
    gulp.watch([themePath + '/scss/*.scss', './node_modules/normalize.css/normalize.css'], ['css']);
    gulp.watch(['**/*.html', '**/*.css', 'img/**/*'], {cwd: '../'}, reload);
});
