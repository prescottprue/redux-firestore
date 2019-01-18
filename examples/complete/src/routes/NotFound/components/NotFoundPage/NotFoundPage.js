import React from 'react'
import PropTypes from 'prop-types'

const NotFoundPage = ({ classes }) => (
  <div className={classes.root}>
    <h1>Whoops! 404!</h1>
    <p>This page was not found.</p>
  </div>
)

NotFoundPage.propTypes = {
  classes: PropTypes.object // from enhancer (withStyles)
}

export default NotFoundPage
