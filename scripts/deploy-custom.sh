#!/bin/bash
# 叶武滨定制版部署脚本：构建 → 备份 → 部署到 vault
# 用法：bash scripts/deploy-custom.sh [--dashboard]
#   --dashboard  同时向 Dashboard.md 注入自动查询区块（首次部署用；已注入过则跳过）

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VAULT_DIR="${VAULT_DIR:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyObsidian}"
PLUGIN_DIR="$VAULT_DIR/.obsidian/plugins/obsidian-tasks-plugin"
DATE_TAG="$(date +%Y%m%d-%H%M%S)"

echo "仓库：$REPO_DIR"
echo "Vault：$VAULT_DIR"
echo ""

# 0. 前置检查
if [ ! -d "$PLUGIN_DIR" ]; then
    echo "❌ 未找到插件目录：$PLUGIN_DIR"
    echo "   请用 VAULT_DIR=/path/to/vault bash scripts/deploy-custom.sh 指定 vault"
    exit 1
fi

if pgrep -x "Obsidian" > /dev/null 2>&1 || pgrep -x "obsidian" > /dev/null 2>&1; then
    echo "⚠️  检测到 Obsidian 正在运行。"
    echo "   iCloud 同步的 vault 在运行时替换插件文件可能产生冲突副本。"
    read -p "仍然继续部署？[y/N] " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || { echo "已取消。请先完全退出 Obsidian（含其他设备）后重试。"; exit 1; }
fi

# 1. 构建
echo "==> 构建（node 22）..."
eval "$(fnm env)" && fnm use 22 2>/dev/null || echo "   （fnm 不可用，使用当前 node）"
cd "$REPO_DIR"
yarn install --frozen-lockfile 2>/dev/null || yarn install
yarn build

# 2. 备份官方插件三件套
BACKUP_DIR="$PLUGIN_DIR/backup-official-$DATE_TAG"
echo "==> 备份官方版本到 $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
for f in main.js styles.css manifest.json; do
    [ -f "$PLUGIN_DIR/$f" ] && cp "$PLUGIN_DIR/$f" "$BACKUP_DIR/"
done

# 3. 部署三件套（data.json 永不触碰）
echo "==> 部署定制版三件套（data.json 保持不动）..."
cp "$REPO_DIR/main.js" "$PLUGIN_DIR/main.js"
cp "$REPO_DIR/styles.css" "$PLUGIN_DIR/styles.css"
cp "$REPO_DIR/manifest.json" "$PLUGIN_DIR/manifest.json"

# 4. Dashboard 注入（可选）
if [ "${1:-}" = "--dashboard" ]; then
    DASHBOARD="$VAULT_DIR/Dashboard.md"
    if [ ! -f "$DASHBOARD" ]; then
        echo "⚠️  未找到 Dashboard.md，跳过注入"
    elif grep -q "今日高能要事（A 类）" "$DASHBOARD"; then
        echo "==> Dashboard.md 已含查询区块，跳过注入"
    else
        echo "==> 备份并注入 Dashboard.md 查询区块..."
        cp "$DASHBOARD" "$VAULT_DIR/Dashboard.md.bak-$DATE_TAG"
        MARKER="## ⏳ 等待回复（委托等待）"
        BLOCK='## 🎯 今日高能要事（A 类）

```tasks
not done
priority is high
happens on or before today
limit 10
```

## ⏰ 逾期未完成

```tasks
not done
happens before today
sort by happens
limit 15
```

## 📥 收件箱待排程

```tasks
not done
path includes 1. 任务管理
heading includes 收件箱
```'

        if grep -q "$MARKER" "$DASHBOARD"; then
            # 在手动「等待回复」区块之前插入自动区块（手动清单保留，迁移后可删）
            python3 - "$DASHBOARD" "$MARKER" "$BLOCK" << 'PYEOF'
import sys
path, marker, block = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path, encoding='utf-8') as f:
    content = f.read()
content = content.replace(marker, block + '\n\n' + marker, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
PYEOF
            echo "   已插入（手动「等待回复」清单保留，迁去看板后可删除）"
        else
            # 找不到标记，追加到文件末尾
            printf '\n%s\n' "$BLOCK" >> "$DASHBOARD"
            echo "   未找到等待回复区块，已追加到文件末尾"
        fi
    fi
fi

echo ""
echo "✅ 部署完成。回滚方法："
echo "   1. 完全退出 Obsidian"
echo "   2. cp '$BACKUP_DIR/{main.js,styles.css,manifest.json}' '$PLUGIN_DIR/'"
echo "   3. 重启 Obsidian（data.json 与官方版完全兼容）"
