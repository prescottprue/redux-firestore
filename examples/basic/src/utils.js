import React, { Component } from 'react';
import PropTypes from 'prop-types'

// Create HOC that gets firestore from react context and passes it as a prop
// NOTE: Modified version of withFirestore for a simple example. For a full
// application, use react-redux-firebase's withFirestore: https://goo.gl/4pxmPv
export const withFirestore = (WrappedComponent) => {
  class WithFirestore extends Component {
    static contextTypes = {
      store: PropTypes.object.isRequired
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          dispatch={this.context.store.dispatch}
          firestore={this.context.store.firestore}
        />
      )
    }
  }
  // Note, for full statics support, use hoist-non-react-statics as done
  // in react-redux-firebase's withFirestore: https://goo.gl/4pxmPv
  return WithFirestore
}
