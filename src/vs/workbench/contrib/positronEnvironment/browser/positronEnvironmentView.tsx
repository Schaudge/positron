/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2022 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./positronEnvironmentView';
import * as React from 'react';
import * as DOM from 'vs/base/browser/dom';
// import { PixelRatio } from 'vs/base/browser/browser';
import { Event, Emitter } from 'vs/base/common/event';
// import { BareFontInfo } from 'vs/editor/common/config/fontInfo';
import { IOpenerService } from 'vs/platform/opener/common/opener';
import { IViewDescriptorService } from 'vs/workbench/common/views';
// import { applyFontInfo } from 'vs/editor/browser/config/domFontInfo';
import { IThemeService } from 'vs/platform/theme/common/themeService';
// import { IEditorOptions } from 'vs/editor/common/config/editorOptions';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
// import { FontMeasurements } from 'vs/editor/browser/config/fontMeasurements';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { ViewPane, IViewPaneOptions } from 'vs/workbench/browser/parts/views/viewPane';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { PositronEnvironment } from 'vs/workbench/contrib/positronEnvironment/browser/positronEnvironment';
import { ILanguageRuntimeService } from 'vs/workbench/services/languageRuntime/common/languageRuntimeService';
import { IReactComponentContainer, ISize, PositronReactRenderer } from 'vs/base/browser/positronReactRenderer';
import { IPositronEnvironmentService } from 'vs/workbench/services/positronEnvironment/common/interfaces/positronEnvironmentService';

/**
 * PositronEnvironmentViewPane class.
 */
export class PositronEnvironmentViewPane extends ViewPane implements IReactComponentContainer {
	//#region Private Properties

	// The onSizeChanged emitter.
	private _onSizeChangedEmitter = this._register(new Emitter<ISize>());

	// The onVisibilityChanged emitter.
	private _onVisibilityChangedEmitter = this._register(new Emitter<boolean>());

	// The onFocused emitter.
	private _onFocusedEmitter = this._register(new Emitter<void>());

	// The width. This valus is set in layoutBody and is used to implement the IReactComponentContainer interface.
	private _width = 0;

	// The height. This valus is set in layoutBody and is used to implement the IReactComponentContainer interface.
	private _height = 0;

	// The Positron environment container - contains the entire Positron environment UI.
	private _positronEnvironmentContainer!: HTMLElement;

	// The PositronReactRenderer for the PositronEnvironment component.
	private _positronReactRenderer?: PositronReactRenderer;

	//#endregion Private Properties

	//#region IReactComponentContainer

	/**
	 * Gets the width.
	 */
	get width() {
		return this._width;
	}

	/**
	 * Gets the height.
	 */
	get height() {
		return this._height;
	}

	/**
	 * The onSizeChanged event.
	 */
	readonly onSizeChanged: Event<ISize> = this._onSizeChangedEmitter.event;

	/**
	 * The onVisibilityChanged event.
	 */
	readonly onVisibilityChanged: Event<boolean> = this._onVisibilityChangedEmitter.event;

	/**
	 * The onFocused event.
	 */
	readonly onFocused: Event<void> = this._onFocusedEmitter.event;

	//#endregion IReactComponentContainer

	//#region Constructor & Dispose

	/**
	 * Constructor.
	 * @param options The IViewPaneOptions for the view pane.
	 * @param _commandService The ICommandService.
	 * @param configurationService The IConfigurationService.
	 * @param contextKeyService The IContextKeyService.
	 * @param contextMenuService The IContextMenuService.
	 * @param instantiationService The IInstantiationService.
	 * @param keybindingService The IKeybindingService.
	 * @param openerService The IOpenerService.
	 * @param positronEnvironmentService The IPositronEnvironmentService.
	 * @param telemetryService The ITelemetryService.
	 * @param themeService The IThemeService.
	 * @param viewDescriptorService The IViewDescriptorService.
	 */
	constructor(
		options: IViewPaneOptions,
		@ICommandService private readonly _commandService: ICommandService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IKeybindingService keybindingService: IKeybindingService,
		@ILanguageRuntimeService private readonly _languageRuntimeService: ILanguageRuntimeService,
		@IOpenerService openerService: IOpenerService,
		@IPositronEnvironmentService private readonly _positronEnvironmentService: IPositronEnvironmentService,
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IWorkbenchLayoutService private readonly _layoutService: IWorkbenchLayoutService
	) {
		// Call the base class's constructor.
		super(
			options,
			keybindingService,
			contextMenuService,
			configurationService,
			contextKeyService,
			viewDescriptorService,
			instantiationService,
			openerService,
			themeService,
			telemetryService);

		// Register event handlers.
		this._register(
			this.onDidChangeBodyVisibility(() =>
				this._onVisibilityChangedEmitter.fire(this.isBodyVisible())
			)
		);
	}

	/**
	 * Dispose method.
	 */
	public override dispose(): void {
		// Destroy the PositronReactRenderer for the PositronEnvironment component.
		if (this._positronReactRenderer) {
			this._positronReactRenderer.destroy();
			this._positronReactRenderer = undefined;
		}

		// Call the base class's dispose method.
		super.dispose();
	}

	//#endregion Constructor & Dispose

	//#region Overrides

	/**
	 * renderBody override method.
	 * @param container The container HTMLElement.
	 */
	protected override renderBody(container: HTMLElement): void {
		// Call the base class's method.
		super.renderBody(container);

		// // Get the code editor options and read the font info.
		// const editorOptions = this.configurationService.getValue<IEditorOptions>('editor');
		// const fontInfo = FontMeasurements.readFontInfo(
		// 	BareFontInfo.createFromRawSettings(editorOptions, PixelRatio.value)
		// );

		// Create and append the Positron environment container. Apply the font info to it.
		this._positronEnvironmentContainer = DOM.$('.positron-environment-container');
		container.appendChild(this._positronEnvironmentContainer);
		// applyFontInfo(this._positronEnvironmentContainer, fontInfo);

		// // Add the configuration change event handler so we can detect font-related changes in the
		// // editor configuration.
		// this._register(
		// 	this.configurationService.onDidChangeConfiguration(configurationChangeEvent => {
		// 		// When something in the editor changes, determine whether it's font-related and, if it
		// 		// is, apply the new font info to the container.
		// 		if (configurationChangeEvent.affectsConfiguration('editor')) {
		// 			if (configurationChangeEvent.affectedKeys.has('editor.fontFamily') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.fontWeight') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.fontSize') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.fontLigatures') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.fontVariations') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.lineHeight') ||
		// 				configurationChangeEvent.affectedKeys.has('editor.letterSpacing')
		// 			) {
		// 				// Get the code editor options and read the font info.
		// 				const fontInfo = FontMeasurements.readFontInfo(
		// 					BareFontInfo.createFromRawSettings(
		// 						this.configurationService.getValue<IEditorOptions>('editor'),
		// 						PixelRatio.value
		// 					)
		// 				);

		// 				// Apply the font info to the Positron environment container.
		// 				applyFontInfo(this._positronEnvironmentContainer, fontInfo);
		// 			}
		// 		}
		// 	})
		// );

		// Create the PositronReactRenderer for the PositronEnvironment component and render it.
		this._positronReactRenderer = new PositronReactRenderer(this._positronEnvironmentContainer);
		this._positronReactRenderer.render(
			<PositronEnvironment
				commandService={this._commandService}
				configurationService={this.configurationService}
				contextKeyService={this.contextKeyService}
				contextMenuService={this.contextMenuService}
				keybindingService={this.keybindingService}
				languageRuntimeService={this._languageRuntimeService}
				layoutService={this._layoutService}
				positronEnvironmentService={this._positronEnvironmentService}
				reactComponentContainer={this}
			/>
		);
	}

	/**
	 * focus override method.
	 */
	override focus(): void {
		// Call the base class's method.
		super.focus();

		// Fire the onFocused event.
		this._onFocusedEmitter.fire();
	}

	/**
	 * layoutBody override method.
	 * @param height The height of the body.
	 * @param width The width of the body.
	 */
	override layoutBody(height: number, width: number): void {
		// Call the base class's method.
		super.layoutBody(height, width);

		// Set the width and height.
		this._width = width;
		this._height = height;

		// Raise the onSizeChanged event.
		this._onSizeChangedEmitter.fire({
			width,
			height
		});
	}

	//#endregion Overrides
}
