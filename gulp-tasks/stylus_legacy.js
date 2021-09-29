'use strict';

module.exports = function(gulp, plugins, options) {
  return function() {
    var stream = gulp
      .src(['./legacy/hub.styl'])
      .pipe(
        plugins.stylus({
          use: [
            plugins.poststylus([
              'lost',
              plugins.autoprefixer({
                browsers: ['safari <= 5', 'ie > 9'],
              }),
              'rucksack-css',
              'laggard',
              require('postcss-flexibility'),
            ]),
          ],
        })
      )
      .pipe(plugins.cssnano())
      .pipe(gulp.dest(options.paths.legacy));

    return stream;
  };
};
