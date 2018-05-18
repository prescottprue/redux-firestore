/**
 * NOTE: This file is ignored from git tracking. In a CI environment, it is
 * generated using build/create-config.js by calling npm run create-config (or
 * using firebase-ci if deploying to Firebase hosting). This is done so that
 * environment specific settings can be applied.
 */

export const env = 'development'

// Config for firebase
export const firebase = {
  apiKey: 'AIzaSyBTvAcJwsN8iygsnwAZyzIuy1uleYEpWIo',
  authDomain: 'redux-firestore.firebaseapp.com',
  databaseURL: 'https://redux-firestore.firebaseio.com',
  projectId: 'redux-firestore',
  storageBucket: 'redux-firestore.appspot.com',
  messagingSenderId: '502471151289'
}

// Config for react-redux-firebase
// For more details, visit https://prescottprue.gitbooks.io/react-redux-firebase/content/config.html
export const reduxFirebase = {
  // collection within Firestore to which user profiles are written (would be
  // RTDB without useFirestoreForProfile)
  userProfile: 'users',
  // Profile data is located within Firestore instead of Real Time Database
  useFirestoreForProfile: true,
   // place metadata about storage uploads into Firestore
   // when calling uploadFiles or uploadFile with a third argument
  useFirestoreForStorageMeta: true,
  enableLogging: false, // enable/disable Firebase Database Logging
  updateProfileOnLogin: false, // enable/disable updating of profile on login
  attachAuthIsReady: false
  // profileDecorator: (userData) => ({ email: userData.email }) // customize format of user profile
}

export default { env, firebase, reduxFirebase }
