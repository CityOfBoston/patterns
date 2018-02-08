'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(['./scripts/**/*.js'], ['scripts']);

    return stream;
  };
};
