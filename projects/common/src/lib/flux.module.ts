import { SchemaJoinDialogComponent } from './dialogs/schema-join';
import { SchemaGroupsDialogComponent } from './dialogs/schema-groups';
import { NgModule, ModuleWithProviders, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCardModule, MatIconModule, MatSelectModule, MatGridListModule, MatDialogModule, MatAutocompleteModule, MatRadioModule, MatToolbarModule, MatTooltipModule } from '@angular/material';

import { FlexLayoutModule } from '@angular/flex-layout'

import { FathymSharedModule } from '@lcu/hosting';
import { FlowModuleComponent } from './controls/flow-module';
import { FlowTableComponent } from './controls/flow-table';
import { ConfirmDialogComponent } from './dialogs/confirm';
import { SchemaFunctionsDialogComponent } from './dialogs/schema-functions';
import { SchemaInputDialogComponent } from './dialogs/schema-input';
import { FlowLayoutBehavior } from './controls/jsPlumbToolkit/flow-layout-behavior';
import { FlowManagerComponent } from './controls/flow-manager';
import { ModuleSchemaLayoutBehavior } from './controls/jsPlumbToolkit/module-schema-layout-behavior';
import { SchemaFunctionDialogComponent } from './dialogs/schema-function';
import { SingleInputDialogComponent } from './dialogs/single-input';
import { jsPlumbToolkitModule } from './svc/jsplumbtoolkit-angular';
import { FlowParser } from './svc/flow-parser';
import { CronTimerService } from './svc/cronTimerSvc';
import { SchemaFlowService } from './svc/schema-flow';
import { FlowService } from './svc/flow.service';
import { JSONSchemaEditorComponent } from './controls/json-schema-editor';
import { JSONSchemaSimulationComponent } from './controls/json-schema-simulation';
import { JSONSchemaValueComponent } from './controls/json-schema-property-value';
import { CronTimerComponent } from './controls/cron-timer';
import { DndModule } from '@beyerleinf/ngx-dnd';
import { FlowsConfigContext } from './contexts/flows-config.context';
import { DeviceService } from './svc/device';
import { FlowLayoutConfiguration } from './controls/jsPlumbToolkit/flow-layout-configuration';
import { ModuleSchemaLayoutConfiguration } from './controls/jsPlumbToolkit/module-schema-layout-configuration';

var comps = [
	ConfirmDialogComponent,
	CronTimerComponent,
	JSONSchemaEditorComponent,
	JSONSchemaSimulationComponent,
	JSONSchemaValueComponent,
	FlowLayoutBehavior,
	FlowManagerComponent,
	FlowModuleComponent,
	FlowTableComponent,
	ModuleSchemaLayoutBehavior,
	SchemaFunctionDialogComponent,
	SchemaFunctionsDialogComponent,
	SchemaGroupsDialogComponent,
	SchemaInputDialogComponent,
	SingleInputDialogComponent,
	SchemaJoinDialogComponent,
];

@NgModule({
	imports: [
    FathymSharedModule,
		FlexLayoutModule,
		ReactiveFormsModule,
		jsPlumbToolkitModule,
		DndModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatDialogModule,
		MatCardModule,
		MatCheckboxModule,
		MatFormFieldModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatProgressSpinnerModule,
		MatRadioModule,
		MatSelectModule,
		MatToolbarModule,
		MatTooltipModule,
	],
	declarations: [
		...comps
	],
	exports: [
		...comps
	],
	entryComponents: [
		...comps
	],
	schemas: [
		CUSTOM_ELEMENTS_SCHEMA
	],
})
export class FluxModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: FluxModule,
			providers: [
				CronTimerService,
				DeviceService,
				FlowLayoutConfiguration,
				FlowParser,
				FlowsConfigContext,
				FlowService,
				ModuleSchemaLayoutConfiguration,
				SchemaFlowService,
			]
		};
	}
}
