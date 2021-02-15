import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import firebase from 'firebase/app'
import { ReactReduxFirebaseProvider } from 'react-redux-firebase'
import { createFirestoreInstance } from 'redux-firestore'
import NotificationsProvider from 'modules/notification/NotificationsProvider'
import ThemeProvider from 'modules/theme/ThemeProvider'
import { defaultRRFConfig } from './defaultConfig'
import initializeFirebase from './initializeFirebase'

initializeFirebase()

function App({ routes, store }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <NotificationsProvider>
          <ReactReduxFirebaseProvider
            firebase={firebase}
            config={defaultRRFConfig}
            dispatch={store.dispatch}
            createFirestoreInstance={createFirestoreInstance}>
            <Router>{routes}</Router>
          </ReactReduxFirebaseProvider>
        </NotificationsProvider>
      </Provider>
    </ThemeProvider>
  )
}

App.propTypes = {
  routes: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

export default App
