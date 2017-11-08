# Context for store

* Context is global, which should be avoided unless needed.
* it will make test harder

App.js: define the context

```javascript
export default class App extends Component {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }
}
```

Article.js which uses the context:

```diff
import React from 'react';
+ import PropTypes from 'prop-types';

+ // second parameter is context
+ const Article = ({ article }, context) => {
  const author = context.store.lookupAuthor(article.authorId);

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

+ Article.contextTypes = {
+   store: PropTypes.object
+ };

export default Article;
```

## shallow rendering by enzyme

After we have introduced context above, our test is broken.

```bash
yarn add enzyme enzyme-adapter-react-16 --dev
```

add tools/enzymeTestAdapterSetup.js:

```javascript
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
```

Add this setup in package.json:

```json
"jest": {
  "moduleNameMapper": {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/tools/assetsTransform.js",
    "\\.(css|less)$": "<rootDir>/tools/assetsTransform.js"
  },
  "setupFiles": ["raf/polyfill", "./tools/enzymeTestAdapterSetup.js"]
}
```

Article.Test.js:

```diff
import React from 'react';
import ArticleList from '../ArticleList';

- import renderer from 'react-test-renderer';
+ import { shallow } from 'enzyme';
+ import Article from '../Article';

describe('ArticleList', () => {
  const testProps = {
    articles: {
      a: { id: 'a' },
      b: { id: 'b' }
    }
-    // since store is a global context, we don't need to pass store
-    // store: {
-    //   lookupAuthor: jest.fn(() => {
-    //     return {};
-    //   })
-    // }
  };

+  Article.propTypes = {};

  it('renders correctly', () => {
-    // tree rendering, deep render
-    // const tree = renderer.create(<ArticleList {...testProps} />).toJSON();
-    // expect(tree).toMatchSnapshot(); // snapshot testing
-    // expect(tree.children.length).toBe(2);

+    const wrapper = shallow(<ArticleList {...testProps} />);
+    expect(wrapper.find('Article').length).toBe(2);
+    expect(wrapper).toMatchSnapshot();
  });
});
```

> Note: Since we introduced context, our test is harder. So we want to make it simpler, let's do it.

## Presentational component and Container component

```javascript
// Article.js
const Article = ({ article }, context) => {
  const author = context.store.lookupAuthor(article.authorId);

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

Now Article component 1) has global context, 2) has lookupAuthor logic. The global context makes test harder. One solution is to split Article component to 2.

```diff
import React from 'react';
import PropTypes from 'prop-types';

- const Article = ({ article }, context) => {
+ const Article = ({ article, store }) => {
-  const author = context.store.lookupAuthor(article.authorId);
+  const author = store.lookupAuthor(article.authorId);

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

+ const ArticleContainer = (props, context) => {
+   return <Article {...props} store={context.store} />;
+ };

- Article.contextTypes = {
+ ArticleContainer.contextTypes = {
  store: PropTypes.object
};

- export default Article;
+ export default ArticleContainer;
```

## HOC

Since we may have other container component just like ArticleContainer, we can make it a generic component. **We create a HOC that generates a container component to provide any component with the store object without having it deal directly with the context API.**

Create lib/components/StoreProvider.js

```jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * accept a view component, and return a container wrapper component with store from context API
 * @param {*} Component : a view component
 * @return a container component with store from context
 */
const StoreProvider = (Component) => {

  return class extends React.Component {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

    render() {
      return <Component {...this.props} store={this.context.store} />;
    }
  };

  /*   const WithStoreContainer = (props, context) => {
    return <Component {...props} store={context.store} />;
  };

  WithStoreContainer.contextTypes = {
    store: PropTypes.object
  };

  WithStoreContainer.displayName = `${Component.name}Container`;

  return WithStoreContainer; */
};

export default StoreProvider;
```

Now Article.js is like:

```diff
import React from 'react';
import PropTypes from 'prop-types';
+ import StoreProvider from './StoreProvider';

const Article = ({ article, store }) => {
  const author = store.lookupAuthor(article.authorId);

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

Article.propTypes = {
  article: PropTypes.shape({
    date: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired
  })
};

- /* const ArticleContainer = (props, context) => {
-   return <Article {...props} store={context.store} />;
- };
-
- ArticleContainer.contextTypes = {
-   store: PropTypes.object
- };
-
- export default ArticleContainer; */

+ export default StoreProvider(Article);
```

ArticleList.test.js:

```diff
import React from 'react';
import ArticleList from '../ArticleList';

// import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';

describe('ArticleList', () => {
  const testProps = {
    articles: {
      a: { id: 'a' },
      b: { id: 'b' }
    }
    // since store is a global context, we don't need to pass store
    // store: {
    //   lookupAuthor: jest.fn(() => {
    //     return {};
    //   })
    // }
  };

  it('renders correctly', () => {
    // tree rendering, deep render
    // const tree = renderer.create(<ArticleList {...testProps} />).toJSON();
    // expect(tree).toMatchSnapshot(); // snapshot testing
    // expect(tree.children.length).toBe(2);

    const wrapper = shallow(<ArticleList {...testProps} />);
-    expect(wrapper.find('Article').length).toBe(2);
+    expect(wrapper.find('ArticleContainer').length).toBe(2);
    expect(wrapper).toMatchSnapshot();
  });
});
```

**Now StoreProvider is responsible to generate ArticleContainer which accesses context API and pass the store object by props into Article component.**

### Mapping extra props

```jsx
const Article = ({ article, store }) => {
  const author = store.lookupAuthor(article.authorId);

  return (
    <div style={styles.article}>
    </div>
  );
};
```

Although Article doesn't access context directly, it still have `store.lookupAuthor` logic, so it's not a pure presentational component. We need to make this better, by mapping extra props thru StoreProvider.

Article.js:

```diff
import React from 'react';
import PropTypes from 'prop-types';
import StoreProvider from './StoreProvider';

const Article = ({ article, author }) => {
-  // const author = store.lookupAuthor(article.authorId);

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

Article.propTypes = {
  article: PropTypes.shape({
    date: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    body: PropTypes.string.isRequired
  })
};

+ function extraProps(store, originalProps) {
+   return {
+     author: store.lookupAuthor(originalProps.article.authorId)
+   };
+ }

- export default StoreProvider(Article);
+ export default StoreProvider(extraProps)(Article);
```

StoreProvider.js

```diff
import React from 'react';
import PropTypes from 'prop-types';

/**
 * accept a view component, and return a container wrapper component with store from context API
 * @param {*} Component : a view component
 * @return a container component with store from context
 */
+ const StoreProvider = (extraProps) => (Component) => {
  return class extends React.Component {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

    render() {
      return (
        <Component
          {...this.props}
          store={this.context.store}
+          {...extraProps(this.context.store, this.props)}
        />
      );
    }
  };

  /*   const WithStoreContainer = (props, context) => {
    return <Component {...props} store={context.store} />;
  };

  WithStoreContainer.contextTypes = {
    store: PropTypes.object
  };

  WithStoreContainer.displayName = `${Component.name}Container`;

  return WithStoreContainer; */
};

export default StoreProvider;
```