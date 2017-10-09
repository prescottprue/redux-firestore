import enhancer from './enhancer';
import reducer from './reducer';
import constants, { actionTypes } from './constants';

export default {
  firestoreReducer: reducer,
  reduxFirestore: enhancer,
  reducer,
  enhancer,
  constants,
  actionTypes,
};
