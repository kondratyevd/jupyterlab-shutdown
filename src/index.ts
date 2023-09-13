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
  activate: async (app: JupyterFrontEnd, router: IRouter, topBar: ITopBar) => {
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
                  p1.textContent = 'You have shut down the session.';
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
                  // const baseUrl = new URL(setting.baseUrl);
                  // window.location.href =
                  //   baseUrl.protocol + '//' + baseUrl.hostname + '/hub/spawn';

                  // Define a function to handle the redirection
                  const redirectToHub = async (url: string) => {
                    window.location.href = url;
                  };

                  // Retry the redirection up to 5 times with a delay of 1 second between retries
                  let retryCount = 0;
                  const maxRetries = 5;
                  const retryDelay = 1000; // 1 second

                  const attemptRedirection = async (url: string) => {
                    try {
                      await redirectToHub(url);
                    } catch (error: any) {
                      if (
                        error &&
                        error.status === 503 &&
                        retryCount < maxRetries
                      ) {
                        // If it's a 503 error, and we haven't exceeded the max retries, retry after a delay
                        retryCount++;
                        setTimeout(() => attemptRedirection(url), retryDelay);
                      } else {
                        throw error; // Propagate the error if it's not a 503 error or if max retries are reached
                      }
                    }
                  };

                  // Define the URL to redirect to
                  const baseUrl = new URL(setting.baseUrl);
                  const hubUrl =
                    baseUrl.protocol + '//' + baseUrl.hostname + '/hub/spawn';

                  // Start the redirection attempt with the specified URL
                  attemptRedirection(hubUrl);
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
