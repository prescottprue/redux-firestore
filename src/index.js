import enhancer from './enhancer';
import reducer from './reducer';
import constants, { actionTypes } from './constants';

export default {
  firebaseStateReducer: reducer,
  reduxFirestore: enhancer,
  constants,
  actionTypes,
};
