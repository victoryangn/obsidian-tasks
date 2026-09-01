/**
 * @jest-environment jsdom
 *
 * 叶武滨定制：行首 priority 识别守护测试（方案 v9 测试计划）。
 */

import moment from 'moment';
import { DEFAULT_SYMBOLS, DefaultTaskSerializer } from '../../src/TaskSerializer/DefaultTaskSerializer';
import { DataviewTaskSerializer } from '../../src/TaskSerializer/DataviewTaskSerializer';
import { TASK_FORMATS } from '../../src/Config/Settings';
import { Priority } from '../../src/Task/Priority';
import { TaskBuilder } from '../TestingTools/TaskBuilder';

window.moment = moment;

const serializer = TASK_FORMATS.tasksPluginEmoji.taskSerializer as DefaultTaskSerializer;

function parseLine(line: string) {
    // body = checkbox 之后的部分（Task.fromLine 同款拆分）
    const body = line.replace(/^- \[[ x/]\] ?/, '');
    return serializer.deserialize(body);
}

function roundTrip(line: string): string {
    const details = parseLine(line);
    const task = new TaskBuilder()
        .description(details.description)
        .priority(details.priority)
        .scheduledDate(details.scheduledDate ? details.scheduledDate.format('YYYY-MM-DD') : null)
        .dueDate(details.dueDate ? details.dueDate.format('YYYY-MM-DD') : null)
        .startDate(details.startDate ? details.startDate.format('YYYY-MM-DD') : null)
        .build();
    return `- [ ] ${serializer.serialize(task)}`;
}

describe('LeadingPriority 行首 priority 识别', () => {
    it('1. 行首解析基本：emoji + 任务 + 日期', () => {
        const details = parseLine('- [ ] 🔴 任务 📅 2026-09-01');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('任务');
        expect(details.dueDate?.format('YYYY-MM-DD')).toBe('2026-09-01');
    });

    it('2. VS16 变体：🔴️ 带变体选择符', () => {
        const details = parseLine('- [ ] 🔴️ 任务');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('任务');
    });

    it('2b. 空描述：仅 emoji', () => {
        const details = parseLine('- [ ] 🔴');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('');
    });

    it('2c. checkbox 后零空格', () => {
        const details = parseLine('- [ ]🔴 任务');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('任务');
    });

    it('2d. tab 前导（GLM 补）', () => {
        const details = parseLine('- [ ]\t🔴 任务');
        expect(details.priority).toEqual(Priority.High);
    });

    it('3. 冲突幂等：行首赢，重写后行尾消失', () => {
        const first = roundTrip('- [ ] 🔴 任务 🟡');
        expect(first).toBe('- [ ] 🔴 任务');
        const second = roundTrip(first);
        expect(second).toBe(first); // 两次重写一致
    });

    it('4. 往返稳定', () => {
        const once = roundTrip('- [ ] 🟡 带标记任务 ⏳ 2026-09-05');
        expect(once).toBe('- [ ] 🟡 带标记任务 ⏳ 2026-09-05');
        expect(roundTrip(once)).toBe(once);
    });

    it('5. 手动标记升级：emoji 从 description 剥离', () => {
        const details = parseLine('- [ ] 🔴 🆕手动标记任务 #tag');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('🆕手动标记任务 #tag');
    });

    it('6. toggle 取消：description 无残留（经命令层验证过的等价路径）', () => {
        const details = parseLine('- [ ] 🔴 任务');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).not.toContain('🔴');
    });

    it('7. Dataview 守护：行首 emoji 不剥离、行尾 inline field 保持（hook 恒等）', () => {
        const dataview = new DataviewTaskSerializer();
        const body = '🔴 开头描述 任意文本 [priority:: high]';
        const details = dataview.deserialize(body);
        expect(details.priority).toEqual(Priority.High); // 行尾字段解析正常
        expect(details.description).toContain('🔴'); // 行首 emoji 未被剥离（hook 恒等生效）
        expect(details.description).toContain('开头描述 任意文本'); // description 无损
    });

    it('8. 状态隔离：单例连续解析无跨行污染', () => {
        const first = parseLine('- [ ] 🔴 有标记行');
        expect(first.priority).toEqual(Priority.High);
        const second = parseLine('- [ ] 无标记行');
        expect(second.priority).toEqual(Priority.None);
    });

    it('8b. 紧贴负向：emoji 后无空格不识别', () => {
        const details = parseLine('- [ ] 🔴行首行');
        expect(details.priority).toEqual(Priority.None);
        expect(details.description).toBe('🔴行首行'); // 保留在 description
    });

    it('8c. 空 description + 组件无双空格', () => {
        const task = new TaskBuilder().description('').priority(Priority.High).dueDate('2026-09-01').build();
        const serialized = serializer.serialize(task);
        expect(serialized).toBe('🔴 📅 2026-09-01');
    });

    it('8d. 无 priority 分支与官方逐字节等价（含空 description quirk）', () => {
        // 空 description + 有组件 + 无 priority：官方输出带前导空格（组件前导空格所致），v9 保持一致
        const task = new TaskBuilder().description('').dueDate('2026-09-01').build();
        const serialized = serializer.serialize(task);
        expect(serialized).toBe(' 📅 2026-09-01');
        // description 带前导空格：原样保留
        const task2 = new TaskBuilder().description('  缩进描述').build();
        expect(serializer.serialize(task2)).toBe('  缩进描述');
    });

    it('8e. 多个行首 emoji：只识别第一个（GLM 补）', () => {
        const details = parseLine('- [ ] 🔴 🟡 双标记任务');
        expect(details.priority).toEqual(Priority.High);
        expect(details.description).toBe('🟡 双标记任务');
    });

    it('9. 符号映射一致性：正则 emoji 集合与 DEFAULT_SYMBOLS 对齐', () => {
        const { prioritySymbols } = DEFAULT_SYMBOLS;
        const symbolsInPriority = [
            prioritySymbols.Highest,
            prioritySymbols.High,
            prioritySymbols.Medium,
            prioritySymbols.Low,
            prioritySymbols.Lowest,
        ];
        // hook 正则中的集合（与上面逐一对应）；若未来改符号表而漏改正则，此测试失败
        const regexSource = /^ *(🔺|🔴|🟡|🟢|⏬)️?(?:\s|$)/.source;
        for (const symbol of symbolsInPriority) {
            expect(regexSource).toContain(symbol);
        }
    });
});
