'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(
      ['./legacy/**.styl'], ['legacy']
    );
    return stream;
  };
};
