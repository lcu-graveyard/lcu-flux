import { Component, ViewChild, Output, EventEmitter, HostListener } from '@angular/core';

import { jsPlumb, jsPlumbToolkit, DrawingTools, jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { FlowModuleComponent } from "../flow-module";
import { MatDialog, MatDialogRef } from "@angular/material";
import { ConfirmDialogComponent } from "../../dialogs/confirm";
import { SingleInputDialogComponent } from "../../dialogs/single-input";
import { jsPlumbToolkitComponent } from '../../svc/jsplumbtoolkit-angular';
import { FlowModuleOption, FlowEventMethod } from '@lcu/apps';

export class BaseLayoutBehavior {
    //	Fields
    protected dataUpdatedCallback: Function;

    protected minCanvasHeight: number;

    protected moduleOptions: FlowModuleOption[];

    protected registeredCanvasEvents: string[];

    protected registeredToolkitEvents: string[];

    //  Properties
    @HostListener('window:keyup', ['$event'])
    onKeyup(event) {
        if (event.keyCode == 46) {
            var toolkit = this.ToolkitComponent.toolkit;
            if (toolkit.getSelection().getNodes().length > 1) {
                let dialogRef = this.dialog.open(ConfirmDialogComponent, {
                    data: { confirmText: "Delete all selected nodes and connections?", title: 'Delete' },
                    width: '225px'
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        var nodes = toolkit.getSelection().getNodes().map(x => x.id);
                        nodes.forEach(function (node) {
                            toolkit.removeNode(node)
                        });

                        for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                            document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                            i--;
                        }
                    }
                });
            }
            else if (toolkit.getSelection().getNodes().length == 1) {
                //this.ToolkitComponent.toolkit.toggleSelection(toolkit.getSelection().getNodes()[0]);
                this.RemoveNode(null, this, toolkit.getSelection().getNodes()[0], false);
            }
        }
    }

	@Output('flow-init')
	public FlowInit: EventEmitter<jsPlumbToolkitComponent>;

    @Output('on-error')
    public OnError: EventEmitter<{ Error: string, Action: string }>;

    public FlowLayout: any;

    public ToolkitComponent: jsPlumbToolkitComponent;

    //	Constructors
    constructor(public dialog: MatDialog) {
        this.FlowInit = new EventEmitter();

        this.OnError = new EventEmitter();

        this.FlowLayout = {};

        this.registeredCanvasEvents = [];

        this.registeredToolkitEvents = [];
    }

    //	Runtimes

    //	API Methods
    public AfterDataLoad() {
        this.FlowLayout.Palette.refresh();
    }

    public AfterViewInit(registerDroppables: boolean, droppablesParent: string, droppablesSelector: string) {
        var toolkit = this.ToolkitComponent.toolkit;
        var surface = this.ToolkitComponent.surface;

        const controls = document.querySelector(".controls");

        // pan mode/select mode
        jsPlumb.on(controls, "tap", "[mode]", function () {
            surface.setMode(this.getAttribute("mode"));
        });

        // on home button click, zoom content to fit.
        jsPlumb.on(controls, "tap", "[reset]", function () {
            toolkit.clearSelection();
            surface.zoomToFit();
        });

        // configure Drawing tools.
        var dt = new jsPlumbToolkit.DrawingTools({
            renderer: surface,
            widthAttribute: "Width",
            heightAttribute: "Height",
            leftAttribute: "Left",
            topAttribute: "Top"
        });

        if (registerDroppables) {
            this.FlowLayout.Palette = surface.registerDroppableNodes({
                source: document.getElementById(droppablesParent),
                selector: droppablesSelector,
                dragOptions: {
                    zIndex: 50000,
                    cursor: "move",
                    clone: true
                },
                dataGenerator: function (type, dragElement, dropInfo, eventLocation) {
                    return JSON.parse(dragElement.getAttribute('option'));
                },
                typeExtractor: (el, dropInfo, isNative, eventLocation) => {
                    return el.getAttribute("jtk-node-type");
                }
            });
        }

        this.setMouseUpAction();

        this.FlowInit.emit(this.ToolkitComponent);

        this.setDataUpdatedCallback();
    }

    public CanvasClick(ctx: BaseLayoutBehavior, e: Event) {
        ctx.ToolkitComponent.toolkit.clearSelection();
    }

    public EditNode(ev:any, ctx:BaseLayoutBehavior, node: any) {
        var info = ctx.ToolkitComponent.surface.getObjectInfo(node);
        info.obj.data.text = info.obj.data.Text;
        ctx.ToolkitComponent.toolkit.toggleSelection(node);

        var moduleName = ctx.moduleOptions.filter(function (item) { return item.Service == info.obj.data.Service; })[0].Name;

        let dialogRef = ctx.dialog.open(SingleInputDialogComponent, {
            data: { inputText: "Enter " + moduleName + " name:", inputValue: info.obj.data.Text, title: 'Edit Node' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                if (result.data.inputValue && result.data.inputValue.length > 2) {
                    info.obj.data.Text = result.data.inputValue;
                    info.obj.data.text = result.data.inputValue;
                    ctx.ToolkitComponent.toolkit.updateNode(info.obj, info.obj.data);
                }
                else
                    ctx.OnError.emit({ Error: moduleName + " names must be at least 2 characters.", Action: "Dismiss" });
            }
        });
    }

    public Init(dataUpdatedCallback: Function, minCanvasHeight: number) {
        this.dataUpdatedCallback = dataUpdatedCallback;

        this.minCanvasHeight = minCanvasHeight;
    }

    public ModeChanged(ctx: BaseLayoutBehavior, mode: string) {
        if (mode == "pan" && ctx.ToolkitComponent.toolkit.getSelection().getNodes().length > 0) {
            for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                i--;
            }

            var newAdd = true;

            ctx.ToolkitComponent.toolkit.getSelection().getNodes().forEach(function (n) {
                document.querySelectorAll('.menu-item.' + n.data.Service).item(0).classList.add('menu-item-active');
            });
        }
        var controls = document.querySelector(".controls");
        jsPlumb.removeClass(controls.querySelectorAll("[mode]"), "selected-mode");
        jsPlumb.addClass(controls.querySelectorAll("[mode='" + mode + "']"), "selected-mode");

        ctx.handleMultiSelect();
    }

    public ObjectRepainted(ctx: BaseLayoutBehavior) {
        ctx.handleMultiSelect();
    }

    public PrepareNodesAndPorts() {
        var mod = this;

        if (this.moduleOptions) {
            this.moduleOptions.forEach(function (module) {
                Object.keys(mod.FlowLayout.View.nodes).push(module.ModuleType);
                Object.keys(mod.FlowLayout.View.ports).push(module.ModuleType);

                mod.FlowLayout.View.nodes[module.ModuleType] = {
                    parent: "selectable"
                };

                mod.FlowLayout.View.ports[module.ModuleType] = {
                    maxConnections: 1
                }
            });
        }
    }

    public RelayoutFlow() {
        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { confirmText: "Relayout entire flow?", title: 'Relayout' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                var surface = this.ToolkitComponent.surface;
                var toolkit = this.ToolkitComponent.toolkit;
                surface.setLayout({
                    type: "Hierarchical",
                    parameters: {
                        padding: [150, 150],
                        orientation: "vertical"
                    }
                });

                var layoutObjs = surface.getLayout().getPositions();
                var tmpHolder = [];

                Object.keys(layoutObjs).forEach(function (item) {
                    tmpHolder.push({ id: item, top: layoutObjs[item][1], left: layoutObjs[item][0] })
                });

                tmpHolder.forEach(function (item) {
                    var node = toolkit.getNode(item.id);
                    if (node) {
                        node.data.Top = item.top;
                        node.data.Left = item.left;
                    }
                });

                surface.zoomToFit();

                setTimeout(function() {
                    surface.setLayout({
                        type: "Absolute"
                    });
                }, 1000);
            }
        });
    }

    public RefreshNode(nodeId: string) {
        var node = this.ToolkitComponent.toolkit.getNode(nodeId);

        this.ToolkitComponent.toolkit.updateNode(node, node.data);
    }

    public RemoveNode(ev: any, ctx: BaseLayoutBehavior, node: any, override: boolean) {
        var info = ctx.ToolkitComponent.surface.getObjectInfo(node);

        if (ctx.ToolkitComponent.toolkit.getSelection().getNodes().filter(function (item) {
            return item.id == node.id
        }).length == 0) {
            for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                i--;
            }

            var newAdd = true;

            ctx.ToolkitComponent.toolkit.getSelection().getNodes().forEach(function (n) {
                if (n.id != node.id)
                    document.querySelectorAll('.menu-item.' + n.data.Service).item(0).classList.add('menu-item-active');

                if (n.id == node.id)
                    newAdd = false;
            });

            if (newAdd)
                document.querySelectorAll('.menu-item.' + node.Service).item(0).classList.add('menu-item-active');

            ctx.ToolkitComponent.toolkit.toggleSelection(node);
        }

        if (!override) {
            var toolkit = ctx.ToolkitComponent.toolkit;
            if (toolkit.getSelection().getNodes().length > 1) {
                let dialogRef = ctx.dialog.open(ConfirmDialogComponent, {
                    data: { confirmText: "Delete all selected nodes and connections?", title: 'Delete' },
                    width: '225px'
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        var nodes = toolkit.getSelection().getNodes().map(x => x.id);
                        nodes.forEach(function (node) {
                            toolkit.removeNode(node)
                        });

                        for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                            document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                            i--;
                        }
                    }
                });
            }
            else {
                let dialogRef = ctx.dialog.open(ConfirmDialogComponent, {
                    data: { confirmText: "Delete '" + info.obj.data.Name + "'?", title: 'Delete' },
                    width: '225px'
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (result) {
                        ctx.ToolkitComponent.toolkit.removeNode(info.obj);

                        for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                            document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                            i--;
                        }
                    }
                });
            }
        }
        else {
            ctx.ToolkitComponent.toolkit.removeNode(info.obj);

            for (var i = 0; i < document.querySelectorAll('.menu-item.menu-item-active').length; i++) {
                document.querySelectorAll('.menu-item.menu-item-active').item(i).classList.remove('menu-item-active');
                i--;
            }
        }
    }

    public SetModuleOptions(options: FlowModuleOption[]) {
        this.moduleOptions = options;
    }

    public ToggleSelection(ctx: BaseLayoutBehavior, node: any) {
        ctx.ToolkitComponent.toolkit.toggleSelection(node);
    }

    //	Helpers
    protected fixJSPlumb() {
        var self = this;

        this.ToolkitComponent.toolkit.addFactoryNode = function (type, data, callback) {
            data = arguments.length >= 2 && (arguments[1] == null || typeof arguments[1] === "object") ? arguments[1] : {};
            callback = arguments.length == 3 ? arguments[2] : typeof arguments[1] == "function" ? arguments[1] : null;
            data.type = data.type || type;

            self.ToolkitComponent.toolkit.getNodeFactory()(type, data, function (n) {
                var node = this.ToolkitComponent.toolkit.addNode(n);
                if (callback) { callback(node); }
            }.bind(self));
        };
    }

    protected handleMultiSelect() {
        if (this.ToolkitComponent.toolkit.getSelection().getNodes().length > 1) {
            jsPlumb.addClass(document.querySelectorAll(".node-action"), "node-action-hidden");
            jsPlumb.removeClass(document.querySelectorAll(".node-delete"), "node-action-hidden");
        }
        else {
            jsPlumb.removeClass(document.querySelectorAll(".node-action"), "node-action-hidden");
        }

        var self = this;
        this.ToolkitComponent.toolkit.getSelection().getNodes().forEach(function (node) {
            self.registerSelectionCanvasEvents(node, self);
        });
    }

    protected listFlowModuleTypes() {
        return this.ToolkitComponent.toolkit.getNodes().map(n => {
            return n.data.ModuleType;
        }).filter((x, i, a) => a.indexOf(x) == i);
    }

    protected registerSelectionCanvasEvents(node: any, self: BaseLayoutBehavior) {
        var events: FlowEventMethod[] = [];

		events.push(<FlowEventMethod>
            {
                Data: node.data,
                Event: "click",
                Function: self.EditNode,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div > div.node-edit"
            });

		events.push(<FlowEventMethod>
            {
                Data: node.data,
                Event: "click",
                Function: self.RemoveNode,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div > div.node-delete"
            });

        self.registerCanvasEvents(events, self, false);
    }

	protected registerCanvasEvents(canvasEvents: FlowEventMethod[], ctx: any, force: boolean) {
        if (canvasEvents && canvasEvents.length > 0) {
            canvasEvents.forEach(e => {
                if (this.registeredCanvasEvents.indexOf(e.Identifier + "_" + e.Event) == -1 || force) {
                    jsPlumb.on(document.querySelector(e.Identifier), e.Event, function (ev) {
                        e.Function(ev, ctx, e.Data);
                    });

                    this.registeredCanvasEvents.push(e.Identifier + "_" + e.Event);
                }
            });
        }
    }

	protected registerToolkitEvents(toolkitEvents: FlowEventMethod[], ctx: any) {
        if (toolkitEvents && toolkitEvents.length > 0) {

            toolkitEvents.forEach(e => {
                if (this.registeredToolkitEvents.indexOf(e.Event) == -1) {
                    ctx.ToolkitComponent.toolkit.bind(e.Event, function (params) {
                        e.Function(params, ctx);
                    });

                    this.registeredToolkitEvents.push(e.Event);
                }
            });
        }
    }

    protected setMouseUpAction() {
        var self = this;

        window.onmouseup = function (this: Window, ev: MouseEvent) {
            var els = document.querySelectorAll('.connection-drop-disabled');

            for (var i = 0; i < els.length; i++) {
                els[i].className = els[i].className.replace(' connection-drop-disabled', '')
            }

            els = document.querySelectorAll('.connection-drop-enabled');

            for (var i = 0; i < els.length; i++) {
                els[i].className = els[i].className.replace(' connection-drop-enabled', '')
            }

            self.handleMultiSelect();
        }
    }

    protected setDataUpdatedCallback() {
        var toolkit = this.ToolkitComponent.toolkit;

        toolkit.bind("dataUpdated", this.dataUpdatedCallback);
    }

    protected setToolkitComponent(toolkitComponent: jsPlumbToolkitComponent) {
        this.ToolkitComponent = toolkitComponent;

        this.fixJSPlumb();
    }
}
