import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';

const ref = (firebase, dispatch, { collection, doc }) => {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const firestoreRef = firebase.firestore().collection(collection);
  return doc ? firestoreRef.doc(doc) : firestoreRef;
};

export const add = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, dispatch, { collection, doc }).add,
    args,
    types: [
      actionTypes.ADD_REQUEST,
      actionTypes.ADD_SUCCESS,
      actionTypes.ADD_FAILURE,
    ],
  });

export const set = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, dispatch, { collection, doc }).set,
    args,
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });

export const get = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, dispatch, { collection, doc }).get,
    args,
    types: [
      actionTypes.GET_REQUEST,
      actionTypes.GET_SUCCESS,
      actionTypes.GET_FAILURE,
    ],
  });

export const update = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, dispatch, { collection, doc }).update,
    args,
    types: [
      actionTypes.UPDATE_REQUEST,
      actionTypes.UPDATE_SUCCESS,
      actionTypes.UPDATE_FAILURE,
    ],
  });

// TODO: Track listeners within state
export const onSnapshot = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    method: ref(firebase, dispatch, { collection, doc }).onSnapshot,
    args,
    types: [
      actionTypes.ON_SNAPSHOT_REQUEST,
      actionTypes.ON_SNAPSHOT_SUCCESS,
      actionTypes.ON_SNAPSHOT_FAILURE,
    ],
  });

export default { get, ref, add, update, onSnapshot };
