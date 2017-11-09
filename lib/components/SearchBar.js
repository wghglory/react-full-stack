import React, { PureComponent } from 'react';
import debounce from 'lodash.debounce'; // yarn add lodash.debounce
import StoreProvider from './StoreProvider';

class SearchBar extends PureComponent {
  state = {
    searchValue: ''
  };

  doSearch = debounce(() => {
    // this.props.doSearch(this.state.searchValue);
    this.props.store.setSearchTerm(this.state.searchValue);
  }, 300);

  handleSearch = (e) => {
    // we don't want App to filter every change. We want to filter when typing id done by debounce.
    this.setState({ searchValue: e.target.value }, () => {
      this.doSearch();
    });
  };

  // shouldComponentUpdate(nextProps, nextState) {
  //   return false;
  // }

  // componentWillUpdate() {
  //   console.log('update..');
  // }

  render() {
    return (
      <input
        type="search"
        placeholder="enter search"
        onChange={this.handleSearch}
        value={this.state.searchValue}
      />
    );
  }
}

export default StoreProvider()(SearchBar);
