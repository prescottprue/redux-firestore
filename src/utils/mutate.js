import { chunk, isFunction, mapValues } from 'lodash';
import { firestoreRef } from './query';
import mark from './perfmarks';

/**
 * @param {object} firestore
 * @param {string} collection
 * @param {string} doc
 * @returns Boolean
 */
const docRef = (firestore, collection, doc) =>
  firestore.collection(collection).doc(doc);

/**
 * @param object
 * @returns Promise
 */
async function promiseAllObject(object) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(object).map(([key, promise]) =>
        promise.then((value) => [key, value]),
      ),
    ),
  );
}

/**
 * @param {object} operations
 * @returns Boolean
 */
function isBatchedWrite(operations) {
  return Array.isArray(operations);
}

/**
 * @param {object} operations
 * @returns Boolean
 */
function isDocRead(read) {
  return read && typeof read.doc === 'string';
}

/**
 * @param {object} operations
 * @returns Boolean
 */
function isSingleWrite(operations) {
  return operations && typeof operations.collection === 'string';
}

// ----- FieldValue support -----

/**
 * Not a Mutate, just an array
 * @param {Array} arr
 * @returns Null | Array
 */
const primaryValue = (arr) =>
  typeof arr[0] === 'string' && arr[0].indexOf('::') === 0 ? null : arr;

/**
 * Mutate Nested Object
 * @param {*} obj - data
 * @param {*} key - nested key path
 * @param {*} val - value to be set
 * @returns Null | object
 */
const nestedMap = (obj, key, val) => {
  if (!key.includes('.')) return null;
  // eslint-disable-next-line no-param-reassign
  delete obj[key];
  const fields = key.split('.');
  fields.reduce((deep, field, idx) => {
    // eslint-disable-next-line no-param-reassign
    if (deep[field] === undefined) deep[field] = {};
    // eslint-disable-next-line no-param-reassign
    if (idx === fields.length - 1) deep[field] = val;
    return deep[field];
  }, obj);
  return obj;
};

/**
 * Mutate ArrayUnion
 * @param {object} firestore - firestore
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @returns Null | Array<*>
 */
function arrayUnion(firebase, key, val) {
  if (key !== '::arrayUnion') return null;
  return firebase.firestore.FieldValue.arrayUnion(val);
}

/**
 * Mutate arrayRemove
 * @param {object} firestore - firestore
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @returns Null | Array<*>
 */
function arrayRemove(firebase, key, val) {
  return (
    key === '::arrayRemove' && firebase.firestore.FieldValue.arrayRemove(val)
  );
}

/**
 * Mutate increment
 * @param {object} firestore - firestore
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @returns Null | number
 */
const increment = (firebase, key, val) =>
  key === '::increment' &&
  typeof val === 'number' &&
  firebase.firestore.FieldValue.increment(val);

/**
 * Mutate timestamp
 * @param {object} firestore - firestore
 * @param {*} key
 * @returns
 */
const serverTimestamp = (firebase, key) =>
  key === '::serverTimestamp' &&
  firebase.firestore.FieldValue.serverTimestamp();

/**
 * Process Mutation to a vanilla JSON
 * @param {object} firestore - firestore
 * @param {*} mutation - payload mutation
 * @returns
 */
function atomize(firebase, mutation) {
  return Object.keys(mutation).reduce((data, key) => {
    const clone = { ...data };
    const val = clone[key];
    if (key.includes('.')) {
      nestedMap(clone, key, val);
    } else if (Array.isArray(val) && val.length > 0) {
      // eslint-disable-next-line no-param-reassign
      clone[key] =
        primaryValue(val) ||
        serverTimestamp(firebase, val[0]) ||
        arrayUnion(firebase, val[0], val[1]) ||
        arrayRemove(firebase, val[0], val[1]) ||
        increment(firebase, val[0], val[1]);
    }
    return clone;
  }, JSON.parse(JSON.stringify(mutation)));
}

// ----- write functions -----

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns Promise
 */
function writeSingle(firebase, operations) {
  mark('mutate.writeSingle');
  const { collection, path, doc, id, data, ...rest } = operations;
  const promise = docRef(
    firebase.firestore(),
    path || collection,
    id || doc,
  ).set(atomize(firebase, data || rest), {
    merge: true,
  });
  mark('mutate.writeSingle', true);
  return promise;
}

const MAX_BATCH_COUNT = 500;

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns Promise
 */
async function writeInBatch(firebase, operations) {
  mark('mutate.writeInBatch');
  const committedBatchesPromised = chunk(operations, MAX_BATCH_COUNT).map(
    (operationsChunk) => {
      const writesBatched = operationsChunk.reduce(
        (batch, { collection, path, doc, id, data, ...rest }) =>
          batch.set(
            docRef(firebase.firestore(), path || collection, id || doc),
            atomize(firebase, data || rest),
            {
              merge: true,
            },
          ),
        firebase.firestore().batch(),
      );

      return writesBatched.commit();
    },
  );

  mark('mutate.writeInBatch', true);
  await Promise.all(committedBatchesPromised);
}

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns Promise
 */
async function writeInTransaction(firebase, operations) {
  return firebase.firestore().runTransaction(async (transaction) => {
    mark('mutate.writeInTransaction');
    const readsPromised = mapValues(operations.reads, (read) => {
      if (isDocRead(read)) {
        return transaction.get(firestoreRef(firebase, read)).then((doc) => ({
          ...doc.data(),
          id: doc.ref.id,
          path: doc.ref.path,
        }));
      }

      return firestoreRef(firebase, read)
        .get()
        .then((result) =>
          Promise.all(result.docs.map((doc) => transaction.get(doc.ref))),
        )
        .then((docs) =>
          docs.map((doc) => ({
            ...doc.data(),
            id: doc.ref.id,
            path: doc.ref.path,
          })),
        );
    });

    mark('mutate.writeInTransaction', true);
    const fetchedData = await promiseAllObject(readsPromised);

    operations.writes.forEach((writeFn) => {
      const writes = isFunction(writeFn) ? writeFn(fetchedData) : writeFn;
      mark('mutate.writeInTransaction');

      const writer = ({ collection, path, doc, id, data, ...rest }) =>
        transaction.set(
          docRef(firebase.firestore(), path || collection, id || doc),
          atomize(firebase, data || rest),
          {
            merge: true,
          },
        );

      if (Array.isArray(writes)) {
        writes.forEach(writer);
      } else {
        writer(writes);
      }
      mark('mutate.writeInTransaction', true);
    });
  });
}

/**
 * @param {object} firestore
 * @param {object} operations
 * @returns Promise
 */
export default function mutate(firestore, operations) {
  if (isSingleWrite(operations)) {
    return writeSingle(firestore, operations);
  }

  if (isBatchedWrite(operations)) {
    return writeInBatch(firestore, operations);
  }

  return writeInTransaction(firestore, operations).then((val) => val);
}
