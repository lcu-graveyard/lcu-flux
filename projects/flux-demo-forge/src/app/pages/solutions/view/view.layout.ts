import { Component, OnInit, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Loading } from '@lcu/core';
import { RouterHelpersService } from '@lcu/routing';
import { SolutionElement } from '@lcu/elements';
import { SolutionsSetupContext } from '@lcu/daf-common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'solutions-view-layout',
	templateUrl: './view.layout.html',
	host: {},
	providers: [
		RouterHelpersService
	],
})
export class SolutionsViewLayoutComponent implements OnInit {
	//	Fields
	protected slnSub: Subscription;

	//	Properties
	public Loading: Loading;

	public Solution: SolutionElement;

	public State: string;

	//	Constructors
	constructor(protected solutionsSetup: SolutionsSetupContext, protected routerHelpers: RouterHelpersService) {
		this.Loading = new Loading();
	}

	//	Life Cycle
	public ngOnInit() {
		this.routerHelpers.RunOnRouteParam('base', (params) => {
			if (this.slnSub)
				this.slnSub.unsubscribe();

			this.slnSub = this.solutionsSetup.Context.subscribe(setup => {
				if (setup) {
					this.Solution = setup.Configs.find(c => c.Control.Base == params.base && c.Control.Type == params.type);

					this.State = params.state;

					if (this.State)
						this.State = this.State.charAt(0).toUpperCase() + this.State.substr(1);
				}
			});
		});

		this.solutionsSetup.Loading.subscribe(loading => {
			this.Loading.Set(loading);
		});
	}

	//	API Methods
}
