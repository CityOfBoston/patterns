'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src([
        './stylesheets/public.styl',
        './stylesheets/hub.styl',
        './stylesheets/print.styl'
      ])
      .pipe(plugins.stylus({
        use: [
          plugins.poststylus([
            'lost',
            plugins.autoprefixer(),
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
