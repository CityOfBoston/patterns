'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.watch([
      './stylesheets/**/*.styl'
    ], ['stylus']);

    return stream;
  };
};
