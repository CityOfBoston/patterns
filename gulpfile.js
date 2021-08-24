'use strict';

const gulp = require('gulp');
const util = require('gulp-util');
const plugins = require('gulp-load-plugins')();
const plumber = require('gulp-plumber');

const jsonSchemaToTypescript = require('./gulp-tasks/jsonSchemaToTypescript');

// Set some plugins that aren't magically included
plugins.poststylus = require('poststylus');
plugins.autoprefixer = require('autoprefixer');

// Set config options needed
const options = {
  dest: './assets/',
};

// Create object of needed paths
options.paths = {
  ie: options.dest + 'ie',
  fonts: options.dest + 'fonts',
  image: options.dest + 'images',
  script: options.dest + 'scripts',
  styles: options.dest + 'css',
  legacy: options.dest + 'legacy',
  docson: options.dest + 'vendor/docson',
};

// This will get the task to allow us to use the configs above
function getTask(task) {
  return require('./gulp-tasks/' + task)(gulp, plugins, options, util);
}

// Tasks!
// -----------------------
gulp.task('schema:map', () =>
  plumber()
    .pipe(gulp.src('web-components/map/*.schema.json'))
    .pipe(jsonSchemaToTypescript({ style: require('./.prettierrc.json') }))
    .pipe(gulp.dest('web-components/map'))
);
gulp.task('legacy', getTask('stylus_legacy'));
gulp.task('fonts', getTask('fonts'));
gulp.task('images', getTask('images'));
gulp.task('scripts', getTask('scripts'));
gulp.task('watch:scripts', getTask('scripts_watch'));
gulp.task('stylus', getTask('stylus'));
gulp.task('stylus:ie', getTask('stylus_IE'));
gulp.task('watch:stylus', getTask('stylus_watch'));
gulp.task('watch:legacy', getTask('legacy_watch'));
gulp.task('docson', () =>
  gulp
    .src('node_modules/docson/public/**')
    .pipe(gulp.dest(options.paths.docson))
);

gulp.task(
  'build',
  gulp.parallel(
    'fonts',
    'images',
    'legacy',
    'stylus',
    'scripts',
    'stylus:ie',
    'docson'
  )
);

gulp.task(
  'default',
  gulp.parallel(
    'fonts',
    'images',
    'legacy',
    'scripts',
    'docson',
    'watch:scripts',
    'stylus',
    'stylus:ie',
    'watch:stylus',
    'watch:legacy'
  )
);
