import { isObject, isFunction } from 'lodash';

/**
 * @description Wrap method call in dispatched actions
 * @param {Function} dispatch - Action dispatch function
 * @param {Object} opts - Options object
 * @param {Function} opts.method - Method to call
 * @param {Array} opts.args - Arguments to call method with
 * @param {Array} opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
 * @private
 */
export const wrapInDispatch = (dispatch, { ref, collection, doc, method, args, types }) => {
  const [requestingType, successType, errorType] = types
  dispatch({
    type: isObject(requestingType) ? requestingType.type : requestingType,
    payload: isObject(requestingType) ? requestingType.payload : { args },
  });
  const methodPromise = args && args.length ? ref[method](...args) : ref[method]()
  return methodPromise
    .then((val) => {
      const makePayload = ({ payload }) => isFunction(payload) ? payload(val) : payload
      dispatch({
        type: isObject(successType) ? successType.type : successType,
        collection,
        doc,
        payload: isObject(successType) ? makePayload(successType) : { args },
      });
      return val;
    })
    .catch((err) => {
      dispatch({
        type: types[2],
        payload: err,
      });
      return Promise.reject(err);
    });
};

export default { wrapInDispatch };
