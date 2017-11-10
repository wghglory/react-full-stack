import React from 'react';
import PropTypes from 'prop-types';

/**
 * accept a view component, and return a container wrapper component with store from context API
 * @param {*} Component : a view component
 * @return a container component with store from context
 */
const StoreProvider = (extraProps = () => ({})) => (Component) => {
  return class extends React.PureComponent {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

    usedState = () => {
      return extraProps(this.context.store, this.props);
    };

    state = this.usedState();

    // 只改变 extraProps 传过来的 state，而不是 forceUpdate 任何改变
    onStoreChange = () => {
      if (this.subscriptionId) {
        // this.forceUpdate();
        this.setState(this.usedState());
      }
    };

    componentDidMount() {
      this.subscriptionId = this.context.store.subscribe(this.onStoreChange);
    }

    componentWillUnmount() {
      this.context.store.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }

    render() {
      return <Component {...this.props} store={this.context.store} {...this.usedState()} />;
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
