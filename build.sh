sudo pip install -e .

sudo jupyter labextension develop . --overwrite

sudo jupyter labextension install jupyterlab-topbar-extension
sudo jlpm run build
