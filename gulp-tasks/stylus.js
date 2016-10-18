'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src([
        './stylesheets/main.styl',
        './stylesheets/shame.styl'
      ])
      .pipe(plugins.stylus({
        use: [
          plugins.poststylus([
            'lost',
            plugins.autoprefixer({ browsers: ['ie 9'] }),
            'rucksack-css',
            'laggard',
            require('postcss-flexibility')
          ])
        ]
      }))
      .pipe(gulp.dest('./public/css'))

    return stream;
  };
};
