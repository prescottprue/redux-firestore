export default (theme) => ({
  flex: {
    flexGrow: 1
  },
  appBar: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.background.default
        : theme.palette.primary1Color
  },
  accountButton: {
    color: 'white'
  },
  themeModeButton: {
    color: 'white'
  },
  signIn: {
    color: 'white',
    textDecoration: 'none',
    alignSelf: 'center'
  }
})
