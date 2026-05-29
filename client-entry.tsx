import './src/styles.css';

import { activateDeleteConfirmation, deactivateDeleteConfirmation } from './src/confirmDelete';

type PluginActivator = {
  activate: () => void;
  deactivate: () => void;
};

type WindowWithPluginActivators = Window & {
  pluginActivators?: Record<string, PluginActivator>;
};

const pluginName = 'growi-plugin-confirm-delete-text';

console.log(`[${pluginName}] client-entry loaded`);

const activate = (): void => {
  console.log(`[${pluginName}] activate called`);
  activateDeleteConfirmation();
};

const deactivate = (): void => {
  console.log(`[${pluginName}] deactivate called`);
  deactivateDeleteConfirmation();
};

const win = window as WindowWithPluginActivators;
win.pluginActivators ??= {};
win.pluginActivators[pluginName] = {
  activate,
  deactivate,
};
