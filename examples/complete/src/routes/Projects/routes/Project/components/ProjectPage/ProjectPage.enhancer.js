import PropTypes from 'prop-types'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { firestoreConnect } from 'react-redux-firebase'
import { withStyles } from '@material-ui/core/styles'
import { withRouter } from 'react-router-dom'
import { setPropTypes, setDisplayName, withProps } from 'recompose'
import { spinnerWhileLoading } from 'utils/components'
import { UserIsAuthenticated } from 'utils/router'
import styles from './ProjectPage.styles'

export default compose(
  // Set component display name (more clear in dev/error tools)
  setDisplayName('EnhancedProjectPage'),
  // Redirect to /login if user is not logged in
  UserIsAuthenticated,
  // Add props.match
  withRouter,
  // Set proptypes of props used in HOCs
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        projectId: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }),
  withProps(({ match: { params: { projectId } } }) => ({
    projectId
  })),
  // Create listeners based on current users UID
  firestoreConnect(({ projectId }) => [
    // Listener for projects the current user created
    {
      collection: 'projects',
      doc: projectId
    }
  ]),
  // Map projects from state to props
  connect(({ firestore: { data } }, { projectId }) => ({
    project: get(data, `projects.${projectId}`)
  })),
  // Show loading spinner while project is loading
  spinnerWhileLoading(['project']),
  // Add styles as props.classes
  withStyles(styles)
)
