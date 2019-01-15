/**
 * Action types used within actions dispatched internally. These action types
 * can be manually dispatched to update state.
 */
export const actionTypes: {
  START: string;
  ERROR: string;
  CLEAR_DATA: string;
  CLEAR_ERROR: string;
  CLEAR_ERRORS: string;
  SET_LISTENER: string;
  UNSET_LISTENER: string;
  GET_REQUEST: string;
  GET_SUCCESS: string;
  GET_FAILURE: string;
  SET_REQUEST: string;
  SET_SUCCESS: string;
  SET_FAILURE: string;
  ADD_REQUEST: string;
  ADD_SUCCESS: string;
  ADD_FAILURE: string;
  UPDATE_REQUEST: string;
  UPDATE_SUCCESS: string;
  UPDATE_FAILURE: string;
  DELETE_REQUEST: string;
  DELETE_SUCCESS: string;
  DELETE_FAILURE: string;
  ATTACH_LISTENER: string;
  LISTENER_RESPONSE: string;
  LISTENER_ERROR: string;
  ON_SNAPSHOT_REQUEST: string;
  ON_SNAPSHOT_SUCCESS: string;
  ON_SNAPSHOT_FAILURE: string;
};

/**
 * Constants used within redux-firetore. Includes actionTypes, actionsPrefix,
 * and default config.
 */
export const constants: {
  actionTypes: {
    START: string;
    ERROR: string;
    CLEAR_DATA: string;
    CLEAR_ERROR: string;
    CLEAR_ERRORS: string;
    SET_LISTENER: string;
    UNSET_LISTENER: string;
    GET_REQUEST: string;
    GET_SUCCESS: string;
    GET_FAILURE: string;
    SET_REQUEST: string;
    SET_SUCCESS: string;
    SET_FAILURE: string;
    ADD_REQUEST: string;
    ADD_SUCCESS: string;
    ADD_FAILURE: string;
    UPDATE_REQUEST: string;
    UPDATE_SUCCESS: string;
    UPDATE_FAILURE: string;
    DELETE_REQUEST: string;
    DELETE_SUCCESS: string;
    DELETE_FAILURE: string;
    ATTACH_LISTENER: string;
    LISTENER_RESPONSE: string;
    LISTENER_ERROR: string;
    ON_SNAPSHOT_REQUEST: string;
    ON_SNAPSHOT_SUCCESS: string;
    ON_SNAPSHOT_FAILURE: string;
  };
  actionsPrefix: string;
  defaultConfig: {
    enableLogging: boolean;
    enhancerNamespace: string;
    helpersNamespace: string;
    preserveOnListenerError: object;
    preserveOnDelete: object;
    logListenerError: boolean;
    allowMultipleListeners: any;
    onAttemptCollectionDelete: any;
  };
};

/**
 * A redux store enhancer that adds store.firebase (passed to React component
 * context through react-redux's <Provider>).
 */
export function reduxFirestore(firebaseInstance: object, otherConfig?: object): any;

/**
 * Get extended firestore instance (attached to store.firestore)
 */
export function getFirestore(firebaseInstance: object, otherConfig?: object): any;

/**
 * A redux store reducer for Firestore state
 */
export function firestoreReducer(state: object, action: object): any;

/**
 * Create a firestore instance that has helpers attached for dispatching actions
 */
export function createFirestoreInstance(firebaseInstance: object, configs: object, dispatch: func): object;

/**
 * A redux store reducer for Firestore state
 */
export namespace firestoreReducer {
  const prototype: {
  };
}

/**
 * A redux store reducer for Firestore state
 */
export namespace reduxFirestore {
  const prototype: {
  };
}
