# React full stack advanced app

1. avoid client and server side fetching data twice
1. avoid client componentDidMount throwing away server markup and mount the same markup again

To solve this, deliver initial data and initial markup together from server side, and attach initial data to window object, so client side will have that data.

## Commands

For development environment, run below respectively.

```bash
yarn dev
yarn webpack
yarn test
```

For production environment, run below respectively.

```bash
yarn build:server  # build server-side code and run them in node environment
yarn build:client  # build react and other frontend assets by webpack.config.prod.js
yarn prod   # run production code
```

## Tags

* v1.0.0 - [01 Setup project, yarn, eslint](./docs/01_setup.md)
* v1.1.0 - [02 Jest testing, Data transform, server rendering](./docs/02_fullStack.md)
* v1.2.0 - [03 node, webpack Absolute path](./docs/03_refactor.md)
* v1.3.0 - [04 context store, HOC](./docs/04_context_HOC.md)
* v1.4.0 - [05 stateChange, store subscribe](./docs/05_stateChange.md)
* v1.5.0 - [06 Performance: PureComponent instead of function component, subscribe partial state, react_perf](./docs/06_performance.md)

## Reference

* <https://github.com/jscomplete/reactful>