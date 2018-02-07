'use strict';

module.exports = function(gulp, plugins, options) {
  return function() {
    var stream = gulp
      .src('./scripts/**/*.js')
      .pipe(plugins.concat('all.js'))
      // .pipe(plugins.uglify())
      .pipe(gulp.dest(options.paths.script));

    return stream;
  };
};
