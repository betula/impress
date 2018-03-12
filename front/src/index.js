import React from 'react'
import ReactDom from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import Helmet from 'react-helmet'
import { injectGlobal } from 'styled-components'
import { normalize } from 'styled-normalize'

import { Routes } from './routes'
import { globalStyles } from './ui/theme'
import { configureStore } from './store'


const rootElement = document.getElementById('root');
const store = configureStore(window.initialStore || {});

injectGlobal`${normalize} ${globalStyles}`;

const render = () => {
  ReactDom.render(
    (
      <ReduxProvider store={store}>
        <BrowserRouter>
          <React.Fragment>
            <Helmet
              titleTemplate="%s • Sonata"
            />
            <Routes />
          </React.Fragment>
        </BrowserRouter>
      </ReduxProvider>
    ),
    rootElement,
  )
};

render();
