/* eslint-disable require-jsdoc,valid-jsdoc */
/* istanbul ignore next */
import { actionTypes } from './constants';

/* istanbul ignore next not yet in use */
/**
 * Fetches an API response and normalizes the result JSON according to schema.
 * This makes every API response have the same shape, regardless of how nested it was.
 * @param {object} firebaseInstance - Internal firebase instance
 * @param {object} callInfoObj - Info for call
 * @returns {any} Response from firestore method call
 */
function callFirestore(firebaseInstance, callInfoObj) {
  // console.log('calling devshare:', callInfoObj, Devshare)
  const { method } = callInfoObj;
  let { modelArgs, methodArgs } = callInfoObj;
  // Start call chain
  // Wrap args in array if not already
  if (!Array.isArray(modelArgs)) modelArgs = [modelArgs];
  if (!Array.isArray(methodArgs)) methodArgs = [methodArgs];
  if (!firebaseInstance || !firebaseInstance.firestore) {
    throw new Error('firestore is not a Firebase namespace');
  }

  // Make devshare method call with array of params
  return !methodArgs
    ? firebaseInstance.firestore()[method]
    : firebaseInstance.firestore()[method].apply(firebaseInstance, methodArgs);
}

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_FIRESTORE = 'CALL_FIRESTORE';

const typesMap = {
  get: [
    actionTypes.GET_REQUEST,
    actionTypes.GET_SUCCESS,
    actionTypes.GET_FAILURE,
  ],
};

/* istanbul ignore next not yet in use */
/**
 * A Redux middleware that interprets actions with CALL_FIRESTORE info specified.
 * Performs the call and promises when such actions are dispatched.
 * @param {object} firestore - Firestore object
 * @returns {Function} Middleware function
 */
export default function reduxFirestoreMiddleware(firestore) {
  return (store) => (next) => (action) => {
    const callAPI = action.type === CALL_FIRESTORE ? action : undefined;
    if (typeof callAPI === 'undefined') return next(action);

    let { method } = callAPI;

    if (typeof method === 'function') method = method(store.getState());

    if (typeof method !== 'string') throw new Error('Specify a method.');

    const { args } = callAPI;
    const types = typesMap[method];

    if (!Array.isArray(types) || types.length !== 3) {
      throw new Error('Expected an array of three action types.');
    }

    if (!types.every((type) => typeof type === 'string')) {
      throw new Error('Expected action types to be strings.');
    }

    /**
     * Call action with data
     * @param {object} data - action data
     * @returns {object} Cleaned action
     */
    function actionWith(data) {
      const finalAction = { ...action, ...data };
      delete finalAction[CALL_FIRESTORE];
      return finalAction;
    }

    const [requestType, successType, failureType] = types;
    next({ type: requestType });
    const callInfoObj = { method };
    return callFirestore(firestore, callInfoObj)
      .then((response) => next({ response, method, args, type: successType }))
      .catch((error) =>
        next(
          actionWith({
            type: failureType,
            error: error.message || error || 'Something bad happened',
          }),
        ),
      );
  };
}
