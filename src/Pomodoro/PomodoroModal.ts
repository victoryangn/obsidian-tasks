import { App, Modal, Setting } from 'obsidian';

/** 专注段结束后的选择弹窗：立即再来一段，或稍后自行决定。 */
export class PomodoroCompleteModal extends Modal {
    constructor(app: App, private readonly description: string, private readonly onAnother: () => void) {
        super(app);
    }

    public onOpen() {
        this.contentEl.createEl('h3', { text: '🍅 番茄完成！' });
        this.contentEl.createEl('p', {
            text: `「${this.description}」已专注完成，好好休息一下 ☕️`,
        });

        new Setting(this.contentEl)
            .addButton((button) =>
                button.setButtonText('🍅 休息结束再来一段').onClick(() => {
                    this.close();
                    this.onAnother();
                }),
            )
            .addButton((button) => button.setButtonText('稍后再说').onClick(() => this.close()));
    }
}
