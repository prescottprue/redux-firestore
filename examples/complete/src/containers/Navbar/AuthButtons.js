import React from 'react'
import { Link } from 'react-router'
import FlatButton from 'material-ui/FlatButton'
import { LOGIN_PATH, SIGNUP_PATH } from 'constants'
import classes from './Navbar.scss'

const buttonStyle = {
  color: 'white',
  textDecoration: 'none',
  alignSelf: 'center'
}

export const AuthButtons = () => (
  <div className={classes.menu}>
    <Link to={SIGNUP_PATH}>
      <FlatButton label="Sign Up" style={buttonStyle} />
    </Link>
    <Link to={LOGIN_PATH}>
      <FlatButton label="Login" style={buttonStyle} />
    </Link>
  </div>
)

export default AuthButtons
