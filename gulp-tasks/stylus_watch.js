'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(
      ['./stylesheets/**/**.styl'],
      gulp.series('stylus', 'stylus:ie')
    );

    return stream;
  };
};
