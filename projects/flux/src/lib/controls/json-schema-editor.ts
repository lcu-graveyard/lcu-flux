import { Component, EventEmitter, Inject, Input, OnInit, OnChanges, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { jsPlumbToolkitUtil } from "jsplumbtoolkit";
import { isResultSuccess } from '@lcu/core';
import { MatDialog, MatSnackBar, MatSnackBarConfig } from '@angular/material';
import { SchemaFlowService } from '../svc/schema-flow';
import { ConfirmDialogComponent } from '../dialogs/confirm';
import { ForgeJSONSchema } from '@lcu/apps';

@Component({
    selector: 'json-schema-editor',
    templateUrl: './json-schema-editor.html',
})
export class JSONSchemaEditorComponent implements OnInit {
    //	Fields
    protected snackBarConfig: MatSnackBarConfig;

    //	Properties
    public CurrentlyEditingSettingsFor: ForgeJSONSchema;

    @Input('contains-functions')
    public ContainsFunctions: boolean;

    @Input('nested')
    public Nested: boolean;

    @Input('parent-title')
    public ParentTitle: string;

    @Input('prop-key')
    public PropertyKey: string;

    @Input('hanging-in-schemas')
    public HangingIncommingSchemas: any[];

    @Input('hanging-out-schemas')
    public HangingOutgoingSchemas: any[];

    @Input('outgoing-schemas')
    public OutgoingSchemas: any[];

    @Input('schema-type')
    public SchemaType: string;

    @Output('schemaChanged')
    public Changed: EventEmitter<ForgeJSONSchema>;

    @Output('disableEditChanged')
    public DisableEditChanged: EventEmitter<boolean>;

    @Output('using-hanging-schema-changed')
    public UsingHangingSchemaChanged: EventEmitter<string>;

    @Output('using-exsiting-outgoing-changed')
    public UsingExistingOutgoingChanged: EventEmitter<string>;

    @Output('propertyAdded')
    public PropertyAdded: EventEmitter<ForgeJSONSchema>;

    @Output('propertyTypeChanged')
    public PropertyTypeChanged: EventEmitter<string>;

    @Output('propertyDeleted')
    public PropertyDeleted: EventEmitter<ForgeJSONSchema>;

    @Input('schema')
    public Schema: ForgeJSONSchema;

    @Input('flowId')
    public FlowID: string;

    @Input('schemas')
    public Schemas: ForgeJSONSchema[];

    @Input('show-validations')
    public ShowValidations: boolean;

    @Input('disable-edit')
    public DisableSchemaEdit: boolean;

    public FlowSchemas: ForgeJSONSchema[];

    public OrgSchemas: ForgeJSONSchema[];

    public SelectedExistingSchemaType: string;

    public NewProperty: ForgeJSONSchema;

    public NewPropertyTypeError: string;

    public NewPropertyTitleError: string;

    public SchemaNameValid: boolean;

    public ShowSchema: boolean;

    public SelectedExistingSchema: ForgeJSONSchema;

    public SelectedExistingOutgoing: any;

    public SelectedHangingSchema: any;

    public SortedProperties: string[];

    public UsingHangingSchema: string;

    public UsingExistingOutgoing: string;

    //	Constructors
    constructor(public snackBar: MatSnackBar, public dialog: MatDialog, protected schemaFlowSvc: SchemaFlowService) {
        this.Changed = new EventEmitter();

        this.DisableEditChanged = new EventEmitter();

        this.PropertyAdded = new EventEmitter();

        this.PropertyTypeChanged = new EventEmitter();

        this.PropertyDeleted = new EventEmitter();

        this.UsingExistingOutgoingChanged = new EventEmitter();

        this.UsingHangingSchemaChanged = new EventEmitter();

        this.SelectedExistingSchema = null;

        this.SelectedExistingOutgoing = null;

        this.UsingHangingSchema = "";

        this.DisableSchemaEdit = true;

        this.ShowSchema = false;

        this.SelectedExistingSchemaType = "flow";

        this.NewProperty = <ForgeJSONSchema>{
            oneOf: [<ForgeJSONSchema>{}]
        };

        this.NewPropertyTitleError = "";

        this.NewPropertyTypeError = "";

        this.snackBarConfig = {
            duration: 1000,
            panelClass: ['snack-bar-container']
        };
    }

    //	Runtime
    public ngOnChanges() {
        this.processInputChanged();
    }

    public ngOnInit() {
        this.processInputChanged();

        if (this.ShowHangingIncommingSchemas() || this.ShowHangingOutgoingSchemas())
            this.SelectedExistingSchemaType = "hanging";
        else if (this.OutgoingSchemas && this.OutgoingSchemas.length > 0)
            this.SelectedExistingSchemaType = "module";

        this.SchemaNameValid = true;
    }

    //	API Methods
    public SelectedExistingSchemaTypeChanged(ev: any) {
        this.SelectedExistingSchema = null;
        this.SelectedExistingOutgoing = null;
        this.SelectedHangingSchema = null;

        this.ShowSchema = false;
    }

    public AddNewSchema() {
        this.Schema = <ForgeJSONSchema>{ properties: {} };

        this.EmitChange();

        this.Schema.type = 'object';

        this.Schema.sourceRef = "flow";

        this.Schema.sourceTitle = "";

        this.Schema.id = jsPlumbToolkitUtil.uuid();

        this.ContainsFunctions = false;

        this.SelectedExistingSchema = null;

        this.DisableSchemaEdit = false;
        this.ShowSchema = true;

        this.EmitChange();

        this.EmitDisableEditChange();
    }

    public AddProperty() {
        var valid = true;
        this.NewPropertyTitleError = "";
        this.NewPropertyTypeError = "";

        if (!this.NewProperty.title) {
            this.NewPropertyTitleError = "Required";
            valid = false;
        }

        if (!this.NewProperty.type) {
            this.NewPropertyTypeError = "Required";
            valid = false;
        }

        if (valid) {
            var prop = <ForgeJSONSchema>{
                oneOf: [<ForgeJSONSchema>{}]
            };

            prop.title = this.NewProperty.title;
            prop.type = this.NewProperty.type;

            var index = 0;

            if (Object.keys(this.Schema.properties).length > 0)
                index = parseInt(Object.keys(this.Schema.properties)[(Object.keys(this.Schema.properties).length - 1).toString()]) + 1;

            prop.id = "temp" + new Date().toTimeString();
            this.Schema.properties[index.toString()] = prop;
            this.SortedProperties.push(prop.id);

            //this.SetEditingSettings(prop);

            this.EmitChange();

            this.EmitPropertyAdded();

            this.NewProperty = <ForgeJSONSchema>{
                oneOf: [<ForgeJSONSchema>{}]
            };

            this.snackBar.open("Property Added Successfully", "SUCCESS", this.snackBarConfig);
        }
    }

    public CheckSchemaName(newName: string) {
        this.Schema.title = newName;
        this.SchemaNameValid = true;
        var self = this;

        if (this.Schemas.filter(function (schema) {
            return schema.title == self.Schema.title && schema.id != self.Schema.id;
        }).length > 0) {
            this.SchemaNameValid = false;
        }
        else {
            this.schemaFlowSvc.GetAllJSONSchemas(self.FlowID).subscribe(//	TODO:  Filter by FlowID???
                (results) => {
                    if (isResultSuccess(results)) {
                        if (results.Model.filter(function (schema) {
                            return schema.Schema && schema.Schema.id && schema.Active && schema.Schema.title == self.Schema.title && schema.Schema.id != self.Schema.id;
                        }).length > 0) {
                            this.SchemaNameValid = false;
                        }
                    } else {
                        console.log(results);
                    }
                },
                (err) => {
                    console.log(err);
                },
                () => {

                });
        }

        this.Schema.additionalProperties = this.SchemaNameValid;

        this.EmitChange();
    }

    public EmitChange() {
        this.Changed.emit(this.Schema);
    }

    public EmitDisableEditChange() {
        this.DisableEditChanged.emit(this.DisableSchemaEdit);
    }

    public EmitPropertyAdded() {
        this.PropertyAdded.emit(this.Schema);
    }

    public EmitPropertyTypeChanged(propertyId: string) {
        this.PropertyTypeChanged.emit(propertyId);
    }

    public EmitPropertyDeleted() {
        this.PropertyDeleted.emit(this.Schema);
    }

    public EmitUsingHangingSchemaChanged() {
        this.UsingHangingSchemaChanged.emit(this.UsingHangingSchema);
    }

    public EmitUsingExistingOutgoingChanged() {
        this.UsingExistingOutgoingChanged.emit(this.UsingExistingOutgoing);
    }

    public ExistingSchemaChanged() {
        this.DisableSchemaEdit = true;
        this.ShowSchema = false;
        var self = this;
        this.Schema = <ForgeJSONSchema>{ properties: {} };

        if (this.SelectedExistingSchemaType == "hanging" && this.SelectedHangingSchema) {
            this.Schema = this.Schemas.filter(function (schema) { return schema.id == self.SelectedHangingSchema.Node.data.Schema.id })[0];

            this.DisableSchemaEdit = false;

            if (this.SelectedHangingSchema.Node.data.DisableSchemaEdit)
                this.DisableSchemaEdit = true;
            this.ShowSchema = true;
            this.UsingHangingSchema = self.SelectedHangingSchema.Node.id;

            this.EmitChange();

            this.EmitDisableEditChange();

            this.EmitUsingHangingSchemaChanged();
        }
        else if (this.SelectedExistingSchemaType == "module" && this.SelectedExistingOutgoing) {
            this.Schema = this.Schemas.filter(function (schema) {
                return schema.id == self.SelectedExistingOutgoing.data.Schema.id;
            })[0];

            this.DisableSchemaEdit = false;

            if (this.SelectedExistingOutgoing.data.DisableSchemaEdit)
                this.DisableSchemaEdit = true;
            this.ShowSchema = true;

            this.UsingExistingOutgoing = this.SelectedExistingOutgoing.data.id;


            this.EmitChange();

            this.EmitDisableEditChange();

            this.EmitUsingExistingOutgoingChanged();
        }

        this.EmitChange();
    }

    public ExistingSchemaCopy() {
        var self = this;

        this.Schema = JSON.parse(JSON.stringify(this.Schemas.filter(function (item) {
            return item.id == self.SelectedExistingSchema;
        })[0]));

        this.Schema.id = jsPlumbToolkitUtil.uuid();

        this.Schema.sourceTitle = "";

        var curIndex = 1;
        var curName = "Copy" + curIndex.toString() + " of " + this.Schema.title;

        while (this.Schemas.filter(function (item) {
            return item.title == curName;
        }).length > 0) {
            curIndex++;
            curName = "Copy" + curIndex.toString() + " of " + this.Schema.title;
        }

        this.Schema.title = curName;
        this.Schema.sourceRef = "flow";

        var self = this;

        this.SortedProperties = [];

        this.PivotProperties().forEach(function (prop) {
            self.SortedProperties.push(prop.id);
        });

        this.DisableSchemaEdit = false;
        this.ShowSchema = true;

        this.EmitChange();

        this.EmitDisableEditChange();
    }

    public ExistingSchemaUse() {
        var self = this;

        var orig = this.Schemas.filter(function (item) {
            return item.id == self.SelectedExistingSchema;
        })[0];

        this.Schema = JSON.parse(JSON.stringify(orig));

        this.DisableSchemaEdit = true;
        this.ShowSchema = true;

        this.Schema.sourceTitle = JSON.parse(JSON.stringify(orig.title));

        this.EmitChange();

        this.EmitDisableEditChange();
    }

    public IsEditingSettings(prop: ForgeJSONSchema) {
        return this.CurrentlyEditingSettingsFor == prop;
    }

    public PivotProperties() {
        var keys = Object.keys(this.Schema.properties);

        return keys.map(k => this.Schema.properties[k]);
    }

    public SchemaPropertyTypeChanged(property: any) {
        this.EmitChange();

        this.EmitPropertyTypeChanged(property.id);
    }

    public ShowHangingIncommingSchemas() {
        return this.SchemaType && this.SchemaType == "incomming" &&
            this.HangingIncommingSchemas && this.HangingIncommingSchemas.length > 0;
    }

    public ShowHangingOutgoingSchemas() {
        return this.SchemaType && this.SchemaType == "outgoing" &&
            this.HangingOutgoingSchemas && this.HangingOutgoingSchemas.length > 0;
    }

    public PropertySchemaChanged(prop: ForgeJSONSchema, schema: ForgeJSONSchema) {
        prop.oneOf = [schema];

        this.EmitChange();
    }

    public RemoveProperty(prop: any) {
        var msg = `Are you sure you want to delete property '${prop.title}'?`;

        if (!prop.title)
            msg = 'Are you sure you want to delete this property?';

        let dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { confirmText: msg, title: 'Delete' },
            width: '225px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                var id = prop.id;
                var self = this;

                var propIndex = Object.keys(this.Schema.properties).filter(function (item) {
                    return self.Schema.properties[item].id == id;
                })[0];

                delete this.Schema.properties[propIndex];

                var self = this;
                this.SortedProperties.splice(this.SortedProperties.indexOf(id), 1);

                Object.keys(this.Schema.properties).filter(function (idx) {
                    return idx > propIndex;
                }).forEach(function (idx) {
                    self.Schema.properties[(parseInt(idx) - 1).toString()] = self.Schema.properties[idx];
                    delete self.Schema.properties[idx];
                });

                this.EmitChange();

                this.EmitPropertyDeleted();
            }
        });

    }

    public SetEditingSettings(prop: ForgeJSONSchema) {
        if (this.IsEditingSettings(prop))
            this.CurrentlyEditingSettingsFor = null;
        else
            this.CurrentlyEditingSettingsFor = prop;
    }

    public SortSuccess(event: any) {
        var tmpProps = {};
        var count = 0;
        for (var key in this.Schema.properties) {
            if (this.Schema.properties[key].id)
                tmpProps[this.SortedProperties.indexOf(this.Schema.properties[key].id)] = this.Schema.properties[key];
            else
                tmpProps[this.SortedProperties.indexOf(count.toString())] = this.Schema.properties[key];
            count++;
        }

        this.Schema.properties = tmpProps;
    }

    public ValueChanged(root: any, prop: string, value: any) {
        root[prop] = value;

        this.EmitChange();
    }

    //	Helpers
    private processInputChanged() {
        if ((!this.Schema || !this.Schema.id) && !this.Nested) {
            this.Schema = <ForgeJSONSchema>{ properties: {} };

            //this.EmitChange();

            this.DisableSchemaEdit = false;
            this.ShowSchema = false;
        }
        else {
            this.ShowSchema = true;
        }

        if (!this.Schema.properties) {
            this.Schema.properties = {};

            //this.EmitChange();
        }

        this.Schema.type = 'object';

        if (this.Nested)
            this.Schema.title = this.ParentTitle;

        var self = this;

        this.SortedProperties = [];

        this.PivotProperties().forEach(function (prop) {
            self.SortedProperties.push(prop.id);
        });

        if (this.Schemas && this.Schemas.length > 0) {
            this.FlowSchemas = this.Schemas.filter(function (item) {
                return item.sourceRef == "flow";
            });

            this.OrgSchemas = this.Schemas.filter(function (item) {
                return item.sourceRef == "org";
            });
        }
        else {
            this.FlowSchemas = [];
            this.OrgSchemas = [];
        }
        if (!this.FlowSchemas)
            this.FlowSchemas = [];
        if (!this.OrgSchemas)
            this.OrgSchemas = [];

        this.OrgSchemas.sort(this.sortSchemas);

        this.Schemas.sort(this.sortSchemas);

        this.FlowSchemas.sort(this.sortSchemas);
    }

    private sortSchemas(a: ForgeJSONSchema, b: ForgeJSONSchema) {
        if (a.title.toLowerCase() < b.title.toLowerCase())
            return -1;
        else if (a.title.toLowerCase() > b.title.toLowerCase())
            return 1;
        return 0;
    }
}
