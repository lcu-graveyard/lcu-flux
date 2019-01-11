import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { jsPlumbToolkitUtil } from "jsplumbtoolkit";

@Component({
    selector: 'schema-groups',
    templateUrl: './schema-groups.html',
})

export class SchemaGroupsDialogComponent implements OnInit {
    //	Fields
   
    //	Properties
    public TimestampProperties: any[];

    public AvailableProperties: any[];

    public Data: any;

    public Error: string;

    public Groups: any[];

    public Node: any;

    public SelectedProperty: any;

    public Timestamp: any;

    public TumblingWindow: boolean;

    public TumblingInterval: string;

    public TumblingIntervalValue: number;

    //	Constructors
    constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRefGroups: MatDialogRef<SchemaGroupsDialogComponent>) {
        this.Data = data;

        this.Error = '';

        this.Groups = new Array();
 
        this.Node = this.Data.node;

        this.TumblingWindow = false;

        this.TumblingInterval = 'milliseconds';

        this.TumblingIntervalValue = 1;

        this.handleEnterPress();
    }

    //	Runtime
    public ngOnInit() {
        var self = this;
        var usedPorts = [];

        if (this.Node.data.Groups) {
            this.Node.data.Groups.forEach(function (portId) {
                var correctKey = Object.keys(self.Node.data.Schema.properties).filter(function(key) {
                    var prop = self.Node.data.Schema.properties[key];

                    return prop.id == portId;
                })[0];
                
                var title = self.Node.data.Schema.properties[correctKey].title;

                self.Groups.push({ id: portId, title: title });
                usedPorts.push(portId);
            });
        }

        if (this.Node.data.TumblingWindow)
            this.TumblingWindow = true;

        if (this.Node.data.TumblingInterval)
            this.TumblingInterval = this.Node.data.TumblingInterval;

        if (this.Node.data.TumblingIntervalValue)
            this.TumblingIntervalValue = this.Node.data.TumblingIntervalValue;

        this.SelectedProperty = null;

        this.AvailableProperties = [];
        this.TimestampProperties = [];

        Object.keys(this.Node.data.Schema.properties).forEach(function (key) {
            var prop = self.Node.data.Schema.properties[key];

            if (usedPorts.indexOf(prop.id) == -1) {
                self.AvailableProperties.push({ id: prop.id, title: prop.title });
            }
            
            if (prop.type == "datetime")
                self.TimestampProperties.push({ id: prop.id, title: prop.title });
        });

        this.SortGroups();
        this.SortAvailableProperties();
        this.SortTimestampProperties();

        this.Timestamp = this.TimestampProperties.filter(function (prop) { return prop.id == self.Node.data.Timestamp })[0];
    }

    //	API Methods
    public AddGroup() {
        this.Groups.push(this.SelectedProperty);

        this.SortGroups();

        this.RemoveAvailableProperty(this.SelectedProperty.id);
    }

    public Done() {
        if (this.isValid()) {
            this.dialogRefGroups.close(
                {
                    data: {
                        groups: this.Groups.map(function (group) {
                            return group.id;
                        }),
                        tumblingWindow: this.TumblingWindow,
                        tumblingInterval: this.TumblingInterval,
                        tumblingIntervalValue: this.TumblingIntervalValue,
                        timestamp: this.Timestamp.id
                    },
                    confirm: true
                });
        }
    }

    public RemoveAvailableProperty(id: string) {
        var idx = -1;
        var current = 0;

        this.AvailableProperties.forEach(function (prop) {
            if (prop.id == id)
                idx = current;

            current++;
        });

        if (idx > -1)
            this.AvailableProperties.splice(idx, 1);
    }

    public RemoveGroup(id: string) {
        var idx = -1;
        var current = 0;

        this.Groups.forEach(function (group) {
            if (group.id == id)
                idx = current;

            current++;
        });

        if (idx > -1) {
            this.AvailableProperties.push(this.Groups[idx]);
            this.Groups.splice(idx, 1);
            this.SortAvailableProperties();
        }
    }

    public SortTimestampProperties() {
        this.TimestampProperties.sort(function (a, b) {
            if (a.title > b.title)
                return 1;
            else if (a.title < b.title)
                return -1;

            return 0;
        });
    }

    public SortAvailableProperties() {
        this.AvailableProperties.sort(function (a, b) {
            if (a.title > b.title)
                return 1;
            else if (a.title < b.title)
                return -1;

            return 0;
        });
    }

    public SortGroups() {
        this.Groups.sort(function (a, b) {
            if (a.title > b.title)
                return 1;
            else if (a.title < b.title)
                return -1;

            return 0;
        });
    }

    public SortSuccess() {
       
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

    protected isValid() {
        this.Error = '';

        if (!this.Timestamp)
            this.Error = 'Timestamp field is required';
        else if (this.TumblingWindow) {
            if (!this.TumblingInterval)
                this.Error = 'Tumbling Interval is required';
            else if (!this.TumblingIntervalValue || !parseInt(this.TumblingIntervalValue.toString()) || parseInt(this.TumblingIntervalValue.toString()) < 1 || parseInt(this.TumblingIntervalValue.toString()) > 1000)
                this.Error = 'Tumbling Interval Value is required and must be an integer between 1 and 1000';
        }

        if (this.Error)
            return false;

        return true;
    }
}
