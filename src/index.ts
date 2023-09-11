import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter
} from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { ITopBar } from 'jupyterlab-topbar';

import '@jupyterlab/application/style/buttons.css';

import '../style/index.css';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-shutdown:plugin',
  autoStart: true,
  requires: [IRouter, ITopBar],
  activate: async (app: JupyterFrontEnd, router: IRouter, topBar: ITopBar) => {
    const { commands } = app;
    const shutdown = document.createElement('a');
    shutdown.id = 'shutdown';
    shutdown.innerHTML = 'Shut Down';
    shutdown.addEventListener('click', () => {
      if (commands.hasCommand('hub:control-panel')) {
        // For JupyterHub
        commands.execute('hub:control-panel');
      } else {
        // For basic JupyterLab w/o JupyterHub integration
        commands.execute('filemenu:shutdown');
      }
    });

    const widget = new Widget({ node: shutdown });
    widget.addClass('jp-Button-flat');
    topBar.addItem('shutdown-button', widget);
  }
};

export default extension;
