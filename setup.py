"""
jupyterlab-dagitty setup
"""
import json
import os

import setuptools

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
name = "jupyterlab-dagitty"

# Get our version
with open(os.path.join(HERE, 'package.json')) as f:
    version = json.load(f)['version']

lab_path = os.path.join(HERE, name.replace('-', '_'), "labextension")

# Representative files that should exist after a successful build
ensured_targets = [
    os.path.join(lab_path, "package.json"),
]

labext_name = "jupyterlab-dagitty"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, lab_path, "**"),
    ("share/jupyter/labextensions/%s" % labext_name, HERE, "install.json"),
]

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_args = dict(
    name=name,
    version=version,
    url="https://github.com/krassowski/jupyterlab-dagitty",
    author="Michal Krassowski",
    description="A JupyterLab extension for rendering Dagitty DAG files.",
    long_description= long_description,
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    install_requires=[
        "jupyterlab~=3.0",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    license="LGPL-2.1-or-later",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab"],
    classifiers=[
        "License :: OSI Approved :: GNU Lesser General Public License v2 or later (LGPLv2+)",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Framework :: Jupyter",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 3",
        "Framework :: Jupyter :: JupyterLab :: Extensions",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Mime Renderers",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Prebuilt",
    ],
)


try:
    from jupyter_packaging import (
        wrap_installers,
        npm_builder,
        get_data_files
    )
    builder = npm_builder(HERE, build_cmd="build", npm=["jlpm"])
    cmdclass = wrap_installers(pre_develop=builder, ensured_targets=ensured_targets)

    setup_args['cmdclass'] = cmdclass
    setup_args['data_files'] = get_data_files(data_files_spec)
except ImportError:
    pass


if __name__ == "__main__":
    setuptools.setup(**setup_args)
