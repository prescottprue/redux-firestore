import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import LightThemeIcon from '@material-ui/icons/BrightnessHigh'
import DarkThemeIcon from '@material-ui/icons/Brightness4'
import { makeStyles } from '@material-ui/core/styles'
import { ThemeContext } from 'modules/theme'
import styles from './Navbar.styles'

const useStyles = makeStyles(styles)

function NavbarWithoutAuth({ children, brandPath = '/' }) {
  const classes = useStyles()
  const { toggleDarkMode, isDarkMode } = useContext(ThemeContext)

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Typography
          color="inherit"
          variant="h6"
          component={Link}
          to={brandPath}
          className={classes.brand}
          data-test="brand">
          Complete
        </Typography>
        <div className={classes.flex} />
        <Tooltip title="Toggle light/dark theme">
          <IconButton
            onClick={toggleDarkMode}
            className={classes.themeModeButton}>
            {isDarkMode ? <LightThemeIcon /> : <DarkThemeIcon />}
          </IconButton>
        </Tooltip>
        {children}
      </Toolbar>
    </AppBar>
  )
}

NavbarWithoutAuth.propTypes = {
  children: PropTypes.element,
  brandPath: PropTypes.string
}

export default NavbarWithoutAuth
