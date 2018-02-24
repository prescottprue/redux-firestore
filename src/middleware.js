/* istanbul ignore next */
import { isArray } from 'lodash';
import { actionTypes } from './constants';

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
/* istanbul ignore next not yet in use */
function callFirestore(firebaseInstance, callInfoObj) {
  // console.log('calling devshare:', callInfoObj, Devshare)
  const { method } = callInfoObj;
  let { modelArgs, methodArgs } = callInfoObj;
  // Start call chain
  // Wrap args in array if not already
  if (!isArray(modelArgs)) modelArgs = [modelArgs];
  if (!isArray(methodArgs)) methodArgs = [methodArgs];
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

// A Redux middleware that interprets actions with CALL_FIRESTORE info specified.
// Performs the call and promises when such actions are dispatched.
/* istanbul ignore next not yet in use */
export default function reduxFirestoreMiddleware(firestore) {
  return store => next => action => {
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

    if (!types.every(type => typeof type === 'string')) {
      throw new Error('Expected action types to be strings.');
    }

    function actionWith(data) {
      const finalAction = Object.assign({}, action, data);
      delete finalAction[CALL_FIRESTORE];
      return finalAction;
    }

    const [requestType, successType, failureType] = types;
    next({ type: requestType });
    const callInfoObj = { method };
    return callFirestore(firestore, callInfoObj)
      .then(response => next({ response, method, args, type: successType }))
      .catch(error =>
        next(
          actionWith({
            type: failureType,
            error: error.message || error || 'Something bad happened',
          }),
        ),
      );
  };
}
