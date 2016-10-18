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
  dest: "./public/"
};

// Create object of needed paths
options.paths = {
  ie: options.dest + 'ie',
  image: options.dest + 'image',
  script: options.dest + 'script',
  styles: options.dest + 'css'
}

// This will get the task to allow us to use the configs above
function getTask(task) {
  return require('./gulp-tasks/' + task)(gulp, plugins, options.paths, util);
}

// Tasks!
// -----------------------

// Style tasks
gulp.task('scripts', getTask('scripts'));
gulp.task('stylus', getTask('stylus'));
gulp.task('stylus:ie', getTask('stylus_ie'));
gulp.task('watch:stylus', getTask('stylus_watch'));
gulp.task('default', ['scripts', 'stylus', 'stylus:ie', 'watch:stylus']);
