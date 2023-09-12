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

// import { MainMenu } from '@jupyterlab/mainmenu';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-shutdown:plugin',
  autoStart: true,
  requires: [IRouter, ITopBar],
  activate: async (
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    topBar: ITopBar
  ) => {
    const { commands } = app;
    // const menu = new MainMenu(commands);
    // let hubHost = '';
    let hubPrefix = '';
    if (paths.urls) {
      // hubHost = paths.urls.hubHost;
      hubPrefix = paths.urls.hubPrefix;
    }
    const customShutdown = 'hub:custom-shutdown';

    const shutdown = document.createElement('a');
    shutdown.id = 'shutdown';
    shutdown.innerHTML = 'Shut Down';
    shutdown.addEventListener('click', () => {
      if (hubPrefix) {
        // For JupyterHub
        commands.addCommand(customShutdown, {
          label: 'TEST Shut Down',
          caption: 'TEST Shut down JupyterLab',
          // isVisible: () => menu.quitEntry,
          // isEnabled: () => menu.quitEntry,
          execute: () => {
            return showDialog({
              title: 'TEST Shutdown confirmation',
              body: 'TEST Please confirm you want to shut down JupyterLab.',
              buttons: [
                Dialog.cancelButton(),
                Dialog.warnButton({ label: 'TEST Shut Down' })
              ]
            }).then(async result => {
              if (result.button.accept) {
                const setting = ServerConnection.makeSettings();
                const apiURL = URLExt.join(setting.baseUrl, 'api/shutdown');
                // Shutdown all kernel and terminal sessions before shutting down the server
                // If this fails, we continue execution so we can post an api/shutdown request
                try {
                  await Promise.all([
                    app.serviceManager.sessions.shutdownAll(),
                    app.serviceManager.terminals.shutdownAll()
                  ]);
                } catch (e) {
                  // Do nothing
                  console.log(`TEST Failed to shutdown sessions and terminals: ${e}`);
                }
        
                return ServerConnection.makeRequest(
                  apiURL,
                  { method: 'POST' },
                  setting
                )
                  .then(result => {
                    if (result.ok) {
                      // Close this window if the shutdown request has been successful
                      const body = document.createElement('div');
                      const p1 = document.createElement('p');
                      p1.textContent = 'TEST You have shut down the Jupyter server. You can now close this tab.';
                      const p2 = document.createElement('p');
                      p2.textContent = 'TEST To use JupyterLab again, you will need to relaunch it.';
      
                      body.appendChild(p1);
                      body.appendChild(p2);
                      void showDialog({
                        title: 'TEST Server stopped',
                        body: new Widget({ node: body }),
                        buttons: []
                      });
                      window.close();
                    } else {
                      throw new ServerConnection.ResponseError(result);
                    }
                  })
                  .catch(data => {
                    throw new ServerConnection.NetworkError(data);
                  });
                }
              });
            }
          }
        );
        commands.execute(customShutdown);
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
