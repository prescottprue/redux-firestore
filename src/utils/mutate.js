import { chunk, mapValues } from 'lodash';
import { firestoreRef } from './query';

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
function arrayUnion(firestore, key, val) {
  if (key !== '::arrayUnion') return null;
  return firestore.FieldValue.arrayUnion(val);
}

/**
 * Mutate arrayRemove
 * @param {object} firestore - firestore
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @returns Null | Array<*>
 */
function arrayRemove(firestore, key, val) {
  return key === '::arrayRemove' && firestore.FieldValue.arrayRemove(val);
}

/**
 * Mutate increment
 * @param {object} firestore - firestore
 * @param {string} key - mutate tuple key
 * @param {*} val - mutate tuple value
 * @returns Null | number
 */
const increment = (firestore, key, val) =>
  key === '::increment' &&
  typeof val === 'number' &&
  firestore.FieldValue.increment(val);

/**
 * Mutate timestamp
 * @param {object} firestore - firestore
 * @param {*} key
 * @returns
 */
const serverTimestamp = (firestore, key) =>
  key === '::serverTimestamp' && firestore.FieldValue.serverTimestamp();

/**
 * Process Mutation to a vanilla JSON
 * @param {object} firestore - firestore
 * @param {*} mutation - payload mutation
 * @returns
 */
function atomize(firestore, mutation) {
  return Object.keys(mutation).reduce((data, key) => {
    const clone = { ...data };
    const val = clone[key];
    if (key.includes('.')) {
      nestedMap(clone, key, val);
    } else if (Array.isArray(val) && val.length > 0) {
      // eslint-disable-next-line no-param-reassign
      clone[key] =
        primaryValue(val) ||
        serverTimestamp(firestore, val[0]) ||
        arrayUnion(firestore, val[0], val[1]) ||
        arrayRemove(firestore, val[0], val[1]) ||
        increment(firestore, val[0], val[1]);
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
  const { collection, doc, data } = operations;
  return docRef(firebase.firestore(), collection, doc).set(
    atomize(firebase.firestore(), data),
    {
      merge: true,
    },
  );
}

const MAX_BATCH_COUNT = 500;

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns Promise
 */
async function writeInBatch(firebase, operations) {
  const committedBatchesPromised = chunk(operations, MAX_BATCH_COUNT).map(
    (operationsChunk) => {
      const writesBatched = operationsChunk.reduce(
        (batch, { collection, doc, data }) =>
          batch.set(
            docRef(firebase.firestore(), collection, doc),
            atomize(firebase.firestore(), data),
            {
              merge: true,
            },
          ),
        firebase.firestore().batch(),
      );

      return writesBatched.commit();
    },
  );

  await Promise.all(committedBatchesPromised);
}

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns Promise
 */
async function writeInTransaction(firebase, operations) {
  await firebase.firestore().runTransaction(async (transaction) => {
    const readsPromised = mapValues(operations.reads, (read) => {
      if (isDocRead(read)) {
        return transaction
          .get(firestoreRef(firebase, read))
          .then((doc) => doc.data());
      }

      return firestoreRef(firebase, read)
        .get()
        .then((result) =>
          Promise.all(result.docs.map((doc) => transaction.get(doc.ref))),
        )
        .then((docs) => docs.map((doc) => doc.data()));
    });

    const fetchedData = await promiseAllObject(readsPromised);

    operations.writes.forEach((writeFn) => {
      const writes = writeFn(fetchedData);

      if (Array.isArray(writes)) {
        writes.forEach(({ collection, doc, data }) =>
          transaction.set(
            docRef(firebase.firestore(), collection, doc),
            atomize(firebase.firestore(), data),
            {
              merge: true,
            },
          ),
        );
      } else {
        transaction.set(
          docRef(firebase.firestore(), writes.collection, writes.doc),
          atomize(firebase.firestore(), writes.data),
          { merge: true },
        );
      }
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

  return writeInTransaction(firestore, operations);
}
