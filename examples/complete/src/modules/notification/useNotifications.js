import { useMemo } from 'react'
import { bindActionCreators } from 'redux'
import { useDispatch } from 'react-redux'
import * as actions from './actions'

/**
 * React hook for access to notifications. Returns
 * showSuccess, showError and showMessage
 * @returns {object} Notification actions
 */
export default function useNotifications() {
  const dispatch = useDispatch()
  return useMemo(() => {
    return bindActionCreators(actions, dispatch)
  }, [dispatch])
}
