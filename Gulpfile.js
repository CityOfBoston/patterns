'use strict';

let gulp = require('gulp');
let util = require('gulp-util');
let plugins = require('gulp-load-plugins')();
let runSequence = require('run-sequence');

plugins.poststylus = require('poststylus');

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
gulp.task('stylus', getTask('stylus'));
gulp.task('watch:stylus', getTask('stylus_watch'));
