import { useContext } from 'react'
import { NotificationsContext } from './NotificationsProvider'

/**
 * Hook for loading notifications context
 * @returns {Object} Notifications context
 * @example
 * import React from 'react'
 * import { useNotifications } from 'modules/notification'
 *
 * function SomeComponent() {
 *   const { showError } = useNotifications()
 *   return (
 *     <button onClick={() => showError('Test Error')}>
 *       Test Error Notification
 *     </button>
 *   )
 * }
 */
export default function useNotifications() {
  return useContext(NotificationsContext)
}
