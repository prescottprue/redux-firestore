import { isObject, mapValues } from 'lodash';

/**
 * Build payload by invoking payload function if it a function, otherwise
 * returning the payload.
 * @param {Function|object|boolean} payload - Payload value (invoked if it
 * is a function)
 * @param {any} valToPass - Value to pass to custom payload function
 * @returns {any} Result of building payload
 */
function makePayload({ payload }, valToPass) {
  return typeof payload === 'function' ? payload(valToPass) : payload;
}

/**
 * Wrap method call in dispatched actions
 * @param {Function} dispatch - Action dispatch function
 * @param {object} opts - Options object
 * @param {Function} opts.method - Method to call
 * @param {Array} opts.args - Arguments to call method with
 * @param {Array} opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @returns {Promise} Results of method call
 * @private
 */
export function wrapInDispatch(
  dispatch,
  { ref, meta = {}, method, args = [], types },
) {
  const [requestingType, successType, errorType] = types;
  dispatch({
    type: isObject(requestingType) ? requestingType.type : requestingType,
    meta,
    payload: isObject(requestingType) ? requestingType.payload : { args },
  });
  return ref[method](...args)
    .then(result => {
      const successIsObject = isObject(successType);
      // Built action object handling function for custom payload
      const actionObj = {
        type: successIsObject ? successType.type : successType,
        meta,
        payload:
          successIsObject && successType.payload
            ? makePayload(successType, result)
            : { args },
      };
      // Attach preserve to action if it is passed
      if (successIsObject && successType.preserve) {
        actionObj.preserve = successType.preserve;
      }
      // Attach merge to action if it is passed
      if (successIsObject && successType.merge) {
        actionObj.merge = successType.merge;
      }
      dispatch(actionObj);
      return result;
    })
    .catch(err => {
      dispatch({
        type: errorType,
        meta,
        payload: err,
      });
      return Promise.reject(err);
    });
}

/**
 * Function that builds a factory that passes firebase and dispatch as
 * first two arguments.
 * @param {object} firebase - Internal firebase instance
 * @param {Function} dispatch - Redux's dispatch function
 * @returns {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
function createWithFirebaseAndDispatch(firebase, dispatch) {
  return func => (...args) =>
    func.apply(firebase, [firebase, dispatch, ...args]);
}

/**
 * Map each action with Firebase and Dispatch. Includes aliasing of actions.
 * @param {object} firebase - Internal firebase instance
 * @param {Function} dispatch - Redux's dispatch function
 * @param {object} actions - Action functions to map with firebase and dispatch
 * @param {object} aliases - List of name aliases for wrapped functions
 * @returns {object} Actions mapped with firebase and dispatch
 */
export function mapWithFirebaseAndDispatch(
  firebase,
  dispatch,
  actions,
  aliases,
) {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(
    firebase,
    dispatch,
  );
  return {
    ...mapValues(actions, withFirebaseAndDispatch),
    ...aliases.reduce(
      (acc, { action, name }) => ({
        ...acc,
        [name]: withFirebaseAndDispatch(action),
      }),
      {},
    ),
  };
}
