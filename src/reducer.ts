import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';
import {
  statusReducer,
  dataReducer,
  orderedReducer,
  listenersReducer,
  errorsReducer,
  queriesReducer,
  crossSliceReducer
} from './reducers';

/**
 * @name firestoreReducer
 * Reducer for firestore state. This function is called
 * automatically by redux every time an action is fired. Based on which action
 * is called and its payload, the reducer will update redux state with relevant
 * changes.
 * @param state - Current Redux State
 * @param action - Action which will modify state
 * @param action.type - Type of Action being called
 * @param action.meta - Metadata associated with action
 * @param action.payload - Data associated with action
 * @returns Firebase redux state
 */
const combinedReducers = combineReducers({
  status: statusReducer,
  data: dataReducer,
  ordered: orderedReducer,
  listeners: listenersReducer,
  errors: errorsReducer,
  queries: queriesReducer,
  composite: (state: any) => state // mock reducer to retain info created by cross slice reducer
});

export default reduceReducers(combinedReducers, (crossSliceReducer as any));
