import { Component, ViewChild, Output, EventEmitter, HostListener, AfterViewInit } from '@angular/core';

import { BaseLayoutBehavior } from "./base-layout-behavior";

import { jsPlumb, jsPlumbToolkit, DrawingTools, jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { FlowModuleComponent } from "../flow-module";
import { MatDialog, MatDialogRef } from "@angular/material";

import { FlowManagerComponent, FlowManagerData } from "../flow-manager";
import { FlowConfig, ModuleControlTypes } from '@lcu/apps';
import { jsPlumbToolkitComponent } from '../../svc/jsplumbtoolkit-angular';
import { SingleInputDialogComponent } from '../../dialogs/single-input';
import { ConfirmDialogComponent } from '../../dialogs/confirm';

@Component({
    selector: 'flow-layout-behavior',
    templateUrl: 'flow-layout-behavior.html'
})
export class FlowLayoutBehavior extends BaseLayoutBehavior implements AfterViewInit {
    //	Fields
    protected mgrDialog: MatDialogRef<FlowManagerComponent>;

    protected flowId;

    //  Properties
    @ViewChild(jsPlumbToolkitComponent)
    public ToolkitComponent: jsPlumbToolkitComponent;

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.setCanvasHeight();
    }

    //	Constructors
    constructor(public dialog: MatDialog) {
        super(dialog);
    }

    //	Runtimes
    public ngAfterViewInit() {
        super.setToolkitComponent(this.ToolkitComponent);
    }

    //	API Methods
    public AfterViewInit(registerDroppables: boolean, droppablesParent: string, droppablesSelector: string) {
        super.AfterViewInit(registerDroppables, droppablesParent, droppablesSelector);

        this.setCanvasHeight();
    }

    public AuditConnections() {
        var flowIns = this.ToolkitComponent.toolkit.getAllEdges().filter(x => {
            return x.target.data.ControlType == ModuleControlTypes.Flow;
        });

        flowIns.forEach(x => {
            var schemaFlow = x.target.data.Settings.SchemaFlow;

            if (schemaFlow && schemaFlow.SchemaNodes) {
                var schemaNodes = schemaFlow.SchemaNodes.filter(node => {
                    return node.IncommingModuleID == x.source.id;
                });

                var empty = schemaFlow.SchemaNodes.filter(function (item) {
                    return item.Data.SchemaType == 'incomming' && !item.IncommingModuleID;
                });

                if (empty.length > 0)
                    x.target.data.Settings.HasErrors = true;

                if (schemaNodes.length == 0) {
                    this.ToolkitComponent.toolkit.removeEdge(x);
                    if (x.source.data.Settings.SchemaFlow && x.source.data.Settings.SchemaFlow.SchemaNodes) {
                        x.source.data.Settings.SchemaFlow.SchemaNodes.filter(function (item) {
                            return item.OutgoingModuleIDs.indexOf(x.target.id) > -1;
                        }).forEach(function (item) {
                            item.OutgoingModuleIDs.splice(item.OutgoingModuleIDs.indexOf(x.target.id), 1);

                            if (item.OutgoingModuleIDs.length == 0)
                                x.source.data.Settings.HasErrors = true;
                        });
                    }
                }
            }
        });

        var flowOuts = this.ToolkitComponent.toolkit.getAllEdges().filter(x => {
            return x.source.data.ControlType == ModuleControlTypes.Flow;
        });

        flowOuts.forEach(x => {
            var schemaFlow = x.source.data.Settings.SchemaFlow;

            if (schemaFlow && schemaFlow.SchemaNodes) {
                var schemaNodes = schemaFlow.SchemaNodes.filter(node => {
                    return node.OutgoingModuleIDs.indexOf(x.target.id) > -1;
                });

                var empty = schemaFlow.SchemaNodes.filter(function (item) {
                    return item.Data.SchemaType == 'outgoing' && (!item.OutgoingModuleIDs || item.OutgoingModuleIDs.length == 0);
                });

                if (empty.length > 0)
                    x.source.data.Settings.HasErrors = true;

                if (schemaNodes.length == 0) {
                    this.ToolkitComponent.toolkit.removeEdge(x);
                    if (x.target.data.Settings.SchemaFlow && x.target.data.Settings.SchemaFlow.SchemaNodes) {
                        x.target.data.Settings.SchemaFlow.SchemaNodes.filter(function (item) {
                            return item.IncommingModuleID == x.source.id;
                        }).forEach(function (item) {
                            item.IncommingModuleID = "";
                            x.target.data.Settings.HasErrors = true;
                        });
                    }
                }
            }
        });
    }

    public BeforeConnect(ctx: FlowLayoutBehavior, source: any, target: any, edgeData: any, repressErrors: boolean) {
        if (target.id == source.id)
            return false;

        var incomingEdges = target.getEdges().filter(x => {
            return x.target.id == target.id;
        });

        var validControlTypeConnection = true;
        switch (source.data.ControlType) {
            case ModuleControlTypes.Direct:
                {
                    if (target.data.ControlType != ModuleControlTypes.Gate)
                        validControlTypeConnection = false;
                }
                break;
            case ModuleControlTypes.Flow:
                {
                    if (target.data.ControlType == ModuleControlTypes.Direct)
                        validControlTypeConnection = false;
                }
                break;
            case ModuleControlTypes.Gate:
                {
                }
                break;
        }

        if (!validControlTypeConnection) {
            if (!repressErrors)
                ctx.OnError.emit({ Error: "Connection between " + ctx.moduleOptions.filter(function (item) { return item.Service == source.data.Service; })[0].Name + " and " + ctx.moduleOptions.filter(function (item) { return item.Service == target.data.Service; })[0].Name + " types is not supported.", Action: "Dismiss" });
            return false;
        }

        if (target.data.IncomingConnectionLimit == 0 && !repressErrors) {
            ctx.OnError.emit({ Error: "Incoming connections not allowed on '" + target.data.Text + "'.'", Action: "Dismiss" });
        } else if (target.data.IncomingConnectionLimit == -1 || incomingEdges.length < target.data.IncomingConnectionLimit) {
            var possibleTypes = [
                ...source.data.OutgoingConnectionTypes,
                ...target.data.IncomingConnectionTypes
            ].filter((x, i, a) => a.indexOf(x) == i);

            if (!possibleTypes || possibleTypes.length == 0) {
                if (ctx.ToolkitComponent && ctx.ToolkitComponent.surface)
                    ctx.ToolkitComponent.surface.repaintEverything();
                return true;
            }
            else if (possibleTypes.some(f => f == target.data.ModuleType)) {
                if (ctx.ToolkitComponent && ctx.ToolkitComponent.surface) {
                    ctx.ToolkitComponent.surface.repaintEverything();
                }
                return true;
            }
            else if (!repressErrors)
                ctx.OnError.emit({ Error: "Connection between " + ctx.moduleOptions.filter(function (item) { return item.Service == source.data.Service; })[0].Name + " and " + ctx.moduleOptions.filter(function (item) { return item.Service == target.data.Service; })[0].Name + " types is not supported.", Action: "Dismiss" });
        } else if (!repressErrors)
            ctx.OnError.emit({ Error: "Max incoming connections reached for '" + ctx.moduleOptions.filter(function (item) { return item.Service == target.data.Service; })[0].Name + "'.", Action: "Dismiss" });

        return false;
    }

    public BeforeStartConnect(ctx: FlowLayoutBehavior, node: any, edgeType: string) {
        var outgoingEdges = node.getEdges().filter(x => {
            return x.source.id == node.id;
        });

        if (node.data.OutgoingConnectionLimit == 0) {
            ctx.OnError.emit({ Error: "Outgoing connections not allowed on '" + ctx.moduleOptions.filter(function (item) { return item.Service == node.data.Service; })[0].Name + "'.", Action: "Dismiss" });
        } else if (node.data.OutgoingConnectionLimit == -1 || outgoingEdges.length < node.data.OutgoingConnectionLimit) {
            var flowModuleTypes = ctx.listFlowModuleTypes();
            var moduleOptions = ctx.moduleOptions;

            if (ctx.moduleOptions) {
                var outgoingTypes = [...node.data.OutgoingConnectionTypes];

                moduleOptions.forEach(mo => {
                    if (mo.IncomingConnectionTypes.some(ct => ct == node.data.ModuleType))
                        outgoingTypes.push(mo.ModuleType);
                });

                outgoingTypes = outgoingTypes.filter((x, i, a) => a.indexOf(x) == i);

                var isValid = false;

                if (!outgoingTypes || outgoingTypes.length == 0)
                    isValid = true;
                else if (outgoingTypes.some(f => flowModuleTypes.indexOf(f) >= 0))
                    isValid = true;
                else
                    ctx.OnError.emit({ Error: "No supported connection modules for '" + node.data.Text + "'.", Action: "Dismiss" });
            }
            else
                return true;
        } else
            ctx.OnError.emit({ Error: "Max outgoing connections reached on '" + node.data.Text + "'.", Action: "Dismiss" });

        if (isValid) {
            var validConnections = 0;

            ctx.ToolkitComponent.toolkit.getNodes().forEach(target => {
                if (!ctx.BeforeConnect(ctx, node, target, null, true))
                    document.querySelector("[data-jtk-node-id='" + target.id + "']").className += ' connection-drop-disabled';
                else {
                    document.querySelector("[data-jtk-node-id='" + target.id + "']").className += ' connection-drop-enabled';
                    validConnections++;
                }
            });

            if (!validConnections) {
                ctx.OnError.emit({ Error: "No valid connections currently available.", Action: "Dismiss" });
                return false;
            }
            else
                return true;
        }

        return false;
    }

    public BeforeStartDetach(ctx: FlowLayoutBehavior, source: any, target: any, edge: any) {
        return true;
    }

    public ConnectionClick(ctx: FlowLayoutBehavior, params: any) {

    }

    public EdgeAdded(ctx: FlowLayoutBehavior, params: any) {
        var self = this;
        if (params.addedByMouse) {
            if (params.target.data.Service == "DataMap" || params.source.data.Service == "DataMap") {
                var data;
                if (params.source.data.Service == "DataMap")
                    data = params.source.data;
                else if (params.target.data.Service == "DataMap")
                    data = params.target.data;


                setTimeout(function () {
                    ctx.mgrDialog = ctx.dialog.open(FlowManagerComponent, {
                        disableClose: true,
                        panelClass: 'module-manager-container',
                        data: <FlowManagerData>{
                            IncommingModules: {
                                _app: "IoTFlow:IncommingModules",
                                Items: ctx.ToolkitComponent.toolkit.getNode(data.id).getEdges().filter(function (item) {
                                    return item.target.id == data.id
                                }).map(x => {
                                    var sid = '';

                                    if (x.source.data && x.source.data && x.source.data.Settings && x.source.data.Settings.SchemaFlow &&
                                        x.source.data.Settings.SchemaFlow.SchemaNodes && x.source.data.Settings.SchemaFlow.SchemaNodes.length > 0) {
                                        var ogNodes = x.source.data.Settings.SchemaFlow.SchemaNodes.filter(function (item) {
                                            return item.Data.SchemaType == 'outgoing' && item.OutgoingModuleIDs.indexOf(data.id) > -1;
                                        });

                                        if (ogNodes.length > 0)
                                            sid = ogNodes[0].JSONSchemaID;
                                    }

                                    return {
                                        id: x.source.id,
                                        name: x.source.data.Text,
                                        schemaId: sid
                                    }
                                })
                            },
                            ManagementPath: data.ManagementPath,
                            ManagerHeight: data.ManagerHeight,
                            ManagerWidth: data.ManagerWidth,
                            OutgoingModules: {
                                _app: "IoTFlow:OutgoingModules",
                                Items: ctx.ToolkitComponent.toolkit.getNode(data.id).getEdges().filter(function (item) {
                                    return item.source.id == data.id
                                }).map(x => {
                                    return {
                                        id: x.target.id,
                                        name: x.target.data.Text,
                                        type: x.target.data.Service,
                                        status: x.target.data.Status
                                    }
                                })
                            },
                            SchemaOptions: [],
                            Settings: data.Settings || {},
                            Token: data.Token,
                            UnavailableLookups: ctx.ToolkitComponent.toolkit.getNodes().filter(function (item) {
                                return item.data.Service == data.Service && item.data.Settings;
                            }).map(function (item) {
                                return { Lookup: item.data.Settings.Lookup, SubLookups: (item.data.Settings.SubLookups ? item.data.Settings.SubLookups.filter(function (item) { x => x.Lookup == item.data.Settings.Lookup }) : null)};
                            }),
                            ModuleTypeName: data.Text,
                            FirstLoad: false,
                            Application: data.Application,
                            Service: data.Service,
                            FlowID: ctx.flowId
                        }
                    });

                    ctx.mgrDialog.afterClosed().subscribe(result => {
                        if (result && result.confirm) {
                            if (params.source.data.Service == "DataMap" && params.target.data.Service == "DataMap") {
                                var outConnections = params.source.data.Settings.SchemaFlow.SchemaNodes.filter(function (node) {
                                    return node.OutgoingModuleIDs.indexOf(params.target.id) > -1;
                                });

                                if (outConnections && outConnections.length > 0) {
                                    var outConnection = outConnections[0];

                                    if (!params.target.data.Settings) {
                                        params.target.data.Settings = { IsDeleted: false };
                                    }

                                    if (!params.target.data.Settings.SchemaFlow) {
                                        params.target.data.Settings.SchemaFlow = { SchemaNodes: [] };
                                    }

                                    var schemaId = outConnection.JSONSchemaID;

                                    var existing = params.target.data.Settings.SchemaFlow.SchemaNodes.filter(function (sNode) {
                                        return (sNode.Data.SchemaType == 'incomming' && sNode.JSONSchemaID == schemaId && !sNode.IncommingModuleID)
                                    });

                                    if (existing && existing.length > 0)
                                        existing[0].IncommingModuleID = params.source.id;
                                    else {
                                        var top = 0;
                                        var left = 9000;

                                        params.target.data.Settings.SchemaFlow.SchemaNodes.filter(x => {
                                            return x.Data.SchemaType == 'incomming'
                                        }).forEach(node => {
                                            var currentTop = node.Data.Top + 150;
                                            var currentLeft = node.Data.Left;
                                            if (currentTop > top)
                                                top = currentTop;
                                            if (currentLeft < left)
                                                left = currentLeft;
                                        });

                                        top += 50;

                                        var id = jsPlumbToolkitUtil.uuid();
                                        var schemaNode = {
                                            ID: id,
                                            Data: {
                                                id: id,
                                                SchemaType: "incomming",
                                                type: "schema",
                                                Name: outConnection.Data.Name,
                                                Top: top,
                                                Left: left
                                            },
                                            JSONSchemaID: schemaId,
                                            IncommingModuleID: params.source.id,
                                            OutgoingModuleIDs: [],
                                            JoinRelationships: [],
                                            DisableSchemaEdit: true,
                                            Left: -200
                                        };

                                        params.target.data.Settings.SchemaFlow.SchemaNodes.push(schemaNode);
                                    }
                                }
                            }
                        }
                        else {
                            ctx.ToolkitComponent.toolkit.removeEdge(params.edge);
                            var edge = params.edge;

                            if (edge.target.data.Service == "DataMap" || edge.source.data.Service == "DataMap") {
                                var inModule;
                                var outModule;
                                if (edge.target.data.Service == "DataMap")
                                    inModule = edge.target.data;
                                if (edge.source.data.Service == "DataMap")
                                    outModule = edge.source.data;

                                if (inModule) {
                                    if (inModule.Settings && inModule.Settings.SchemaFlow && inModule.Settings.SchemaFlow.SchemaNodes) {
                                        var nodes = inModule.Settings.SchemaFlow.SchemaNodes.filter(function (node) {
                                            return node.IncommingModuleID && node.IncommingModuleID == edge.source.id;
                                        }).forEach(function (node) {
                                            node.IncommingModuleID = "";
                                        });
                                    }
                                }
                                if (outModule) {
                                    if (outModule.Settings && outModule.Settings.SchemaFlow && outModule.Settings.SchemaFlow.SchemaNodes) {
                                        var nodes = outModule.Settings.SchemaFlow.SchemaNodes.filter(function (node) {
                                            return node.OutgoingModuleID && node.OutgoingModuleIDs.indexOf(edge.target.id) > -1;
                                        }).forEach(function (node) {
                                            node.OutgoingModuleIDs.splice(node.OutgoingModuleIDs.indexOf(edge.target.id), 1);
                                        });
                                    }
                                }
                            }
                        }
                    });
                }, 200);
            }
        }
    }

    public EdgeMoved(ctx: FlowLayoutBehavior, edge: any, oldTarget: any, newTarget: any) {

    }

    public ExportFlow(flow: FlowConfig) {
        var self = this;

        return this.ToolkitComponent.toolkit.exportData({
            type: "fathymIO",
            parameters: {
                flow: flow
            }
        });
    }

    public MapExistingFlow(flow: FlowConfig) {
        var self = this;
		this.flowId = flow.ID;

        this.ToolkitComponent.toolkit.load({
            type: "fathymIO",
            data: flow,
            onload: function () {
                self.ToolkitComponent.surface.repaintEverything();

                setTimeout(function () {
                    self.ToolkitComponent.surface.setLayout({
                        type: "Absolute",
                        parameters: {
                            padding: [150, 150]
                        }
                    });

                    self.ToolkitComponent.surface.zoomToFit();
                }, 0);
            }
        });
    }

    public NodeFactory(ctx: FlowLayoutBehavior, type: string, data: any, callback: Function) {
        var moduleType = data.Name;
        let dialogRef = ctx.dialog.open(SingleInputDialogComponent, {
            data: { inputText: "Enter " + data.Name + " name:", inputValue: data.Text, title: 'New Node' },
            width: '225px'
        });
        var self = ctx;
        var flowId = ctx.flowId;

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.confirm) {

                data.Text = result.data.inputValue;
                data.Name = result.data.inputValue;
                data.Top = data.top;
                data.Left = data.left;
                if (data.Text && data.Text.length >= 2) {
                    data.ID = jsPlumbToolkitUtil.uuid();
                    data.id = data.ID;
                    callback(data);

                    setTimeout(function () {
                        data.Status = { Code: -100 };
                        ctx.mgrDialog = ctx.dialog.open(FlowManagerComponent, {
                            disableClose: true,
                            panelClass: 'module-manager-container',
                            data: <FlowManagerData>{
                                IncommingModules: {
                                    _app: "IoTFlow:IncommingModules",
                                    Items: []
                                },
                                ManagementPath: data.ManagementPath,
                                ManagerHeight: data.ManagerHeight,
                                ManagerWidth: data.ManagerWidth,
                                OutgoingModules: {
                                    _app: "IoTFlow:OutgoingModules",
                                    Items: []
                                },
                                SchemaOptions: [],
                                Settings: data.Settings || {},
                                Token: data.Token,
                                UnavailableLookups: ctx.ToolkitComponent.toolkit.getNodes().filter(function (item) {
                                    return item.data.Service == data.Service && item.data.Settings;
                                }).map(function (item) {
                                    return { Lookup: item.data.Settings.Lookup, SubLookups: (item.data.Settings.SubLookups ? item.data.Settings.SubLookups.filter(function (item) { x => x.Lookup == item.data.Settings.Lookup }) : null) };
                                }),
                                ModuleTypeName: data.Name,
                                FirstLoad: true,
                                Application: data.Application,
                                Service: data.Service,
                                FlowID: flowId
                            }
                        });

                        ctx.mgrDialog.afterClosed().subscribe(result => {
                            if (!ctx.ToolkitComponent.toolkit.getNode(data.id).data.Settings)
                                ctx.ToolkitComponent.toolkit.removeNode(data.id);
                        });
                    }, 200);
                }
                else
                    ctx.OnError.emit({ Error: moduleType + " names must be at least 2 characters.", Action: "Dismiss" });
            }
        });
    }

    public NodeResolver(typeId: string) {
        return FlowModuleComponent;
    }

    public RemoveEdge(ctx: FlowLayoutBehavior, edge: any) {
        let dialogRef = ctx.dialog.open(ConfirmDialogComponent, {
            data: { confirmText: "Delete edge between '" + edge.source.data.Text + "' and '" + edge.target.data.Text + "'?", title: 'Delete' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                ctx.ToolkitComponent.toolkit.removeEdge(edge);

                if (edge.target.data.Service == "DataMap" || edge.source.data.Service == "DataMap") {
                    var inModule;
                    var outModule;
                    if (edge.target.data.Service == "DataMap")
                        inModule = edge.target.data;
                    if (edge.source.data.Service == "DataMap")
                        outModule = edge.source.data;

                    if (inModule) {
                        if (inModule.Settings && inModule.Settings.SchemaFlow && inModule.Settings.SchemaFlow.SchemaNodes) {
                            var nodes = inModule.Settings.SchemaFlow.SchemaNodes.filter(function (node) {
                                return node.IncommingModuleID && node.IncommingModuleID == edge.source.id;
                            }).forEach(function (node) {
                                inModule.Settings.HasErrors = true;
                                node.IncommingModuleID = "";
                            });
                        }
                    }
                    if (outModule) {
                        if (outModule.Settings && outModule.Settings.SchemaFlow && outModule.Settings.SchemaFlow.SchemaNodes) {
                            var nodes = outModule.Settings.SchemaFlow.SchemaNodes.filter(function (node) {
                                return node.OutgoingModuleIDs && node.OutgoingModuleIDs.indexOf(edge.target.id) > -1;
                            }).forEach(function (node) {
                                node.OutgoingModuleIDs.splice(node.OutgoingModuleIDs.indexOf(edge.target.id), 1);
                                if (node.OutgoingModuleIDs.length == 0)
                                    outModule.Settings.HasErrors = true;
                            });
                        }
                    }
                }
            }
        });
    }

    public ToggleSelection(ctx: FlowLayoutBehavior, node: any) {
        super.ToggleSelection(ctx, node);
    }

    public UpdateSettings(nodeId: string, settings: any) {
        var info = this.ToolkitComponent.surface.getObjectInfo(nodeId);

        info.obj.data.Settings = settings;

        this.ToolkitComponent.toolkit.updateNode(info.obj, info.obj.data);
    }

    //	Helpers
    protected newToken() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    protected setCanvasHeight() {
        var height = window.innerHeight - 20;
        if (height < this.minCanvasHeight)
            height = this.minCanvasHeight;

        for (var i = 0; i < document.getElementsByClassName('jtk-surface').length; i++) {
            (<HTMLElement>document.getElementsByClassName('jtk-surface')[i]).style.height = (height).toString() + 'px';
        }

        if (document.getElementsByClassName('miniview').length > 0)
            (<HTMLElement>document.getElementsByClassName('miniview')[0]).style.top = (height - 127 - 25).toString() + 'px';
    }
}
