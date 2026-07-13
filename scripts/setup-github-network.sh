#!/usr/bin/env bash
# 配置 GitHub 网络：SSH over 443 + 可选 HTTPS HTTP/1.1
# 用法：bash scripts/setup-github-network.sh

set -euo pipefail

SSH_CONFIG="$HOME/.ssh/config"
KNOWN_HOSTS="$HOME/.ssh/known_hosts"
KEY_FILE="$HOME/.ssh/id_ed25519"
PUB_FILE="$HOME/.ssh/id_ed25519.pub"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 1. 添加 ssh.github.com:443 到 known_hosts"
if ! grep -q ssh.github.com "$KNOWN_HOSTS" 2>/dev/null; then
  ssh-keyscan -p 443 ssh.github.com >> "$KNOWN_HOSTS" 2>/dev/null
  echo "    已添加"
else
  echo "    已存在，跳过"
fi

echo "==> 2. 配置 ~/.ssh/config（SSH over 443）"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [[ -f "$SSH_CONFIG" ]] && grep -q "Hostname ssh.github.com" "$SSH_CONFIG" 2>/dev/null; then
  echo "    已配置 SSH over 443，跳过"
else
  cat > "$SSH_CONFIG" <<'EOF'
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
EOF
  chmod 600 "$SSH_CONFIG"
  echo "    已写入 $SSH_CONFIG"
fi

if [[ ! -f "$KEY_FILE" ]]; then
  echo "==> 生成 SSH 密钥"
  ssh-keygen -t ed25519 -C "$(whoami)@$(hostname)" -f "$KEY_FILE" -N ""
fi

echo "==> 3. 测试 SSH 连接"
if ssh -T -o ConnectTimeout=15 git@github.com 2>&1 | grep -qi "successfully authenticated"; then
  echo "    SSH 已可用 ✓"
else
  echo "    账户 SSH 密钥未配置，尝试为当前仓库添加 Deploy Key..."
  if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "YokingX/zhongzhao")
    if gh api "repos/${REPO}/keys" -X POST \
      -f title="$(hostname) deploy" \
      -f key@"$PUB_FILE" \
      -F read_only=false >/dev/null 2>&1; then
      echo "    Deploy Key 已添加到 ${REPO} ✓"
    else
      echo "    Deploy Key 添加失败（可能已存在），请手动添加账户 SSH 密钥："
      echo "    https://github.com/settings/ssh/new"
      cat "$PUB_FILE"
    fi
  fi
fi

cd "$REPO_DIR"
git remote set-url origin "git@github.com:YokingX/zhongzhao.git"
echo "    已将 origin 改为 SSH (git@github.com:YokingX/zhongzhao.git)"

echo ""
echo "==> 4. HTTPS 备用（当前仓库）"
git config http.version HTTP/1.1
echo "    已设置本仓库 http.version=HTTP/1.1"
echo "    若 HTTPS push 仍超时，使用: npm run push:gh"
echo ""
echo "==> 5. 连通性自检"
curl -sS -o /dev/null -w "    github.com:     %{http_code} %{time_total}s\n" --connect-timeout 10 https://github.com || true
curl -sS -o /dev/null -w "    api.github.com: %{http_code} %{time_total}s\n" --connect-timeout 10 https://api.github.com || true
