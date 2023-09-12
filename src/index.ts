import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter
} from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

import { ITopBar } from 'jupyterlab-topbar';

import { URLExt } from '@jupyterlab/coreutils';

import '@jupyterlab/application/style/buttons.css';

import '../style/index.css';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-shutdown:plugin',
  autoStart: true,
  requires: [IRouter, ITopBar],
  activate: async (app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths, topBar: ITopBar) => {
    const { commands } = app;
    let hubHost = '';
    let hubPrefix = '';
    if (paths.urls) {
      hubHost = paths.urls.hubHost;
      hubPrefix = paths.urls.hubPrefix;
    }
    const controlPanelSameTab = 'hub:control-panel-same-tab'

    const shutdown = document.createElement('a');
    shutdown.id = 'shutdown';
    shutdown.innerHTML = 'Shut Down';
    shutdown.addEventListener('click', () => {
      if (hubPrefix) {
        // For JupyterHub
        commands.addCommand(controlPanelSameTab, {
          label: 'Hub Control Panel',
          caption: 'Open the Hub control panel in the same browser tab',
          execute: () => {
            window.open(hubHost + URLExt.join(hubPrefix, 'home'), '_self');
          }
        });
        commands.execute(controlPanelSameTab);
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
