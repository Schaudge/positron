/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/


import { Code } from '../code';
import * as os from 'os';

interface FlatVariables {
	value: string;
	type: string;
}

const VARIABLE_ITEMS = '.variables-instance .list .variable-item';
const VARIABLE_NAMES = 'name-column';
const VARIABLE_DETAILS = 'details-column';
const VARIABLES_NAME_COLUMN = '.variable-item .name-column';
const VARIABLES_SECTION = '[aria-label="Variables Section"]';

export class PositronVariables {

	constructor(private code: Code) { }

	async getFlatVariables(): Promise<Map<string, FlatVariables>> {
		const variables = new Map<string, FlatVariables>();
		const variableItems = await this.code.waitForElements(VARIABLE_ITEMS, true);

		for (const item of variableItems) {
			const name = item.children.find(child => child.className === VARIABLE_NAMES)?.textContent;
			const details = item.children.find(child => child.className === VARIABLE_DETAILS);

			const value = details?.children[0].textContent;
			const type = details?.children[1].textContent;

			if (!name || !value || !type) {
				throw new Error('Could not parse variable item');
			}

			variables.set(name, { value, type });
		}
		return variables;
	}

	async doubleClickVariableRow(variableName: string) {

		const desiredRow = this.code.driver.getLocator(`${VARIABLES_NAME_COLUMN} .name-value:text("${variableName}")`);

		await desiredRow.waitFor({ state: 'attached' });

		await desiredRow.dblclick();

	}

	async openVariables() {

		const isMac = os.platform() === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';

		await this.code.driver.getKeyboard().press(`${modifier}+Alt+B`);

		await this.code.waitForElement(VARIABLES_SECTION);

	}
}