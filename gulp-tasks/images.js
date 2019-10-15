'use strict';

module.exports = function (gulp, plugins, options) {
  return function images() {
    return gulp.src('./images/**/*').pipe(gulp.dest(options.paths.image));
  };
};
