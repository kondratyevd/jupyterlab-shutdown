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
    router: IRouter,
    topBar: ITopBar
  ) => {
    const { commands } = app;
    const customShutdown = 'hub:custom-shutdown';
    commands.addCommand(customShutdown, {
      label: 'Shut Down',
      caption: 'Shut down user session',
      execute: () => {
        return showDialog({
          title: 'Shut down Analysis Facility session',
          body: 'Warning: unsaved data will be lost!',
          buttons: [
            Dialog.cancelButton(),
            Dialog.warnButton({ label: 'Shut Down' })
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
              console.log(`Failed to shutdown sessions and terminals: ${e}`);
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
                  p1.textContent =
                    'You have shut down the session.';
                  const p2 = document.createElement('p');
                  p2.textContent =
                    'You will now be redirected to the Analysis Facility starting page.';

                  body.appendChild(p1);
                  body.appendChild(p2);
                  void showDialog({
                    title: 'Session closed.',
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
        }).then(() => {
          router.navigate('/hub/home/', { hard: true });
        });
      }
    });

    const shutdown = document.createElement('a');
    shutdown.id = 'shutdown';
    shutdown.innerHTML = 'Shut Down';
    shutdown.addEventListener('click', () => {
      commands.execute(customShutdown);
    });

    const widget = new Widget({ node: shutdown });
    widget.addClass('jp-Button-flat');
    topBar.addItem('shutdown-button', widget);
  }
};

export default extension;
