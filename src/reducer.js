import reduceReducers from 'reduce-reducers';
import { combineReducers } from './utils/reducers';
import {
  statusReducer,
  dataReducer,
  orderedReducer,
  listenersReducer,
  errorsReducer,
  queriesReducer,
  crossSliceReducer,
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
  data: dataReducer,
  ordered: orderedReducer,
  listeners: listenersReducer,
  errors: errorsReducer,
  queries: queriesReducer,
  composite: state => state, // mock reducer to retain info created by cross slice reducer
});

export default reduceReducers(combinedReducers, crossSliceReducer);
