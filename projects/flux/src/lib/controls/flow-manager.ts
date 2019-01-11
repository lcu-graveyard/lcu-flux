import { Component, ElementRef, AfterViewInit, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FlowModule, ForgeJSONSchema } from '@lcu/apps';

export class FlowManagerData {
	public IncommingModules: {
		_app: string,
		Items: FlowModule[]
	}

	public ManagementPath: string;

	public ManagerHeight: number;

	public ManagerWidth: number;

	public OutgoingModules: {
		_app: string,
		Items: FlowModule[]
	}

	public SchemaOptions: ForgeJSONSchema[];

	public Settings: any;

	public Token: string;

	public UnavailableLookups: any[];

	public ModuleTypeName: string;

	public FirstLoad: boolean;

	public Service: string;

	public Application: string;

	public FlowID: string;
}

@Component({
	selector: 'flow-manager',
	templateUrl: './flow-manager.html',
})
export class FlowManagerComponent implements AfterViewInit, OnInit {
	//	Fields

	//	Properties
	public Data: FlowManagerData;

	public Loading: boolean;

	public ManagementPath: SafeResourceUrl;

	//	Constructors
	constructor(@Inject(MAT_DIALOG_DATA) protected data: FlowManagerData, protected container: ElementRef,
		protected sanitizer: DomSanitizer) {
		this.Data = data;

        this.Loading = true;

        this.LoadManagementPath();
	}

	//	Runtime
	public ngAfterViewInit() {
		this.handleDimensionsMessage({
			height: this.Data.ManagerHeight,
			width: this.Data.ManagerWidth
		});

		var iframe = (<HTMLElement>this.container.nativeElement).querySelector('iframe');

		iframe.addEventListener('ready', (e) => {
			this.Loading = false;
		});

		iframe.addEventListener('load', (e) => {
			this.Loading = false;

			this.postMessageToChild({
				Settings: this.Data.Settings,
				Options: this.Data.SchemaOptions,
				IncommingModules: this.Data.IncommingModules,
				OutgoingModules: this.Data.OutgoingModules,
				UnavailableLookups: this.Data.UnavailableLookups,
				ModuleTypeName: this.Data.ModuleTypeName,
				FirstLoad: this.Data.FirstLoad,
				Application: this.Data.Application,
				Service: this.Data.Service,
				FlowID: this.Data.FlowID,

			}, 'IoTFlow:Settings');
		});
	}

	public ngOnInit() {
		window.addEventListener('message', (ev) => {
			if (this.shouldHandle('IoTFlow:Dimensions', ev))
				this.handleDimensionsMessage(JSON.parse(ev.data));
		}, false);
	}

	//	API Methods
	public LoadManagementPath() {
		this.ManagementPath = this.sanitizer.bypassSecurityTrustResourceUrl(`${this.Data.ManagementPath}?token=${this.Data.Token}`);//&settings=${settings}
	}

	//	Helpers
	protected handleDimensionsMessage(dimensions: any) {
		var iframe = this.container.nativeElement.querySelector('iframe');

		if (iframe) {
			if (dimensions.height) {
				iframe.height = "";

				iframe.height = dimensions.height + "px";
			}

			if (dimensions.width) {
				iframe.width = "";

				iframe.width = dimensions.width + "px";
			}
		}
	}

	protected postMessageToChild(data: any, app: string) {
		var iframe = (<HTMLElement>this.container.nativeElement).querySelector('iframe');

		data._app = app;

		iframe.contentWindow.postMessage(JSON.stringify(data), '*');
	}

	protected shouldHandle(app: string, ev: MessageEvent) {
		try {
			var data = ev.data ? JSON.parse(ev.data) : null;

			var handle = data && data._app == app && data._token == this.Data.Token;

			return handle ? data : null;
		} catch (e) {
			return null;
		}
	}
}
