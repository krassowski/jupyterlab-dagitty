export class Graph {
    getVertex(vertex: any): any;
}

type DagEvent = 'graphchange' | 'graphlayoutchange' | 'vertex_marked' | 'vertex_drag' | 'edge_drag' | 'drag_end';

export class GraphGUI_SVG {
    setEventListener(event: DagEvent, callback: any): void;
    pointerX(e: any): number;
    pointerY(e: any): number;
}

export class DAGittyGraphView {
    impl: GraphGUI_SVG;
    resize(): void;
    toGraphCoordinate(x: number, y: number): any;
    getViewMode(): string;
    getGraph(): Graph;
}

export class DAGittyController {
    constructor(op: {
        canvas: HTMLElement,
        graph: Graph,
        autofocus: boolean,
        interactive: boolean,
        mutable?: boolean
    });

    getView(): DAGittyGraphView;
    observe(event: DagEvent, callback: any): void;
    graphLayoutChanged(): void;
}

export class GraphParser {
    static parseGuess(data: string): Graph;
}
