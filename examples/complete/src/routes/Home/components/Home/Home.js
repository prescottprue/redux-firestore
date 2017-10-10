import React from 'react'
import Theme from 'theme'
import { connect } from 'react-redux'
import { compose, lifecycle, withHandlers } from 'recompose'
import { withStore } from 'utils/components'
import classes from './Home.scss'
const authWrapperUrl = 'https://github.com/mjrussell/redux-auth-wrapper'
const reactRouterUrl = 'https://github.com/ReactTraining/react-router'

export const Home = ({ todos }) => (
  <div
    className={classes.container}
    style={{ color: Theme.palette.primary2Color }}>
    <div className="flex-row-center">
      <h2>Home Route</h2>
    </div>
    <div>
      {
        todos.map((todo, i) => (
          <div key={`${todo.id}-${i}`}>
            {JSON.stringify(todo)}
          </div>
        ))
      }
    </div>
  </div>
)

export default compose(
  withStore,
  withHandlers({
    loadCollection: props => props.store.firestore.get,
    onDoneClick: props => (key, done = false) =>
      props.store.firestore.update('todos', key, { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' })
  }),
  lifecycle({
    componentWillMount() {
      this.props.loadCollection('todos')
    }
  }),
  connect(({ firestore }) => ({
    todos: firestore.ordered.todos || [],
    uid: firestore.profile.uid
  }))
)(Home)
