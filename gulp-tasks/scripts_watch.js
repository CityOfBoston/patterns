'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(['./scripts/**/*.js'], gulp.series('scripts'));

    return stream;
  };
};
