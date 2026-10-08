from pathlib import Path
from typing import Optional, Union
from numbers import Number


class DAG:
    """A causal diagram that dagitty draws in JupyterLab.

    ``data`` holds the diagram in dagitty's syntax: ``dag { ... }`` with each
    node and its attributes in brackets, then the arrows. A node shows its
    name, and dagitty reads no ``label`` attribute, so name the nodes in
    words, and quote a name that holds spaces. The attributes:

    - ``exposure`` and ``outcome`` mark the effect that the diagram is about;
    - ``adjusted`` marks a variable that the analysis adjusts for;
    - ``latent`` marks a variable that is not measured;
    - ``pos="x,y"`` places a node, with y growing downwards. Without
      positions, dagitty places the nodes itself.

    ``bb="x0,y0,x1,y1"`` sets the area that the positions span. The drawing
    widens it as far as the names of the nodes at its edges need, so that they
    show whole.

    Example, with each cause left of its effects::

        DAG('''
        dag {
        bb="-0.6,-0.4,2.6,2.4"
        "Social media use" [exposure,pos="0,1"]
        "Sad or hopeless" [outcome,pos="2,1"]
        "Age" [adjusted,pos="1,0"]
        "Sleep" [pos="1,2"]
        "Age" -> "Social media use"
        "Age" -> "Sad or hopeless"
        "Social media use" -> "Sleep" -> "Sad or hopeless"
        "Social media use" -> "Sad or hopeless"
        }
        ''')

    ``path`` reads the diagram from a ``.dag`` or ``.dagitty`` file instead.
    ``height`` and ``width`` size the drawing, as a number of pixels or a CSS
    length, and ``mutable=True`` lets the reader add nodes and arrows, which
    are not saved.
    """

    def __init__(
        self,
        data: Optional[str] = None,
        path: Optional[Union[str, Path]] = None,
        height: Optional[Number] = 500,
        width: Optional[Number] = None,
        mutable: bool = False
    ):
        if path is not None:
            if not isinstance(path, Path):
                path = Path(path)
            if data is not None:
                raise ValueError('Please provide either `data` or `path`, not both.')
            data = path.read_text()
        self.data = data
        self.height = height
        self.width = width
        self.mutable = mutable

    def _repr_mimebundle_(self, include=None, exclude=None):
        data = {
            'application/x.dagitty.dag': self.data
        }
        metadata = {}
        if self.height is not None:
            metadata['height'] = (
                f'{self.height}px'
                if isinstance(self.height, Number) else
                self.height
            )
        if self.width is not None:
            metadata['width'] = (
                f'{self.width}px'
                if isinstance(self.width, Number) else
                self.width
            )
        metadata['mutable'] = self.mutable
        return data, metadata
