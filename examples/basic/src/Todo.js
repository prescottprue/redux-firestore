import React from 'react';
import PropTypes from 'prop-types'
import { compose, flattenProp, withHandlers } from 'recompose'
import { withStore } from './utils';

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

const Todo = ({
  text,
  owner,
  done,
  disabled,
  onDoneClick
}) => (
  <div style={styles.container}>
    <input
      value={done}
      onChange={onDoneClick}
      disabled={disabled}
      type="checkbox"
    />
    <div style={styles.meta}>
      <span>{text}</span>
      <span style={styles.owner}>{owner}</span>
    </div>
  </div>
);

Todo.propTypes = {
  text: PropTypes.string, // from enhancer (flattenProp)
  owner: PropTypes.string, // from enhancer (flattenProp)
  done: PropTypes.bool, // from enhancer (flattenProp)
  disabled: PropTypes.bool, // from enhancer (flattenProp)
  onDoneClick: PropTypes.func.isRequired, // from enhancer (withHandlers)
  store: PropTypes.shape({
    firestore: PropTypes.object
  })
}

const enhance = compose(
  // Add props.firestore
  withStore,
  // Flatten todo (creates props.text, props.owner, props.isDone )
  flattenProp('todo'),
  // Handler functions as props
  withHandlers({
    onDoneClick: props => () =>
      props.store.firestore.update(`todos/${props.todo.id}`, { done: !props.done })
  })
)

export default enhance(Todo)
