import { Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import { DAFService } from "@lcu/api";
import { BaseModeledResponse } from "@lcu/core";
import {
  JSONSchemaMap,
  SchemaFunctionDefinition,
  ForgeJSONSchema
} from "@lcu/apps";
import { JSONSchema } from "@lcu/common";

@Injectable({
  providedIn: "root"
})
export class SchemaFlowService extends DAFService {
  //	Fields
  protected rootUrl: string;

  //	Constructors
  constructor(protected injector: Injector) {
    super(injector);

    this.rootUrl = "/forge-api/schema";
  }

  //	API Methods
  public GetAllJSONSchemas(
    flowId: string
  ): Observable<BaseModeledResponse<JSONSchemaMap[]>> {
    return this.get(`${this.rootUrl}/json/all/` + flowId);
  }

  public GetAllSchemaFunctionDefinitions(): Observable<
    BaseModeledResponse<SchemaFunctionDefinition[]>
  > {
    return this.get(`${this.rootUrl}/function/definition`);
  }

  public SaveJSONSchema(
    schema: JSONSchema
  ): Observable<BaseModeledResponse<JSONSchemaMap>> {
    var s = this.removeForgeElementsFromJSONSchema(
      JSON.parse(JSON.stringify(schema))
    );

    var obj = {
      Active: true,
      ID: schema.id,
      Name: schema.title,
      Description: schema.title,
      Lookup: schema.title.split(" ").join("_"),
      Schema: s
    };

    return this.post(obj, `${this.rootUrl}/json`);
  }

  //	Helpers
  protected removeForgeElementsFromJSONSchema(schema: ForgeJSONSchema) {
    delete schema.sourceRef;

    delete schema.sourceTitle;

    return schema;
  }
}
