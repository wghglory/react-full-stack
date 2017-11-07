# green refactor

currently we have client index.js and severRender.js, which are very similar. Since all tests passed, webpack build, node express server are running well, it's time to refactor our application. We can put these 2 rendering files into a folder call `renderers`.

step 1: mkdir `renderers`. Then move serverRender.js and components/index.js into it. Rename them.

## git grep

`git grep <argument>` can find where the argument is used.

```bash
git grep serverRender
```

The result is like:

```
lib/server.js:import serverRender from './serverRender';
lib/server.js:  res.render('index', { initialContent: serverRender() });
```

```diff
// lib/server.js

import express from 'express';
import config from './config';
- import serverRender from './serverRender';
+ import serverRender from './renderers/server';
```

---

## Using absolute path instead of relative path

Of course we can use relative path. Absolute path needs to add NODE_PATH in npm scripts and edit webpack config's resolve, but it's easy if in future we publish our own npm package, like state-api.

### node server code using absolute path

package.json: Add NODE_PATH=./lib 意味着绝对路径从 lib 开始

```json
"devServer": "NODE_PATH=./lib pm2 start lib/server.js --watch --interpreter babel-node && pm2 logs",
"devServer:windows": "set NODE_PATH=./lib && nodemon --exec babel-node lib/server.js",
```

```javascript
// lib/server.js
import serverRender from './renderers/server';  // relative path
import serverRender from 'renderers/server'; // absolute path by NODE_PATH

// lib/renderers/server.js
import App from '../components/App';  // relative path
import App from 'components/App'; // absolute path by NODE_PATH
```

### client code using absolute path by webpack config resolve

```javascript
const config = {
  resolve: {
    modules: [path.resolve('./lib'), path.resolve('./node_modules')]
  }
}
```

```javascript
// lib/renderers/client.js
import App from '../components/App'; // relative path is better for client side
import App from 'components/App'; // absolute path, but for webpack, edit resolve in webpack config
```