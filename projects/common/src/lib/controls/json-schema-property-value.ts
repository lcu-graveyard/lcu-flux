import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { isArray, isObject } from 'util';
import { ForgeJSONSchema } from '@lcu/apps';

@Component({
	selector: 'json-schema-property-value',
	templateUrl: './json-schema-property-value.html',
})
export class JSONSchemaValueComponent implements OnInit {
	//	Fields

	//	Properties
	@Output('valueChange')
    public Changed: EventEmitter<any>;

    @Output('dataChange')
    public DataChanged: EventEmitter<any>;

    @Output('error')
    public Error: string;

	public NewSimulatedArrayValue: string;

	@Input('property-id')
	public PropertyID: string;

	@Input('property')
	public Property: any;

	@Input('sim-helpers')
    public SimulationHelperOptions: any[];

    public SimulationHelperOptionsDateTime: string[];

    public SimulationHelperOptionsInteger: string[];

    public SimulationHelperOptionsNumber: string[];

    public SimulationHelperOptionsString: string[];

	@Input('value')
    public Value: any;

	//	Constructors
	constructor() {
        this.Changed = new EventEmitter();

        this.DataChanged = new EventEmitter();

        this.Error = "";
	}

	//	Runtime
	public ngOnInit() {
		if (this.Property.type == 'object' && (!this.Value || !isObject(this.Value)))
			this.Value = {};

		if (this.Property.type == 'array' && (!this.Value || !isArray(this.Value)))
			this.Value = [];

        this.SimulationHelperOptionsDateTime = this.SimulationHelperOptions.filter(function (item) { return item.type == 'datetime' }).map(function (item) { return item.id });
        this.SimulationHelperOptionsInteger = this.SimulationHelperOptions.filter(function (item) { return item.type == 'integer' }).map(function (item) { return item.id });
        this.SimulationHelperOptionsNumber = this.SimulationHelperOptions.filter(function (item) { return item.type == 'number' }).map(function (item) { return item.id });
        this.SimulationHelperOptionsString = this.SimulationHelperOptions.filter(function (item) { return item.type == 'string' }).map(function (item) { return item.id });
	}

	//	API Methods
	public AddSimulatedArrayValue() {
		if (!this.NewSimulatedArrayValue)
			return;

		this.Value.push(this.NewSimulatedArrayValue);

		this.NewSimulatedArrayValue = '';

		this.EmitChange();
	}

	public EmitChange() {
		this.Changed.emit(this.Value);
    }

    public EmitDataChange(id: string, value: any) {
        if (id == 'minNum' || id == 'minInt')
            id = 'min';
        else if (id == 'maxNum' || id == 'maxNum')
            id = 'max';
        else if (id == 'listInt' || id == 'listNum' || id == 'listStr')
            id = 'list';

        this.DataChanged.emit({ id: id, value: value, error: this.Error });
    }

	public IsSiumlationPropertyOfType(types: string[], except: boolean = false) {
		if (!except)
			return types.some(t => this.Property.type == t);
		else
			return types.every(t => this.Property.type != t);
	}

	public PropertiesChanged(properties: { [id: string]: { Prop: ForgeJSONSchema, Value: any } }) {
		this.Value = properties;

		this.EmitChange();
	}

	public RemoveSimulatedArrayValue(value: string) {
		this.Value.splice(this.Value.indexOf(value), 1);

		this.EmitChange();
	}

	public ValueChanged(value: any) {
        this.Value = value;
        this.Property.extraData = {};

        this.Error = "";
        this.Property.error = "";

        if (this.SimulationHelperOptions.filter(function(item) {
            return item.id == value && item.params == true;
        }).length > 0) {
            this.Error = "Value required";
            this.Property.error = "init";
        }
        else if (this.SimulationHelperOptions.filter(function(item) {
            return item.id == value;
        }).length > 0) {
            //do nothing
        }
        else {
            if (this.Property.type == "integer") {
                if (!value || !parseInt(value) || !Number(value) || value.indexOf('.') > -1) {
                    this.Error = "Valid integer is required";
                    this.Property.error = "Valid integer required";
                }
            }
            else if (this.Property.type == "number" || this.Property.type == "double") {
                if (!value || !parseFloat(value) || !Number(value)) {
                    this.Error = "Valid number is required";
                    this.Property.error = "Valid number required";
                }
            }
            else if (this.Property.type == "datetime") {
                if (!value || !Date.parse(value)) {
                    this.Error = "Valid datetime is required";
                    this.Property.error = "Valid datetime required";
                }
            }
            else {
                this.Error = "";
                this.Property.error = "";
            }
        }

		this.Changed.emit(this.Value);
    }

    public ExtraDataChanged(type: string, value: any) {
        this.Error = "";

        if (type == "moveBy" && (!value || !parseFloat(value) || !Number(value)))
            this.Error = "Valid number is required";
        else if (type == "randomCount" || type == "static") {
            if (type == "randomCount") {
                if (!value || !parseInt(value) || !Number(value) || value.indexOf('.') > -1)
                    this.Error = "Valid integer is required";
                else if (!this.Property.extraData.static)
                    this.Error = "Static string required";
            }
            else if (type == "static") {
                if (!this.Property.randomCount)
                    this.Error = "Number of random characters required";
            }
        }
        else if (type == "maxInt" || type == "minInt") {
            if (!value || !parseInt(value) || !Number(value) || value.indexOf('.') > -1)
                this.Error = "Valid integer is required";

            if (type == "maxInt") {
                if (parseInt(this.Property.extraData.min) && parseInt(value) && parseInt(this.Property.extraData.min) >= parseInt(value))
                    this.Error = "Max must be greater than min";
                else if (!this.Property.extraData.min)
                    this.Error = "Min value required";
            }
            else if (type == "minInt") {
                if (parseInt(value) && parseInt(this.Property.extraData.max) && parseInt(value) >= parseInt(this.Property.extraData.max))
                    this.Error = "Max must be greater than min";
                else if (!this.Property.extraData.max)
                    this.Error = "Max value required";
            }

        }
        else if (type == "maxNum" || type == "minNum") {
            if (!value || !parseFloat(value) || !Number(value))
                this.Error = "Valid number is required";

            if (type == "maxNum") {
                if (parseFloat(this.Property.extraData.min) && parseFloat(value) && parseFloat(this.Property.extraData.min) >= parseFloat(value))
                    this.Error = "Max must be greater than min";
                else if (!this.Property.extraData.min)
                    this.Error = "Min value required";
            }
            else if (type == "minNum") {
                if (parseFloat(value) && parseFloat(this.Property.extraData.max) && parseFloat(value) >= parseFloat(this.Property.extraData.max))
                    this.Error = "Max must be greater than min";
                else if (!this.Property.extraData.max)
                    this.Error = "Max value required";
            }
        }
        else if (type == "weights" || type == "listInt" || type == "listNum" || type == "listStr") {
            if (!value)
                this.Error = "Value required";
            else if (value.indexOf(' ') > -1)
                this.Error = "No spaces allowed";
            else {
                if (type == "listInt") {
                    var err = false;
                    value.toString().split(',').forEach(function(item) {
                        if (!item || !parseInt(item) || !Number(item) || item.indexOf('.') > -1)
                            err = true;
                    });
                    if (err)
                        this.Error = "All list values must be integers";
                    else if (!this.Property.extraData.weights || this.Property.extraData.weights.split(',').length != value.split(',').length)
                        this.Error = "Must be same amount of weights as values";
                }
                else if (type == "listNum") {
                    var err = false;
                    value.toString().split(',').forEach(function(item) {
                        if (!item || !parseFloat(item) || !Number(item))
                            err = true;
                    });
                    if (err)
                        this.Error = "All list values must be numbers";
                    else if (!this.Property.extraData.weights || this.Property.extraData.weights.split(',').length != value.split(',').length)
                        this.Error = "Must be same amount of weights as values";
                }
                else if (type == "weights") {
                    var total = 0;
                    var err = false;
                    value.toString().split(',').forEach(function(item) {
                        if (!item || !parseFloat(item) || !Number(item))
                            err = true;
                        else
                            total += parseFloat(item);
                    });
                    if (err)
                        this.Error = "All weight values must be numbers";
                    else if (total != 100)
                        this.Error = "Weights must add up to 100";
                    else if (!this.Property.extraData.list || this.Property.extraData.list.split(',').length != value.split(',').length)
                        this.Error = "Must be same amount of weights as values";
                }
            }
        }

        this.EmitDataChange(type, value);
    }

	//	Helpers
}
