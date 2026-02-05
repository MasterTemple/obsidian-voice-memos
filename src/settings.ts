import { PluginSettingTab, App, Setting } from 'obsidian';
import VoiceMemoPlugin from './plugin';

export interface VoiceMemoSettings {
	directory: string; // base directory for voice memos
	showDialog: boolean;
	autoOpen: boolean;
	autoCopy: boolean;
}

export const DEFAULT_SETTINGS: VoiceMemoSettings = {
	directory: "",
	showDialog: false,
	autoOpen: true,
	autoCopy: false,
};


export class VoiceMemoSettingTab extends PluginSettingTab {
	plugin: VoiceMemoPlugin;

	constructor(app: App, plugin: VoiceMemoPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Voice Memo Settings" });

		new Setting(containerEl)
			.setName("Voice memo directory")
			.setDesc(
				"Optional. Relative to vault root. Leave empty for default VoiceMemos/YYYY/MM - Month"
			)
			.addText((text) => text
				.setPlaceholder("VoiceMemos")
				.setValue(this.plugin.settings.directory)
				.onChange(async (value) => {
					this.plugin.settings.directory = value.trim();
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Auto-Open")
			.setDesc(
				"Automatically open the resulting file"
			)
			.addToggle((t) => t.setValue(this.plugin.settings.autoOpen).onChange(async (value) => {
				this.plugin.settings.autoOpen = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName("Auto-Copy")
			.setDesc(
				"Automatically copy the resulting file path"
			)
			.addToggle((t) => t.setValue(this.plugin.settings.autoCopy).onChange(async (value) => {
				this.plugin.settings.autoCopy = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName("Show Dialog")
			.setDesc(
				"Show options dialog after recording complete"
			)
			.addToggle((t) => t.setValue(this.plugin.settings.showDialog).onChange(async (value) => {
				this.plugin.settings.showDialog = value;
				await this.plugin.saveSettings();
			}))
	}
}

