import { Menu, Notice, Plugin } from 'obsidian';
import { getSettings } from '../Config/Settings';
import { PomodoroCompleteModal } from './PomodoroModal';
import { PomodoroTimer } from './PomodoroTimer';
import { notify } from './notify';

/**
 * 番茄钟服务：状态栏倒计时 + 阶段完成通知 + 生命周期管理。
 *
 * 状态栏形态（UI 主入口）：工作中 🍅 24:31、休息中 ☕️ 4:59、暂停 ⏸ 13:20；
 * 点击弹出菜单（暂停/继续、跳到休息、放弃本段）。
 * 不持久化：重启 Obsidian 后计时器重置。
 */
export class PomodoroService {
    private readonly timer: PomodoroTimer;
    private readonly statusBarEl: HTMLElement;

    constructor(private readonly plugin: Plugin) {
        const { pomodoro } = getSettings();
        this.timer = new PomodoroTimer({
            workMs: pomodoro.workMinutes * 60_000,
            breakMs: pomodoro.breakMinutes * 60_000,
            autoStartBreak: pomodoro.autoStartBreak,
            now: () => Date.now(),
            onPhaseComplete: (phase) => this.handlePhaseComplete(phase),
        });

        this.statusBarEl = plugin.addStatusBarItem();
        this.statusBarEl.classList.add('tasks-pomodoro-statusbar');
        this.statusBarEl.addEventListener('click', (evt) => this.showMenu(evt));
        this.renderStatus();

        // registerInterval：插件卸载时由 Obsidian 自动清理
        plugin.registerInterval(window.setInterval(() => this.tick(), 1000));
    }

    /** 开始一段专注。已有番茄在运行时提示并拒绝。 */
    public start(description: string): boolean {
        if (this.timer.isRunning) {
            new Notice('🍅 番茄钟已在运行中（点击状态栏可暂停/放弃）');
            return false;
        }
        this.timer.start(description);
        this.renderStatus();
        return true;
    }

    /** 插件卸载时清理（interval 由 registerInterval 自动清理，这里只重置状态） */
    public unload() {
        this.timer.stop();
    }

    private tick() {
        this.timer.tick();
        this.renderStatus();
    }

    private handlePhaseComplete(phase: 'work' | 'break') {
        const description = this.timer.currentDescription;
        if (phase === 'work') {
            notify('🍅 番茄完成！', `「${description}」已专注完成，休息 5 分钟 ☕️`);
            if (!this.timer.isRunning) {
                // autoStartBreak=false 时已回 idle，仍弹窗提示可再来一段
                new PomodoroCompleteModal(this.plugin.app, description, () => this.start(description)).open();
            }
        } else {
            notify('☕️ 休息结束', '准备开始下一个番茄吗？');
            new PomodoroCompleteModal(this.plugin.app, description, () => this.start(description)).open();
        }
        this.renderStatus();
    }

    private showMenu(evt: MouseEvent) {
        const menu = new Menu();
        if (this.timer.isRunning) {
            const snapshot = this.timer.getSnapshot();
            if (snapshot.paused) {
                menu.addItem((item) =>
                    item.setTitle('▶️ 继续计时').onClick(() => {
                        this.timer.resume();
                        this.renderStatus();
                    }),
                );
            } else {
                menu.addItem((item) =>
                    item.setTitle('⏸ 暂停').onClick(() => {
                        this.timer.pause();
                        this.renderStatus();
                    }),
                );
            }
            menu.addItem((item) =>
                item.setTitle('☕️ 跳到休息').onClick(() => {
                    this.timer.skipToBreak();
                    this.renderStatus();
                }),
            );
            menu.addItem((item) =>
                item.setTitle('✖️ 放弃本段番茄').onClick(() => {
                    this.timer.stop();
                    this.renderStatus();
                }),
            );
        } else {
            menu.addItem((item) => item.setTitle('当前没有进行中的番茄').setDisabled(true));
            menu.addSeparator();
            menu.addItem((item) =>
                item.setTitle('ℹ️ 光标放在任务行上，用命令「启动 25+5 番茄钟」开始').setDisabled(true),
            );
        }
        menu.showAtMouseEvent(evt);
    }

    private renderStatus() {
        const snapshot = this.timer.getSnapshot();
        if (snapshot.phase === 'idle') {
            this.statusBarEl.setText('🍅');
            this.statusBarEl.setAttribute('aria-label', '番茄钟：空闲');
            return;
        }
        const minutes = Math.floor((snapshot.remainingMs ?? 0) / 60_000);
        const seconds = Math.floor(((snapshot.remainingMs ?? 0) % 60_000) / 1000);
        const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (snapshot.paused) {
            this.statusBarEl.setText(`⏸ ${time}`);
            this.statusBarEl.setAttribute('aria-label', `番茄钟暂停：${snapshot.description}`);
        } else if (snapshot.phase === 'work') {
            this.statusBarEl.setText(`🍅 ${time}`);
            this.statusBarEl.setAttribute('aria-label', `专注中：${snapshot.description}`);
        } else {
            this.statusBarEl.setText(`☕️ ${time}`);
            this.statusBarEl.setAttribute('aria-label', '休息中');
        }
    }
}
