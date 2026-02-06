import { VoiceMemoResultModal } from './dialog';
import { Plugin, Notice, TFile } from 'obsidian';
import { VoiceMemoSettings, VoiceMemoSettingTab, DEFAULT_SETTINGS } from './settings';


export default class VoiceMemoPlugin extends Plugin {
	settings: VoiceMemoSettings;
	recorder: MediaRecorder | null = null;
	chunks: BlobPart[] = [];
	startTime: number = 0;
	overlayEl: HTMLElement | null = null;
	timerInterval: number | null = null;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "start-voice-memo",
			name: "Start voice memo recording",
			callback: () => this.startRecording(),
		});

		this.addSettingTab(new VoiceMemoSettingTab(this.app, this));
	}

	onunload() {
		this.cleanupOverlay();
		if (this.timerInterval) window.clearInterval(this.timerInterval);
		this.timerInterval = null;
		this.overlayEl?.remove();
		this.overlayEl = null;
	}

	wakeLock: WakeLockSentinel | null = null;

	async requestWakeLock() {
		try {
			if (navigator.wakeLock) {
				this.wakeLock = await navigator.wakeLock.request("screen");
			}
		} catch (e) { console.error(e) }
	}

	async releaseWakeLock() {
		try {
			await this.wakeLock?.release();
			this.wakeLock = null;
		} catch (e) { console.error(e) }
	}

	initWaveform(stream: MediaStream, canvas: HTMLCanvasElement) {
		const audioCtx = new AudioContext();
		const analyser = audioCtx.createAnalyser();
		analyser.fftSize = 256;

		const source = audioCtx.createMediaStreamSource(stream);
		source.connect(analyser);

		const buffer = new Uint8Array(analyser.frequencyBinCount);
		const ctx = canvas.getContext("2d")!;

		const draw = () => {
			if (!this.recorder) return;
			requestAnimationFrame(draw);
			analyser.getByteTimeDomainData(buffer);

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.beginPath();
			buffer.forEach((v, i) => {
				const x = (i / buffer.length) * canvas.width;
				const y = (v / 255) * canvas.height;
				if (i === 0) ctx.moveTo(x, y)
				else ctx.lineTo(x, y);
			});
			ctx.strokeStyle = "red";
			ctx.stroke();
		};

		draw();
	}

	async startRecording() {
		// Close mobile keyboard if open
		(document.activeElement as HTMLElement | null)?.blur();

		if (this.recorder) {
			new Notice("Already recording");
			return;
		}

		let stream: MediaStream;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			new Notice("Microphone permission denied or unavailable");
			return;
		}

		this.recorder = new MediaRecorder(stream, {
			mimeType: "audio/webm"
		});
		this.chunks = [];
		this.startTime = Date.now();

		// Prevent device sleep while recording
		this.requestWakeLock().catch((e) => console.error(e));

		this.recorder.ondataavailable = (e) => {
			if (e.data.size > 0) this.chunks.push(e.data);
		};

		this.recorder.onstop = async () => {
			this.releaseWakeLock().catch((e) => console.error(e));
			const blob = new Blob(this.chunks, { type: this.recorder?.mimeType });
			const file = await this.saveRecording(blob);
			if (this.settings.showDialog) {
				this.showPostRecordDialog(file);
			}
			if (this.settings.autoCopy) {
				const link = this.app.fileManager.generateMarkdownLink(
					file,
					""
				);
				await navigator.clipboard.writeText(link);
				new Notice("Link copied");
			}
			if (this.settings.autoOpen) {
				this.app.workspace.getLeaf(false).openFile(file).catch((e) => console.error(e));
			}
			stream.getTracks().forEach((t) => t.stop());
		};

		this.recorder.start();
		this.showOverlay(stream);
	}

	async stopRecording() {
		if (!this.recorder) return;

		this.recorder.stop();
		this.recorder = null;
		this.cleanupOverlay();
	}

	showOverlay(stream: MediaStream) {
		this.overlayEl = document.createElement("div");
		this.overlayEl.addClass("voice-memo-overlay");

		const status = document.createElement("div");
		if (document.body.hasClass("is-mobile")) {
			status.setText("●");
		} else {
			status.setText("● Recording");
		}
		status.addClass("recording-indicator");

		const timer = document.createElement("div");
		timer.addClass("recording-timer");

		const canvas = document.createElement("canvas");
		canvas.width = 120;
		canvas.height = 30;

		const stopBtn = document.createElement("button");
		stopBtn.addClass("recording-stop");
		stopBtn.setText("Stop");
		stopBtn.onclick = () => this.stopRecording();

		this.overlayEl.append(status, timer, canvas, stopBtn);
		this.initWaveform(stream, canvas);
		document.body.appendChild(this.overlayEl);

		this.timerInterval = window.setInterval(() => {
			const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
			const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
			const ss = String(elapsed % 60).padStart(2, "0");
			timer.setText(`${mm}:${ss}`);
		}, 500);
	}

	cleanupOverlay() {
		if (this.timerInterval) window.clearInterval(this.timerInterval);
		this.timerInterval = null;
		this.overlayEl?.remove();
		this.overlayEl = null;
	}

	async saveRecording(blob: Blob): Promise<TFile> {
		const now = new Date();
		const yyyy = now.getFullYear();
		const mm = String(now.getMonth() + 1).padStart(2, "0");
		const monthName = now.toLocaleString("default", { month: "long" });
		const dd = String(now.getDate()).padStart(2, "0");
		const hh = String(now.getHours()).padStart(2, "0");
		const min = String(now.getMinutes()).padStart(2, "0");
		const ss = String(now.getSeconds()).padStart(2, "0");

		const baseDir = this.settings.directory ||
			`VoiceMemos/${yyyy}/${mm} - ${monthName}`;

		const path = `${baseDir}/${yyyy}-${mm}-${dd} ${hh}.${min}.${ss}.webm`;

		await this.app.vault.createFolder(baseDir).catch((e) => console.error(e));

		const arrayBuffer = await blob.arrayBuffer();
		return await this.app.vault.createBinary(path, arrayBuffer);
	}

	showPostRecordDialog(file: TFile) {
		new VoiceMemoResultModal(this.app, file).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as VoiceMemoSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

