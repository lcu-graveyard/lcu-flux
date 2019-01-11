import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { isResultSuccess } from '@lcu/core';
import { FlowService } from '@lcu/flux';
import { FlowConfig, FlowModule, FlowStream } from '@lcu/apps';

@Component({
	selector: 'create-flux-dialog-module',
	templateUrl: './create-flux.dialog.html',
})
export class CreateFluxDialogComponent {
	//	Fields
    protected lookup: string;

	//	Properties
    public Data: any;

    public Description: string;

    public Error: string;

    public get Lookup(): string {
        return this.lookup.toLowerCase();
    }

    public set Lookup(value: string) {
        this.lookup = value.toLowerCase();
    }

    public Name: string;

    public Saving: boolean;

	//	Constructors
    constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<CreateFluxDialogComponent>, protected flowSvc: FlowService) {

        this.Data = data;

        this.handleEnterPress();

        this.Name = "";
        this.Description = "";
        this.Lookup = "";

        this.Error = null;
        this.Saving = false;
	}

	//	Runtime

	//	API Methods
    public CanSave() {
        return (this.Name.trim() && this.Description.trim() && this.Lookup.trim());
    }

    public Confirm(flowId: string) {
        this.Data.FlowID = flowId;

        this.dialogRef.close({data: this.Data, confirm: true});
    }

    public Save() {
        var self = this;
        this.Error = null;
        this.Saving = true;

        var model = new FlowConfig();
        model.Name = this.Name;
        model.Lookup = this.Lookup;
        model.Description = this.Description;
        model.Modules = new Array<FlowModule>();
        model.Streams = new Array<FlowStream>();

        var result = self.flowSvc.Create(model).subscribe(
            (result) => {
                if (isResultSuccess(result))
                    self.Confirm(result.Model);
                else if (result.Status.Code = 409)
                    self.Error = "Lookup already exists";

                this.Saving = false;
            });
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
}
