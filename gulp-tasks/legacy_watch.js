'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(['./legacy/**.styl'], gulp.series('legacy'));
    return stream;
  };
};
