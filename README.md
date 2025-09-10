# Catalog App

React app created with typescript that defines manages and displays discrete layers image catalog

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app)


## Installation

Install deps with yarn

```bash
yarn
```

Run confd

```bash
yarn confd
```

To generate:  
public/env-config.js  <- For env variables  
public/index.html  <- For PUBLIC_URL, to support non-root URL  

To use app env variables inside a docker, run the following command

```bash
node ./confd/generate-config.js --environment production --indocker
```
  
Start app

```bash
yarn start
```

Open [http://localhost:3000](http://localhost:3000)

## Running Tests

To run tests, run the following command

```bash
yarn test
```

It will run in an interactive mode  

See [running tests](https://facebook.github.io/create-react-app/docs/running-tests)

## Preparing for deployment

To prepare the code for deployment, run the following command

```bash
yarn build
```

It bundles react app with production mode and optimizes performance

See [deployment](https://facebook.github.io/create-react-app/docs/deployment)

## Deployment

> [!IMPORTANT] 
> We depend on `Red-Hat Yaml Extension` for validating the values files against the relevant schemas from helm-common.
> That means, you should install the extension from vscode in order to be able to edit values files according to our schemas.

To update helm dependencies
```bash
yarn helm-update
```

In order to create/renew values schemas 
```bash
yarn helm-assets
```

To deploy: helm values **MUST** be combined from global.yaml and values.yaml (use npm script!)
```bash
yarn helm-install
```

See [helm values](https://github.com/MapColonies/helm-common/blob/c352a2453117895ec0f9df0267a66d6f5b9c2da2/README.md)
