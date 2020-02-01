import React from 'react'
import { useSelector } from 'react-redux'
import Snackbar from '@material-ui/core/Snackbar'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import { makeStyles } from '@material-ui/core/styles'
import useNotifications from '../useNotifications'

const useStyles = makeStyles(() => ({
  buttonRoot: {
    color: 'white'
  }
}))

function Notifications() {
  const classes = useStyles()
  const { allIds, byId } = useSelector(({ notifications }) => notifications)
  const { dismissNotification } = useNotifications()

  // Only render if notifications exist
  if (!allIds || !Object.keys(allIds).length) {
    return null
  }

  return (
    <div>
      {allIds.map(id => {
        function dismissCurrentNotification() {
          dismissNotification(id)
        }
        return (
          <Snackbar
            key={id}
            open
            action={
              <IconButton
                onClick={dismissCurrentNotification}
                classes={{ root: classes.buttonRoot }}>
                <CloseIcon />
              </IconButton>
            }
            message={byId[id].message}
          />
        )
      })}
    </div>
  )
}

export default Notifications
