import React from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import ProjectRoute from 'routes/Projects/routes/Project'
import { renderChildren } from 'utils/router'
import ProjectsList from '../ProjectsList'

function ProjectsPage({ match }) {
  return (
    <Switch>
      {/* Child routes */}
      {renderChildren([ProjectRoute], match)}
      {/* Main Route */}
      <Route exact path={match.path} render={() => <ProjectsList />} />
    </Switch>
  )
}

ProjectsPage.propTypes = {
  match: PropTypes.object.isRequired // from enhancer (withRouter)
}

export default ProjectsPage
