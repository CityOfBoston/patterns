'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src('./images/**/*')
      .pipe(gulp.dest('./public/images'))

    return stream;
  };
};
