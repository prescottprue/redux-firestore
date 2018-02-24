import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import { withContext, getContext, withHandlers, lifecycle } from 'recompose'
import { connect } from 'react-redux';
import Todo from './Todo';
import NewTodo from './NewTodo';

const Todos = ({ todos, onNewSubmit, onDoneClick }) => (
  <div>
    <NewTodo onNewSubmit={onNewSubmit} />
    {
      todos
      ?
        todos.map((todo, i) => (
          <Todo
            key={`${todo.key}-${i}`}
            text={todo.text}
            owner={todo.owner}
            done={todo.done}
            onDoneClick={() => onDoneClick(todo.key, !todo.done)}
          />
        ))
      :
        <span>Loading</span>
    }
  </div>
)

Todos.propTypes = {
  todos: PropTypes.array,
  onNewSubmit: PropTypes.func,
  onDoneClick: PropTypes.func,
  store: PropTypes.shape({
    firestore: PropTypes.object
  })
}

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

export default compose(
  withStore,
  withHandlers({
    loadData: props => err =>
      props.store.firestore.get('todos/tzDlkfQ6m2gNMVZc5iYx'),
    onDoneClick: props => (key, done = false) =>
      props.store.firestore.update('todos', key, { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  lifecycle({
    componentWillMount() {
      this.props.loadData()
    }
  }),
  connect(({ firebase }) => ({ // state.firebase
    todos: firebase.ordered.todos
  }))
)(Todos)
