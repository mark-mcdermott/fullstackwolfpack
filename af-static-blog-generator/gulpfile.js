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

var runningIndexFilesize = 0;

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

var configFile = '../src/siteConfig.json';
var config = {
    "theme": "default",
    "name": "{NAME}",
    "email": "{EMAIL}",
    "url": "https://{SITE}.com",
    "rssUUID": "{RSS-UUID}",
    "description": "{DESCRIPTION}"
};

try {
    config = JSON.parse(fs.readFileSync(configFile, {encoding: 'utf8'}));
} catch (e) {
    console.warn('WARNING: no config file:', configFile);
}

var lessonsSourcesPath = '../src/content/lessons';
var postsSourcesPath = '../src/content/blog';
var themePath = ('../src');

nunjucksRender.setDefaults({
    // path: [themePath + '/templates'],
    path: [themePath + '/layouts'],
    envOptions: {
        autoescape: false
    }
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


    var lessons = fs.readdirSync(lessonsSourcesPath)
        .reverse()
        .map(function (fileName) {
            var lesson;
            var fileContent = fs.readFileSync(path.join(lessonsSourcesPath, fileName), {encoding: 'utf8'});
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
               var requiredParams = ['title', 'date', 'image'];
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
            // lesson.datetimeISO = formatDate(lesson.date);
            lesson.filename = urlify(lesson.title) + '.html';
            // lesson.link = 'lessons/' + lesson.filename;
            lesson.compileDest = 'dist/lessons/';
            return lesson;
        })
        .filter(function (lesson) {
            return (lesson !== null);
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

                var requiredParams = ['title', 'date', 'image'];
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

            post.preview = post.article.replace(/[\s\S]*<!-- preview -->([\s\S]*)<!-- \/preview -->[\s\S]*/g, '$1');

            post.previewIndexPade = post.preview.replace(
                /([\s\S]*)<\/p> */g,
                '$1&hellip; <a href="' + post.link + '">Read more</a></p>'
            );

            // for google
            post.article = post.article.replace(
                /([\s\S]*)<!-- preview -->([\s\S]*)<!-- \/preview -->([\s\S]*)/g,
                '<span itemprop="headline"><p>$2</p></span> <span itemprop="articleBody">$3</span>'
            );

            post.tags = (post.tags ? post.tags.split(',') : []).map(function (tag) {
                var obj = {
                    title: tag,
                    link: ('/tags/' + urlify(tag) + '/')
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

    // *** PARSE POSTS ENDS ***









    // no idea what this does
    // TODO: google node rimraf
    rimraf.sync('../dist/blog/*');
    rimraf.sync('../dist/blog/*');
    rimraf.sync('../tags/*');

    gulp.src(themePath + '/images/**/*')
        .pipe(gulp.dest('../dist/images/'))
        .pipe(reload({stream: true}));








      // from lessons array var, create /dist/lessons folder
      // dist/lessons contains files for each individual lesson
      lessons.map(function (lesson) {
          gulp.src(themePath + '/page-templates/lesson.njk')
              .pipe(nunjucksRender({
                  data: {
                      title: lesson.title,
                      config: config,
                      lesson: lesson,
                      pageType: 'Page'
                  }
              }))
              .pipe(rename(lesson.filename))
              .pipe(gulp.dest(path.join('..', lesson.compileDest)))
              .pipe(reload({stream: true}));
      });







    // from posts array var, create /dist/blog folder
    // dist/blog contains files for each individual post
    posts.map(function (post) {
        gulp.src(themePath + '/page-templates/post.njk')
            .pipe(nunjucksRender({
                data: {
                    title: post.title,
                    config: config,
                    post: post,
                    pageType: 'Page'
                }
            }))
            .pipe(rename(post.filename))
            .pipe(gulp.dest(path.join('..', post.compileDest)))
            .pipe(reload({stream: true}));
    });








    // tag stuff
    // i've ignored this for now, excluded from mvp
    // TODO: add tags & sitemap stuff back in (use AF's github repo as guide)
    var tags = [];
    for (var key in tagsMap) {
        if (tagsMap.hasOwnProperty(key)) {
            var tag = tagsMap[key];

            tags.push(tag);
            gulp.src(themePath + '/page-templates/home.html')
                .pipe(nunjucksRender({
                    data: {
                        title: ('Tag: ' + tag.title),
                        posts: tag.posts,
                        config: config,
                        tag: tag,
                        pageType: 'Page'
                    }
                }))
                .pipe(rename('index.html'))
                .pipe(gulp.dest(path.join('..', tag.link)))
                .pipe(reload({stream: true}));
        }
    }



    // create the dist/about.html file
    // this about page content is essentially hard-coded into the template
    // which breaks separation of content from structure
    // TODO: create a 'pages' folder in content and dynamically
    // go through all files in that folder & output html pages for them
    // also change the html content in the about page to markdown,
    // parse that markdown & output html from it
    gulp.src(themePath + '/page-templates/about.njk')
        .pipe(nunjucksRender({
            data: {
                config: config,
                title: 'About',
                pageType: 'About'
            }
        }))
        .pipe(rename('about.html'))
        .pipe(gulp.dest('../dist/'))
        .pipe(reload({stream: true}));




    // create the homepage (index.html)
    // uses posts array variable to add posts to homepage
    // return gulp.src(themePath + '/page-templates/index.html')
    gulp.src(themePath + '/page-templates/home.njk')
        .pipe(nunjucksRender({
            data: {
                config: config,
                posts: posts,
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
                  config: config,
                  posts: posts,
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
