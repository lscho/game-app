# AGENTS.md

本文件适用于本仓库根目录及其全部子目录。任何 Agent 或开发者在修改代码前必须先阅读本文；涉及玩法、架构、视觉、资源或构建时，还须阅读 `docs/` 中对应文档（索引见 [`docs/README.md`](docs/README.md)）。

## 1. 工作原则

- 修改前先读相关实现与文档，不凭文件名或需求描述猜测现有行为。玩法数值、视觉规则以代码与 `docs/` 为准。
- 只改完成当前任务所需的代码；不顺带重构、不批量格式化、不覆盖用户未提交的修改。
- 优先沿用现有结构和函数（`clamp`、`rand`、`fillRound`、`drawLabel` 等）。新增依赖、全局状态或抽象层前，先确认现有能力无法满足。
- 本项目**没有 npm 依赖**，不引入第三方库，不生成 lockfile。日常运行交给 HBuilderX；本地 Android 打包统一使用 `scripts/build-android.sh`（宿主模板在 `scripts/native-host/`），不新增其他构建脚本。
- 不提交密钥、签名文件、APK、`unpackage/` 或本机绝对路径。
- 面向 4–9 岁儿童：任何改动都不得引入失败态、倒计时压力、广告、内购、外链或需要阅读大段文字才能继续的流程。果园面向 4–7 岁，新游戏面向更宽的 4–9 岁，但同样遵守该底线。

## 2. 项目边界

- 本仓库是独立的 uni-app x 应用，只修改本仓库内的文件。
- 游戏大厅与游戏均在本目录内；原 Web 版原型已移出项目，不再维护或参与构建。
- 当前平台为 **Android App**，`pages.json` 锁定竖屏（`pageOrientation: portrait`）。新增功能若只适用于 H5 或小程序，必须先确认目标平台，不得默认「三端通用」。
- `index.html` 是 uni-app x 的 Web 入口模板，但 Canvas 初始化使用 App 端 `uni.createCanvasContextAsync`，Web 端未经适配与验证。

## 3. 技术栈与目录职责

| 路径 | 职责 | 约定 |
| --- | --- | --- |
| `pages/index/index.uvue` | 游戏大厅：品牌头部、四张游戏卡片 | 大厅只做导航与展示，不写玩法逻辑 |
| `pages/game/game.uvue` | 果园页：创建 Canvas、计算 DPR/安全区、转发触摸与页面生命周期 | 只做胶水代码，不写玩法逻辑 |
| `pages/bubble/bubble.uvue`、`pages/memory/memory.uvue`、`pages/band/band.uvue` | 三款新游戏的页面胶水 | 与果园页一致；Canvas id 分别为 `game-bubble`、`game-memory`、`game-band` |
| `game/engine.js` | 三款新游戏共用的 `BaseGame`、工具函数、`NativeAudio`、存档 | 通用能力只放这里；不写某一款游戏的玩法 |
| `game/orchard.js` | 果园的全部玩法、状态机、绘制、音频、存档 | 单一 `OrchardGame` 类 + 常量表；不引用页面生命周期 |
| `game/bubble.js`、`game/memory.js`、`game/band.js` | 各自玩法、场景与 HUD 扩展 | 继承 `BaseGame`，只覆盖钩子，不重写 `update()`/`draw()` |
| `App.uvue` / `main.ts` | 应用入口 | 保持最小 |
| `manifest.json` | appid、图标、Vapor 配置、ABI | 不改 appid、不改签名相关字段 |
| `pages.json` | 路由与页面样式 | 大厅为首页、四个游戏页为二级页；全部竖屏 |
| `static/img/` | 游戏与大厅图片资源 | 果园图片注册到 `loadImages()`；新游戏注册到各自 `CONFIG.assets`；大厅品牌图与封面不注册 |
| `static/audio/` | BGM、音效、语音 | 果园在根目录；新游戏在 `bubble/`、`memory/`、`band/`；命名规则见 `docs/04-资源与音频清单.md` |
| `package/logo/` | 应用图标 | 与 `manifest.json` 中的尺寸映射保持一致 |
| `docs/` | 项目规范与设计文档 | 除 `README.md`（项目介绍）与本文外，新文档一律放这里 |
| `scripts/` | 本地打包脚本与精简宿主模板 | 只维护 `build-android.sh`、`setup-native-host.sh` 与 `native-host/`；不写入证书、密码或本机路径 |
| `build/`、`unpackage/` | 打包产物与缓存 | 不提交、不手工编辑 |

`game/orchard.js` 与 `game/engine.js` 可以直接调用 `uni.*`（存储、音频），但**不得**执行 `onReady`/`onHide` 等页面生命周期钩子；生命周期由 `.uvue` 页面接收后显式调用游戏实例方法。

## 4. 不可破坏的领域约定

- **关卡总数与地图网格绑定**：果园 `MAX_LEVEL = 20`，固定 5 章 × 4 关；新游戏各 `MAX_LEVEL = 16`，固定 4 章 × 4 关。新增/删除关卡时，必须同时修改对应引擎的 `LEVELS`（`MAX_LEVEL` 由数组长度推导）、地图行数（`BaseGame` 按 `levelsPerChapter` 计算）以及 `docs/01-游戏设计与关卡.md`。
- **状态机只有两个维度**：`state` ∈ `loading | start | levelselect | playing | paused | celebrating`；`gameMode` ∈ `idle | ready | roundclear | celebrated`。四款游戏共享同一状态机，新增界面先判断能否复用现有状态，不要平行再造一套标志位。
- **没有失败态**：失误只清空连击、播放提示，不扣进度、不结束关卡。不得添加生命值、倒计时或 Game Over。
- **存档键带版本后缀**：果园 `bunny-native-progress-v1`、`bunny-native-friends-v1`；新游戏 `kids-bubble-progress-v1`、`kids-memory-progress-v1`、`kids-band-progress-v1`；静音 `bunny-native-muted-v1` 四款共用。改变数据结构时必须递增后缀或保留兼容读取，并在 `docs/02-架构与渲染管线.md` 更新说明。
- **进度只增不减**：`progress` 写入后立即 `min(goal, progress)`；过关时 `maxUnlocked = max(当前, 关卡+1)`。不要实现「重置进度」以外的降级逻辑。
- **音频上下文单例**：每款游戏的 BGM、音效、语音各自由该游戏的 `NativeAudio` 统一持有；语音只有一路，新语音前必须 `stopVoice()`。禁止在游戏逻辑中直接 `uni.createInnerAudioContext()`。四个游戏页各自销毁自己的音频，不复用上下文。
- **坐标体系**：所有布局以 CSS 像素为单位，Canvas 在页面上按 `dpr`（上限 3）缩放；绘制代码不得自行乘 `dpr`，也不得读取 DOM 尺寸。
- **图片 key 即对象 id**：果园用 `this.images[fruit.key]`、`this.images[friend.id]`；新游戏用 `CONFIG.assets` 的 key（如 `fish`、`cat`、`drum`、`host`）。新增图片必须同时提供 PNG、配置条目，并保留加载失败的回退（果园为 `FRUITS[key].colors`，新游戏为色块/问号）。
- **大厅入口数据驱动**：`pages/index/index.uvue` 的 `games` 数组决定首页游戏入口；新增游戏时先加路由，再加数组项，现有游戏入口不得删除或改路由。
- **每帧重建按钮**：`update()` 清空 `this.buttons`，绘制函数在屏幕上「画出」并注册命中区域，绘制顺序即层级。不要维护跨帧的按钮列表。
- **确定性装饰**：场景装饰由 `mulberry32(level * 7919 + 41)` 生成，同一关每次进入布局一致。不要改用 `Math.random()` 生成装饰。
- **静态层画在背景画布**：果园页有两张 Canvas，`game-bg` 只放山、树、地面、草花等静态场景，由 `buildDecor()` 置 `bgDirty`、`refreshBackground()` 在切关后重绘一次；`game` 每帧只画会动的内容与所有弹层。新增依赖关卡/主题的静态元素必须走这条路径，并保留背景画布不可用时退回单画布 + Path2D 缓存的分支。详见 `docs/02-架构与渲染管线.md` §4.3。

## 5. 编码规范

- 使用 2 空格缩进、单引号、**不写行尾分号**、尾随逗号（与仓库根 `.prettierrc` 及现有代码一致）。不要为无关代码做全文件格式化。
- `game/orchard.js` 保持原生 ES Module JS：顶部常量表（`RAINBOW`、`FRUITS`、`FRUIT_LABELS`、`COLLECT_KEYS`、`CHAPTERS`、`MECHANIC_LABELS`、`FRIENDS`、`THEMES`、`LEVELS`）→ 纯工具函数 → `NativeAudio` → `OrchardGame`。
- `game/engine.js` 结构固定为：工具函数与色板 → `NativeAudio` → `BaseGame`；不引入对具体游戏的引用。
- `game/bubble.js`、`memory.js`、`band.js` 结构固定为：顶部 `LEVELS` 与 `CONFIG`（含 `assets`、`sfx`、`audioPath`、`storageKey`）→ 继承 `BaseGame` 的类；只覆盖钩子，不在子类里复制基类的流程代码。
- 常量表只放数据，不放逻辑；新增关卡参数优先复用已有字段（`speed`、`spawn`、`maxFruits`、`hazardChance`、`targetKeys`、`orderLength`、`comboWindow`、`starRate` 等），字段含义见 `docs/01-游戏设计与关卡.md`。
- 绘制函数命名统一为 `drawXxx`，更新函数为 `updateXxx`，交互入口为 `touchStart/touchMove/touchEnd` 与 `activate(id)`。
- Canvas 状态必须成对 `save()`/`restore()`；修改 `globalAlpha`、`fillStyle`、`textAlign` 后若不恢复，会影响后续绘制。每帧开头已 `clearRect`，不要依赖上一帧画布内容。
- 每个动画帧都在 `try/catch` 中执行，单帧异常只记录日志、不中断循环。不要吞掉异常后继续使用半初始化状态。
- `pages/index/index.uvue` 与四个游戏页均使用 `// @ts-nocheck`，因为引擎是无类型 JS。不要移除该注释而不补齐类型；新增页面代码仍按 TS 语义书写。
- 注释只解释非显然的约束、数值来源或兼容处理，不复述代码。
- 用户可见文案使用简体中文，并符合 4–9 岁理解水平（短句、正向鼓励、不用负面措辞）。

## 6. 常见改动指引

| 改动 | 需要同步修改 |
| --- | --- |
| 新增/调整果园关卡 | `LEVELS` + `MAX_LEVEL` + 地图网格 + `docs/01-游戏设计与关卡.md` |
| 新增果园玩法机制 | `MECHANIC_LABELS`、`chooseFruitKey()`、`collectFruit()` 判定、对应 `drawXxxObjective()`、`docs/01` |
| 新增水果/伙伴 | `FRUITS`/`FRUIT_LABELS`/`FRIENDS`、`loadImages()`、`static/img`、`docs/04-资源与音频清单.md` |
| 调整新游戏关卡 | 对应 `LEVELS`、`CONFIG.chapters`、`docs/01` 第 10–12 节 |
| 新增小游戏 | 新建 `game/<id>.js`（继承 `BaseGame`）+ `pages/<id>/<id>.uvue` + `pages.json` 路由 + 大厅 `games` 项 + 资源与语音 + `docs/01/02/03/04/06` 与根 README、本文 |
| 改 BaseGame 通用行为 | `game/engine.js`、三款新游戏的回归、`docs/02` 与 `docs/06` |
| 新增音效/语音 | 果园改 `NativeAudio.ensure()`/`queueVoice()`；新游戏改 `CONFIG.sfx` 或语音固定五件套；同步 `static/audio` 与 `docs/04` |
| 调整配色/主题 | 果园 `THEMES`/`RAINBOW`；新游戏 `drawWorld()` 的 chapter 分支、`COLORS`/`CARD_COLORS`/`INSTRUMENTS`；`docs/03` |
| 改存档结构 | 递增存储键版本、对应读取函数兼容、`docs/02` |
| 改布局公式 | 果园 `layout()`；新游戏 `BaseGame.layout()` 与子类 `cardLayout()`/`buildPads()`；`docs/02` |
| 改构建配置/版本 | `manifest.json` + `package.json` + `docs/05-构建与发布.md`；脚本会自动读取版本并同步宿主 |

新增文档统一放在 `docs/`，命名为 `NN-中文标题.md`，并在 `docs/README.md` 的索引表中登记。根目录的项目文档只保留 `README.md`（项目介绍）与 `AGENTS.md`；`LICENSE`、`.gitignore`、`.gitattributes` 等仓库元数据除外。

## 7. 自测清单

本项目没有自动化测试，所有改动必须在 HBuilderX 中运行到 Android 真机或模拟器后手动验证：

- **冷启动**：加载动画 → 开始界面；断网/缺图时能进入并显示圆形回退色块。
- **大厅**：冷启动进入大厅，四张卡片封面比例正确、可滚动；点击任意卡片进入对应游戏；在游戏开始页按系统返回键回到大厅；再次进入时大厅与存档正常。
- **新档流程**：清空应用数据后从第 1 关开始，新手提示「左右拖动，接住水果」出现并在首次拖动后消失。
- **续档流程**：杀掉进程重进，开始按钮显示「继续第 N 关」，关卡地图解锁状态正确；三款新游戏同样验证。
- **每种机制**至少通关一关：采摘(1)、目标(3)、顺序(5)、连击(7)、躲蜂(9)、星星(13)、收集(15)。确认接错有提示、不扣进度。
- **过关**：彩虹揭晓动画 → 庆祝弹窗 →「继续探险」进入下一关；第 20 关显示「果园大丰收」并解锁全部伙伴。
- **泡泡海洋**：戳普通泡泡 +1、闪亮 +2；戳带刺泡泡只提示；朋友泡泡显示头像并计入伙伴栏；第 1、10、16 关各通关一次。
- **动物翻翻乐**：开场预览 1.6 秒；翻错自动翻回且不扣任何东西；配对成功有粒子与飘字；第 1、9、16 关各通关一次。
- **小小乐队**：敲对推进乐谱、敲错提示「先敲 X」；第 6 关起有节拍点；完成乐谱后有独奏回放；第 1、9、16 关各通关一次。
- **新游戏终章**：三款新游戏第 16 关均显示终章文案、播放 `final` 语音，并可用「再玩一次」重开。
- **暂停/恢复**：暂停按钮、Android 物理返回键、切后台均能正确暂停；恢复后 BGM/语音不重叠。
- **静音**：开始页、暂停页、HUD 三处图标状态一致，重启后保持；在四款游戏之间切换后状态仍一致。
- **关卡地图**：已通关显示勾选、当前关显示 NEW、未解锁显示锁；点击锁定关卡只弹提示不进入。
- **布局**：至少在一台刘海屏与一台 16:9 屏验证 HUD、按钮、庆祝卡片不重叠、不被安全区遮挡；翻翻乐卡片与乐队按键不越界。
- **性能**：连续游玩 5 分钟无掉帧、无内存增长；销毁页面后动画帧与音频全部释放（从大厅反复进出四款游戏各 5 次）。

调试时可用 `window.__orchardGame` 的 `debugCatchOne()`、`debugFinishLevel()`、`debugState()` 等方法快速推进；三款新游戏用 `window.__kidsGame` 的 `debugState()` 及各自的 `debugPopAll()` / `debugMatchAll()` / `debugFinishLevel()`，详见 `docs/02-架构与渲染管线.md`。

## 8. 禁止事项

- 不修改 `manifest.json` 的 `appid`、不改打包签名、不改 `pageOrientation`。
- 不新增 npm 依赖、CI 配置或测试框架；打包脚本只维护 `scripts/` 下现有的两个脚本，不添加并行的打包入口。
- 不在游戏代码中使用 `document`、DOM API 或页面生命周期；`window.__orchardGame` 与 `window.__kidsGame` 仅作为调试挂钩，且必须保留 `typeof window !== 'undefined'` 判断。
- 不把 APK、`unpackage/`、`build/`、日志、证书或本机路径提交到仓库。仓库根 `.gitignore` 已忽略这些内容；新增构建目录时同步补充规则。
- 不删除或弱化「无失败、无广告、离线可玩」的产品承诺。
- 不为单款游戏修改其他游戏的存档键或进度数据；四款游戏的进度互相独立，只有静音状态共享。
