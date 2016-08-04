'use strict';

module.exports = function (gulp, plugins, options) {
  return function () {
    var stream = gulp.src('./stylesheets/main.styl')
      .pipe(plugins.stylus({
        use: [
          plugins.poststylus(['autoprefixer', 'rucksack-css'])
        ]
      }))
      .pipe(gulp.dest('./public/css'))

    return stream;
  };
};
