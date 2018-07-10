'use strict';

const gulp = require('gulp');
const util = require('gulp-util');
const plugins = require('gulp-load-plugins')();
const plumber = require('gulp-plumber');
const download = require('gulp-download');

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
};

// This will get the task to allow us to use the configs above
function getTask(task) {
  return require('./gulp-tasks/' + task)(gulp, plugins, options, util);
}

const VIZWIZ_SCHEMA_BASE_URL = 'https://cityofboston.github.io/vizwiz/schema';

// Tasks!
// -----------------------
gulp.task('schema:vizwiz', () =>
  plumber()
    .pipe(
      download([
        `${VIZWIZ_SCHEMA_BASE_URL}/viz-0.0.schema.json`,
        `${VIZWIZ_SCHEMA_BASE_URL}/viz-1.0.schema.json`,
      ])
    )
    .pipe(jsonSchemaToTypescript({ style: require('./.prettierrc.json') }))
    .pipe(gulp.dest('web-components/types'))
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
gulp.task('build', [
  'fonts',
  'images',
  'legacy',
  'stylus',
  'scripts',
  'stylus:ie',
]);
gulp.task('default', [
  'fonts',
  'images',
  'legacy',
  'scripts',
  'watch:scripts',
  'stylus',
  'stylus:ie',
  'watch:stylus',
  'watch:legacy',
]);
