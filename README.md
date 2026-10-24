# 欢乐游戏（game-app）

给 4–9 岁小朋友的原生小游戏大厅。使用 **uni-app x（Vapor 模式）+ Canvas 2D** 实现，首页为「欢乐游戏」大厅，当前收录 7 款游戏，后续可以继续增加小游戏。当前目标平台为 **Android App**。

| 游戏 | 一句话玩法 | 关卡 | 年龄 |
| --- | --- | --- | --- |
| 小兔子的彩虹果园 | 左右拖动小兔子，接住掉落的彩虹水果 | 20 关 / 5 章 | 4–7 岁 |
| 泡泡海洋 | 戳破浮上来的泡泡，找出藏着的海洋朋友 | 16 关 / 4 章 | 4–9 岁 |
| 动物翻翻乐 | 一次翻两张卡片，找出一样的小动物 | 16 关 / 4 章 | 4–9 岁 |
| 小小乐队 | 看乐谱，按顺序敲响六种乐器 | 16 关 / 4 章 | 4–9 岁 |
| 积木拼图 | 左右移动、旋转积木，铺满一整行 | 16 关 / 4 章 | 4–9 岁 |
| 坦克打气球 | 开小坦克左右移动，开炮打中彩色气球 | 16 关 / 4 章 | 4–9 岁 |
| 连线小方块 | 找两个一样的方块，用不超过两个弯的路线连起来 | 16 关 / 4 章 | 4–9 岁 |

## 项目亮点

- **游戏大厅**：品牌首页统一收纳七款小游戏，卡片带封面、玩法标签与年龄；新增游戏只需增加路由、引擎与大厅卡片。
- **共用游戏外壳**：六款新游戏共用 `game/engine.js` 的 `BaseGame`，状态机、开始页、关卡地图、暂停、庆祝、存档、音频全部复用，新游戏只写玩法与场景。
- **关卡与章节**：果园 5 章 20 关，每章独立配色与装饰；新游戏各 4 章 16 关，难度沿「数量 → 速度 → 新元素」平滑上升。
- **对儿童友好**：没有生命值、不会失败、没有广告、没有内购，可完全离线游玩。
- **正向反馈**：连击音效、粒子/礼花、过关动画、伙伴出场、普通话语音鼓励、关卡地图解锁。
- **原生性能**：单 Canvas + `requestAnimationFrame`，无第三方运行时依赖；每个游戏页独立 Canvas、独立音频上下文。

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 框架 | uni-app x，Vue 3 `createSSRApp`，Vapor 渲染模式 |
| 渲染 | 大厅使用 UVue 原生组件；游戏使用 Canvas 2D（`uni.createCanvasContextAsync`） |
| 语言 | 页面 `<script setup lang="ts">`；游戏引擎为原生 ES Module JS |
| 构建 | HBuilderX 5.26 + `scripts/build-android.sh` 本地一键打包，无 npm 依赖、无 lockfile |
| 目标平台 | App（Android 优先，`arm64-v8a` / `x86_64`），竖屏锁定 |

## 目录结构

```
game-app/
├── AGENTS.md              # Agent 与开发者协作规范（先读这个）
├── App.uvue               # 应用入口，onLaunch
├── main.ts                # createSSRApp 入口
├── manifest.json          # 应用配置：appid、图标、Vapor、ABI
├── pages.json             # 页面路由，竖屏 + 自定义导航
├── index.html             # Web 入口模板（当前仅 App 端验证）
├── pages/index/index.uvue # 游戏大厅：品牌头部、七张游戏卡片
├── pages/game/game.uvue   # 果园页：创建 Canvas、转发触摸与生命周期
├── pages/bubble/bubble.uvue   # 泡泡海洋页
├── pages/memory/memory.uvue   # 动物翻翻乐页
├── pages/band/band.uvue       # 小小乐队页
├── pages/blocks/blocks.uvue   # 积木拼图页
├── pages/tank/tank.uvue       # 坦克打气球页
├── pages/lines/lines.uvue     # 连线小方块页
├── game/engine.js         # BaseGame 通用外壳：状态机、HUD、弹层、音频、存档
├── game/orchard.js        # 果园引擎（独立实现，~3.1k 行）
├── game/bubble.js         # 泡泡海洋玩法与场景
├── game/memory.js         # 动物翻翻乐玩法与场景
├── game/band.js           # 小小乐队玩法与场景
├── game/blocks.js         # 积木拼图玩法与场景
├── game/tank.js           # 坦克打气球玩法与场景
├── game/lines.js          # 连线小方块玩法与场景
├── static/img/            # 小兔子、水果、伙伴、主持伙伴、海洋朋友、动物、乐器、封面
├── static/audio/          # 果园音频；bubble/、memory/、band/、blocks/、tank/、lines/ 各自 BGM、音效与语音
├── package/logo/          # 应用图标（72/96/144/192/512）
├── docs/                  # 设计、架构、视觉、资源、构建、多游戏指南（入口 docs/README.md）
├── scripts/               # 本地一键打包、宿主初始化脚本与精简宿主模板
├── build/                 # 打包产物 APK（不提交）
├── unpackage/             # HBuilderX 构建缓存与产物（不提交）
├── .gitattributes         # 文本/二进制文件属性
├── .gitignore             # 忽略缓存、产物、证书、日志与本机文件
└── LICENSE                # MIT 许可证
```

## 快速开始

1. 用 HBuilderX 打开本仓库根目录（包含 `manifest.json` 的目录，克隆后通常为 `game-app`）。
2. 连接 Android 手机（开启 USB 调试）或启动模拟器。
3. 运行 → 运行到手机或模拟器 → Android。`launch.json` 已配置 `uni-app:app-android` 标准运行。

应用启动后进入「欢乐游戏」大厅，点击任意卡片进入对应游戏。果园显示「果园正在醒来…」、泡泡显示「海水正在变蓝…」、翻翻乐显示「小动物们正在躲猫猫…」、乐队显示「乐器正在调音…」、积木显示「积木正在排队…」、坦克显示「小坦克正在加油…」、连线显示「小方块正在排队…」，图片加载完成后进入开始界面。真机调试时，果园实例挂在 `window.__orchardGame`，新游戏实例挂在 `window.__kidsGame`（`window.__kidsGameType` 标识当前游戏），详见 [docs/02-架构与渲染管线.md](docs/02-架构与渲染管线.md)。

## 本地打包

以下命令均在仓库根目录执行。首次在机器上打包，先初始化宿主缓存（需要官方 Vapor 5.26 离线 SDK）：

```bash
scripts/setup-native-host.sh --sdk ~/Downloads/Android-uni-app-x-vapor-SDK@101163-5.26.zip
```

之后每次发版只需：

```bash
scripts/build-android.sh
```

脚本会自动生成发行资源、同步到精简宿主、Gradle 打包并用正式证书签名，产物为 `build/huanle-games-<versionName>.apk`。环境要求、参数、签名与故障排查见 [docs/05-构建与发布.md](docs/05-构建与发布.md)。

## 配置与数据

- 应用名称、appid、版本号、图标、ABI 均在 `manifest.json`；页面路由与竖屏在 `pages.json`。
- 本地存档使用 `uni.setStorageSync`，共九个键：
  - `bunny-native-progress-v1` — 果园 `{ unlocked, completed }`
  - `bunny-native-friends-v1` — 果园已解锁伙伴 id 数组
  - `bunny-native-muted-v1` — 静音布尔值（七款游戏共用）
  - `kids-bubble-progress-v1` — 泡泡 `{ unlocked, completed, best }`
  - `kids-memory-progress-v1` — 翻翻乐 `{ unlocked, completed, best }`
  - `kids-band-progress-v1` — 乐队 `{ unlocked, completed, best }`
  - `kids-blocks-progress-v1` — 积木 `{ unlocked, completed, best }`
  - `kids-tank-progress-v1` — 坦克 `{ unlocked, completed, best }`
  - `kids-lines-progress-v1` — 连线 `{ unlocked, completed, best }`
- 修改存档结构时必须递增键名后缀或做兼容读取，详见 [docs/02-架构与渲染管线.md](docs/02-架构与渲染管线.md)。

## 文档

| 文档 | 内容 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 工作原则、目录职责、不可破坏约定、编码规范、自测清单 |
| [docs/README.md](docs/README.md) | 文档索引、命名规范、改动 → 文档对照表 |
| [docs/01-游戏设计与关卡.md](docs/01-游戏设计与关卡.md) | 7 款游戏的核心循环、机制、关卡数据、计分与解锁 |
| [docs/02-架构与渲染管线.md](docs/02-架构与渲染管线.md) | 页面/引擎边界、BaseGame、状态机、帧循环、音频、存档、调试 |
| [docs/03-视觉与交互规范.md](docs/03-视觉与交互规范.md) | 色彩、大厅样式、排版、组件样式、主题、动效时长、儿童可用性 |
| [docs/04-资源与音频清单.md](docs/04-资源与音频清单.md) | 图片/封面/音频/语音清单与命名规则 |
| [docs/05-构建与发布.md](docs/05-构建与发布.md) | 本地一键打包、宿主初始化、签名、版本号、产物与提交纪律 |
| [docs/06-多游戏架构与新增游戏指南.md](docs/06-多游戏架构与新增游戏指南.md) | 游戏清单、BaseGame 配置与钩子、新增游戏步骤 |

## 相关项目

本仓库只包含欢乐游戏（uni-app x）；原 Web 版原型不在本仓库内。

## 许可证

[MIT](LICENSE)
