/**
 * Immutability Helper extensions.
 * @module utils/immutability-helper.
 */

import update from 'immutability-helper';

/**
 * Remove keys form object.
 * @param {Array|String} keys
 * @param {Object} object
 * @returns {Object} result
 */
update.extend('$del', function(keys, object) {
  if (!Array.isArray(keys)) keys = [keys];
  if (object === null || typeof object !== 'object') return object;
  else {
    return keys.reduce(
      (result, key) => {
        delete result[key];
        return result;
      },
      { ...object },
    );
  }
});

/**
 * Remove values form array.
 * @param {Array|String} vals
 * @param {Array} array
 * @returns {Array} result
 */
update.extend('$pop', function(vals, array) {
  if (!Array.isArray(vals)) vals = [vals];
  if (!array || !Array.isArray(array)) return array;
  else return array.filter(item => !vals.includes(item));
});
