import React, { useState, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import CssBaseline from '@material-ui/core/CssBaseline'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import ThemeSettings from '../../theme'
import ThemeContext from './ThemeContext'

export default function ThemeProvider({ children }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const [isDarkMode, changeIsDarkMode] = useState(false)

  useEffect(() => {
    changeIsDarkMode(prefersDarkMode)
  }, [prefersDarkMode])

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        ...ThemeSettings,
        palette: {
          ...ThemeSettings.palette,
          type: isDarkMode ? 'dark' : 'light'
        }
      }),
    [isDarkMode]
  )

  const contextValue = {
    isDarkMode,
    toggleDarkMode: useCallback(() => changeIsDarkMode(!isDarkMode), [
      changeIsDarkMode,
      isDarkMode
    ])
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
        <CssBaseline />
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

ThemeProvider.propTypes = {
  children: PropTypes.element
}
