import { Inject, Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import { DAFService } from "@lcu/api";
import { BaseModeledResponse } from "@lcu/core";
import { Pageable } from "@lcu/common";
import { Device } from "@lcu/apps";

@Injectable({
  providedIn: "root"
})
export class DeviceService extends DAFService {
  //	Fields
  protected rootUrl: string;

  //	Constructors
  constructor(protected injector: Injector) {
    super(injector);

    this.rootUrl = "/forge-api/devices";
  }

  //	API Methods
  public ListOrgDevices(
    page: number,
    pageSize: number
  ): Observable<BaseModeledResponse<Pageable<Device>>> {
    return this.get(`${this.rootUrl}/list/${page}/${pageSize}`);
  }

  public SaveOrgDevice(
    device: Device
  ): Observable<BaseModeledResponse<string>> {
    return this.post(device, this.rootUrl);
  }

  //	Helpers
}
