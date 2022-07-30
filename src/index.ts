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
import type { Graph } from './_dagitty';
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

  private _arePositionsOutdated: boolean;
  private _resizeObserver: ResizeObserver;
  private _offsetLeft: number;
  private _offsetTop: number;
  private _offsetWidth: number;
  private _offsetHeight: number;
  private _inDrag: boolean;

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
    this._inDrag = false;
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
    if (this._arePositionsOutdated) {
      this._updatePositions();
    }
  }

  private _updatePositions() {
    this._offsetLeft = this.node.offsetLeft;
    this._offsetTop = this.node.offsetTop;
    this._offsetWidth = this.node.offsetWidth;
    this._offsetHeight = this.node.offsetHeight;
    this._arePositionsOutdated = false;
  }

  protected adjustPointerPositioning(): void {
    const view = this.dagController.getView();
    const impl = view.impl;
    // dagitty uses offsetLeft and offsetTop to calculate mouse position,
    // which is only correct if the container is a direct descendant of body
    // (or nested in elements which do not have paddings/border/position)
    // so here we override position getters to return correct values.

    const offsetX = (e: MouseEvent) => {
      this._maybeUpdatePositions();
      return e.offsetX + this._offsetLeft;
    };
    const offsetY = (e: MouseEvent) => {
      this._maybeUpdatePositions();
      return e.offsetY + this._offsetTop;
    };
    view.pointerX = offsetX;
    view.pointerY = offsetY;

    impl.pointerX = offsetX;
    impl.pointerY = offsetY;
  }

  onUpdateRequest(message: Message): void {
    this._arePositionsOutdated = true;
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
    this._arePositionsOutdated = true;
    if (this.dagController) {
      this.dagController.getView().resize();
    }
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    this._resize();
    this.update();
  }

  /**
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the widgets's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'wheel':
        this._evtMouseWheel(event as WheelEvent);
        event.preventDefault();
        break;
      case 'pointerdown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'pointermove':
        this._evtMouseMove(event as MouseEvent);
        break;
      case 'pointerleave':
        this._evtMouseLeave(event as MouseEvent);
        break;
      case 'pointerup':
        this._evtMouseUp(event as MouseEvent);
        break;
    }
  }

  private _evtMouseDown(event: MouseEvent): void {
    this._inDrag = true;
  }

  private _getBoundingBox(graph: Graph): number[] {
    let box = graph.getBoundingBox();
    if (box === null) {
      const box2 = this.dagController.getView().bounds;
      box = [box2[0], box2[2], box2[1], box2[3]];
    }
    return box;
  }

  private _evtMouseMove(event: MouseEvent): void {
    if (!(this._inDrag && event.ctrlKey)) {
      return;
    }
    this._maybeUpdatePositions();
    const graph = this.dagController.getGraph();
    const box = this._getBoundingBox(graph);
    const w = box[2] - box[0];
    const h = box[3] - box[1];
    const dx = (event.movementX / this._offsetWidth) * w;
    const dy = (event.movementY / this._offsetHeight) * h;

    box[0] -= dx;
    box[1] -= dy;
    box[2] -= dx;
    box[3] -= dy;

    graph.setBoundingBox(box);
    this.dagController.getView().drawGraph();
    this.update();
  }

  private _evtMouseUp(event: MouseEvent): void {
    this._inDrag = false;
  }

  private _evtMouseLeave(event: MouseEvent): void {
    this._inDrag = false;
  }

  private _evtMouseWheel(event: WheelEvent): void {
    if (!(this.dagController && event.ctrlKey)) {
      return;
    }
    const graph = this.dagController.getGraph();
    let box = this._getBoundingBox(graph);
    const scale = 1 + event.deltaY / window.screen.height;
    this._maybeUpdatePositions();
    let w = box[2] - box[0];
    let h = box[3] - box[1];

    const xmin = box[0];
    const ymin = box[1];

    box[0] -= xmin;
    box[1] -= ymin;
    box[2] -= xmin;
    box[3] -= ymin;

    box[0] -= w / 2;
    box[1] -= h / 2;
    box[2] -= w / 2;
    box[3] -= h / 2;

    box = box.map((x) => x * scale);

    const dx = (event.offsetX / this._offsetWidth) * (1 - scale) * w;
    const dy = (event.offsetY / this._offsetHeight) * (1 - scale) * h;

    box[0] += dx;
    box[1] += dy;
    box[2] += dx;
    box[3] += dy;

    w = box[2] - box[0];
    h = box[3] - box[1];

    box[0] += w / 2;
    box[1] += h / 2;
    box[2] += w / 2;
    box[3] += h / 2;

    box[0] += xmin;
    box[1] += ymin;
    box[2] += xmin;
    box[3] += ymin;

    graph.setBoundingBox(box);
    this.dagController.getView().drawGraph();
    this.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('pointerdown', this);
    this.node.addEventListener('pointerup', this);
    this.node.addEventListener('pointermove', this);
    this.node.addEventListener('pointerleave', this);
    this.node.addEventListener('wheel', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('pointerdown', this);
    this.node.removeEventListener('pointerup', this);
    this.node.removeEventListener('pointermove', this);
    this.node.removeEventListener('pointerleave', this);
    this.node.removeEventListener('wheel', this);
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
