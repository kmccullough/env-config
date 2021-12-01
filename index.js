/* jshint node: true */
'use strict';

const fs = require('fs');
const path = require('path');

const defaultFileOptions = { encoding: 'utf8' };

const matchKeyAndValue = /^\s*([A-Z_][\w]*)\s*=\s*(.*)?\s*$/i;
const matchAllEscapedSlashes = /\\\\/g;
const matchConsistentQuotes = /^(["'])\1$|^(["']).*[^\\]\2$/;
const matchLastVarToExpand = /\$(?:{([A-Z_][\w]*)}|([A-Z_][\w]*)(?!\w))(?!.*\$(?:{[A-Z_][\w]*}|[A-Z_][\w]*(?!\w)))/i;
const matchAnySurroundingQuotes = /(^["']|["']$)/g;
const matchAllEscapedNewLines = /\\n/gm;

/**
 * Parses environment config file with variable replacements
 * @param {string|string[]} paths Path of file(s) to be parsed
 * @param {{ config?: {}, eachFn?: function, eachFileFn?: function, fileOptions?: {}, replacements?: {} }} [options]
 * @return {Object.<string,string>}
 */
function loadConfig(paths, options = null) {
  let {
    config,
    eachFileFn = () => {}, eachFn,
    fileOptions = defaultFileOptions,
    replacements,
    rootPath =  './',
  } = options || {};
  config = config ? { ...config } : {};
  [].concat(paths || []).some(filePath => {
    const fullFilePath = path.join(rootPath, filePath);
    const fileExists = fs.existsSync(fullFilePath);
    let skip = false, done = false;
    eachFileFn(fileExists, filePath, fullFilePath, () => skip = true, () => done = true);
    if (fileExists && !skip) {
      config = parseConfig(fs.readFileSync(fullFilePath, fileOptions), {
        config,
        eachFn,
        replacements,
      });
    }
    return done;
  });
  return config;
}

/**
 * Parses environment config string with variable replacements
 * @param {string|string[]} configString String to be parsed
 * @param {{ config?: {}, eachFn?: function, replacements?: {} }} [options]
 * @return {Object.<string,string>}
 */
function parseConfig(configString, options) {
  let {
    config,
    eachFn = () => {},
    replacements = {},
  } = options || {};
  config = config ? { ...config } : {};
  configString.split('\n').some((line) => {
    let [ match, key, value ] = line.match(matchKeyAndValue) || [];
    if (!match) {
      return;
    }
    value = value || '';
    // Check for quotes and interpolation, only if there is a value
    if (value) {
      const stripped = value.replace(matchAllEscapedSlashes, '');
      const quoteMatch = stripped.match(matchConsistentQuotes);
      const quoteChar = quoteMatch && quoteMatch[0].charAt(0);
      value = replaceVars(value, { ...replacements, ...config });
      if (quoteChar) {
        // Remove surrounding quotes
        value = value.replace(matchAnySurroundingQuotes, '');
        // Expand newlines in quoted values
        value = value.replace(matchAllEscapedNewLines, '\n');
      }
    }
    let skip = false, done = false;
    eachFn(key, value, () => skip = true, () => done = true);
    if (!skip) {
      config[key] = value;
    }
    return done;
  });
  return config;
}

/**
 * Gives string with given variable replacements applied
 * @example replaceVars('0${DEL}9', { DEL: '-' }) // Returns '0-9'
 * @param {string} value String value to make replacements to
 * @param {Object.<string,string>} replacements
 * @return {string}
 */
function replaceVars(value, replacements = {}) {
  const replaceWithReplacements = (match, m1, m2) => replacements[m1 || m2] || '';
  // Get escaped escape characters out of the mix
  return value.split(matchAllEscapedSlashes).map(strippedOfEscapedSlashes =>
    // Get escaped dollar signs out of the mix
    strippedOfEscapedSlashes.split('\\$').map(strippedOfEscapedDollars => {
      let text = strippedOfEscapedDollars;
      let prev;
      do {
        prev = text;
        text = text.replace(matchLastVarToExpand, replaceWithReplacements);
      } while (prev !== text);
      return text;
    }).join('$') // Rejoin on the now escaped dollar
  ).join('\\'); // Rejoin on the now escaped backslash
}

loadConfig.loadConfig = loadConfig;
loadConfig.parseConfig = parseConfig;
loadConfig.replaceVars = replaceVars;

module.exports = loadConfig;
