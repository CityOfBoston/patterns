'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.watch([
      './scripts/**/*.js'
    ], ['scripts']);

    return stream;
  };
};
