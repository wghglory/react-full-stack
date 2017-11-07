import React from 'react';
import ArticleList from '../ArticleList';

import renderer from 'react-test-renderer';

describe('ArticleList', () => {
  const testProps = {
    articles: {
      a: { id: 'a' },
      b: { id: 'b' }
    },
    store: {
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
