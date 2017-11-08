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
    expect(wrapper.find('ArticleContainer').length).toBe(2);
    expect(wrapper).toMatchSnapshot();
  });
});
