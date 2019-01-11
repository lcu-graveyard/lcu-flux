import { Injectable } from '@angular/core';

import { jsPlumb, jsPlumbToolkit, jsPlumbToolkitUtil } from "jsplumbtoolkit";

import { BaseLayoutConfiguration } from "./base-layout-configuration";

@Injectable({
	providedIn: 'root'
})
export class ModuleSchemaLayoutConfiguration extends BaseLayoutConfiguration {
    //	Fields

    //Properties

    //	Constructors
    constructor() {
        super();
    }

    //	API Methods
    public Init(ctx: any, nodeFactory: Function, beforeStartConnect: Function, beforeConnect: Function, beforeStartDetach: Function,
        toggleSelection: Function, removeEdge: Function, canvasClick: Function, objectRepainted: Function,
        edgeAdded: Function, edgeMoved: Function, modeChanged: Function, connectorClick: Function) {

        super.Init(ctx, nodeFactory, beforeStartConnect, beforeConnect, beforeStartDetach, toggleSelection, removeEdge, canvasClick, objectRepainted,
            edgeAdded, edgeMoved, modeChanged, connectorClick)
        this.ctx.FlowLayout.RenderParams.layout = {
            type: "Absolute",
            parameters: {
                padding: [150],
                orientation: "vertical"
            }
        };

        delete this.ctx.FlowLayout.View.edges.default.endpoint;
        delete this.ctx.FlowLayout.View.edges.default.anchor;
        this.ctx.FlowLayout.View.edges.default.endpoints = ["Blank", ["Image", { src: "/img/gear.png" }]];
        this.ctx.FlowLayout.View.edges.default.anchors = ["Right", "Left"];
        this.ctx.FlowLayout.View.ports.target.endpoint = ["Image", { src: "/img/gear.png" }];
        //this.ctx.FlowLayout.View.ports.default.endpoint = ["Image", { src: "/img/gear.png" }];
        delete this.ctx.FlowLayout.View.edges.default.overlays;

        this.ctx.FlowLayout.View.edges.default.overlays = [["Label", {
            cssClass: "delete-relationship",
            label: "<i class='fa fa-times'></i>",
            events: {
                "tap": function (params) {
                    removeEdge(ctx, params.edge);
                }
            },
            location: .1
        }]];

        delete this.ctx.FlowLayout.View.edges.default.hoverPaintStyle;
        this.ctx.FlowLayout.View.edges.default.paintStyle.strokeWidth = 1;
        this.ctx.FlowLayout.View.edges.default.paintStyle.outlineWidth = 1;
    }

    //	Helpers
}