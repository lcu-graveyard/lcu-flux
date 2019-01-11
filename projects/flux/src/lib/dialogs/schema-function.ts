import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { SchemaFunctionProperty, SchemaFunctionDefinition, SchemaFunction, ForgeJSONSchema } from '@lcu/apps';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'schema-function',
    templateUrl: './schema-function.html',
})

export class SchemaFunctionDialogComponent implements OnInit {
    //	Fields
    protected defaultMaxProperties = 50;

    protected selectableReturnFunctionTypes = ['Conditional', 'RegEx', 'Comparison', 'Between'];

    protected staticPropsToShowText = ['static_string', 'static_number', 'static_integer'];

    //	Properties
    public AddFunctionPropertyVisible: boolean;

    public AvailableSchemaProperties: SchemaFunctionProperty[];

    public AvailableReturnSchemaProperties: SchemaFunctionProperty[];

    public AvailableSchemaFunctions: SchemaFunctionDefinition[];

    public CurrentProperty: SchemaFunctionProperty;

    public Data: any;

    public FilteredSchemaProperties: SchemaFunctionProperty[];

    public FilteredReturnSchemaProperties: SchemaFunctionProperty[];

    public Function: SchemaFunction;

    public MappingFunctions: SchemaFunction[];

    public AuditFunctionsRecursive: Function;

    public AuditFunctions: Function;

    public IsMappingFunctionNeeded: Function;

    public IsJoinFunctionNeeded: Function;

    public IsJoinPresent: Function;

    public IsGroupNeeded: Function;

    public Node: any;

    public SchemaFunctions: SchemaFunction[];

    public SelectedAvailableFunction: SchemaFunctionDefinition;

    public SelectedFalseReturnProperty: SchemaFunctionProperty;

    public SelectedTrueReturnProperty: SchemaFunctionProperty;

    public SelectedLeftCompareProperty: SchemaFunctionProperty;

    public SelectedRightCompareProperty: SchemaFunctionProperty;

    public SelectedProperty: SchemaFunctionProperty;

    public ShowAvailableProperties: boolean;

    public ShowLeftCompareText: boolean;

    public ShowFalseReturnText: boolean;

    public ShowTrueReturnText: boolean;

    public ShowPropertyText: boolean;

    public ShowSelectedProperties: boolean;

    public ShowRightCompareText: boolean;

    public Type: string;

    //	Constructors
    constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRefFunctions: MatDialogRef<SchemaFunctionDialogComponent>) {
        this.AddFunctionPropertyVisible = true;

        this.AvailableSchemaFunctions = data.availableSchemaFunctions.sort(function (a, b) {
            return (a.Name.toUpperCase() < b.Name.toUpperCase()) ? -1 : (a.Name.toUpperCase() > b.Name.toUpperCase()) ? 1 : 0
        });

        this.AvailableSchemaProperties = data.properties;

        this.AvailableReturnSchemaProperties = JSON.parse(JSON.stringify(this.AvailableSchemaProperties));

        this.CurrentProperty = null;

        this.Data = data;

        this.FilteredSchemaProperties = [];

        this.FilteredReturnSchemaProperties = [];

        var functionId = this.Data.functionId;

        if (functionId == "Add") {
            functionId = jsPlumbToolkitUtil.uuid();

            var newFunction: SchemaFunction = {
                ID: functionId,
                Properties: [],
                Name: "",
                Order: this.Data.schemaFunctions.length,
                Function: null,
                ExtraData: {},
                ReturnTrueSource: "self",
                ReturnTrueSourceID: null,
                ReturnTrueValue: null,
                ReturnFalseSource: "self",
                ReturnFalseSourceID: null,
                ReturnFalseValue: null,
                ReturnValueType: null
            };

            this.Data.schemaFunctions.push(newFunction);
        }

        this.Function = this.Data.schemaFunctions.filter(function (item) {
            return item.ID == functionId;
        })[0];

        if (this.Function.Function) {
            var self = this;

            this.SelectedAvailableFunction = this.AvailableSchemaFunctions.filter(function (item) {
				return item.ID == self.Function.Function.ID;
            })[0];
        }

        this.MappingFunctions = this.Data.mappingFunctions;

        this.AuditFunctions = this.Data.auditFunctions;

        this.AuditFunctionsRecursive = this.Data.auditFunctionsRecursive;

        this.IsMappingFunctionNeeded = this.Data.isMappingFunctionNeeded;

        this.IsJoinFunctionNeeded = this.Data.isJoinFunctionNeeded;

        this.IsJoinPresent = this.Data.isJoinPresent;

        if (this.Data.isGroupNeeded)
            this.IsGroupNeeded = this.Data.isGroupNeeded;
        else
            this.IsGroupNeeded = null;

        this.Node = this.Data.node;

        this.SchemaFunctions = this.Data.schemaFunctions;

        this.SelectedFalseReturnProperty = null;

        this.SelectedTrueReturnProperty = null;

        this.SelectedLeftCompareProperty = null;

        this.SelectedRightCompareProperty = null;

        this.SelectedProperty = null;

        this.ShowAvailableProperties = true;

        this.ShowFalseReturnText = false;

        this.ShowTrueReturnText = false;

        this.ShowLeftCompareText = false;

        this.ShowPropertyText = false;

        this.ShowSelectedProperties = true;

        this.ShowRightCompareText = false;

        this.Type = this.Data.type;

        this.handleEnterPress();
    }

    //	Runtime
    public ngOnInit() {
        var self = this;

        var statics = this.getStaticProperties();
        statics.reverse().forEach(function (staticFunc) {
            self.AvailableSchemaProperties.unshift(staticFunc);
            self.AvailableReturnSchemaProperties.unshift(staticFunc);
        });

        this.SchemaFunctions.filter(function (item) {
            return item.ID != self.Function.ID;
        }).forEach(f => {
            if (self.isFunctionValid(f, self.Function.ID)) {
                var newProp = new SchemaFunctionProperty();
                newProp.Source = "function";
                newProp.Property = new ForgeJSONSchema();
                newProp.Property.id = f.ID;
                newProp.Property.title = "Result of " + f.Name;
                newProp.Property.type = f.ReturnValueType ? f.ReturnValueType : f.Function.ReturnType;

                self.AvailableSchemaProperties.push(newProp);
                self.AvailableReturnSchemaProperties.push(newProp);
            }
        });

        if (this.Type == "filter" || this.Type == "join" || this.Type == "mapping") {
            this.MappingFunctions.filter(function (item) {
                return item.ID != self.Function.ID;
            }).forEach(f => {
                if (self.isFunctionValid(f, self.Function.ID)) {
                    var newProp = new SchemaFunctionProperty();
                    newProp.Source = "function";
                    newProp.Property = new ForgeJSONSchema();
                    newProp.Property.id = f.ID;
                    newProp.Property.title = "Result of " + f.Name;
                    newProp.Property.type = f.ReturnValueType ? f.ReturnValueType : f.Function.ReturnType;

                    if (self.AvailableSchemaProperties.filter(function (item) {
                        return item.Property.id == newProp.Property.id;
                    }).length == 0)
                        self.AvailableSchemaProperties.push(newProp);
                    if (self.AvailableReturnSchemaProperties.filter(function (item) {
                        return item.Property.id == newProp.Property.id;
                    }).length == 0)
                        self.AvailableReturnSchemaProperties.push(newProp);
                }
            });
        }

        //prepare incoming static function objects
        if (this.Function.Properties && this.Function.Properties.length > 0) {
            var staticProps = this.Function.Properties.filter(function (item) {
                return item.Source == "static"
            });

            staticProps.forEach(function (item) {
                var staticDefs = statics.filter(function (staticFunc) {
                    return staticFunc.Property.id == item.Property.id;
                });

                if (staticDefs.length > 0) {
                    item.Property.title = staticDefs[0].Property.title;
                    item.Property.type = staticDefs[0].Property.type;
                }
            });
        }
        var self = this;

        this.ShowSelectedProperties = this.Function.Properties.length > 0;

        this.GetFilteredSchemaFunctionProperties();

        this.GetFilteredReturnSchemaFunctionProperties();

        if (this.Function.Function && (this.Function.Function.FunctionType == "Comparison" || this.Function.Function.FunctionType == "Conditional")) {

            if (this.Function.Properties.length == 2) {
                if (self.Function.Properties[0].Property) {
                    this.SelectedLeftCompareProperty = this.AvailableSchemaProperties.filter(function (item) {
                        return item.Property.id == self.Function.Properties[0].Property.id;
                    })[0];
                    if (this.SelectedLeftCompareProperty.Source == "static" && this.staticPropsToShowText.indexOf(this.SelectedLeftCompareProperty.Property.id) > -1)
                        this.ShowLeftCompareText = true;
                    else
                        this.ShowLeftCompareText = false;
                }

                if (self.Function.Properties[1].Property) {
                    this.SelectedRightCompareProperty = this.FilteredSchemaProperties.filter(function (item) {
                        return item.Property.id == self.Function.Properties[1].Property.id;
                    })[0];

                    if (this.SelectedRightCompareProperty.Source == "static" && this.staticPropsToShowText.indexOf(this.SelectedRightCompareProperty.Property.id) > -1)
                        this.ShowRightCompareText = true;
                    else
                        this.ShowRightCompareText = false;
                }
            }
        }

        if (this.Function.ReturnTrueSource != "self") {
            if (this.Function.ReturnTrueSource == "static") {
                this.SelectedTrueReturnProperty = this.FilteredReturnSchemaProperties.filter(function (item) {
                    return item.Property.id == self.Function.ReturnTrueSourceID;
                })[0];
            }
            else if (this.Function.ReturnTrueSource != "static") {
                this.SelectedTrueReturnProperty = this.FilteredReturnSchemaProperties.filter(function (item) {
                    return item.Property.id == self.Function.ReturnTrueValue;
                })[0];
            }

            if (this.SelectedTrueReturnProperty && this.SelectedTrueReturnProperty.Source == "static" && this.staticPropsToShowText.indexOf(this.SelectedTrueReturnProperty.Property.id) > -1)
                this.ShowTrueReturnText = true;
            else
                this.ShowTrueReturnText = false;
        }

        if (this.Function.ReturnFalseSource != "self") {
            if (this.Function.ReturnFalseSource == "static") {
                this.SelectedFalseReturnProperty = this.FilteredReturnSchemaProperties.filter(function (item) {
                    return item.Property.id == self.Function.ReturnFalseSourceID;
                })[0];
            }
            else if (this.Function.ReturnFalseSource != "static") {
                this.SelectedFalseReturnProperty = this.FilteredReturnSchemaProperties.filter(function (item) {
                    return item.Property.id == self.Function.ReturnFalseValue;
                })[0];
            }

            if (this.SelectedFalseReturnProperty && this.SelectedFalseReturnProperty.Source == "static" && this.staticPropsToShowText.indexOf(this.SelectedFalseReturnProperty.Property.id) > -1)
                this.ShowFalseReturnText = true;
            else
                this.ShowFalseReturnText = false;
        }

        this.GetFilteredReturnSchemaFunctionProperties();
    }

    //	API Methods
    public AddFunctionProperty() {
        var prop = JSON.parse(JSON.stringify(this.CurrentProperty));

        this.CurrentProperty.StaticValue = null;
        this.CurrentProperty.StaticValueType = null;

        prop.Order = this.Function.Properties.length;

        this.Function.Properties.push(prop);

        this.GetFilteredSchemaFunctionProperties();
    }

    public CanSave() {
        if (!this.Function.Name || !this.Function.Function)
            return false;

        switch (this.Function.Function.FunctionType) {
            case "Standard":
            case "Aggregate":
                {
                    if (this.Function.Properties.length < this.Function.Function.MinProperties)
                        return false;
                }
                break;
            case "Comparison":
                {
                    if (this.Function.Properties.length != 2 || !this.Function.Properties[0].Property || !this.Function.Properties[1].Property)
                        return false;
                    if (this.Type == "mapping") {
                        if (!this.SelectedTrueReturnProperty || !this.SelectedFalseReturnProperty)
                            return false;
                    }
                }
                break;
            case "Conditional":
                {
                    if (this.Function.Properties.length < 2)
                        return false;
                    if (this.Type == "mapping") {
                        if (!this.SelectedTrueReturnProperty || !this.SelectedFalseReturnProperty)
                            return false;
                    }
                }
                break;
            case "RegEx":
                {
                    if (this.Function.Properties.length != 2 || !this.Function.Properties[0].StaticValue)
                        return false;
                }
                break;
            case "Between":
                {
                    if (this.Function.Properties.length != 3 || !this.Function.Properties[0].StaticValue || !this.Function.Properties[1].StaticValue)
                        return false;
                }
                break;
        }
        return true;
    }

    public Done() {
        this.Function.ExtraData.Refactored = false;

        this.Function.ExtraData.HasErrors = false;

        this.dialogRefFunctions.close(
            {
                data: {
                    schemaFunctions: this.SchemaFunctions
                },
                confirm: true
            });
    }

    public FalseReturnChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedFalseReturnProperty));

        this.Function.ReturnFalseSource = prop.Source;
        this.Function.ReturnFalseValue = null;
        if (!this.Function.ReturnValueType)
            this.Function.ReturnValueType = "null";
        if (prop.Property.type != "null")
            this.Function.ReturnValueType = prop.Property.type;
        if (this.Function.ReturnFalseSource == "static")
            this.Function.ReturnFalseValue = prop.StaticValue;

        this.Function.ReturnFalseSourceID = prop.Property.id;

        if (prop.Source == "property") {
            this.Function.ReturnFalseSourceID = prop.SchemaID;
            this.Function.ReturnFalseValue = prop.Property.id;
        }

        this.AuditFunctions(this.Function.ID, this.Node, this.Node, null, this.AuditFunctionsRecursive, this.IsMappingFunctionNeeded, this.IsJoinFunctionNeeded, this.IsJoinPresent, this.IsGroupNeeded);

        if (prop.Source == "static" && this.staticPropsToShowText.indexOf(prop.Property.id) > -1)
            this.ShowFalseReturnText = true;
        else
            this.ShowFalseReturnText = false;

        this.GetFilteredReturnSchemaFunctionProperties();
    }

    public FunctionChanged() {
        this.Function.Properties = new Array<SchemaFunctionProperty>();

        this.ShowPropertyText = false;
        this.ShowLeftCompareText = false;
        this.ShowRightCompareText = false;
        this.ShowTrueReturnText = false;
        this.ShowFalseReturnText = false;

        this.SelectedProperty = null;
        this.SelectedLeftCompareProperty = null;
        this.SelectedRightCompareProperty = null;
        this.SelectedTrueReturnProperty = null;
        this.SelectedFalseReturnProperty = null;

        this.Function.Function = this.SelectedAvailableFunction;

        if (this.Function.Function.FunctionType == "Comparison" || this.Function.Function.FunctionType == "RegEx" ||
            this.Function.Function.FunctionType == "Between") {
            this.Function.Properties.push(new SchemaFunctionProperty());

            if (this.Function.Function.FunctionType == "Comparison") {
                this.Function.Properties.push(new SchemaFunctionProperty());
                this.Function.Properties[0].Order = 0;
                this.Function.Properties[1].Order = 1;
            }
            else if (this.Function.Function.FunctionType == "RegEx") {
                this.Function.Properties[0] = JSON.parse(JSON.stringify(this.getStaticProperties().filter(function (staticProp) {
                    return staticProp.Property.id == "static_string";
                })[0]));

                this.Function.Properties[0].Order = 0;
            }
            else if (this.Function.Function.FunctionType == "Between") {
                this.Function.Properties.push(new SchemaFunctionProperty());

                this.Function.Properties[0] = JSON.parse(JSON.stringify(this.getStaticProperties().filter(function (staticProp) {
                    return staticProp.Property.id == "static_number";
                })[0]));

                this.Function.Properties[1] = JSON.parse(JSON.stringify(this.getStaticProperties().filter(function (staticProp) {
                    return staticProp.Property.id == "static_number";
                })[0]));

                this.Function.Properties[0].Order = 0;
                this.Function.Properties[1].Order = 1;
            }
        }

        this.GetFilteredSchemaFunctionProperties();
        this.GetFilteredReturnSchemaFunctionProperties();

        this.AuditFunctions(this.Function.ID, this.Node, this.Node, null, this.AuditFunctionsRecursive, this.IsMappingFunctionNeeded, this.IsJoinFunctionNeeded, this.IsJoinPresent, this.IsGroupNeeded);
    }

    public GetFilteredReturnSchemaFunctionProperties() {
        var self = this;

        this.FilteredReturnSchemaProperties = this.AvailableReturnSchemaProperties.filter(function (item) {
            var isAllowed = true;

            if (self.Function.Function && item.Property) {
                if (self.SelectedTrueReturnProperty && self.SelectedTrueReturnProperty.Property.type != item.Property.type &&
                    item.Property.type != "null" && self.SelectedTrueReturnProperty.Property.type != "null")
                    isAllowed = false;
            }

            return isAllowed;
        });

        //if the true selection filters out what was already selected on the false, remove the false selection
        if (this.Function.Function && this.selectableReturnFunctionTypes.indexOf(this.Function.Function.FunctionType) > -1) {
            var self = this;

            if (this.SelectedTrueReturnProperty && this.SelectedFalseReturnProperty && this.FilteredReturnSchemaProperties.filter(function (item) {
                return item.Property.id == self.SelectedFalseReturnProperty.Property.id
            }).length == 0) {
                this.SelectedFalseReturnProperty = null;
                this.ShowFalseReturnText = false;
                this.Function.ReturnFalseValue = null;
            }
        }
    }

    public GetFilteredSchemaFunctionProperties() {
        var self = this;

        this.ShowAvailableProperties = true;
        this.ShowSelectedProperties = true;

        var propLength = this.Function.Properties.length;

        if (this.IsRegExType())
            propLength = propLength - 1;
        else if (this.IsBetweenType())
            propLength = propLength - 2;
        else if (this.IsConditionalCompareType())
            propLength = propLength - 2;

        if (propLength > 0) {
            if (!this.Function.Function.AllowMultipleIncomming) {
                this.ShowAvailableProperties = false;
            }
        }

        this.FilteredSchemaProperties = this.AvailableSchemaProperties.filter(function (item) {
            var isAllowed = true;

            if (self.Function.Function && item.Property) {
                if (self.Function.Function.AllowedIncommingTypes.indexOf(item.Property.type.toString()) == -1)
                    isAllowed = false;

                if (!self.Function.Function.AllowDifferentIncommingTypes &&
                    self.Function.Properties.length > 0 && self.Function.Properties[0].Property &&
                    item.Property.type != self.Function.Properties[0].Property.type &&
                    self.Function.Properties[0].Property.type != "null" &&
                    item.Property.type != "null")
                    isAllowed = false;

                if (item.Source == 'function') {
                    var existing = self.SchemaFunctions.filter(function(func) { return func.ID == item.Property.id })[0];
                    if (!existing)
                        existing = self.MappingFunctions.filter(function(func) { return func.ID == item.Property.id })[0];
                    if (!self.isFunctionValid(existing, self.Function.ID))
                        isAllowed = false;
                }
            }

            return isAllowed;
        });

        var maxProperties = this.defaultMaxProperties;

        if (this.Function.Function)
            maxProperties = this.Function.Function.MaxProperties;

        //if the left selection filters out what was already selected on the right, remove the right selection
        if (this.Function.Function && this.Function.Function.FunctionType == "Comparison") {
            var self = this;

            if (this.SelectedRightCompareProperty && this.FilteredSchemaProperties.filter(function (item) {
                return item.Property.id == self.SelectedRightCompareProperty.Property.id
            }).length == 0) {
                this.SelectedRightCompareProperty = null;
                this.ShowRightCompareText = false;
                this.Function.Properties[1] = new SchemaFunctionProperty();
            }
        }
        if (this.FilteredSchemaProperties.length == 0 || (this.Function.Function && this.Function.Function.FunctionType != "Comparison" && propLength == maxProperties))
            this.ShowAvailableProperties = false;

        if (propLength == 0)
            this.ShowSelectedProperties = false;
    }

    public IsBetweenType() {
        return this.Function.Function != null && this.Function.Function.FunctionType == 'Between'
    }

    public IsConditionalCompareType() {
        return this.Function.Function != null && (this.Function.Function.FunctionType == 'Comparison')
    }

    public IsPropertySelectionType() {
        return this.Function.Function != null && (this.Function.Function.FunctionType == 'Standard'
            || this.Function.Function.FunctionType == 'Aggregate'
            || this.Function.Function.FunctionType == 'RegEx'
            || this.Function.Function.FunctionType == 'Between'
            || this.Function.Function.FunctionType == 'Conditional')
    }

    public IsRegExType() {
        return this.Function.Function != null && this.Function.Function.FunctionType == 'RegEx'
    }

    public IsSelectableReturnType() {
        return this.Function.Function != null && this.selectableReturnFunctionTypes.indexOf(this.Function.Function.FunctionType) > -1;
    }

    public LeftComparisonPropertyChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedLeftCompareProperty));

        prop.Order = 0;

        this.Function.Properties[0] = prop;

        if (prop.Source == "static" && this.staticPropsToShowText.indexOf(prop.Property.id) > -1)
            this.ShowLeftCompareText = true;
        else
            this.ShowLeftCompareText = false;

        this.GetFilteredSchemaFunctionProperties();
    }

    public PropertyChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedProperty));

        this.CurrentProperty = prop;

        if (this.SelectedProperty.Source == "static" && this.staticPropsToShowText.indexOf(prop.Property.id) > -1)
            this.ShowPropertyText = true;
        else
            this.ShowPropertyText = false;
    }

    public RightComparisonPropertyChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedRightCompareProperty));

        prop.Order = 1;

        this.Function.Properties[1] = prop;

        if (prop.Source == "static" && this.staticPropsToShowText.indexOf(prop.Property.id) > -1)
            this.ShowRightCompareText = true;
        else
            this.ShowRightCompareText = false;

        this.GetFilteredSchemaFunctionProperties();
    }

    public RemoveFunctionProperty(order: number) {
        this.Function.Properties = this.Function.Properties.filter(function (item) {
            return item.Order != order;
        }).map(function (item) {
            if (item.Order > order)
                item.Order--;

            return item;
        });

        this.GetFilteredSchemaFunctionProperties();
    }

    public SortSuccess() {
        for (var i = 0; i < this.Function.Properties.length; i++) {
            this.Function.Properties[i].Order = i;
        }
    }

    public TrueReturnChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedTrueReturnProperty));

        this.Function.ReturnTrueSource = prop.Source;
        this.Function.ReturnTrueValue = null;
        if (!this.Function.ReturnValueType)
            this.Function.ReturnValueType = "null";
        if (prop.Property.type != "null")
            this.Function.ReturnValueType = prop.Property.type;
        if (this.Function.ReturnTrueSource == "static")
            this.Function.ReturnTrueValue = prop.StaticValue;

        this.Function.ReturnTrueSourceID = prop.Property.id;

        if (prop.Source == "property") {
            this.Function.ReturnTrueSourceID = prop.SchemaID;
            this.Function.ReturnTrueValue = prop.Property.id;
        }

        this.AuditFunctions(this.Function.ID, this.Node, this.Node, null, this.AuditFunctionsRecursive, this.IsMappingFunctionNeeded, this.IsJoinFunctionNeeded, this.IsJoinPresent, this.IsGroupNeeded);

        if (prop.Source == "static" && this.staticPropsToShowText.indexOf(prop.Property.id) > -1)
            this.ShowTrueReturnText = true;
        else
            this.ShowTrueReturnText = false;

        this.GetFilteredReturnSchemaFunctionProperties();
    }

    //	Helpers
    protected getStaticProperties(): Array<SchemaFunctionProperty> {
        var list = new Array<SchemaFunctionProperty>();

        var newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_true";
        newProp.Property.title = "true";
        newProp.Property.type = "boolean";
        newProp.StaticValue = "1";
        newProp.StaticValueType = "boolean";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_false";
        newProp.Property.title = "false";
        newProp.Property.type = "boolean";
        newProp.StaticValue = "0";
        newProp.StaticValueType = "boolean";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_null";
        newProp.Property.title = "NULL";
        newProp.Property.type = "null";
        newProp.StaticValue = "null";
        newProp.StaticValueType = "null";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_notnull";
        newProp.Property.title = "NOT NULL";
        newProp.Property.type = "notnull";
        newProp.StaticValue = "NOT NULL";
        newProp.StaticValueType = "notnull";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_number";
        newProp.Property.title = "number";
        newProp.Property.type = "double";
        newProp.StaticValue = null;
        newProp.StaticValueType = "double";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_integer";
        newProp.Property.title = "integer";
        newProp.Property.type = "integer";
        newProp.StaticValue = null;
        newProp.StaticValueType = "integer";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_string";
        newProp.Property.title = "string";
        newProp.Property.type = "string";
        newProp.StaticValue = null;
        newProp.StaticValueType = "string";
        list.push(newProp);

        newProp = new SchemaFunctionProperty();
        newProp.Source = "static";
        newProp.Property = new ForgeJSONSchema;
        newProp.Property.id = "static_datetime";
        newProp.Property.title = "datetime";
        newProp.Property.type = "datetime";
        newProp.StaticValue = null;
        newProp.StaticValueType = "datetime";
        list.push(newProp);

        return list;
    }

    protected handleEnterPress() {
        var self = this;

        window.onkeyup = function (this: Window, ev: KeyboardEvent) {
            if (ev.keyCode == 13) {
                (<HTMLElement>document.getElementById("modalConfirmButton")).click();
            }
        }
    }

    protected isFunctionValid(func: SchemaFunction, currentFunctionId: any) {
        var isAllowed = true;
        var self = this;

        if (func.Function.FunctionType == 'Aggregate' && self.Function && self.Function.Function && self.Function.Function.FunctionType == 'Aggregate')
            isAllowed = false;

        func.Properties.forEach(function (prop) {
            if (prop.Property && prop.Property.id && prop.Property.id == currentFunctionId)
                isAllowed = false;

            if (prop.Source == "function") {
                var existingFunction = self.SchemaFunctions.filter(function (item) {
                    return item.ID == prop.Property.id;
                });

                if (existingFunction.length > 0) {

                    var functionAllowed = self.isFunctionValid(existingFunction[0], currentFunctionId);
                    if (!functionAllowed)
                        isAllowed = false
                }

            }
        });

        if (func.ReturnTrueSource == "function") {
            if (func.ReturnTrueSourceID == currentFunctionId || func.Function.FunctionType == 'Aggregate')
                isAllowed = false;

            var existingReturnFunction = self.SchemaFunctions.filter(function (item) {
                return item.ID == func.ReturnTrueSourceID;
            });

            if (existingReturnFunction.length > 0) {
                var returnFunctionAllowed = self.isFunctionValid(existingReturnFunction[0], currentFunctionId);
                if (!returnFunctionAllowed)
                    isAllowed = false;
            }
        }

        if (func.ReturnFalseSource == "function") {
            if (func.ReturnFalseSourceID == currentFunctionId || func.Function.FunctionType == 'Aggregate')
                isAllowed = false;

            var existingReturnFunction = self.SchemaFunctions.filter(function (item) {
                return item.ID == func.ReturnFalseSourceID;
            });

            if (existingReturnFunction.length > 0) {
                var returnFunctionAllowed = self.isFunctionValid(existingReturnFunction[0], currentFunctionId);
                if (!returnFunctionAllowed)
                    isAllowed = false;
            }
        }

        return isAllowed;
    }
}
