import { isObject, isFunction, mapValues } from 'lodash';

/**
 * @description Wrap method call in dispatched actions
 * @param {Function} dispatch - Action dispatch function
 * @param {Object} opts - Options object
 * @param {Function} opts.method - Method to call
 * @param {Array} opts.args - Arguments to call method with
 * @param {Array} opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @private
 */
export const wrapInDispatch = (dispatch, { ref, meta, method, args, types }) => {
  const [requestingType, successType, errorType] = types;
  dispatch({
    type: isObject(requestingType) ? requestingType.type : requestingType,
    meta,
    payload: isObject(requestingType) ? requestingType.payload : { args },
  });
  const methodPromise = args && args.length ? ref[method](...args) : ref[method]();
  return methodPromise
    .then((val) => {
      const makePayload = ({ payload }) => isFunction(payload) ? payload(val) : payload;
      dispatch({
        type: isObject(successType) ? successType.type : successType,
        meta,
        payload: isObject(successType) ? makePayload(successType) : { args },
      });
      return val;
    })
    .catch((err) => {
      dispatch({
        type: errorType,
        meta,
        payload: err,
      });
      return Promise.reject(err);
    });
};


/**
 * Function that builds a factory that passes firebase and dispatch as
 * first two arguments.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @return {Function} A wrapper that accepts a function to wrap with firebase
 * and dispatch.
 */
const createWithFirebaseAndDispatch = (firebase, dispatch) => func => (...args) =>
  func.apply(firebase, [firebase, dispatch, ...args]);

/**
 * Map each action with Firebase and Dispatch. Includes aliasing of actions.
 * @param  {Object} firebase - Internal firebase instance
 * @param  {Function} dispatch - Redux's dispatch function
 * @param  {Object} actions - Action functions to map with firebase and dispatch
 * @return {Object} Actions mapped with firebase and dispatch
 */
export const mapWithFirebaseAndDispatch = (firebase, dispatch, actions, aliases) => {
  const withFirebaseAndDispatch = createWithFirebaseAndDispatch(firebase, dispatch);
  return {
    ...mapValues(actions, withFirebaseAndDispatch),
    ...aliases.reduce((acc, { action, name }) => ({
      ...acc,
      [name]: withFirebaseAndDispatch(action),
    }), {}),
  };
};
