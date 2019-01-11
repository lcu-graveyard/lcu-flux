import { NgModule } from '@angular/core';

import { CoreModule } from './core.module';

@NgModule({
	declarations: [
	],
	imports: [
		CoreModule,
	],
	providers: [],
	bootstrap: [CoreModule.LoadBootstrap()],
})
export class AppModule { }
