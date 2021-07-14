
## Use

```javascript
import { createStore, combineReducers, compose } from 'redux';
import { reduxFirestore, firestoreReducer } from 'redux-firestore';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/firestore';

const firebaseConfig = {}; // from Firebase Console
const rfConfig = {}; // optional redux-firestore Config Options

// Initialize firebase instance
firebase.initializeApp(firebaseConfig);
// Initialize Cloud Firestore through Firebase
firebase.firestore();

// Add reduxFirestore store enhancer to store creator
const createStoreWithFirebase = compose(
  reduxFirestore(firebase, rfConfig), // firebase instance as first argument, rfConfig as optional second
)(createStore);

// Add Firebase to reducers
const rootReducer = combineReducers({
  firestore: firestoreReducer,
});

// Create store with reducers and initial state
const initialState = {};
const store = createStoreWithFirebase(rootReducer, initialState);
```

Then pass store to your component's context using [react-redux's `Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store):

```js
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

render(
  <Provider store={store}>
    <MyRootComponent />
  </Provider>,
  rootEl,
);
```

## Components

##### Functional Components

It is common to make react components "functional" meaning that the component is just a function instead of being a `class` which `extends React.Component`. This can be useful, but can limit usage of lifecycle hooks and other features of Component Classes. [`recompose` helps solve this](https://github.com/acdlite/recompose/blob/master/docs/API.md) by providing Higher Order Component functions such as `withContext`, `lifecycle`, and `withHandlers`.

```js
import { connect } from 'react-redux';
import {
  compose,
  withHandlers,
  lifecycle,
  withContext,
  getContext,
} from 'recompose';

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
);

const enhance = compose(
  withStore,
  withHandlers({
    loadData: (props) => () => props.store.firestore.get('todos'),
    onDoneClick: (props) => (key, done = false) =>
      props.store.firestore.update(`todos/${key}`, { done }),
    onNewSubmit: (props) => (newTodo) =>
      props.store.firestore.add('todos', { ...newTodo, owner: 'Anonymous' }),
  }),
  lifecycle({
    componentDidMount(props) {
      props.loadData();
    },
  }),
  connect(({ firebase }) => ({
    // state.firebase
    todos: firebase.ordered.todos,
  })),
);

export default enhance(SomeComponent);
```

For more information [on using recompose visit the docs](https://github.com/acdlite/recompose/blob/master/docs/API.md)

##### Component Class

```js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { watchEvents, unWatchEvents } from './actions/query';
import { getEventsFromInput, createCallable } from './utils';

class Todos extends Component {
  static contextTypes = {
    store: PropTypes.object.isRequired,
  };

  componentDidMount() {
    const { firestore } = this.context.store;
    firestore.get('todos');
  }

  render() {
    return (
      <div>
        {todos.map((todo) => (
          <div key={todo.id}>{JSON.stringify(todo)}</div>
        ))}
      </div>
    );
  }
}

export default connect((state) => ({
  todos: state.firestore.cache.todos.docs,
}))(Todos);
```
