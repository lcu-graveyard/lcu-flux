import { NgModule } from '@angular/core';
import { RouterModule, Routes, Route } from '@angular/router';
import { SolutionsViewLayoutComponent } from './view.layout';
import { ViewPage } from './view.page';

export const SolutionsViewRoutes: Routes = [
	{
		path: ":base/:type/:state",
		component: SolutionsViewLayoutComponent,
		data: {},
		children: [
			//{
			//	path: ":base/:type/:state",
			//	component: ViewPage,
			//	data: {}
			//},
			{
				path: "**",
				component: ViewPage,
				data: {}
			},
		]
	}
];

export var SolutionsViewRoutingComponents: any[] = [
	SolutionsViewLayoutComponent,
	ViewPage,
];

@NgModule({
	imports: [
		RouterModule.forChild(SolutionsViewRoutes)
	],
	declarations: [
	],
	exports: [
		RouterModule,
	],
})
export class SolutionsViewRouterModule {
}
