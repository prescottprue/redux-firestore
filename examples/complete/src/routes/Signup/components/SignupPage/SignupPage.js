import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import GoogleButton from 'react-google-button'
import Paper from 'material-ui/Paper'
import { withHandlers, pure, compose } from 'recompose'
import { withNotifications, withFirestore } from 'utils/components'
import { LOGIN_PATH } from 'constants'
import SignupForm from '../SignupForm'

import classes from './SignupPage.scss'

export const SignupPage = ({ emailSignup, googleLogin, onSubmitFail }) => (
  <div className={classes.container}>
    <Paper className={classes.panel}>
      <SignupForm onSubmit={emailSignup} onSubmitFail={onSubmitFail} />
    </Paper>
    <div className={classes.or}>or</div>
    <div className={classes.providers}>
      <GoogleButton onClick={googleLogin} />
    </div>
    <div className={classes.login}>
      <span className={classes.loginLabel}>Already have an account?</span>
      <Link className={classes.loginLink} to={LOGIN_PATH}>
        Login
      </Link>
    </div>
  </div>
)

SignupPage.propTypes = {
  firestore: PropTypes.shape({
    // eslint-disable-line react/no-unused-prop-types
    login: PropTypes.func.isRequired,
    createUser: PropTypes.func.isRequired
  }),
  emailSignup: PropTypes.func,
  onSubmitFail: PropTypes.func,
  googleLogin: PropTypes.func
}

export default compose(
  // UserIsNotAuthenticated, // redirect to list page if logged in
  // withFirestore,
  pure,
  withNotifications, // add props.showError
  withHandlers({
    onSubmitFail: props => (formErrs, dispatch, err) =>
      props.showError(formErrs ? 'Form Invalid' : err.message || 'Error'),
    googleLogin: ({ firestore, showError }) => e =>
      firestore
        .login({ provider: 'google', type: 'popup' })
        .catch(err => showError(err.message)),
    emailSignup: ({ firestore }) => creds =>
      firestore.createUser(creds, {
        // email signup
        email: creds.email,
        username: creds.username
      })
  })
)(SignupPage)
