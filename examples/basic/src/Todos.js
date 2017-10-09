import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import { withContext, getContext, withHandlers, lifecycle } from 'recompose'
import { connect } from 'react-redux';
import Todo from './Todo';
import NewTodo from './NewTodo';

const Todos = ({ todos, uid, onNewSubmit, onDoneClick, store: { firestore } }) => (
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
            disabled={todo.owner !== uid}
            onDoneClick={() => onDoneClick(todo.key, !todo.done)}
          />
        ))
      :
        <span>Loading</span>
    }
  </div>
);

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

export default compose(
  withStore,
  withHandlers({
    loadData: props => err => props.store.firestore.get('todos'),
    onDoneClick: props => (key, done = false) =>
      props.store.firestore.update('todos', key, { done }),
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  lifecycle({
    componentWillMount() {
      console.log('props', this.props)
      this.props.loadData()
    }
  }),
  connect(({ firebase }) => ({ // state.firebase
    // ImmutableJS map (for plain js checkout v2)
    todos: firebase.ordered.todos,
    uid: firebase.profile.uid
  }))
)(Todos)
