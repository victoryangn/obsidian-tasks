import moment from 'moment';
import { YeWubinMenu } from '../../../src/ui/Menus/YeWubinMenu';
import { TaskBuilder } from '../../TestingTools/TaskBuilder';
import { Priority } from '../../../src/Task/Priority';
import { TestableTaskSaver, menuToString } from './MenuTestingHelpers';

window.moment = moment;

describe('YeWubinMenu', () => {
    beforeEach(() => {
        TestableTaskSaver.reset();
    });

    it('should contain official status items followed by ye-wubin ABC/postpone/inbox items', () => {
        const task = new TaskBuilder().build();

        const menu = new YeWubinMenu(task, undefined, TestableTaskSaver.testableTaskSaver);
        const itemsAsText = menuToString(menu);

        expect(itemsAsText).toContain('Todo');
        expect(itemsAsText).toContain('⏫ 标记 A 类要事');
        expect(itemsAsText).toContain('🔼 标记 B 类（突发）');
        expect(itemsAsText).toContain('🔽 标记 C 类（干扰）');
        expect(itemsAsText).toContain('取消 A/B/C 标记');
        expect(itemsAsText).toContain('⏩ 推迟一天');
        expect(itemsAsText).toContain('📥 转收件箱（清除日期，待排程）');
    });

    it('should show checkmark against current ABC class', () => {
        const task = new TaskBuilder().priority(Priority.High).build();

        const menu = new YeWubinMenu(task, undefined, TestableTaskSaver.testableTaskSaver);
        const itemsAsText = menuToString(menu);

        expect(itemsAsText).toContain('x ⏫ 标记 A 类要事');
    });

    it('should save task with new priority when A class selected', async () => {
        const task = new TaskBuilder().build();
        const menu = new YeWubinMenu(task, undefined, TestableTaskSaver.testableTaskSaver);

        // @ts-expect-error TS2339: Property 'items' does not exist on type 'YeWubinMenu'.
        const items = menu.items as Array<{ title: string | DocumentFragment; callback: () => unknown }>;
        const itemA = items.find((item) => item.title === '⏫ 标记 A 类要事');
        expect(itemA).toBeDefined();
        await itemA!.callback();

        expect(TestableTaskSaver.taskBeingOverwritten).toBe(task);
        expect((TestableTaskSaver.tasksBeingSaved![0] as { priority: Priority }).priority).toEqual(Priority.High);
    });

    it('should postpone the due date by one day via menu', async () => {
        const task = new TaskBuilder().dueDate('2026-09-05').build();
        const menu = new YeWubinMenu(task, undefined, TestableTaskSaver.testableTaskSaver);

        // @ts-expect-error TS2339: Property 'items' does not exist on type 'YeWubinMenu'.
        const items = menu.items as Array<{ title: string | DocumentFragment; callback: () => unknown }>;
        const itemPostpone = items.find((item) => item.title === '⏩ 推迟一天');
        expect(itemPostpone).toBeDefined();
        await itemPostpone!.callback();

        const saved = TestableTaskSaver.tasksBeingSaved![0] as { dueDate: { format: (f: string) => string } };
        expect(saved.dueDate.format('YYYY-MM-DD')).toEqual('2026-09-06');
    });

    it('should clear all happens dates via inbox item', async () => {
        const task = new TaskBuilder().dueDate('2026-09-05').scheduledDate('2026-09-01').startDate('2026-08-30').build();
        const menu = new YeWubinMenu(task, undefined, TestableTaskSaver.testableTaskSaver);

        // @ts-expect-error TS2339: Property 'items' does not exist on type 'YeWubinMenu'.
        const items = menu.items as Array<{ title: string | DocumentFragment; callback: () => unknown }>;
        const itemInbox = items.find((item) => item.title === '📥 转收件箱（清除日期，待排程）');
        expect(itemInbox).toBeDefined();
        await itemInbox!.callback();

        const saved = TestableTaskSaver.tasksBeingSaved![0] as {
            dueDate: unknown;
            scheduledDate: unknown;
            startDate: unknown;
        };
        expect(saved.dueDate).toBeNull();
        expect(saved.scheduledDate).toBeNull();
        expect(saved.startDate).toBeNull();
    });
});
