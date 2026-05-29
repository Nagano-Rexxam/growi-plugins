import './src/styles.css';

import { activateDeleteConfirmation, deactivateDeleteConfirmation } from './src/confirmDelete.js';

const pluginName = 'growi-plugin-confirm-delete-text';

function registerActivator() {
  window.pluginActivators ??= {};
  window.pluginActivators[pluginName] = {
    activate: activateDeleteConfirmation,
    deactivate: deactivateDeleteConfirmation,
  };
}

console.log("plugin started!!");

registerActivator();

