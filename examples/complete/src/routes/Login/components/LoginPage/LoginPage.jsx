import React from 'react'
import { Link } from 'react-router-dom'
import { useFirebase } from 'react-redux-firebase'
import Paper from '@material-ui/core/Paper'
import { makeStyles } from '@material-ui/core/styles'
import GoogleButton from 'react-google-button'
import { SIGNUP_PATH } from 'constants/paths'
import { useNotifications } from 'modules/notification'
import LoginForm from '../LoginForm'
import styles from './LoginPage.styles'

const useStyles = makeStyles(styles)

function LoginPage() {
  const classes = useStyles()
  const firebase = useFirebase()
  const { showError } = useNotifications()

  function onSubmitFail(formErrs, dispatch, err) {
    return showError(formErrs ? 'Form Invalid' : err.message || 'Error')
  }

  function googleLogin() {
    return firebase
      .login({ provider: 'google', type: 'popup' })
      .catch((err) => showError(err.message))
  }

  function emailLogin(creds) {
    return firebase.login(creds).catch((err) => showError(err.message))
  }

  return (
    <div className={classes.root}>
      <Paper className={classes.panel}>
        <LoginForm onSubmit={emailLogin} onSubmitFail={onSubmitFail} />
      </Paper>
      <div className={classes.orLabel}>or</div>
      <div className={classes.providers}>
        <GoogleButton onClick={googleLogin} data-test="google-auth-button" />
      </div>
      <div className={classes.signup}>
        <span className={classes.signupLabel}>Need an account?</span>
        <Link className={classes.signupLink} to={SIGNUP_PATH}>
          Sign Up
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
