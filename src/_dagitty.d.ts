export class Graph {
    getVertex(vertex: any): any;
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
    toGraphCoordinate(x: number, y: number): any;
    getViewMode(): string;
    getGraph(): Graph;
    pointerX(e: MouseEvent): number;
    pointerY(e: MouseEvent): number;
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
