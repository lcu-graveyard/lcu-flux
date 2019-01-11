import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuilderPage } from './pages/builder/builder.page';
import { SolutionsRoutes, SolutionsRoutingComponents } from './pages/solutions/solutions.router';

const routes: Routes = [
  ...SolutionsRoutes,
	{
		path: '**',
		component: BuilderPage,
		runGuardsAndResolvers: 'always'
	},
];

export var RoutingComponents: any[] = [
  BuilderPage,
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' }),
	],
	declarations: [
	],
	exports: [
		RouterModule,
	],
})
export class AppRouterModule {
}
