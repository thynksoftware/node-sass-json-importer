import _        from 'lodash';
import isThere  from 'is-there';
import path, {resolve, basename, extname} from 'path';

import 'json5/lib/register'; // Enable JSON5 support

export default function(url, prev) {
  if (!isJSONfile(url)) {
    return null;
  }

  let includePaths = this.options.includePaths ? this.options.includePaths.split(path.delimiter) : [];
  let paths = []
    .concat(prev.slice(0, prev.lastIndexOf('/')))
    .concat(includePaths);

  let fileName = paths
    .map(path => resolve(path, url))
    .filter(isThere)
    .pop();

  if (!fileName) {
    return new Error(`Unable to find "${url}" from the following path(s): ${paths.join(', ')}. Check includePaths.`);
  }

  // Prevent file from being cached by Node's `require` on continuous builds.
  // https://github.com/Updater/node-sass-json-importer/issues/21
  delete require.cache[require.resolve(fileName)];

  try {
    const fileContents = require(fileName);
    const extensionlessFilename = basename(fileName, extname(fileName));
    const json = Array.isArray(fileContents) ? { [extensionlessFilename]: fileContents } : fileContents;

    return {
      contents: transformJSONtoSass(null,json),
    };
  } catch(error) {
    return new Error(`node-sass-json-importer: Error transforming JSON/JSON5 to SASS. Check if your JSON/JSON5 parses correctly. ${error}`);
  }
}

export function isJSONfile(url) {
  return /\.json5?$/.test(url);
}

 export function transformJSONtoSass(oldKey, json) {
    return Object.keys(json)
      .filter(key => isValidKey(key))
      .filter(key => json[key] !== '#')
      .map(key => parseValue(`${oldKey?oldKey:''}${oldKey?'-':''}${key}`,json[key]))
      .join('\n');
  }
  
 export function isValidKey(key) {
    return /^[^$@:].*/.test(key)
  }

 export function parseValue(key, value) {
    if (_.isArray(value)) {
      return `$${key}:(${value
      .map(x => x)
      .join(',')});`;//parseList(value);
    } else if (_.isPlainObject(value)) {
      return 
      (key,value);
    } else {
      return `$${key}:${value ? value:''};`;
    } 
  }

// Super-hacky: Override Babel's transpiled export to provide both
// a default CommonJS export and named exports.
// Fixes: https://github.com/Updater/node-sass-json-importer/issues/32
// TODO: Remove in 3.0.0. Upgrade to Babel6.
module.exports = exports.default;
Object.keys(exports).forEach(key => module.exports[key] = exports[key]);
