import { add, set, get, update, deleteRef, setListener, setListeners, runTransaction, unsetListener, unsetListeners } from './actions/firestore'

export type QueryConfig = string | QueryConfigObject

export type WhereConfig = string[] | string[][]

export interface PopulateConfig {
  root: string
}

export interface QueryNameOptions {
  onlySubcollections?: boolean
}

export interface QueryConfigObject {
  collection?: string
  doc?: string
  subcollections?: QueryConfigObject[] | undefined
  where?: WhereConfig
  orderBy: string | string[] | firebase.firestore.FieldPath
  limit?: string
  storeAs?: string
  endBefore?: string
  endAt?: string
  startAt?: string
  startAfter?: string
}

export interface ReduxFirestoreConfig {
  enableLogging?: boolean;
  helpersNamespace?: string | null;
  // https://github.com/prescottprue/redux-firestore#loglistenererror
  logListenerError?: boolean;
  // https://github.com/prescottprue/redux-firestore#enhancernamespace
  enhancerNamespace?: string;
  // https://github.com/prescottprue/redux-firestore#allowmultiplelisteners
  allowMultipleListeners?:
    | ((listenerToAttach: any, currentListeners: any) => boolean)
    | boolean;
  // https://github.com/prescottprue/redux-firestore#preserveondelete
  preserveOnDelete?: null | object;
  // https://github.com/prescottprue/redux-firestore#preserveonlistenererror
  preserveOnListenerError?: null | object;
  // https://github.com/prescottprue/redux-firestore#onattemptcollectiondelete
  onAttemptCollectionDelete?: null | ((queryOption: string, dispatch: Dispatch, firebase: Record<string, any>) => void);
  // https://github.com/prescottprue/redux-firestore#mergeordered
  mergeOrdered?: boolean;
  // https://github.com/prescottprue/redux-firestore#mergeordereddocupdate
  mergeOrderedDocUpdate?: boolean;
  // https://github.com/prescottprue/redux-firestore#mergeorderedcollectionupdates
  mergeOrderedCollectionUpdates?: boolean;
  
  mergeOrderedDocUpdates?: boolean
}

export interface ExtendedFirestoreInstance {
  add: typeof add
  set: typeof set
  get: typeof get
  update: typeof update
  deleteRef: typeof deleteRef
  delete: typeof deleteRef
  setListener: typeof setListener
  setListeners: typeof setListeners
  unsetListener: typeof unsetListener
  unsetListeners: typeof unsetListeners
  runTransaction: typeof runTransaction
}