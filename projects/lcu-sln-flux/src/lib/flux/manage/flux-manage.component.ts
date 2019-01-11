import { Component, Injector } from '@angular/core';
import { ISolutionControl, ForgeGenericSolution } from '@lcu/solutions';
import { FlowsConfig, FlowConfig } from '@lcu/apps';
import { FlowService, FlowsConfigContext } from '@lcu/flux';
import { PageUIService, ForgeOrganizationService } from '@lcu/daf-common';
import { MatDialog } from '@angular/material';
import { CreateFluxDialogComponent } from '../dialogs/create-flux/create-flux.dialog';
import { isResultSuccess } from '@lcu/core';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { isStatusSuccess } from '@lcu/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
    selector: 'forge-solution-flux-manage',
    templateUrl: './flux-manage.component.html',
    styleUrls: ['./flux-manage.component.scss']
})
export class ForgeFluxSolutionManage extends ForgeGenericSolution
    implements ISolutionControl {
      //  Fields

      //  Properties
      public FluxManagePath: string;

      public Loading: boolean;

      public OrgLoading: boolean;

      public OrgLookupError: string;

      public OrgInfoSet: boolean;

      public FlowsConfig: FlowsConfig;

      public FlowConfigs: {
          Active: {
              Data: FlowConfig[],
              Page: number,
              PageSize: number,
              TotalRecords: number
          },
          Inactive: {
              Data: FlowConfig[],
              Page: number,
              PageSize: number,
              TotalRecords: number
          }
      };

      public MainLoader: boolean;

      //  Constructors
      constructor(protected flowSvc: FlowService, protected flowConfig: FlowsConfigContext, protected pgUiSvc: PageUIService,
          protected orgSvc: ForgeOrganizationService, protected injector: Injector, public dialog: MatDialog, protected router: Router,
          protected location: Location) {
          super(injector);

          this.FluxManagePath = location.prepareExternalUrl(`/flux/manage`);

          this.Loading = true;
          this.MainLoader = true;
          this.OrgLoading = true;

          this.OrgLookupError = "";
          this.OrgInfoSet = false;

          this.FlowConfigs = {
              Active: {
                  Data: [],
                  Page: 1,
                  PageSize: 10,
                  TotalRecords: 0
              },
              Inactive: {
                  Data: [],
                  Page: 1,
                  PageSize: 10,
                  TotalRecords: 0
              }
          };
      }

      //	Life Cycle
      public ngOnInit() {
          super.ngOnInit();

          this.flowConfig.Loading.subscribe(loading => this.OrgLoading = loading);

          this.flowConfig.Context.subscribe(flowConfig => {
              this.FlowsConfig = flowConfig;

              if (this.FlowsConfig) {
                  this.ValidateLookup(3, 4);

                  if (this.FlowsConfig.OrganizationLookup && this.FlowsConfig.OrganizationName && !this.OrgLookupError)
                      this.OrgInfoSet = true;

                  this.OrgLookupError = "";
              }
          });

          this.LoadFlowConfigs();
      }


      //	API Methods
      public CreateNewFlow() {
          let dialogRef = this.dialog.open(CreateFluxDialogComponent, {
              data: { title: 'Create Flux' },
              width: '232px'
          });

          dialogRef.afterClosed().subscribe(result => {
              if (result && result.confirm && result.data.FlowID) {
                  this.router.navigateByUrl([this.FluxManagePath, result.data.FlowID].join('/'));
              }
          });
      }

      public DeleteFlow(flowId) {
          var flows = this.FlowConfigs.Inactive.Data.filter(function (item) {
              return item.ID == flowId;
          });

          if (flows.length > 0) {
              var flow = flows[0];

              if (flow) {
                  this.Loading = true;
                  this.MainLoader = true;

                  flow.Deleted = true;

                  this.flowSvc.UpdateFlow(flow).subscribe(
                      (results) => {
                          if (isResultSuccess(results)) {

                          } else {
                              console.log(results);
                          }
                      },
                      (err) => {
                          console.log(err);
                      },
                      () => {
                          this.MainLoader = false;
                          this.Loading = false;
                      });
              }
          }
      }

      public LoadFlowConfigs() {
          this.Loading = true;
          this.MainLoader = true;

          forkJoin(
              this.flowSvc.List('active', this.FlowConfigs.Active.Page, this.FlowConfigs.Active.PageSize),
              this.flowSvc.List('inactive', this.FlowConfigs.Inactive.Page, this.FlowConfigs.Inactive.PageSize)
          ).subscribe(
              (results) => {
                  if (isResultSuccess(results[0])) {
                      this.FlowConfigs.Active.Data = results[0].Model.Items;

                      this.FlowConfigs.Active.TotalRecords = results[0].Model.TotalRecords;
                  } else {
                      console.log(results[0]);
                  }

                  if (isResultSuccess(results[1])) {
                      this.FlowConfigs.Inactive.Data = results[1].Model.Items;

                      this.FlowConfigs.Inactive.TotalRecords = results[1].Model.TotalRecords;
                  } else {
                      console.log(results[1]);
                  }
              },
              (err) => {
                  console.log(err);
              },
              () => {
                  this.Loading = false;

                  this.MainLoader = false;
              });
      }

      public Save() {
          if (this.OrgLookupError)
              return;

          this.Loading = true;

          this.flowConfig.Save(this.FlowsConfig).subscribe(
              (status) => {
                  if (isStatusSuccess(status)) {
                      this.pgUiSvc.Notify.Signal("Flows Configuration saved successfully");
                  } else {
                      console.log(status);

                      this.pgUiSvc.Notify.Signal(status.Message);
                  }
              },
              (err) => {
                  console.log(err);

                  this.pgUiSvc.Notify.Signal("Unknown error. Please try again, or contact support if the problem continues");
              },
              () => {
                  this.Loading = false;
              });
      }

      public ValidateLookup(min, max) {
          this.OrgLookupError = "";

          this.FlowsConfig.OrganizationLookup = this.FlowsConfig.OrganizationLookup.toLowerCase();

          if (this.FlowsConfig.OrganizationLookup.indexOf(" ") > -1) {
              this.OrgLookupError = "Lookups cannot conatin spaces";
          }
          else if (this.FlowsConfig.OrganizationLookup.length < min || this.FlowsConfig.OrganizationLookup.length > max) {
              this.OrgLookupError = "Lookups must be " + min.toString() + " or " + max.toString() + " alphanumeric characters";
          }
      }

      //	Helpers
}
