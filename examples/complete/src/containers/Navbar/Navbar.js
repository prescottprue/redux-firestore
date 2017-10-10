import React from 'react'
import PropTypes from 'prop-types'
import { compose, withHandlers, withFirebase } from 'recompose'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import AppBar from 'material-ui/AppBar'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import MenuItem from 'material-ui/MenuItem'
import FlatButton from 'material-ui/FlatButton'
import DownArrow from 'material-ui/svg-icons/hardware/keyboard-arrow-down'
import Avatar from 'material-ui/Avatar'
import { withRouter } from 'utils/components'
import { LIST_PATH, ACCOUNT_PATH, LOGIN_PATH, SIGNUP_PATH } from 'constants'
import defaultUserImage from 'static/User.png'
import classes from './Navbar.scss'

const buttonStyle = {
  color: 'white',
  textDecoration: 'none',
  alignSelf: 'center'
}

const avatarStyles = {
  wrapper: { marginTop: 0 },
  button: { marginRight: '.5rem', width: '200px', height: '64px' },
  buttonSm: {
    marginRight: '.5rem',
    width: '30px',
    height: '64px',
    padding: '0'
  }
}

export const Navbar = ({ auth, profile, router, handleLogout }) => {
  const authExists = auth && auth.isLoaded && !auth.isEmpty

  const iconButton = (
    <IconButton style={avatarStyles.button} disableTouchRipple>
      <div className={classes.avatar}>
        <div className="hidden-mobile">
          <Avatar
            src={
              profile && profile.avatarUrl
                ? profile.avatarUrl
                : defaultUserImage
            }
          />
        </div>
        <div className={classes['avatar-text']}>
          <span className={`${classes['avatar-text-name']} hidden-mobile`}>
            {profile && profile.displayName ? profile.displayName : 'User'}
          </span>
          <DownArrow color="white" />
        </div>
      </div>
    </IconButton>
  )

  const mainMenu = (
    <div className={classes.menu}>
      <Link to={SIGNUP_PATH}>
        <FlatButton
          label="Sign Up"
          style={buttonStyle}
        />
      </Link>
      <Link to={LOGIN_PATH}>
        <FlatButton
          label="Login"
          style={buttonStyle}
        />
      </Link>
    </div>
  )

  const rightMenu = authExists ? (
    <IconMenu
      iconButtonElement={iconButton}
      targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      animated={false}
    >
      <MenuItem
        primaryText="Account"
        onTouchTap={() => router.push(ACCOUNT_PATH)}
      />
      <MenuItem
        primaryText="Sign out"
        onTouchTap={handleLogout}
      />
    </IconMenu>
  ) : mainMenu
  return (
    <AppBar
      title={
        <Link to={authExists ? LIST_PATH : '/'} className={classes.brand}>
          complete
        </Link>
      }
      showMenuIconButton={false}
      iconElementRight={rightMenu}
      iconStyleRight={authExists ? avatarStyles.wrapper : {}}
      className={classes.appBar}
    />
  )
}

Navbar.propTypes = {
  auth: PropTypes.object, // from connect
  handleLogout: PropTypes.func // from withHandlers
}

export default compose(
  // withFirebase, // add props.firebase from react-redux-firebase
  withRouter, // add props.router
  withHandlers({
    handleLogout: props => () => {
      props.firebase.logout()
      props.router.push('/')
    }
  }),
  connect(({ firebase: { auth, profile } }) => ({
    auth,
    profile
  }))
)(Navbar)
