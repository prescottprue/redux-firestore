import reducer from './reducer';
import { firestoreActions } from './actions';
import createFirestoreInstance, {
  getFirestore,
} from './createFirestoreInstance';
import constants, { actionTypes } from './constants';
import { getQueryName } from './utils/query';
import { firestoreOrderedSelector, firestoreDataSelector } from './selectors';

// converted with transform-inline-environment-variables
export const version = process.env.npm_package_version;

export {
  reducer,
  reducer as firestoreReducer,
  createFirestoreInstance,
  firestoreActions as actions,
  getQueryName,
  firestoreOrderedSelector,
  firestoreDataSelector,
  getFirestore,
  constants,
  actionTypes,
};

export default {
  version,
  reducer,
  firestoreReducer: reducer,
  createFirestoreInstance,
  actions: firestoreActions,
  getFirestore,
  constants,
  actionTypes,
};
