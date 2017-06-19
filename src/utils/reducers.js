/**
 * Reducer utilities.
 * @module utils/reducers.
 */

/**
 * Assembly reducer handlers from object properties.
 * @param {Object} handlers
 * @param {Object} initialState
 * @returns {Function} reducer
 */
export const createReducer =
  (handlers, initialState) =>
    (state = initialState, action = {}) =>
      handlers[action.type] ? handlers[action.type](state, action) : state;
