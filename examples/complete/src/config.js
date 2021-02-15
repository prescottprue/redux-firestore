/**
 * NOTE: This file is ignored from git tracking. In a CI environment it is
 * generated by firebase-ci based on config in .firebaserc (see .gitlab-ci.yaml).
 * This is done so that environment specific settings can be applied.
 */

export const env = 'dev'

// Config for firebase
export const firebase = {
  apiKey: "AIzaSyCVKQUFemqhQdkIy-i83mPcSSD5dUqqQBk",
  authDomain: "redux-firestore-3996a.firebaseapp.com",
  databaseURL: "https://redux-firestore-3996a-default-rtdb.firebaseio.com",
  projectId: "redux-firestore-3996a",
  storageBucket: "redux-firestore-3996a.appspot.com",
  messagingSenderId: "69609080163",
  appId: "1:69609080163:web:a20aac99c66a2749243f56"
}

// Config to override default reduxFirebase config in store/createStore
// which is not environment specific.
// For more details, visit http://react-redux-firebase.com/docs/api/enhancer.html
export const reduxFirebase = {
  enableLogging: false, // enable/disable Firebase Database Logging
}

export default {
  env,
  firebase,
  reduxFirebase
}
