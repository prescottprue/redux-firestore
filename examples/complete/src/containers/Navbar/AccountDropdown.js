import React, { Component } from 'react'
import PropTypes from 'prop-types'
import IconButton from 'material-ui/IconButton'
import Avatar from 'material-ui/Avatar'
import defaultUserImage from 'static/User.png'
import { compose, onlyUpdateForKeys, toClass } from 'recompose'
import DownArrow from 'material-ui-icons/KeyboardArrowDown'
import classes from './Navbar.scss'

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

// export const AccountDropdown = ({ avatarUrl, displayName }) => (
//   <IconButton style={avatarStyles.button} disableTouchRipple>
//     <div className={classes.avatar}>
//       <div className="hidden-mobile">
//         <Avatar src={avatarUrl || defaultUserImage} />
//       </div>
//       <div className={classes['avatar-text']}>
//         <span className={`${classes['avatar-text-name']} hidden-mobile`}>
//           {displayName || 'User'}
//         </span>
//         <DownArrow color="white" />
//       </div>
//     </div>
//   </IconButton>
// )

class AccountDropdown extends Component {
  render() {
    const { avatarUrl, displayName } = this.props
    return (
      // <IconButton style={avatarStyles.button} disableTouchRipple>
      <div className={classes.avatar}>
        <div className="hidden-mobile">
          <Avatar src={avatarUrl || defaultUserImage} />
        </div>
        <div className={classes['avatar-text']}>
          <span className={`${classes['avatar-text-name']} hidden-mobile`}>
            {displayName || 'User'}
          </span>
          <DownArrow color="white" />
        </div>
      </div>
      // </IconButton>
    )
  }
}

AccountDropdown.propTypes = {
  avatarUrl: PropTypes.string,
  displayName: PropTypes.string
}

export default AccountDropdown
