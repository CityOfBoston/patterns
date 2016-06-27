var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    poststylus = require('poststylus');

gulp.task('stylus', function () {
  gulp.src('./stylesheets/main.styl')
    .pipe(stylus({
      use: [
        poststylus(['autoprefixer', 'rucksack-css'])
      ]
    }))
    .pipe(gulp.dest('./public'))
});

gulp.task('default', ['stylus']);
