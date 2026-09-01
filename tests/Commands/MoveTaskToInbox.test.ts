/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { moveToInboxLine } from '../../src/Commands/MoveTaskToInbox';

window.moment = moment;

describe('MoveTaskToInbox', () => {
    it('should remove all three happens dates', () => {
        const input = '- [ ] 任务 ⏳ 2026-09-01 📅 2026-09-05';
        expect(moveToInboxLine(input, 'x.md')?.text).toStrictEqual('- [ ] 任务');
    });

    it('should remove only start date when that is all there is', () => {
        expect(moveToInboxLine('- [ ] 任务 🛫 2026-09-05', 'x.md')?.text).toStrictEqual('- [ ] 任务');
    });

    it('should preserve priority, recurrence and done date', () => {
        const input = '- [x] 已完成 🔴 🔁 every week 📅 2026-09-05 ✅ 2026-09-06';
        const result = moveToInboxLine(input, 'x.md')?.text;
        expect(result).toStrictEqual('- [x] 已完成 🔴 🔁 every week ✅ 2026-09-06');
    });

    it('should preserve tags and block links', () => {
        const input = '- [ ] 任务 #销售 @alice ⏳ 2026-09-01';
        expect(moveToInboxLine(input, 'x.md')?.text).toStrictEqual('- [ ] 任务 #销售 @alice');
    });

    it('should return undefined for tasks without dates (already in inbox state)', () => {
        expect(moveToInboxLine('- [ ] 无日期任务', 'x.md')).toBeUndefined();
    });

    it('should return undefined for non-task lines', () => {
        expect(moveToInboxLine('普通文本行', 'x.md')).toBeUndefined();
    });
});
