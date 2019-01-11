import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FathymSharedModule } from "@lcu/hosting";
import { AppRouterModule, RoutingComponents } from "./app.router";
import { UIModule } from "./ui.module";
import { AppLayoutComponent } from "./app.layout";

export var modules: any[] = [FathymSharedModule, AppRouterModule];

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        UIModule.forRoot(),
        ...modules
    ],
    declarations: [...RoutingComponents, AppLayoutComponent],
    exports: [...modules],
    providers: [],
    entryComponents: []
})
export class CoreModule {
    public static LoadBootstrap(): any {
        return AppLayoutComponent;
    }
}
