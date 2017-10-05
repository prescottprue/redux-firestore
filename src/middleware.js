import { isArray } from 'lodash';

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
function callFirestore(firestoreInstance, callInfoObj) {
  // console.log('calling devshare:', callInfoObj, Devshare)
  const { method } = callInfoObj;
  let { modelArgs, namespace, methodArgs } = callInfoObj;
  // Start call chain

  // Wrap args in array if not already
  if (!isArray(modelArgs)) modelArgs = [modelArgs];
  if (!isArray(methodArgs)) methodArgs = [methodArgs];
  // Make devshare method call with array of params
  return !methodArgs
  ? firestoreInstance[method]
  : firestoreInstance[method]
    .apply(this, methodArgs);
}

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_FIRESTORE = Symbol('Call Firestore');

// A Redux middleware that interprets actions with CALL_FIRESTORE info specified.
// Performs the call and promises when such actions are dispatched.
export default store => next => (action) => {
  const callAPI = action[CALL_FIRESTORE];
  if (typeof callAPI === 'undefined') return next(action);

  let { method } = callAPI;

  if (typeof method === 'function') method = method(store.getState());

  if (typeof method !== 'string') throw new Error('Specify a method.');

  const { types, args } = callAPI;

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
  next(actionWith({ type: requestType }));
  const callInfoObj = { method };
  return callFirestore(store.firestore, callInfoObj)
    .then(response =>
      next(actionWith({ response, method, args, type: successType })),
    )
    .catch(error =>
      next(actionWith({
        type: failureType,
        error: error.message || error || 'Something bad happened',
      })),
    );
};
