import { Component, Injector } from '@angular/core';
import { ISolutionControl, ForgeGenericSolution } from '@lcu/solutions';

@Component({
	selector: 'forge-solution-flux-documentation',
	templateUrl: './flux-documentation.component.html',
	styleUrls: ['./flux-documentation.component.scss']
})
export class ForgeFluxSolutionDocumentation extends ForgeGenericSolution
	implements ISolutionControl {
	//  Fields

	//  Properties
	public DocsRoot: string;

	//  Constructors
	constructor(protected injector: Injector) {
		super(injector);
		
		this.DocsRoot = 'https://raw.githubusercontent.com/lowcodeunit/lcu-sln-flux/master/docs/';
	}

	//	Life Cycle

	//	API Methods

	//	Helpers
}
