import { chunk, cloneDeep, flatten, mapValues } from 'lodash';
import { firestoreRef } from './query';
import mark from './profiling';

/**
 * @param {object} firestore
 * @param {string} collection
 * @param {string} doc
 * @returns Boolean
 */
const docRef = (firestore, collection, doc) =>
  firestore.doc(`${collection}/${doc}`);

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
 * @param {Mutation_v1 | Mutation_v2} read
 * @returns Boolean
 */
function isDocRead(read) {
  return read && typeof read.doc === 'string';
}

/**
 * @param {Mutation_v1 | Mutation_v2} operations
 * @returns Boolean
 */
function isSingleWrite(operations) {
  return operations && typeof operations.collection === 'string';
}

// ----- FieldValue support -----

const primaryValue = (arr) =>
  Array.isArray(arr) && typeof arr[0] === 'string' && arr[0].indexOf('::') === 0
    ? null
    : arr;

const arrayUnion = (firebase, key, val) => {
  if (key !== '::arrayUnion') return null;
  return firebase.firestore.FieldValue.arrayUnion(val);
};

const arrayRemove = (firebase, key, val) =>
  key === '::arrayRemove' && firebase.firestore.FieldValue.arrayRemove(val);

const increment = (firebase, key, val) =>
  key === '::increment' &&
  typeof val === 'number' &&
  firebase.firestore.FieldValue.increment(val);

const serverTimestamp = (firebase, key) =>
  key === '::serverTimestamp' &&
  firebase.firestore.FieldValue.serverTimestamp();

/**
 * Process Mutation to a vanilla JSON
 * @param {object} firebase - firebase
 * @param {*} operation - payload mutation
 * @returns
 */
function atomize(firebase, operation) {
  let requiresUpdate = false;
  return [
    Object.keys(operation).reduce((data, key) => {
      const clone = { ...data };
      const val = clone[key];
      if (key.includes('.')) {
        requiresUpdate = true;
      }
      if (!val) return clone;

      const value =
        primaryValue(val) ||
        serverTimestamp(firebase, val[0]) ||
        arrayUnion(firebase, val[0], val[1]) ||
        arrayRemove(firebase, val[0], val[1]) ||
        increment(firebase, val[0], val[1]);

      if (Array.isArray(val) && val.length > 0) {
        // eslint-disable-next-line no-param-reassign
        clone[key] = value;
      }
      return clone;
    }, cloneDeep(operation)),
    requiresUpdate,
  ];
}

// ----- write functions -----

/**
 * For details between set & udpate see:
 * https://firebase.google.com/docs/reference/js/firebase.firestore.Transaction#update
 * @param {object} firebase
 * @param {Mutation_v1 | Mutation_v2} operation
 * @param {Batch | Transaction} writer
 * @returns {Promise | Doc} - Batch & Transaction .set returns null
 */
function write(firebase, operation = {}, writer = null) {
  const { collection, path, doc, id, data, ...rest } = operation;
  const ref = docRef(firebase.firestore(), path || collection, id || doc);
  const [changes, requiresUpdate = false] = atomize(firebase, data || rest);

  if (writer) {
    const writeType = writer.commit ? 'Batching' : 'Transaction.set';
    if (requiresUpdate) {
      writer.update(ref, changes);
    } else {
      writer.set(ref, changes, { merge: true });
    }
    return { id: ref.id, path: ref.parent.path, ...changes };
  }
  if (requiresUpdate) {
    return ref.update(changes);
  }

  return ref.set(changes, { merge: true });
}

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns {Promise}
 */
function writeSingle(firebase, operations) {
  const done = mark('mutate.writeSingle');
  const promise = write(firebase, operations);
  done();
  return promise;
}

const MAX_BATCH_COUNT = 500;

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns {Promise}
 */
async function writeInBatch(firebase, operations) {
  const done = mark('mutate.writeInBatch');
  const committedBatchesPromised = chunk(operations, MAX_BATCH_COUNT).map(
    (operationsChunk) => {
      const batch = firebase.firestore().batch();
      const writesBatched = operationsChunk.map((operation) =>
        write(firebase, operation, batch),
      );

      return batch.commit().then(() => writesBatched);
    },
  );

  done();
  return Promise.all(committedBatchesPromised).then(flatten);
}

/**
 * @param {object} firebase
 * @param {object} operations
 * @returns {Promise}
 */
async function writeInTransaction(firebase, operations) {
  return firebase.firestore().runTransaction(async (transaction) => {
    const serialize = (doc) =>
      !doc
        ? null
        : { ...doc.data(), id: doc.ref.id, path: doc.ref.parent.path };
    const getter = (ref) => {
      return transaction.get(ref);
    };

    const done = mark('mutate.writeInTransaction:reads');
    const readsPromised = mapValues(operations.reads, async (read) => {
      if (isDocRead(read)) {
        const doc = firestoreRef(firebase, read);
        const snapshot = await getter(doc);
        return serialize(snapshot.exsits === false ? null : snapshot);
      }

      // NOTE: Queries are not supported in Firestore Transactions (client-side)
      const coll = firestoreRef(firebase, read);
      const snapshot = await coll.get();
      if (snapshot.docs.length === 0) return [];
      const unserializedDocs = await Promise.all(snapshot.docs.map(getter));
      return unserializedDocs.map(serialize);
    });

    done();
    const reads = await promiseAllObject(readsPromised);

    const writes = [];

    operations.writes.forEach((writeFnc) => {
      const complete = mark('mutate.writeInTransaction:writes');
      const operation =
        typeof writeFnc === 'function' ? writeFnc(reads) : writeFnc;

      if (Array.isArray(operation)) {
        operation.map((op) => write(firebase, op, transaction));
        writes.push(operation);
      } else {
        writes.push(write(firebase, operation, transaction));
      }

      complete();
    });

    // Firestore Transaction return null.
    // Instead we'll return the results of all read data & writes.
    return { reads, writes };
  });
}

/**
 * @param {object} firestore
 * @param {object} operations
 * @returns {Promise}
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
