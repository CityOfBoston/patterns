'use strict';

let gulp = require('gulp');
let util = require('gulp-util');
let plugins = require('gulp-load-plugins')();
let runSequence = require('run-sequence');

// Set some plugins that aren't magically included
plugins.poststylus = require('poststylus');
plugins.autoprefixer = require('autoprefixer');

// Set config options needed
let options = {
  dest: "./assets/"
};

// Create object of needed paths
options.paths = {
  ie: options.dest + 'ie',
  image: options.dest + 'images',
  script: options.dest + 'scripts',
  styles: options.dest + 'css',
  legacy: options.dest + 'legacy',
}

// This will get the task to allow us to use the configs above
function getTask(task) {
  return require('./gulp-tasks/' + task)(gulp, plugins, options, util);
}

// Tasks!
// -----------------------
gulp.task('legacy', getTask('stylus_legacy'));
gulp.task('images', getTask('images'));
gulp.task('scripts', getTask('scripts'));
gulp.task('watch:scripts', getTask('scripts_watch'));
gulp.task('stylus', getTask('stylus'));
gulp.task('stylus:ie', getTask('stylus_IE'));
gulp.task('watch:stylus', getTask('stylus_watch'));
gulp.task('build', ['images', 'legacy', 'stylus', 'scripts', 'stylus:ie']);
gulp.task('default', ['images', 'legacy', 'scripts', 'watch:scripts', 'stylus', 'stylus:ie', 'watch:stylus']);
