import { Notice } from 'obsidian';
import { Task } from '../Task/Task';
import { TaskLocation } from '../Task/TaskLocation';
import { TasksFile } from '../Scripting/TasksFile';
import { type EditorInsertion, createEditorCallback } from './CreateEditorCallback';

/**
 * 叶武滨「记录-排程-执行」闭环：把已排程的任务退回收件箱待重新排程。
 *
 * 清除 📅 ⏳ 🛫 三个 happens 日期字段；保留优先级、状态、重复规则与完成日期。
 * 已知局限：由文件名推断的 scheduled date（useFilenameAsScheduledDate 设置）不在
 * markdown 行内，无法由此命令清除。
 */
export const moveToInboxLine = (line: string, path: string): EditorInsertion | undefined => {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: null,
    });
    if (task === null) {
        return undefined;
    }

    if (!task.dueDate && !task.scheduledDate && !task.startDate) {
        new Notice('该任务没有日期，已在待排程状态');
        return undefined;
    }

    const updated = new Task({
        ...task,
        dueDate: null,
        scheduledDate: null,
        startDate: null,
    });
    return { text: updated.toFileLineString() };
};

export const moveToInbox = createEditorCallback(moveToInboxLine);
