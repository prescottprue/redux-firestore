import React from 'react'
import Typography from '@material-ui/core/Typography'

import { makeStyles } from '@material-ui/core/styles'
import { useParams } from 'react-router-dom'
import { connect, useSelector } from 'react-redux'
import LoadingSpinner from 'components/LoadingSpinner'
import styles from './PopulatedDetails.styles'

import { firestoreConnect, isLoaded, populate } from 'react-redux-firebase'
import { compose, } from 'recompose'


const useStyles = makeStyles(styles)

function PopulatedDetails() {
  const { projectId } = useParams()
  const classes = useStyles()

  // Get projects from redux state
  const project = useSelector(
    ({
      firestore: {
        data: { projects }
      }
    }) => projects && projects[projectId]
  )

  console.log('PROJECT ', project)

  const creator = useSelector(
    ({
      firestore: {
        data: { users }
      }
    }) => users && users[project.createdBy]
  )

  console.log("CREATOR ", creator)

  // Show loading spinner while project is loading
  if (!isLoaded(project)) {
    return <LoadingSpinner />
  }

  let display =
    creator && creator.displayName && creator.displayName.length ? (
      creator.displayName
    ) : (
      <em>no display name</em>
    )

  return (
    <>
      <Typography className={classes.title} component="h2">
        {(project && project.name) || 'Project'}
      </Typography>
      <Typography className={classes.subtitle}>{projectId}</Typography>
      <Typography className={classes.subtitle}>
        Created by: {display}
      </Typography>
      <div style={{ marginTop: '10rem' }}>
        <pre>{JSON.stringify(project, null, 2)}</pre>
      </div>
    </>
  );
}

const populates = [{ child: 'createdBy', root: 'users' }]
const collection = 'projects'

const withPopulatedProjects = compose(
  firestoreConnect(props => [
    {
      collection,
      populates
    }
  ]),
  connect((state, props) => ({
    projects: populate(state.firestore, collection, populates)
  }))
)

export default withPopulatedProjects(PopulatedDetails)
