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
    type: isObject(types[0]) ? types[0].type : types[0],
    payload: isObject(types[0]) ? types[0].payload : { args },
  });
  console.log('method:', ref, method)
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
