/**
 * @jest-environment jsdom
 */

import moment from 'moment';
import { getSettings, resetSettings, updateSettings } from '../../src/Config/Settings';
import { defaultPresets } from '../../src/Query/Presets/Presets';

window.moment = moment;

describe('migrateSettings presets backfill', () => {
    afterEach(() => {
        resetSettings();
    });

    it('should backfill ye_* presets into saved presets that predate them', () => {
        // 模拟旧版保存的 presets（无 ye_* 键，且官方键是旧格式内容）
        const savedPresets = {
            this_file: 'path includes {{query.file.path}}',
            hide_query_elements: '# Hide toolbar\nhide toolbar\nhide edit button',
        };
        updateSettings({ presets: savedPresets });

        const { presets } = getSettings();
        for (const key of Object.keys(defaultPresets) as (keyof typeof defaultPresets)[]) {
            if (key.startsWith('ye_')) {
                expect(presets[key]).toStrictEqual(defaultPresets[key]);
            }
        }
        // 用户原有键保留
        expect(presets.this_file).toStrictEqual('path includes {{query.file.path}}');
        expect(presets.hide_query_elements).toStrictEqual('# Hide toolbar\nhide toolbar\nhide edit button');
    });

    it('should keep user-edited ye_* values (user value wins)', () => {
        updateSettings({
            presets: {
                ye_today_a: 'not done\npriority is high',
            },
        });

        expect(getSettings().presets.ye_today_a).toStrictEqual('not done\npriority is high');
    });

    it('should not resurrect user-deleted official built-in presets', () => {
        // 用户删除了 this_root 和 hide_everything，只留一个官方键
        updateSettings({
            presets: {
                this_file: 'path includes {{query.file.path}}',
            },
        });

        const { presets } = getSettings();
        expect(presets.this_root).toBeUndefined();
        expect(presets.hide_everything).toBeUndefined();
        expect(presets.this_file).toBeDefined();
    });

    it('should leave settings without a presets key untouched (defaults apply)', () => {
        updateSettings({ globalFilter: '#task' });

        const settings = getSettings();
        expect(settings.globalFilter).toStrictEqual('#task');
        // 默认 presets 完整存在（含 ye_*）
        expect(settings.presets).toStrictEqual(defaultPresets);
    });

    it('should ignore non-object presets values gracefully', () => {
        // 防御性：presets 若被外部写成数组或字符串，不抛错
        expect(() => updateSettings({ presets: 'garbage' as unknown as Record<string, string> })).not.toThrow();
        expect(() => updateSettings({ presets: ['a', 'b'] as unknown as Record<string, string> })).not.toThrow();
    });
});
