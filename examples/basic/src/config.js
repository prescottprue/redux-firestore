export const fbConfig = {
  apiKey: 'AIzaSyCTUERDM-Pchn_UDTsfhVPiwM4TtNIxots',
  authDomain: 'redux-firebasev3.firebaseapp.com',
  databaseURL: 'https://redux-firebasev3.firebaseio.com',
  storageBucket: 'redux-firebasev3.appspot.com',
  messagingSenderId: '823357791673',
  projectId: 'redux-firebasev3',
}

export const rfConfig = {
  userProfile: 'users', // root that user profiles are written to
  useFirestoreForProfile: true, // Save profile to Firestore instead of Real Time Database
  useFirestoreForStorageMeta: true // Metadata associated with storage file uploads goes to Firestore
}
