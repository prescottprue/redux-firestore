import { combineReducers } from './utils/reducers';
import {
  statusReducer,
  dataReducer,
  orderedReducer,
  listenersReducer,
  errorsReducer,
} from './reducers';

/**
 * @name firestoreReducer
 * @description Reducer for firestore state. This function is called
 * automatically by redux every time an action is fired. Based on which action
 * is called and its payload, the reducer will update redux state with relevant
 * changes.
 * @param {Object} state - Current Redux State
 * @param {Object} action - Action which will modify state
 * @param {String} action.type - Type of Action being called
 * @param {Object} action.meta - Metadata associated with action
 * @param {Object} action.payload - Data associated with action
 * @return {Object} Firebase redux state
 */
export default combineReducers({
  status: statusReducer,
  data: dataReducer,
  ordered: orderedReducer,
  listeners: listenersReducer,
  errors: errorsReducer,
});
