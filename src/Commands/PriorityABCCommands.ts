import { Task } from '../Task/Task';
import { Priority } from '../Task/Priority';
import { TaskLocation } from '../Task/TaskLocation';
import { TasksFile } from '../Scripting/TasksFile';
import { type EditorInsertion, createEditorCallback } from './CreateEditorCallback';

/**
 * 叶武滨时间管理「ABC 分类」快捷命令：
 *
 * - A 类 = High ⏫：计划内要事，必须亲自执行（「做 A」）
 * - B 类 = Medium 🔼：突发紧急状况，计划外（「推迟 B」）
 * - C 类 = Low 🔽：内外部干扰，不重要不紧急（「记录 C」）
 *
 * 切换语义：对已标记为目标优先级的任务再次执行同一命令时，取消标记（恢复 None）。
 */
export const togglePriorityLine = (line: string, path: string, target: Priority): EditorInsertion | undefined => {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: null,
    });
    if (task === null) {
        return undefined;
    }

    const newPriority = task.priority === target ? Priority.None : target;
    const updated = new Task({
        ...task,
        priority: newPriority,
    });
    return { text: updated.toFileLineString() };
};

export const togglePriorityALine = (line: string, path: string) => togglePriorityLine(line, path, Priority.High);

export const togglePriorityBLine = (line: string, path: string) => togglePriorityLine(line, path, Priority.Medium);

export const togglePriorityCLine = (line: string, path: string) => togglePriorityLine(line, path, Priority.Low);

export const togglePriorityA = createEditorCallback(togglePriorityALine);

export const togglePriorityB = createEditorCallback(togglePriorityBLine);

export const togglePriorityC = createEditorCallback(togglePriorityCLine);
