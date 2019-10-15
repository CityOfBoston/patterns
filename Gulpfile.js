'use strict';

// todo upgrade gulp
// todo upgrade jest
// todo remove gulp-util - https://github.com/gulpjs/gulp-util
// todo is flexibility necessary?
// todo is laggard necessary?
// todo is lost necessary?
// todo is rucksack used?
// todo is lodash used by us?


const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const plumber = require('gulp-plumber');

const jsonSchemaToTypescript = require('./gulp-tasks/jsonSchemaToTypescript');

// Set some plugins that aren't magically included
plugins.poststylus = require('poststylus');
plugins.autoprefixer = require('autoprefixer');

// Set config options needed
const options = {
  dest: './assets/',
};

// Create object of needed paths
options.paths = {
  ie: options.dest + 'ie',
  fonts: options.dest + 'fonts',
  image: options.dest + 'images',
  script: options.dest + 'scripts',
  styles: options.dest + 'css',
  legacy: options.dest + 'legacy',
  docson: options.dest + 'vendor/docson',
};

// This will get the task to allow us to use the configs above
function getTask(task) {
  return require('./gulp-tasks/' + task)(gulp, plugins, options);
}

// Tasks!
// -----------------------
const schemaMap = () =>
  plumber()
    .pipe(gulp.src('web-components/map/*.schema.json'))
    .pipe(jsonSchemaToTypescript({ style: require('./.prettierrc.json') }))
    .pipe(gulp.dest('web-components/map'));
const legacy = getTask('stylus_legacy');
const fonts = getTask('fonts');
const images = getTask('images');
const scripts = getTask('scripts');
const styles = getTask('styles');
const stylus = getTask('stylus');
const stylusIe = getTask('stylus_IE');

const watchLegacy = () => gulp.watch(['./legacy/**.styl'], legacy);
const watchScripts = () => gulp.watch(['./scripts/**/*.js'], scripts);
const watchStylus = () => gulp.watch(['./stylesheets/**/**.styl'], gulp.series([stylus, stylusIe]));

const docson = () =>
  gulp
    .src('node_modules/docson/public/**')
    .pipe(gulp.dest(options.paths.docson)
);

const build = gulp.series(fonts, images, legacy, stylus, scripts, stylusIe, docson);
const watchAll = gulp.parallel(watchLegacy, watchScripts, watchStylus);

exports.build = build;
exports.schemaMap = schemaMap;
exports.styles = styles;
exports.stylus = stylus;
exports.default = gulp.series(build, watchAll);
