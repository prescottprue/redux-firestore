import { Dispatch, AnyAction } from 'redux'
import {
  add,
  set,
  get,
  update,
  deleteRef,
  setListener,
  setListeners,
  runTransaction,
  unsetListener,
  unsetListeners
} from './actions/firestore'

export interface PreserveSettingObject {
  data: PreserveSetting
  ordered: PreserveSetting
}

export type PreserveSetting = boolean | string[] | any // TODO: support function (state: any, nextState: any) => any

export interface RequestingState {
  [slashPath: string]: boolean
}

export interface RequestedState {
  [slashPath: string]: boolean
}

export interface TimestampsState {
  [slashPath: string]: number
}

export interface StatusState {
  requesting: RequestingState
  requested: RequestedState
  timestamps: TimestampsState
}

export interface DataState {
  [dataPath: string]: firebase.firestore.DocumentData | null | undefined
}

export interface OrderedState {
  [dataPath: string]: (firebase.firestore.DocumentData | null | undefined)[]
}

export interface FirestoreState {
  data?: DataState
  errors?: any
  listeners?: any
  ordered?: OrderedState
  status?: StatusState
  queries?: any
  composite?: any
}

export interface OrderedActionPayload {
  oldIndex: number
  newIndex: number
}

interface ActionPayload {
  data: firebase.firestore.DocumentData
  ordered?: OrderedActionPayload | any[]
  name?: string
}

export type ActionMeta = QueryConfigObject & {
  path?: string // added in docChangeEvent
}

export interface ReduxFirestoreAction extends AnyAction {
  type: string
  meta: ActionMeta
  payload: ActionPayload
  timestamp?: number
  preserve?: PreserveSettingObject
  path?: string
  merge?: any
}

export type QueryConfig = string | QueryConfigObject

export interface PopulateConfig {
  root: string
  child: string
  populateByKey?: boolean
}

export interface QueryNameOptions {
  onlySubcollections?: boolean
}

type SingleWhereConfig = [string | firebase.firestore.FieldPath, firebase.firestore.WhereFilterOp, any]
export type WhereConfig = SingleWhereConfig | SingleWhereConfig[]

type OrderDirectionString = 'desc' | 'asc' | undefined

export type OrderByConfig = string | firebase.firestore.FieldPath | [string | firebase.firestore.FieldPath, OrderDirectionString]

export interface QueryConfigObject {
  collection?: string
  collectionGroup?: string
  doc?: string
  subcollections?: QueryConfigObject[] | undefined
  where?: WhereConfig
  orderBy?: OrderByConfig
  limit?: number
  storeAs?: string
  endBefore?: string
  endAt?: string
  startAt?: string
  startAfter?: string
  populates?: PopulateConfig[]
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