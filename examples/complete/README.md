# complete

[![License][license-image]][license-url]
[![Code Style][code-style-image]][code-style-url]

## Table of Contents

1. [Requirements](#requirements)
1. [Getting Started](#getting-started)
1. [Understanding the Code](#understanding-the-code)
1. [Beyond Getting Started](#beyond-getting-started)
1. [Config Files](#config-files)
1. [Application Structure](#application-structure)
1. [Routing](#routing)
1. [Frequently Asked Questions (FAQ)](#faq)

## Requirements

* node `^8`
* npm `^3.0.0`

## Getting Started

The following will take 10-20 minutes to complete.

1. Clone the repository: ```git clone https://github.com/prescottprue/redux-firestore```
1. Go into the working directory for this example: ```cd redux-firestore/example/complete```
1. Fetch the required npm modules (identified in _package.json_): ```npm install```
1. In Firebase console, create new project -- for example: _redux-firestore-complete_
   1. choose default values, nothing special
   1. add a _web_ app -- for example: _rfc-web_
   1. copy Firebase SDK's _firebaseConfig_ settings to your clipboard
1. Edit **config.js**
   1. Paste (overwrite) the values inside the braces of ```export const firebase { ... }``` with the values from your web app's Firestore SDK settings (previous step).
   1. Save the file.
1. In Firebase console for your project, go to Authentication (left sidebar)
   1. Click the _Sign-in method_ tab
   1. Enable "Email/Password" (you can keep _Email link_ disabled if you want)
   1. Click the _Users_ tab
   1. Click the  **Add user** button
   1. Enter values that you'll use to authenticate.  The email address does not need to be a real one, though it should be realistic.  I used:
      * email: **bob@test.com**
      * password: **pwd123**
    1. Click **Add user** to save your new user
1. In Firebase console for your project, go to Database (left sidebar)
   1. For Cloud Firestore, click **Create database**
      * _Note_: the UI for Firebase console continues to evolve.  You want to create a _Firestore_ database here, and not a realtime-database.
   1. Select _Start in test mode_ and click **Next**
   1. Chooose a location (I went with the default for me -- _nam5 (us-central)_), and click **Next**
1. In the Firebase console, you should now be back at the Database page and see an empty database with _+ Start collection_ as an option
1. In your development environment (your computer), start the app with: ```npm start```
   * I typically do this from the terminal within my VS Code editor.  To start the terminal, I use ```ctrl+` ```
1. In a browser window (usually one is auto-launched with _npm start_), go to your app.
   * The default URL is http://localhost:3000/.
   1. **Login and update your account**
      1. You should see a page with the title "Home Route".
      1. Click _Sign In_ (top-right corner of the page)
      1. Log in with the email & password for the user created above
      1. You should see an "Account" page.  Feel free to update your account information.  I used:
         * Display Name: **Bobby McBobface**
         * Email: **bob@test.com**
         * Avatar Url: **https://randomuser.me/api/portraits/men/42.jpg**
      1. Click **Save**
   1. **Add a new Project**
      1. Click the _Complete_ title in the top-left corner of the page.  This takes you to the _/projects_ page.
      1. Click the **+** card in the middle of the page.
      1. In the _New Project_ dialog, enter a name and click    **CREATE**
1. In the Firebase console, in the Database page you should now see data in your database -- if not, refresh the page by clicking to another page (e.g. click _Authentication_) and then return to _Database_ ... or simply refresh your browser.
   * You should now see two collections listed: _projects_ and _users_.

## Understanding the code

This example project gives an understanding of many aspects of redux-firestore.  Using your favorite editor (e.g. VS Code) browse the codebase looking at how it leverages redux-firestore.

One clear example is in the code for ```ProjectPage``` and its components ```ProjectDetails``` and ```PopulateDetails```.

### ProjectDetails

This component shows how to use ```useFirestoreConnect()```, ```isLoaded()``` and ```useSelector()``` to set a Redux listener to a specific query and display the results.

The query in particular is:
```[{ collection: 'projects', doc: projectId }]```, meaning we are pulling the document from the _projects_ collection whose ID is the value ```projectId```.  The value of ```projectId``` is passed down to the component from its parent, ```ProjectPage.js``` who in turn gets the value from its associated route defined in ```examples/complete/src/routes/Projects/routes/Project/index.js```

### PopulatedDetails

This component shows how to use ```firestoreConnect()``` and the ```populate()``` method.  The same _projects_ document is retrieved as in the ProjectDetails case (above); additionally the _users_ record is fetched for the associated user who created the given project.

## Beyond Getting Started

While developing, you will probably rely mostly on `npm start`; however, there are additional scripts at your disposal:

|`npm run <script>`    |Description|
|-------------------|-----------|
|`start`            |Serves your app at `localhost:3000` with automatic refreshing and hot module replacement|
|`start:dist`       |Builds the application to `./dist` then serves at `localhost:3000` using `firebase serve`|
|`build`            |Builds the application to `./dist`|
|`lint`             |[Lints](http://stackoverflow.com/questions/8503559/what-is-linting) the project for potential errors|
|`lint:fix`         |Lints the project and [fixes all correctable errors](http://eslint.org/docs/user-guide/command-line-interface.html#fix)|

[Husky](https://github.com/typicode/husky) is used to enable `prepush` hook capability. The `prepush` script currently runs `eslint`, which will keep you from pushing if there is any lint within your code. If you would like to disable this, remove the `prepush` script from the `package.json`.

## Config Files

There are multiple configuration files:

* Firebase Project Configuration (including settings for how `src/config.js` is built on CI) - `.firebaserc`
* Project Configuration used within source (can change based on environment variables on CI) - `src/config.js`
* Cloud Functions Local Configuration - `functions/.runtimeconfig.json`

More details in the [Application Structure Section](#application-structure)

## Application Structure

The application structure presented in this boilerplate is **fractal**, where functionality is grouped primarily by feature rather than file type. Please note, however, that this structure is only meant to serve as a guide, it is by no means prescriptive. That said, it aims to represent generally accepted guidelines and patterns for building scalable applications.

```
├── public                   # All build-related configuration
│   ├── index.html           # Main HTML page container for app
│   ├── scripts              # Scripts used within the building process
│   │  └── compile.js        # Custom Compiler that calls Webpack compiler
│   │  └── start.js          # Starts the custom compiler
├── src                      # Application source code
│   ├── config.js            # Environment specific config file with settings from Firebase (created by CI)
│   ├── components           # Global Reusable Presentational Components
│   ├── constants            # Project constants such as firebase paths and form names
│   │  ├── formNames.js      # Names of redux forms
│   │  └── paths.js          # Paths for application routes
│   ├── containers           # Global Reusable Container Components (connected to redux state)
│   ├── layouts              # Components that dictate major page structure
│   │   └── CoreLayout       # Global application layout in which to render routes
│   ├── routes               # Main route definitions and async split points
│   │   ├── index.js         # Bootstrap main application routes
│   │   └── Home             # Fractal route
│   │       ├── index.js     # Route definitions and async split points
│   │       ├── assets       # Assets required to render components
│   │       ├── components   # Presentational React Components (state connect and handler logic in enhancers)
│   │       ├── modules      # Collections of reducers/constants/actions
│   │       └── routes/**    # Fractal sub-routes (** optional)
│   ├── static               # Static assets
│   ├── store                # Redux-specific pieces
│   │   ├── createStore.js   # Create and instrument redux store
│   │   └── reducers.js      # Reducer registry and injection
│   ├── styles               # Application-wide styles (generally settings)
│   └── utils                # General Utilities (used throughout application)
│   │   ├── components.js    # Utilities for building/implementing react components (often used in enhancers)
│   │   ├── form.js          # For forms (often used in enhancers that use redux-form)
│   │   └── router.js        # Utilities for routing such as those that redirect back to home if not logged in
├── tests                    # Unit tests
├── .env.local               # Environment settings for when running locally
├── .eslintignore            # ESLint ignore file
├── .eslintrc.js             # ESLint configuration
├── .firebaserc              # Firebase Project configuration settings (including ci settings)
├── database.rules.json      # Rules for Firebase Real Time Database
├── firebase.json            # Firebase Service settings (Hosting, Functions, etc)
├── firestore.indexes.json   # Indexs for Cloud Firestore
├── firestore.rules          # Rules for Cloud Firestore
└── storage.rules            # Rules for Cloud Storage For Firebase
```

## Routing

We use `react-router-dom` [route matching](https://reacttraining.com/react-router/web/guides/basic-components/route-matching) (`<route>/index.js`) to define units of logic within our application. The application routes are defined within `src/routes/index.js`, which loads route settings which live in each route's `index.js`. The component with the suffix `Page` is the top level component of each route (i.e. `HomePage` is the top level component for `Home` route).

There are two types of routes definitions:

### Sync Routes

The most simple way to define a route is a simple object with `path` and `component`:

*src/routes/Home/index.js*

```js
import HomePage from './components/HomePage'

// Sync route definition
export default {
  path: '/',
  component: HomePage
}
```

### Async Routes

Routes can also be seperated into their own bundles which are only loaded when visiting that route, which helps decrease the size of your main application bundle. Routes that are loaded asynchronously are defined using `react-loadable`:

*src/routes/NotFound/index.js*

```js
import Loadable from 'react-loadable'
import LoadingSpinner from 'components/LoadingSpinner'

// Async route definition
export default {
  component: Loadable({
    loader: () =>
      import(/* webpackChunkName: 'NotFound' */ './components/NotFoundPage'),
    loading: LoadingSpinner
  })
}
```

With this setting, the name of the file (called a "chunk") is defined as part of the code as well as a loading spinner showing while the bundle file is loading.

More about how routing works is available in [the react-router-dom docs](https://reacttraining.com/react-router/web/guides/quick-start).

## FAQ

1. Why node `8` instead of a newer version?

  [Cloud Functions runtime runs on `8`](https://cloud.google.com/functions/docs/writing/#the_cloud_functions_runtime), which is why that is what is used for the travis build version.

1. Why `enhancers` over `containers`? - For many reasons, here are just a few:
    * separates concerns to have action/business logic move to enhancers (easier for future modularization + optimization)
    * components remain "dumb" by only receiving props which makes them more portable
    * smaller files which are easier to parse
    * functional components can be helpful (along with other tools) when attempting to optimize things


[climate-image]: https://img.shields.io/codeclimate/github/prescottprue/complete.svg?style=flat-square
[climate-url]: https://codeclimate.com/github/prescottprue/complete
[coverage-image]: https://img.shields.io/codeclimate/coverage/github/prescottprue/complete.svg?style=flat-square
[coverage-url]: https://codeclimate.com/github/prescottprue/complete
[license-image]: https://img.shields.io/npm/l/complete.svg?style=flat-square
[license-url]: https://github.com/prescottprue/complete/blob/master/LICENSE
[code-style-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[code-style-url]: http://standardjs.com/
