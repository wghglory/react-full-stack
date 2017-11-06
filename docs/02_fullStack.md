# Server Rendering, Jest

## Data Transform

Array is good to list the result, but for a larger collection, it is not fast to get a single record from an array. It's better to find that record from object. So we consider transform array of articles or authors to object/map structure.

> See the data in lib/testData.json.

```javascript
// lib/DataApi.js
class DataApi {
  constructor(rawData) {
    this.rawData = rawData;
  }

  mapArr2Obj(arr) {
    return arr.reduce((accu, curr) => {
      accu[curr.id] = curr;
      return accu;
    }, {});
  }

  getArticles() {
    return this.mapArr2Obj(this.rawData.articles);
  }

  getAuthors() {
    return this.mapArr2Obj(this.rawData.authors);
  }
}

export default DataApi;
```

## Component Responsibility

不应该把所有数据都传到了 ArticleList 中

```jsx
// App.js
// ...

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      articles: api.getArticles(),
      authors: api.getAuthors()
    };
  }
  render() {
    return (
      <div>
        <ArticleList articles={this.state.articles} authors={this.state.authors} />
      </div>
    );
  }
}
```

ArticleList 不应该获取到 authorId，过滤某个 author 不应该是 ArticleList 的职责！

```jsx
// ArticleList.js
// ...

const ArticleList = ({ articles, authors }) => {
  return (
    <div>
      {Object.values(articles).map((article) => (
        <Article key={article.id} article={article} author={authors[article.authorId]} />
      ))}
    </div>
  );
};
```

```jsx
// Article.js
// ...

const Article = ({ article, author }) => {
  return (
    <div style={styles.article}>
      <div style={styles.title}>{article.title}</div>
      <div style={styles.date}>{dateDisplay(article.date)}</div>
      <div style={styles.author}>
        <a href={author.website}>
          {author.firstName} {author.lastName}
        </a>
      </div>
      <div style={styles.body}>{article.body}</div>
    </div>
  );
};
```

**所以我们作如下改进**：

```diff
// App.js
// ...

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      articles: api.getArticles(),
      authors: api.getAuthors()
    };
  }

+  articleActions = {
+    lookupAuthor: (authorId) => this.state.authors[authorId]
+  };

  render() {
    return (
      <div>
-        <ArticleList articles={this.state.articles} authors={this.state.authors} />
+        <ArticleList articles={this.state.articles} articleActions={this.articleActions} />
      </div>
    );
  }
}
```

```diff
// ArticleList.js

- const ArticleList = ({ articles, authors }) => {
+ const ArticleList = ({ articles, articleActions }) => {
  return (
    <div>
      {Object.values(articles).map((article) => (
-        <Article key={article.id} article={article} author={authors[article.authorId]} />
+        <Article key={article.id} article={article} actions={articleActions} />
      ))}
    </div>
  );
};
```

```diff
// Article.js

+ const Article = ({ article, actions }) => {
+  const author = actions.lookupAuthor(article.authorId);

  return (
    <div style={styles.article}>
      <div style={styles.title}>{article.title}</div>
      <div style={styles.date}>{dateDisplay(article.date)}</div>
      <div style={styles.author}>
        <a href={author.website}>
          {author.firstName} {author.lastName}
        </a>
      </div>
      <div style={styles.body}>{article.body}</div>
    </div>
  );
};
```

## Testing with Jest

To avoid eslint warning about `describe, it`, add below to .eslintrc.js

```diff
env: {
  browser: true,
  commonjs: true,
  es6: true,
  node: true,
+  jest: true
},
```

### plain javascript testing

**lib/__test__/DataApi.test.js**:

```javascript
import DataApi from '../DataApi';
import { data } from '../testData';

const api = new DataApi(data);

describe('DataApi', () => {
  it('exposes articles as an object', () => {
    const articles = api.getArticles();
    const articleId = data.articles[0].id;
    const articleTitle = data.articles[0].title;

    expect(articles).toHaveProperty(articleId);
    expect(articles[articleId].title).toBe(articleTitle);
  });

  it('exposes authors as an object', () => {
    const authors = api.getAuthors();
    const authorId = data.authors[0].id;
    const authorFirstName = data.authors[0].firstName;

    expect(authors).toHaveProperty(authorId);
    expect(authors[authorId].firstName).toBe(authorFirstName);
  });
});
```

### component render testing

> snapshot testing 会和之前生成 component 样子进行对比，如不同会报错。可以输入 `u` 进行 update 更新 snapshot。

install package:

```bash
yarn add react-test-renderer --dev
```

**__test__/ArticleList.test.js**:

```javascript
import React from 'react';
import ArticleList from '../ArticleList';

import renderer from 'react-test-renderer';

describe('ArticleList', () => {
  const testProps = {
    articles: {
      a: { id: 'a' },
      b: { id: 'b' }
    },
    articleActions: {
      lookupAuthor: jest.fn(() => {
        return {};
      })
    }
  };

  it('renders correctly', () => {
    const tree = renderer.create(<ArticleList {...testProps} />).toJSON();

    expect(tree).toMatchSnapshot(); // snapshot testing
    expect(tree.children.length).toBe(2);
  });
});
```

## Server rendering

1. 禁用 js 也能看到
1. SEO
1. performance: react client side 检测后端回来 application copy 时候不用在前端进行 mounting

index.ejs:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Setup</title>
</head>
<body>
  <div id="root"><%- initialContent -%></div>
  <!-- no space above since react will compare client and server side. it's sensitive to spaces -->
  <script src="bundle.js"></script>
</body>
</html>
```

create lib/serverRender.js:

```javascript
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import App from './components/App';

const serverRender = () => {
  return ReactDOMServer.renderToString(<App />);
};

export default serverRender;
```

lib/server.js:

```diff
import express from 'express';
import config from './config';
+ import serverRender from './serverRender';

const app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
+  res.render('index', { initialContent: serverRender() });
});

app.listen(config.port, function() {
  console.info(`Running on ${config.port}`);
});
```