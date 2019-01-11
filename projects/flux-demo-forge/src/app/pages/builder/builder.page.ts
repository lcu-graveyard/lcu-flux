import { Component, OnInit } from '@angular/core';
import { RouterHelpersService } from '@lcu/routing';

@Component({
	selector: 'pages-builder-page',
	templateUrl: './builder.page.html',
  styleUrls: ['./builder.page.scss'],
  providers: [RouterHelpersService]
})
export class BuilderPage implements OnInit {
	//	Properties
	public get BaseHref(): string {
		return document.getElementsByTagName('base')[0].href;
	}

	public get CurrentPath(): string {
        var path = window.location.href.replace(this.BaseHref, '');

        path = path.replace(location.search, '');

		return `/${path}`;
	}

	public Lookup: string;

	//	Constructors
	constructor(protected routerHelpers: RouterHelpersService) {
	}

	//	Life Cycle
	public ngOnInit() {
		this.routerHelpers.RunOnNavigationEnd(() => {
			this.Lookup = this.CurrentPath;
		});

		this.Lookup = this.CurrentPath;
	}

	//	API Methods

	//	Helpers
}
