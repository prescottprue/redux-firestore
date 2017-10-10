import React from 'react'
import PropTypes from 'prop-types'
import { pure, compose, branch, renderComponent, toClass } from 'recompose'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import IconButton from 'material-ui/IconButton'
import { ACCOUNT_PATH } from 'constants'
import { withRouter } from 'utils/components'
import AuthButtons from './AuthButtons'
import AccountDropdown from './AccountDropdown'

export const AccountMenu = ({ account, router, onLogoutClick }) => (
  <IconMenu
    iconButtonElement={
      <IconButton>
        <AccountDropdown
          displayName={account.displayName}
          avatarUrl={account.avatarUrl}
        />
      </IconButton>
    }
    targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
    animated={false}>
    <MenuItem
      primaryText="Account"
      onTouchTap={() => router.push(ACCOUNT_PATH)}
    />
    <MenuItem primaryText="Sign out" onTouchTap={onLogoutClick} />
  </IconMenu>
)

AccountMenu.propTypes = {
  account: PropTypes.shape({
    displayName: PropTypes.string,
    avatarUrl: PropTypes.string
  }),
  onLogoutClick: PropTypes.func,
  authExists: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
  router: PropTypes.shape({
    push: PropTypes.func // from withRouter
  })
}

AccountMenu.defaultProps = {
  account: {},
  authExists: false
}

export default compose(
  withRouter,
  // pure,
  // branch(props => !props.authExists, renderComponent(AuthButtons)), // render buttons if auth does not exist
  toClass
)(AccountMenu)
