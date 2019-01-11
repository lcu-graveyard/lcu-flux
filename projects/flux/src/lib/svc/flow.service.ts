import { Injectable, Inject, Injector } from "@angular/core";

import { Observable } from "rxjs";
import { DAFService } from "@lcu/api";
import { FlowConfig, Device, FlowModuleOption, FlowModule } from "@lcu/apps";
import { BaseModeledResponse, BaseResponse } from "@lcu/core";
import { Pageable } from "@lcu/common";

@Injectable({
  providedIn: "root"
})
export class FlowService extends DAFService {
  //	Properties
  protected rootUrl: string;

  //	Constructors
  constructor(protected injector: Injector) {
    super(injector);

    this.rootUrl = "/forge-api/flow";
  }

  //	API Methods
  public Create(config: FlowConfig): Observable<BaseModeledResponse<string>> {
    return this.post(config, this.rootUrl);
  }

  public Get(id: string): Observable<BaseModeledResponse<FlowConfig>> {
    return this.get(`${this.rootUrl}/${id}`);
  }

  public GetDevice(
    flowId: string,
    environment: string,
    moduleId: string,
    deviceId: string
  ): Observable<BaseModeledResponse<Pageable<Device>>> {
    return this.get(
      `${
        this.rootUrl
      }/${flowId}/environment/${environment}/module/${moduleId}/deviceId/${deviceId}`
    );
  }

  public GetFlowStatus(
    flowId: string,
    environment: string
  ): Observable<BaseModeledResponse<any>> {
    return this.get(
      `${this.rootUrl}/provision/${flowId}/${environment}/status`
    );
  }

  public GetModuleStatus(
    flowId: string,
    environment: string,
    application: string,
    service: string,
    settings: any
  ): Observable<BaseResponse> {
    return this.post(
      {
        Application: application,
        Service: service,
        Settings: settings,
        FlowID: flowId,
        Environment: environment
      },
      `${this.rootUrl}/provision/${flowId}/${environment}/module/status`
    );
  }

  public List(
    state: string,
    page: number,
    pageSize: number
  ): Observable<BaseModeledResponse<Pageable<FlowConfig>>> {
    return this.get(`${this.rootUrl}/${state}/list/${page}/${pageSize}`);
  }

  public ListDevices(
    flowId: string,
    environment: string,
    moduleId: string,
    page: number,
    pageSize: number
  ): Observable<BaseModeledResponse<Pageable<Device>>> {
    return this.get(
      `${
        this.rootUrl
      }/${flowId}/environment/${environment}/module/${moduleId}/list/${page}/${pageSize}`
    );
  }

  public LoadModuleOptions(
    flowId?: string
  ): Observable<BaseModeledResponse<FlowModuleOption[]>> {
    var queryStr = flowId ? `flowId=${flowId}` : "";

    return this.get(`${this.rootUrl}/manage/modules?${queryStr}`);
  }

  public Provision(
    flowId: string,
    environment: string
  ): Observable<BaseResponse> {
    return this.post(
      {
        Environment: environment,
        FlowID: flowId
      },
      `${this.rootUrl}/provision`
    );
  }

  public Unprovision(
    flowId: string,
    environment: string
  ): Observable<BaseResponse> {
    return this.post(
      {
        Environment: environment,
        FlowID: flowId
      },
      `${this.rootUrl}/unprovision`
    );
  }

  public RegisterDevice(
    flowId: string,
    environment: string,
    moduleId: string,
    device: Device
  ): Observable<BaseModeledResponse<Device>> {
    return this.post(
      device,
      `${this.rootUrl}/${flowId}/environment/${environment}/module/${moduleId}`
    );
  }

  public UnregisterDevices(
    flowId: string,
    environment: string,
    moduleId: string,
    deviceIds: string[]
  ): Observable<BaseResponse> {
    return this.post(
      deviceIds,
      `${
        this.rootUrl
      }/${flowId}/environment/${environment}/module/${moduleId}/unregister`
    );
  }

  public SaveModule(
    flowId: string,
    module: FlowModule
  ): Observable<BaseResponse> {
    return this.post(module, `${this.rootUrl}/${flowId}/modules`);
  }

  public UpdateDevices(
    flowId: string,
    environment: string,
    moduleId: string,
    devices: any[]
  ): Observable<BaseModeledResponse<Pageable<Device>>> {
    return this.put(
      devices,
      `${this.rootUrl}/${flowId}/environment/${environment}/module/${moduleId}`
    );
  }

  public UpdateFlow(flowConfig: FlowConfig): Observable<BaseResponse> {
    return this.put(flowConfig, this.rootUrl);
  }

  //	Helpers
}
