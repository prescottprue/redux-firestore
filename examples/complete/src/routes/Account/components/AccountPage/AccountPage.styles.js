export default (theme) => ({
  root: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    overflowY: 'scroll'
  },
  gridItem: {
    textAlign: 'center',
    marginTop: theme.spacing(5)
  },
  pane: {
    ...theme.flexColumnCenter,
    justifyContent: 'space-around',
    padding: theme.spacing(6)
  }
})
