import { Input, Injectable, Component, NgModule, ElementRef, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';

import { jsPlumb, jsPlumbToolkit, Surface } from "jsplumbtoolkit";

@Injectable({
	providedIn: 'root'
})
export class jsPlumbService {
	toolkits = {};
	surfaces = {};
	miniviews = {};
	_workQueues = {};

	getToolkit(id: string, params: any) {
		if (!this.toolkits[id]) {
			this.toolkits[id] = jsPlumbToolkit.newInstance(params || {});
		}
		return this.toolkits[id];
	}

	addSurface(id: string, surface: Surface) {
		this.surfaces[id] = surface;
		surface._ngId = id;
		if (this._workQueues[id]) {
			for (let i = 0; i < this._workQueues[id].length; i++) {
				try {
					this._workQueues[id][i][0](surface, this._workQueues[id][i][1]);
				}
				catch (e) {
					if (typeof console != "undefined")
						console.log("Cannot create component " + e);
				}
			}
		}
		delete this._workQueues[id];
	}

	getSurface(id: string, callback: Function, _params: any) {
		const surface = this.surfaces[id];
		if (callback) {
			if (surface) {
				callback(surface);
			} else {
				this._workQueues[id] = this._workQueues[id] || [];
				this._workQueues[id].push([callback, _params]);
			}
		} else {
			return surface;
		}
	}

	addMiniview(surfaceId: string, params: any) {
		var self = this;
		this.getSurface(surfaceId, function (surface: any) {
			var miniview = surface.createMiniview({
				container: params.container
			});
			surface.getToolkit().bind("dataLoadEnd", function () {
				setTimeout(miniview.invalidate, 0);
			});

			surface.getToolkit().bind("nodeAdded", function (params: any) {
				setTimeout(function () {
					miniview.invalidate(params.node.id);
				}, 0);
			});

			self.miniviews[surfaceId] = miniview;
		}, null)

	}
}

@Component({
	selector: 'jsplumb-toolkit',
	template: `<div></div>`
})
export class jsPlumbToolkitComponent {

	@Input() jtkId: string;
	@Input() surfaceId: string;
	@Input() view: any;
	@Input() renderParams: any;
	@Input() toolkitParams: any;
	@Input() methods: any;
	@Input() nodeResolver: Function;

	toolkit: jsPlumbToolkit;
	surface: Surface;

	constructor(private el: ElementRef, private $jsplumb: jsPlumbService, private componentFactoryResolver: ComponentFactoryResolver, private viewContainerRef: ViewContainerRef) {
	}

	//
	// abstract out the difference in accessing nativeelement between angular 2 (first case) and angular 4 (second case)
	//
	getNativeElement(component: any) {
		return (component._nativeElement || component.location.nativeElement).childNodes[0];
	}

	ngAfterViewInit() {

		const id = this.jtkId;
		if (!id) {
			throw new Error("jtk-id attribute not specified on jsplumb-toolkit component");
		}

		this.toolkit = this.$jsplumb.getToolkit(id, this.toolkitParams);

		const view = this.view || {};
		const self = this;

		const renderParams = jsPlumb.extend(this.renderParams || {}, {
			templateRenderer: function (directiveId: string, data: any, toolkit: jsPlumbToolkit, objectType: string) {

				const comp = self.componentFactoryResolver.resolveComponentFactory(self.nodeResolver(directiveId));
				var createdComponent: any = self.viewContainerRef.createComponent(comp);
				createdComponent._component.obj = data || {};
				createdComponent._component.toolkit = toolkit;
				createdComponent._component.surface = self.surface;
				const nativeElement = self.getNativeElement(createdComponent);
				createdComponent._component._el = nativeElement;
				createdComponent._component._el._jsPlumbNgComponent = createdComponent._component;

				// angular 2 only.
				createdComponent._parentView && createdComponent._parentView.detectChanges(false);

				var methods = self.methods || {};
				for (var m in methods) {
					if (methods.hasOwnProperty(m)) {
						createdComponent._component[m] = methods[m];
					}
				}

				return nativeElement;
			},
			view: view,
			container: self.el.nativeElement.childNodes[0]
		});

		this.surface = this.toolkit.render(renderParams);
		this.$jsplumb.addSurface(this.surfaceId, this.surface);

		// nodeUpdated event bind
		this.toolkit.bind("nodeUpdated", (params: any) => {
			var info = this.surface.getObjectInfo(params.node);
			if (info.el && info.el._jsPlumbNgComponent) {
				info.el._jsPlumbNgComponent.obj = params.node.data;
			}
		});
	}
}

@Component({
	selector: 'jsplumb-miniview',
	template: `<div></div>`
})
export class jsPlumbMiniviewComponent {
	@Input() surfaceId: string;

	constructor(private el: ElementRef, private $jsplumb: jsPlumbService, private componentFactoryResolver: ComponentFactoryResolver, private viewContainerRef: ViewContainerRef) { }

	ngAfterViewInit() {
		if (!this.surfaceId) {
			throw new Error("surface-id attribute not specified on jsplumb-miniview component");
		}

		this.$jsplumb.addMiniview(this.surfaceId, {
			container: this.el.nativeElement.childNodes[0]
		});
	}
}


@Component({
	selector: "[jsplumb-palette]",
	template: "<ng-content></ng-content>"
})
export class jsPlumbPaletteComponent {
	constructor(private el: ElementRef, private $jsplumb: jsPlumbService) { }

	@Input() selector: string;
	@Input() surfaceId: string
	@Input() typeExtractor: Function
	@Input() locationSetter: Function
	@Input() generator: Function

	ngAfterViewInit() {
		var self = this;
		if (!this.surfaceId) throw new Error("jsplumb-palette: surfaceId attribute not set.");
		if (!this.selector) throw new Error("jsplumb-palette: selector attribute not set.");
		this.$jsplumb.getSurface(this.surfaceId, function (surface: any) {
			surface.registerDroppableNodes({
				source: self.el.nativeElement,
				selector: self.selector,
				dragOptions: this.dragOptions || {
					zIndex: 50000,
					cursor: "move",
					clone: true
				},
				typeExtractor: self.typeExtractor,
				dataGenerator: self.generator,
				locationSetter: self.locationSetter
			});
		}, null);
	}
}

@NgModule({
	providers: [jsPlumbService],
	declarations: [jsPlumbToolkitComponent, jsPlumbMiniviewComponent, jsPlumbPaletteComponent],
	exports: [jsPlumbToolkitComponent, jsPlumbMiniviewComponent, jsPlumbPaletteComponent]
})
export class jsPlumbToolkitModule { }

