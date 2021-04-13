import { Tab as BootstrapTab, Tabs as BootstrapTabs } from 'react-bootstrap';
import * as PropTypes from 'prop-types';

const Tabs = ({ activeKey, onSelect, children }) => {
  return (
    <BootstrapTabs activeKey={activeKey} onSelect={onSelect}>
      {children}
    </BootstrapTabs>
  );
};

Tabs.propTypes = {
  activeKey: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const Tab = ({ eventKey, title, children }) => {
  return (
    <BootstrapTab eventKey={eventKey} title={title}>
      {children}
    </BootstrapTab>
  );
};

Tab.propTypes = {
  eventKey: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

Tabs.Tab = Tab;

export { Tabs };
