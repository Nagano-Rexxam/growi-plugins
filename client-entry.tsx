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

const activate = (): void => {
  activateDeleteConfirmation();
};

const deactivate = (): void => {
  deactivateDeleteConfirmation();
};

const win = window as WindowWithPluginActivators;
win.pluginActivators ??= {};
win.pluginActivators[pluginName] = {
  activate,
  deactivate,
};
