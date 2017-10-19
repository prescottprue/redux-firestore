import { pick, omit, get } from 'lodash';
import { setWith, assign } from 'lodash/fp';
import { actionTypes } from './constants';

const {
  START,
  SET,
  MERGE,
  LOGOUT,
  LOGIN_ERROR,
  GET_SUCCESS,
  NO_VALUE,
  SET_LISTENER,
  UNSET_LISTENER,
  LISTENER_RESPONSE,
  ERROR,
} = actionTypes;

/**
 * Create a path array from path string
 * @param  {String} path - Path seperated with slashes
 * @return {Array} Path as Array
 * @private
 */
const pathToArr = path => path ? path.split(/\//).filter(p => !!p) : [];

/**
 * Trim leading slash from path for use with state
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with slashes
 * @private
 */
const getSlashStrPath = path => pathToArr(path).join('/');

/**
 * Convert path with slashes to dot seperated path (for use with lodash get/set)
 * @param  {String} path - Path seperated with slashes
 * @return {String} Path seperated with dots
 * @private
 */
export const getDotStrPath = path => pathToArr(path).join('.');

/**
 * Combine reducers utility (abreveated version of redux's combineReducer).
 * Turns an object whose values are different reducer functions, into a single
 * reducer function.
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one.
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 * @private
 */
const combineReducers = reducers =>
  (state = {}, action) =>
    Object.keys(reducers).reduce(
      (nextState, key) => {
        nextState[key] = reducers[key]( // eslint-disable-line no-param-reassign
          state[key],
          action,
        );
        return nextState;
      },
      {},
    );

/**
 * Reducer for requesting state.Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current requesting redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const requestingReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
      return {
        ...state,
        [getSlashStrPath(path)]: true,
      };
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: false,
      };
    default:
      return state;
  }
};

/**
 * Reducer for requested state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current requested redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const requestedReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
      return {
        ...state,
        [getSlashStrPath(path)]: false,
      };
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: true,
      };
    default:
      return state;
  }
};

/**
 * Reducer for timestamps state. Changed by `START`, `NO_VALUE`, and `SET` actions.
 * @param  {Object} [state={}] - Current timestamps redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const timestampsReducer = (state = {}, { type, path }) => {
  switch (type) {
    case START:
    case NO_VALUE:
    case SET:
      return {
        ...state,
        [getSlashStrPath(path)]: Date.now(),
      };
    default:
      return state;
  }
};

const getFirestorePath = (action) => {
  if (!action.meta) {
    throw new Error('Meta is required to create firestore path');
  }
  const { meta: { collection, doc } } = action;
  return doc ? `${collection}/${doc}` : collection;
};

/**
 * Creates reducer for data state. Used to create data and ordered reducers.
 * Changed by `SET` or `SET_ORDERED` (if actionKey === 'ordered'), `MERGE`,
 * `NO_VALUE`, and `LOGOUT` actions.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
 * @private
 */
const createDataReducer = (actionKey = 'data') => (state = {}, action) => {
  switch (action.type) {
    case SET:
      return setWith(Object, getDotStrPath(action.path), action.payload[actionKey], state);
    case MERGE:
      const previousData = get(state, getDotStrPath(action.path), {});
      const mergedData = assign(previousData, action.payload[actionKey]);
      return setWith(Object, getDotStrPath(action.path), mergedData, state);
    case NO_VALUE:
      return setWith(Object, getDotStrPath(action.path), null, state);
    case GET_SUCCESS:
    case LISTENER_RESPONSE:
      return setWith(
        Object,
        getDotStrPath(getFirestorePath(action)),
        action.payload[actionKey], state,
      );
    case LOGOUT:
      // support keeping data when logging out - #125
      if (action.preserve) {
        return pick(state, action.preserve); // pick returns a new object
      }
      return {};
    default:
      return state;
  }
};

/**
 * Reducer for errors state. Changed by `ERROR`
 * and `LOGOUT` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const errorsReducer = (state = [], action) => {
  switch (action.type) {
    case LOGIN_ERROR:
    case ERROR:
      return [...state, action.authError];
    case LOGOUT: return [];
    default: return state;
  }
};

/**
 * Reducer for listeners ids. Changed by `SET_LISTENER` and `UNSET_LISTENER`
 * actions.
 * @param  {Object} [state={}] - Current listenersById redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} listenersById state after reduction (used in listeners)
 * @private
 */
const listenersById = (state = {}, { type, path, payload }) => {
  switch (type) {
    case SET_LISTENER:
      return {
        ...state,
        [payload.id]: {
          id: payload.id,
          path,
        },
      };
    case UNSET_LISTENER: return omit(state, [payload.id]);
    default: return state;
  }
};

/**
 * Reducer for listeners state. Changed by `ERROR`
 * and `LOGOUT` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} allListeners state after reduction (used in listeners)
 * @private
 */
const allListeners = (state = [], { type, payload }) => {
  switch (type) {
    case SET_LISTENER: return [...state, payload.id];
    case UNSET_LISTENER: return state.filter(lId => lId !== payload.id);
    default: return state;
  }
};

/**
 * Reducer for listeners state. Changed by `ERROR`
 * and `LOGOUT` actions.
 * @param  {Object} [state=[]] - Current authError redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @return {Object} Profile state after reduction
 */
export const listenersReducer = combineReducers({
  byId: listenersById,
  allIds: allListeners,
});

/**
 * Reducer for data state. Changed by `SET`, `SET_ORDERED`,`NO_VALUE`, and
 * `LOGOUT` actions.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
 */
export const dataReducer = createDataReducer();

/**
 * Reducer for ordered state. Changed by `SET`, `SET_ORDERED`,`NO_VALUE`, and
 * `LOGOUT` actions.
 * @param  {Object} [state={}] - Current data redux state
 * @param  {Object} action - Object containing the action that was dispatched
 * @param  {String} action.type - Type of action that was dispatched
 * @param  {String} action.path - Path of action that was dispatched
 * @return {Object} Data state after reduction
 */
export const orderedReducer = createDataReducer('ordered');

/**
 * @name firebaseStateReducer
 * @description Reducer for react redux firebase. This function is called
 * automatically by redux every time an action is fired. Based on which action
 * is called and its payload, the reducer will update redux state with relevant
 * changes.
 * @param {Object} state - Current Redux State
 * @param {Object} action - Action which will modify state
 * @param {String} action.type - Type of Action being called
 * @param  {String} action.path - Path of action that was dispatched
 * @param {String} action.data - Data associated with action
 * @return {Object} Firebase redux state
 */
export default combineReducers({
  status: combineReducers({
    requesting: requestingReducer,
    requested: requestedReducer,
    timestamps: timestampsReducer,
  }),
  data: dataReducer,
  ordered: orderedReducer,
  listeners: listenersReducer,
  errors: errorsReducer,
});
