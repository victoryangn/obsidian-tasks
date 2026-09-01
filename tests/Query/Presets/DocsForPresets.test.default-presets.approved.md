<!-- placeholder to force blank line before included text -->

| Name | Instruction(s) |
| ----- | ----- |
| `this_file` | `path includes {{query.file.path}}` |
| `this_folder` | `folder includes {{query.file.folder}}` |
| `this_folder_only` | `filter by function task.file.folder === query.file.folder` |
| `this_root` | `root includes {{query.file.root}}` |
| `hide_date_fields` | `# Hide any values for all date fields`<br>`hide due date`<br>`hide scheduled date`<br>`hide start date`<br>`hide created date`<br>`hide done date`<br>`hide cancelled date` |
| `hide_non_date_fields` | `# Hide all the non-date fields, but not tags`<br>`hide id`<br>`hide depends on`<br>`hide recurrence rule`<br>`hide on completion`<br>`hide priority` |
| `hide_query_elements` | `# Hide toolbar, postpone, edit, backlinks and task count`<br>`hide toolbar`<br>`hide postpone button`<br>`hide edit button`<br>`hide backlinks`<br>`hide task count` |
| `hide_everything` | `# Hide everything except description and any tags`<br>`preset hide_date_fields`<br>`preset hide_non_date_fields`<br>`preset hide_query_elements` |
| `ye_today_a` | `# 今日 A 类要事（含逾期 A 类）`<br>`not done`<br>`priority is high`<br>`happens on or before today` |
| `ye_overdue` | `# 逾期任务`<br>`not done`<br>`happens before today`<br>`sort by happens`<br>`limit 30` |
| `ye_waiting` | `# 等待回复：看板「委托等待」栏`<br>`not done`<br>`path includes 1. 任务管理`<br>`heading includes 委托等待` |
| `ye_waiting_date` | `# 等待回复：全库未来日程（⏳/🛫 在今天之后）`<br>`not done`<br>`(scheduled after today) OR (starts after today)`<br>`sort by happens`<br>`limit 30` |
| `ye_inbox` | `# 收件箱待排程：看板「收件箱」栏`<br>`not done`<br>`path includes 1. 任务管理`<br>`heading includes 收件箱` |
| `ye_clean` | `# 紧凑显示（Dashboard 用）`<br>`hide edit button`<br>`hide postpone button`<br>`hide backlinks`<br>`hide created date`<br>`hide start date`<br>`hide cancelled date`<br>`hide id`<br>`hide depends on` |


<!-- placeholder to force blank line after included text -->
