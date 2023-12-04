import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab-shutdown extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-shutdown:plugin',
  description: 'Shutdown Button for JupyterLab',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-shutdown is activated!');
  }
};

export default plugin;
