import { Component, OnInit } from '@angular/core';

import { MatDialog, MatDialogRef } from '@angular/material';

import { jsPlumbToolkit, Surface } from "jsplumbtoolkit";

import { FlowManagerComponent, FlowManagerData } from './flow-manager';

import { FlowLayoutBehavior } from "./jsPlumbToolkit/flow-layout-behavior";
import { FlowModule, FlowModuleShapeTypes } from '@lcu/apps';

@Component({
	selector: 'flow-module',
	templateUrl: './flow-module.html',
})

export class FlowModuleComponent implements OnInit {

	//	Fields
	protected mgrDialog: MatDialogRef<FlowManagerComponent>;

    public obj: FlowModule;

    public ModuleShape: any;

	protected surface: Surface;

	protected token: string;

    protected toolkit: jsPlumbToolkit;


	//	Properties

	//	Constructors
	constructor(public dialog: MatDialog) {
        this.token = this.newToken();

        this.ModuleShape = FlowModuleShapeTypes;
	}

	//	Runtime

	public ngOnInit() {
		this.obj.Token = this.token;

		this.toolkit.updateNode(this.toolkit.getNode(this.obj.ID), this.obj);

		window.addEventListener('message', (ev) => {
			var data = this.shouldHandle('IoTFlow', ev);

			if (data)
				this.handleSettingsMessage(data);
		}, false);
	}

	//	API Methods
	public Abs(input: number) {
		return Math.abs(input);
	}

	public OpenFlowManager(node: any) {
		var self = this;
		var flowId = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];

		//runOnRouteParam(this.route, 'id', (params) => {
		//    flowId = params['id'];
		//});

		this.mgrDialog = this.dialog.open(FlowManagerComponent, {
            disableClose: true,
            panelClass: 'module-manager-container',
			data: <FlowManagerData>{
				IncommingModules: {
					_app: "IoTFlow:IncommingModules",
					Items: this.toolkit.getNode(this.obj.ID).getEdges().filter(function (item) {
						return item.target.id == self.obj.ID;
                    }).map(x => {
                        var sid = '';

                        if (x.source.data && x.source.data && x.source.data.Settings && x.source.data.Settings.SchemaFlow &&
                            x.source.data.Settings.SchemaFlow.SchemaNodes && x.source.data.Settings.SchemaFlow.SchemaNodes.length > 0) {
                            var ogNodes = x.source.data.Settings.SchemaFlow.SchemaNodes.filter(function (item) {
                                return item.Data.SchemaType == 'outgoing' && item.OutgoingModuleIDs.indexOf(self.obj.ID) > -1;
                            });

                            if (ogNodes.length > 0)
                                sid = ogNodes[0].JSONSchemaID;
                        }

						return {
							id: x.source.id,
                            name: x.source.data.Text,
                            schemaId: sid
						}
					})
				},
				ManagementPath: this.obj.ManagementPath,
				ManagerHeight: this.obj.ManagerHeight,
				ManagerWidth: this.obj.ManagerWidth,
				OutgoingModules: {
					_app: "IoTFlow:OutgoingModules",
					Items: this.toolkit.getNode(this.obj.ID).getEdges().filter(function (item) {
						return item.source.id == self.obj.ID
					}).map(x => {
						return {
							id: x.target.id,
							name: x.target.data.Text,
							type: x.target.data.Service,
							status: x.target.data.Status
						}
					})
				},
				SchemaOptions: [],
				Settings: this.obj.Settings || {},
				Token: this.token,
				ModuleTypeName: this.obj.Text,
				UnavailableLookups: [],
				FirstLoad: false,
				Service: this.obj.Service,
				Application: this.obj.Application,
				FlowID: flowId
			}
		});
	}

	//	Helpers
	protected handleSettingsMessage(settings: any) {
		this.obj.Settings = settings;

		var successObj = { confirm: true };

		this.dialog.openDialogs.forEach(function (modal) {
			modal.close(successObj);
		});

		//if (this.mgrDialog)
		//    this.mgrDialog.close(successObj);
		//else
		//{
		//    this.dialog._openDialogs.forEach(function (modal) {
		//        modal.close(successObj);
		//    });
		//}

		window.postMessage({
			_type: 'SettingsUpdated',
			Settings: settings,
			NodeID: this.obj.ID
		}, '*');
	}

	protected newToken() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	protected shouldHandle(app: string, ev: MessageEvent) {
		try {
			var data = ev.data ? JSON.parse(ev.data) : null;

			var handle = data && data._app == app && data._token == this.token;

			return handle ? data : null;
		} catch (e) {
			return null;
		}
	}
}
