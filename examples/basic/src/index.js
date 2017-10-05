import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import createStore from './createStore';
import Todos from './Todos';
import registerServiceWorker from './registerServiceWorker';

const styles = {
  fontFamily: 'sans-serif',
  textAlign: 'center',
};

const store = createStore({ firebase: {} })

const App = () => (
  <Provider store={store}>
    <div style={styles}>
      <h2>Start editing to see some magic happen {'\u2728'}</h2>
      <Todos />
    </div>
  </Provider>
);

render(<App />, document.getElementById('root'));

registerServiceWorker();
