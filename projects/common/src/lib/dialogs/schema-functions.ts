import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { SchemaFunctionProperty, SchemaFunctionDefinition, SchemaFunction, ForgeJSONSchema } from '@lcu/apps';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { SchemaFunctionDialogComponent } from './schema-function';

@Component({
    selector: 'schema-functions',
    templateUrl: './schema-functions.html',
})

export class SchemaFunctionsDialogComponent implements OnInit {
    //	Fields
    protected maxFunctions = 15;

    //	Properties
    public AddFunctionVisible: boolean;

    public AvailableSchemaProperties: SchemaFunctionProperty[];

    public AvailableSchemaFunctions: SchemaFunctionDefinition[];

    public Data: any;

    public ExpectedReturnType: string;

    public MappingFunctions: SchemaFunction[];

    public AuditFunctionsRecursive: Function;

    public AuditFunctions: Function;

    public IsMappingFunctionNeeded: Function;

    public IsJoinFunctionNeeded: Function;

    public IsJoinPresent: Function;

    public IsGroupNeeded: Function;

    public Node: any;

    public ReturnRefactored: boolean;

    public SchemaFunctions: SchemaFunction[];

    public SchemaFunctionsReturnSource: string;

    public SchemaFunctionsReturnSourceID: string;

    public SchemaFunctionsReturnValue: string;

    public SchemaFunctionsReturnValueType: string;

    public SelectedReturnFunction: SchemaFunctionProperty;

    public ShowAddSchemaFunction: boolean;

    public Type: string;

    //	Constructors
    constructor(public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRefFunctions: MatDialogRef<SchemaFunctionsDialogComponent>) {
        this.AddFunctionVisible = data.schemaFunctions.length < this.maxFunctions;

        this.AvailableSchemaFunctions = data.availableSchemaFunctions;

        this.AvailableSchemaProperties = data.properties;

        this.Data = data;

        this.ExpectedReturnType = this.Data.expectedReturnType;

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

        this.ReturnRefactored = false;

        this.SchemaFunctions = this.Data.schemaFunctions;

        this.SchemaFunctionsReturnSource = this.Data.schemaFunctionsReturnSource;

        this.SchemaFunctionsReturnSourceID = this.Data.schemaFunctionsReturnSourceID;

        this.SchemaFunctionsReturnValue = this.Data.schemaFunctionsReturnValue;

        this.SchemaFunctionsReturnValueType = this.Data.schemaFunctionsReturnValueType;

        this.SelectedReturnFunction = null;

        this.Type = this.Data.type;

        this.handleEnterPress();
    }

    //	Runtime
    public ngOnInit() {
        var self = this;

        this.addExistingFunctionsAsProperties();

        if (this.SchemaFunctionsReturnSourceID) {
            this.SelectedReturnFunction = this.AvailableSchemaProperties.filter(function (item) {
                return item.Property.id == self.SchemaFunctionsReturnSourceID;
            })[0];
        }
    }

    //	API Methods
    public AddNewFunction(ev: any) {
        this.showFunctionEditor('Add');
    }

    public EditFunction(id: string) {
        this.showFunctionEditor(id);
    }

    public Done() {
        this.dialogRefFunctions.close(
            {
                data: {
                    schemaFunctions: this.SchemaFunctions,
                    schemaFunctionsReturnSource: this.SchemaFunctionsReturnSource,
                    schemaFunctionsReturnSourceID: this.SchemaFunctionsReturnSourceID,
                    schemaFunctionsReturnValue: this.SchemaFunctionsReturnValue,
                    schemaFunctionsReturnValueType: this.SchemaFunctionsReturnValueType,
                },
                confirm: true
            });
    }

    public GetFilteredAvailableSchemaProperties() {
        var self = this;

        var list = [];

        this.AvailableSchemaProperties.filter(function (item) {
            return item.StaticValueType == self.ExpectedReturnType || (item.Source != "property" && item.Property && item.Property.type == self.ExpectedReturnType);
        }).forEach(function (item) {
            list.push(item);
        });            ;

        return list;
    }

    public RemoveFunction(id: string) {
        var func = this.SchemaFunctions.filter(function (item) {
            return item.ID == id;
        })[0];

        this.SchemaFunctions = this.SchemaFunctions.filter(function (item) {
            return item.ID != id;
        }).map(function (item) {
            if (item.Order > func.Order)
                item.Order--;

            return item;
        });

        this.AvailableSchemaProperties = this.AvailableSchemaProperties.filter(function (item) {
            return item.Property.id != id;
        });

        this.AuditFunctions(id, this.Node, this.Node, null, this.AuditFunctionsRecursive, this.IsMappingFunctionNeeded, this.IsJoinFunctionNeeded, this.IsJoinPresent, this.IsGroupNeeded);

        if (this.SchemaFunctionsReturnSourceID) {
            var self = this;

            var existingFunction;

            if (this.SchemaFunctions) {
                existingFunction = this.SchemaFunctions.filter(function (item) {
                    return item.ID == self.SchemaFunctionsReturnSourceID;
                });
            }

            if (this.SchemaFunctionsReturnSource == "function" && existingFunction && existingFunction.length == 0) {
                this.SchemaFunctionsReturnSource = null;
                this.SchemaFunctionsReturnSourceID = null;
                this.SchemaFunctionsReturnValue = null;
                this.SchemaFunctionsReturnValueType = null;
                this.SelectedReturnFunction = null;
            }
        }

        this.AddFunctionVisible = this.SchemaFunctions.length < this.maxFunctions;
    }

    public ReturnFunctionChanged() {
        var prop = JSON.parse(JSON.stringify(this.SelectedReturnFunction));

        this.SchemaFunctionsReturnSource = prop.Source;
        this.SchemaFunctionsReturnSourceID = prop.Property.id;
        this.SchemaFunctionsReturnValue = null;
        this.SchemaFunctionsReturnValueType = null;

        this.ReturnRefactored = false;
    }

    public SortSuccess() {
        for (var i = 0; i < this.SchemaFunctions.length; i++) {
            this.SchemaFunctions[i].Order = i;
        }
    }

    //	Helpers
    protected addExistingFunctionsAsProperties() {
        var self = this;
        this.AvailableSchemaProperties = this.AvailableSchemaProperties.filter(function (item) {
            return item.Source != "function"
        });

        this.SchemaFunctions.filter(function (item) {
            return self.AvailableSchemaProperties.filter(function (prop) {
                return prop.Property.id == item.ID;
            }).length == 0;
        }).forEach(f => {
            var newProp = new SchemaFunctionProperty();
            newProp.Source = "function";
            newProp.Property = new ForgeJSONSchema();
            newProp.Property.id = f.ID;
            newProp.Property.title = "Result of " + f.Name;
            newProp.Property.type = f.ReturnValueType ? f.ReturnValueType : f.Function.ReturnType;

            self.AvailableSchemaProperties.push(newProp);
            });

        if (this.Type == 'filter' || this.Type == "join" || this.Type == "mapping") {
            this.MappingFunctions.filter(function (item) {
                return self.AvailableSchemaProperties.filter(function (prop) {
                    return prop.Property.id == item.ID;
                }).length == 0;
            }).forEach(f => {
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
            });
        }

        if (this.SchemaFunctionsReturnSourceID) {
            this.SelectedReturnFunction = this.AvailableSchemaProperties.filter(function (item) {
                return item.Property.id == self.SchemaFunctionsReturnSourceID;
            })[0];

            var filtered = this.GetFilteredAvailableSchemaProperties().filter(function (item) {
                return item.Property.id == self.SchemaFunctionsReturnSourceID;
            });

            if (filtered.length == 0) {
                this.SelectedReturnFunction = null;
                this.SchemaFunctionsReturnSource = null;
                this.SchemaFunctionsReturnSourceID = null;
                this.SchemaFunctionsReturnValue = null;
                this.SchemaFunctionsReturnValueType = null;
                this.ReturnRefactored = true;
            }
        }
    }
    protected handleEnterPress() {
        var self = this;

        window.onkeyup = function (this: Window, ev: KeyboardEvent) {
            if (ev.keyCode == 13) {
                (<HTMLElement>document.getElementById("modalConfirmButton")).click();
            }
        }
    }

    protected showFunctionEditor(functionId: string) {
        var action = (functionId == "Add" ? "Add" : "Edit");

        let dialogRefFunction = this.dialog.open(SchemaFunctionDialogComponent, {
            data: {
                availableSchemaFunctions: this.AvailableSchemaFunctions,
                mappingFunctions: this.MappingFunctions,
                schemaFunctions: JSON.parse(JSON.stringify(this.SchemaFunctions)),
                properties: JSON.parse(JSON.stringify(this.AvailableSchemaProperties.filter(function (item) { return item.Source != "function" }))),
                functionId: functionId,
                title: action + ' ' + this.Type.charAt(0).toUpperCase() + this.Type.slice(1) + ' Function - ' + this.Data.title.split(' - ')[1],
                type: this.Type,
                auditFunctionsRecursive: this.AuditFunctionsRecursive,
                auditFunctions: this.AuditFunctions,
                isMappingFunctionNeeded: this.IsMappingFunctionNeeded,
                isGroupNeeded: this.IsGroupNeeded,
                isJoinFunctionNeeded: this.IsJoinFunctionNeeded,
                isJoinPresent: this.IsJoinPresent,
                node: this.Node
            },
            width: '100%',
            height: '100%'
        });

        dialogRefFunction.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                this.SchemaFunctions = result.data.schemaFunctions;

                this.AddFunctionVisible = this.SchemaFunctions.length < this.maxFunctions;

                this.addExistingFunctionsAsProperties();

                if (!this.SelectedReturnFunction && this.GetFilteredAvailableSchemaProperties().length > 0) {
                    this.SelectedReturnFunction = this.GetFilteredAvailableSchemaProperties()[0];
                    this.ReturnFunctionChanged();
                }

                return true;
            }

            return false;
        });
    }
}
