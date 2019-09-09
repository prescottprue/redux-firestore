declare module "constants" {
    export const actionsPrefix = "@@reduxFirestore";
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
    export const defaultConfig: {
        logListenerError: boolean;
        enhancerNamespace: string;
        helpersNamespace: null;
        allowMultipleListeners: boolean;
        preserveOnDelete: null;
        preserveOnListenerError: null;
        onAttemptCollectionDelete: null;
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
            helpersNamespace: null;
            allowMultipleListeners: boolean;
            preserveOnDelete: null;
            preserveOnListenerError: null;
            onAttemptCollectionDelete: null;
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
        args?: string[];
    }
    export function wrapInDispatch(dispatch: Dispatch, wrapOptions: WrapInDispatchOptions): Promise<any>;
    interface MethodAliasSettings {
        action: any;
        name: string;
    }
    export function mapWithFirebaseAndDispatch(firebase: any, dispatch: Dispatch, actions: any, aliases: MethodAliasSettings[]): any;
}
declare module "utils/async" {
    export function to<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U | null, T | undefined]>;
}
declare module "types" {
    import { Dispatch, AnyAction } from 'redux';
    import { add, set, get, update, deleteRef, setListener, setListeners, runTransaction, unsetListener, unsetListeners } from "actions/firestore";
    export interface PreserveSettingObject {
        data: PreserveSetting;
        ordered: PreserveSetting;
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
        payload: ActionPayload;
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
        add: typeof add;
        set: typeof set;
        get: typeof get;
        update: typeof update;
        deleteRef: typeof deleteRef;
        delete: typeof deleteRef;
        setListener: typeof setListener;
        setListeners: typeof setListeners;
        unsetListener: typeof unsetListener;
        unsetListeners: typeof unsetListeners;
        runTransaction: typeof runTransaction;
    }
}
declare module "utils/query" {
    import { QueryConfig, QueryConfigObject, QueryNameOptions, PopulateConfig, ReduxFirestoreAction } from "types";
    import * as firebase from 'firebase/app';
    import { Dispatch } from 'redux';
    export function firestoreRef(firebase: any, meta: QueryConfigObject): firebase.firestore.Query;
    export function getQueryName(meta: QueryConfig, options?: QueryNameOptions): string;
    export function getBaseQueryName(meta: any): string;
    export function listenerExists(firebase: any, meta: any): boolean;
    export function attachListener(firebase: any, dispatch: Dispatch, meta: any, unsubscribe: () => void): any;
    export function detachListener(firebase: any, dispatch: Dispatch, meta: any): void;
    export function queryStrToObj(queryPathStr: string, parsedPath?: string[]): QueryConfigObject;
    export function getQueryConfig(query: QueryConfig): QueryConfigObject;
    export function getQueryConfigs(queries: string | any[] | QueryConfigObject): QueryConfigObject[];
    export function orderedFromSnap(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataArray[];
    interface DocumentsDataArray {
        id: string;
        data?: firebase.firestore.DocumentData | null | undefined;
        [k: string]: any;
    }
    interface DocumentsDataByIdObject {
        [docId: string]: firebase.firestore.DocumentData | null | undefined;
    }
    export function dataByIdSnapshot(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataByIdObject | null;
    export function getPopulateChild(firebase: any, populate: PopulateConfig, id: string): Promise<any>;
    export function populateList(firebase: any, originalObj: any, p: PopulateConfig, results: any): Promise<any[]>;
    export function promisesForPopulate(firebase: any, dataKey: any, originalData: any, populatesIn: any): Promise<any>;
    interface DispatchListenerResponseOptions {
        dispatch: Dispatch;
        docData?: any;
        meta: any;
        firebase: any;
    }
    export function dispatchListenerResponse(opts: DispatchListenerResponseOptions): void;
    interface GetPopulateActionOptions {
        docData?: any;
        meta: any;
        firebase: any;
    }
    export function getPopulateActions(opts: GetPopulateActionOptions): Promise<(Partial<ReduxFirestoreAction>)[]>;
}
declare module "actions/firestore" {
    import { Dispatch } from 'redux';
    import { QueryConfigObject, QueryConfig } from "types";
    export function add(firebase: any, dispatch: Dispatch, queryOption: any, ...args: any[]): Promise<any>;
    export function set(firebase: any, dispatch: Dispatch, queryOption: any, ...args: any[]): Promise<any>;
    export function get(firebase: any, dispatch: Dispatch, queryOption: any): Promise<any>;
    export function update(firebase: any, dispatch: Dispatch, queryOption: any, ...args: any[]): Promise<any>;
    export function deleteRef(firebase: any, dispatch: Dispatch, queryOption: any): Promise<any>;
    export function setListener(firebase: any, dispatch: Dispatch, queryOpts: QueryConfig, successCb?: any, errorCb?: any): () => void;
    export function setListeners(firebase: any, dispatch: Dispatch, listeners: QueryConfigObject[]): void;
    export function unsetListener(firebase: any, dispatch: Dispatch, meta: QueryConfigObject): void;
    export function unsetListeners(firebase: any, dispatch: Dispatch, listeners: any[]): void;
    export function runTransaction(firebase: any, dispatch: Dispatch, transactionPromise: any): Promise<any>;
}
declare module "actions/index" {
    import * as firestoreActions from "actions/firestore";
    export { firestoreActions };
    const _default_1: {
        firestoreActions: typeof firestoreActions;
    };
    export default _default_1;
}
declare module "createFirestoreInstance" {
    import { Dispatch } from 'redux';
    import { ReduxFirestoreConfig } from "types";
    export default function createFirestoreInstance(firebase: any, configs: ReduxFirestoreConfig, dispatch: Dispatch): any;
    export function getFirestore(): any;
}
declare module "utils/reducers" {
    import { AnyAction } from 'redux';
    import { PreserveSetting } from "types";
    export function pathToArr(path: string | undefined): string[];
    export function getSlashStrPath(path: string): string;
    export function getDotStrPath(path: string): string;
    export function updateItemInArray(array: any[] | undefined, itemId: string | undefined, updateItemCallback: (item: any) => any): any[];
    export function createReducer(initialState: any, handlers: any): (state: any, action: AnyAction) => any;
    export function preserveValuesFromState(state: any, preserveSetting: PreserveSetting, nextState: any): any;
}
declare module "reducers/dataReducer" {
    import { DataState, ReduxFirestoreAction } from "types";
    export default function dataReducer(state: DataState | undefined, action: ReduxFirestoreAction): DataState;
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
        allIds: string[];
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
    const listenersReducer: import("redux").Reducer<{
        byId: ListenersByIdState;
        allIds: (string | undefined)[];
    }, import("redux").AnyAction>;
    export default listenersReducer;
}
declare module "reducers/orderedReducer" {
    import { OrderedState, ReduxFirestoreAction } from "types";
    export default function orderedReducer(state: OrderedState | undefined, action: ReduxFirestoreAction): OrderedState;
}
declare module "reducers/statusReducer" {
    import { TimestampsState, RequestedState, RequestingState } from "types";
    import { ReduxFirestoreAction } from "types";
    export function requestingReducer(state: RequestingState | undefined, action: ReduxFirestoreAction): RequestingState;
    export function requestedReducer(state: RequestedState | undefined, action: ReduxFirestoreAction): RequestedState;
    export function timestampsReducer(state: {} | undefined, action: ReduxFirestoreAction): TimestampsState;
    const _default_2: import("redux").Reducer<{
        requesting: RequestingState;
        requested: RequestedState;
        timestamps: TimestampsState;
    }, import("redux").AnyAction>;
    export default _default_2;
}
declare module "reducers/queriesReducer" {
    import { ReduxFirestoreAction } from "types";
    export function isComposable(action: ReduxFirestoreAction): string | undefined;
    export interface QueriesState {
        [k: string]: any;
    }
    export default function queriesReducer(state: {} | undefined, action: ReduxFirestoreAction): QueriesState;
}
declare module "reducers/crossSliceReducer" {
    import { ReduxFirestoreAction } from "types";
    export interface CrossSliceQueriesState {
        [k: string]: any;
    }
    export interface CrossSliceState {
        queries: CrossSliceQueriesState;
    }
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
    const _default_3: {
        dataReducer: typeof dataReducer;
        errorsReducer: import("redux").Reducer<{
            byQuery: import("reducers/errorsReducer").ErrorsByQueryState;
            allIds: string[];
        }, import("redux").AnyAction>;
        listenersReducer: import("redux").Reducer<{
            byId: import("reducers/listenersReducer").ListenersByIdState;
            allIds: (string | undefined)[];
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
    export default _default_3;
}
declare module "reducer" {
    const _default_4: import("reduce-reducers").Reducer<import("redux").Reducer<{
        status: {
            requesting: any;
            requested: any;
            timestamps: any;
        };
        data: import("types").DataState;
        ordered: import("types").OrderedState;
        listeners: {
            byId: any;
            allIds: any;
        };
        errors: {
            byQuery: any;
            allIds: any;
        };
        queries: import("reducers/queriesReducer").QueriesState;
        composite: any;
    }, import("redux").AnyAction>>;
    export default _default_4;
}
declare module "middleware" {
    import { Store } from 'redux';
    export const CALL_FIRESTORE = "CALL_FIRESTORE";
    export default function reduxFirestoreMiddleware(firestore: any): (store: Store<any, import("redux").AnyAction>) => (next: any) => (action: any) => Promise<any>;
}
declare module "selectors" {
    import { QueryConfig } from "types";
    export function firestoreDataSelector(queryConfig: QueryConfig): (state: any, getPath: string) => any;
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
    export const version: string | undefined;
    export { reducer, reducer as firestoreReducer, createFirestoreInstance, firestoreActions as actions, getQueryName, firestoreOrderedSelector, firestoreDataSelector, getFirestore, constants, actionTypes, middleware, CALL_FIRESTORE };
    const _default_5: {
        version: string | undefined;
        reducer: import("reduce-reducers").Reducer<import("redux").Reducer<{
            status: {
                requesting: any;
                requested: any;
                timestamps: any;
            };
            data: import("types").DataState;
            ordered: import("types").OrderedState;
            listeners: {
                byId: any;
                allIds: any;
            };
            errors: {
                byQuery: any;
                allIds: any;
            };
            queries: import("reducers/queriesReducer").QueriesState;
            composite: any;
        }, import("redux").AnyAction>>;
        firestoreReducer: import("reduce-reducers").Reducer<import("redux").Reducer<{
            status: {
                requesting: any;
                requested: any;
                timestamps: any;
            };
            data: import("types").DataState;
            ordered: import("types").OrderedState;
            listeners: {
                byId: any;
                allIds: any;
            };
            errors: {
                byQuery: any;
                allIds: any;
            };
            queries: import("reducers/queriesReducer").QueriesState;
            composite: any;
        }, import("redux").AnyAction>>;
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
                helpersNamespace: null;
                allowMultipleListeners: boolean;
                preserveOnDelete: null;
                preserveOnListenerError: null;
                onAttemptCollectionDelete: null;
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
    export default _default_5;
}
