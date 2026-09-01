/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { togglePriorityALine, togglePriorityBLine, togglePriorityCLine } from '../../src/Commands/PriorityABCCommands';

window.moment = moment;

describe('PriorityABCCommands', () => {
    describe('A 类（High ⏫）', () => {
        it('should add ⏫ to a task without priority', () => {
            expect(togglePriorityALine('- [ ] 普通任务', 'x.md')?.text).toStrictEqual('- [ ] 普通任务 ⏫');
        });

        it('should remove ⏫ when toggling again (back to None)', () => {
            expect(togglePriorityALine('- [ ] 普通任务 ⏫', 'x.md')?.text).toStrictEqual('- [ ] 普通任务');
        });

        it('should replace 🔽 with ⏫', () => {
            expect(togglePriorityALine('- [ ] 普通任务 🔽', 'x.md')?.text).toStrictEqual('- [ ] 普通任务 ⏫');
        });

        it('should preserve other fields when adding ⏫', () => {
            const input = '- [ ] 保养车辆 🔁 every 3 months 📅 2026-09-01';
            const result = togglePriorityALine(input, 'x.md')?.text;
            expect(result).toStrictEqual('- [ ] 保养车辆 ⏫ 🔁 every 3 months 📅 2026-09-01');
        });

        it('should preserve tags when adding ⏫', () => {
            const input = '- [ ] 跟进客户 #销售 @alice';
            const result = togglePriorityALine(input, 'x.md')?.text;
            expect(result).toStrictEqual('- [ ] 跟进客户 #销售 @alice ⏫');
        });
    });

    describe('B 类（Medium 🔼）', () => {
        it('should add 🔼 to a task without priority', () => {
            expect(togglePriorityBLine('- [ ] 普通任务', 'x.md')?.text).toStrictEqual('- [ ] 普通任务 🔼');
        });

        it('should remove 🔼 when toggling again', () => {
            expect(togglePriorityBLine('- [ ] 普通任务 🔼', 'x.md')?.text).toStrictEqual('- [ ] 普通任务');
        });

        it('should replace ⏫ with 🔼', () => {
            expect(togglePriorityBLine('- [ ] 普通任务 ⏫', 'x.md')?.text).toStrictEqual('- [ ] 普通任务 🔼');
        });
    });

    describe('C 类（Low 🔽）', () => {
        it('should add 🔽 to a task without priority', () => {
            expect(togglePriorityCLine('- [ ] 普通任务', 'x.md')?.text).toStrictEqual('- [ ] 普通任务 🔽');
        });

        it('should remove 🔽 when toggling again', () => {
            expect(togglePriorityCLine('- [ ] 普通任务 🔽', 'x.md')?.text).toStrictEqual('- [ ] 普通任务');
        });
    });

    describe('非任务行', () => {
        it('should return undefined for non-task lines', () => {
            expect(togglePriorityALine('普通文本行', 'x.md')).toBeUndefined();
            expect(togglePriorityALine('- 列表项', 'x.md')).toBeUndefined();
            expect(togglePriorityALine('', 'x.md')).toBeUndefined();
        });

        it('should be able to mark completed tasks too', () => {
            // 已完成任务同样可以标记/取消优先级
            expect(togglePriorityALine('- [x] 已完成任务 ✅ 2026-09-01', 'x.md')?.text).toStrictEqual(
                '- [x] 已完成任务 ⏫ ✅ 2026-09-01',
            );
        });
    });
});
