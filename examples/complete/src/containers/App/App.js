import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ReactReduxFirebaseProvider } from 'react-redux-firebase'
import { createFirestoreInstance } from 'redux-firestore'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/firestore'
import 'firebase/performance'
import ThemeSettings from 'theme'
import { defaultRRFConfig } from 'defaultConfig'
import * as config from 'config'

const theme = createMuiTheme(ThemeSettings)

// Initialize Firebase instance
firebase.initializeApp(config.firebase)
// Combine default and environment specific configs for react-redux-firebase
const rrfConfig = {
  ...defaultRRFConfig,
  ...(config.reduxFirebase || {})
}

function App({ routes, store }) {
  return (
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
        <ReactReduxFirebaseProvider
          firebase={firebase}
          config={rrfConfig}
          dispatch={store.dispatch}
          createFirestoreInstance={createFirestoreInstance}>
          <Router>{routes}</Router>
        </ReactReduxFirebaseProvider>
      </Provider>
    </MuiThemeProvider>
  )
}

App.propTypes = {
  routes: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

export default App
