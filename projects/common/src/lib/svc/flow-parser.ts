import { Injectable } from '@angular/core';

import { jsPlumbToolkitIO } from "jsplumbtoolkit";
import { FlowModule, FlowStream, ModuleSchemaConfig, JSONSchemaMap, SchemaNode, SchemaFunctionRef, SchemaFunctionReturn, FlowConfig, ForgeJSONSchema, SchemaFunction, SchemaFunctionProperty } from '@lcu/apps';

@Injectable({
	providedIn: 'root'
})
export class FlowParser {
	//	Fields
	protected parser: FlowParser;

	//	Constructors
	constructor() {
		jsPlumbToolkitIO.parsers["fathymIO"] = this.ParseFlow;
		jsPlumbToolkitIO.exporters["fathymIO"] = this.MapFlow;
		jsPlumbToolkitIO.parsers["fathymIOSchema"] = this.ParseSchemaFlow;
		jsPlumbToolkitIO.exporters["fathymIOSchema"] = this.MapSchemaFlow;

		this.parser = this;
	}

	//	API Methods
	public MapFlow(toolkit: any, params: any) {
		var nodes = toolkit.getNodes();
		var edges = toolkit.getAllEdges();
		var returnObj = <{ Modules: FlowModule[], Streams: FlowStream[] }>params.flow;

		returnObj.Modules = [];
		returnObj.Streams = [];

		nodes.forEach(function (item) {
			if (!item.data.Settings) {
				item.data.Settings = { IsDeleted: false };
			}
			returnObj.Modules.push(item.data);
		});

		edges.forEach(function (item) {
			returnObj.Streams.push(
				{
					ID: item.data.id,
					Description: item.data.description,
					Order: item.data.order,
					Transform: item.data.transform,
					InputModuleID: item.source.id,
					OutputModuleID: item.target.id,
					Name: item.data.label,
				});
		});

		return returnObj;
	}

	public MapSchemaFlow(toolkit: any, params: any) {
		var nodes = toolkit.getNodes();
		var edges = toolkit.getAllEdges();
		var returnObj: ModuleSchemaConfig = new ModuleSchemaConfig;
		returnObj.SchemaMaps = new Array<JSONSchemaMap>();
		returnObj.SchemaNodes = new Array<SchemaNode>();
		returnObj.SchemaFunctions = new Array<SchemaFunctionRef>();
		returnObj.SchemaFunctionReturns = new Array<SchemaFunctionReturn>();
		returnObj.HasErrors = false;

		nodes.forEach(function (item) {
			var schemaNode = {
				ID: item.id,
				Data: {},
				JSONSchemaID: item.data.Schema.id,
				IncommingModuleID: "",
				OutgoingModuleIDs: [],
				JoinRelationships: [],
				Groups: [],
				Timestamp: '',
				TumblingWindow: false,
				TumblingInterval: "",
				TumblingIntervalValue: null,
				DisableSchemaEdit: false
			}

			if (item.data.SchemaType == 'incomming' && item.data.IncommingModuleID)
				schemaNode.IncommingModuleID = item.data.IncommingModuleID;
			else if (item.data.SchemaType == 'outgoing' && item.data.OutgoingModuleIDs)
				schemaNode.OutgoingModuleIDs = item.data.OutgoingModuleIDs;

			if (item.data.DisableSchemaEdit)
				schemaNode.DisableSchemaEdit = item.data.DisableSchemaEdit;

			Object.keys(item.data).forEach(key => {
				if (key != 'Schema' && key != 'IncommingModules' && key != 'OutgoingModules'
					&& key != 'IncommingModuleID' && key != 'OutgoingModuleID' && key != 'OutgoingModuleIDs'
					&& key != 'Functions' && key != 'SchemaFunctionsReturnSource' && key != 'SchemaFunctionsReturnSourceID'
					&& key != 'SchemaFunctionsReturnValue' && key != 'SchemaFunctionsReturnValueType'
					&& key != 'JoinRelationships' && key != 'DisableSchemaEdit' && key != "ShowJoinLink" && key != "Groups"
					&& key != 'TumblingWindow' && key != 'TumblingInterval' && key != 'TumblingIntervalValue' && key != 'Timestamp'
					&& key != 'MappingFunctions' && key != 'JoinFunctionNeeded') {
					schemaNode.Data[key] = item.data[key];
				}
			});

			if (item.data.Functions && item.data.Functions.length > 0) {
				if (item.data.SchemaFunctionsReturnSourceID) {
					var functionReturn = new SchemaFunctionReturn();

					functionReturn.PropertyID = item.id;
					functionReturn.NodeID = item.data.id;
					functionReturn.SchemaFunctionsReturnSource = item.data.SchemaFunctionsReturnSource;
					functionReturn.SchemaFunctionsReturnSourceID = item.data.SchemaFunctionsReturnSourceID;
					functionReturn.SchemaFunctionsReturnValue = item.data.SchemaFunctionsReturnValue;
					functionReturn.SchemaFunctionsReturnValueType = item.data.SchemaFunctionsReturnValueType;
					functionReturn.Type = 'filter';
					functionReturn.ExternalSchemaID = '';

					returnObj.SchemaFunctionReturns.push(functionReturn);
				}

				item.data.Functions.forEach(function (func) {
					if (func.ExtraData && func.ExtraData.HasErrors)
						returnObj.HasErrors = true;

					var newFunc: SchemaFunctionRef =
					{
						ID: func.ID,
						Properties: [],
						Name: func.Name,
						Order: func.Order,
						FunctionID: func.Function.ID,
						ExtraData: func.ExtraData,
						ResultNodeID: item.data.id,
						ResultPropertyID: '',
						ReturnValueType: func.ReturnValueType,
						ReturnTrueSourceID: func.ReturnTrueSourceID,
						ReturnTrueSource: func.ReturnTrueSource,
						ReturnTrueValue: func.ReturnTrueValue,
						ReturnFalseSourceID: func.ReturnFalseSourceID,
						ReturnFalseSource: func.ReturnFalseSource,
						ReturnFalseValue: func.ReturnFalseValue,
						Type: 'filter'
					};

					func.Properties.forEach(function (prop) {
						newFunc.Properties.push(
							{
								id: (prop.Property ? prop.Property.id : null),
								StaticValue: prop.StaticValue,
								StaticValueType: prop.StaticValueType,
								SchemaID: prop.SchemaID,
								Order: prop.Order,
								Source: prop.Source,
								NodeID: prop.NodeID
							});
					});

					returnObj.SchemaFunctions.push(newFunc);
				});
			}

			if (item.data.JoinRelationships && Object.keys(item.data.JoinRelationships).length > 0) {
				schemaNode.JoinRelationships = [];

				Object.keys(item.data.JoinRelationships).forEach(function (key) {
					var nodeRel = item.data.JoinRelationships[key];
					var rel = { Key: key, Object: { Relationship: nodeRel.Relationship, Order: nodeRel.Order } };
					schemaNode.JoinRelationships.push(rel);


					if (nodeRel.SchemaFunctionsReturnSourceID) {
						var functionReturn = new SchemaFunctionReturn();

						functionReturn.PropertyID = item.id;
						functionReturn.NodeID = item.data.id;
						functionReturn.SchemaFunctionsReturnSource = nodeRel.SchemaFunctionsReturnSource;
						functionReturn.SchemaFunctionsReturnSourceID = nodeRel.SchemaFunctionsReturnSourceID;
						functionReturn.SchemaFunctionsReturnValue = nodeRel.SchemaFunctionsReturnValue;
						functionReturn.SchemaFunctionsReturnValueType = nodeRel.SchemaFunctionsReturnValueType;
						functionReturn.Type = 'join';
						functionReturn.ExternalSchemaID = key;

						returnObj.SchemaFunctionReturns.push(functionReturn);
					}
					if (nodeRel.Functions) {
						nodeRel.Functions.forEach(function (func) {
							if (func.ExtraData && func.ExtraData.HasErrors)
								returnObj.HasErrors = true;

							var newFunc: SchemaFunctionRef =
							{
								ID: func.ID,
								Properties: [],
								Name: func.Name,
								Order: func.Order,
								FunctionID: func.Function.ID,
								ExtraData: func.ExtraData,
								ResultNodeID: item.data.id,
								ResultPropertyID: key,
								ReturnValueType: func.ReturnValueType,
								ReturnTrueSourceID: func.ReturnTrueSourceID,
								ReturnTrueSource: func.ReturnTrueSource,
								ReturnTrueValue: func.ReturnTrueValue,
								ReturnFalseSourceID: func.ReturnFalseSourceID,
								ReturnFalseSource: func.ReturnFalseSource,
								ReturnFalseValue: func.ReturnFalseValue,
								Type: 'join'
							};

							func.Properties.forEach(function (prop) {
								newFunc.Properties.push(
									{
										id: (prop.Property ? prop.Property.id : null),
										StaticValue: prop.StaticValue,
										StaticValueType: prop.StaticValueType,
										SchemaID: prop.SchemaID,
										NodeID: prop.NodeID,
										Order: prop.Order,
										Source: prop.Source
									});
							});

							returnObj.SchemaFunctions.push(newFunc);
						});
					}
				});
			}

			if (item.data.JoinFunctionNeeded)
				returnObj.HasErrors = true;

			if (item.data.Timestamp)
				schemaNode.Timestamp = item.data.Timestamp;

			if (item.data.Groups)
				schemaNode.Groups = item.data.Groups;

			if (item.data.TumblingWindow) {
				schemaNode.TumblingWindow = item.data.TumblingWindow;
				schemaNode.TumblingInterval = item.data.TumblingInterval;
				schemaNode.TumblingIntervalValue = item.data.TumblingIntervalValue;
			}

			var edges = item.getPorts().filter(function (port) {
				return port.getAllEdges().filter(function (edge) { return edge.target.id == port.id }).length > 0
			});

			if (edges.length == 0 && item.data.SchemaType == 'outgoing')
				returnObj.HasErrors = true;

			if (item.data.SchemaType == 'outgoing' && (!item.data.OutgoingModuleIDs || item.data.OutgoingModuleIDs.length == 0))
				returnObj.HasErrors = true;

			if (item.data.SchemaType == 'incomming' && !item.data.IncommingModuleID)
				returnObj.HasErrors = true;

			returnObj.SchemaNodes.push(schemaNode);

			item.getPorts().forEach(function (port) {
				if (port.data.MappingFunctionNeeded)
					returnObj.HasErrors = true;
				if (port.data.Functions && port.data.Functions.length > 0) {
					if (port.data.SchemaFunctionsReturnSourceID) {
						var functionReturn = new SchemaFunctionReturn();

						functionReturn.PropertyID = port.id;
						functionReturn.NodeID = item.data.id;
						functionReturn.SchemaFunctionsReturnSource = port.data.SchemaFunctionsReturnSource;
						functionReturn.SchemaFunctionsReturnSourceID = port.data.SchemaFunctionsReturnSourceID;
						functionReturn.SchemaFunctionsReturnValue = port.data.SchemaFunctionsReturnValue;
						functionReturn.SchemaFunctionsReturnValueType = port.data.SchemaFunctionsReturnValueType;
						functionReturn.Type = 'mapping';
						functionReturn.ExternalSchemaID = '';

						returnObj.SchemaFunctionReturns.push(functionReturn);
					}

					port.data.Functions.forEach(function (func) {
						if (func.ExtraData && func.ExtraData.HasErrors)
							returnObj.HasErrors = true;

						var newFunc: SchemaFunctionRef =
						{
							ID: func.ID,
							Properties: [],
							Name: func.Name,
							Order: func.Order,
							FunctionID: func.Function.ID,
							ExtraData: func.ExtraData,
							ResultNodeID: item.data.id,
							ResultPropertyID: port.id,
							ReturnValueType: func.ReturnValueType,
							ReturnTrueSourceID: func.ReturnTrueSourceID,
							ReturnTrueSource: func.ReturnTrueSource,
							ReturnTrueValue: func.ReturnTrueValue,
							ReturnFalseSourceID: func.ReturnFalseSourceID,
							ReturnFalseSource: func.ReturnFalseSource,
							ReturnFalseValue: func.ReturnFalseValue,
							Type: 'mapping'
						};

						func.Properties.forEach(function (prop) {
							newFunc.Properties.push(
								{
									id: (prop.Property ? prop.Property.id : null),
									StaticValue: prop.StaticValue,
									StaticValueType: prop.StaticValueType,
									SchemaID: prop.SchemaID,
									NodeID: prop.NodeID,
									Order: prop.Order,
									Source: prop.Source
								});
						});

						returnObj.SchemaFunctions.push(newFunc);
					});
				}
			});
		});

		edges.forEach(function (item) {
			var edgeData = item.data;

			var schemaMap = <JSONSchemaMap>{
				ID: item.data.id,
				IncommingSchemaID: item.source.getNode().id,
				OutgoingSchemaID: item.target.getNode().id,
				Data: edgeData,
				IncommingPropertyID: item.source.id,
				OutgoingPropertyID: item.target.id
			}

			returnObj.SchemaMaps.push(schemaMap);
		});

		return returnObj;
	}

	public ParseFlow(flow: FlowConfig, toolkit: any, params: any) {
		flow.Modules.filter(function (item) {
			return !item.Deleted;
        }).forEach(function (item) {
            var jspItem: any;
            jspItem = item;
            jspItem.id = item.ID;

			toolkit.addNode(jspItem);
		});

		flow.Streams.forEach(function (item) {
			toolkit.addEdge(
				{
					id: item.ID,
					source: item.InputModuleID,
					target: item.OutputModuleID,
					description: item.Description,
					order: item.Order,
					transform: item.Transform,
					data: {
						label: item.Name,
						type: 'connection'
					}
				});
		});
	}

	public ParseSchemaFlow(schemaFlow: any, toolkit: any, params: any) {
		var recurseJSONSchemaToAddPorts = function (recurse: Function, schema: ForgeJSONSchema, node: any) {
			if (!schema.properties)
				return;

			var keys = Object.keys(schema.properties);

			var portType = "default";
			if (node.data.SchemaType == "incomming")
				portType = "source";
			else
				portType = "target";

			keys.forEach(key => {
				node.addPort({
					id: schema.properties[key].id,
					DataType: schema.properties[key].type,
					Text: schema.properties[key].title,
					type: portType,
					MappingFunctionError: false
				});

				if (schema.properties[key].type == "object") {
					recurse(recurse, schema.properties[key].oneOf[0], node);
				}
			});
		}

		function recurseJSONSchemaToFindProperty(recurse: Function, schema: ForgeJSONSchema, id: string): boolean {
			if (!schema.properties)
				return;

			var keys = Object.keys(schema.properties);
			var found = null;

			keys.forEach(key => {
				if (schema.properties[key].id == id)
					found = schema.properties[key];
				else if (!found && schema.properties[key].type == "object") {
					found = recurse(recurse, schema.properties[key].oneOf[0], id);
				}
			});

			return found;
		}

		var self = this;

		if (schemaFlow.SchemaNodes) {
			schemaFlow.SchemaNodes.forEach(function (item) {
				var node = item.Data;

				var schemaList = params.Schemas.filter(function (obj) {
					return obj.id == item.JSONSchemaID;
				});

				if (schemaList && schemaList.length > 0)
					node["Schema"] = JSON.parse(JSON.stringify(schemaList[0]));

				node.FilterFunctionError = false;

				if (item.IncommingModuleID)
					node.IncommingModuleID = item.IncommingModuleID;

				if (item.OutgoingModuleIDs)
					node.OutgoingModuleIDs = item.OutgoingModuleIDs;

				if (item.DisableSchemaEdit)
					node.DisableSchemaEdit = item.DisableSchemaEdit;

				if (item.DisableSchemaEdit) {
                    node.Schema.sourceTitle = item.Data.Name;//JSON.parse(JSON.stringify(node.Schema.title));
                    //node.Schema.title = JSON.parse(JSON.stringify(item.Data.Name));
				}

				if (item.Groups)
					node.Groups = item.Groups;

				if (item.Timestamp)
					node.Timestamp = item.Timestamp;

				if (item.TumblingWindow) {
					node.TumblingWindow = item.TumblingWindow;
					node.TumblingInterval = item.TumblingInterval;
					node.TumblingIntervalValue = item.TumblingIntervalValue;
				}

				if (item.JoinRelationships && item.JoinRelationships.length > 0) {
					node.JoinRelationships = {};

					item.JoinRelationships.forEach(function (rel) {
						node.JoinRelationships[rel.Key] = {};
						node.JoinRelationships[rel.Key].Relationship = rel.Object.Relationship;
						node.JoinRelationships[rel.Key].Order = rel.Object.Order;
						node.JoinRelationships[rel.Key].JoinFunctionError = false;
					});
				}

				var newNode = toolkit.addNode(node);

				recurseJSONSchemaToAddPorts(recurseJSONSchemaToAddPorts, node["Schema"], newNode);

				setTimeout(function () {
					toolkit.updateNode(newNode.id);
				}, 50);
			});
		}

		setTimeout(function (self) {
			if (schemaFlow.SchemaMaps) {
				schemaFlow.SchemaMaps.forEach(function (item) {
					var edge = toolkit.addEdge(
						{
							id: item.ID,
							source: item.IncommingSchemaID + "." + item.IncommingPropertyID,
							target: item.OutgoingSchemaID + "." + item.OutgoingPropertyID,
							data: item.Data,
							directed: false
						});
				});
			}

			if (schemaFlow.SchemaFunctions) {
				schemaFlow.SchemaFunctions.forEach(function (func) {
					var node = toolkit.getNode(func.ResultNodeID);
					var port;

					if (!func.Type)
						func.Type = 'mapping';

					if (func.Type == 'mapping') {
						port = node.getPort(func.ResultPropertyID);

						if (!port.data.Functions) {
							port.data.Functions = new Array<SchemaFunction>();
						}
					}
					else if (func.Type == 'filter') {
						if (!node.data.Functions)
							node.data.Functions = new Array<SchemaFunction>();
					}
					else if (func.Type == "join") {
						if (!node.data.JoinRelationships[func.ResultPropertyID].Functions)
							node.data.JoinRelationships[func.ResultPropertyID].Functions = new Array<SchemaFunction>();
					}

					var newFunc = new SchemaFunction();
					newFunc.ID = func.ID;
					newFunc.Name = func.Name;
					newFunc.Order = func.Order;
					newFunc.ExtraData = func.ExtraData;
					newFunc.ReturnValueType = func.ReturnValueType;
					newFunc.ReturnTrueSource = func.ReturnTrueSource;
					newFunc.ReturnTrueSourceID = func.ReturnTrueSourceID;
					newFunc.ReturnTrueValue = func.ReturnTrueValue;
					newFunc.ReturnFalseSource = func.ReturnFalseSource;
					newFunc.ReturnFalseSourceID = func.ReturnFalseSourceID;
					newFunc.ReturnFalseValue = func.ReturnFalseValue;
					newFunc.Properties = new Array<SchemaFunctionProperty>();

					func.Properties.forEach(function (prop) {

						if (prop.Source == "function") {
							var existingFunction = schemaFlow.SchemaFunctions.filter(function (f) {
								return f.ID == prop.id
							})[0];

							var funcDef = params.AvailableSchemaFunctions.filter(function (item) {
								return item.id == existingFunction.FunctionID;
							})[0];

							var newExisting = new SchemaFunctionProperty();
							newExisting.Source = prop.Source;
							newExisting.Property = new ForgeJSONSchema;
							newExisting.Property.id = existingFunction.ID;
							newExisting.Property.title = "Result of " + existingFunction.Name;
							newExisting.Property.type = funcDef.ReturnType;
							newExisting.Order = prop.Order;
							newExisting.StaticValue = prop.StaticValue;
							newExisting.StaticValueType = prop.StaticValueType;

							newFunc.Properties.push(newExisting);
						}
						else if (prop.Source == "static") {
							var newStatic = new SchemaFunctionProperty();
							newStatic.Source = prop.Source;
							newStatic.Order = prop.Order;
							newStatic.StaticValue = prop.StaticValue;
							newStatic.StaticValueType = prop.StaticValueType;
							newStatic.Property = new ForgeJSONSchema();
							newStatic.Property.id = prop.id;

							newFunc.Properties.push(newStatic);
						}
						else {
							var newProp = null;

							if (prop.id)
								newProp = recurseJSONSchemaToFindProperty(recurseJSONSchemaToFindProperty, toolkit.getNode(prop.NodeID).data.Schema, prop.id)

							newFunc.Properties.push({
								Source: prop.Source,
								Property: newProp,
								SchemaID: prop.SchemaID,
								NodeID: prop.NodeID,
								Order: prop.Order,
								StaticValue: prop.StaticValue,
								StaticValueType: prop.StaticValueType
							});
						}
					});

					newFunc.Function = params.AvailableSchemaFunctions.filter(function (item) {
						return item.ID == func.FunctionID;
					})[0];

					if (func.Type == 'mapping') {
						port.data.Functions.push(newFunc);
						if (func.ExtraData.HasErrors)
							port.data.MappingFunctionError = true;
					}
					else if (func.Type == 'filter') {
						node.data.Functions.push(newFunc);
						if (func.ExtraData.HasErrors)
							node.data.FilterFunctionError = true;
					}
					else if (func.Type == 'join') {
						node.data.JoinRelationships[func.ResultPropertyID].Functions.push(newFunc);
						if (func.ExtraData.HasErrors)
							node.data.JoinRelationships[func.ResultPropertyID].JoinFunctionError = true;
					}
				});
			}

			if (schemaFlow.SchemaFunctionReturns) {
				schemaFlow.SchemaFunctionReturns.forEach(function (ret) {
					var node = toolkit.getNode(ret.NodeID);
					var port;

					if (!ret.Type)
						ret.Type = 'mapping';

					if (ret.Type == 'mapping') {
						port = node.getPort(ret.PropertyID);

						if (!port.data.SchemaFunctionsReturnSourceID) {
							port.data.SchemaFunctionsReturnSource = null;
							port.data.SchemaFunctionsReturnSourceID = null;
							port.data.SchemaFunctionsReturnValue = null;
							port.data.SchemaFunctionsReturnValueType = null;
						}
						port.data.SchemaFunctionsReturnSource = ret.SchemaFunctionsReturnSource;
						port.data.SchemaFunctionsReturnSourceID = ret.SchemaFunctionsReturnSourceID;
						port.data.SchemaFunctionsReturnValue = ret.SchemaFunctionsReturnValue;
						port.data.SchemaFunctionsReturnValueType = ret.SchemaFunctionsReturnValueType;
					}
					else if (ret.Type == 'filter') {
						if (!node.data.SchemaFunctionsReturnSourceID) {
							node.data.SchemaFunctionsReturnSource = null;
							node.data.SchemaFunctionsReturnSourceID = null;
							node.data.SchemaFunctionsReturnValue = null;
							node.data.SchemaFunctionsReturnValueType = null;
						}
						node.data.SchemaFunctionsReturnSource = ret.SchemaFunctionsReturnSource;
						node.data.SchemaFunctionsReturnSourceID = ret.SchemaFunctionsReturnSourceID;
						node.data.SchemaFunctionsReturnValue = ret.SchemaFunctionsReturnValue;
						node.data.SchemaFunctionsReturnValueType = ret.SchemaFunctionsReturnValueType;
					}
					else if (ret.Type == 'join') {
						if (!node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnSourceID) {
							node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnSource = null;
							node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnSourceID = null;
							node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnValue = null;
							node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnValueType = null;
						}
						node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnSource = ret.SchemaFunctionsReturnSource;
						node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnSourceID = ret.SchemaFunctionsReturnSourceID;
						node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnValue = ret.SchemaFunctionsReturnValue;
						node.data.JoinRelationships[ret.ExternalSchemaID].SchemaFunctionsReturnValueType = ret.SchemaFunctionsReturnValueType;
						node.data.JoinRelationships[ret.ExternalSchemaID].ExternalSchemaID = ret.ExternalSchemaID;
					}
				});
			}

			if (schemaFlow.SchemaNodes) {
				toolkit.getNodes().filter(function (node) {
					return node.data.SchemaType == 'outgoing'
				}).forEach(function (node) {
					node.data.JoinFunctionNeeded = false;
					node.data.ShowJoinLink = false;

					node.getPorts().forEach(function (port) {
						var edges = port.getAllEdges();

						if (node.data.SchemaType == 'outgoing') {
							edges.forEach(function (edge) {
								var needed = params.IsJoinFunctionNeeded(edge);
								if (needed && !params.IsJoinPresent(node))
									node.data.JoinFunctionNeeded = true;
								if (needed)
									node.data.ShowJoinLink = true;
							});
						}

						if (edges && edges.length > 0) {
							var edge = edges[0];
							var isMapNeeded = params.IsMappingFunctionNeeded(edge);

							if (isMapNeeded && !edge.target.data.SchemaFunctionsReturnSource)
								edge.target.data.MappingFunctionNeeded = true;
						}
					});

					params.IsGroupNeeded(params.IsGroupNeeded, node, null, null);
				});
			}
		}, 500);
	}

    //	Helpers
}
