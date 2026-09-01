import { Notice } from 'obsidian';
import { createPostponedTask, getDateFieldToPostpone } from '../DateTime/Postponer';
import { DateFallback } from '../DateTime/DateFallback';
import { Task } from '../Task/Task';
import { TaskLocation } from '../Task/TaskLocation';
import { TasksFile } from '../Scripting/TasksFile';
import { type EditorInsertion, createEditorCallback } from './CreateEditorCallback';

/**
 * 叶武滨「做 A 推迟 B 记录 C」中的推迟动作：
 * 将任务最近的 happens 日期顺延一天（优先级 📅 due > ⏳ scheduled > 🛫 start）。
 *
 * 通过 DateFallback 传入文件名推断的 scheduled date（useFilenameAsScheduledDate 开启时，
 * 每日笔记 YYYY-MM-DD 文件名中的任务也能顺延）；顺延后的日期会固化写入任务行——
 * 推断日期默认不参与序列化，必须显式关闭 scheduledDateIsInferred 才会写出 ⏳。
 */
export const postponeOneDayLine = (line: string, path: string): EditorInsertion | undefined => {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: DateFallback.fromPath(path),
    });
    if (task === null) {
        return undefined;
    }

    const dateFieldToPostpone = getDateFieldToPostpone(task);
    if (dateFieldToPostpone === null) {
        new Notice('该任务没有可顺延的日期（无 📅 ⏳ 🛫），请先添加日期');
        return undefined;
    }

    const { postponedTask } = createPostponedTask(task, dateFieldToPostpone, 'day', 1);
    const updated = new Task({
        ...postponedTask,
        scheduledDateIsInferred: false,
    });
    return { text: updated.toFileLineString() };
};

export const postponeOneDay = createEditorCallback(postponeOneDayLine);
