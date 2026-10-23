#!/usr/bin/env bash
# 初始化本地 uni-app x（Vapor）Android 打包宿主。
# 宿主模板在 scripts/native-host/，原生 SDK 库从官方 vapor 离线 SDK 复制。
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/native-host/xvnativeproject"
DEFAULT_DEST="$HOME/Library/Application Support/GameApp/uni-app-x-vapor-5.26"
SDK_VERSION="5.26"

DEST="${NATIVE_HOST_CACHE:-$DEFAULT_DEST}"
SOURCE="${UNI_X_SDK:-}"
FORCE=0
TMP_DIR=""

usage() {
  cat <<'EOF'
用法: scripts/setup-native-host.sh [选项]

初始化本地 Android 打包宿主（默认安装到
~/Library/Application Support/GameApp/uni-app-x-vapor-5.26）。

选项:
  --sdk <zip|目录>   官方 vapor 离线 SDK 压缩包或解压目录
  --dest <目录>      自定义宿主缓存目录
  --force            重新复制 SDK 原生库
  -h, --help         显示帮助

未指定 --sdk 时会依次查找:
  $UNI_X_SDK、$UNI_X_SDK_ZIP、$UNI_X_SDK_ROOT、
  /tmp/uni-x-sdk/vapor-sdk-5.26.zip、
  /tmp/uni-x-sdk/extracted/Android-uni-app-x-vapor-SDK@*、
  ~/Downloads/Android-uni-app-x-vapor-SDK@*。

示例:
  scripts/setup-native-host.sh --sdk ~/Downloads/Android-uni-app-x-vapor-SDK@101163-5.26.zip
EOF
}

log() { printf '==> %s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }

cleanup() {
  if [[ -n "$TMP_DIR" && -d "$TMP_DIR" ]]; then
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --sdk)
      [[ $# -ge 2 ]] || die "--sdk 需要一个文件或目录路径"
      SOURCE="$2"
      shift 2
      ;;
    --dest)
      [[ $# -ge 2 ]] || die "--dest 需要一个目录路径"
      DEST="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "未知参数: $1（使用 --help 查看用法）"
      ;;
  esac
done

is_sdk_root() {
  [[ -f "$1/SDK/libs/app-runtime-release.aar" && -d "$1/plugins" ]]
}

find_sdk_source() {
  local candidate
  if [[ -n "$SOURCE" ]]; then
    printf '%s\n' "$SOURCE"
    return 0
  fi

  for candidate in \
    "${UNI_X_SDK_ZIP:-}" \
    "${UNI_X_SDK_ROOT:-}" \
    "/tmp/uni-x-sdk/vapor-sdk-5.26.zip" \
    "$PROJECT_DIR/build/vapor-sdk-5.26.zip" \
    "$HOME/Downloads/vapor-sdk-5.26.zip" \
    "/tmp/uni-x-sdk/extracted/Android-uni-app-x-vapor-SDK@101163-5.26" \
    "$HOME/Downloads/Android-uni-app-x-vapor-SDK@101163-5.26"; do
    if [[ -n "$candidate" && -e "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  for candidate in \
    /tmp/uni-x-sdk/extracted/Android-uni-app-x-vapor-SDK@* \
    "$HOME/Downloads"/Android-uni-app-x-vapor-SDK@*; do
    if [[ -e "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

normalize_sdk_dir() {
  local path="$1" child
  if is_sdk_root "$path"; then
    printf '%s\n' "$path"
    return 0
  fi
  for child in "$path"/Android-uni-app-x-vapor-SDK@* "$path"/Android-uni-app-x-vapor-SDK*; do
    if [[ -d "$child" ]] && is_sdk_root "$child"; then
      printf '%s\n' "$child"
      return 0
    fi
  done
  return 1
}

missing_aars() {
  local gradle_file="$1" lib_dir="$2" aar
  grep -oE "'[A-Za-z0-9._-]+-release\.aar'" "$gradle_file" |
    tr -d "'" |
    sort -u |
    while IFS= read -r aar; do
      [[ -f "$lib_dir/$aar" ]] || printf '%s\n' "$aar"
    done
}

mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"
case "$DEST" in
  "/"|"$HOME"|"$PROJECT_DIR")
    die "拒绝使用不安全的缓存目录: $DEST"
    ;;
esac

[[ -f "$TEMPLATE_DIR/app/build.gradle" ]] || die "宿主模板缺失: $TEMPLATE_DIR"

SDK_SOURCE="$(find_sdk_source || true)"
[[ -n "$SDK_SOURCE" ]] || die "找不到官方 vapor 离线 SDK。请下载后使用 --sdk 指定 zip 或解压目录。"

SDK_ROOT=""
if [[ -d "$SDK_SOURCE" ]]; then
  SDK_ROOT="$(normalize_sdk_dir "$SDK_SOURCE" || true)"
  [[ -n "$SDK_ROOT" ]] || die "目录中没有 SDK/libs 与 plugins: $SDK_SOURCE"
elif [[ -f "$SDK_SOURCE" && "$SDK_SOURCE" == *.zip ]]; then
  ENTRY="$(unzip -Z1 "$SDK_SOURCE" | grep -m1 '/SDK/libs/app-runtime-release\.aar$' || true)"
  [[ -n "$ENTRY" ]] || die "压缩包中找不到 SDK/libs/app-runtime-release.aar: $SDK_SOURCE"
  PREFIX="${ENTRY%/SDK/libs/app-runtime-release.aar}"
  TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/game-app-sdk.XXXXXX")"
  log "解压 SDK 原生库（约 226 MB）..."
  unzip -q "$SDK_SOURCE" "$PREFIX/SDK/*" "$PREFIX/plugins/*" -d "$TMP_DIR"
  SDK_ROOT="$TMP_DIR/$PREFIX"
  is_sdk_root "$SDK_ROOT" || die "SDK 解压结果不完整: $SDK_ROOT"
else
  die "--sdk 需要是 .zip 文件或解压后的 SDK 目录: $SDK_SOURCE"
fi

MISSING="$(missing_aars "$TEMPLATE_DIR/app/build.gradle" "$DEST/SDK/libs" 2>/dev/null || true)"
if [[ "$FORCE" -eq 0 && -f "$DEST/SDK/libs/app-runtime-release.aar" && -z "$MISSING" ]]; then
  log "复用已有 SDK 原生库: $DEST/SDK"
else
  log "安装 SDK 原生库到 $DEST/SDK"
  rm -rf "$DEST/SDK" "$DEST/plugins"
  mkdir -p "$DEST/SDK" "$DEST/plugins"
  rsync -a "$SDK_ROOT/SDK/" "$DEST/SDK/"
  rsync -a "$SDK_ROOT/plugins/" "$DEST/plugins/"
fi

MISSING="$(missing_aars "$TEMPLATE_DIR/app/build.gradle" "$DEST/SDK/libs")"
[[ -z "$MISSING" ]] || die "SDK 缺少宿主需要的 AAR: $(printf '%s ' $MISSING)"

log "安装精简宿主模板: $DEST/xvnativeproject"
mkdir -p "$DEST/xvnativeproject"
rsync -a --delete "$TEMPLATE_DIR/" "$DEST/xvnativeproject/"
chmod +x "$DEST/xvnativeproject/gradlew"

if command -v plutil >/dev/null 2>&1; then
  APPID="$(plutil -extract appid raw "$PROJECT_DIR/manifest.json" 2>/dev/null || true)"
else
  APPID="$(sed -n 's/.*"appid"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PROJECT_DIR/manifest.json" | head -1)"
fi
[[ -n "$APPID" ]] || die "无法从 manifest.json 读取 appid"
case "$APPID" in
  __UNI__*) ;;
  *) die "appid 格式异常: $APPID" ;;
esac

mkdir -p "$DEST/xvnativeproject/uniappx/src/main/assets/apps/$APPID/www"

ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
if [[ -d "$ANDROID_SDK" ]]; then
  printf 'sdk.dir=%s\n' "$ANDROID_SDK" > "$DEST/xvnativeproject/local.properties"
else
  warn "未找到 Android SDK: $ANDROID_SDK；设置 ANDROID_HOME 后重新运行本脚本"
fi

{
  printf 'sdk_version=%s\n' "$SDK_VERSION"
  printf 'installed_at=%s\n' "$(date '+%Y-%m-%d %H:%M:%S %z')"
  printf 'appid=%s\n' "$APPID"
  printf 'source=%s\n' "$SDK_SOURCE"
} > "$DEST/.native-host-info"

log "宿主初始化完成: $DEST"
printf '    SDK 版本: %s\n' "$SDK_VERSION"
printf '    Android SDK: %s\n' "$ANDROID_SDK"
printf '    占用空间: %s\n' "$(du -sh "$DEST" | awk '{print $1}')"
printf '    下一步: scripts/build-android.sh\n'
