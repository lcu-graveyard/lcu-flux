import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { SchemaFunctionsDialogComponent } from './schema-functions';
import { SchemaFunction } from '@lcu/apps';

@Component({
    selector: 'schema-join',
    templateUrl: './schema-join.html',
})

export class SchemaJoinDialogComponent implements OnInit {
    //	Fields

    //	Properties
    public AvailableProperties: any[];

    public AvailableSchemaFunctions: any[];

    public Data: any;

    public JoinRelationships: any[];

    public Nodes: any[];

    public AuditFunctionsRecursive: Function;

    public AuditFunctions: Function;

    public IsMappingFunctionNeeded: Function;

    public IsJoinFunctionNeeded: Function;

    public IsJoinPresent: Function;

    public Node: any;

    public RelationshipOptions = [
        { name: "None", id: "none" },
        { name: "Main Schema", id: "main" },
        { name: "JOIN", id: "join" },
        { name: "LEFT JOIN", id: "left" }
    ];

    public TargetObj: any;

    //	Constructors
    constructor(public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRefJoin: MatDialogRef<SchemaJoinDialogComponent>) {
        this.AvailableProperties = data.availableProperties;

        this.AvailableSchemaFunctions = data.availableSchemaFunctions;

        this.Data = data;

        this.JoinRelationships = new Array();

        this.Nodes = this.Data.nodes;

        var self = this;

        this.AuditFunctions = this.Data.auditFunctions;

        this.AuditFunctionsRecursive = this.Data.auditFunctionsRecursive;

        this.IsMappingFunctionNeeded = this.Data.isMappingFunctionNeeded;

        this.IsJoinFunctionNeeded = this.Data.isJoinFunctionNeeded;

        this.IsJoinPresent = this.Data.isJoinPresent;

        this.Node = this.Data.node;

        this.TargetObj = this.Data.targetObj;

        var self = this;

        Object.keys(this.TargetObj).forEach(function (item) {
            self.JoinRelationships.push({
                nodeId: item,
                name: self.Nodes.filter(function (node) {
                    return node.data.id == item;
                })[0].data.Name,
                obj: self.TargetObj[item]
            });
        });

        this.JoinRelationships.sort(this.compareJoinRelationships);

        for (var i = 0; i < this.JoinRelationships.length; i++) {
            this.JoinRelationships[i].obj.Order = i;

            this.TargetObj[this.JoinRelationships[i].nodeId].Order = i;
        }

        this.handleEnterPress();
    }

    //	Runtime
    public ngOnInit() {
        var self = this;
    }

    //	API Methods

    public Done() {
        this.dialogRefJoin.close(
            {
                confirm: true,
                targetObj: this.TargetObj
            });
    }

    public InactiveRelationships() {
        if (this.JoinRelationships) {
            return this.JoinRelationships.filter(function (item) {
                return item.obj.Relationship == "none";
            });
        }
        return [];
    }

    public OpenSchemaFunctionManager(nodeId) {
        var self = this;

        var rel = this.JoinRelationships.filter(function (item) {
            return item.nodeId == nodeId;
        })[0];

        var availableSchemas = this.JoinRelationships.filter(function (item) {
            return item.obj.Order <= rel.obj.Order;
        }).map(function (item) {
            return item.nodeId;
        });

        var props = this.AvailableProperties.filter(function (item) {
            return availableSchemas.indexOf(item.NodeID) > -1;
        });

        let dialogRefJoinFunctions = this.dialog.open(SchemaFunctionsDialogComponent, {
            data: {
                availableSchemaFunctions: this.AvailableSchemaFunctions,
                properties: props,
                schemaFunctions: this.TargetObj[nodeId].Functions,
                title: 'Join Functions - ' + this.Data.title.split(' - ')[1] + ' : ' + this.JoinRelationships.filter(function (item) { return item.nodeId == nodeId; })[0].name,
                mappingFunctions: this.Data.mappingFunctions,
                schemaFunctionsReturnSource: this.TargetObj[nodeId].SchemaFunctionsReturnSource,
                schemaFunctionsReturnSourceID: this.TargetObj[nodeId].SchemaFunctionsReturnSourceID,
                schemaFunctionsReturnValue: this.TargetObj[nodeId].SchemaFunctionsReturnValue,
                schemaFunctionsReturnValueType: this.TargetObj[nodeId].SchemaFunctionsReturnValueType,
                type: 'join',
                auditFunctionsRecursive: this.AuditFunctionsRecursive,
                auditFunctions: this.AuditFunctions,
                isMappingFunctionNeeded: this.IsMappingFunctionNeeded,
                isJoinFunctionNeeded: this.IsJoinFunctionNeeded,
                isJoinPresent: this.IsJoinPresent,
                node: this.Node,
                expectedReturnType: "boolean"
            },
            width: '100%',
            height: '100%'
        });

        dialogRefJoinFunctions.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                this.TargetObj[nodeId].Functions = result.data.schemaFunctions;
                this.TargetObj[nodeId].Functions.forEach(function (item) {
                    item.ExtraData.HasErrors = false;
                });
                this.TargetObj[nodeId].JoinFunctionError = false;
                this.TargetObj[nodeId].SchemaFunctionsReturnSource = result.data.schemaFunctionsReturnSource;
                this.TargetObj[nodeId].SchemaFunctionsReturnSourceID = result.data.schemaFunctionsReturnSourceID;
                this.TargetObj[nodeId].SchemaFunctionsReturnValue = result.data.schemaFunctionsReturnValue;
                this.TargetObj[nodeId].SchemaFunctionsReturnValueType = result.data.schemaFunctionsReturnValueType;

                this.AuditFunctions("audit", this.Node, this.Node, null, this.AuditFunctionsRecursive, this.IsMappingFunctionNeeded, this.IsJoinFunctionNeeded, this.IsJoinPresent);
            }
        });

        return false;
    }

    public RelationshipChanged(nodeId: any) {
        var index = -1;
        var rel;

        for (var i = 0; i < this.JoinRelationships.length; i++) {
            if (this.JoinRelationships[i].nodeId == nodeId) {
                rel = this.JoinRelationships[i];
                index = i;
            }
        }

        this.TargetObj[rel.nodeId].Relationship = rel.obj.Relationship;

        if (rel.obj.Relationship == "main") {
            this.moveInArray(this.JoinRelationships, index, 0);

            for (var i = 0; i < this.JoinRelationships.length; i++) {
                this.JoinRelationships[i].obj.Order = i;

                this.TargetObj[this.JoinRelationships[i].nodeId].Order = i;
            }

            var self = this;

            this.JoinRelationships.filter(function (item) {
                return item.obj.Relationship == "main"
                    && item.nodeId != nodeId;
            }).forEach(function (item) {
                item.obj.Relationship = "join";
                self.TargetObj[item.nodeId].Relationship = "join";
            });
        }

        if (rel.obj.Relationship == "main" || rel.obj.Relationship == "none") {
            this.TargetObj[nodeId].Functions = new Array<SchemaFunction>();
            this.TargetObj[nodeId].SchemaFunctionsReturnSource = null;
            this.TargetObj[nodeId].SchemaFunctionsReturnSourceID = null;
            this.TargetObj[nodeId].SchemaFunctionsReturnValue = null;
            this.TargetObj[nodeId].SchemaFunctionsReturnValueType = null;
        }
    }

    public SortSuccess() {
        for (var i = 0; i < this.JoinRelationships.length; i++) {
            var key = this.JoinRelationships[i].nodeId;
            this.JoinRelationships[i].obj.Order = i;
            this.TargetObj[key].Order = i;

            this.TargetObj[key].Functions = new Array<SchemaFunction>();
            this.TargetObj[key].SchemaFunctionsReturnSource = null;
            this.TargetObj[key].SchemaFunctionsReturnSourceID = null;
            this.TargetObj[key].SchemaFunctionsReturnValue = null;
            this.TargetObj[key].SchemaFunctionsReturnValueType = null;

            if (i == 0) {
                this.JoinRelationships[i].obj.Relationship = 'main';
                this.RelationshipChanged(key);
            }
        }
    }

    //	Helpers
    protected handleEnterPress() {
        var self = this;

        window.onkeyup = function (this: Window, ev: KeyboardEvent) {
            if (ev.keyCode == 13) {
                (<HTMLElement>document.getElementById("modalConfirmButton")).click();
            }
        }
    }

    protected moveInArray(arr, old_index, new_index) {
        while (old_index < 0) {
            old_index += arr.length;
        }
        while (new_index < 0) {
            new_index += arr.length;
        }
        if (new_index >= arr.length) {
            var k = new_index - arr.length;
            while ((k--) + 1) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
        return arr;
    }

    protected compareJoinRelationships(a, b) {
        if (a.obj.Order < b.obj.Order)
            return -1;
        if (a.obj.Order > b.obj.Order)
            return 1;
        return 0;
    }
}
