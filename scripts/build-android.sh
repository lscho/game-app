#!/usr/bin/env bash
# 一键生成已签名的 Android APK。
# 流程：HBuilderX 生成发行资源 -> 同步到精简宿主 -> Gradle assembleRelease -> apksigner 签名与校验。
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$PROJECT_DIR/manifest.json"

DEFAULT_CACHE="${NATIVE_HOST_CACHE:-$HOME/Library/Application Support/GameApp/uni-app-x-vapor-5.26}"
DEFAULT_HOST="$DEFAULT_CACHE/xvnativeproject"
HOST="${NATIVE_HOST:-$DEFAULT_HOST}"
HOST_EXPLICIT=0

HBX_CLI="${HBX_CLI:-/Applications/HBuilderX.app/Contents/MacOS/cli}"
ANDROID_SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
KEYSTORE_FILE="${KEYSTORE_FILE:-$PROJECT_DIR/build/signing/bunny-orchard-release.jks}"
KEYSTORE_ALIAS="${KEYSTORE_ALIAS:-bunnyorchard}"
KEYSTORE_PASSWORD_FILE="${KEYSTORE_PASSWORD_FILE:-$PROJECT_DIR/build/signing/storepass.txt}"
KEY_PASSWORD_FILE="${KEY_PASSWORD_FILE:-}"

SKIP_COMPILE=0
CLEAN=0
OUTPUT=""

usage() {
  cat <<'EOF'
用法: scripts/build-android.sh [选项]

一键编译、打包并签名 Android APK。版本号从 manifest.json 读取。
HBuilderX 未打开时会自动执行 cli open --project 并重试。

选项:
  --skip-compile     跳过 HBuilderX 编译，使用 unpackage/resources 中已有资源
  --clean            打包前清理 Gradle 构建缓存
  --host <目录>      指定本地宿主目录（默认使用应用支持目录中的缓存）
  --out <文件>       指定输出 APK 路径
  -h, --help         显示帮助

可覆盖的环境变量:
  HBX_CLI                    HBuilderX cli 路径
  ANDROID_HOME               Android SDK 路径
  JAVA_HOME                  优先使用的 JDK（建议 21+；17 由 Gradle daemon 补 25）
  NATIVE_HOST                宿主目录
  NATIVE_HOST_CACHE          宿主缓存根目录
  KEYSTORE_FILE              签名证书
  KEYSTORE_ALIAS             证书别名
  KEYSTORE_PASSWORD_FILE     证书库密码文件（单行）
  KEY_PASSWORD_FILE          私钥密码文件（可选；默认与证书库密码相同）

示例:
  scripts/build-android.sh
  scripts/build-android.sh --clean
  scripts/build-android.sh --skip-compile --out build/test.apk
EOF
}

log() { printf '==> %s\n' "$*" | tee -a "${LOG:-/dev/null}"; }
warn() { printf '警告: %s\n' "$*" | tee -a "${LOG:-/dev/null}" >&2; }
die() { printf '错误: %s\n' "$*" | tee -a "${LOG:-/dev/null}" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-compile)
      SKIP_COMPILE=1
      shift
      ;;
    --clean)
      CLEAN=1
      shift
      ;;
    --host)
      [[ $# -ge 2 ]] || die "--host 需要一个目录路径"
      HOST="$2"
      HOST_EXPLICIT=1
      shift 2
      ;;
    --out)
      [[ $# -ge 2 ]] || die "--out 需要一个文件路径"
      OUTPUT="$2"
      shift 2
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

read_json() {
  local file="$1" key="$2"
  if command -v plutil >/dev/null 2>&1; then
    plutil -extract "$key" raw "$file" 2>/dev/null
    return
  fi
  sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" "$file" | head -1
}

resolve_java_home() {
  local candidate major min candidates=()
  [[ -n "${JAVA_HOME:-}" ]] && candidates+=("$JAVA_HOME")
  if [[ -d "$HOME/.gradle/jdks" ]]; then
    while IFS= read -r candidate; do
      candidates+=("$candidate")
    done < <(find "$HOME/.gradle/jdks" -type f -path '*/bin/java' 2>/dev/null | sed 's#/bin/java$##' | sort -r)
  fi
  candidates+=("/Applications/HBuilderX.app/Contents/HBuilderX/plugins/amazon-corretto")
  if command -v java >/dev/null 2>&1; then
    candidates+=("$(cd "$(dirname "$(command -v java)")/.." && pwd)")
  fi

  for min in 21 17; do
    for candidate in "${candidates[@]}"; do
      [[ -x "$candidate/bin/java" ]] || continue
      major="$("$candidate/bin/java" -version 2>&1 | awk -F'"' '/version/ {print $2}' | cut -d. -f1)"
      [[ "$major" =~ ^[0-9]+$ ]] || continue
      if [[ "$major" == "1" ]]; then
        major="$("$candidate/bin/java" -version 2>&1 | awk -F'"' '/version/ {print $2}' | cut -d. -f2)"
      fi
      if (( major >= min )); then
        printf '%s\n' "$candidate"
        return 0
      fi
    done
  done
  return 1
}

latest_build_tools() {
  ls -1d "$ANDROID_SDK"/build-tools/*/ 2>/dev/null | sed 's#/$##' | sort -t. -k1,1n -k2,2n -k3,3n | tail -1
}

run_logged() {
  local status
  set +e
  "$@" 2>&1 | tee -a "$LOG"
  status=${PIPESTATUS[0]}
  set -e
  return "$status"
}

compile_resources() {
  local attempt output status marker
  marker="$LOG_DIR/.compile-start-$$"
  : > "$marker"

  for attempt in 1 2 3 4 5; do
    output="$LOG_DIR/publish-$(date '+%Y%m%d-%H%M%S')-$attempt.log"
    log "HBuilderX 编译（第 $attempt 次）..."
    set +e
    "$HBX_CLI" publish app-android --type appResource --project "$PROJECT_DIR" 2>&1 |
      tr '\r' '\n' | tee -a "$LOG" "$output"
    status=${PIPESTATUS[0]}
    set -e

    if [[ "$status" -eq 0 ]] && grep -q '编译成功' "$output" && grep -q '导出 android 成功' "$output"; then
      if ! find "$RES_WWW" -type f -newer "$marker" -print -quit | grep -q .; then
        warn "发行资源文件时间未更新，请检查 HBuilderX 输出: $output"
      fi
      return 0
    fi

    if grep -q '未检测到已打开的HBuilderX' "$output"; then
      log "HBuilderX 未就绪，正在启动并打开项目..."
      "$HBX_CLI" open --project "$PROJECT_DIR" >/dev/null 2>&1 || true
      sleep 3
      continue
    fi

    die "HBuilderX 编译失败（第 $attempt 次），输出: $output"
  done

  die "HBuilderX 启动后仍未就绪，请手动打开 HBuilderX 后重试；最近输出: $output"
}

[[ -f "$MANIFEST" ]] || die "找不到 manifest.json: $MANIFEST"
command -v rsync >/dev/null 2>&1 || die "缺少 rsync"

APPID="$(read_json "$MANIFEST" appid || true)"
APP_NAME="$(read_json "$MANIFEST" name || true)"
VERSION_NAME="$(read_json "$MANIFEST" versionName || true)"
VERSION_CODE="$(read_json "$MANIFEST" versionCode || true)"
[[ -n "$APPID" && -n "$APP_NAME" && -n "$VERSION_NAME" && -n "$VERSION_CODE" ]] ||
  die "manifest.json 缺少 appid/name/versionName/versionCode"
[[ "$VERSION_CODE" =~ ^[0-9]+$ ]] || die "versionCode 必须是整数: $VERSION_CODE"
[[ "$APPID" == __UNI__* ]] || die "appid 格式异常: $APPID"

if [[ ! -f "$HOST/app/build.gradle" || ! -f "$HOST/../SDK/libs/app-runtime-release.aar" ]]; then
  if [[ "$HOST_EXPLICIT" -eq 1 ]]; then
    die "指定的宿主不完整: $HOST（需要 app/build.gradle 与 ../SDK/libs）"
  fi
  log "本地宿主缓存不存在，先初始化..."
  "$SCRIPT_DIR/setup-native-host.sh"
fi

[[ -f "$HOST/app/build.gradle" ]] || die "宿主不存在: $HOST"
[[ -f "$HOST/../SDK/libs/app-runtime-release.aar" ]] || die "宿主缺少 SDK 原生库: $HOST/../SDK"
[[ -f "$HOST/uniappx/src/main/AndroidManifest.xml" ]] || die "宿主缺少 uniappx 清单"

HOST_APPID="$(sed -n 's/.*android:value="\(__UNI__[^"]*\)".*/\1/p' "$HOST/uniappx/src/main/AndroidManifest.xml" | head -1)"
[[ "$HOST_APPID" == "$APPID" ]] ||
  die "appid 不一致：manifest.json=$APPID，宿主=$HOST_APPID。appid 属于不可修改项。"

if [[ -z "${ANDROID_HOME:-}" && -d "$ANDROID_SDK" ]]; then
  export ANDROID_HOME="$ANDROID_SDK"
fi
export ANDROID_SDK_ROOT="$ANDROID_SDK"
[[ -d "$ANDROID_SDK" ]] || die "找不到 Android SDK: $ANDROID_SDK（设置 ANDROID_HOME）"
BUILD_TOOLS="$(latest_build_tools)"
[[ -n "$BUILD_TOOLS" ]] || die "Android SDK 中没有 build-tools: $ANDROID_SDK/build-tools"
APKSIGNER="$BUILD_TOOLS/apksigner"
AAPT="$BUILD_TOOLS/aapt"
ZIPALIGN="$BUILD_TOOLS/zipalign"
[[ -x "$APKSIGNER" ]] || die "找不到 apksigner: $APKSIGNER"

JAVA_HOME_RESOLVED="$(resolve_java_home || true)"
[[ -n "$JAVA_HOME_RESOLVED" ]] || die "找不到可用的 JDK（建议安装 JDK 21/25，或设置 JAVA_HOME）"
export JAVA_HOME="$JAVA_HOME_RESOLVED"
export PATH="$JAVA_HOME/bin:$PATH"

LOG_DIR="$PROJECT_DIR/build/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/build-$(date '+%Y%m%d-%H%M%S').log"
: > "$LOG"

log "项目: $APP_NAME ($APPID)"
log "版本: $VERSION_NAME ($VERSION_CODE)"
log "JDK: $JAVA_HOME"
log "Android SDK: $ANDROID_SDK"
log "宿主: $HOST"
log "日志: $LOG"

RESOURCE_ROOT="$PROJECT_DIR/unpackage/resources/app-android"
RES_WWW="$RESOURCE_ROOT/$APPID/www"

log "[1/4] 生成发行资源"
if [[ "$SKIP_COMPILE" -eq 0 ]]; then
  [[ -x "$HBX_CLI" ]] || die "找不到 HBuilderX CLI: $HBX_CLI（设置 HBX_CLI）"
  compile_resources
else
  log "跳过 HBuilderX 编译（--skip-compile）"
fi

[[ -s "$RES_WWW/app-service.js" ]] || die "发行资源不存在或为空: $RES_WWW/app-service.js"
[[ -f "$RES_WWW/manifest.json" ]] || die "发行资源缺少 manifest.json"

RES_APPID="$(read_json "$RES_WWW/manifest.json" id || true)"
RES_VERSION_NAME="$(read_json "$RES_WWW/manifest.json" version.name || true)"
RES_VERSION_CODE="$(read_json "$RES_WWW/manifest.json" version.code || true)"
[[ -n "$RES_APPID" ]] || die "无法读取发行资源 appid（manifest.json 的 id 字段）"
[[ "$RES_APPID" == "$APPID" ]] || die "发行资源 appid 不一致: $RES_APPID"
[[ "$RES_VERSION_NAME" == "$VERSION_NAME" && "$RES_VERSION_CODE" == "$VERSION_CODE" ]] ||
  die "发行资源版本与 manifest.json 不一致（资源 $RES_VERSION_NAME/$RES_VERSION_CODE，期望 $VERSION_NAME/$VERSION_CODE）"

MODULES="$(plutil -extract app-android.distribute.modules json -o - "$RES_WWW/manifest.json" 2>/dev/null |
  grep -o '"[^"]*"[[:space:]]*:' | tr -d '": ' | sort -u || true)"
for module in $MODULES; do
  [[ -f "$HOST/../SDK/libs/${module}-release.aar" ]] ||
    warn "资源声明了模块 $module，但宿主 SDK 中没有 ${module}-release.aar；运行时报错时需补依赖"
done
grep -q 'exoplayer-core' "$HOST/app/build.gradle" ||
  warn "宿主缺少 exoplayer-core 依赖，创建音频上下文时可能崩溃"

log "[2/4] 同步资源到宿主"
ASSETS_DIR="$HOST/uniappx/src/main/assets/apps/$APPID/www"
mkdir -p "$ASSETS_DIR"
rsync -a --delete "$RES_WWW/" "$ASSETS_DIR/" || die "同步发行资源失败"

STRINGS_XML="$HOST/app/src/main/res/values/strings.xml"
if [[ -f "$STRINGS_XML" ]]; then
  APP_NAME_ENV="$APP_NAME" perl -0pi -e 's#(<string name="app_name">)[^<]*(</string>)#$1$ENV{APP_NAME_ENV}$2#' "$STRINGS_XML"
fi

log "[3/4] Gradle assembleRelease"
(
  cd "$HOST"
  GRADLE_TASKS=(:app:assembleRelease)
  if [[ "$CLEAN" -eq 1 ]]; then
    GRADLE_TASKS=(clean "${GRADLE_TASKS[@]}")
  fi
  run_logged ./gradlew "${GRADLE_TASKS[@]}" --console=plain \
    -PappVersionCode="$VERSION_CODE" -PappVersionName="$VERSION_NAME"
) || die "Gradle 打包失败，日志: $LOG"

UNSIGNED="$HOST/app/build/outputs/apk/release/app-release-unsigned.apk"
if [[ ! -f "$UNSIGNED" ]]; then
  UNSIGNED="$(find "$HOST/app/build/outputs/apk/release" -maxdepth 1 -type f -name '*.apk' ! -name '*signed*' 2>/dev/null | head -1)"
fi
[[ -f "$UNSIGNED" ]] || die "找不到 Gradle 生成的 APK，日志: $LOG"

log "[4/4] 签名与校验"
[[ -f "$KEYSTORE_FILE" ]] || die "找不到签名证书: $KEYSTORE_FILE"
[[ -f "$KEYSTORE_PASSWORD_FILE" ]] || die "找不到证书密码文件: $KEYSTORE_PASSWORD_FILE"
[[ -n "$KEYSTORE_ALIAS" ]] || die "证书别名不能为空"

OUTPUT="${OUTPUT:-$PROJECT_DIR/build/huanle-games-$VERSION_NAME.apk}"
mkdir -p "$(dirname "$OUTPUT")"
TEMP_OUTPUT="${OUTPUT}.tmp.$$.apk"
trap 'rm -f "$TEMP_OUTPUT"' EXIT

SIGN_ARGS=(sign --ks "$KEYSTORE_FILE" --ks-key-alias "$KEYSTORE_ALIAS"
  --ks-pass "file:$KEYSTORE_PASSWORD_FILE" --out "$TEMP_OUTPUT" "$UNSIGNED")
if [[ -n "$KEY_PASSWORD_FILE" ]]; then
  SIGN_ARGS=(sign --ks "$KEYSTORE_FILE" --ks-key-alias "$KEYSTORE_ALIAS"
    --ks-pass "file:$KEYSTORE_PASSWORD_FILE" --key-pass "file:$KEY_PASSWORD_FILE"
    --out "$TEMP_OUTPUT" "$UNSIGNED")
fi
run_logged "$APKSIGNER" "${SIGN_ARGS[@]}" || die "apksigner 签名失败（证书密码错误或私钥密码与证书库密码不同）"

VERIFY_OUT="$("$APKSIGNER" verify --print-certs "$TEMP_OUTPUT" 2>&1)" || die "APK 签名校验失败"
if [[ -x "$ZIPALIGN" ]]; then
  "$ZIPALIGN" -c 4 "$TEMP_OUTPUT" >/dev/null 2>&1 || warn "APK 未通过 4 字节对齐检查"
fi

AAPT_OUT="$("$AAPT" dump badging "$TEMP_OUTPUT" 2>/dev/null || true)"
[[ -n "$AAPT_OUT" ]] || die "aapt 无法读取 APK"
printf '%s\n' "$AAPT_OUT" | grep -q "versionCode='$VERSION_CODE'" ||
  die "APK 内 versionCode 与 manifest.json 不一致"
printf '%s\n' "$AAPT_OUT" | grep -q "versionName='$VERSION_NAME'" ||
  die "APK 内 versionName 与 manifest.json 不一致"

mv "$TEMP_OUTPUT" "$OUTPUT"
trap - EXIT

SHA256="$(shasum -a 256 "$OUTPUT" | awk '{print $1}')"
SIZE="$(du -h "$OUTPUT" | awk '{print $1}')"
CERT_SHA="$(printf '%s\n' "$VERIFY_OUT" | sed -n 's/.*certificate SHA-256 digest: //p' | head -1)"
PACKAGE_LINE="$(printf '%s\n' "$AAPT_OUT" | grep -m1 '^package:')"
NATIVE_LINE="$(printf '%s\n' "$AAPT_OUT" | grep -m1 '^native-code:')"

printf '\n'
log "打包完成"
printf '    产物: %s\n' "$OUTPUT"
printf '    大小: %s\n' "$SIZE"
printf '    SHA-256: %s\n' "$SHA256"
printf '    证书 SHA-256: %s\n' "$CERT_SHA"
printf '    %s\n' "$PACKAGE_LINE"
[[ -n "$NATIVE_LINE" ]] && printf '    %s\n' "$NATIVE_LINE"
printf '    日志: %s\n' "$LOG"
