import { createPostponedTask, getDateFieldToPostpone } from '../../DateTime/Postponer';
import { StatusRegistry } from '../../Statuses/StatusRegistry';
import { Priority } from '../../Task/Priority';
import { Task } from '../../Task/Task';
import { MenuDividerInstruction } from '../EditInstructions/MenuDividerInstruction';
import type { TaskEditingInstruction } from '../EditInstructions/TaskEditingInstruction';
import { StatusMenu } from './StatusMenu';
import { type TaskSaver, defaultTaskSaver } from './TaskEditingMenu';

/** 中文显示的 A/B/C 类优先级标记（叶武滨 ABC 分类：A=🔴 计划内要事、B=🟡 突发、C=🟢 干扰） */
class SetPriorityClass implements TaskEditingInstruction {
    constructor(private readonly priority: Priority, private readonly label: string) {}

    public instructionDisplayName(): string {
        return this.label;
    }

    public isCheckedForTask(task: Task): boolean {
        return task.priority === this.priority;
    }

    public apply(task: Task): Task[] {
        return [
            new Task({
                ...task,
                priority: this.priority,
            }),
        ];
    }
}

/** 推迟一天：顺延最近 happens 日期（📅 > ⏳ > 🛫） */
class PostponeOneDayInstruction implements TaskEditingInstruction {
    public instructionDisplayName(): string {
        return '⏩ 推迟一天';
    }

    public isCheckedForTask(_task: Task): boolean {
        return false;
    }

    public apply(task: Task): Task[] {
        const dateFieldToPostpone = getDateFieldToPostpone(task);
        if (dateFieldToPostpone === null) {
            return [task];
        }
        const { postponedTask } = createPostponedTask(task, dateFieldToPostpone, 'day', 1);
        // 顺延后固化日期（推断日期默认不序列化）
        return [
            new Task({
                ...postponedTask,
                scheduledDateIsInferred: false,
            }),
        ];
    }
}

/** 转收件箱：清除三个 happens 日期，待重新排程 */
class MoveTaskToInboxInstruction implements TaskEditingInstruction {
    public instructionDisplayName(): string {
        return '📥 转收件箱（清除日期，待排程）';
    }

    public isCheckedForTask(task: Task): boolean {
        return !task.dueDate && !task.scheduledDate && !task.startDate;
    }

    public apply(task: Task): Task[] {
        return [
            new Task({
                ...task,
                dueDate: null,
                scheduledDate: null,
                startDate: null,
                scheduledDateIsInferred: false,
            }),
        ];
    }
}

/**
 * 叶武滨定制右键菜单：官方状态项 + 「做 A 推迟 B 记录 C」快捷操作。
 *
 * 挂在任务复选框右键上，使阅读视图与查询结果（Dashboard）中也能直接操作——
 * 编辑器命令只覆盖源码模式，本菜单是 Dashboard 体验的关键补齐。
 */
export class YeWubinMenu extends StatusMenu {
    constructor(
        task: Task,
        statusRegistry: StatusRegistry = StatusRegistry.getInstance(),
        taskSaver: TaskSaver = defaultTaskSaver,
    ) {
        super(statusRegistry, task, taskSaver);

        this.addItemsForInstructions(
            [
                new MenuDividerInstruction(),
                new SetPriorityClass(Priority.High, '🔴 标记 A 类要事'),
                new SetPriorityClass(Priority.Medium, '🟡 标记 B 类（突发）'),
                new SetPriorityClass(Priority.Low, '🟢 标记 C 类（干扰）'),
                new SetPriorityClass(Priority.None, '取消 A/B/C 标记'),
                new MenuDividerInstruction(),
                new PostponeOneDayInstruction(),
                new MoveTaskToInboxInstruction(),
            ],
            task,
        );
    }
}
