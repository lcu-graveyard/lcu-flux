import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SolutionsLayoutComponent } from './solutions.layout';
import { OverviewPage } from './overview.page';
import { SolutionsViewRoutes, SolutionsViewRoutingComponents } from './view/view.router';

export const SolutionsRoutes: Routes = [
	{
    path: "solutions",
    component: SolutionsLayoutComponent,
    children: [
      ...SolutionsViewRoutes,
      {
        path: "overview",
        component: OverviewPage,
        data: {}
      },
      {
        path: "",
        redirectTo: "overview",
        pathMatch: 'full'
      },
    ]
  }
];

export var SolutionsRoutingComponents: any[] = [
	...SolutionsViewRoutingComponents,
	SolutionsLayoutComponent,
	OverviewPage,
];

@NgModule({
	imports: [
		RouterModule.forChild(SolutionsRoutes)
	],
	declarations: [
	],
	exports: [
		RouterModule,
	],
})
export class SolutionsRouterModule {
}
