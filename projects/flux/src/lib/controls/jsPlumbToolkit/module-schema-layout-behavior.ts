import { Component, ViewChild, Output, EventEmitter, HostListener, AfterViewInit, Input } from '@angular/core';

import { BaseLayoutBehavior } from "./base-layout-behavior";

import { jsPlumb, jsPlumbToolkit, DrawingTools, jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { FlowModuleComponent } from "../flow-module";
import { MatDialog, MatDialogRef, MatSelect, MatSelectChange } from "@angular/material";
import { ConfirmDialogComponent } from "../../dialogs/confirm";
import { SingleInputDialogComponent } from "../../dialogs/single-input";

import { FlowConfig, FlowModuleOption, FlowEventMethod, SchemaFunction, SchemaFunctionProperty, SchemaFunctionDefinition, ForgeJSONSchema } from '@lcu/apps';

import { FlowTableComponent } from "../flow-table";
import { jsPlumbToolkitComponent } from '../../svc/jsplumbtoolkit-angular';
import { SchemaInputDialogComponent } from '../../dialogs/schema-input';
import { SchemaGroupsDialogComponent } from '../../dialogs/schema-groups';
import { SchemaJoinDialogComponent } from '../../dialogs/schema-join';
import { SchemaFunctionsDialogComponent } from '../../dialogs/schema-functions';

@Component({
    selector: 'module-schema-layout-behavior',
    templateUrl: 'module-schema-layout-behavior.html'
})
export class ModuleSchemaLayoutBehavior extends BaseLayoutBehavior implements AfterViewInit {
    //	Fields
    protected schemaSavedCallback: Function;

    protected closeModalCallback: Function;

    //  Properties
    public CurrentModuleConnection: any;

    public IncommingSchemaCount: number;

    public IncommingModules: any[];

    public OutgoingSchemaCount: number;

    public FlowID: string;

    public ModuleName: string;

    public OutgoingModules: any[];

    public ParentCTX: any;

    @Input('single-schema-input')
    public SingleSchemaInput: boolean;

    @Input('single-schema-output')
    public SingleSchemaOutput: boolean;

    @ViewChild('schemaOptions')
    SchemaOptions: MatSelect;

    public SchemaOptionsVisible: boolean;

    public AvailableSchemaFunctions: SchemaFunctionDefinition[];

    public Schemas: ForgeJSONSchema[];

    public SchemaFlow: any;

    @ViewChild(jsPlumbToolkitComponent)
    public ToolkitComponent: jsPlumbToolkitComponent;


    //	Constructors
    constructor(public dialog: MatDialog) {
        super(dialog);

        this.SchemaOptionsVisible = false;

        this.IncommingSchemaCount = 0;
        this.OutgoingSchemaCount = 0;

        this.AvailableSchemaFunctions = [];

        this.CurrentModuleConnection = null;
    }

    //	Runtimes
    public ngAfterViewInit() {
        super.setToolkitComponent(this.ToolkitComponent);

        this.registerFlowModuleToolkitEvents(this);
    }

    //	API Methods
    public AddNode(schemaType: string) {
        var self = this;
        this.ToolkitComponent.toolkit.addFactoryNode("schema", { id: '', SchemaType: schemaType, IncommingModules: this.IncommingModules, OutgoingModules: this.OutgoingModules }, function (node: any) { self.registerFlowModuleCanvasEvents(node, self, false) })
    }

    public AfterViewInit(registerDroppables: boolean, droppablesParent: string, droppablesSelector: string) {
        super.AfterViewInit(registerDroppables, droppablesParent, droppablesSelector);

        this.setCanvasHeight();
    }

    public BeforeConnect(ctx: ModuleSchemaLayoutBehavior, source: any, target: any, edgeData: any, repressErrors: boolean) {
        return true;
    }

    public BeforeStartConnect(ctx: ModuleSchemaLayoutBehavior, node: any, edgeType: string, listExistingModuleTypes: Function, listModuleOptions: Function) {
        return true;
    }

    public BeforeStartDetach(ctx: ModuleSchemaLayoutBehavior, endpoint: any, source: any, sourceId: any, connection: any) {
        return false;
    }

    public ConfigureRelationships(ev: any, ctx: ModuleSchemaLayoutBehavior, nodeId: string) {
        var incommingNodes = ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
            return node.data.SchemaType == 'incomming';
        });

        ctx.showJoinEditor(ctx, incommingNodes, nodeId, false, null, );
    }

    public ConfigureSchema(ev: any, ctx: ModuleSchemaLayoutBehavior, data: any) {
        var containsFunctions = false;
        var schemaId = ctx.ToolkitComponent.toolkit.getNode(data.id).data.Schema.id;

        ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
            return node.data.Schema && node.data.Schema.id == schemaId;
        }).forEach(function (schemaNode) {
            schemaNode.getAllEdges().forEach(function (edge) {
                var node = edge.target.getNode();
                if (edge.target.data.Functions && edge.target.data.Functions.length > 0)
                    containsFunctions = true;

                if (node.data.Functions && node.data.Functions.length > 0)
                    containsFunctions = true;

                if (node.data.JoinRelationships) {
                    Object.keys(node.data.JoinRelationships).forEach(function (key) {
                        if (node.data.JoinRelationships[key].Functions && node.data.JoinRelationships[key].Functions.length > 0)
                            containsFunctions = true;
                    });
                }
            });
        });

        let dialogRef = ctx.dialog.open(SchemaInputDialogComponent, {
            data: {
                ctx: ctx,
                DisableSchemaEdit: data.DisableSchemaEdit,
                Schema: data.Schema,
                Schemas: ctx.Schemas,
                SchemaType: data.SchemaType,
                SchemaChanged: ctx.SchemaChanged,
                CurrentModuleConnection: null,
                HangingIncommingSchemas: [],
                HangingOutgoingSchemas: [],
                OutgoingSchemas: ctx.ToolkitComponent.toolkit.getNodes().filter(function (item) { return item.data.SchemaType == 'outgoing' }),
                IncommingModules: ctx.IncommingModules,
                OutgoingModules: ctx.OutgoingModules,

                IncommingModuleID: data.IncommingModuleID,
                OutgoingModuleIDs: data.OutgoingModuleIDs,
                PropertyTypeChanged: ctx.PropertyTypeChanged,
                ContainsFunctions: containsFunctions,
                PropertyAdded: ctx.PropertyAdded,
                PropertyDeleted:
                    ctx.PropertyDeleted,
                title: 'Edit Schema - ' + ctx.ModuleName,
                FlowID: ctx.FlowID
            },
            width: '100%',
            height: '100%'
        });

        dialogRef.afterClosed().subscribe(result => ctx.schemaEditorClosed(ctx, result, data, null, data.id));
    }

    public ConfigureFilters(ev: any, ctx: ModuleSchemaLayoutBehavior, data: any) {
        ctx.showWhereFunctionEditor(ctx, data);
    }

    public ConfigureGroups(ev: any, ctx: ModuleSchemaLayoutBehavior, nodeId: any) {
        var targetNode = ctx.ToolkitComponent.toolkit.getNode(nodeId);

        let dialogRefGroups = ctx.dialog.open(SchemaGroupsDialogComponent, {
            data: {
                node: targetNode,
                title: 'Schema Groups/Timings - ' + ctx.ModuleName + " : " + targetNode.data.Name
            },
            width: '100%',
            height: '100%'
        });

        dialogRefGroups.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                targetNode.data.Groups = result.data.groups;
                targetNode.data.TumblingWindow = result.data.tumblingWindow;
                targetNode.data.TumblingInterval = result.data.tumblingInterval;
                targetNode.data.TumblingIntervalValue = result.data.tumblingIntervalValue;
                targetNode.data.Timestamp = result.data.timestamp;
            }

            ctx.isGroupNeeded(ctx.isGroupNeeded, targetNode, null, null);
        });
    }

    public ConnectionClick(ctx: ModuleSchemaLayoutBehavior, params: any) {
        ctx.showFunctionEditor(ctx, ctx.getPortConnectionSourceNodeIds(ctx, params.port), params.port);
    }

    public DeleteSchema(ev: any, ctx: ModuleSchemaLayoutBehavior, data: any) {
        let dialogRef = ctx.dialog.open(ConfirmDialogComponent, {
            data: { confirmText: "Delete '" + data.Name + "'? NOTE: This will remove all schema properties from all existing functions", title: 'Delete' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                ctx.ToolkitComponent.toolkit.getNode(data.id).getAllEdges().forEach(function (edge) {
                    ctx.auditFunctions(edge.source.id, edge.target.getNode(), edge.target.getNode(), edge, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                    ctx.ToolkitComponent.toolkit.removeEdge(edge);
                });

                ctx.RemoveNode(null, ctx, data.id, true);

                if (data.SchemaType == 'incomming') {
                    ctx.IncommingSchemaCount--;
                }
                else if (data.SchemaType == 'outgoing')
                    ctx.OutgoingSchemaCount--;
            }
        });
    }

    public EdgeAdded(ctx: ModuleSchemaLayoutBehavior, params: any) {
        if (params && params.addedByMouse) {
            setTimeout(function () {
                ctx.ToolkitComponent.toolkit.updateEdge(params.edge.id);
                ctx.showEdgeSetupModals(ctx, params.edge);
            }, 500);
        }
    }

    public EdgeMoved(ctx: ModuleSchemaLayoutBehavior, edge: any, oldTarget: any, newTarget: any) {
        setTimeout(function () {
            ctx.ToolkitComponent.toolkit.updateEdge(edge.id);
        }, 500);

        ctx.showFunctionEditor(ctx, ctx.getPortConnectionSourceNodeIds(ctx, newTarget), newTarget);
    }

    public ExportFlow() {
        var self = this;

        return this.ToolkitComponent.toolkit.exportData({
            type: "fathymIOSchema"
        });
    }

    public HideSchemaOptions() {

        if (!this.SchemaOptions.panelOpen) {
            this.SchemaOptionsVisible = false;

            this.SchemaOptions.close();
        }
    }

    public MapExistingFlow(schemaFlow: any, schemas: ForgeJSONSchema[], availableSchemaFunctions: SchemaFunctionDefinition[],
        incommingModules: any[], outgoingModules: any[], flowId: string, moduleName) {
        var self = this;

        this.ModuleName = moduleName;
        this.FlowID = flowId;
        this.SchemaFlow = schemaFlow;
        this.IncommingModules = incommingModules;
        this.Schemas = schemas;
        this.OutgoingModules = outgoingModules;
        //this.OutgoingModules.unshift({ id: "all", name: "All", type: "All" });
        this.AvailableSchemaFunctions = availableSchemaFunctions;

        if (schemaFlow) {
            this.ToolkitComponent.toolkit.load({
                type: "fathymIOSchema",
                data: schemaFlow,
                onload: function () {
                    self.ToolkitComponent.toolkit.getNodes().forEach(node => {
                        var schemas = self.Schemas.filter(function (item) {
                            return node.data.Schema && item.id == node.data.Schema.id;
                        });

                        self.registerFlowModuleCanvasEvents(node, self, false);
                        if (node.data.SchemaType == "incomming") {
                            self.IncommingSchemaCount++;
                            node.data.IncommingModules = self.IncommingModules;
                        }
                        else if (node.data.SchemaType == "outgoing") {
                            self.OutgoingSchemaCount++;
                            node.data.OutgoingModules = self.OutgoingModules;
                        }
                    });

                    self.ToolkitComponent.surface.repaintEverything();
                    setTimeout(function () {
                        self.ToolkitComponent.surface.zoomToFit();
                    }, 0);

                    setTimeout(function () {
                        self.processIncommingConnections(self);
                    }, 200);
                },
                parameters: {
                    Schemas: schemas,
                    AvailableSchemaFunctions: availableSchemaFunctions,
                    IsMappingFunctionNeeded: self.isMappingFunctionNeeded,
                    IsGroupNeeded: self.isGroupNeeded,
                    IsJoinFunctionNeeded: self.isJoinFunctionNeeded,
                    IsJoinPresent: self.isJoinPresent
                }
            });
        }
        else {
            self.processIncommingConnections(self);
        }
    }

    public NodeFactory(ctx: ModuleSchemaLayoutBehavior, type: string, data: any, callback: Function) {
        let dialogRef = ctx.dialog.open(SchemaInputDialogComponent, {
            data: {
                ctx: ctx,
                Schemas: ctx.Schemas,
                Schema: new ForgeJSONSchema,
                SchemaType: data.SchemaType,
                CurrentModuleConnection: ctx.CurrentModuleConnection,
                HangingIncommingSchemas: ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                    return node.data.SchemaType == "incomming"
                }).filter(function (node) {
                    return ctx.IncommingModules.filter(function (mod) {
                        return mod.id == node.data.IncommingModuleID
                    }).length == 0 && ctx.CurrentModuleConnection;
                }).map(function (node) { return { Node: node } }),
                HangingOutgoingSchemas: ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                    return node.data.SchemaType == "outgoing"
                }).filter(function (node) {
                    return ctx.OutgoingModules.filter(function (mod) {
                        return node.data.OutgoingModuleIDs.indexOf(mod.id) > -1;
                    }).length == 0 && ctx.CurrentModuleConnection;
                }).map(function (node) { return { Node: node } }),
                OutgoingSchemas: ctx.ToolkitComponent.toolkit.getNodes().filter(function (item) { return item.data.SchemaType == 'outgoing' }),
                IncommingModules: ctx.IncommingModules,
                OutgoingModules: ctx.OutgoingModules,
                SchemaChanged: ctx.SchemaChanged,
                ContainsFunctions: false,
                PropertyTypeChanged: ctx.PropertyTypeChanged,
                PropertyAdded: ctx.PropertyAdded,
                PropertyDeleted: ctx.PropertyDeleted,
                title: 'New Schema - ' + ctx.ModuleName,
                FlowID: ctx.FlowID
            },
            width: '100%',
            height: '100%'
        });

        dialogRef.afterClosed().subscribe(result => ctx.schemaEditorClosed(ctx, result, data, callback, null));
    }

    public NodeResolver(typeId: string) {
        return FlowTableComponent;
    }

    public PropertyAdded(ctx: ModuleSchemaLayoutBehavior, schema: ForgeJSONSchema) {
        setTimeout(function () {
            ctx.ToolkitComponent.surface.repaintEverything();
        }, 800);
    }

    public PropertyTypeChanged(ctx: ModuleSchemaLayoutBehavior, schema: ForgeJSONSchema, propertyId: string) {
        if (!propertyId || !schema || !schema.id || propertyId.startsWith("temp"))
            return;

        var prop = ctx.flattenSchemaProperties(schema).filter(function (item) {
            return item.id == propertyId;
        });

        if (prop) {
            var nodes = ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                return node.data.Schema && node.data.Schema.id == schema.id
            });

            nodes.forEach(function (node) {
                node.data.Schema.properties[Object.keys(node.data.Schema.properties).filter(function (key) {
                    return node.data.Schema.properties[key].id == propertyId;
                })[0]].type = prop[0].type;

                var port = node.getPort(propertyId);
                port.data.DataType = prop[0].type;

                if (node.getPort(propertyId).data.DataType == "object")
                    ctx.mapPortsFromNodeSchemaToRemove(ctx, node.id, schema);

                if (node.data.SchemaType == "incomming") {
                    node.getPort(propertyId).getAllEdges().forEach(function (edge) {
                        ctx.auditFunctions(propertyId, edge.target.getNode(), edge.source.getNode(), null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);
                    });
                }
                else if (node.data.SchemaType == "outgoing") {
                    ctx.auditFunctions(propertyId, node, node, null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);
                }
            });


        }
    }

    public PropertyDeleted(ctx: ModuleSchemaLayoutBehavior, schema: ForgeJSONSchema) {
        if (schema.id) {
            var nodes = ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                return node.data.Schema && node.data.Schema.id == schema.id;
            });

            if (nodes && nodes.length > 0) {
                nodes.forEach(function (node) {
                    ctx.mapPortsFromNodeSchemaToRemove(ctx, node.id, schema);
                });
            }
        }

        setTimeout(function () {
            ctx.ToolkitComponent.surface.repaintEverything();
        }, 800);
    }

    public RemoveEdge(ctx: ModuleSchemaLayoutBehavior, edge: any) {
        let dialogRef = ctx.dialog.open(ConfirmDialogComponent, {
            data: { confirmText: "Delete edge between '" + edge.source.data.Text + "' and '" + edge.target.data.Text + "'? NOTE: This will remove the property from all existing functions", title: 'Delete' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                ctx.auditFunctions(edge.source.id, edge.target.getNode(), edge.target.getNode(), edge, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                ctx.ToolkitComponent.toolkit.removeEdge(edge);
            }
        });
    }

    public SchemaChanged(schema: ForgeJSONSchema) {

    }

    public SchemaSelected(ev: MatSelectChange) {
        this.AddNode(ev.value);

        this.SchemaOptions.writeValue('');
    }

    public SetSchemaSavedCallback(parentCTX: any, callback: Function) {
        this.ParentCTX = parentCTX;
        this.schemaSavedCallback = callback;
    }

    public SetCloseModalCallback(parentCTX: any, callback: Function) {
        this.ParentCTX = parentCTX;
        this.closeModalCallback = callback;
    }

    public ShowSchemaOptions(ev: Event) {
        this.SchemaOptionsVisible = true;

        this.SchemaOptions.open();

        ev.preventDefault();
    }

    //	Helpers
    protected addColumn(ctx: ModuleSchemaLayoutBehavior, nodeId: string, columnId: string, name: string, type: string) {
        var portType = "default";
        var node = ctx.ToolkitComponent.toolkit.getNode(nodeId);

        if (node.data.SchemaType == "incomming")
            portType = "source";
        else if (node.data.SchemaType == "outgoing")
            portType = "target";

        ctx.ToolkitComponent.toolkit.getNode(nodeId).addPort({
            id: columnId.replace(" ", "_").toLowerCase(),
            DataType: type,
            Text: name,
            type: portType
        });

        setTimeout(function () {
            var port = ctx.ToolkitComponent.toolkit.getNode(nodeId).getPort(columnId);

            ctx.ToolkitComponent.toolkit.updateNode(nodeId);
            ctx.ToolkitComponent.toolkit.updatePort(port.id);
        }, 500);
    }

    protected flattenSchemaProperties(schema: ForgeJSONSchema) {
        var properties = [];

        if (!schema.properties)
            return properties;

        Object.keys(schema.properties).forEach(key => {
            properties.push(schema.properties[key]);

            if (schema.properties[key].type == 'object') {
                var innerProps = this.flattenSchemaProperties(schema.properties[key].oneOf[0]);
                innerProps.forEach(prop => {
                    properties.push(prop);
                })
            }
        });

        return properties;
    }

    protected getFullPropertyName(schema: ForgeJSONSchema, id: string) {
        var names = [];

        if (!schema.properties)
            return names;

        Object.keys(schema.properties).forEach(key => {
            if (schema.properties[key].type == 'object') {
                var innerNames = this.getFullPropertyName(schema.properties[key].oneOf[0], id);
                if (innerNames.length > 0) {
                    innerNames.forEach(function (name) {
                        names.push(name);
                    });
                    names.push(schema.properties[key].title);
                }
            }
            else if (schema.properties[key].id == id) {
                names.push(schema.properties[key].title);
            }
        });

        return names;
    }

    protected getLowestNodePointBySchemaType(schemaType: string) {
        var nodes = this.ToolkitComponent.toolkit.getNodes();
        var currentLow = 0;

        nodes.filter(x => {
            return x.data.SchemaType == schemaType
        }).forEach(node => {
            var current = node.data.Top + (<HTMLElement>document.querySelector('[data-jtk-node-id="' + node.id + '"]')).offsetHeight;
            if (current > currentLow)
                currentLow = current;
        });

        return currentLow;
    }

    protected getPortConnectionSourceNodeIds(ctx: ModuleSchemaLayoutBehavior, port: any) {
        var nodeIds = [];

        var edges = port.getNode().getAllEdges();

        edges.forEach(function (edge) {
            var nodeId = edge.source.getNode().id;

            if (nodeIds.indexOf(nodeId) == -1)
                nodeIds.push(nodeId);
        });

        return nodeIds;
    }

    protected isJoinFunctionNeeded(edge: any, deletedEdge: any) {
        var port = edge.target;
        var inNodes = [];

        var edges = port.getNode().getAllEdges();

        if (deletedEdge) {
            edges = edges.filter(function (e) {
                return e.data.id != deletedEdge.data.id;
            });
        }

        edges.forEach(function (edge) {
            if (inNodes.indexOf(edge.source.getNode().id) == -1)
                inNodes.push(edge.source.getNode().id);
        });


        if (inNodes.length > 1)
            return true;
        else
            return false;
    }

    protected isJoinPresent(node: any) {
        var inNodes = [];

        node.getPorts().forEach(function (port) {
            port.getEdges().forEach(function (edge) {
                if (inNodes.indexOf(edge.source.getNode().id) == -1)
                    inNodes.push(edge.source.getNode().id);
            });
        });

        var correct = true;

        if (node.data.JoinRelationships) {
            inNodes.forEach(function (sourceNodeId) {
                if (!node.data.JoinRelationships[sourceNodeId] || !node.data.JoinRelationships[sourceNodeId].Relationship ||
                    node.data.JoinRelationships[sourceNodeId].Relationship == "none" ||
                    !(node.data.JoinRelationships[sourceNodeId].SchemaFunctionsReturnSource || node.data.JoinRelationships[sourceNodeId].Relationship == "main"))
                    correct = false;
            });
        }
        else
            return false;

        return correct;
    }

    protected isGroupNeeded(isGroupNeeded: Function, node: any, currentFunction: any, currentFunctionPort: any) {
        var portsWithAgg = [];
        var existingFunction;
        var existingPort;
        var toAdd = [];

        if (currentFunction) {
            if (currentFunction.Function.FunctionType == 'Aggregate')
                portsWithAgg.push(currentFunctionPort.data.id);
            else {
                currentFunction.Properties.forEach(function (prop) {
                    if (prop.Source == 'function') {
                        node.getPorts().forEach(function (funcPort) {
                            if (funcPort.data.Functions) {
                                funcPort.data.Functions.forEach(function (portFunc) {
                                    if (portFunc.ID == prop.Property.id) {
                                        existingFunction = portFunc;
                                        existingPort = funcPort;
                                    }
                                });
                            }
                        });

                        if (existingFunction) {
                            toAdd = isGroupNeeded(isGroupNeeded, node, existingFunction, existingPort);
                            if (toAdd && toAdd.length > 0) {
                                toAdd.forEach(function (add) {
                                    portsWithAgg.push(add);
                                });
                            }
                        }
                    }
                });
            }
        }
        else {
            node.getPorts().forEach(function (newPort) {
                var newSource = newPort.data.SchemaFunctionsReturnSource;
                var newId = newPort.data.SchemaFunctionsReturnSourceID;

                if (newSource && newSource == 'function') {

                    node.getPorts().forEach(function (funcPort) {
                        if (funcPort.data.Functions) {
                            funcPort.data.Functions.forEach(function (portFunc) {
                                if (portFunc.ID == newId) {
                                    existingFunction = portFunc;
                                    existingPort = funcPort;
                                }
                            });
                        }
                    });

                    if (existingFunction) {
                        toAdd = isGroupNeeded(isGroupNeeded, node, existingFunction, existingPort);
                        if (toAdd && toAdd.length > 0) {
                            toAdd.forEach(function (add) {
                                portsWithAgg.push(add);
                            });
                        }
                    }
                }
            });

            //Now you should have a list of all ports in the node that have aggregates
            var groups = [];
            if (node.data.Groups && node.data.Groups.length > 0)
                groups = node.data.Groups;
            var aggs = portsWithAgg;

            node.data.GroupError = false;

            if (aggs.length > 0 || groups.length > 0) {
                node.getPorts().forEach(function (port) {
                    if ((groups.indexOf(port.id) == -1 && aggs.indexOf(port.id) == -1) || (groups.indexOf(port.id) > -1 && aggs.indexOf(port.id) > -1))
                        node.data.GroupError = true;
                });
            }
        }

        //if (node.data.SchemaType == "outgoing" && !node.data.Timestamp)
        //    node.data.TimestampError = true;
        //else if (node.data.SchemaType == "outgoing" && node.data.Timestamp)
        //    node.data.TimestampError = false;

        if (node.data.Groups) {
            var removeGroups = [];

            node.data.Groups.forEach(function (item) {
                var existing = Object.keys(node.data.Schema.properties).filter(function (key) {
                    return node.data.Schema.properties[key].id == item;
                })[0];

                if (!existing)
                    removeGroups.push(item);
            });

            removeGroups.forEach(function (item) {
                node.data.Groups.splice(node.data.Groups.indexOf(item), 1);
            });
        }

        return portsWithAgg;
    }

    protected isMappingFunctionNeeded(edge: any, deleted: boolean) {
        function recurseSchemaToFindProp(schema: ForgeJSONSchema, id: string) {
            var self = this;
            var prop = null;

            Object.keys(schema.properties).forEach(function (key) {
                if (schema.properties[key].id == id)
                    prop = schema.properties[key];
                else if (schema.properties[key].type == 'object') {
                    var recurseProp = recurseSchemaToFindProp(schema.properties[key].oneOf[0], id);

                    if (recurseProp)
                        prop = recurseProp;
                }
            });

            return prop;
        }

        var functionNeeded = false;

        var target = edge.target;

        if (target.getAllEdges().length > 1)
            functionNeeded = true;

        if (!deleted) {
            var inSchema = edge.source.getNode().data.Schema;

            var inProp = recurseSchemaToFindProp(inSchema, edge.source.id);

            if (!inProp)
                return false;

            var inType = inProp.type;

            var outSchema = edge.target.getNode().data.Schema;

            var outProp = recurseSchemaToFindProp(outSchema, edge.target.id);

            if (!outProp)
                return false;

            var outType = outProp.type;

            if (inType != outType) {
                if (!(inType == "null" && outType != "notnull"))
                    functionNeeded = true;
                else if (!(inType == "notnull" && outType != "null"))
                    functionNeeded = true;
                else if (!(outType == "null" && inType != "notnull"))
                    functionNeeded = true;
                else if (!(outType == "notnull" && inType != "null"))
                    functionNeeded = true;
                else
                    functionNeeded = true;
            }
        }

        return functionNeeded;
    }

    protected mapPortsFromNodeSchemaToAdd(ctx: ModuleSchemaLayoutBehavior, nodeId: string, schema: ForgeJSONSchema) {
        ctx.flattenSchemaProperties(schema).forEach(prop => {
            var existing = ctx.ToolkitComponent.toolkit.getNode(nodeId).getPorts().filter(function (item) {
                return item.data.id == prop.id;
            });

            if (!existing || existing.length == 0) {
                if (!prop.id)
                    prop.id = jsPlumbToolkitUtil.uuid();
                ctx.addColumn(ctx, nodeId, prop.id, prop.title, <string>prop.type);
            }
        });
    }

    protected mapPortsFromNodeSchemaToRemove(ctx: ModuleSchemaLayoutBehavior, nodeId: string, schema: ForgeJSONSchema) {
        var portsToRemove = [];

        ctx.ToolkitComponent.toolkit.getNode(nodeId).getPorts().forEach(port => {
            var existing = ctx.flattenSchemaProperties(schema).filter(function (item) {
                return item.id == port.data.id && item.id;
            });

            if (!existing || existing.length == 0)
                portsToRemove.push(port.data.id);
        });

        var edges = ctx.ToolkitComponent.toolkit.getAllEdges();

        portsToRemove.forEach(port => {
            var edgesToRemove = [];

            edges.filter(function (edge) {
                return edge.source.id == port || edge.target.id == port;
            }).forEach(function (edge) {
                ctx.auditFunctions(edge.source.id, edge.target.getNode(), edge.target.getNode(), edge, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                ctx.ToolkitComponent.toolkit.removeEdge(edge, edge.source);
            });

            ctx.removeColumn(ctx, nodeId, port);
        });
    }

    protected processIncommingConnections(self: ModuleSchemaLayoutBehavior) {
        var nodes = self.ToolkitComponent.toolkit.getNodes();
        var inNodes = nodes.filter(function (item) {
            return item.data.SchemaType == "incomming";
        });
        var outNodes = nodes.filter(function (item) {
            return item.data.SchemaType == "outgoing";
        });

        var forceIn = null;
        self.IncommingModules.forEach(function (inMod) {
            if (!forceIn) {
                var match = inNodes.filter(function (node) {
                    return node.data.IncommingModuleID == inMod.id;
                });

                if (!match || match.length == 0) {
                    forceIn = inMod;
                }
            }
        });

        var forceOut = null;
        self.OutgoingModules.filter(function (mod) { return mod.id != 'all' }).forEach(function (outMod) {
            if (!forceOut) {
                var match = outNodes.filter(function (node) {
                    return node.data.OutgoingModuleIDs.indexOf(outMod.id) > -1;
                });

                if (!match || match.length == 0) {
                    forceOut = outMod;
                }
            }
        });

        if (forceIn) {
            self.CurrentModuleConnection = forceIn;
            self.AddNode("incomming");
        }
        else if (forceOut) {
            self.CurrentModuleConnection = forceOut;
            self.AddNode("outgoing");
        }
        else
            self.CurrentModuleConnection = null;
    }

    protected removeColumn(ctx: ModuleSchemaLayoutBehavior, nodeId: string, columnId: string) {
        var edgesToRemove = ctx.ToolkitComponent.toolkit.getAllEdges().filter(function (item) {
            return item.source.id == columnId || item.target.id == columnId;
        });

        edgesToRemove.forEach(edge => {
            ctx.ToolkitComponent.toolkit.removeEdge(edge);

            var lastingEdges = edge.target.getNode().getAllEdges();

            if (ctx.isMappingFunctionNeeded(edge, true) && !edge.target.data.SchemaFunctionsReturnSource)
                edge.target.data.MappingFunctionNeeded = true;
            else
                edge.target.data.MappingFunctionNeeded = false;

            if (lastingEdges && lastingEdges.length > 0) {

                if (ctx.isJoinFunctionNeeded(lastingEdges[0], null) && !ctx.isJoinPresent(lastingEdges[0].target.getNode()))
                    lastingEdges[0].target.getNode().data.JoinFunctionNeeded = true;
                else
                    lastingEdges[0].target.getNode().data.JoinFunctionNeeded = false;
            }
        });

        ctx.ToolkitComponent.toolkit.getNode(nodeId).removePort(columnId);

        ctx.isGroupNeeded(ctx.isGroupNeeded, ctx.ToolkitComponent.toolkit.getNode(nodeId), null, null);
    }

    protected auditFunctions(propertyId: string, functionsNode: any, triggerNode: any, deletedEdge: any,
        auditFunctionsRecursive: Function, isMappingFunctionNeeded: Function,
        isJoinFunctionNeeded: Function, isJoinPresent: Function, isGroupNeeded: Function) {
        var functions = new Array<SchemaFunction>();
        var functionsPorts = functionsNode.getPorts();
        var functionsPort;

        if (!functionsPorts || functionsPorts.length == 0)
            return;

        var self = this;

        //Mapping functions recurse
        functionsPorts.forEach(function (functionsPort) {
            functionsPort.data.Functions = auditFunctionsRecursive(propertyId, functionsNode, triggerNode, deletedEdge,
                auditFunctionsRecursive, isMappingFunctionNeeded, isJoinFunctionNeeded, isJoinPresent,
                functionsPort.data.Functions, self);
            if (functionsPort.data.Functions) {
                functionsPort.data.MappingFunctionError = functionsPort.data.Functions.filter(function (f) {
                    return f.ExtraData.HasErrors;
                }).length > 0;
            }
        });

        //Filter functions recurse
        functionsNode.data.Functions = auditFunctionsRecursive(propertyId, functionsNode, triggerNode, deletedEdge,
            auditFunctionsRecursive, isMappingFunctionNeeded, isJoinFunctionNeeded, isJoinPresent,
            functionsNode.data.Functions, self);
        if (functionsNode.data.Functions) {
            functionsNode.data.FilterFunctionError = functionsNode.data.Functions.filter(function (f) {
                return f.ExtraData.HasErrors;
            }).length > 0;
        }

        //Join Functions
        if (deletedEdge) {
            var existingEdges = deletedEdge.source.getNode().getAllEdges().filter(function (edge) {
                return edge.data.id != deletedEdge.data.id && edge.target.getNode().id == deletedEdge.target.getNode().id;
            });

            if (existingEdges.length == 0) {
                if (functionsNode.data.JoinRelationships && functionsNode.data.JoinRelationships[deletedEdge.source.getNode().id]) {
                    var isMain = functionsNode.data.JoinRelationships[deletedEdge.source.getNode().id].Relationship == "main";

                    delete functionsNode.data.JoinRelationships[deletedEdge.source.getNode().id];

                    if (Object.keys(functionsNode.data.JoinRelationships).length > 1) {
                        if (isMain) {
                            functionsNode.data.JoinRelationships[Object.keys(functionsNode.data.JoinRelationships)[0]].Relationship = "main";
                            functionsNode.data.JoinRelationships[Object.keys(functionsNode.data.JoinRelationships)[0]].Functions = [];
                        }
                    }
                    else {
                        functionsNode.data.JoinRelationships = null;
                    }
                }
            }
        }

        if (functionsNode.data.JoinRelationships) {
            Object.keys(functionsNode.data.JoinRelationships).forEach(function (key) {
                //Join functions recurse
                functionsNode.data.JoinRelationships[key].Functions = auditFunctionsRecursive(propertyId, functionsNode, triggerNode, deletedEdge,
                    auditFunctionsRecursive, isMappingFunctionNeeded, isJoinFunctionNeeded, isJoinPresent,
                    functionsNode.data.JoinRelationships[key].Functions, self);
                if (functionsNode.data.JoinRelationships[key].Functions) {
                    functionsNode.data.JoinRelationships[key].JoinFunctionError = functionsNode.data.JoinRelationships[key].Functions.filter(function (f) {
                        return f.ExtraData.HasErrors;
                    }).length > 0;
                }

                if (functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID) {
                    //Check if return is a mapping function (return functions can only be of the same type OR mapping)
                    var existingFunction = functionsNode.getPorts().filter(function (port) {
                        return port.data.Functions && port.data.Functions.filter(function (f) {
                            return f.ID == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                        }).length > 0;
                    }).map(function (port) {
                        return port.data.Functions.filter(function (f) {
                            return f.ID == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                        })[0];
                    });

                    //Check if return is join function (iterate over all join functions to see if function exists)
                    if (!existingFunction || existingFunction.length == 0) {
                        existingFunction = Object.keys(functionsNode.data.JoinRelationships).filter(function (innerKey) {
                            var funcs = functionsNode.data.JoinRelationships[innerKey].Functions;

                            if (!funcs)
                                return false;

                            var validFuncs = funcs.filter(function (item) {
                                return item.ID == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                            });

                            return validFuncs && validFuncs.length > 0;
                        }).map(function (innerKey) {
                            return functionsNode.data.JoinRelationships[innerKey].Functions.filter(function (item) {
                                return item.ID == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                            })[0];
                        });
                    }

                    //Check if triggering node has the return source id property
                    var existingProp = triggerNode.getPorts().filter(function (item) {
                        return item.id == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                    });

                    //Need to get the actual schema property
                    var schemaProp;

                    //Check if functions(target) node has the return source id property
                    if (!existingProp || existingProp.length == 0) {
                        existingProp = functionsNode.getPorts().filter(function (item) {
                            return item.id == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                        });

                        //Schema prop must be on the functions node
                        schemaProp = Object.keys(functionsNode.data.Schema.properties).filter(function (innerKey) {
                            return functionsNode.data.Schema.properties[innerKey].id == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                        });
                    }
                    else {
                        //Schema prop must be on the trigger node
                        schemaProp = Object.keys(triggerNode.data.Schema.properties).filter(function (innerKey) {
                            return triggerNode.data.Schema.properties[innerKey].id == functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID;
                        });
                    }

                    //If no prop or function exists, or if its the wrong type, remove it
                    if ((existingFunction.length == 0 && existingProp.length == 0) ||
                        (existingFunction.length > 0 && !existingFunction[0].ReturnValueType &&
                            existingFunction[0].Function.ReturnType != "boolean") ||
                        (existingFunction.length > 0 && existingFunction[0].ReturnValueType &&
                            existingFunction[0].ReturnValueType != "boolean") ||
                        (existingProp.length > 0 && schemaProp &&
                            existingProp[0].type != schemaProp.type)) {
                        functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSource = null;
                        functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnSourceID = null;
                        functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnValue = null;
                        functionsNode.data.JoinRelationships[key].SchemaFunctionsReturnValueType = null;
                    }
                }
            });

            functionsNode.data.JoinFunctionError = Object.keys(functionsNode.data.JoinRelationships).filter(function (key) {
                return functionsNode.data.JoinRelationships[key].JoinFunctionError;
            }).length > 0;
        }
        else
            functionsNode.data.JoinFunctionError = false;

        //Mapping functions return source
        functionsPorts.forEach(function (functionsPort) {
            if (functionsPort.data.SchemaFunctionsReturnSourceID) {
                //Check if return is a mapping function (return functions can only be of the same type OR mapping)
                var existingFunction = functionsNode.getPorts().filter(function (port) {
                    return port.data.Functions && port.data.Functions.filter(function (f) {
                        return f.ID == functionsPort.data.SchemaFunctionsReturnSourceID;
                    }).length > 0;
                }).map(function (port) {
                    return port.data.Functions.filter(function (f) {
                        return f.ID == functionsPort.data.SchemaFunctionsReturnSourceID;
                    })[0];
                });

                //Check if triggering node has the return source id property
                var existingProp = triggerNode.getPorts().filter(function (item) {
                    return item.id == functionsPort.data.SchemaFunctionsReturnSourceID;
                });

                //Need to get the actual schema property
                var schemaProp;

                //Check if functions(target) node has the return source id property
                if (!existingProp || existingProp.length == 0) {
                    existingProp = functionsNode.getPorts().filter(function (item) {
                        return item.id == functionsPort.data.SchemaFunctionsReturnSourceID;
                    });

                    //Schema prop must be on the functions node
                    schemaProp = Object.keys(functionsNode.data.Schema.properties).filter(function (key) {
                        return functionsNode.data.Schema.properties[key].id == functionsPort.data.SchemaFunctionsReturnSourceID;
                    });
                }
                else {
                    //Schema prop must be on the trigger node
                    schemaProp = Object.keys(triggerNode.data.Schema.properties).filter(function (key) {
                        return triggerNode.data.Schema.properties[key].id == functionsPort.data.SchemaFunctionsReturnSourceID;
                    });
                }

                if (functionsPort.data.SchemaFunctionsReturnSourceID == propertyId ||
                    (existingFunction.length == 0 && existingProp.length == 0) ||
                    (existingFunction.length > 0 && !existingFunction[0].ReturnValueType &&
                        existingFunction[0].Function.ReturnType != functionsPort.data.DataType) ||
                    (existingFunction.length > 0 && existingFunction[0].ReturnValueType &&
                        existingFunction[0].ReturnValueType != functionsPort.data.DataType) ||
                    (existingProp.length > 0 && schemaProp &&
                        existingProp[0].Function.ReturnType != schemaProp.type)) {
                    functionsPort.data.SchemaFunctionsReturnSource = null;
                    functionsPort.data.SchemaFunctionsReturnSourceID = null;
                    functionsPort.data.SchemaFunctionsReturnValue = null;
                    functionsPort.data.SchemaFunctionsReturnValueType = null;
                }
            }
        });

        //Filter functions return source
        if (functionsNode.data.SchemaFunctionsReturnSourceID) {
            //Check if return is a mapping function (return functions can only be of the same type OR mapping)
            var existingFunction = functionsNode.getPorts().filter(function (port) {
                return port.data.Functions && port.data.Functions.filter(function (f) {
                    return f.ID == functionsNode.data.SchemaFunctionsReturnSourceID;
                }).length > 0;
            }).map(function (port) {
                return port.data.Functions.filter(function (f) {
                    return f.ID == functionsNode.data.SchemaFunctionsReturnSourceID;
                })[0];
            });

            //Check if return is filter function
            if (!existingFunction || existingFunction.length == 0) {
                existingFunction = functionsNode.data.Functions.filter(function (item) {
                    return item.ID == functionsNode.data.SchemaFunctionsReturnSourceID;
                });
            }

            //Check if triggering node has the return source id property
            var existingProp = triggerNode.getPorts().filter(function (item) {
                return item.id == functionsNode.data.SchemaFunctionsReturnSourceID;
            });

            //Need to get the actual schema property
            var schemaProp;

            //Check if functions(target) node has the return source id property
            if (!existingProp || existingProp.length == 0) {
                existingProp = functionsNode.getPorts().filter(function (item) {
                    return item.id == functionsNode.data.SchemaFunctionsReturnSourceID;
                });

                //Schema prop must be on the functions node
                schemaProp = Object.keys(functionsNode.data.Schema.properties).filter(function (key) {
                    return functionsNode.data.Schema.properties[key].id == functionsNode.data.SchemaFunctionsReturnSourceID;
                });
            }
            else {
                //Schema prop must be on the trigger node
                schemaProp = Object.keys(triggerNode.data.Schema.properties).filter(function (key) {
                    return triggerNode.data.Schema.properties[key].id == functionsNode.data.SchemaFunctionsReturnSourceID;
                });
            }

            if (functionsNode.data.SchemaFunctionsReturnSourceID == propertyId ||
                (existingFunction.length == 0 && existingProp.length == 0) ||
                (existingFunction.length > 0 && !existingFunction[0].ReturnValueType &&
                    existingFunction[0].Function.ReturnType != "boolean") ||
                (existingFunction.length > 0 && existingFunction[0].ReturnValueType &&
                    existingFunction[0].ReturnValueType != "boolean") ||
                (existingProp.length > 0 && schemaProp &&
                    existingProp[0].Function.ReturnType != schemaProp.type)) {
                functionsNode.data.SchemaFunctionsReturnSource = null;
                functionsNode.data.SchemaFunctionsReturnSourceID = null;
                functionsNode.data.SchemaFunctionsReturnValue = null;
                functionsNode.data.SchemaFunctionsReturnValueType = null;
            }
        }

        //Error checking for node
        var lastingEdges = functionsNode.getAllEdges();
        if (deletedEdge) {
            lastingEdges = lastingEdges.filter(function (edge) {
                return edge.data.id != deletedEdge.data.id;
            });
        }

        if (lastingEdges && lastingEdges.length > 0) {
            lastingEdges.forEach(function (edge) {
                if (isMappingFunctionNeeded(edge, (deletedEdge && deletedEdge.data.id == edge.data.id)) && !edge.target.data.SchemaFunctionsReturnSource)
                    edge.target.data.MappingFunctionNeeded = true;
                else
                    edge.target.data.MappingFunctionNeeded = false;

                if (isJoinFunctionNeeded(edge, deletedEdge) && !isJoinPresent(edge.target.getNode()))
                    edge.target.getNode().data.JoinFunctionNeeded = true;
                else
                    edge.target.getNode().data.JoinFunctionNeeded = false;
            });
        }

        var inNodes = [];
        var edges = functionsNode.getAllEdges();

        if (deletedEdge) {
            edges = edges.filter(function (edge) {
                return edge.data.id != deletedEdge.data.id;
            });
        }

        edges.forEach(function (edge) {
            var id = edge.source.getNode().id;
            if (inNodes.indexOf(id) == -1)
                inNodes.push(id);
        });

        if (inNodes.length > 1)
            functionsNode.data.ShowJoinLink = true;
        else
            functionsNode.data.ShowJoinLink = false;

        //Group audit
        if (isGroupNeeded)
            isGroupNeeded(isGroupNeeded, functionsNode, null, null);
    }
    protected auditFunctionsRecursive(id: string, functionsNode: any, triggerNode: any, deletedEdge: any,
        auditFunctionsRecursive: Function, isMappingFunctionNeeded: Function, isJoinFunctionNeeded: Function,
        isJoinPresent: any, functions: SchemaFunction[], ctx: any) {
        var funcsToRemove = new Array<string>();
        var self = this;

        if (functions) {
            functions.forEach(function (func) {
                //func.ExtraData.HasErrors = false;
                var initialCount = func.Properties.length;

                if (func.Function.FunctionType == "Standard") {
                    func.Properties = func.Properties.filter(function (prop) {
                        return prop.Property && prop.Property.id != id
                    });

                    var idx = 0;
                    func.Properties.forEach(function (prop) {
                        prop.Order = idx;
                        idx++;
                    });

                    if (func.Properties.length != initialCount)
                        func.ExtraData.Refactored = true;

                    if (func.Properties.length < func.Function.MinProperties)
                        func.ExtraData.HasErrors = true;
                }
                else {
                    var propsToNew = [];
                    func.Properties.filter(function (prop) {
                        return prop.Property && prop.Property.id == id
                    }).forEach(function (item) {
                        propsToNew.push(item.Property.id);
                    });;

                    for (var i = 0; i < func.Properties.length; i++) {
                        if (func.Properties[i].Property && propsToNew.indexOf(func.Properties[i].Property.id) > -1) {
                            func.Properties[i] = new SchemaFunctionProperty();
                            func.ExtraData.Refactored = true;
                            func.ExtraData.HasErrors = true;
                        }
                    }
                }

                if (initialCount > 0 && (func.Properties.length == 0 || func.Properties.filter(function (item) { return !item.Property }).length == initialCount))
                    funcsToRemove.push(func.ID);

                if (func.ReturnTrueSourceID && func.ReturnTrueSourceID == id) {
                    func.ReturnTrueSource = null;
                    func.ReturnTrueSourceID = null;
                    func.ReturnTrueValue = null;
                    func.ReturnValueType = null;
                    func.ExtraData.Refactored = true;
                    func.ExtraData.HasErrors = true;
                }
                if (func.ReturnFalseSourceID && func.ReturnFalseSourceID == id) {
                    func.ReturnFalseSource = null;
                    func.ReturnFalseSourceID = null;
                    func.ReturnFalseValue = null;
                    func.ReturnValueType = null;
                    func.ExtraData.Refactored = true;
                    func.ExtraData.HasErrors = true;
                }
            });

            functions = functions.filter(function (func) {
                return funcsToRemove.indexOf(func.ID) == -1;
            })

            funcsToRemove.forEach(function (item) {
                functions = auditFunctionsRecursive(item, functionsNode, triggerNode, deletedEdge,
                    auditFunctionsRecursive, isMappingFunctionNeeded, isJoinFunctionNeeded, isJoinPresent,
                    functions, ctx);

                ctx.auditFunctions(item, functionsNode, triggerNode, deletedEdge,
                    auditFunctionsRecursive, isMappingFunctionNeeded, isJoinFunctionNeeded, isJoinPresent);
            });

            var sortedFuncs = functions.sort(function (a, b) { return a.Order - b.Order });
            for (var i = 0; i < sortedFuncs.length; i++) {
                sortedFuncs[i].Order = i;
            }

            return sortedFuncs;
        }
        return functions;
    }

    protected registerFlowModuleCanvasEvents(node: any, self: ModuleSchemaLayoutBehavior, force: boolean) {
        var events: FlowEventMethod[] = [];

        events.push(<FlowEventMethod>
            {
                Data: node.data,
                Event: "click",
                Function: self.ConfigureSchema,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div.name > div > div.configure-schema"
            });

        events.push(<FlowEventMethod>
            {
                Data: node.id,
                Event: "click",
                Function: self.ConfigureRelationships,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div.name > div > div.configure-relationships"
            });

        events.push(<FlowEventMethod>
            {
                Data: node.data,
                Event: "click",
                Function: self.DeleteSchema,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div.name > div.delete"
            });

        events.push(<FlowEventMethod>
            {
                Data: node.id,
                Event: "click",
                Function: self.ConfigureFilters,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div.name > div > div.configure-filters"
            });

        events.push(<FlowEventMethod>
            {
                Data: node.id,
                Event: "click",
                Function: self.ConfigureGroups,
                Identifier: "[data-jtk-node-id='" + node.id + "'] > div.name > div > div.configure-groups"
            });

        super.registerCanvasEvents(events, self, force);
    }

    protected registerFlowModuleToolkitEvents(self: ModuleSchemaLayoutBehavior) {
        var events = [];
        super.registerToolkitEvents(events, self);
    }

    protected schemaEditorClosed(ctx: ModuleSchemaLayoutBehavior, result: any, data: any, callback: Function, nodeId: string) {
        if (result && result.confirm) {

            var doRelayout = false;

            if (result.data.UsingExistingOutgoing && ctx.CurrentModuleConnection) {
                var existingNode = ctx.ToolkitComponent.toolkit.getNode(result.data.UsingExistingOutgoing)
                if (!existingNode.data.OutgoingModuleIDs)
                    existingNode.data.OutgoingModuleIDs = [];

                existingNode.data.OutgoingModuleIDs.push(ctx.CurrentModuleConnection.id);
                ctx.CurrentModuleConnection = null
                return;
            }

            ctx.CurrentModuleConnection = null;

            if (result.data.UsingHangingSchema) {
                data.id = result.data.UsingHangingSchema;
            }

            if (!result.data.DisableSchemaEdit)
                data.Name = result.data.Schema.title.toString();
            else if (!result.data.UsingHangingSchema && !result.data.UsingExistingOutgoing && result.data.Schema.sourceTitle)
                data.Name = result.data.Schema.sourceTitle.toString();

            if (!result.data.UsingHangingSchema) {
                if ((data.Top || data.Top == 0) && (data.Left || data.Left == 0)) {
                    ctx.ToolkitComponent.toolkit.getNodes().forEach(function (node) {
                        var overlaps = [null];

                        while (overlaps.length > 0) {
                            overlaps = ctx.ToolkitComponent.toolkit.getNodes().filter(function (item) {
                                return (node.id != item.id
                                    && (node.data.Top >= item.data.Top && node.data.Top <= (item.data.Top + (<HTMLElement>document.querySelector('[data-jtk-node-id="' + item.id + '"]')).offsetHeight))
                                    && (node.data.Left >= item.data.Left && node.data.Left <= (item.data.Left + (<HTMLElement>document.querySelector('[data-jtk-node-id="' + item.id + '"]')).offsetWidth)));
                            });

                            if (overlaps.length > 0) {
                                doRelayout = true;
                                var item = overlaps[0];
                                node.data.Top = (item.data.Top + (<HTMLElement>document.querySelector('[data-jtk-node-id="' + item.id + '"]')).offsetHeight) + 50;
                            }
                        }
                    });
                }
                else if (data.SchemaType == "incomming") {
                    var currentLow = this.getLowestNodePointBySchemaType("incomming");
                    if (currentLow > 0)
                        data.Top = currentLow + 50;
                    else
                        data.Top = 0;
                    data.Left = 0;
                    this.IncommingSchemaCount++;
                }
                else if (data.SchemaType == "outgoing") {
                    var currentLow = this.getLowestNodePointBySchemaType("outgoing");
                    if (currentLow > 0)
                        data.Top = currentLow + 50;
                    else
                        data.Top = 0;
                    data.Left = 300;
                    this.OutgoingSchemaCount++;
                }
                else {
                    data.Top = 0;
                    data.Left = 0;
                }

                if (nodeId) {
                    data.Id = nodeId;
                    data.id = nodeId;
                }
                else
                    data.id = jsPlumbToolkitUtil.uuid();
            }

            if (doRelayout) {
                setTimeout(function () {
                    ctx.ToolkitComponent.surface.relayout();
                }, 200);
            }

            data.IncommingModuleID = result.data.IncommingModuleID;
            data.OutgoingModuleIDs = result.data.OutgoingModuleIDs;

            if (data.IncommingModuleID) {
                ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                    return node.id != data.id && node.data.SchemaType == "incomming" && node.data.IncommingModuleID == data.IncommingModuleID
                }).forEach(function (node) {
                    node.data.IncommingModuleID = "";
                });
            }

            //if (data.OutgoingModuleIDs && data.OutgoingModuleIDs != "all") {
            //    ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
            //        return node.id != data.id && node.data.SchemaType == "outgoing" && node.data.OutgoingModuleID == data.OutgoingModuleID
            //    }).forEach(function (node) {
            //        node.data.OutgoingModuleID = "";
            //    });
            //}

            data.Schema = result.data.Schema;
            if (result.data.Schema.id)
                data.Schema.id = result.data.Schema.id;
            else
                data.Schema.id = jsPlumbToolkitUtil.uuid();
            data.DisableSchemaEdit = result.data.DisableSchemaEdit;

            if (result.data.UsingHangingSchema) {
                ctx.ToolkitComponent.toolkit.getNode(data.id).data.IncommingModuleID = data.IncommingModuleID;
                ctx.ToolkitComponent.toolkit.getNode(data.id).data.OutgoingModuleIDs = data.OutgoingModuleIDs;
                ctx.ToolkitComponent.toolkit.getNode(data.id).data.Name = data.Name;
                ctx.ToolkitComponent.toolkit.getNode(data.id).data.Schema.id = data.Schema.id;
            }

            if (callback && !result.data.UsingHangingSchema) {
                callback(data);
            }

            var newPorts = Object.keys(result.data.Schema.properties).filter(function (item) {
                return !result.data.Schema.properties[item].id
            }).length > 0;

            ctx.mapPortsFromNodeSchemaToAdd(ctx, data.id, result.data.Schema);

            if (newPorts) {
                setTimeout(function () {
                    var oldNode = ctx.ToolkitComponent.toolkit.getNode(data.id);

                    var oldEdges = [];

                    oldNode.getPorts().forEach(function (item) {

                        item.getAllEdges().forEach(function (edge) {
                            oldEdges.push(item.id + "|" + edge.data.id + "|" + edge.source.getNode().id + "." + edge.source.id + "|" + edge.target.getNode().id + "." + edge.target.id + "|" + JSON.stringify(edge.data));
                        });
                    });

                    ctx.ToolkitComponent.toolkit.removeNode(oldNode);

                    ctx.ToolkitComponent.toolkit.addNode(oldNode.data);

                    var newNode = ctx.ToolkitComponent.toolkit.getNode(oldNode.id);

                    setTimeout(function () {
                        ctx.registerFlowModuleCanvasEvents(newNode, ctx, true);
                    }, 300);

                    oldNode.getPorts().forEach(function (item) {
                        newNode.addPort(item.data);
                    });

                    setTimeout(function () {
                        oldEdges.forEach(function (edge) {
                            var edgeData = edge.split('|');

                            ctx.ToolkitComponent.toolkit.addEdge({
                                id: edgeData[1],
                                source: edgeData[2],
                                target: edgeData[3],
                                data: JSON.parse(edgeData[4]),
                                directed: false
                            });
                        });
                    }, 800);

                    setTimeout(function () {
                        ctx.ToolkitComponent.surface.repaintEverything();
                    }, 300);
                }, 100);
            }

            ctx.ToolkitComponent.surface.repaintEverything();
            setTimeout(function () {

                if (ctx.IncommingSchemaCount > 1 || ctx.OutgoingSchemaCount > 1)
                    ctx.ToolkitComponent.surface.zoomToFit();
            }, 200);

            ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
                return node.data.Schema && node.data.Schema.id == data.Schema.id
            }).forEach(function (node) {
                if (node.data.DisableSchemaEdit && node.data.Schema.sourceTitle)
                    node.data.Schema.sourceTitle = data.Name.toString();
                ctx.remapUsedSchema(ctx, node.data.Schema, data.Schema, node.data.id);
                ctx.ToolkitComponent.toolkit.updateNode(node);
            });

            if (this.schemaSavedCallback && result.shouldSave) {
                this.schemaSavedCallback(this.ParentCTX, data.Schema);
                if (ctx.Schemas.filter(function (schema) {
                    return schema.id == data.Schema.id;
                }).length == 0)
                    ctx.Schemas.push(data.Schema);
            }
        }
        else if (ctx.CurrentModuleConnection) {
            this.dialog.closeAll();
            ctx.CurrentModuleConnection = null;
        }
    }

    protected remapUsedSchema(ctx: ModuleSchemaLayoutBehavior, schema: ForgeJSONSchema, inSchema: ForgeJSONSchema, nodeId: any) {
        if (!inSchema.properties)
            schema.properties = null;
        else if (inSchema.properties.length == 0)
            schema.properties = {};
        else {
            Object.keys(inSchema.properties).filter(function (propertyKey) {
                return propertyKey != "length";
            }).forEach(function (propertyKey) {
                var property = inSchema.properties[propertyKey];
                var existing = schema.properties[propertyKey];

                if (!existing) {
                    existing = property;
                    schema.properties[propertyKey] = existing;
                    ctx.addColumn(ctx, nodeId, property.id, property.title, property.type.toString());
                }

                existing.title = property.title;
                existing.type = property.type;

                if (property.type == "object") {
                    if (existing.oneOf.length == 0 || !existing.oneOf[0])
                        existing.oneOf.push(new ForgeJSONSchema());

                    ctx.remapUsedSchema(ctx, existing.oneOf[0], property.oneOf[0], nodeId)
                }
            });

            var keysToRemove = [];
            Object.keys(schema.properties).filter(function (propertyKey) {
                return propertyKey != "length";
            }).forEach(function (propertyKey) {
                var property = schema.properties[propertyKey];

                var existing = inSchema.properties[propertyKey];

                if (!existing)
                    keysToRemove.push(propertyKey);
                else if (property.type == "object") {
                    ctx.remapUsedSchema(ctx, property.oneOf[0], existing.oneOf[0], nodeId);
                }

            });

            keysToRemove.forEach(function (key) {
                delete schema.properties[key];
            });
        }
    }

    protected setCanvasHeight() {
        var height = document.body.clientHeight - 150;
        if (height < this.minCanvasHeight)
            height = this.minCanvasHeight;

        for (var i = 0; i < document.getElementsByClassName('jtk-surface').length; i++) {
            (<HTMLElement>document.getElementsByClassName('jtk-surface')[i]).style.height = (height - 141).toString() + 'px';
        }
    }

    protected showEdgeSetupModals(ctx: ModuleSchemaLayoutBehavior, edge: any) {

        var showJoin = ctx.isJoinFunctionNeeded(edge, null) && !ctx.isJoinPresent(edge.target.getNode());

        //edge.target.getNode().data.ShowJoinLink = showJoin;
        if (showJoin && !ctx.isJoinPresent(edge.target.getNode()))
            edge.target.getNode().data.JoinFunctionNeeded = true;
        //else
        //edge.target.getNode().data.JoinFunctionNeeded = false;

        var showMapping = ctx.isMappingFunctionNeeded(edge, false);

        if (showMapping && !edge.target.data.SchemaFunctionsReturnSource)
            edge.target.data.MappingFunctionNeeded = true;
        else
            edge.target.data.MappingFunctionNeeded = false;

        var incommingNodes = ctx.ToolkitComponent.toolkit.getNodes().filter(function (node) {
            return node.data.SchemaType == 'incomming';
        });

        if (showJoin)
            ctx.showJoinEditor(ctx, incommingNodes, edge.target.getNode().id, showMapping, edge.target)
        else if (showMapping)
            ctx.showFunctionEditor(ctx, ctx.getPortConnectionSourceNodeIds(ctx, edge.target), edge.target);
    }

    protected showJoinEditor(ctx: ModuleSchemaLayoutBehavior, sourceNodeIds: any[], targetNodeId: any, showFunctoinEditorNext: boolean, targetPort: any) {
        if (sourceNodeIds.length > 0) {
            var existingFunctions = new Array<SchemaFunction>();
            var props = new Array<SchemaFunctionProperty>();
            var nodes = new Array();
            var targetNode = ctx.ToolkitComponent.toolkit.getNode(targetNodeId);
            var targetObj = {};

            if (targetNode.data.JoinRelationships)
                targetObj = JSON.parse(JSON.stringify(targetNode.data.JoinRelationships));

            var hasMain = false;
            if (!targetObj)
                targetObj = {};
            else {
                hasMain = Object.keys(targetObj).filter(function (item) {
                    return targetObj[item].Relationship == "main"
                }).length > 0;
            }

            sourceNodeIds.forEach(function (nodeId) {
                var node = ctx.ToolkitComponent.toolkit.getNode(nodeId);
                nodes.push(node);

                node.getAllEdges().map(function (edge) {
                    var targetPort = edge.target;

                    if (targetPort.data.Functions && targetPort.data.Functions.length > 0) {
                        targetPort.data.Functions.forEach(function (item) {
                            if (existingFunctions.filter(function (func) {
                                return func.ID == item.ID
                            }).length == 0) {
                                existingFunctions.push(item);
                            }
                        });
                    }
                });

                var flattenedProps = ctx.flattenSchemaProperties(node.data.Schema);

                flattenedProps.forEach(function (prop) {
                    var newProp = new SchemaFunctionProperty();
                    newProp.NodeID = node.id;
                    newProp.Property = prop;
                    newProp.SchemaID = node.data.Schema.id;
                    newProp.Source = "property";
                    newProp.FullPropertyName = node.data.Name + ":" + ctx.getFullPropertyName(node.data.Schema, prop.id).reverse().join(':');

                    props.push(newProp);
                });

                if (!targetObj[node.id]) {
                    targetObj[node.id] = {};
                    if (!hasMain) {
                        targetObj[node.id].Relationship = "main";
                        hasMain = true;
                    }
                    else if (targetNode.getAllEdges().filter(function (edge) {
                        return edge.source.getNode().id == node.id
                    }).length > 0) {
                        targetObj[node.id].Relationship = "join";
                    }
                    else
                        targetObj[node.id].Relationship = "none";
                }

                if ((!targetObj[node.id].Relationship || targetObj[node.id].Relationship == "none") && targetNode.getAllEdges().filter(function (edge) {
                    return edge.source.getNode().id == node.id
                }).length > 0) {
                    targetObj[node.id].Relationship = "join";
                }
                else if (!targetObj[node.id].Relationship)
                    targetObj[node.id].Relationship = "none";

                if (targetObj[node.id].Order == null)
                    targetObj[node.id].Order = 999;

                if (!targetObj[node.id].Functions) {
                    targetObj[node.id].Functions = new Array<SchemaFunction>();
                    targetObj[node.id].SchemaFunctionsReturnSource = null;
                    targetObj[node.id].SchemaFunctionsReturnSourceID = null;
                    targetObj[node.id].SchemaFunctionsReturnValue = null;
                    targetObj[node.id].SchemaFunctionsReturnValueType = null;
                }
                else {
                    targetObj[node.id].Functions.forEach(function (func) {
                        func.Properties.forEach(function (prop) {
                            if (prop.Source == "property") {
                                var inNode = ctx.ToolkitComponent.toolkit.getNode(prop.NodeID);

                                prop.FullPropertyName = inNode.data.Name + ":" + ctx.getFullPropertyName(inNode.data.Schema, prop.Property.id).reverse().join(':');
                            }
                        });
                    });
                }
            });

            let dialogRefJoin = ctx.dialog.open(SchemaJoinDialogComponent, {
                data: {
                    nodes: nodes,
                    node: targetNode,
                    targetObj: targetObj,
                    mappingFunctions: existingFunctions,
                    availableProperties: props,
                    availableSchemaFunctions: ctx.AvailableSchemaFunctions.filter(function (item) { return item.FunctionType != 'Aggregate'; }),
                    auditFunctionsRecursive: ctx.auditFunctionsRecursive,
                    auditFunctions: ctx.auditFunctions,
                    isMappingFunctionNeeded: ctx.isMappingFunctionNeeded,
                    isJoinFunctionNeeded: ctx.isJoinFunctionNeeded,
                    isJoinPresent: ctx.isJoinPresent,
                    title: 'Schema Relationships - ' + ctx.ModuleName + " : " + targetNode.data.Name
                },
                width: '100%',
                height: '100%'
            });

            dialogRefJoin.afterClosed().subscribe(result => {
                if (result && result.confirm) {
                    targetNode.data.JoinRelationships = result.targetObj;

                    var edges = targetNode.getAllEdges();
                    targetNode.data.JoinFunctionNeeded = false;
                    targetNode.data.ShowJoinLink = false;

                    edges.forEach(function (edge) {
                        var needed = ctx.isJoinFunctionNeeded(edge, null);
                        if (needed && !ctx.isJoinPresent(targetNode))
                            targetNode.data.JoinFunctionNeeded = true;
                        if (needed)
                            targetNode.data.ShowJoinLink = true;
                    });

                    ctx.auditFunctions("audit", targetNode, targetNode, null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                    if (showFunctoinEditorNext)
                        ctx.showFunctionEditor(ctx, ctx.getPortConnectionSourceNodeIds(ctx, targetPort), targetPort);
                    return true;
                }
                else {
                    var edges = targetNode.getAllEdges();
                    targetNode.data.JoinFunctionNeeded = false;
                    targetNode.data.ShowJoinLink = false;

                    edges.forEach(function (edge) {
                        var needed = ctx.isJoinFunctionNeeded(edge, null);
                        if (needed && !ctx.isJoinPresent(targetNode))
                            targetNode.data.JoinFunctionNeeded = true;
                        if (needed)
                            targetNode.data.ShowJoinLink = true;
                    });

                    ctx.auditFunctions("audit", targetNode, targetNode, null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                    return false;
                }
            });
        }
    }

    protected showFunctionEditor(ctx: ModuleSchemaLayoutBehavior, sourceNodeIds: string[], targetPort) {
        var incommingProps = new Array<SchemaFunctionProperty>();
        var existingFunctions = new Array<SchemaFunction>();

        sourceNodeIds.forEach(function (sourceNodeId) {
            var node = ctx.ToolkitComponent.toolkit.getNode(sourceNodeId);

            node.getAllEdges().map(function (edge) {
                var port = edge.target;

                if (port.getNode().id == targetPort.getNode().id && port.data.Functions && port.data.Functions.length > 0) {
                    port.data.Functions.forEach(function (item) {
                        if (existingFunctions.filter(function (func) {
                            return func.ID == item.ID
                        }).length == 0) {
                            existingFunctions.push(item);
                        }
                    });
                }
            });

            var flattenedProps = ctx.flattenSchemaProperties(node.data.Schema);

            var newProps = node.getAllEdges().map(function (item) {
                var existing = flattenedProps.filter(function (prop) {
                    return prop.id == item.source.id;
                })[0];

                var newProp = new SchemaFunctionProperty();
                newProp.NodeID = node.id;
                newProp.Property = existing;
                newProp.SchemaID = node.data.Schema.id;
                newProp.Source = "property";
                newProp.FullPropertyName = node.data.Name + ":" + ctx.getFullPropertyName(node.data.Schema, existing.id).reverse().join(':');

                return newProp;
            });

            newProps.forEach(function (newProp) {
                if (incommingProps.filter(function (eProp) {
                    return eProp.Property.id == newProp.Property.id && eProp.NodeID == newProp.NodeID;
                }).length == 0) {
                    incommingProps.push(newProp);
                }
            });
        });

        if (!targetPort.data.Functions) {
            targetPort.data.Functions = [];
            targetPort.data.SchemaFunctionsReturnSource = null;
            targetPort.data.SchemaFunctionsReturnSourceID = null;
            targetPort.data.SchemaFunctionsReturnValue = null;
            targetPort.data.SchemaFunctionsReturnValueType = null;
        }
        else {
            var node = targetPort.getNode();
            targetPort.data.Functions.forEach(function (func) {
                func.Properties.forEach(function (prop) {
                    if (prop.Source == "property") {
                        prop.FullPropertyName = ctx.ToolkitComponent.toolkit.getNode(prop.NodeID).data.Name + ':' + ctx.getFullPropertyName(ctx.ToolkitComponent.toolkit.getNode(prop.NodeID).data.Schema, prop.Property.id).reverse().join(':');
                    }
                });
            });
        }

        let dialogRefFunctions = ctx.dialog.open(SchemaFunctionsDialogComponent, {
            data: {
                availableSchemaFunctions: ctx.AvailableSchemaFunctions,
                properties: incommingProps,
                mappingFunctions: existingFunctions,
                schemaFunctions: targetPort.data.Functions,
                title: 'Mapping Functions - ' + ctx.ModuleName + " : " + targetPort.getNode().data.Name,
                type: 'mapping',
                schemaFunctionsReturnSource: targetPort.data.SchemaFunctionsReturnSource,
                schemaFunctionsReturnSourceID: targetPort.data.SchemaFunctionsReturnSourceID,
                schemaFunctionsReturnValue: targetPort.data.SchemaFunctionsReturnValue,
                schemaFunctionsReturnValueType: targetPort.data.SchemaFunctionsReturnValueType,
                auditFunctionsRecursive: ctx.auditFunctionsRecursive,
                auditFunctions: ctx.auditFunctions,
                isMappingFunctionNeeded: ctx.isMappingFunctionNeeded,
                isGroupNeeded: ctx.isGroupNeeded,
                isJoinFunctionNeeded: ctx.isJoinFunctionNeeded,
                isJoinPresent: ctx.isJoinPresent,
                node: targetPort.getNode(),
                expectedReturnType: targetPort.data.DataType
            },
            width: '100%',
            height: '100%'
        });

        dialogRefFunctions.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                targetPort.data.Functions = result.data.schemaFunctions;
                targetPort.data.SchemaFunctionsReturnSource = result.data.schemaFunctionsReturnSource;
                targetPort.data.SchemaFunctionsReturnSourceID = result.data.schemaFunctionsReturnSourceID;
                targetPort.data.SchemaFunctionsReturnValue = result.data.schemaFunctionsReturnValue;
                targetPort.data.SchemaFunctionsReturnValueType = result.data.schemaFunctionsReturnValueType;

                ctx.auditFunctions("audit", targetPort.getNode(), targetPort.getNode(), null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                return true;
            }
            else {
                ctx.auditFunctions("audit", targetPort.getNode(), targetPort.getNode(), null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                return false;
            }
        });
    }

    protected showWhereFunctionEditor(ctx: ModuleSchemaLayoutBehavior, nodeId: string) {
        var incommingProps = new Array<SchemaFunction>();
        var existingFunctions = new Array<SchemaFunction>();

        var node = ctx.ToolkitComponent.toolkit.getNode(nodeId);

        var newProps = [];
        var inNodes = [];
        //inNodes.push(nodeId);

        node.getAllEdges().forEach(function (edge) {
            if (inNodes.indexOf(edge.source.getNode().id) == -1)
                inNodes.push(edge.source.getNode().id);
        });

        inNodes.forEach(function (inNodeId) {
            var inNode = ctx.ToolkitComponent.toolkit.getNode(inNodeId);

            var flatProps = ctx.flattenSchemaProperties(inNode.data.Schema);

            flatProps.forEach(function (prop) {
                var newProp = new SchemaFunctionProperty();
                newProp.NodeID = inNodeId;
                newProp.Property = prop;
                newProp.SchemaID = inNode.data.Schema.id;
                newProp.Source = "property";
                newProp.FullPropertyName = inNode.data.Name + ":" + ctx.getFullPropertyName(inNode.data.Schema, prop.id).reverse().join(':');
                newProps.push(newProp);
            });
        });

        node.getAllEdges().map(function (edge) {
            var sourceProp = edge.source;
            var sourceNode = sourceProp.getNode();
            var targetPort = edge.target;

            if (targetPort.data.Functions && targetPort.data.Functions.length > 0) {
                targetPort.data.Functions.forEach(function (item) {
                    if (existingFunctions.filter(function (func) {
                        return func.ID == item.ID
                    }).length == 0) {
                        existingFunctions.push(item);
                    }
                });
            }
        });

        newProps.forEach(function (newProp) {
            incommingProps.push(newProp);
        });

        node.data.MappingFunctions = existingFunctions;

        if (!node.data.Functions) {
            node.data.Functions = [];
            node.data.SchemaFunctionsReturnSource = null;
            node.data.SchemaFunctionsReturnSourceID = null;
            node.data.SchemaFunctionsReturnValue = null;
            node.data.SchemaFunctionsReturnValueType = null;
        }
        else {
            node.data.Functions.forEach(function (func) {
                func.Properties.forEach(function (prop) {
                    if (prop.Source == "property") {
                        var inNode = ctx.ToolkitComponent.toolkit.getNode(prop.NodeID);

                        prop.FullPropertyName = inNode.data.Name + ":" + ctx.getFullPropertyName(inNode.data.Schema, prop.Property.id).reverse().join(':');
                    }
                });
            });
        }

        let dialogRefWhereFunctions = ctx.dialog.open(SchemaFunctionsDialogComponent, {
            data: {
                availableSchemaFunctions: ctx.AvailableSchemaFunctions.filter(function (item) { return item.FunctionType != 'Aggregate'; }),
                properties: incommingProps,
                schemaFunctions: node.data.Functions,
                title: 'Filter Functions - ' + ctx.ModuleName + " : " + node.data.Name,
                mappingFunctions: node.data.MappingFunctions,
                schemaFunctionsReturnSource: node.data.SchemaFunctionsReturnSource,
                schemaFunctionsReturnSourceID: node.data.SchemaFunctionsReturnSourceID,
                schemaFunctionsReturnValue: node.data.SchemaFunctionsReturnValue,
                schemaFunctionsReturnValueType: node.data.SchemaFunctionsReturnValueType,
                type: 'filter',
                auditFunctionsRecursive: ctx.auditFunctionsRecursive,
                auditFunctions: ctx.auditFunctions,
                isMappingFunctionNeeded: ctx.isMappingFunctionNeeded,
                isJoinFunctionNeeded: ctx.isJoinFunctionNeeded,
                isJoinPresent: ctx.isJoinPresent,
                node: node,
                expectedReturnType: "boolean"
            },
            width: '100%',
            height: '100%'
        });

        dialogRefWhereFunctions.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                node.data.Functions = result.data.schemaFunctions;
                node.data.SchemaFunctionsReturnSource = result.data.schemaFunctionsReturnSource;
                node.data.SchemaFunctionsReturnSourceID = result.data.schemaFunctionsReturnSourceID;
                node.data.SchemaFunctionsReturnValue = result.data.schemaFunctionsReturnValue;
                node.data.SchemaFunctionsReturnValueType = result.data.schemaFunctionsReturnValueType;

                ctx.auditFunctions("audit", node, node, null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                return true;
            }
            else {
                ctx.auditFunctions("audit", node, node, null, ctx.auditFunctionsRecursive, ctx.isMappingFunctionNeeded, ctx.isJoinFunctionNeeded, ctx.isJoinPresent, ctx.isGroupNeeded);

                return false;
            }
        });
    }
}
