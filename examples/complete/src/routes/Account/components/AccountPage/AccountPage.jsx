import React from 'react'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import AccountEditor from '../AccountEditor'
import styles from './AccountPage.styles'

const useStyles = makeStyles(styles)

function AccountPage() {
  const classes = useStyles()

  return (
    <Grid container className={classes.root} justify="center">
      <Grid item xs={10} md={8} lg={6} className={classes.gridItem}>
        <Paper className={classes.pane}>
          <Typography variant="h4">Account</Typography>
          <AccountEditor />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default AccountPage
