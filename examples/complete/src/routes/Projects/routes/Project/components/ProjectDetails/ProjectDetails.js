import React from 'react'
import Typography from '@material-ui/core/Typography'

import { makeStyles } from '@material-ui/core/styles'
import { useParams } from 'react-router-dom'
import { useFirestoreConnect, isLoaded } from 'react-redux-firebase'
import { useSelector } from 'react-redux'
import LoadingSpinner from 'components/LoadingSpinner'
import styles from './ProjectDetails.styles'

const useStyles = makeStyles(styles)

function ProjectDetails() {
  const { projectId } = useParams()
  const classes = useStyles()

  console.log("projectId is", projectId)
  
  // Create listener for projects
  useFirestoreConnect([{ collection: 'projects', doc: projectId }])

  // Get projects from redux state
  const project = useSelector(
    ({
      firestore: {
        data: { projects }
      },
    }) => projects && projects[projectId]
  )

  // Show loading spinner while project is loading
  if (!isLoaded(project)) {
    return <LoadingSpinner />
  }

  return (
    <>
      <Typography className={classes.title} component="h2">
        {(project && project.name) || 'Project'}
      </Typography>
      <Typography className={classes.subtitle}>{projectId}</Typography>
      <div style={{ marginTop: '10rem' }}>
        <pre>{JSON.stringify(project, null, 2)}</pre>
      </div>
    </>
  )
}

export default ProjectDetails
