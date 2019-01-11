import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ForgeJSONSchema } from '@lcu/apps';

export class SimulationProperty
        {
    public name: string;
    public id: string;
    public value: string;
    public type: string;
    public identifier: boolean;
    public error: string;
    public extraData: {};
        };


@Component({
	selector: 'json-schema-simulation',
	templateUrl: './json-schema-simulation.html',
})
export class JSONSchemaSimulationComponent implements OnChanges, OnInit {
	//	Fields

	//	Properties
	@Output('propertiesChange')
    public Changed: EventEmitter<SimulationProperty[]>;

    @Output('has-errors')
    public HasErrors: boolean;

	@Input('force-id')
	public ForceID: boolean;

	@Input('schema-properties')
	public Properties: ForgeJSONSchema[];

    @Input('properties')
    public SimulationProperties: SimulationProperty[];

    @Input('sim-helpers')
    public SimulationHelperOptions: any[];

	public get SimulationPropertiesKeys(): string[] {
        return this.SimulationProperties.map(function(item) { return item.name });
	}

	//	Constructors
	constructor() {
        this.Changed = new EventEmitter();
	}

	//	Runtime
    public ngOnChanges(changes: SimpleChanges) {
        if (JSON.stringify(changes.Properties.currentValue) != JSON.stringify(changes.Properties.previousValue))
		    this.setupSimulationProperties();
	}

	public ngOnInit() {
		if (!this.SimulationProperties)
			this.SimulationProperties = [];

		this.setupSimulationProperties();
	}

	//	API Methods
	public EmitChange() {
		this.Changed.emit(this.SimulationProperties);
	}

    public ExtraDataChanged(propId: string, value: any) {
        var prop = this.SimulationProperties.filter(function(item) {
            return item.id == propId;
        })[0];

        prop.extraData[value.id] = value.value;
        prop.error = value.error;

        this.EmitChange();
    }

	public ValueChanged(propId: string, value: any) {
        this.SimulationProperties.filter(function(item) {
            return item.id == propId;
        })[0].value = value;

		this.EmitChange();
    }

	//	Helpers
    protected setupSimulationProperties() {
        if (!this.Properties || this.Properties.length == 0)
            return;

        var self = this;

        var schProps = this.Properties.map(function(p) { return { title: p.title, type: p.type } });

        var simProps = this.SimulationProperties.map(function(p) { return { name: p.name, type: p.type } });

		simProps.forEach((simKey) => {
            if (!schProps.some(sp => sp.title == simKey.name && sp.type == simKey.type)) {
                var idx = -1;
                for (var i = 0; i < this.SimulationProperties.length; i++) {
                    if (self.SimulationProperties[i].name == simKey.name)
                        idx = i;
                }

                if (idx > -1)
                    this.SimulationProperties.splice(idx, 1);
            }
		});

        this.Properties.forEach((prop) => {
            if (prop.title && prop.type) {
                var simProp = this.SimulationProperties.filter(function(item) {
                    return item.name == prop.title;
                })[0];

                var add = false;
                if (!simProp)
                    add = true;

                if (this.ForceID && prop.sourceRef == "IsIdentitfier")
                    simProp = {
                        id: prop.id,
                        name: prop.title,
                        value: '{deviceId}',
                        type: prop.type.toString(),
                        identifier: true,
                        error: "",
                        extraData: {}
                    };
                else
                    simProp = {
                        id: prop.id,
                        name: prop.title,
                        value: simProp ? simProp.value : '',
                        type: prop.type.toString(),
                        identifier: false,
                        error: "",
                        extraData: {}
                    };

                if (add)
                    this.SimulationProperties.push(simProp);
            }
		});

		this.EmitChange();
	}
}
