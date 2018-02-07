'use strict';

module.exports = function(gulp) {
  return function() {
    var stream = gulp.watch(
      ['./stylesheets/**/**.styl'],
      ['stylus', 'stylus:ie']
    );

    return stream;
  };
};
