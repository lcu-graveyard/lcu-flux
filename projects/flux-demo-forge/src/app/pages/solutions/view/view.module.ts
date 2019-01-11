import { NgModule } from '@angular/core';
import { MatGridListModule, MatMenuModule, MatIconModule, MatToolbarModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressBarModule, MatTabsModule } from '@angular/material';
import { DndModule } from '@beyerleinf/ngx-dnd';

import { FathymSharedModule } from '@lcu/hosting';

import { UIModule } from '../../../ui.module';

import { SolutionsViewRouterModule } from './view.router';

var comps = [
	//...SolutionsViewRoutingComponents,
];

@NgModule({
	imports: [
		FathymSharedModule,
		UIModule,
		SolutionsViewRouterModule,
		DndModule,
		MatButtonModule,
		MatFormFieldModule,
		MatGridListModule,
		MatIconModule,
		MatInputModule,
		MatMenuModule,
		MatProgressBarModule,
		MatTabsModule,
		MatToolbarModule,
	],
	declarations: [
		...comps,
	],
	exports: [
		...comps,
	],
	entryComponents: [
		...comps,
	]
})
export class SolutionsViewModule {
}
