import type { App, Editor, MarkdownFileInfo, MarkdownView, TFile, View } from 'obsidian';
import type TasksPlugin from '../main';
import { StatusRegistry } from '../Statuses/StatusRegistry';
import { createOrEdit } from './CreateOrEdit';

import { toggleDone } from './ToggleDone';
import { ensureQueryFileDefaultsInFrontmatter } from './AddQueryFileDefaultsProperties';
import { createSetStatusCommands } from './ChangeStatusCommands';
import { QuickSearchTasksModal } from './QuickSearchTasks';
import { togglePriorityA, togglePriorityB, togglePriorityC } from './PriorityABCCommands';
import { postponeOneDay } from './PostponeOneDay';
import { moveToInbox } from './MoveTaskToInbox';
import { createStartPomodoroCallback } from './StartPomodoro';

export const ToggleTaskDoneCommandName = 'Toggle task done';

export class Commands {
    private readonly plugin: TasksPlugin;

    private get app(): App {
        return this.plugin.app;
    }

    constructor({ plugin }: { plugin: TasksPlugin }) {
        this.plugin = plugin;

        plugin.addCommand({
            id: 'edit-task',
            name: 'Create or edit task',
            icon: 'pencil',
            editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
                // TODO Need to explore what happens if a tasks code block is rendered before the Cache has been created.
                return createOrEdit(
                    checking,
                    editor,
                    view as View,
                    this.app,
                    this.plugin.getTasks(),
                    async () => await this.plugin.saveSettings(),
                );
            },
        });

        plugin.addCommand({
            id: 'toggle-done',
            name: ToggleTaskDoneCommandName,
            icon: 'check-in-circle',
            editorCheckCallback: toggleDone,
        });

        plugin.addCommand({
            id: 'quick-search',
            name: 'Quick search',
            icon: 'search',
            callback: () => new QuickSearchTasksModal(this.app, () => this.plugin.getTasks()).open(),
        });

        plugin.addCommand({
            id: 'add-query-file-defaults-properties',
            name: 'Add all Query File Defaults properties',
            icon: 'settings',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    return false;
                }
                if (activeFile.extension !== 'md') {
                    return false;
                }

                if (!checking) {
                    this.ensureQueryFileDefaultsFrontmatter(activeFile).catch(console.error);
                }
                return true;
            },
        });

        // Register set-status commands for each registered status
        const setStatusCommands = createSetStatusCommands(StatusRegistry.getInstance());
        for (const command of setStatusCommands) {
            plugin.addCommand(command);
        }

        this.addYeWubinCommands(plugin);
    }

    /**
     * 叶武滨时间管理定制命令：「做 A 推迟 B 记录 C」工作流。
     * 集中注册，便于日后 rebase 官方更新。
     */
    private addYeWubinCommands(plugin: TasksPlugin) {
        plugin.addCommand({
            id: 'toggle-priority-a',
            name: '标记/取消 A 类要事（🔴）',
            icon: 'flame',
            editorCheckCallback: togglePriorityA,
        });

        plugin.addCommand({
            id: 'toggle-priority-b',
            name: '标记/取消 B 类（🟡）',
            icon: 'cloud',
            editorCheckCallback: togglePriorityB,
        });

        plugin.addCommand({
            id: 'toggle-priority-c',
            name: '标记/取消 C 类（🟢）',
            icon: 'tag',
            editorCheckCallback: togglePriorityC,
        });

        plugin.addCommand({
            id: 'postpone-one-day',
            name: '推迟一天（顺延最近日期）',
            icon: 'clock',
            editorCheckCallback: postponeOneDay,
        });

        plugin.addCommand({
            id: 'move-task-to-inbox',
            name: '转收件箱（清除日期，待排程）',
            icon: 'inbox',
            editorCheckCallback: moveToInbox,
        });

        plugin.addCommand({
            id: 'start-pomodoro',
            name: '启动 25+5 番茄钟（当前行任务）',
            icon: 'timer',
            editorCheckCallback: createStartPomodoroCallback(
                (description) => this.plugin.pomodoroService?.start(description) ?? false,
            ),
        });
    }

    async ensureQueryFileDefaultsFrontmatter(file: TFile): Promise<void> {
        const { app } = this;
        await ensureQueryFileDefaultsInFrontmatter(app, file);
    }
}
