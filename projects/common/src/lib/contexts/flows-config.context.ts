import { Injectable, Inject } from '@angular/core';
import { SingletonService, BaseConfigContext } from '@lcu/enterprises';
import { FlowsConfig } from '@lcu/apps';

@Injectable({
	providedIn: 'root'
})
export class FlowsConfigContext extends BaseConfigContext<FlowsConfig> {
	//	Fields

	//	Properties

	//	Constructors
	constructor(@Inject(SingletonService) configSvc: SingletonService) {
		super(configSvc);
	}

	//	API Methods

	//	Helpers
	protected loadConfigKey() {
		return `ForgeFlowsConfig`;
	}

	protected loadDefaultConfig(): FlowsConfig {
		return {
			OrganizationLookup: '',
			OrganizationName: '',
		};
	}
}
