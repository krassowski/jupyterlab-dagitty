/**
 * [min x, min y, max x, max y]
 */
type BoundingBox = number[];

/**
 * [min x, max x, min y, max y]
 */
type BoundingBox2 = number[];

export class Graph {
    getVertex(vertex: any): any;
    setBoundingBox(bb: BoundingBox): void;
    getBoundingBox(): BoundingBox | null;
}

type DagEvent = 'graphchange' | 'graphlayoutchange' | 'vertex_marked' | 'vertex_drag' | 'edge_drag' | 'drag_end';

export class GraphGUI_SVG {
    setEventListener(event: DagEvent, callback: any): void;
    pointerX(e: MouseEvent): number;
    pointerY(e: MouseEvent): number;
}

export class DAGittyGraphView {
    impl: GraphGUI_SVG;
    resize(): void;
    drawGraph(): void;
    toGraphCoordinate(x: number, y: number): any;
    getViewMode(): string;
    getGraph(): Graph;
    pointerX(e: MouseEvent): number;
    pointerY(e: MouseEvent): number;
    bounds: BoundingBox2
}

export class DAGittyController {
    constructor(op: {
        canvas: HTMLElement,
        graph: Graph,
        autofocus: boolean,
        interactive: boolean,
        mutable?: boolean
    });

    getGraph(): Graph;
    getView(): DAGittyGraphView;
    observe(event: DagEvent, callback: any): void;
    graphLayoutChanged(): void;
}

export class GraphParser {
    static parseGuess(data: string): Graph;
}
