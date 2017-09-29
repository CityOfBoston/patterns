'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src('./stylesheets/ie.styl')
      .pipe(plugins.stylus({
        use: [
          plugins.poststylus([
            'lost',
            plugins.autoprefixer({
              browsers: ['IE 9', 'IE 8']
            }),
            'rucksack-css',
            'laggard',
            require('postcss-flexibility')
          ])
        ]
      }))
      .pipe(plugins.cssnano())
      .pipe(gulp.dest(options.paths.styles))

    return stream;
  };
};
