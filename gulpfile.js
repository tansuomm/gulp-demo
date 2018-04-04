var gulp = require('gulp')
  , order = require('gulp-order')
  , inject = require('gulp-inject')
  , util = require('gulp-util')
  , url = require('url')
  , rename = require('gulp-rename')
  , mainBowerFiles = require('main-bower-files')
  , browserSync = require('browser-sync').create()
  , proxy = require('proxy-middleware')
  , imagemin = require('gulp-imagemin')
  , del = require('del')
  , uglify = require('gulp-uglify')
  , md5 = require('gulp-md5')
  , minifyCss = require('gulp-minify-css')
  , concat = require('gulp-concat')
  , htmlmin = require('gulp-htmlmin')
  , html2js = require('gulp-html2js')
  , stripDebug = require('gulp-strip-debug')
  , gzip = require('gulp-gzip')
  , filter = require('filter-array')
  , gulpSequence = require('gulp-sequence').use(gulp);
var bowerSyncOpt = {
  paths: {
    bowerDirectory: './src/lib',
    bowerrc: '.bowerrc',
    bowerJson: 'bower.json'
  },
  debugging: false
};

var lib = mainBowerFiles(bowerSyncOpt);

var srcPath = {
  lib: {
    js: filter(lib, /\.js$/),
    css: filter(lib, /\.css/),
    font: filter(lib, /\.(woff|eot|svg|ttf)$/)
  },
  ref: ['src/js/**/*.*', 'src/css/**/*.*'],
  js: ['src/js/**/*.js'],
  css: ['src/css/**/*.css', 'src/js/**/*.css'],
  html: ['src/index.html'],
  images: ['src/images/**/*'],
  favicon: ['src/favicon.ico'],
  output: ['build/'],
  watchFiles: ['./src/**/*.*']
};

var configuration = {
  order: {
    js: {
      lib: [
        'jquery/dist/jquery.js',
        'bootstrap/dist/js/bootstrap.js',
        'nprogress/nprogress.js',
        'bootstrapValidator/dist/js/bootstrapValidator.js',
        'js-md5/build/md5.min.js',
        'underscore/underscore.js',
        'toastr/toastr.js'
      ],
      application: [
        'js/custom.js'
      ]
    }
  },
  html: {
    removeComments: true,
    removeCommentsFromCDATA: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeScriptTypeAttributes: true
  },
  inject: {
    lib: {
      name: 'bower',
      relative: true,
      ignorePath: '../build'
    },
    app: {
      name: 'app',
      relative: true,
      ignorePath: '../build/'
    }
  },
  html2js: {
    base: 'src/',
    outputModuleName: 'app',
    useStrict: true
  },
  gzip: {
    threshold: 512,
    level: 9,
    memLevel: 2
  }
};


gulp.task('clean', function () {
  del.sync('build/');
});


gulp.task('image', function () {
  gulp.src(srcPath.images).pipe(imagemin()).pipe(gulp.dest('build/img/'));
  gulp.src(srcPath.favicon).pipe(gulp.dest('build/'));
});


gulp.task('static', ['image']);


gulp.task('src-inject-build', function () {
  var bowerLibScript
    , bowerLibStylesheet
    , applicationScript
    , applicationStylesheet;

  bowerLibScript =
    gulp.src(srcPath.lib.js, {base: 'src/lib/'})
      .pipe(order(configuration.order.js.lib))
      .pipe(concat('bower_lib_script.js'))
      .pipe(uglify())
      .pipe(md5(12))
      .pipe(rename({extname: '.min.js'}))
      .pipe(gulp.dest('build/js/'));


  bowerLibStylesheet =
    gulp.src(srcPath.lib.css)
      .pipe(concat('bower_lib_stylesheet.css'))
      .pipe(minifyCss())
      .pipe(md5(12))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('build/css/'));

  applicationScript =
    gulp.src(srcPath.js, {base: 'src/'})
      .pipe(order(configuration.order.js.application))
      .pipe(concat('dest_application_script.js'))
      //.pipe(gulp.dest('build/js/'))
      .pipe(stripDebug())
      .pipe(uglify())
      .pipe(md5(12))
      .pipe(rename({suffix: '.min'}))
      .pipe(gulp.dest('build/js/'));

  applicationStylesheet =
    gulp.src(srcPath.css)
      .pipe(concat('dest_application_stylesheet.css'))
      //.pipe(gulp.dest('build/css/'))
      .pipe(minifyCss())
      .pipe(md5(12))
      .pipe(rename({extname: '.min.css'}))
      .pipe(gulp.dest('build/css/'));


  gulp.src(srcPath.html)
    .pipe(inject(bowerLibScript, configuration.inject.lib))
    .pipe(inject(bowerLibStylesheet, configuration.inject.lib))
    .pipe(inject(applicationScript, configuration.inject.app))
    .pipe(inject(applicationStylesheet, configuration.inject.app))
    .pipe(htmlmin(configuration.html))
    .pipe(rename({
      basename: 'index'
    }))
    .pipe(gulp.dest('build/'));
});



//静态服务器任务
//gulp serve --env pro
gulp.task('serve', function () {
  console.log("======================");
  console.log(util.env.env === 'pro' ? "PRODUCTION" : "DEV");
  console.log("======================");

  //代理配置
  var mtApi = url.parse('http://192.168.3.49:8080');
  mtApi.route = '/api';

  var baseServerOpts = {
    server: {
      baseDir: "src/",
      index: "index.html",
      middleware: [proxy(mtApi)]
    }
  };

  if (util.env.env == 'pro') {
    baseServerOpts.server.baseDir = 'build/';
  }

  // Serve files from the root of this project
  browserSync.init(baseServerOpts);

  if (util.env.livereload) {
    gulp.watch(srcPath.watchFiles, function (event) {
      //输出变化的文件 和发生的 事件
      console.log(event.type + ' ==> 文件路径 ' + event.path + '变化，重新读取');
      browserSync.reload();
    });
  }
});


gulp.task('build', gulpSequence('clean', 'src-inject-build', 'static', 'gzip'));

gulp.task('gzip', function () {
  gulp.src('build/**/*')
    .pipe(gzip(configuration.gzip))
    .pipe(gulp.dest('build/'));
});