import { jsPlumb, jsPlumbToolkit, jsPlumbToolkitUtil } from "jsplumbtoolkit";

export class BaseLayoutConfiguration {
    //	Fields
    protected ctx: any;

    //Properties
    public RenderParams: any;

    public ToolkitParams: any;

    public View: any;

    //	Constructors
    constructor() {

    }

    //	API Methods
    public Init(ctx: any, nodeFactory: Function, beforeStartConnect: Function, beforeConnect:Function, beforeStartDetach: Function,
                    toggleSelection: Function, removeEdge: Function, canvasClick: Function, objectRepainted: Function,
                    edgeAdded: Function, edgeMoved: Function, modeChanged: Function, connectorClick: Function) {
        this.ctx = ctx;

        this.SetToolkitParams(nodeFactory, beforeStartConnect, beforeConnect, beforeStartDetach)
        this.SetView(toggleSelection, removeEdge, connectorClick);
        this.SetRenderParams(canvasClick, objectRepainted, edgeAdded, edgeMoved, modeChanged);
    }

    public SetRenderParams(canvasClick: Function, objectRepainted: Function, edgeAdded: Function, edgeMoved: Function, modeChanged: Function) {
        this.ctx.FlowLayout.RenderParams = {
            layout: {
                type: "Absolute"
            },
            events: {
                canvasClick: (e: Event) => canvasClick(this.ctx, e),
                objectRepainted: () => objectRepainted(this.ctx),
                edgeAdded: (params: any) => edgeAdded(this.ctx, params),
                edgeTarget: (edge: any, oldTarget: any, newTarget: any) => { alert('moved'); },//edgeMoved(this.ctx, edge, oldTarget, newTarget),
                modeChanged: (mode: string) => modeChanged(this.ctx, mode)
            },
            lassoInvert: false,
            elementsDroppable: true,
            consumeRightClick: false,
            dragOptions: {
                filter: ".jtk-draw-handle, .node-action, .node-action i",
                magnetize: false
            },
            modelLeftAttribute: "Left",
            modelTopAttribute: "Top"
        };
    }

    public SetToolkitParams(nodeFactory: Function, beforeStartConnect: Function, beforeConnect: Function, beforeStartDetach: Function) {
        this.ctx.FlowLayout.ToolkitParams = {
            nodeFactory: (type: string, data: any, callback: Function) => nodeFactory(this.ctx, type, data, callback),
            beforeStartConnect: (node: any, edgeType: string) => beforeStartConnect(this.ctx, node, edgeType),
            beforeConnect: (source: any, target: any, edgeData: any) => beforeConnect(this.ctx, source, target, edgeData),
            beforeStartDetach: (source: any, target: any, edge: any) => beforeStartDetach(this.ctx, source, target, edge)
        };
    }

    public SetView(toggleSelection: Function, removeEdge: Function, connectorClick: Function) {
        this.ctx.FlowLayout.View = {
            nodes: {
                "selectable": {
                    events: {
                        tap: (params: any) => toggleSelection(this.ctx, params.node),
                    }
                }
            },
            edges: {
                "default": {
                    anchor: "AutoDefault",
                    //anchor:["Continuous", { faces: ["Bottom", "Top"] }],
                    endpoint: "Blank",
                    //cssClass: "common-edge",
                    connector: ["Flowchart", { cornerRadius: 5 }],
                    paintStyle: { strokeWidth: 2, stroke: "#f76258", outlineWidth: 3, outlineStroke: "transparent" },	//	paint style for this edge type.
                    hoverPaintStyle: { strokeWidth: 2, stroke: "rgb(67,67,67)" }, // hover paint style for this edge type.
                    events: {
                        "dblclick": (params: any) => removeEdge(this.ctx, params.edge)
                    },
                    overlays: [
                        ["Arrow", { location: 1, width: 10, length: 10 }],
                        ["Arrow", { location: 0.3, width: 10, length: 10 }]
                    ]
                },
                "connection": {
                    parent: "default",
                    overlays: [
                        [
                            "Label", {
                                label: "${label}",
                                events: {
                                }
                            }
                        ]
                    ]
                }
            },
            ports: {
                "default": {
                    paintStyle: { fill: "#f76258" },		// the endpoint's appearance
                    hoverPaintStyle: { fill: "#434343" }, // appearance when mouse hovering on endpoint or connection,
                    events: {
                        "click": (params: any) => connectorClick(this.ctx, params)
                    }
                },
                "source": {
                    endpoint: "Blank",
                    edgeType: "default",
                    paintStyle: { fill: "#f76258" },		// the endpoint's appearance
                    hoverPaintStyle: { fill: "#434343" },
                    anchor: "Right",
                    maxConnections: -1,
                    events: {
                        "click": (params: any) => connectorClick(this.ctx, params)
                    },
                    isSource: true,
                    isTarget: false
                },
                "target": {
                    maxConnections: -1,
                    endpoint: "Blank",
                    edgeType: "default",
                    anchor: "Left",
                    paintStyle: { fill: "#f76258" },		// the endpoint's appearance
                    hoverPaintStyle: { fill: "#434343" },
                    isSource: false,
                    isTarget: true,
                    events: {
                        "click": (params: any) => connectorClick(this.ctx, params)
                    }
                }
            }
        };
    }

    //	Helpers
}