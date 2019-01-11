import { Component, Inject, Host } from '@angular/core';
import { SolutionsViewLayoutComponent } from './view.layout';
import { SolutionElement } from '@lcu/elements';

@Component({
	selector: 'solutions-view-pages',
	templateUrl: './view.page.html',
	styleUrls: ['./view.page.scss']
})
export class ViewPage {
	//	Fields

	//	Properties
	public get Loading(): boolean {
		return this.layout.Loading.Value;
	}

	public get Solution(): SolutionElement {
		return this.layout.Solution;
	}

	public get State(): string {
		return this.layout.State;
	}

	//	Constructors
	constructor(@Host() protected layout: SolutionsViewLayoutComponent) {
	}

	//	Life Cycle
	public ngOnInit() {
	}

	//	API Methods
}
