from pathlib import Path
from typing import Optional, Union
from numbers import Number


class DAG:

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
                raise ValueError(f'Please provide either `data` or `path`, not both.')
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
