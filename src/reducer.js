import { combineReducers } from './utils/reducers';
import {
  statusReducer,
  listenersReducer,
  errorsReducer,
  cacheReducer,
} from './reducers';

/**
 * @name firestoreReducer
 * Reducer for firestore state. This function is called automatically by redux
 * every time an action is fired. Based on which action is called and its payload,
 * the reducer will update redux state with relevant changes.
 * @param {object} state - Current Redux State
 * @param {object} action - Action which will modify state
 * @param {string} action.type - Type of Action being called
 * @param {object} action.meta - Metadata associated with action
 * @param {object} action.payload - Data associated with action
 * @returns {object} Firebase redux state
 */
const combinedReducers = combineReducers({
  status: statusReducer,
  listeners: listenersReducer,
  errors: errorsReducer,
  cache: cacheReducer,
});

export default combinedReducers;
