import { PluginSettingTab, App, Setting } from 'obsidian';
import VoiceMemoPlugin from './plugin';
import { DateTime } from 'luxon';

export interface VoiceMemoSettings {
	// base directory for voice memos
	directory: string;
	// https://moment.github.io/luxon/#/formatting?id=escaping
	name: string;
	showDialog: boolean;
	autoOpen: boolean;
	autoCopy: boolean;
}

export const DEFAULT_SETTINGS: VoiceMemoSettings = {
	directory: "'Voice Memos'",
	name: "yyyy-MM-dd HH.mm.ss",
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

		// containerEl.createEl("h2", { text: "Voice Memo Settings" });
		new Setting(containerEl).setName("Voice Memos").setHeading();

		const documentation = (frag: DocumentFragment) => {
			const luxon = document.createElement("a");
			luxon.textContent = "Luxon";
			luxon.href = "https://moment.github.io/luxon/#/"

			const escaping = document.createElement("a");
			escaping.textContent = "Escaping";
			escaping.href = "https://moment.github.io/luxon/#/formatting?id=escaping"

			const syntax = document.createElement("a");
			syntax.textContent = "Syntax";
			syntax.href = "https://moment.github.io/luxon/#/formatting?id=table-of-tokens"

			frag.appendText("See ")
			frag.appendChild(luxon);
			frag.appendText(" for ")
			frag.appendChild(syntax);
			frag.appendText(" and ")
			frag.appendChild(escaping);
			frag.appendText(".")
			frag.createEl("br")
		}

		const directoryDescription = ((frag: DocumentFragment) => {
			const preview = DateTime.now().toFormat(this.plugin.settings.directory);

			frag.appendText("Relative to vault root.")
			frag.createEl("br")

			documentation(frag);

			frag.appendText(`Preview: `)
			frag.createEl("code").appendText(preview)

			return frag;
		})

		const nameDescription = ((frag: DocumentFragment) => {

			const preview = DateTime.now().toFormat(this.plugin.settings.name);

			frag.appendText("Do not include extension (.webm).");
			frag.createEl("br");

			documentation(frag);

			frag.appendText(`Preview: `);
			frag.createEl("code").appendText(preview);

			return frag;
		})

		const directorySetting = new Setting(containerEl)
			.setName("Voice Memo Directory")
			.setDesc(directoryDescription(document.createDocumentFragment()))
			.addText((text) => text
				.setPlaceholder(this.plugin.settings.directory)
				.setValue(this.plugin.settings.directory)
				.onChange(async (value) => {
					this.plugin.settings.directory = value.trim();
					await this.plugin.saveSettings();
					directorySetting.setDesc(directoryDescription(document.createDocumentFragment()))
				})
			);

		const nameSetting = new Setting(containerEl)
			.setName("Voice Memo Name")
			.setDesc(nameDescription(document.createDocumentFragment()))
			.addText((text) => text
				.setPlaceholder(this.plugin.settings.name)
				.setValue(this.plugin.settings.name)
				.onChange(async (value) => {
					this.plugin.settings.name = value.trim();
					await this.plugin.saveSettings();
					nameSetting.setDesc(nameDescription(document.createDocumentFragment()))
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

