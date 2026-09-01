export type PresetsMap = Record<string, string>;
export const defaultPresets = {
    this_file: 'path includes {{query.file.path}}',
    this_folder: 'folder includes {{query.file.folder}}',
    this_folder_only: 'filter by function task.file.folder === query.file.folder',
    this_root: 'root includes {{query.file.root}}',
    hide_date_fields:
        '# Hide any values for all date fields\nhide due date\nhide scheduled date\nhide start date\nhide created date\nhide done date\nhide cancelled date',
    hide_non_date_fields:
        '# Hide all the non-date fields, but not tags\nhide id\nhide depends on\nhide recurrence rule\nhide on completion\nhide priority',
    hide_query_elements:
        '# Hide toolbar, postpone, edit, backlinks and task count\nhide toolbar\nhide postpone button\nhide edit button\nhide backlinks\nhide task count',
    hide_everything:
        '# Hide everything except description and any tags\npreset hide_date_fields\npreset hide_non_date_fields\npreset hide_query_elements',
    // ===== 叶武滨定制 presets（ye_ 前缀为定制版自有命名空间，key 稳定勿改名：Dashboard/日记模板引用）=====
    ye_today_a: '# 今日 A 类要事（含逾期 A 类）\nnot done\npriority is high\nhappens on or before today',
    ye_overdue: '# 逾期任务\nnot done\nhappens before today\nsort by happens\nlimit 30',
    ye_waiting: '# 等待回复：看板「委托等待」栏\nnot done\npath includes 1. 任务管理\nheading includes 委托等待',
    ye_waiting_date:
        '# 等待回复：全库未来日程（⏳/🛫 在今天之后）\nnot done\n(scheduled after today) OR (starts after today)\nsort by happens\nlimit 30',
    ye_inbox: '# 收件箱待排程：看板「收件箱」栏\nnot done\npath includes 1. 任务管理\nheading includes 收件箱',
    ye_clean:
        '# 紧凑显示（Dashboard 用）\nhide edit button\nhide postpone button\nhide backlinks\nhide created date\nhide start date\nhide cancelled date\nhide id\nhide depends on',
};

function summariseInstruction(instructions: string) {
    let result = instructions;
    let truncated = false;

    // Only return the first line of any multi-line instructions:
    const splitInstructions = instructions.split('\n');
    if (splitInstructions.length > 1) {
        result = splitInstructions[0];
        truncated = true;
    }

    // Shorten longer lines, since text is wrapped in error output.
    const maxLineLength = 50;
    if (result.length > maxLineLength) {
        result = result.slice(0, maxLineLength);
        truncated = true;
    }

    if (truncated) {
        result += '...';
    }
    return result;
}

export function unknownPresetErrorMessage(presentName: string, presets: PresetsMap) {
    let message = `Cannot find preset "${presentName}" in the Tasks settings`;

    const isPresetsEmpty = Object.keys(presets).length === 0;
    if (isPresetsEmpty) {
        message += `\nYou can define the instruction(s) for "${presentName}" in the Tasks settings.`;
    } else {
        const maxKeyLength = Math.max(...Object.keys(presets).map((key) => key.length));
        const availableNames = Object.entries(presets)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key.padEnd(maxKeyLength)}: ${summariseInstruction(value)}`)
            .join('\n  ');
        message += `\nThe following presets are defined in the Tasks settings:\n  ${availableNames}`;
    }

    return message;
}
