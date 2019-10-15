'use strict';

const sass = require('gulp-sass');
const cssnano = require('gulp-cssnano');
const postcss = require('gulp-postcss');
const rucksack = require('rucksack-css');

module.exports = function (gulp, plugins, options) {
  return function styles() {
    return gulp
      .src('./stylesheets/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(postcss([rucksack()]))
      .pipe(cssnano())
      .pipe(gulp.dest(options.paths.styles));
  };
};
