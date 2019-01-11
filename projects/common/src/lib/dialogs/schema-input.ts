import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ForgeJSONSchema } from '@lcu/apps';

@Component({
	selector: 'schema-input-dialog-module',
	templateUrl: './schema-input.html',
})

export class SchemaInputDialogComponent {
	//	Fields

	//	Properties
    public Data: any;

    public CurrentModuleConnection: any;

    public ContainsFunctions: boolean;

    public FlowID: string;

    public DisableSchemaEdit: boolean;

    public Schemas: ForgeJSONSchema[];

    public SchemaType: string;

    public HangingIncommingSchemas: any[];

    public HangingOutgoingSchemas: any[];

    public OutgoingSchemas: any[];

    public UsingHangingSchema: string;

    public UsingExistingOutgoing: string;

    public IncommingModules: any[];

    public OutgoingModules: any[];

    public Schema: ForgeJSONSchema;

    public SchemaNameValid: boolean;



    public ShouldSaveSchema: boolean;

    //public SchemaChanged: Function;

    public SelectedIncommingModuleID: string;

    public SelectedOutgoingModuleIDs: string[];



	//	Constructors
    constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SchemaInputDialogComponent>) {
        this.Data = data;

        this.CurrentModuleConnection = this.Data.CurrentModuleConnection;

        this.FlowID = this.Data.FlowID;

        this.DisableSchemaEdit = this.Data.DisableSchemaEdit;

        this.Schemas = data.Schemas;

        this.SchemaType = this.Data.SchemaType;

        this.HangingIncommingSchemas = this.Data.HangingIncommingSchemas;

        this.HangingOutgoingSchemas = this.Data.HangingOutgoingSchemas;

        this.OutgoingSchemas = this.Data.OutgoingSchemas;



        this.IncommingModules = this.Data.IncommingModules;

        this.OutgoingModules = this.Data.OutgoingModules;

        if (!this.CurrentModuleConnection)
            this.OutgoingSchemas = [];



        this.UsingHangingSchema = "";

        this.UsingExistingOutgoing = "";

        this.ContainsFunctions = this.Data.ContainsFunctions;

        this.Schema = data.Schema;





        this.ShouldSaveSchema = true;

        //this.SchemaChanged = data.SchemaChanged;

        this.SelectedIncommingModuleID = this.Data.IncommingModuleID;

        this.SelectedOutgoingModuleIDs = this.Data.OutgoingModuleIDs;

        //this.SelectedOutgoingModuleID = "";
        if (!this.SelectedOutgoingModuleIDs)
            this.SelectedOutgoingModuleIDs = [];

        if (this.CurrentModuleConnection && this.SchemaType == "incomming")
            this.SelectedIncommingModuleID = this.CurrentModuleConnection.id;
        else if (this.CurrentModuleConnection && this.SchemaType == "outgoing") {
            if (this.SelectedOutgoingModuleIDs.indexOf(this.CurrentModuleConnection.id) == -1)
                this.SelectedOutgoingModuleIDs.push(this.CurrentModuleConnection.id);
        }

        this.handleEnterPress();

        this.SchemaNameValid = true;
	}

	//	Runtime

	//	API Methods
    public Cancel() {
        this.dialogRef.close();
    }

    public DisableSchemaEditChanged(val: boolean) {
        this.DisableSchemaEdit = val;

        if (val)
            this.ShouldSaveSchema = false;
        else
            this.ShouldSaveSchema = true;
    }

    public UsingHangingSchemaChanged(val: string) {
        this.UsingHangingSchema = val;
    }

    public UsingExistingOutgoingChanged(val: string) {
        this.UsingExistingOutgoing = val;
    }

    public CanSave() {
        return this.Schema && this.Schema.title && Object.keys(this.Schema.properties).length > 0 && this.SchemaNameValid;
    }

    public Done() {
        var self = this;

        this.recurseSchemaForIDs(self.Schema);

        this.Data.Schema = this.Schema;

        this.Data.DisableSchemaEdit = this.DisableSchemaEdit;
        this.Data.IncommingModuleID = this.SelectedIncommingModuleID;
        this.Data.OutgoingModuleIDs = this.SelectedOutgoingModuleIDs;
        this.Data.UsingHangingSchema = this.UsingHangingSchema;
        this.Data.UsingExistingOutgoing = this.UsingExistingOutgoing;

        this.dialogRef.close({data: this.Data, confirm: true, shouldSave: this.ShouldSaveSchema});
    }

    public PrepareSchemaTypeText() {
        return this.SchemaType.charAt(0).toUpperCase() + this.SchemaType.slice(1);
    }

    public PropertyAdded(schema: ForgeJSONSchema){
        this.Data.PropertyAdded(this.Data.ctx, schema);
    }

    public PropertyTypeChanged(propertyId: string) {
        this.Data.PropertyTypeChanged(this.Data.ctx, this.Schema, propertyId);
    }

    public PropertyDeleted(schema: ForgeJSONSchema) {
        this.Data.PropertyDeleted(this.Data.ctx, schema);
    }

    public SchemaChanged(schema: ForgeJSONSchema) {
        this.Schema = schema;
        this.SchemaNameValid = true;

        if (this.Schema.additionalProperties)
            this.SchemaNameValid = true;
        else if (this.Schema.additionalProperties == false)
            this.SchemaNameValid = false;


        this.Data.SchemaChanged(schema);
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

    protected recurseSchemaForIDs(schema: ForgeJSONSchema) {
        var self = this;

        Object.keys(schema.properties).forEach(function (key) {
            if (schema.properties[key].id.indexOf("temp") > -1)
                schema.properties[key].id = null;
            if (schema.properties[key].type == "object")
                self.recurseSchemaForIDs(schema.properties[key].oneOf[0]);
        });

    }
}
