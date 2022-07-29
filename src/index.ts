/*
jupyterlab-dagitty
Copyright (C) 2022 Michal Krassowski

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this library; if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
*/

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Widget } from '@lumino/widgets';
import type { Message } from '@lumino/messaging';

import { DAGittyController, GraphParser } from './_dagitty';
import { dagIcon } from './icons';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/x.dagitty.dag';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-dagitty-dag';

/**
 * A widget for rendering Dagitty DAG.
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  dagController?: DAGittyController;

  private _boundingClientRectOutdated: boolean;
  private _boundingClientRect: DOMRect;
  private _resizeObserver: ResizeObserver;
  private _offsetLeft: number;
  private _offsetTop: number;

  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    this._updatePositions();
    this._resizeObserver = new ResizeObserver((entries: any) => {
      this._resize();
    });
    this._resizeObserver.observe(this.node);
  }

  /**
   * Render Dagitty DAG into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const data = model.data[this._mimeType] as string;
    const metadata = model.metadata as any;
    for (const argument of ['width', 'height']) {
      const value = metadata[argument] as string | undefined;
      if (value) {
        this.node.style.setProperty(argument, value);
      }
    }
    const isMutable = (metadata['mutable'] as boolean | undefined) || false;

    const graph = GraphParser.parseGuess(data);

    this.dagController = new DAGittyController({
      canvas: this.node,
      graph: graph,
      autofocus: true,
      interactive: true,
      // we set mutable=false to prevent adding new nodes
      // but we still alllow view mutations, see setListeners()
      mutable: isMutable,
    });
    this.adjustPointerPositioning();
    if (!isMutable) {
      this.setDragListeners();
    }

    return Promise.resolve();
  }

  private _maybeUpdatePositions() {
    if (this._boundingClientRectOutdated) {
      this._updatePositions();
    }
  }

  private _updatePositions() {
    this._boundingClientRect = this.node.getBoundingClientRect();
    this._offsetLeft = this.node.offsetLeft;
    this._offsetTop = this.node.offsetTop;
    this._boundingClientRectOutdated = false;
  }

  protected adjustPointerPositioning(): void {
    const impl = this.dagController.getView().impl;
    // dagitty uses offsetLeft and offsetTop to calculate mouse position,
    // which is only correct if the container is a direct descendant of body
    // (or nested in elements which do not have paddings/border/position)
    // so here we position getters to return correct values.

    const originalPointerX = impl.pointerX;
    impl.pointerX = (e: any) => {
      this._maybeUpdatePositions();
      return (
        originalPointerX(e) - this._boundingClientRect.x + this._offsetLeft
      );
    };
    const originalPointerY = impl.pointerY;
    impl.pointerY = (e: any) => {
      this._maybeUpdatePositions();
      return originalPointerY(e) - this._boundingClientRect.y + this._offsetTop;
    };
  }

  onUpdateRequest(message: Message): void {
    this._boundingClientRectOutdated = true;
  }

  /**
   * Preserve the information about moved edges in vertices,
   * so that they remain in place when we resize the view.
   */
  setDragListeners(): void {
    const view = this.dagController.getView();
    const impl = view.impl;

    impl.setEventListener('vertex_drag', (vs: any) => {
      const [x, y] = view.toGraphCoordinate(vs.x, vs.y);
      vs.v.layout_pos_x = x;
      vs.v.layout_pos_y = y;
      if (view.getViewMode() !== 'normal') {
        const v = view.getGraph().getVertex(vs.v.id);
        v.layout_pos_x = x;
        v.layout_pos_y = y;
      }
    });

    impl.setEventListener('edge_drag', (es: any) => {
      const [x, y] = view.toGraphCoordinate(es.cx, es.cy);
      es.e.layout_pos_x = x;
      es.e.layout_pos_y = y;
    });

    impl.setEventListener('drag_end', () =>
      this.dagController.graphLayoutChanged()
    );
  }

  private _resize(): void {
    if (this.dagController) {
      this.dagController.getView().resize();
    }
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this._resize();
    this.update();
  }

  dispose(): void {
    if (this._resizeObserver) {
      this._resizeObserver.unobserve(this.node);
      this._resizeObserver = null;
    }
    super.dispose();
  }

  private _mimeType: string;
}

/**
 * A mime renderer factory for Dagitty DAG data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: (options) => new OutputWidget(options),
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab-dagitty:plugin',
  rendererFactory,
  rank: 100,
  dataType: 'string',
  fileTypes: [
    {
      name: 'dag',
      mimeTypes: [MIME_TYPE],
      extensions: ['.dag'],
      icon: dagIcon.name,
    },
    {
      name: 'dagitty',
      mimeTypes: [MIME_TYPE],
      extensions: ['.dagitty'],
      icon: dagIcon.name,
    },
  ],
  documentWidgetFactoryOptions: {
    name: 'Dagitty DAG',
    primaryFileType: 'dag',
    fileTypes: ['dag'],
    defaultFor: ['dag'],
  },
};

export default extension;
