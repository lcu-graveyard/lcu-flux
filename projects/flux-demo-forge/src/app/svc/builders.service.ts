import { Injectable, Inject } from "@angular/core";
import { BaseBuildersService, ISolutionsService, DisplayModuleSetup } from "@lcu/elements";
import { SolutionsSetupContext } from "@lcu/daf-common";

@Injectable({
  providedIn: "root"
})
export class FluxDemoForgeBuildersService extends BaseBuildersService {
  //	Fields

  //	Constructors
  constructor(protected solutionsSvc: ISolutionsService, protected solutionsSetup: SolutionsSetupContext) {
    super(solutionsSvc);

    solutionsSetup.Context.subscribe(setup => {
      this.processSolutionSetup(setup);
    });
  }

  //	API Methods

  //	Helpers
  protected loadCoreDisplayModules(): DisplayModuleSetup[] {
    return [];
  }
}
