'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src('./stylesheets/fonts/**/**')
      .pipe(gulp.dest(options.paths.fonts))
    return stream;
  };
};
