import { Modal, TFile, App, Notice } from 'obsidian';


export class VoiceMemoResultModal extends Modal {
	file: TFile;

	constructor(app: App, file: TFile) {
		super(app);
		this.file = file;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: "Voice memo saved" });
		// contentEl.createEl("p", { text: this.file.path });
		contentEl.createEl("p").createEl("code", { text: this.file.path });

		const btnRow = contentEl.createDiv({ cls: "modal-button-row" });

		const closeBtn = btnRow.createEl("button", { text: "Close" });
		closeBtn.onclick = () => this.close();

		const copyBtn = btnRow.createEl("button", { text: "Copy" });
		copyBtn.onclick = async () => {
			const link = this.app.fileManager.generateMarkdownLink(
				this.file,
				""
			);
			await navigator.clipboard.writeText(link);
			new Notice("Link copied");
			this.close();
		};

		const viewBtn = btnRow.createEl("button", { text: "View" });
		viewBtn.onclick = async () => {
			await this.app.workspace.getLeaf(false).openFile(this.file);
			this.close();
		};
	}
}

