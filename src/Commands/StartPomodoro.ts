import { type Editor, type MarkdownFileInfo, MarkdownView, Notice } from 'obsidian';
import { getSettings } from '../Config/Settings';
import { TasksFile } from '../Scripting/TasksFile';
import { StatusRegistry } from '../Statuses/StatusRegistry';
import { StatusType } from '../Statuses/StatusConfiguration';
import { Task } from '../Task/Task';
import { TaskLocation } from '../Task/TaskLocation';
import { setStatusOnLine } from './ChangeStatusCommands';
import type { EditorInsertion } from './CreateEditorCallback';

export interface PomodoroStartResult {
    /** markInProgress 开启时，需写回编辑器的置为 In Progress（/）后的任务行 */
    statusInsertion?: EditorInsertion;
    /** 计时器展示用的任务描述 */
    description: string;
}

/** 查找 In Progress 状态：优先按类型，回退到符号 '/' */
export const findInProgressStatus = () => {
    const registry = StatusRegistry.getInstance();
    const byType = registry.registeredStatuses.find((status) => status.type === StatusType.IN_PROGRESS);
    return byType ?? registry.bySymbol('/');
};

/**
 * 启动番茄钟的核心逻辑（纯函数，便于测试）：
 * 解析任务行；markInProgress 时置为 In Progress（/），返回写回内容与计时器标题。
 */
export const startPomodoroOnLine = (
    line: string,
    path: string,
    markInProgress: boolean,
): PomodoroStartResult | undefined => {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: null,
    });
    if (task === null) {
        return undefined;
    }

    let statusInsertion: EditorInsertion | undefined;
    if (markInProgress) {
        const inProgress = findInProgressStatus();
        if (inProgress) {
            statusInsertion = setStatusOnLine(line, path, inProgress);
        }
    }

    return { statusInsertion, description: task.description };
};

/**
 * 创建「启动 25+5 番茄钟」命令的 editorCheckCallback。
 *
 * @param startTimer 启动计时的回调（由 PomodoroService.start 提供）
 */
export const createStartPomodoroCallback = (startTimer: (description: string) => boolean) => {
    return (checking: boolean, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
        if (checking) {
            return view instanceof MarkdownView;
        }

        if (!(view instanceof MarkdownView)) {
            return;
        }
        const path = view.file?.path;
        if (path === undefined) {
            return;
        }

        const lineNumber = editor.getCursor().line;
        const line = editor.getLine(lineNumber);
        const { markInProgress } = getSettings().pomodoro;

        const result = startPomodoroOnLine(line, path, markInProgress);
        if (result === undefined) {
            new Notice('当前行不是任务，无法启动番茄钟');
            return;
        }

        if (result.statusInsertion !== undefined) {
            editor.setLine(lineNumber, result.statusInsertion.text);
        }
        startTimer(result.description);
    };
};
