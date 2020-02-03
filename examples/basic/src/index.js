import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ReactReduxFirebaseProvider } from 'react-redux-firebase';
import { createFirestoreInstance } from 'redux-firestore';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import createStore from './createStore';
import Todos from './Todos';
import registerServiceWorker from './registerServiceWorker';
import * as config from './config';

// Initialize Firebase instance
firebase.initializeApp(config.fbConfig)

const styles = {
  fontFamily: 'sans-serif',
  textAlign: 'center',
};

const store = createStore()

function App() {
  return (
    <Provider store={store}>
      <ReactReduxFirebaseProvider
        firebase={firebase}
        config={config.rfConfig}
        dispatch={store.dispatch}
        createFirestoreInstance={createFirestoreInstance}>
          <div style={styles}>
          <h2>Start editing to see some magic happen {'\u2728'}</h2>
          <Todos />
        </div>
      </ReactReduxFirebaseProvider>
    </Provider>
  )
}

render(<App />, document.getElementById('root'));

registerServiceWorker();
