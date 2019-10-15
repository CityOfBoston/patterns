/**
 * @fileOverview Gulp task that takes JSON-Schema documents and converts them to
 * TypeScript type definitions.
 */

const path = require('path');
const Vinyl = require('vinyl');
const PluginError = require('plugin-error');
const through = require('through2');
const {
  compile: jsonSchemaToTypescript,
} = require('json-schema-to-typescript');

const PLUGIN_NAME = 'jsonSchemaToTypescript';

module.exports = ({ style }) =>
  through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit(
        'error',
        new PluginError(PLUGIN_NAME, 'Streams are not supported!')
      );
      return cb();
    }

    const schema = JSON.parse(file.contents.toString(enc));

    jsonSchemaToTypescript(schema, undefined, {
      style,
    }).then(typescript => {
      this.push(
        new Vinyl({
          path: path.basename(file.path).replace('.json', '.d.ts'),
          contents: new Buffer(typescript, 'utf-8'),
        })
      );
      cb();
    });
  });
