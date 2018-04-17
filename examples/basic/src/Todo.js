import React from 'react';
import PropTypes from 'prop-types'
import { compose, flattenProp, withHandlers, pure } from 'recompose'
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

const Todo = ({
  text,
  owner,
  done,
  disabled,
  onDoneClick
}) => (
  <div style={styles.container}>
    <input
      checked={done}
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
  firestore: PropTypes.shape({
    update: PropTypes.func.isRequired
  })
}

const enhance = compose(
  // Add props.firestore
  withFirestore,
  // Flatten todo prop (creates id, text, owner, done and disabled props)
  flattenProp('todo'),
  // Handlers as props
  withHandlers({
    onDoneClick: props => () => {
      return props.firestore.update(`todos/${props.id}`, { done: !props.done })
    }
  }),
  // Prevent unnessesary re-renders by doing shallow comparison of props
  pure
)

export default enhance(Todo)
