import { isObject } from 'lodash';
import { wrapInDispatch } from '../utils/actions';
import { actionTypes } from '../constants';

const dataFromSnap = (snap) => {
  const data = {};
  if (snap.forEach) {
    snap.forEach((doc) => {
      console.log('doc:', doc.id);
      data[doc.id] = doc.data();
    });
  }
  return data;
};

const orderedFromSnap = (snap) => {
  const ordered = [];
  if (snap.forEach) {
    snap.forEach((doc) => {
      const obj = isObject(doc.data())
        ? { id: doc.id, ...doc.data() }
        : { id: doc.id, data: doc.data() };
      ordered.push(obj);
    });
  }
  return ordered;
};

const ref = (firebase, dispatch, { collection, doc }) => {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const firestoreRef = firebase.firestore().collection(collection);
  return doc ? firestoreRef.doc(doc) : firestoreRef;
};

export const add = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: ref(firebase, dispatch, { collection, doc }),
    method: 'add',
    collection,
    doc,
    args,
    types: [
      actionTypes.ADD_REQUEST,
      actionTypes.ADD_SUCCESS,
      actionTypes.ADD_FAILURE,
    ],
  });

export const set = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: ref(firebase, dispatch, { collection, doc }),
    method: 'set',
    args,
    types: [
      actionTypes.SET_REQUEST,
      actionTypes.SET_SUCCESS,
      actionTypes.SET_FAILURE,
    ],
  });

export const get = (firebase, dispatch, collection, doc) =>
  wrapInDispatch(dispatch, {
    ref: ref(firebase, dispatch, { collection, doc }),
    method: 'get',
    collection,
    doc,
    types: [
      actionTypes.GET_REQUEST,
      {
        type: actionTypes.GET_SUCCESS,
        payload: (snap) => {
          const ordered = orderedFromSnap(snap);
          const data = dataFromSnap(snap);
          return { data, ordered };
        },
      },
      actionTypes.GET_FAILURE,
    ],
  });

export const update = (firebase, dispatch, collection, doc, ...args) =>
  wrapInDispatch(dispatch, {
    ref: ref(firebase, dispatch, { collection, doc }),
    method: 'update',
    collection,
    doc,
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
    ref: ref(firebase, dispatch, { collection, doc }),
    method: 'onSnapshot',
    collection,
    doc,
    args,
    types: [
      actionTypes.ON_SNAPSHOT_REQUEST,
      actionTypes.ON_SNAPSHOT_SUCCESS,
      actionTypes.ON_SNAPSHOT_FAILURE,
    ],
  });

export default { get, ref, add, update, onSnapshot };
