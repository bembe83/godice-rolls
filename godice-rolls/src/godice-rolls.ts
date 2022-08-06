import goDiceRolls from "./goDiceRolls";
import goDiceRollsLegacy from "./goDiceRollsLegacy";
import RollPrompt from "./RollPrompt";
import SETTINGS from "../../common/Settings";
import RollSettings from "./RollSettings";

SETTINGS.init('godice-rolls');

Hooks.on('init', function () {

	SETTINGS.register(goDiceRolls.PREF_GM_STATE, {
		config: true,
		scope: 'world',
		name: 'GODICE_ROLLS.Settings.GM_Name',
		hint: 'GODICE_ROLLS.Settings.GM_Hint',
		default: 'disabled',
		choices: {
			disabled: 'GODICE_ROLLS.Setting_Options.Disabled',
			always: 'GODICE_ROLLS.Setting_Options.Always',
			toggle: 'GODICE_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(goDiceRolls.PREF_PC_STATE, {
		config: true,
		scope: 'world',
		name: 'GODICE_ROLLS.Settings.PC_Name',
		hint: 'GODICE_ROLLS.Settings.PC_Hint',
		default: 'disabled',
		choices: {
			disabled: 'GODICE_ROLLS.Setting_Options.Disabled',
			always: 'GODICE_ROLLS.Setting_Options.Always',
			toggle: 'GODICE_ROLLS.Setting_Options.Toggle'
		},
		onChange: () => { ui.controls.initialize(); }
	});

	SETTINGS.register(RollPrompt.PREF_FOCUS_INPUT, {
		config: true,
		scope: 'client',
		name: 'GODICE_ROLLS.Settings.FocusInput_Name',
		hint: 'GODICE_ROLLS.Settings.FocusInput_Hint',
		type: Boolean,
		default: true
	});

	SETTINGS.register(goDiceRolls.PREF_FLAGGED, {
		name: "GODICE_ROLLS.Settings.Flagged_Name",
		hint: "GODICE_ROLLS.Settings.Flagged_Hint",
		scope: 'world',
		config: true,
		type: Boolean,
		default: false
	});

	SETTINGS.register(goDiceRolls.PREF_TOGGLED, {
		config: false,
		scope: 'client',
		type: Boolean,
		default: false,
		onChange: (value: boolean) => {
			const button = $('ol#controls>li#df-manual-roll-toggle');
			if (value) button.addClass('active');
			else button.removeClass('active');
		}
	});
	Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
		if (!goDiceRolls.toggleable) return;
		controls.find(x => x.name === 'token').tools.push({
			icon: 'fas fa-dice-d20',
			name: 'manualRoll',
			title: 'GODICE_ROLLS.SceneControlTitle',
			visible: goDiceRolls.toggleable,
			toggle: true,
			active: goDiceRolls.toggled,
			onClick: (toggled: boolean) => goDiceRolls.setToggled(toggled)
		});
	});


	SETTINGS.register(goDiceRollsLegacy.PREF_USE_LEGACY, {
		name: 'Enable Legacy Synchronous Rolls',
		hint: 'Some systems and modules have not migrated their roll calls to the new Async Roll System in FoundryVTT. To handle the use of the deprecated legacy roll system, this will enabled the old prompts for roll input.',
		config: true,
		scope: 'world',
		type: Boolean,
		default: false,
		onChange: (value: boolean) => {
			if (value) goDiceRollsLegacy.patch();
			else goDiceRollsLegacy.unpatch();
		}
	});

	RollSettings.init();
});
Hooks.on('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
		ui.notifications.error(game.i18n.localize("GODICE_ROLLS.Error_libWrapper_Missing"));
		return;
	}
	Handlebars.registerHelper({ dfmr_mul: (v1, v2) => v1 * v2 });
	goDiceRolls.patch();
	if (SETTINGS.get(goDiceRollsLegacy.PREF_USE_LEGACY))
		goDiceRollsLegacy.patch();
});

Hooks.on('createChatMessage', async (chatMessage: ChatMessage) => {
	if (!chatMessage.user || chatMessage.user.id !== game.userId) return;
	// Ignore non-roll, non-flagged, non-manual messages
	if (!chatMessage.isRoll || !goDiceRolls.flagged || !goDiceRolls.shouldRollManually) return;
	let flavor = game.i18n.localize("GODICE_ROLLS.Flag");
	// If all of the manual rolls were cancelled, don't set the flag
	if (!chatMessage.roll.terms.some((value: any) => value instanceof DiceTerm && (<any>value.options).isManualRoll))
		return;
	if (chatMessage.data.flavor)
		flavor += " " + chatMessage.data.flavor;
	await chatMessage.update({ flavor: flavor });
});