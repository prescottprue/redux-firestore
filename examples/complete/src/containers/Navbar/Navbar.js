import React from 'react'
import { Link } from 'react-router-dom'
import Button from '@material-ui/core/Button'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { isLoaded, isEmpty } from 'react-redux-firebase'
import { LIST_PATH, LOGIN_PATH } from 'constants/paths'
import AccountMenu from './AccountMenu'
import NavbarWithoutAuth from './NavbarWithoutAuth'
import styles from './Navbar.styles'

const useStyles = makeStyles(styles)

function Navbar() {
  const classes = useStyles()

  // Get auth from redux state
  const auth = useSelector(state => state.firebase.auth)
  const authExists = isLoaded(auth) && !isEmpty(auth)

  return (
    <NavbarWithoutAuth brandPath={authExists ? LIST_PATH : '/'}>
      {authExists ? (
        <AccountMenu />
      ) : (
        <Button
          className={classes.signIn}
          component={Link}
          to={LOGIN_PATH}
          data-test="sign-in">
          Sign In
        </Button>
      )}
    </NavbarWithoutAuth>
  )
}

export default Navbar
