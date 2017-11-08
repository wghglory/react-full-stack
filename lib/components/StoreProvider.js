import React from 'react';
import PropTypes from 'prop-types';

/**
 * accept a view component, and return a container wrapper component with store from context API
 * @param {*} Component : a view component
 * @return a container component with store from context
 */
const StoreProvider = (extraProps) => (Component) => {
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
          {...extraProps(this.context.store, this.props)}
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