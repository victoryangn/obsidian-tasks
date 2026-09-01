/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { startPomodoroOnLine } from '../../src/Commands/StartPomodoro';
import { getSettings, resetSettings, updateSettings } from '../../src/Config/Settings';
import { StatusRegistry } from '../../src/Statuses/StatusRegistry';

window.moment = moment;

describe('startPomodoroOnLine', () => {
    afterEach(() => {
        resetSettings();
        StatusRegistry.getInstance().resetToDefaultStatuses();
    });

    it('should mark task as In Progress when markInProgress is true', () => {
        // 默认 StatusRegistry 含 '/' In Progress
        const result = startPomodoroOnLine('- [ ] 跟进 Neala 报价', 'x.md', true);

        expect(result).toBeDefined();
        expect(result?.description).toBe('跟进 Neala 报价');
        expect(result?.statusInsertion?.text).toStrictEqual('- [/] 跟进 Neala 报价');
    });

    it('should not modify the line when markInProgress is false', () => {
        const result = startPomodoroOnLine('- [ ] 跟进 Neala 报价', 'x.md', false);

        expect(result).toBeDefined();
        expect(result?.description).toBe('跟进 Neala 报价');
        expect(result?.statusInsertion).toBeUndefined();
    });

    it('should reflect markInProgress setting changes via getSettings()', () => {
        updateSettings({ pomodoro: { ...getSettings().pomodoro, markInProgress: false } });
        expect(getSettings().pomodoro.markInProgress).toBe(false);
        expect(getSettings().pomodoro.workMinutes).toBe(25);
    });

    it('should return undefined for non-task lines', () => {
        expect(startPomodoroOnLine('普通文本行', 'x.md', true)).toBeUndefined();
        expect(startPomodoroOnLine('', 'x.md', false)).toBeUndefined();
    });

    it('should preserve other task fields when setting In Progress', () => {
        const input = '- [ ] 保养车辆 🔴 🔁 every 3 months 📅 2026-09-01';
        const result = startPomodoroOnLine(input, 'x.md', true);

        expect(result?.statusInsertion?.text).toStrictEqual('- [/] 🔴 保养车辆 🔁 every 3 months 📅 2026-09-01');
    });
});
