import firebase from 'firebase/app'
import { Dispatch } from 'redux';

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
  DOCUMENT_ADDED: string;
  DOCUMENT_MODIFIED: string;
  DOCUMENT_REMOVED: string;
  TRANSACTION_START: string;
  TRANSACTION_SUCCESS: string;
  TRANSACTION_FAILURE: string;
  MUTATE_START: string;
  MUTATE_SUCCESS: string;
  MUTATE_FAILURE: string;
};

/**
 * Constants used within redux-firestore. Includes actionTypes, actionsPrefix,
 * and default config.
 */
export const constants: {
  actionTypes: typeof actionTypes;
  actionsPrefix: string;
  defaultConfig: Config;
};

export interface Config {
  enableLogging: boolean;

  helpersNamespace: string | null;

  // https://github.com/prescottprue/redux-firestore#loglistenererror
  logListenerError: boolean;

  // https://github.com/prescottprue/redux-firestore#enhancernamespace
  enhancerNamespace: string;

  // https://github.com/prescottprue/redux-firestore#allowmultiplelisteners
  allowMultipleListeners:
    | ((listenerToAttach: any, currentListeners: any) => boolean)
    | boolean;

  // https://github.com/prescottprue/redux-firestore#preserveondelete
  preserveOnDelete: null | object;

  // https://github.com/prescottprue/redux-firestore#preserveonlistenererror
  preserveOnListenerError: null | object;

  preserveCacheAfterUnset: boolean;

  // https://github.com/prescottprue/redux-firestore#onattemptcollectiondelete
  onAttemptCollectionDelete:
    | null
    | ((queryOption: string, dispatch: Dispatch, firebase: Object) => void);

  // https://github.com/prescottprue/redux-firestore#mergeordered
  mergeOrdered: boolean;

  // https://github.com/prescottprue/redux-firestore#mergeordereddocupdate
  mergeOrderedDocUpdate: boolean;

  // https://github.com/prescottprue/redux-firestore#mergeorderedcollectionupdates
  mergeOrderedCollectionUpdates: boolean;

  globalDataConvertor: {
    toFirestore: (snapshot) => null | object | array;
    fromFirestore: (snapshot) => null | object | array;
  };
}

type ArrayUnion = ['::arrayUnion', unknown];
type ArrayRemove = ['::arrayRemove', unknown];
type Increment = ['::increment', number];
type ServerTimestamp = ['::serverTimestamp'];
type FieldValueTuple = ArrayUnion | ArrayRemove | Increment | ServerTimestamp;

export type MutateData =
  | FieldValueTuple
  | number
  | null
  | boolean
  | string
  | object
  | array;

export type Read = { collection: string; doc: string };

export type Write = Read & { data: Record<string, MutateData> };

export type Batch = Write[];

export type WriteFn = (readKeys: string) => Write | Write[];

/**
 * As of Mar 2021, Firestore does not support transactional queries.
 * Queries are run as a standard read. Each document returned is read
 * a second time in the transaction. This is a best effort. Full
 * Transactional Query support is only available with firebase-admin.
 */
export type ReadQuery = Omit<Read, 'doc'> & { _slowCollectionRead: true };

export type Transaction = {
  reads: (Read | ReadQuery)[];
  writes: (WriteFn | Writes)[];
};

/**
 * Mutate turns Firestore into immedaite mode. Calling getFirestore returns
 * a RRF wrapper around Firestore that included the mutate function.
 * The primary aim of mutate is to make firestore feel lighting fast to user.
 * Instead of Firestore's API which is async first, the mutate function
 * provides eventual consistency. Change requests synchronously update the
 * cache reducer. When the change is accepted or rejected it updated the
 * cache reducer to reflect data in firestore.
 */
export type mutate = (operations: Write | Batch | Transaction) => Promise;

/**
 * A redux store enhancer that adds store.firebase (passed to React component
 * context through react-redux's <Provider>).
 */
export function reduxFirestore(
  firebaseInstance: typeof Firebase,
  otherConfig?: Partial<Config>,
): Firebase.default.firestore & { mutate: mutate };

/**
 * Get extended firestore instance (attached to store.firestore)
 */
export function getFirestore(
  firebaseInstance: typeof Firebase,
  otherConfig?: Partial<Config>,
): Firebase.default.firestore & { mutate: mutate };

/**
 * Reducer for Firestore state
 * @param state - Current Firebase Redux State (state.firestore)
 * @param action - Action which will modify state
 * @param action.type - Type of Action being called
 * @param action.path - Path of action that was dispatched
 * @param action.data - Data associated with action
 * @see https://react-redux-firebase.com/docs/api/reducer.html
 */
export function firestoreReducer<Schema extends Record<string, any> = {}>(
  state: any,
  action: any,
): Reducer<FirestoreReducer.State<Schema>>;

/**
 * Create a firestore instance that has helpers attached for dispatching actions
 */
export function createFirestoreInstance(
  firebaseInstance: typeof Firebase,
  configs: Partial<Config>,
  dispatch: Dispatch,
): object;

/**
 * A redux store reducer for Firestore state
 */
export namespace firestoreReducer {
  const prototype: {};
}

/**
 * A redux store reducer for Firestore state
 */
export namespace reduxFirestore {
  const prototype: {};
}

export namespace FirestoreReducer {
  declare const entitySymbol: unique symbol;
  declare const entityPath: unique symbol;
  declare const entityId: unique symbol;
  declare const queryAlias: unique symbol;

  export type Entity<T> = T & {
    [entitySymbol]: never;
  };
  export type EntityWithId<T> = T & { id: entityId };
  export type EntityWithIdPath<T> = EntityWithId<T> & { path: entityPath };
  export type FirestoreData<Schema extends Record<string, any>> = {
    [T in keyof Schema]: Record<
      string,
      Schema[T] extends Entity<infer V> ? V : FirestoreData<Schema[T]>
    >;
  };

  export type OrderedData<Schema extends Record<string, any>> = {
    [T in keyof Schema]: Schema[T] extends Entity<infer V>
      ? EntityWithId<V>[]
      : OrderedData<EntityWithId<Schema[T]>>[];
  };

  export interface CacheDatabase<T> {
    [entityPath]: { entityId: Entity<T> };
  }
  export type CachedData<Schema extends Record<string, any>> = {
    [T in keyof Schema]: Schema[T] extends Entity<infer V>
      ? EntityWithIdPath<V>[]
      : CachedData<EntityWithIdPath<Schema[T]>>[];
  };

  export interface Reducer<Schema extends Record<string, any> = {}> {
    errors: {
      allIds: string[];
      byQuery: any[];
    };
    listeners: Listeners;
    data: FirestoreData<Schema>;
    ordered: OrderedData<Schema>;
    queries: Data<ReduxFirestoreQuerySetting & (Dictionary<any> | any)>;
    cache: CachedData<Schema> & {
      database: CacheDatabase<Schema>;
      databaseOverrides: CacheDatabase<Schema> | null;
      [queryAlias]: ReduxFirestoreQuerySetting & {
        ordered: [entityId, entityPath][];
      };
    };
    status: {
      requested: Dictionary<boolean>;
      requesting: Dictionary<boolean>;
      timestamps: Dictionary<number>;
    };
  }

  const prototype: {};
}
