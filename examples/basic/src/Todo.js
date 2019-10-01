import React from 'react';
import PropTypes from 'prop-types'
import { withFirestore } from './utils';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem',
    border: '1px solid grey'
  },
  owner: {
    fontSize: '.6rem'
  },
  meta: {
    display: 'flex',
    flexDirection: 'column'
  }
}

function Todo({ todo, firestore }) {
  function onDoneClick() {
    return firestore.update(`todos/${todo.id}`, { done: !todo.done })
  }
  return (
    <div style={styles.container}>
      <input
        checked={todo.done}
        onChange={onDoneClick}
        disabled={todo.disabled}
        type="checkbox"
      />
      <div style={styles.meta}>
        <span>{todo.text}</span>
        <span style={styles.owner}>{todo.owner}</span>
      </div>
    </div>
  );
}

Todo.propTypes = {
  todo: PropTypes.shape({
    text: PropTypes.string,
    owner: PropTypes.string,
    done: PropTypes.bool,
    disabled: PropTypes.bool,
  }),
  firestore: PropTypes.shape({
    update: PropTypes.func.isRequired
  })
}

export default withFirestore(Todo)
