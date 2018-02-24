import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import {
  withContext,
  getContext,
  withHandlers,
  lifecycle,
} from 'recompose'
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
            key={`${todo.id}-${i}`}
            text={todo.text}
            owner={todo.owner}
            done={todo.done}
            onDoneClick={() => onDoneClick(todo.id, !todo.done)}
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

// Create HOC that gets firestore from react context and passes it as a prop
const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object })
)

// Create HOC that loads data and adds it as todos prop
const enhance = compose(
  // add redux store (from react context) as a prop
  withStore,
  // Handler functions as props
  withHandlers({
    loadData: props => err => props.store.firestore.get('todos'),
    onDoneClick: props => (docId, done = false) =>
      props.store.firestore.update(`todos/${docId}` { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  // Run functionality on component lifecycle
  lifecycle({
    // Load data when component mounts
    componentWillMount() {
      this.props.loadData()
    }
  }),
  // Connect todos from redux state to props.todos
  connect(({ firestore }) => ({ // state.firestore
    todos: firestore.ordered.todos, // document data in array
    // todos: firestore.data.todos, // document data by id
  }))
)

export default enhance(Todos)
