import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatDialogModule,
  MatFormFieldModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatListModule,
  MatToolbarModule,
  MatIconModule,
  MatSelectModule,
  MatCheckboxModule,
  MatSlideToggleModule,
  MatButtonModule,
  MatPaginatorModule,
  MatTableModule,
  MatCardModule,
  MatTooltipModule
} from "@angular/material";
import { FlexLayoutModule } from "@angular/flex-layout";
import { FathymSharedModule } from "@lcu/hosting";
import { BaseSolutionModule } from "@lcu/solutions";
import { NgxMarkdownDocsModule } from "@lowcodeunit/ngx-markdown-docs";
import { ForgeFluxSolutionManage } from "./manage/flux-manage.component";
import { ForgeFluxSolutionDocumentation } from "./documentation/flux-documentation.component";
import { ForgeFluxSolutionHeading } from "./heading/flux-heading.component";
import { ForgeFluxSolutionMarketplace } from "./marketplace/flux-marketplace.component";
import { ForgeFluxSolutionOverview } from "./overview/flux-overview.component";
import { CreateFluxDialogComponent } from './dialogs/create-flux/create-flux.dialog';
// import { CreateFluxDialogComponent } from './flux/dialogs/create-flux/create-flux.dialog';

export class ForgeFluxSolutionDisplayModule extends BaseSolutionModule {
  public Documentation() {
    return ForgeFluxSolutionDocumentation;
  }

  public Heading() {
    return ForgeFluxSolutionHeading;
  }

  public Manage() {
    return ForgeFluxSolutionManage;
  }

  public Marketplace() {
    return ForgeFluxSolutionMarketplace;
  }

  public Overview() {
    return ForgeFluxSolutionOverview;
  }
}

var comps = [
  ForgeFluxSolutionDocumentation,
  ForgeFluxSolutionHeading,
  ForgeFluxSolutionManage,
  ForgeFluxSolutionMarketplace,
  ForgeFluxSolutionOverview,
  CreateFluxDialogComponent,
];

@NgModule({
  imports: [
    FathymSharedModule,
    NgxMarkdownDocsModule,
    FlexLayoutModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule
  ],
  declarations: [...comps],
  exports: [...comps],
  entryComponents: [...comps]
})
export class ForgeFluxSolutionModule {}
