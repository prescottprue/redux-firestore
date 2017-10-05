import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';

const ref = (firebase, dispatch, { collection, doc }) => {
  const firestoreRef = firebase.firestore().collection(collection);
  return doc ? firestoreRef.doc(doc) : firestoreRef;
};

export const add = (firebase, dispatch, collection, doc, opts) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, { collection, doc }).add,
    args: [opts.args],
    types: [
      actionTypes.ADD_REQUEST,
      actionTypes.ADD_SUCCESS,
      actionTypes.ADD_FAILURE,
    ],
  });

export const set = (firebase, dispatch, collection, doc, opts) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, { collection, doc }).add,
    args: [opts.args],
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });

export const get = (firebase, dispatch, collection, doc, opts) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, { collection, doc }).get,
    args: [opts.args],
    types: [
      actionTypes.GET_REQUEST,
      actionTypes.GET_SUCCESS,
      actionTypes.GET_FAILURE,
    ],
  });

// TODO: Track listeners within state
export const onSnapshot = (firebase, dispatch, collection, doc, opts) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, { collection, doc }).onSnapshot,
    args: [opts.args],
    types: [
      actionTypes.ON_SNAPSHOT_REQUEST,
      actionTypes.ON_SNAPSHOT_SUCCESS,
      actionTypes.ON_SNAPSHOT_FAILURE,
    ],
  });

export default { get, ref, add };
