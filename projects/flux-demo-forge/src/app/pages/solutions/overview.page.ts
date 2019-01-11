import { Component, Inject } from "@angular/core";
import { isResultSuccess } from "@lcu/core";
import { Router } from "@angular/router";
import {
  SolutionModuleSetup,
  SolutionsSetup,
  ISolutionsService,
  SolutionModuleConfig,
  SolutionElement,
  RenderingControl
} from "@lcu/elements";
import { SolutionsSetupContext, PageUIService } from "@lcu/daf-common";

@Component({
  selector: "solutions-overview-pages",
  templateUrl: "./overview.page.html",
  styleUrls: ["./overview.page.scss"]
})
export class OverviewPage {
  //	Properties
  public Loading: boolean;

  public SolutionOptions: SolutionModuleSetup[];

  //	Constructors
  constructor(protected router: Router, protected pgUiSvc: PageUIService, protected solutionsSvc: ISolutionsService) {}

  //	Life Cycle
  public ngOnInit() {
    this.solutionsSvc.LoadSolutionModules().subscribe(result => {
      if (isResultSuccess(result)) {
        this.SolutionOptions = result.Model;
      } else {
      }
    });
  }

  //	API Methods
}
