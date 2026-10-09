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
}

export class DAGittyGraphView {
    impl: GraphGUI_SVG;
    resize(): void;
    drawGraph(): void;
    toGraphCoordinate(x: number, y: number): any;
    getViewMode(): string;
    getGraph(): Graph;
    bounds: BoundingBox2
    /** The drawing's size in px: the container's, less 4. */
    width: number;
    height: number;
    getContainer(): HTMLElement;
    /** Set `bounds` from the graph's `bb`, or from its nodes when it has none. */
    initializeCoordinateSystem(graph: Graph): void;
    setCoordinateSystemValid(valid: boolean): void;
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
