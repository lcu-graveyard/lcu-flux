import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
	selector: 'single-input-dialog-module',
	templateUrl: './single-input.html',
})

export class SingleInputDialogComponent {
	//	Fields

	//	Properties
	public Data: any;

	//	Constructors
    constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SingleInputDialogComponent>) {
        this.Data = data;

        this.handleEnterPress();
	}

	//	Runtime
	
	//	API Methods
    public Confirm(val: string) {
        this.data.inputValue = val;
        this.dialogRef.close({data: this.Data, confirm: true});
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
