'use strict';

module.exports = function(gulp, plugins, options) {
  return function fonts() {
    return gulp
      .src('./stylesheets/fonts/**/**')
      .pipe(gulp.dest(options.paths.fonts));
  };
};
