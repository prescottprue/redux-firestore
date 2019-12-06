import React, { useState } from 'react'
import { useFirebase } from 'react-redux-firebase'
import { useHistory } from 'react-router-dom'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import AccountCircle from '@material-ui/icons/AccountCircle'
import { makeStyles } from '@material-ui/core/styles'
import { ACCOUNT_PATH } from 'constants/paths'

const useStyles = makeStyles(() => ({
  buttonRoot: {
    color: 'white'
  }
}))

function AccountMenu() {
  const classes = useStyles()
  const [anchorEl, setMenu] = useState(null)
  const history = useHistory()
  const firebase = useFirebase()

  function closeAccountMenu(e) {
    setMenu(null)
  }
  function handleMenu(e) {
    setMenu(e.target)
  }
  function handleLogout() {
    closeAccountMenu()
    // redirect to '/' handled by UserIsAuthenticated HOC
    return firebase.logout()
  }
  function goToAccount() {
    closeAccountMenu()
    history.push(ACCOUNT_PATH)
  }

  return (
    <>
      <IconButton
        aria-owns={anchorEl ? 'menu-appbar' : null}
        aria-haspopup="true"
        onClick={handleMenu}
        classes={{ root: classes.buttonRoot }}>
        <AccountCircle />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={Boolean(anchorEl)}
        onClose={closeAccountMenu}>
        <MenuItem onClick={goToAccount}>Account</MenuItem>
        <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
      </Menu>
    </>
  )
}

export default AccountMenu
