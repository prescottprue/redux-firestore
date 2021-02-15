import React from 'react'
import PropTypes from 'prop-types'
import Navbar from 'components/Navbar'

function CoreLayout({ children }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  )
}

CoreLayout.propTypes = {
  children: PropTypes.element.isRequired
}

export default CoreLayout
