declare module "constants" {
    /**
     * @constant
     * @type {String}
     * @description Prefix for all actions within library
     * @example
     * import { constants } from 'react-redux-firebase'
     * constants.actionsPrefix === '@@reduxFirestore' // true
     */
    export const actionsPrefix = "@@reduxFirestore";
    /**
     * @constant
     * @type {Object}
     * @description Object containing all action types
     * @property {String} START - `@@reduxFirestore/START`
     * @property {String} ERROR - `@@reduxFirestore/ERROR`
     * @property {String} SET_LISTENER - `@@reduxFirestore/SET_LISTENER`
     * @property {String} UNSET_LISTENER - `@@reduxFirestore/UNSET_LISTENER`
     * @property {String} LISTENER_RESPONSE - `@@reduxFirestore/LISTENER_RESPONSE`
     * @property {String} LISTENER_ERROR - `@@reduxFirestore/LISTENER_ERROR`
     * @property {String} CLEAR_DATA - `@@reduxFirestore/CLEAR_DATA`
     * @property {String} CLEAR_ERROR - `@@reduxFirestore/CLEAR_ERROR`
     * @property {String} CLEAR_ERRORS - `@@reduxFirestore/CLEAR_ERRORS`
     * @property {String} GET_REQUEST - `@@reduxFirestore/GET_REQUEST`
     * @property {String} GET_SUCCESS - `@@reduxFirestore/GET_SUCCESS`
     * @property {String} GET_FAILURE - `@@reduxFirestore/GET_FAILURE`
     * @property {String} SET_REQUEST - `@@reduxFirestore/SET_REQUEST`
     * @property {String} SET_SUCCESS - `@@reduxFirestore/SET_SUCCESS`
     * @property {String} SET_FAILURE - `@@reduxFirestore/SET_FAILURE`
     * @property {String} ADD_REQUEST - `@@reduxFirestore/ADD_REQUEST`
     * @property {String} ADD_SUCCESS - `@@reduxFirestore/ADD_SUCCESS`
     * @property {String} ADD_FAILURE - `@@reduxFirestore/ADD_FAILURE`
     * @property {String} UPDATE_REQUEST - `@@reduxFirestore/UPDATE_REQUEST`
     * @property {String} UPDATE_SUCCESS - `@@reduxFirestore/UPDATE_SUCCESS`
     * @property {String} UPDATE_FAILURE - `@@reduxFirestore/UPDATE_FAILURE`
     * @property {String} DELETE_REQUEST - `@@reduxFirestore/DELETE_REQUEST`
     * @property {String} DELETE_SUCCESS - `@@reduxFirestore/DELETE_SUCCESS`
     * @property {String} DELETE_FAILURE - `@@reduxFirestore/DELETE_FAILURE`
     * @property {String} ON_SNAPSHOT_REQUEST - `@@reduxFirestore/ON_SNAPSHOT_REQUEST`
     * @property {String} ON_SNAPSHOT_SUCCESS - `@@reduxFirestore/ON_SNAPSHOT_SUCCESS`
     * @property {String} ON_SNAPSHOT_FAILURE - `@@reduxFirestore/ON_SNAPSHOT_FAILURE`
     * @property {String} TRANSACTION_START - `@@reduxFirestore/TRANSACTION_START`
     * @property {String} TRANSACTION_SUCCESS - `@@reduxFirestore/TRANSACTION_SUCCESS`
     * @property {String} TRANSACTION_FAILURE - `@@reduxFirestore/TRANSACTION_FAILURE`
     * @example
     * import { actionTypes } from 'react-redux-firebase'
     * actionTypes.SET === '@@reduxFirestore/SET' // true
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
    };
    /**
     * @constant
     * @type {Object}
     * @name defaultConfig
     * @description Default configuration options
     * @property {Boolean} logListenerError - `true` Whether or not to use
     * console.error to log listener error objects. Errors from listeners
     * are helpful to developers on multiple occasions including when index
     * needs to be added.
     * @property {Object} preserveOnDelete - `null` Values to
     * preserve from state when DELETE_SUCCESS action is dispatched. Note that this
     * will not prevent the LISTENER_RESPONSE action from removing items from
     * state.ordered if you have a listener attached.
     * @property {Object} preserveOnListenerError - `null` Values to
     * preserve from state when LISTENER_ERROR action is dispatched.
     * @property {Boolean} enhancerNamespace - `'firestore'` Namespace under which
     * enhancer places internal instance on redux store (i.e. store.firestore).
     * @property {Boolean|Function} allowMultipleListeners - `false` Whether or not
     * to allow multiple listeners to be attached for the same query. If a function
     * is passed the arguments it receives are `listenerToAttach`,
     * `currentListeners`, and the function should return a boolean.
     * @property {Function} onAttemptCollectionDelete - `null` (arguments:
     * `(queryOption, dispatch, firebase)`) Function run when attempting to delete
     * a collection. If not provided (default) delete promise will be rejected with
     * "Only documents can be deleted" unless. This is due to the fact that
     * Collections can not be deleted from a client, it should instead be handled
     * within a cloud function (which can be called by providing a promise
     * to `onAttemptCollectionDelete` that calls the cloud function).
     * @type {Object}
     */
    export const defaultConfig: {
        logListenerError: boolean;
        enhancerNamespace: string;
        helpersNamespace: any;
        allowMultipleListeners: boolean;
        preserveOnDelete: any;
        preserveOnListenerError: any;
        onAttemptCollectionDelete: any;
        mergeOrdered: boolean;
        mergeOrderedDocUpdates: boolean;
        mergeOrderedCollectionUpdates: boolean;
    };
    export const methodsToAddFromFirestore: string[];
    const _default: {
        actionsPrefix: string;
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
            DOCUMENT_ADDED: string;
            DOCUMENT_MODIFIED: string;
            DOCUMENT_REMOVED: string;
            TRANSACTION_START: string;
            TRANSACTION_SUCCESS: string;
            TRANSACTION_FAILURE: string;
        };
        defaultConfig: {
            logListenerError: boolean;
            enhancerNamespace: string;
            helpersNamespace: any;
            allowMultipleListeners: boolean;
            preserveOnDelete: any;
            preserveOnListenerError: any;
            onAttemptCollectionDelete: any;
            mergeOrdered: boolean;
            mergeOrderedDocUpdates: boolean;
            mergeOrderedCollectionUpdates: boolean;
        };
    };
    export default _default;
}
declare module "utils/actions" {
    import { Dispatch } from 'redux';
    interface MergeSettings {
        docs: boolean | undefined;
        collections: boolean | undefined;
    }
    interface ActionTypeObject {
        type: string;
        payload?: any;
        preserve?: boolean;
        merge?: MergeSettings;
        meta?: any;
    }
    interface WrapInDispatchOptions {
        method: string;
        types: (ActionTypeObject | string)[];
        ref: any;
        meta?: any;
        args?: any[];
    }
    /**
     * Wrap method call in dispatched actions
     * @param dispatch - Action dispatch function
     * @param opts - Options object
     * @param opts.method - Method to call
     * @param opts.args - Arguments to call method with
     * @param opts.types - Action types array ([BEFORE, SUCCESS, FAILURE])
     * @returns Resolves with result of calling promise
     * @private
     */
    export function wrapInDispatch(dispatch: Dispatch, wrapOptions: WrapInDispatchOptions): Promise<any>;
    interface MethodAliasSettings {
        action: any;
        name: string;
    }
    /**
     * Map each action with Firebase and Dispatch. Includes aliasing of actions.
     * @param firebase - Internal firebase instance
     * @param dispatch - Redux's dispatch function
     * @param actions - Action functions to map with firebase and dispatch
     * @param aliases - List of name aliases for wrapped functions
     * @returns Actions mapped with firebase and dispatch
     */
    export function mapWithFirebaseAndDispatch(firebase: any, dispatch: Dispatch, actions: any, aliases: MethodAliasSettings[]): any;
}
declare module "utils/async" {
    /**
     * Async await wrapper for easy error handling
     * @param promise - Promise to wrap responses of in array
     * @returns Resolves and rejects with an array
     */
    export function to<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U | null, T | undefined]>;
}
declare module "types" {
    import { AnyAction, Dispatch } from 'redux';
    export interface PreserveSettingObject {
        data?: PreserveSetting;
        ordered?: PreserveSetting;
    }
    export type PreserveSetting = boolean | string[] | any;
    export interface RequestingState {
        [slashPath: string]: boolean;
    }
    export interface RequestedState {
        [slashPath: string]: boolean;
    }
    export interface TimestampsState {
        [slashPath: string]: number;
    }
    export interface StatusState {
        requesting: RequestingState;
        requested: RequestedState;
        timestamps: TimestampsState;
    }
    export interface DataState {
        [dataPath: string]: firebase.firestore.DocumentData | null | undefined;
    }
    export interface OrderedState {
        [dataPath: string]: (firebase.firestore.DocumentData | null | undefined)[];
    }
    export interface FirestoreState {
        data?: DataState;
        errors?: any;
        listeners?: any;
        ordered?: OrderedState;
        status?: StatusState;
        queries?: any;
        composite?: any;
    }
    export interface OrderedActionPayload {
        oldIndex: number;
        newIndex: number;
    }
    interface ActionPayload {
        data: firebase.firestore.DocumentData;
        ordered?: OrderedActionPayload | any[];
        name?: string;
    }
    export type ActionMeta = QueryConfigObject & {
        path?: string;
    };
    export interface ReduxFirestoreAction extends AnyAction {
        type: string;
        meta: ActionMeta;
        payload?: ActionPayload;
        timestamp?: number;
        preserve?: PreserveSettingObject;
        path?: string;
        merge?: any;
    }
    export type QueryConfig = string | QueryConfigObject;
    export interface PopulateConfig {
        root: string;
        child: string;
        populateByKey?: boolean;
    }
    export interface QueryNameOptions {
        onlySubcollections?: boolean;
    }
    type SingleWhereConfig = [string | firebase.firestore.FieldPath, firebase.firestore.WhereFilterOp, any];
    export type WhereConfig = SingleWhereConfig | SingleWhereConfig[];
    type OrderDirectionString = 'desc' | 'asc' | undefined;
    export type OrderByConfig = string | firebase.firestore.FieldPath | [string | firebase.firestore.FieldPath, OrderDirectionString];
    export interface QueryConfigObject {
        collection?: string;
        collectionGroup?: string;
        doc?: string;
        subcollections?: QueryConfigObject[] | undefined;
        where?: WhereConfig;
        orderBy?: OrderByConfig;
        limit?: number;
        storeAs?: string;
        endBefore?: string;
        endAt?: string;
        startAt?: string;
        startAfter?: string;
        populates?: PopulateConfig[];
    }
    export interface ReduxFirestoreConfig {
        enableLogging?: boolean;
        helpersNamespace?: string | null;
        logListenerError?: boolean;
        enhancerNamespace?: string;
        allowMultipleListeners?: ((listenerToAttach: any, currentListeners: any) => boolean) | boolean;
        preserveOnDelete?: null | object;
        preserveOnListenerError?: null | object;
        onAttemptCollectionDelete?: null | ((queryOption: string, dispatch: Dispatch, firebase: Record<string, any>) => void);
        mergeOrdered?: boolean;
        mergeOrderedDocUpdate?: boolean;
        mergeOrderedCollectionUpdates?: boolean;
        mergeOrderedDocUpdates?: boolean;
    }
    export interface ExtendedFirestoreInstance {
        add: (queryConfig: QueryConfig, data: firebase.firestore.DocumentData) => Promise<firebase.firestore.DocumentReference>;
        set: (queryConfig: QueryConfig, data: firebase.firestore.DocumentData, options?: firebase.firestore.SetOptions) => Promise<void>;
        get: (queryConfig: QueryConfig, options?: firebase.firestore.GetOptions) => Promise<firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot>;
        update: (queryConfig: QueryConfig, data: firebase.firestore.DocumentData) => Promise<void>;
        deleteRef: (queryConfig: QueryConfig) => Promise<void>;
        delete: (queryConfig: QueryConfig) => Promise<void>;
        setListener: (queryConfig: QueryConfig, successCb?: any, errorCb?: ((error: Error) => void) | undefined) => void;
        setListeners: (queryConfigs: QueryConfig[]) => void;
        unsetListener: (queryConfig: QueryConfig) => void;
        unsetListeners: (queryConfigs: QueryConfig[]) => void;
        runTransaction: (updateFunction: (transaction: firebase.firestore.Transaction) => Promise<any>) => Promise<void>;
    }
}
declare module "utils/query" {
    import * as firebase from 'firebase/app';
    import { Dispatch } from 'redux';
    import { QueryConfig, QueryConfigObject, QueryNameOptions, PopulateConfig, ReduxFirestoreAction } from "types";
    /**
     * Create a Cloud Firestore reference for a collection or document
     * @param firebase - Internal firebase object
     * @param meta - Metadata
     * @param meta.collection - Collection name
     * @param meta.collectionGroup - Collection Group name
     * @param meta.doc - Document name
     * @param meta.where - List of argument arrays
     * @returns Resolves with results of add call
     */
    export function firestoreRef(firebase: any, meta: QueryConfigObject): firebase.firestore.Query;
    /**
     * Create query name based on query settings for use as object keys (used
     * in listener management and reducers).
     * @param meta - Metadata object containing query settings
     * @param meta.collection - Collection name of query
     * @param meta.doc - Document id of query
     * @param meta.storeAs - User-defined Redux store name of query
     * @param meta.subcollections - Subcollections of query
     * @param [options={}] - Options object
     * @param [options.onlySubcollections=false] - Only include collections
     * and subcollections in query name
     * @returns String representing query settings
     */
    export function getQueryName(meta: QueryConfig, options?: QueryNameOptions): string;
    /**
     * Create query name based on query settings for use as object keys (used
     * in listener management and reducers).
     * @param meta - Metadata object containing query settings
     * @param meta.collection - Collection name of query
     * @param meta.doc - Document id of query
     * @param meta.subcollections - Subcollections of query
     * @returns String representing query settings
     */
    export function getBaseQueryName(meta: QueryConfig): string;
    /**
     * Get whether or not a listener is attached at the provided path
     * @param firebase - Internal firebase object
     * @param meta - Metadata object
     * @returns Whether or not listener exists
     */
    export function listenerExists(firebase: any, meta: any): boolean;
    /**
     * Update the number of watchers for a query
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param meta - Metadata
     * @param unsubscribe - Unsubscribe function
     * @param doc - Document name
     * @returns Object containing all listeners
     */
    export function attachListener(firebase: any, dispatch: Dispatch, meta: any, unsubscribe?: () => void): any;
    /**
     * Remove/Unset a watcher
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param meta - Metadata
     * @param collection - Collection name
     * @param doc - Document name
     */
    export function detachListener(firebase: any, dispatch: Dispatch, meta: any): void;
    /**
     * Turn query string into a query config object
     * @param queryPathStr String to be converted
     * @param parsedPath - Already parsed path (used instead of attempting parse)
     * @returns Object containing collection, doc and subcollection
     */
    export function queryStrToObj(queryPathStr: string, parsedPath?: string[]): QueryConfigObject;
    /**
     * Convert array of querys into an array of query config objects.
     * This normalizes things for later use.
     * @param query - Query setups in the form of objects or strings
     * @returns Query setup normalized into a queryConfig object
     */
    export function getQueryConfig(query: QueryConfig): QueryConfigObject;
    /**
     * Convert array of querys into an array of queryConfig objects
     * @param queries - Array of query strings/objects
     * @returns watchEvents - Array of watch events
     */
    export function getQueryConfigs(queries: string | any[] | QueryConfigObject): QueryConfigObject[];
    /**
     * Get ordered array from snapshot
     * @param snap - Data for which to create
     * an ordered array.
     * @returns Ordered list of children from snapshot or null
     */
    export function orderedFromSnap(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataArray[];
    interface DocumentsDataArray {
        id: string;
        data?: firebase.firestore.DocumentData | null | undefined;
        [k: string]: any;
    }
    interface DocumentsDataByIdObject {
        [docId: string]: firebase.firestore.DocumentData | null | undefined;
    }
    /**
     * Create data object with values for each document with keys being doc.id.
     * @param snap - Data for which to create
     * an ordered array.
     * @returns Object documents from snapshot or null
     */
    export function dataByIdSnapshot(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataByIdObject | null;
    /**
     * @private
     * Create an array of promises for population of an object or list
     * @param firebase - Internal firebase object
     * @param populate - Object containing root to be populate
     * @param populate.root - Firebase root path from which to load populate item
     * @param id - String id
     * @returns Resolves with child for population
     */
    export function getPopulateChild(firebase: any, populate: PopulateConfig, id: string): Promise<any>;
    /**
     * @private
     * Populate list of data
     * @param firebase - Internal firebase object
     * @param originalObj - Object to have parameter populated
     * @param populate - Object containing populate information
     * @param results - Object containing results of population from other populates
     * @returns Array of populated items
     */
    export function populateList(firebase: any, originalObj: any, p: PopulateConfig, results: any): Promise<any[]>;
    /**
     * @private
     * Create an array of promises for population of an object or list
     * @param firebase - Internal firebase object
     * @param dataKey - Object to have parameter populated
     * @param originalData - String containg population data
     * @param populatesIn
     * @returns Promises for populating
     */
    export function promisesForPopulate(firebase: any, dataKey: any, originalData: any, populatesIn: any): Promise<any>;
    interface DispatchListenerResponseOptions {
        dispatch: Dispatch;
        docData?: any;
        meta: any;
        firebase: any;
    }
    /**
     * Dispatch action(s) response from listener response.
     * @private
     * @param opts
     * @param opts.dispatch - Redux action dispatch function
     * @param opts.firebase - Firebase instance
     * @param opts.docData - Data object from document
     * @param opts.meta - Meta data
     */
    export function dispatchListenerResponse(opts: DispatchListenerResponseOptions): void;
    interface GetPopulateActionOptions {
        docData?: any;
        meta: any;
        firebase: any;
    }
    /**
     * Get list of actions for population queries
     * @private
     * @param opts
     * @param opts.firebase - Firebase instance
     * @param opts.docData - Data object from document
     * @param opts.meta - Meta data
     * @returns Actions for populating
     */
    export function getPopulateActions(opts: GetPopulateActionOptions): Promise<(Partial<ReduxFirestoreAction>)[]>;
}
declare module "actions/firestore" {
    import { Dispatch } from 'redux';
    import { QueryConfig } from "types";
    /**
     * Add data to a collection or document on Cloud Firestore with the call to
     * the Firebase library being wrapped in action dispatches.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @param doc - Document name
     * @returns Resolves with results of add call
     */
    export function add(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig, data: firebase.firestore.DocumentData): Promise<firebase.firestore.DocumentReference>;
    /**
     * Set data to a document on Cloud Firestore with the call to
     * the Firebase library being wrapped in action dispatches.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @param doc - Document name
     * @returns Resolves with results of set call
     */
    export function set(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig, data: firebase.firestore.DocumentData, options?: firebase.firestore.SetOptions): Promise<void>;
    /**
     * Get a collection or document from Cloud Firestore with the call to
     * the Firebase library being wrapped in action dispatches.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @param doc - Document name
     * @returns Resolves with results of get call
     */
    export function get(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig, options?: firebase.firestore.GetOptions): Promise<firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot>;
    /**
     * Update a document on Cloud Firestore with the call to the Firebase library
     * being wrapped in action dispatches.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @param doc - Document name
     * @returns Resolves with results of update call
     */
    export function update(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig, data: firebase.firestore.DocumentData): Promise<void>;
    /**
     * Delete a reference on Cloud Firestore with the call to the Firebase library
     * being wrapped in action dispatches. If attempting to delete a collection
     * delete promise will be rejected with "Only documents can be deleted" unless
     * onAttemptCollectionDelete is provided. This is due to the fact that
     * Collections can not be deleted from a client, it should instead be handled
     * within a cloud function.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @returns Resolves with void after deleting document
     */
    export function deleteRef(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig): Promise<void>;
    /**
     * Set listener to Cloud Firestore with the call to the Firebase library
     * being wrapped in action dispatches.. Internall calls Firebase's onSnapshot()
     * method.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfig - Options for query
     * @param queryConfig.collection - Collection name
     * @param queryConfig.doc - Document name
     * @param queryConfig.where - Where settings for query. Array of strings
     * for one where, an Array of Arrays for multiple wheres
     * @param successCb - Callback called on success
     * @param errorCb - Callback called on error
     * @returns Unsubscribe
     */
    export function setListener(firebase: any, dispatch: Dispatch, queryConfig: QueryConfig, successCb?: any, errorCb?: ((error: Error) => void) | undefined): () => void;
    /**
     * Set an array of listeners only allowing for one of a specific configuration.
     * If config.allowMultipleListeners is true or a function
     * (`(listener, listeners) => {}`) that evaluates to true then multiple
     * listeners with the same config are attached.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param queryConfigs - Configs for listeners to be set
     */
    export function setListeners(firebase: any, dispatch: Dispatch, queryConfigs: QueryConfig[]): void;
    /**
     * Unset previously set listener to Cloud Firestore. Listener must have been
     * set with setListener(s) in order to be tracked.
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param meta - Metadata
     * @param meta.collection - Collection name
     * @param meta.doc - Document name
     * @returns Resolves when listener has been attached **not** when data
     * has been gathered by the listener.
     */
    export function unsetListener(firebase: any, dispatch: Dispatch, meta: QueryConfig): void;
    /**
     * Unset a list of listeners
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param listeners - Array of listener configs
     */
    export function unsetListeners(firebase: any, dispatch: Dispatch, queryConfigs: QueryConfig[]): void;
    /**
     * Atomic operation with Firestore (either read or write).
     * @param firebase - Internal firebase object
     * @param dispatch - Redux's dispatch function
     * @param transactionPromise - Function which runs transaction
     * operation.
     * @returns Resolves with result of transaction operation
     */
    export function runTransaction(firebase: any, dispatch: Dispatch, updateFunction: (transaction: firebase.firestore.Transaction) => Promise<any>): Promise<any>;
}
declare module "actions/index" {
    import * as firestoreActions from "actions/firestore";
    export { firestoreActions };
}
declare module "createFirestoreInstance" {
    import { Dispatch } from 'redux';
    import { ReduxFirestoreConfig, ExtendedFirestoreInstance } from "types";
    /**
     * Create a firebase instance that has helpers attached for dispatching actions
     * @param firebase - Firebase instance which to extend
     * @param configs - Configuration object
     * @param dispatch - Action dispatch function
     * @return Extended Firebase instance
     */
    export default function createFirestoreInstance(firebase: any, configs: ReduxFirestoreConfig, dispatch: Dispatch): ExtendedFirestoreInstance;
    /**
     * Expose Firestore instance created internally. Useful for
     * integrations into external libraries such as redux-thunk and redux-observable.
     * @returns Firebase Instance
     * @example <caption>redux-thunk integration</caption>
     * import { applyMiddleware, compose, createStore } from 'redux';
     * import thunk from 'redux-thunk';
     * import makeRootReducer from './reducers';
     * import { reduxFirestore, getFirestore } from 'redux-firestore';
     *
     * const fbConfig = {} // your firebase config
     *
     * const store = createStore(
     *   makeRootReducer(),
     *   initialState,
     *   compose(
     *     applyMiddleware([
     *       // Pass getFirestore function as extra argument
     *       thunk.withExtraArgument(getFirestore)
     *     ]),
     *     reduxFirestore(fbConfig)
     *   )
     * );
     * // then later
     * export function addTodo(newTodo) {
     *   return (dispatch, getState, getFirestore) => {
      *    const firebase = getFirestore()
      *    firebase
      *      .add('todos', newTodo)
      *      .then(() => {
      *        dispatch({ type: 'SOME_ACTION' })
      *      })
     *   }
     *
     * };
     *
     */
    export function getFirestore(): any;
}
declare module "utils/reducers" {
    import { AnyAction } from 'redux';
    import { PreserveSetting } from "types";
    /**
     * Create a path array from path string
     * @param path - Path seperated with slashes
     * @returns Path as Array
     * @private
     */
    export function pathToArr(path: string | undefined): string[];
    /**
     * Trim leading slash from path for use with state
     * @param path - Path seperated with slashes
     * @returns Path seperated with slashes
     * @private
     */
    export function getSlashStrPath(path: string): string;
    /**
     * Convert path with slashes to dot seperated path (for use with lodash get/set)
     * @param path - Path seperated with slashes
     * @returns Path seperated with dots
     * @private
     */
    export function getDotStrPath(path: string): string;
    /**
     * Update a single item within an array with support for adding the item if
     * it does not already exist
     * @param array - Array within which to update item
     * @param itemId - Id of item to update
     * @param updateItemCallback - Callback dictacting how the item
     * is updated
     * @returns Array with item updated
     * @private
     */
    export function updateItemInArray(array: any[] | undefined, itemId: string | undefined, updateItemCallback: (item: any) => any): any[];
    /**
     * A function for expressing reducers as an object mapping from action
     * types to handlers (mentioned in redux docs:
     * https://redux.js.org/recipes/reducing-boilerplate#generating-reducers)
     * @param initialState - Initial state of reducer
     * @param handlers - Mapping of action types to handlers
     * @returns Reducer function which uses each handler only when
     * the action type matches.
     */
    export function createReducer(initialState: any, handlers: any): (state: any, action: AnyAction) => any;
    /**
     * Preserve slice of state based on preserve settings for that slice. Settings
     * for support can be any of type `Boolean`, `Function`, or `Array`.
     * @param state - slice of redux state to be preserved
     * @param preserveSetting - Settings for which values to preserve
     * @param nextState - What state would have been set to if preserve
     * was not occuring.
     * @return Slice of state with values preserved
     * @private
     */
    export function preserveValuesFromState(state: any, preserveSetting: PreserveSetting, nextState?: any): any;
}
declare module "reducers/dataReducer" {
    import { DataState, ReduxFirestoreAction } from "types";
    /**
     * Reducer for data state.
     * @param  {Object} [state={}] - Current data redux state
     * @param  {Object} action - Object containing the action that was dispatched
     * @param  {String} action.type - Type of action that was dispatched
     * @param  {Object} action.meta - Meta data of action
     * @param  {String} action.meta.collection - Name of the collection for the
     * data being passed to the reducer.
     * @param  {Array} action.meta.where - Where query parameters array
     * @param  {Array} action.meta.storeAs - Another parameter in redux under
     * which to store values.
     * @return {Object} Data state after reduction
     */
    export default function dataReducer(state: DataState, action: ReduxFirestoreAction): DataState;
}
declare module "reducers/errorsReducer" {
    import { AnyAction } from 'redux';
    type AllErrorIdsState = string[];
    export interface ErrorsByQueryState {
        [k: string]: any;
    }
    export interface ErrorsState {
        byQuery: ErrorsByQueryState;
        allIds: AllErrorIdsState;
    }
    const errorsReducer: import("redux").Reducer<{
        byQuery: ErrorsByQueryState;
        allIds: any;
    }, AnyAction>;
    export default errorsReducer;
}
declare module "reducers/listenersReducer" {
    type AllListenerIdsState = (string | undefined)[];
    export interface ListenersByIdState {
        [k: string]: any;
    }
    export interface ListenersState {
        byId: ListenersByIdState;
        allIds: AllListenerIdsState;
    }
    /**
     * Reducer for `listeners` state. Made from combination of listenersById and
     * allListeners reducers using combineReducers
     * @param [state={}] - Current listeners state
     * @param action - Object containing the action that was dispatched
     * @param ction.type - Type of action that was dispatched
     * @returns Profile state after reduction
     */
    const listenersReducer: import("redux").Reducer<{
        byId: ListenersByIdState;
        allIds: any;
    }, import("redux").AnyAction>;
    export default listenersReducer;
}
declare module "reducers/orderedReducer" {
    import { OrderedState, ReduxFirestoreAction } from "types";
    /**
     * Reducer for ordered state.
     * @param [state={}] - Current ordered redux state
     * @param action - The action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @param action.meta.collection - Name of Collection which the action
     * associates with
     * @param action.meta.doc - Name of Document which the action
     * associates with
     * @param action.meta.subcollections - Subcollections which the action
     * associates with
     * @param action.meta.storeAs - Another key within redux store that the
     * action associates with (used for storing data under a path different
     * from its collection/document)
     * @param action.payload - Object containing data associated with
     * action
     * @param action.payload.ordered - Ordered Array Data associated with
     * action
     * @return Ordered state after reduction
     */
    export default function orderedReducer(state: OrderedState, action: ReduxFirestoreAction): OrderedState;
}
declare module "reducers/statusReducer" {
    import { TimestampsState, RequestedState, RequestingState } from "types";
    import { ReduxFirestoreAction } from "types";
    /**
     * Reducer for requesting state.Changed by `START`, `NO_VALUE`, and `SET` actions.
     * @param [state={}] - Current requesting redux state
     * @param action - Object containing the action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @param action.path - Path of action that was dispatched
     * @param action.meta - The meta information of the query
     * @returns Profile state after reduction
     */
    export function requestingReducer(state: RequestingState, action: ReduxFirestoreAction): RequestingState;
    /**
     * Reducer for requested state. Changed by `START`, `NO_VALUE`, and `SET` actions.
     * @param [state={}] - Current requested redux state
     * @param action - Object containing the action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @param action.path - Path of action that was dispatched
     * @param action.meta - The meta information of the query
     * @returns Profile state after reduction
     */
    export function requestedReducer(state: RequestedState, action: ReduxFirestoreAction): RequestedState;
    /**
     * Reducer for timestamps state. Changed by `START`, `NO_VALUE`, and `SET` actions.
     * @param [state={}] - Current timestamps redux state
     * @param action - Object containing the action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @param action.path - Path of action that was dispatched
     * @returns Profile state after reduction
     */
    export function timestampsReducer(state: {}, action: ReduxFirestoreAction): TimestampsState;
    const _default_1: import("redux").Reducer<{
        requesting: RequestingState;
        requested: RequestedState;
        timestamps: TimestampsState;
    }, import("redux").AnyAction>;
    /**
     * @name statusReducer
     * Reducer for `status` state. Made from requestingReducer ,requestedReducer,
     * and timestampsReducer reducers combined together using combineReducers.
     * @param [state={}] - Current listeners state
     * @param action - Object containing the action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @returns Profile state after reduction
     */
    export default _default_1;
}
declare module "reducers/queriesReducer" {
    import { ReduxFirestoreAction } from "types";
    export function isComposable(action: ReduxFirestoreAction): string;
    export interface QueriesState {
        [k: string]: any;
    }
    /**
     *
     * @param [state={}] - Current listenersById redux state
     * @param action - Object containing the action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @returns Queries state
     */
    export default function queriesReducer(state: {}, action: ReduxFirestoreAction): QueriesState;
}
declare module "reducers/crossSliceReducer" {
    import { ReduxFirestoreAction } from "types";
    export interface CrossSliceQueriesState {
        [k: string]: any;
    }
    export interface CrossSliceState {
        queries: CrossSliceQueriesState;
    }
    /**
     * Reducer for crossSlice state
     * @param [state={}] - Current ordered redux state
     * @param action - The action that was dispatched
     * @param action.type - Type of action that was dispatched
     * @return
     */
    export default function crossSliceReducer(state: CrossSliceState, action: ReduxFirestoreAction): CrossSliceQueriesState;
}
declare module "reducers/index" {
    import dataReducer from "reducers/dataReducer";
    import errorsReducer from "reducers/errorsReducer";
    import listenersReducer from "reducers/listenersReducer";
    import orderedReducer from "reducers/orderedReducer";
    import statusReducer from "reducers/statusReducer";
    import queriesReducer from "reducers/queriesReducer";
    import crossSliceReducer from "reducers/crossSliceReducer";
    export { dataReducer, errorsReducer, listenersReducer, orderedReducer, statusReducer, queriesReducer, crossSliceReducer, };
    const _default_2: {
        dataReducer: typeof dataReducer;
        errorsReducer: import("redux").Reducer<{
            byQuery: import("reducers/errorsReducer").ErrorsByQueryState;
            allIds: any;
        }, import("redux").AnyAction>;
        listenersReducer: import("redux").Reducer<{
            byId: import("reducers/listenersReducer").ListenersByIdState;
            allIds: any;
        }, import("redux").AnyAction>;
        orderedReducer: typeof orderedReducer;
        statusReducer: import("redux").Reducer<{
            requesting: import("types").RequestingState;
            requested: import("types").RequestedState;
            timestamps: import("types").TimestampsState;
        }, import("redux").AnyAction>;
        queriesReducer: typeof queriesReducer;
        crossSliceReducer: typeof crossSliceReducer;
    };
    export default _default_2;
}
declare module "reducer" {
    const _default_3: import("reduce-reducers").Reducer<import("reducers/crossSliceReducer").CrossSliceQueriesState>;
    export default _default_3;
}
declare module "middleware" {
    import { Store } from 'redux';
    export const CALL_FIRESTORE = "CALL_FIRESTORE";
    export default function reduxFirestoreMiddleware(firestore: any): (store: Store<any, import("redux").AnyAction>) => (next: any) => (action: any) => Promise<any>;
}
declare module "selectors" {
    import { QueryConfig } from "types";
    /**
     * Create state value selector for firestore data by key
     * @param queryConfig - Configuration for query
     * @returns Data selected from firestore data state
     */
    export function firestoreDataSelector(queryConfig: QueryConfig): (state: any, getPath: string) => any;
    /**
     * Create state value selector for firestore ordered data (array)
     * @param queryConfig - Configuration for query
     * @returns Data selected from firestore ordered state
     */
    export function firestoreOrderedSelector(queryConfig: QueryConfig): (state: any, getPath: string) => any;
}
declare module "index" {
    import reducer from "reducer";
    import { firestoreActions } from "actions/index";
    import createFirestoreInstance, { getFirestore } from "createFirestoreInstance";
    import constants, { actionTypes } from "constants";
    import middleware, { CALL_FIRESTORE } from "middleware";
    import { getQueryName } from "utils/query";
    import { firestoreOrderedSelector, firestoreDataSelector } from "selectors";
    export const version: string;
    export { reducer, reducer as firestoreReducer, createFirestoreInstance, firestoreActions as actions, getQueryName, firestoreOrderedSelector, firestoreDataSelector, getFirestore, constants, actionTypes, middleware, CALL_FIRESTORE };
    const _default_4: {
        version: string;
        reducer: import("reduce-reducers").Reducer<import("reducers/crossSliceReducer").CrossSliceQueriesState>;
        firestoreReducer: import("reduce-reducers").Reducer<import("reducers/crossSliceReducer").CrossSliceQueriesState>;
        createFirestoreInstance: typeof createFirestoreInstance;
        actions: typeof firestoreActions;
        getFirestore: typeof getFirestore;
        constants: {
            actionsPrefix: string;
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
                DOCUMENT_ADDED: string;
                DOCUMENT_MODIFIED: string;
                DOCUMENT_REMOVED: string;
                TRANSACTION_START: string;
                TRANSACTION_SUCCESS: string;
                TRANSACTION_FAILURE: string;
            };
            defaultConfig: {
                logListenerError: boolean;
                enhancerNamespace: string;
                helpersNamespace: any;
                allowMultipleListeners: boolean;
                preserveOnDelete: any;
                preserveOnListenerError: any;
                onAttemptCollectionDelete: any;
                mergeOrdered: boolean;
                mergeOrderedDocUpdates: boolean;
                mergeOrderedCollectionUpdates: boolean;
            };
        };
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
            DOCUMENT_ADDED: string;
            DOCUMENT_MODIFIED: string;
            DOCUMENT_REMOVED: string;
            TRANSACTION_START: string;
            TRANSACTION_SUCCESS: string;
            TRANSACTION_FAILURE: string;
        };
        middleware: typeof middleware;
        CALL_FIRESTORE: string;
    };
    export default _default_4;
}
