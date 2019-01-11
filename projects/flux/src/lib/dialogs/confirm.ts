import { Component, ElementRef, EventEmitter, AfterViewInit, OnInit, Input, Inject, Output, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
	selector: 'confirm-dialog-module',
	templateUrl: './confirm.html',
})

export class ConfirmDialogComponent {
	//	Fields

	//	Properties
	public Data: any;

	//	Constructors
    constructor( @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ConfirmDialogComponent>) {
        this.Data = data;

        this.handleEnterPress();
	}

	//	Runtime
	
	//	API Methods
    public Confirm() {
        this.dialogRef.close(true);
    }
	
	//	Helpers
    protected handleEnterPress() {
        var self = this;

        window.onkeyup = function (this: Window, ev: KeyboardEvent) {
            if (ev.keyCode == 13) {
                self.Confirm();
            }
        }
    }	
}
