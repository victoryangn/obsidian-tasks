/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { PomodoroTimer } from '../../src/Pomodoro/PomodoroTimer';

window.moment = moment;

describe('PomodoroTimer', () => {
    const WORK_MS = 25 * 60_000;
    const BREAK_MS = 5 * 60_000;
    let nowMs: number;
    let completed: Array<'work' | 'break'>;

    function createTimer(autoStartBreak = true) {
        return new PomodoroTimer({
            workMs: WORK_MS,
            breakMs: BREAK_MS,
            autoStartBreak,
            now: () => nowMs,
            onPhaseComplete: (phase) => completed.push(phase),
        });
    }

    beforeEach(() => {
        nowMs = 1_000_000;
        completed = [];
    });

    it('should start in work phase with full duration remaining', () => {
        const timer = createTimer();
        timer.start('写报价单');

        expect(timer.isRunning).toBe(true);
        const snapshot = timer.getSnapshot();
        expect(snapshot.phase).toBe('work');
        expect(snapshot.remainingMs).toBe(WORK_MS);
        expect(snapshot.description).toBe('写报价单');
    });

    it('should complete work and auto-start break when autoStartBreak is true', () => {
        const timer = createTimer(true);
        timer.start('跟进客户');

        nowMs += WORK_MS; // 时间拨到专注结束
        expect(timer.tick()).toBe(true);

        expect(completed).toEqual(['work']);
        expect(timer.getSnapshot().phase).toBe('break');
        expect(timer.getSnapshot().remainingMs).toBe(BREAK_MS);
    });

    it('should return to idle after work when autoStartBreak is false', () => {
        const timer = createTimer(false);
        timer.start('跟进客户');

        nowMs += WORK_MS;
        timer.tick();

        expect(completed).toEqual(['work']);
        expect(timer.isRunning).toBe(false);
    });

    it('should complete break and return to idle', () => {
        const timer = createTimer(true);
        timer.start('跟进客户');
        nowMs += WORK_MS;
        timer.tick(); // 进入 break

        nowMs += BREAK_MS; // 休息结束
        timer.tick();

        expect(completed).toEqual(['work', 'break']);
        expect(timer.isRunning).toBe(false);
    });

    it('should detect expiry even after long sleep (timestamp-based, not counting ticks)', () => {
        const timer = createTimer(true);
        timer.start('跟进客户');

        // 休眠 3 倍时长后一个 tick 也没跑，醒来第一个 tick 应立即判定到期
        nowMs += WORK_MS * 3;
        timer.tick();

        expect(completed).toEqual(['work']);
    });

    it('should not complete while paused, and preserve remaining time on resume', () => {
        const timer = createTimer();
        timer.start('跟进客户');

        nowMs += 10 * 60_000; // 专注 10 分钟
        timer.pause();
        expect(timer.getSnapshot().paused).toBe(true);
        expect(timer.getSnapshot().remainingMs).toBe(15 * 60_000);

        nowMs += 60 * 60_000; // 暂停 1 小时，不消耗剩余时间
        expect(timer.tick()).toBe(false);
        expect(completed).toEqual([]);

        timer.resume();
        expect(timer.getSnapshot().paused).toBe(false);
        expect(timer.getSnapshot().remainingMs).toBe(15 * 60_000);

        nowMs += 15 * 60_000; // 剩余时间走完
        timer.tick();
        expect(completed).toEqual(['work']);
    });

    it('should skip from work to break without triggering completion', () => {
        const timer = createTimer();
        timer.start('跟进客户');

        timer.skipToBreak();

        expect(completed).toEqual([]);
        expect(timer.getSnapshot().phase).toBe('break');
    });

    it('should stop and clear description', () => {
        const timer = createTimer();
        timer.start('跟进客户');

        timer.stop();

        expect(timer.isRunning).toBe(false);
        expect(timer.getSnapshot().description).toBe('');
        expect(completed).toEqual([]);
    });

    it('should keep description after work completes (for modal display)', () => {
        const timer = createTimer(true);
        timer.start('跟进客户');
        nowMs += WORK_MS;
        timer.tick();

        expect(timer.getSnapshot().phase).toBe('break');
        expect(timer.currentDescription).toBe('跟进客户');
    });

    it('should not tick when idle', () => {
        const timer = createTimer();
        expect(timer.tick()).toBe(false);
        expect(completed).toEqual([]);
    });
});
