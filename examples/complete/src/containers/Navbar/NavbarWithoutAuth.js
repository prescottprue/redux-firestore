import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import styles from './Navbar.styles'

const useStyles = makeStyles(styles)

function NavbarWithoutAuth({ children, brandPath }) {
  const classes = useStyles()

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar>
        <Typography
          color="inherit"
          variant="h6"
          component={Link}
          to={brandPath || '/'}
          className={classes.brand}
          data-test="brand">
          material example
        </Typography>
        <div className={classes.flex} />
        {children}
      </Toolbar>
    </AppBar>
  )
}

NavbarWithoutAuth.propTypes = {
  children: PropTypes.element
}

export default NavbarWithoutAuth
