import {
  isString,
  isArray,
  isFunction,
  isEmpty,
  isObject,
  isNumber,
  size,
  trim,
  forEach,
  has,
  map,
  get,
  cloneDeep,
  set,
  some,
} from 'lodash';
import { to } from '../utils/async';
import { actionTypes } from '../constants';
import { QueryConfig, QueryConfigObject, QueryNameOptions, PopulateConfig, ReduxFirestoreAction, ReduxFirestoreConfig, WhereConfig, OrderByConfig } from '../types';
import * as firebase from 'firebase/app'
import { Dispatch } from 'redux';

/**
 * Add where claues to Cloud Firestore Reference handling invalid formats
 * and multiple where statements (array of arrays)
 * @param ref - Reference which to add where to
 * @param where - Where statement to attach to reference
 * @return Reference with where statement attached
 */
function addWhereToRef(ref: firebase.firestore.CollectionReference | firebase.firestore.Query, where: WhereConfig | any): any {
  if (!Array.isArray(where) || where.length < 3) {
    throw new Error('where parameter must be an array with at least there arguments.');
  }
  
  if (isString(where[0])) {
    return ref.where(...where)
  }

  return where.reduce((acc, whereArgs) => addWhereToRef(acc, whereArgs), ref);
}

/**
 * Add attribute to Cloud Firestore Reference handling invalid formats
 * and multiple orderBy statements (array of arrays). Used for orderBy and where
 * @param {firebase.firestore.Reference} ref - Reference which to add where to
 * @param {Array} orderBy - Statement to attach to reference
 * @param {String} [attrName='where'] - Name of attribute
 * @return {firebase.firestore.Reference} Reference with where statement attached
 */
function addOrderByToRef(ref: firebase.firestore.CollectionReference, orderBy: OrderByConfig): firebase.firestore.Query {
  if (!isArray(orderBy) && !isString(orderBy)) {
    throw new Error('orderBy parameter must be an array or string.');
  }
  if (isString(orderBy)) {
    return ref.orderBy(orderBy);
  }
  if (isString(orderBy[0])) {
    return ref.orderBy(...orderBy);
  }
  return orderBy.reduce(
    (acc, orderByArgs) => addOrderByToRef(acc, orderByArgs),
    ref,
  );
}

/**
 * Call methods on ref object for provided subcollection list (from queryConfig
 * object)
 * @param  {firebase.firestore.CollectionReference} ref - reference on which
 * to call methods to apply queryConfig
 * @param  {Array} subcollectionList - List of subcollection settings from
 * queryConfig object
 * @return {firebase.firestore.Query} Query object referencing path within
 * firestore
 */
function handleSubcollections(ref: firebase.firestore.DocumentReference | firebase.firestore.CollectionReference | firebase.firestore.Query | any, subcollectionList: QueryConfigObject[] | undefined): firebase.firestore.Query {
  if (subcollectionList) {
    forEach(subcollectionList, subcollection => {
      /* eslint-disable no-param-reassign */
      if (ref instanceof firebase.firestore.DocumentReference && subcollection.collection) {
        if (typeof ref.collection !== 'function') {
          throw new Error(
            `Collection can only be run on a document. Check that query config for subcollection: "${
              subcollection.collection
            }" contains a doc parameter.`,
          );
        }
        ref = ref.collection(subcollection.collection);
      }
      if (subcollection.doc) ref = ref.doc(subcollection.doc);
      if (subcollection.where) ref = addWhereToRef(ref, subcollection.where);
      if (subcollection.orderBy) {
        ref = addOrderByToRef(ref, subcollection.orderBy);
      }
      if (subcollection.limit) ref = ref.limit(subcollection.limit);
      if (subcollection.startAt) ref = ref.startAt(subcollection.startAt);
      if (subcollection.startAfter) {
        ref = ref.startAfter(subcollection.startAfter);
      }
      if (subcollection.endAt) ref = ref.endAt(subcollection.endAt);
      if (subcollection.endBefore) ref = ref.endBefore(subcollection.endBefore);

      ref = handleSubcollections(ref, subcollection.subcollections);
      /* eslint-enable */
    });
  }
  return ref;
}

/**
 * Create a Cloud Firestore reference for a collection or document
 * @param {Object} firebase - Internal firebase object
 * @param {Object} meta - Metadata
 * @param {String} meta.collection - Collection name
 * @param {String} meta.doc - Document name
 * @param {Array} meta.where - List of argument arrays
 * @return {firebase.firestore.Reference} Resolves with results of add call
 */
export function firestoreRef(firebase: any, meta: QueryConfigObject): firebase.firestore.Query {
  if (!firebase.firestore) {
    throw new Error('Firestore must be required and initalized.');
  }
  const {
    collection,
    doc,
    subcollections,
    where,
    orderBy,
    limit,
    startAt,
    startAfter,
    endAt,
    endBefore,
  } = meta;
  let ref = firebase.firestore().collection(collection);
  // TODO: Compare other ways of building ref
  if (doc) ref = ref.doc(doc);
  ref = handleSubcollections(ref, subcollections);
  if (where) ref = addWhereToRef(ref, where);
  if (orderBy) ref = addOrderByToRef(ref, orderBy);
  if (limit) ref = ref.limit(limit);
  if (startAt) ref = ref.startAt(startAt);
  if (startAfter) ref = ref.startAfter(startAfter);
  if (endAt) ref = ref.endAt(endAt);
  if (endBefore) ref = ref.endBefore(endBefore);
  return ref;
}

/**
 * Convert where parameter into a string notation for use in query name
 * @param  {String} key - Key to use
 * @param  {Array} value - Where config array
 * @return {String} String representing where settings for use in query name
 */
function arrayToStr(key: string, value: string | number | string[][]): string | string[] {
  if (isString(value) || isNumber(value)) return `${key}=${value}`;
  if (isString(value[0])) return `${key}=${value.join(':')}`;
  if (value && value.toString) return `${key}=${value.toString()}`;

  return value.map(val => arrayToStr(key, val));
}

/**
 * Pcik query params from object
 * @param {Object} obj - Object from which to pick query params
 * @return {Object}
 */
function pickQueryParams(obj: any): QueryConfigObject {
  return [
    'where',
    'orderBy',
    'limit',
    'startAfter',
    'startAt',
    'endAt',
    'endBefore',
  ].reduce((acc, key) => (obj[key] ? { ...acc, [key]: obj[key] } : acc), {});
}

/**
 * Join/serilize query params
 * @param {Object} queryParams - Query settings
 * @return {String}
 */
function serialize(queryParams: QueryConfigObject): string {
  return Object.keys(queryParams)
    .filter(key => (queryParams as any)[key] !== undefined)
    .map(key => arrayToStr(key, (queryParams as any)[key]))
    .join('&');
}

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
export function getQueryName(meta: QueryConfig, options?: QueryNameOptions): string {
  if (isString(meta)) {
    return meta;
  }
  const { collection, doc, subcollections, where, limit, storeAs } = meta;
  if (storeAs) {
    return storeAs;
  }
  if (!collection) {
    throw new Error('Collection is required to build query name');
  }

  if (storeAs) {
    return storeAs;
  }

  let basePath = collection;
  // Return path only including subcollections (data)
  if (options && options.onlySubcollections && !subcollections) {
    return basePath;
  }
  if (doc) {
    basePath = basePath.concat(`/${doc}`);
  }
  if (subcollections) {
    const mappedCollections = subcollections.map(subcollection =>
      getQueryName(subcollection),
    );
    basePath = `${basePath}/${mappedCollections.join('/')}`;
  }

  // Return path only including subcollections (data)
  if (options && options.onlySubcollections) {
    return basePath;
  }

  if (where) {
    if (!isArray(where)) {
      throw new Error('where parameter must be an array.');
    }
    basePath = basePath.concat('?', serialize(meta));
  }
  return basePath;
}

/**
 * Create query name based on query settings for use as object keys (used
 * in listener management and reducers).
 * @param meta - Metadata object containing query settings
 * @param meta.collection - Collection name of query
 * @param meta.doc - Document id of query
 * @param meta.subcollections - Subcollections of query
 * @returns String representing query settings
 */
export function getBaseQueryName(meta: any): string {
  if (isString(meta)) {
    return meta;
  }
  const { collection, subcollections, ...remainingMeta } = meta;
  if (!collection) {
    throw new Error('Collection is required to build query name');
  }
  let basePath = collection;

  if (subcollections) {
    const mappedCollections = subcollections.map((subcollection: any) =>
      getQueryName(subcollection),
    );
    basePath = `${basePath}/${mappedCollections.join('/')}`;
  }

  const queryParams = pickQueryParams(remainingMeta);

  if (!isEmpty(queryParams)) {
    if (queryParams.where && !isArray(queryParams.where)) {
      throw new Error('where parameter must be an array.');
    }
    basePath = basePath.concat('?', serialize(queryParams));
  }

  return basePath;
}

/**
 * Confirm that meta object exists and that listeners object exists on internal
 * firebase instance. If these required values do not exist, an error is thrown.
 * @param firebase - Internal firebase object
 * @param meta - Metadata object
 */
function confirmMetaAndConfig(firebase: any, meta: any) {
  if (!meta) {
    throw new Error('Meta data is required to attach listener.');
  }
  if (!has(firebase, '_.listeners')) {
    throw new Error(
      'Internal Firebase object required to attach listener. Confirm that reduxFirestore enhancer was added when you were creating your store',
    );
  }
}

/**
 * Get whether or not a listener is attached at the provided path
 * @param firebase - Internal firebase object
 * @param meta - Metadata object
 * @returns Whether or not listener exists
 */
export function listenerExists(firebase: any, meta: any): boolean {
  confirmMetaAndConfig(firebase, meta);
  const name = getQueryName(meta);
  return !!firebase._.listeners[name];
}

/**
 * Update the number of watchers for a query
 * @param firebase - Internal firebase object
 * @param dispatch - Redux's dispatch function
 * @param meta - Metadata
 * @param unsubscribe - Unsubscribe function
 * @param doc - Document name
 * @returns Object containing all listeners
 */
export function attachListener(firebase: any, dispatch: Dispatch, meta: any, unsubscribe: () => void): any {
  confirmMetaAndConfig(firebase, meta);

  const name = getQueryName(meta);
  if (!firebase._.listeners[name]) {
    firebase._.listeners[name] = unsubscribe; // eslint-disable-line no-param-reassign
  }

  dispatch({
    type: actionTypes.SET_LISTENER,
    meta,
    payload: { name },
  });

  return firebase._.listeners;
}

/**
 * Remove/Unset a watcher
 * @param firebase - Internal firebase object
 * @param dispatch - Redux's dispatch function
 * @param meta - Metadata
 * @param collection - Collection name
 * @param doc - Document name
 */
export function detachListener(firebase: any, dispatch: Dispatch, meta: any): void {
  const name = getQueryName(meta);
  if (firebase._.listeners[name]) {
    firebase._.listeners[name]();
    delete firebase._.listeners[name]; // eslint-disable-line no-param-reassign
  }

  dispatch({
    type: actionTypes.UNSET_LISTENER,
    meta,
    payload: { name },
  });
}

/**
 * Turn query string into a query config object
 * @param queryPathStr String to be converted
 * @param parsedPath - Already parsed path (used instead of attempting parse)
 * @returns Object containing collection, doc and subcollection
 */
export function queryStrToObj(queryPathStr: string, parsedPath?: string[]): QueryConfigObject {
  const pathArr = parsedPath || trim(queryPathStr, '/').split('/');
  const [collection, doc, ...subcollections] = pathArr;
  const queryObj: QueryConfigObject = {};
  if (collection) queryObj.collection = collection;
  if (doc) queryObj.doc = doc;
  if (subcollections.length) {
    queryObj.subcollections = [queryStrToObj('', subcollections)];
  }
  return queryObj;
}

/**
 * Convert array of querys into an array of query config objects.
 * This normalizes things for later use.
 * @param query - Query setups in the form of objects or strings
 * @returns Query setup normalized into a queryConfig object
 */
export function getQueryConfig(query: QueryConfig): QueryConfigObject {
  if (isString(query)) {
    return queryStrToObj(query);
  }
  if (isObject(query)) {
    if (!query.collection && !query.doc) {
      throw new Error(
        'Collection and/or Doc are required parameters within query definition object.',
      );
    }
    return query;
  }
  throw new Error(
    'Invalid Path Definition: Only Strings and Objects are accepted.',
  );
}

/**
 * Convert array of querys into an array of queryConfig objects
 * @param {Array} queries - Array of query strings/objects
 * @returns {Array} watchEvents - Array of watch events
 */
export function getQueryConfigs(queries: string | any[] | QueryConfigObject): QueryConfigObject[] {
  if (Array.isArray(queries)) {
    return queries.map(getQueryConfig);
  }
  if (isString(queries)) {
    return [queryStrToObj(queries)];
  }
  if (isObject(queries)) {
    return [getQueryConfig(queries)];
  }
  throw new Error('Querie(s) must be an Array or a string.');
}

/**
 * Get ordered array from snapshot
 * @param snap - Data for which to create
 * an ordered array.
 * @returns Ordered list of children from snapshot or null
 */
export function orderedFromSnap(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataArray[] {
  const ordered = [];
  if (snap instanceof firebase.firestore.DocumentSnapshot && snap.data && snap.exists) {
    const obj = isObject(snap.data())
      ? { id: snap.id, ...(snap.data() || snap.data) }
      : { id: snap.id, data: snap.data() };
    ordered.push(obj);
  } else if (snap instanceof firebase.firestore.QuerySnapshot && snap.forEach) {
    snap.forEach((doc: any) => {
      const obj = isObject(doc.data())
        ? { id: doc.id, ...(doc.data() || doc.data) }
        : { id: doc.id, data: doc.data() };
      ordered.push(obj);
    });
  }
  return ordered;
}

interface DocumentsDataArray {
  id: string
  data?: firebase.firestore.DocumentData | null | undefined
  [k: string]: any
}

interface DocumentsDataByIdObject {
  [docId: string]: firebase.firestore.DocumentData | null | undefined
}

/**
 * Create data object with values for each document with keys being doc.id.
 * @param snap - Data for which to create
 * an ordered array.
 * @returns Object documents from snapshot or null
 */
export function dataByIdSnapshot(snap: firebase.firestore.DocumentSnapshot | firebase.firestore.QuerySnapshot): DocumentsDataByIdObject | null {
  const data: DocumentsDataByIdObject = {};
  if (snap instanceof firebase.firestore.DocumentSnapshot && snap.data) {
    data[snap.id] = snap.exists ? snap.data() : null;
  } else if (snap instanceof firebase.firestore.QuerySnapshot && snap.forEach) {
    snap.forEach(doc => {
      data[doc.id] = doc.data() || doc;
    });
  }
  return size(data) ? data : null;
}

/**
 * @private
 * @description Create an array of promises for population of an object or list
 * @param firebase - Internal firebase object
 * @param populate - Object containing root to be populate
 * @param populate.root - Firebase root path from which to load populate item
 * @param id - String id
 * @returns Resolves with child for population
 */
export function getPopulateChild(firebase: any, populate: PopulateConfig, id: string): Promise<any> {
  return firestoreRef(firebase, { collection: populate.root, doc: id })
    .get()
    .then((snap: firebase.firestore.DocumentData) => Object.assign({ id }, snap.data()));
}

/**
 * @private
 * @description Populate list of data
 * @param {Object} firebase - Internal firebase object
 * @param {Object} originalObj - Object to have parameter populated
 * @param {Object} populate - Object containing populate information
 * @param {Object} results - Object containing results of population from other populates
 * @returns {Promise}
 */
export function populateList(firebase: any, originalObj: any, p: PopulateConfig, results: any): Promise<any[]> {
  // Handle root not being defined
  if (!results[p.root]) {
    set(results, p.root, {});
  }
  return Promise.all(
    map(originalObj, (id, childKey): any => {
      // handle list of keys
      const populateKey = id === true || p.populateByKey ? childKey : id;
      return getPopulateChild(firebase, p, populateKey).then(pc => {
        if (pc) {
          // write child to result object under root name if it is found
          return set(results, `${p.root}.${populateKey}`, pc);
        }
        return results;
      });
    }),
  );
}

/**
 * @private
 * @description Create standardized populate object from strings or objects
 * @param {String|Object} str - String or Object to standardize into populate object
 * @returns {Object}
 */
function getPopulateObj(str: any): PopulateConfig {
  if (!isString(str)) {
    return str;
  }
  const strArray = str.split(':');
  // TODO: Handle childParam
  return { child: strArray[0], root: strArray[1] };
}

/**
 * @private
 * @description Create standardized populate object from strings or objects
 * @param {Array} arr - Array of items to get populate objects for
 * @returns {Array}
 */
function getPopulateObjs(arr: (string | PopulateConfig | any)[]): PopulateConfig[] {
  if (!isArray(arr)) {
    return arr;
  }
  return arr.map(o => (isObject(o) ? (o as PopulateConfig) : getPopulateObj(o)));
}

/**
 * @private
 * @description Create an array of promises for population of an object or list
 * @param {Object} firebase - Internal firebase object
 * @param {Object} dataKey - Object to have parameter populated
 * @param {Object} originalData - String containg population data
 * @param {Object} populatesIn
 * @returns {Promise}
 */
export function promisesForPopulate(
  firebase: any,
  dataKey: any,
  originalData: any,
  populatesIn: any,
): Promise<any> {
  // TODO: Handle selecting of parameter to populate with (i.e. displayName of users/user)
  const promisesArray: any[] = [];
  const results = {};

  // test if data is a single object, try generating populates and looking for the child
  const populatesForData = getPopulateObjs(
    isFunction(populatesIn) ? populatesIn(dataKey, originalData) : populatesIn,
  );

  const dataHasPopulateChilds = some(populatesForData, populate =>
    has(originalData, populate.child),
  );
  if (dataHasPopulateChilds) {
    // Data is a single object, resolve populates directly
    forEach(populatesForData, p => {
      if (isString(get(originalData, p.child))) {
        return promisesArray.push(
          getPopulateChild(firebase, p, get(originalData, p.child)).then(v => {
            // write child to result object under root name if it is found
            if (v) {
              set(results, `${p.root}.${get(originalData, p.child)}`, v);
            }
          }),
        );
      }

      // Single Parameter is list
      return promisesArray.push(
        populateList(firebase, get(originalData, p.child), p, results),
      );
    });
  } else {
    // Data is a list of objects, each value has parameters to be populated
    // { '1': {someobject}, '2': {someobject} }
    forEach(originalData, (d, key) => {
      // generate populates for this data item if a fn was passed
      const populatesForDataItem = getPopulateObjs(
        isFunction(populatesIn) ? populatesIn(key, d) : populatesIn,
      );

      // resolve each populate for this data item
      forEach(populatesForDataItem, p => {
        // get value of parameter to be populated (key or list of keys)
        const idOrList = get(d, p.child);

        /* eslint-disable consistent-return */
        // Parameter/child of list item does not exist
        if (!idOrList) {
          return;
        }

        // Parameter of each list item is single ID
        if (isString(idOrList)) {
          return promisesArray.push(
            // eslint-disable-line
            getPopulateChild(firebase, p, idOrList).then(v => {
              // write child to result object under root name if it is found
              if (v) {
                set(results, `${p.root}.${idOrList}`, v);
              }
              return results;
            }),
          );
        }

        // Parameter of each list item is a list of ids
        if (isArray(idOrList) || isObject(idOrList)) {
          // Create single promise that includes a promise for each child
          return promisesArray.push(
            // eslint-disable-line
            populateList(firebase, idOrList, p, results),
          );
        }
      });
    });
  }

  // Return original data after population promises run
  return Promise.all(promisesArray).then(() => results);
}

const changeTypeToEventType = {
  added: actionTypes.DOCUMENT_ADDED,
  removed: actionTypes.DOCUMENT_REMOVED,
  modified: actionTypes.DOCUMENT_MODIFIED,
};

/**
 * Action creator for document change event. Used to create action objects
 * to be passed to dispatch.
 * @param  {Object} change - Document change object from Firebase callback
 * @param  {Object} [originalMeta={}] - Original meta data of action
 * @returns {Object}
 */
function docChangeEvent(change: firebase.firestore.DocumentChange, originalMeta?: any): ReduxFirestoreAction {
  const meta = { ...cloneDeep(originalMeta), path: change.doc.ref.path };
  if (originalMeta && originalMeta.subcollections && !originalMeta.storeAs) {
    meta.subcollections[0] = { ...meta.subcollections[0], doc: change.doc.id };
  } else {
    meta.doc = change.doc.id;
  }
  return {
    type: (changeTypeToEventType as any)[change.type] || actionTypes.DOCUMENT_MODIFIED,
    meta,
    payload: {
      data: change.doc.data(),
      ordered: { oldIndex: change.oldIndex, newIndex: change.newIndex },
    },
  };
}

interface DispatchListenerResponseOptions {
  dispatch: Dispatch
  docData?: any
  meta: any
  firebase: any
}

/**
 * Dispatch action(s) response from listener response.
 * @private
 * @param {Object} opts
 * @param {Function} opts.dispatch - Redux action dispatch function
 * @param {Object} opts.firebase - Firebase instance
 * @param {Object} opts.docData - Data object from document
 * @param {Object} opts.meta - Meta data
 */
export function dispatchListenerResponse(opts: DispatchListenerResponseOptions) {
  const {
    dispatch,
    docData,
    meta,
    firebase,
  } = opts
  const {
    mergeOrdered,
    mergeOrderedDocUpdates,
    mergeOrderedCollectionUpdates,
  } = (firebase._.config as ReduxFirestoreConfig) || ({} as ReduxFirestoreConfig);
  const docChanges =
    typeof docData.docChanges === 'function'
      ? docData.docChanges()
      : docData.docChanges;
  // Dispatch different actions for doc changes (only update doc(s) by key)
  if (docChanges && docChanges.length < docData.size) {
    // Loop to dispatch for each change if there are multiple
    // TODO: Option for dispatching multiple changes in single action
    docChanges.forEach((change: firebase.firestore.DocumentChange) => {
      dispatch(docChangeEvent(change, meta));
    });
  } else {
    // Dispatch action for whole collection change
    dispatch({
      type: actionTypes.LISTENER_RESPONSE,
      meta,
      payload: {
        data: dataByIdSnapshot(docData),
        ordered: orderedFromSnap(docData),
      },
      merge: {
        docs: mergeOrdered && mergeOrderedDocUpdates,
        collections: mergeOrdered && mergeOrderedCollectionUpdates,
      },
    });
  }
}


interface GetPopulateActionOptions {
  docData?: any
  meta: any
  firebase: any
}

/**
 * Get list of actions for population queries
 * @private
 * @param {Object} opts
 * @param {Object} opts.firebase - Firebase instance
 * @param {Object} opts.docData - Data object from document
 * @param {Object} opts.meta - Meta data
 * @returns {Promise}
 */
export async function getPopulateActions(opts: GetPopulateActionOptions): Promise<Partial<ReduxFirestoreAction>[]> {
  const { firebase, docData, meta } = opts
  // Run promises for population
  const [populateErr, populateResults] = await to(
    promisesForPopulate(
      firebase,
      docData.id,
      dataByIdSnapshot(docData),
      meta.populates,
    ),
  );

  // Handle errors populating
  if (populateErr) {
    console.error('Error with populate:', populateErr, meta); // eslint-disable-line no-console
    throw populateErr;
  }

  // Dispatch listener results for each child collection
  return Object.keys(populateResults).map(resultKey => ({
    // TODO: Handle population of subcollection queries
    meta: { collection: resultKey },
    payload: {
      data: populateResults[resultKey],
      // TODO: Write ordered here
    },
    requesting: false,
    requested: true,
  }));
}
