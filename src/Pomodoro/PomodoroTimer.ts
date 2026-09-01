/**
 * 255 番茄钟纯状态机（叶武滨 ABC255 工作法：25 分钟专注 + 5 分钟休息）。
 *
 * 无 Obsidian 依赖，时间源由构造注入，便于单元测试。
 * 计时基于时间戳（phaseEndAt）而非累加计数：系统休眠后恢复能立即判定到期，不会少计。
 */

export type PomodoroPhase = 'idle' | 'work' | 'break';

export interface PomodoroSnapshot {
    phase: PomodoroPhase;
    /** 剩余毫秒；idle 时为 null */
    remainingMs: number | null;
    /** 是否暂停（phaseEndAt 已清除、剩余量暂存） */
    paused: boolean;
    description: string;
}

export interface PomodoroTimerOptions {
    workMs: number;
    breakMs: number;
    /** work 结束后是否自动进入休息段 */
    autoStartBreak: boolean;
    /** 注入的时间源（毫秒） */
    now: () => number;
    /** 任一阶段自然到期时回调（暂停/跳过/放弃不触发） */
    onPhaseComplete: (completedPhase: 'work' | 'break') => void;
}

export class PomodoroTimer {
    private phase: PomodoroPhase = 'idle';
    private phaseEndAt: number | null = null;
    private pausedRemainingMs: number | null = null;
    private description = '';

    constructor(private readonly options: PomodoroTimerOptions) {}

    /** 开始一段专注（忽略进行中的调用，由调用方先用 isRunning 判断） */
    public start(description: string) {
        this.description = description;
        this.phase = 'work';
        this.phaseEndAt = this.options.now() + this.options.workMs;
        this.pausedRemainingMs = null;
    }

    public startBreak() {
        this.phase = 'break';
        this.phaseEndAt = this.options.now() + this.options.breakMs;
        this.pausedRemainingMs = null;
    }

    /** 放弃当前番茄，回到 idle 并清空描述 */
    public stop() {
        this.phase = 'idle';
        this.phaseEndAt = null;
        this.pausedRemainingMs = null;
        this.description = '';
    }

    public pause() {
        if (this.phase !== 'idle' && this.phaseEndAt !== null) {
            this.pausedRemainingMs = this.phaseEndAt - this.options.now();
            this.phaseEndAt = null;
        }
    }

    public resume() {
        if (this.pausedRemainingMs !== null) {
            this.phaseEndAt = this.options.now() + this.pausedRemainingMs;
            this.pausedRemainingMs = null;
        }
    }

    /** 专注中直接跳到休息段（不触发 onPhaseComplete） */
    public skipToBreak() {
        if (this.phase === 'work') {
            this.startBreak();
        }
    }

    /**
     * 每秒调用：检查当前阶段是否到期。到期时完成状态转换并触发 onPhaseComplete。
     * @returns 是否发生了阶段转换（供 UI 刷新）
     */
    public tick(): boolean {
        if (this.phase === 'idle' || this.phaseEndAt === null) {
            return false;
        }
        if (this.options.now() >= this.phaseEndAt) {
            const completedPhase = this.phase;
            if (completedPhase === 'work' && this.options.autoStartBreak) {
                this.startBreak();
            } else {
                this.stop();
            }
            this.options.onPhaseComplete(completedPhase);
            return true;
        }
        return false;
    }

    public getSnapshot(): PomodoroSnapshot {
        const remainingMs =
            this.phaseEndAt !== null ? Math.max(0, this.phaseEndAt - this.options.now()) : this.pausedRemainingMs;
        return {
            phase: this.phase,
            remainingMs: this.phase === 'idle' ? null : remainingMs,
            paused: this.phase !== 'idle' && this.phaseEndAt === null,
            description: this.description,
        };
    }

    public get isRunning(): boolean {
        return this.phase !== 'idle';
    }

    /** work 完成转 break 时描述仍需保留（弹窗展示用），故单独暴露 */
    public get currentDescription(): string {
        return this.description;
    }
}
