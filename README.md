# jupyterlab-dagitty

![Github Actions Status](https://github.com/krassowski/jupyterlab-dagitty/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/krassowski/jupyterlab-dagitty/main?urlpath=lab/tree/examples/car_model_driver.dag)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-dagitty.svg)](https://pypi.org/project/jupyterlab-dagitty/)

A JupyterLab extension for rendering [dagitty](http://dagitty.net/) DAG files (`.dag` or `.dagitty`),
[Python](https://mybinder.org/v2/gh/krassowski/jupyterlab-dagitty/main?urlpath=lab/tree/examples/Python_demo.ipynb) and
[R](https://mybinder.org/v2/gh/krassowski/jupyterlab-dagitty/main?urlpath=lab/tree/examples/R_demo.ipynb)
notebooks. This extension will also work with upcoming Jupyter Notebook v7+.

![Screenshot of rendered DAG][screenshot]

[screenshot]: https://raw.githubusercontent.com/krassowski/jupyterlab-dagitty/main/docs/images/screenshot.png

In addition to built-in `dagitty` interactions (moving nodes and edges), you can use:

- <kbd>Ctrl</kbd> + mouse wheel to zoom in/out,
- <kbd>Ctrl</kbd> + mouse click and drag to move the canvas,
- resize the plot by dragging bottom-right corner.

You can also make the plot mutable to add nodes or edges (although changes will not be saved).

## Requirements

- JupyterLab >= 4.0.0

For JupyterLab 3, install the last release for it: `pip install "jupyterlab-dagitty==0.3.5"`.

## Install

```bash
pip install jupyterlab-dagitty
```

## Contributing

### Development install

Note: You will need Node.js to build the extension package.
You may install it from [nodejs.org](https://nodejs.org/en/download). We
recommend using the latest LTS version of Node.js.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-dagitty directory
# Build dagitty distribution (bash script, downloads the dagitty sources)
bash build_dagitty.sh
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter-builder develop . --overwrite
# Rebuild extension Typescript source after making changes
# IMPORTANT: Unlike the steps above which are performed only once, do this step
# every time you make a change.
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall jupyterlab-dagitty
```

In development mode, you will also need to remove the symlink created by the `jupyter-builder develop` command.
To find its location, you can run `jupyter labextension list` to figure out where the `labextensions` folder is located.
Then you can remove the symlink named `jupyterlab-dagitty` within that folder.
