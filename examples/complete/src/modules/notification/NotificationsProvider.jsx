import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import { SnackbarProvider } from 'notistack'

export const NotificationsContext = React.createContext({
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {}
})

export default function NotificationsProvider({ children }) {
  const notistackRef = React.createRef()
  const onClickDismiss = (key) => () => {
    notistackRef.current.closeSnackbar(key)
  }

  const contextValue = {
    showSuccess: useCallback(
      (message) =>
        notistackRef.current.enqueueSnackbar(message, { variant: 'success' }),
      [notistackRef]
    ),
    showError: useCallback(
      (message) =>
        notistackRef.current.enqueueSnackbar(message, { variant: 'error' }),
      [notistackRef]
    ),
    showWarning: useCallback(
      (message) =>
        notistackRef.current.enqueueSnackbar(message, { variant: 'warning' }),
      [notistackRef]
    )
  }

  return (
    <NotificationsContext.Provider value={contextValue}>
      <SnackbarProvider
        ref={notistackRef}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        action={(key) => (
          <IconButton
            key={`close-${key}`}
            aria-label="Close"
            color="inherit"
            onClick={onClickDismiss(key)}>
            <CloseIcon />
          </IconButton>
        )}>
        {children}
      </SnackbarProvider>
    </NotificationsContext.Provider>
  )
}

NotificationsProvider.propTypes = {
  children: PropTypes.element
}
