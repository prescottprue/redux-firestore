import React from 'react'
import { useParams } from 'react-router-dom'

import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import styles from './ProjectPage.styles'

import ProjectDetails from '../ProjectDetails'
import PopulatedDetails from '../PopulatedDetails'

const useStyles = makeStyles(styles)

function TabPanel(vals) {
  const { children, value, index, ...other } = vals

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`wrapped-tabpanel-${index}`}
      aria-labelledby={`wrapped-tab-${index}`}
      {...other}>
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  )
}

function ProjectPage() {
  const { projectId } = useParams()
  const classes = useStyles()
  const [value, setValue] = React.useState('standard')

  const handleTabChange = (evt, val) => {
    setValue(val)
  }

  return (
    <div className={classes.root}>
      <Card className={classes.card}>
        <CardContent>
          <Tabs value={value} onChange={handleTabChange}>
            <Tab value="standard" label="Standard Query" />
            <Tab value="populated" label="Populated Query" />
          </Tabs>
          <TabPanel value={value} index="standard">
            <ProjectDetails projectId={projectId} />
          </TabPanel>
          <TabPanel value={value} index="populated">
            <PopulatedDetails projectId={projectId} />
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectPage
