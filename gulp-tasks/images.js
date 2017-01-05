'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src('./images/**/*')
      .pipe(gulp.dest(options.paths.image))

    return stream;
  };
};
