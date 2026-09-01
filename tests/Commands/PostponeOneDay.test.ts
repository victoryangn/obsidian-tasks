/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { postponeOneDayLine } from '../../src/Commands/PostponeOneDay';
import { resetSettings, updateSettings } from '../../src/Config/Settings';

window.moment = moment;

describe('PostponeOneDay', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        // 固定"今天"，避免测试跨日运行时结果变化
        jest.setSystemTime(new Date('2026-09-01'));
    });

    afterEach(() => {
        jest.useRealTimers();
        resetSettings();
    });

    it('should postpone due date (📅) by one day', () => {
        expect(postponeOneDayLine('- [ ] 任务 📅 2026-09-05', 'x.md')?.text).toStrictEqual('- [ ] 任务 📅 2026-09-06');
    });

    it('should postpone scheduled date (⏳) when no due date', () => {
        expect(postponeOneDayLine('- [ ] 任务 ⏳ 2026-09-05', 'x.md')?.text).toStrictEqual('- [ ] 任务 ⏳ 2026-09-06');
    });

    it('should postpone start date (🛫) when no due or scheduled date', () => {
        expect(postponeOneDayLine('- [ ] 任务 🛫 2026-09-05', 'x.md')?.text).toStrictEqual('- [ ] 任务 🛫 2026-09-06');
    });

    it('should prefer due date over scheduled date', () => {
        const result = postponeOneDayLine('- [ ] 任务 ⏳ 2026-09-05 📅 2026-09-10', 'x.md')?.text;
        expect(result).toStrictEqual('- [ ] 任务 ⏳ 2026-09-05 📅 2026-09-11');
    });

    it('should postpone the 🗓️ variant of due date (normalised to 📅)', () => {
        // 用户 vault 中大量使用 🗓️（含 VS16 变体选择符），它是合法 due date emoji；
        // 序列化时统一规范化为默认的 📅。
        expect(postponeOneDayLine('- [ ] 任务 🗓️2026-09-05', 'x.md')?.text).toStrictEqual('- [ ] 任务 📅 2026-09-06');
    });

    it('should preserve priority and recurrence when postponing', () => {
        const input = '- [ ] 任务 🔴 🔁 every week 📅 2026-09-05';
        expect(postponeOneDayLine(input, 'x.md')?.text).toStrictEqual('- [ ] 任务 🔴 🔁 every week 📅 2026-09-06');
    });

    it('should return undefined for tasks without any dates', () => {
        expect(postponeOneDayLine('- [ ] 无日期任务', 'x.md')).toBeUndefined();
    });

    it('should postpone a date inferred from a daily-note filename, and write it back to the line', () => {
        // useFilenameAsScheduledDate 开启时，YYYY-MM-DD 文件名推断出的 ⏳ 也参与顺延；
        // 顺延后的日期固化写入行内（否则推断日期不序列化，操作会静默无效）。
        updateSettings({ useFilenameAsScheduledDate: true });
        const result = postponeOneDayLine('- [ ] 无行内日期任务', '2026-09-01.md')?.text;
        expect(result).toStrictEqual('- [ ] 无行内日期任务 ⏳ 2026-09-02');
    });

    it('should return undefined for tasks without any dates when filename inference is disabled', () => {
        updateSettings({ useFilenameAsScheduledDate: false });
        expect(postponeOneDayLine('- [ ] 无行内日期任务', '2026-09-01.md')).toBeUndefined();
    });

    it('should return undefined for non-task lines', () => {
        expect(postponeOneDayLine('普通文本行', 'x.md')).toBeUndefined();
    });
});
