// 三款小游戏共用的引擎壳：状态机、帧循环、按钮、音频、选关、庆祝。
// 具体玩法由 bubble.js / memory.js / band.js 继承 BaseGame 实现，
// 约定见 docs/06-新增游戏模块规范.md。

// 与果园共用同一份静音状态，保证大厅里四款游戏的静音互相同步。
const STORAGE_MUTED = 'bunny-native-muted-v1'
export const CHAPTER_COLORS = ['#D58A12', '#279C86', '#D96F4B', '#6674C9', '#338FC4']
const CHAPTER_TINTS = ['#FFF0C4', '#DDF7EF', '#FFE4D7', '#E7E9FF', '#DFF2FF']
export const RAINBOW = ['#FF6B6B', '#FFA94D', '#FFD93D', '#7BD88F', '#5CC8FF', '#B08CFF']

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const rand = (min, max) => min + Math.random() * (max - min)
export const lerp = (from, to, t) => from + (to - from) * t

export function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

export function fillRound(ctx, x, y, width, height, radius, color) {
  roundedPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = color
  ctx.fill()
}

export function strokeRound(ctx, x, y, width, height, radius, color, lineWidth) {
  roundedPath(ctx, x, y, width, height, radius)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

export function setFont(ctx, size, weight) {
  ctx.font = `${weight || 700} ${Math.round(size)}px sans-serif`
}

export function drawLabel(ctx, text, x, y, size, color, weight, align) {
  setFont(ctx, size, weight)
  ctx.fillStyle = color
  ctx.textAlign = align || 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

export function wrapLines(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (let i = 0; i < text.length; i += 1) {
    const next = line + text[i]
    if (ctx.measureText(next).width > maxWidth && line.length) {
      lines.push(line)
      line = text[i]
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export function drawSparkle(ctx, x, y, size, color) {
  ctx.save()
  ctx.fillStyle = color
  ctx.translate(x, y)
  ctx.beginPath()
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 === 0 ? size : size * 0.36
    const angle = (Math.PI * i) / 4 - Math.PI / 2
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function mulberry32(seed) {
  let state = seed >>> 0
  return function random() {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function readBoolean(key, fallback) {
  try {
    const value = uni.getStorageSync(key)
    if (value === '' || value === undefined || value === null) return fallback
    return value === true || value === 'true' || value === 1 || value === '1'
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    uni.setStorageSync(key, value)
  } catch (error) {
    // 存档是可选的，失败不阻断游戏。
  }
}

function readProgress(key, maxLevel) {
  try {
    const raw = uni.getStorageSync(key)
    if (!raw) return { unlocked: 1, completed: [], best: {} }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const unlocked = clamp(Number(parsed && parsed.unlocked) || 1, 1, maxLevel)
    const completed = Array.isArray(parsed && parsed.completed)
      ? parsed.completed.map((value) => Number(value)).filter((value) => value >= 1 && value <= maxLevel)
      : []
    const best = {}
    if (parsed && parsed.best && typeof parsed.best === 'object') {
      Object.keys(parsed.best).forEach((level) => {
        const value = Number(parsed.best[level])
        if (Number.isFinite(value) && value > 0) best[level] = value
      })
    }
    return { unlocked, completed: Array.from(new Set(completed)), best }
  } catch (error) {
    return { unlocked: 1, completed: [], best: {} }
  }
}

class NativeAudio {
  // BGM / 音效 / 语音各自只持有一个上下文；语音是单通道，新语音前先停旧的。
  constructor(options) {
    this.basePath = options.basePath
    this.voicePath = options.voicePath
    this.sfxFiles = options.sfx || {}
    this.bgmFile = options.bgm || 'bgm.mp3'
    this.muted = !!options.muted
    this.ready = false
    this.musicDesired = false
    this.bgm = null
    this.voiceContext = null
    this.sfx = {}
    this.playSafe = (audio) => {
      try {
        const result = audio.play()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // 真机上音频偶发失败不影响玩法。
      }
    }
    this.stopSafe = (audio) => {
      try {
        const result = audio.stop()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // 忽略停止失败。
      }
    }
    this.pauseSafe = (audio) => {
      try {
        const result = audio.pause()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // 忽略暂停失败。
      }
    }
  }

  makeContext(src, volume, loop) {
    try {
      const audio = uni.createInnerAudioContext()
      if (src) audio.src = src
      audio.volume = volume
      audio.loop = !!loop
      audio.autoplay = false
      return audio
    } catch (error) {
      return null
    }
  }

  ensure() {
    if (this.ready) return
    this.ready = true
    this.bgm = this.makeContext(this.basePath + this.bgmFile, 0.32, true)
    this.voiceContext = this.makeContext('', 1, false)
    Object.keys(this.sfxFiles).forEach((key) => {
      this.sfx[key] = this.makeContext(this.basePath + this.sfxFiles[key], key === 'celebrate' ? 0.9 : 0.8, false)
    })
  }

  startMusic() {
    this.ensure()
    this.musicDesired = true
    if (this.muted || !this.bgm) return
    this.playSafe(this.bgm)
  }

  pauseMusic() {
    if (!this.bgm) return
    this.pauseSafe(this.bgm)
  }

  resumeMusic() {
    this.ensure()
    if (this.muted || !this.musicDesired || !this.bgm) return
    this.playSafe(this.bgm)
  }

  play(name) {
    this.ensure()
    if (this.muted) return
    const audio = this.sfx[name]
    if (!audio) return
    this.stopSafe(audio)
    this.playSafe(audio)
  }

  setMuted(muted) {
    this.muted = !!muted
    writeStorage(STORAGE_MUTED, this.muted)
    if (this.muted) {
      this.pauseMusic()
      this.stopVoice()
    } else if (this.musicDesired) {
      this.resumeMusic()
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted)
    return this.muted
  }

  playVoice(name) {
    this.ensure()
    if (this.muted || !this.voiceContext || !name) return
    this.stopSafe(this.voiceContext)
    this.voiceContext.src = this.voicePath + name + '.mp3'
    this.voiceContext.volume = 1
    this.playSafe(this.voiceContext)
  }

  stopVoice() {
    if (!this.voiceContext) return
    this.stopSafe(this.voiceContext)
  }

  destroy() {
    this.stopVoice()
    const list = [this.bgm, this.voiceContext].concat(Object.values(this.sfx))
    list.forEach((audio) => {
      if (!audio) return
      this.stopSafe(audio)
      try {
        audio.destroy()
      } catch (error) {
        // 忽略。
      }
    })
    this.sfx = {}
    this.bgm = null
    this.voiceContext = null
    this.ready = false
  }
}

export class BaseGame {
  constructor(options, config) {
    this.canvasContext = options.canvasContext
    this.ctx = options.ctx
    this.w = options.width
    this.h = options.height
    this.dpr = options.dpr || 2
    this.safeTop = options.safeTop || 0
    this.safeBottom = options.safeBottom || 0

    this.config = config
    this.LEVELS = config.levels
    this.MAX_LEVEL = config.levels.length
    this.levelsPerChapter = config.levelsPerChapter || 4
    this.chapterNames = config.chapters
    this.storageKey = config.storageKey
    this.audio = new NativeAudio({
      basePath: config.audioPath,
      voicePath: config.audioPath + 'voice/',
      sfx: config.sfx,
      bgm: config.bgm,
      muted: readBoolean(STORAGE_MUTED, false),
    })

    const saved = readProgress(this.storageKey, this.MAX_LEVEL)
    this.maxUnlocked = saved.unlocked
    this.completedLevels = new Set(saved.completed)
    this.bestScores = saved.best

    this.images = {}
    this.imagesReady = false
    this.imagesLoaded = 0
    this.assets = config.assets || {}
    this.imagesTotal = Object.keys(this.assets).length

    this.buttons = []
    this.pressedId = null
    this.pressStartX = 0
    this.pressStartY = 0
    this.exitPrompt = false
    this.state = 'loading'
    this.gameMode = 'idle'
    this.time = 0
    this.lastTs = 0
    this.level = 1
    this.levelConfig = this.LEVELS[0]
    this.goal = this.levelConfig.goal
    this.hintSeen = false
    this.hintUntil = 0
    this.bannerTitle = ''
    this.bannerSub = ''
    this.bannerUntil = 0
    this.toastText = ''
    this.toastUntil = 0
    this.finishing = false
    this.finishAt = 0
    this.roundClearAt = 0
    this.roundClearDelay = 1.6
    this.pendingVoice = null
    this.particles = []
    this.floaters = []
    this.confetti = []
    this.mapReturnState = 'start'
    this.progress = 0
    this.score = 0
    this.happyUntil = 0
    this.hudShakeUntil = 0
    this.lastCelebrationConfettiAt = 0

    this.layout()
    this.resetLevelData()
    this.loadImages()
    this.rafId = 0
    this.loopBound = this.loop.bind(this)
    this.rafId = this.canvasContext.requestAnimationFrame(this.loopBound)

    if (typeof window !== 'undefined') {
      window.__kidsGame = this
      window.__kidsGameType = config.id
    }
  }

  // —— 子类可覆盖 ——

  layout() {
    this.headerTop = this.safeTop + 10
    // 顶部 HUD：章节芯片 40 + 间隔 8 + 进度条 36 + 间隔 6 + 目标条 32
    this.hudBottom = this.headerTop + 122
    this.contentTop = this.hudBottom + 8
    this.contentBottom = this.h - this.safeBottom - 14
  }

  resetLevelData() {
    this.progress = 0
    this.score = 0
    this.finishing = false
    this.finishAt = 0
  }

  updatePlay() {}

  updateClear() {}

  drawWorld() {}

  getObjectiveText() {
    return this.levelConfig.tip
  }

  getStartHint() {
    return this.levelConfig.hint || this.levelConfig.tip
  }

  getResultLines() {
    return {
      eyebrow: this.config.name,
      title: '真棒！',
      scoreText: '这一关完成了',
      tip: this.levelConfig.tip,
    }
  }

  getHostImage() {
    return this.images.host || null
  }

  drawHostBackdrop() {}

  // —— 通用流程 ——

  makeUid(prefix) {
    this.uidSeed = (this.uidSeed || 0) + 1
    return prefix + this.uidSeed
  }

  loadImages() {
    const sources = this.assets
    this.imagesTotal = Object.keys(sources).length
    if (!this.imagesTotal) {
      this.imagesReady = true
      if (this.state === 'loading') this.state = 'start'
      return
    }
    Object.keys(sources).forEach((key) => {
      const image = this.canvasContext.createImage()
      image.onload = () => {
        this.imagesLoaded += 1
        this.checkImagesReady()
      }
      image.onerror = () => {
        this.images[key] = null
        this.imagesLoaded += 1
        this.checkImagesReady()
      }
      image.src = sources[key]
      this.images[key] = image
    })
  }

  checkImagesReady() {
    if (this.imagesReady || this.imagesLoaded < this.imagesTotal) return
    this.imagesReady = true
    if (this.state === 'loading') this.state = 'start'
  }

  addAsset(key, src) {
    this.assets[key] = src
  }

  // —— 音频 ——

  startMusic() {
    this.audio.startMusic()
  }

  pause() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    this.state = 'paused'
    this.audio.stopVoice()
    this.audio.pauseMusic()
    this.pendingVoice = null
    this.audio.play('pause')
    return true
  }

  resume() {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.audio.resumeMusic()
    this.audio.play('resume')
  }

  handleHide() {
    if (this.state === 'playing' && this.gameMode === 'ready') this.pause()
    else {
      this.audio.pauseMusic()
      this.audio.stopVoice()
      this.pendingVoice = null
    }
  }

  handleBack() {
    if (this.exitPrompt) {
      this.cancelExit()
      return true
    }
    if (this.state === 'levelselect') {
      this.closeLevelSelect()
      return true
    }
    if (this.state === 'playing' && this.gameMode === 'ready') {
      this.pause()
      return true
    }
    if (this.state === 'paused' || this.state === 'celebrating') {
      this.goHome()
      return true
    }
    return false
  }

  requestExit() {
    if (this.exitPrompt) return
    this.exitPrompt = true
    this.audio.pauseMusic()
    this.audio.stopVoice()
    this.pendingVoice = null
  }

  cancelExit() {
    if (!this.exitPrompt) return
    this.exitPrompt = false
    if (this.state !== 'paused') this.audio.resumeMusic()
  }

  exitToLobby() {
    this.exitPrompt = false
    try {
      uni.reLaunch({ url: '/pages/index/index' })
    } catch (error) {
      try {
        uni.navigateBack({ delta: 1 })
      } catch (err) {
        // Ignore navigation errors.
      }
    }
  }

  toggleSound() {
    this.audio.ensure()
    const muted = this.audio.toggleMuted()
    if (!muted) {
      this.audio.play('ui')
      if (this.audio.musicDesired) this.audio.resumeMusic()
    }
    return muted
  }

  queueVoice(name, delay) {
    if (!name) return
    this.pendingVoice = { key: name, at: this.time + delay }
  }

  saveProgress() {
    const best = {}
    Object.keys(this.bestScores).forEach((level) => {
      best[level] = this.bestScores[level]
    })
    writeStorage(this.storageKey, JSON.stringify({
      unlocked: this.maxUnlocked,
      completed: Array.from(this.completedLevels),
      best,
    }))
  }

  recordLevelComplete() {
    this.completedLevels.add(this.level)
    this.maxUnlocked = Math.max(this.maxUnlocked, Math.min(this.MAX_LEVEL, this.level + 1))
    const previous = this.bestScores[this.level] || 0
    this.bestScores[this.level] = Math.max(previous, this.score)
    this.saveProgress()
  }

  // —— 关卡 ——

  startNewGame() {
    this.audio.ensure()
    this.startMusic()
    this.audio.play('ui')
    const allDone = this.maxUnlocked >= this.MAX_LEVEL && this.completedLevels.has(this.MAX_LEVEL)
    const startLevel = allDone ? 1 : clamp(this.maxUnlocked, 1, this.MAX_LEVEL)
    this.beginLevel(startLevel, startLevel === 1)
  }

  beginLevel(level, runStart) {
    this.level = clamp(level, 1, this.MAX_LEVEL)
    this.levelConfig = this.LEVELS[this.level - 1]
    this.goal = this.levelConfig.goal
    this.resetLevelData()
    this.state = 'playing'
    this.gameMode = 'ready'
    this.buttons = []
    this.bannerTitle = '第 ' + this.level + ' 关 · ' + this.levelConfig.name
    this.bannerSub = this.levelConfig.tip
    this.bannerUntil = this.time + 2.2
    this.hintUntil = this.level === 1 && !this.hintSeen ? this.time + 5.4 : 0
    this.setupLevel(this.levelConfig, this.level)
    this.audio.play('level')
    if (runStart) this.queueVoice('start', 0.9)
  }

  setupLevel() {}

  startLevelFromMap(level) {
    if (level > this.maxUnlocked) {
      this.audio.ensure()
      this.audio.play('ui')
      this.showToast('先完成前面的关卡吧')
      return
    }
    this.audio.ensure()
    this.startMusic()
    this.audio.play('ui')
    this.audio.stopVoice()
    this.pendingVoice = null
    this.beginLevel(level, false)
  }

  nextLevel() {
    if (this.state !== 'celebrating' || this.celebrateFinal || this.level >= this.MAX_LEVEL) return
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.play('ui')
    this.beginLevel(this.level + 1, false)
  }

  replayGame() {
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.play('ui')
    this.beginLevel(1, false)
    this.queueVoice('replay', 0.5)
  }

  goHome() {
    this.audio.stopVoice()
    this.pendingVoice = null
    this.state = 'start'
    this.gameMode = 'idle'
    this.level = 1
    this.levelConfig = this.LEVELS[0]
    this.goal = this.levelConfig.goal
    this.resetLevelData()
    this.buttons = []
    this.bannerUntil = 0
    this.hintUntil = 0
    this.finishAt = 0
    this.toastUntil = 0
    this.audio.resumeMusic()
  }

  openLevelSelect() {
    if (this.state !== 'start' && this.state !== 'paused' && this.state !== 'celebrating') return
    this.mapReturnState = this.state
    this.state = 'levelselect'
    this.buttons = []
    this.pressedId = null
    this.toastUntil = 0
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.play('ui')
  }

  closeLevelSelect() {
    if (this.state !== 'levelselect') return
    this.state = this.mapReturnState || 'start'
    this.buttons = []
    this.pressedId = null
    this.audio.play('ui')
  }

  showToast(text, duration) {
    this.toastText = text
    this.toastUntil = this.time + (duration || 1.6)
  }

  finishRound(delay) {
    if (this.finishing || this.gameMode !== 'ready') return
    this.finishing = true
    this.finishAt = this.time + (delay || 0)
  }

  beginRoundClear() {
    if (this.gameMode !== 'ready') return
    this.finishing = false
    this.gameMode = 'roundclear'
    this.roundClearAt = this.time
    this.recordLevelComplete()
    this.audio.play('celebrate')
    this.burstConfetti(64)
  }

  updateRoundClear(dt) {
    this.updateClear(dt)
    if (this.time - this.roundClearAt > this.roundClearDelay) this.openCelebration()
  }

  openCelebration() {
    if (this.state !== 'playing' || this.gameMode !== 'roundclear') return
    this.state = 'celebrating'
    this.gameMode = 'celebrated'
    this.celebrateFinal = this.level >= this.MAX_LEVEL
    this.result = this.getResultLines()
    this.happyUntil = this.time + 1.2
    this.audio.play('friend')
    if (this.celebrateFinal) this.queueVoice('final', 0.7)
    else if (this.level % 4 === 0) this.queueVoice('great', 0.6)
    else this.queueVoice('clear', 0.6)
    this.hintUntil = 0
  }

  // —— 特效 ——

  addParticle(type, x, y, color, size, life) {
    this.particles.push({
      type, x, y, vx: rand(-24, 24), vy: rand(-40, 8), gravity: 30,
      size, color, life, max: life, rotation: Math.random() * Math.PI, spin: rand(-2, 2),
    })
  }

  burstConfetti(count) {
    for (let i = 0; i < count; i += 1) {
      this.confetti.push({
        x: rand(0, this.w), y: -rand(8, this.h * 0.5),
        vx: rand(-45, 45), vy: rand(40, 130), width: rand(4, 9), height: rand(7, 14),
        color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)], life: rand(3.4, 5.6),
        rotation: rand(0, Math.PI * 2), spin: rand(-5, 5), sway: rand(1, 3), phase: rand(0, Math.PI * 2),
      })
    }
  }

  addConfettiBurst(count) {
    for (let i = 0; i < count; i += 1) {
      this.confetti.push({
        x: rand(0, this.w), y: rand(-30, 40), vx: rand(-70, 70), vy: rand(10, 80),
        width: rand(3, 7), height: rand(5, 10), color: RAINBOW[i % RAINBOW.length],
        life: rand(2.5, 4.5), rotation: rand(0, Math.PI * 2), spin: rand(-5, 5),
        sway: rand(1, 3), phase: rand(0, Math.PI * 2),
      })
    }
  }

  updateEffects(dt) {
    this.particles.forEach((particle) => {
      particle.life -= dt
      particle.vy += (particle.gravity || 0) * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.rotation += particle.spin * dt
    })
    this.particles = this.particles.filter((particle) => particle.life > 0)
    this.floaters.forEach((floater) => {
      floater.life -= dt
      floater.y -= 38 * dt
    })
    this.floaters = this.floaters.filter((floater) => floater.life > 0)
    this.confetti.forEach((piece) => {
      piece.life -= dt
      piece.vy += 120 * dt
      piece.x += piece.vx * dt
      piece.y += piece.vy * dt
      piece.rotation += piece.spin * dt
    })
    this.confetti = this.confetti.filter((piece) => piece.life > 0 && piece.y < this.h + 40)
  }

  // —— 帧循环 ——

  update(dt) {
    if (this.exitPrompt) {
      this.buttons = []
      return
    }
    if (this.state !== 'paused') {
      this.time += dt
      this.updateEffects(dt)
      if (this.state === 'playing' && this.gameMode === 'ready') {
        if (this.finishing) {
          if (this.time >= this.finishAt) this.beginRoundClear()
        } else {
          this.updatePlay(dt)
        }
      }
      if (this.state === 'playing' && this.gameMode === 'roundclear') this.updateRoundClear(dt)
      if (this.pendingVoice && this.time >= this.pendingVoice.at) {
        const key = this.pendingVoice.key
        this.pendingVoice = null
        this.audio.playVoice(key)
      }
    }
    this.buttons = []
  }

  loop(timestamp) {
    if (!this.lastTs) this.lastTs = timestamp
    const dt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTs) / 1000))
    this.lastTs = timestamp
    try {
      this.update(dt)
      this.draw()
    } catch (error) {
      if (typeof console !== 'undefined') console.error('Kids game frame error', error)
    }
    this.rafId = this.canvasContext.requestAnimationFrame(this.loopBound)
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    this.drawWorld()
    if (this.state === 'loading') {
      this.drawLoading()
      return
    }
    if (this.state === 'start') {
      this.drawStartScreen()
      if (this.exitPrompt) this.drawExitPrompt()
      return
    }
    if (this.state === 'levelselect') {
      this.drawLevelSelect()
      return
    }
    this.drawActors()
    this.drawEffects()
    if (this.state === 'playing' || this.state === 'paused') this.drawHud()
    if (this.state === 'playing') this.drawGameOverlays()
    if (this.state === 'paused') this.drawPauseScreen()
    if (this.state === 'celebrating') this.drawCelebration()
    if (this.exitPrompt) this.drawExitPrompt()
  }

  drawEffects() {
    const ctx = this.ctx
    this.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation || 0)
      ctx.fillStyle = particle.color
      if (particle.type === 'sparkle') {
        drawSparkle(ctx, 0, 0, particle.size, particle.color)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    })
    this.floaters.forEach((floater) => {
      const alpha = clamp(floater.life / floater.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      setFont(ctx, clamp(this.w * 0.06, 18, 26), 900)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.strokeText(floater.text, floater.x, floater.y)
      ctx.fillStyle = floater.color
      ctx.fillText(floater.text, floater.x, floater.y)
      ctx.restore()
    })
    this.confetti.forEach((piece) => {
      const alpha = clamp(piece.life, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(piece.x, piece.y)
      ctx.rotate(piece.rotation)
      ctx.fillStyle = piece.color
      ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height * Math.abs(Math.cos(this.time * 3 + piece.phase)))
      ctx.restore()
    })
  }

  addFloater(text, x, y, color) {
    this.floaters.push({
      x: clamp(x, 34, this.w - 34), y: clamp(y, 90, this.h - 120),
      text, color: color || '#F4A61E', life: 1, max: 1,
    })
  }

  // —— 通用绘制 ——

  drawLoading() {
    const ctx = this.ctx
    const cardW = Math.min(this.w * 0.72, 290)
    const cardH = 132
    const x = (this.w - cardW) / 2
    const y = this.h * 0.47 - cardH / 2
    fillRound(ctx, x, y + 5, cardW, cardH, 26, 'rgba(80,52,28,0.14)')
    fillRound(ctx, x, y, cardW, cardH, 26, 'rgba(255,250,239,0.95)')
    strokeRound(ctx, x, y, cardW, cardH, 26, '#FFFFFF', 2)
    for (let i = 0; i < 3; i += 1) {
      ctx.save()
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.time * 4 + i)
      ctx.fillStyle = RAINBOW[i * 2]
      ctx.beginPath()
      ctx.arc(this.w / 2 + (i - 1) * 34, y + 56 + Math.sin(this.time * 4 + i) * 6, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    drawLabel(ctx, this.config.loadingText, this.w / 2, y + 100, 13, '#7A5B40', 800)
  }

  drawChapterChip() {
    const ctx = this.ctx
    const index = this.levelConfig.chapter || 0
    const chipW = this.w > 360 ? 118 : 104
    const chipX = 58
    fillRound(ctx, chipX, this.headerTop + 4, chipW, 40, 20, 'rgba(88,57,31,0.12)')
    fillRound(ctx, chipX, this.headerTop, chipW, 40, 20, 'rgba(255,250,242,0.985)')
    strokeRound(ctx, chipX, this.headerTop, chipW, 40, 20, '#FFFFFF', 2)
    ctx.save()
    ctx.fillStyle = CHAPTER_TINTS[index % 5]
    ctx.beginPath()
    ctx.arc(chipX + 22, this.headerTop + 20, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    drawLabel(ctx, this.config.iconText || '★', chipX + 22, this.headerTop + 20, 14, CHAPTER_COLORS[index % 5], 900)
    drawLabel(ctx, '第 ' + this.level + ' 关', chipX + 42, this.headerTop + 20, 12, '#6E513A', 900, 'left')
  }

  drawProgressBar() {
    const ctx = this.ctx
    const meterW = Math.min(this.w - 32, 300)
    const meterX = (this.w - meterW) / 2
    const meterY = this.headerTop + 48
    fillRound(ctx, meterX, meterY + 3, meterW, 36, 18, 'rgba(88,57,31,0.12)')
    fillRound(ctx, meterX, meterY, meterW, 36, 18, 'rgba(255,250,242,0.985)')
    strokeRound(ctx, meterX, meterY, meterW, 36, 18, '#FFFFFF', 2)
    drawLabel(ctx, this.config.meterIcon || '★', meterX + 22, meterY + 18, 16, CHAPTER_COLORS[(this.levelConfig.chapter || 0) % 5], 900)

    const countText = this.progress + '/' + this.goal
    setFont(ctx, 10, 900)
    const countW = ctx.measureText(countText).width
    const areaStart = meterX + 44
    const areaEnd = meterX + meterW - 16 - countW - 8
    if (this.goal <= 12) {
      const span = Math.max(24, areaEnd - areaStart)
      const dotGap = this.goal > 1 ? span / (this.goal - 1) : 0
      for (let i = 0; i < this.goal; i += 1) {
        const x = this.goal > 1 ? areaStart + i * dotGap : areaStart + span / 2
        ctx.beginPath()
        ctx.fillStyle = i < this.progress ? RAINBOW[i % RAINBOW.length] : 'rgba(124,94,68,0.18)'
        ctx.arc(x, meterY + 18, i < this.progress ? 4.8 : 4.1, 0, Math.PI * 2)
        ctx.fill()
        if (i < this.progress) {
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    } else {
      const barW = Math.max(30, areaEnd - areaStart)
      fillRound(ctx, areaStart, meterY + 14, barW, 8, 4, 'rgba(124,94,68,0.16)')
      const fillW = barW * clamp(this.progress / this.goal, 0, 1)
      if (fillW > 0) {
        const grad = ctx.createLinearGradient(areaStart, 0, areaStart + barW, 0)
        RAINBOW.forEach((color, index) => grad.addColorStop(index / (RAINBOW.length - 1), color))
        fillRound(ctx, areaStart, meterY + 14, fillW, 8, 4, grad)
      }
    }
    drawLabel(ctx, countText, meterX + meterW - 12, meterY + 18, 10, '#8A6A50', 900, 'right')
    return meterY + 44
  }

  drawObjectiveStrip(y) {
    const ctx = this.ctx
    const text = this.getObjectiveText()
    setFont(ctx, 11, 800)
    const width = Math.min(this.w - 28, Math.max(ctx.measureText(text).width + 46, 180))
    const x = (this.w - width) / 2
    fillRound(ctx, x, y + 3, width, 32, 16, 'rgba(88,57,31,0.12)')
    fillRound(ctx, x, y, width, 32, 16, 'rgba(255,250,242,0.95)')
    strokeRound(ctx, x, y, width, 32, 16, '#FFFFFF', 2)
    this.drawObjectiveIcon(x + 20, y + 16)
    drawLabel(ctx, text, x + width / 2 + 8, y + 16, 11, '#6E513A', 800)
  }

  drawObjectiveIcon() {}

  drawActors() {}

  drawHud() {
    const ctx = this.ctx
    const shake = this.time < this.hudShakeUntil ? Math.sin(this.time * 52) * 4 : 0
    ctx.save()
    ctx.translate(shake, 0)
    this.drawCircleButton('back', 31, this.headerTop + 20, 19, 'back')
    this.drawChapterChip()
    this.drawCircleButton('sound', this.w - 68, this.headerTop + 20, 21, this.audio.muted ? 'muted' : 'sound')
    this.drawCircleButton('pause', this.w - 22, this.headerTop + 20, 21, 'pause', this.finishing)
    const objectiveY = this.drawProgressBar()
    this.drawObjectiveStrip(objectiveY)
    this.drawExtraHud(objectiveY + 40)
    ctx.restore()
  }

  drawExtraHud() {}

  drawGameOverlays() {
    const ctx = this.ctx
    if (this.time < this.bannerUntil) {
      const remaining = this.bannerUntil - this.time
      const alpha = clamp(remaining > 2 ? (2.2 - remaining) / 0.2 : Math.min(1, remaining / 0.3), 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      setFont(ctx, 19, 900)
      const titleWidth = ctx.measureText(this.bannerTitle).width
      setFont(ctx, 11, 700)
      const subWidth = ctx.measureText(this.bannerSub).width
      const width = Math.min(this.w - 24, Math.max(titleWidth + 44, subWidth + 40, 170))
      const x = (this.w - width) / 2
      const y = this.hudBottom + 8
      fillRound(ctx, x, y + 4, width, 58, 20, 'rgba(80,52,28,0.14)')
      fillRound(ctx, x, y, width, 58, 20, 'rgba(255,250,239,0.97)')
      strokeRound(ctx, x, y, width, 58, 20, '#FFFFFF', 2)
      drawLabel(ctx, this.bannerTitle, this.w / 2, y + 22, 18, '#684729', 900)
      drawLabel(ctx, this.bannerSub, this.w / 2, y + 42, 10.5, '#9A7758', 700)
      ctx.restore()
    }
    if (!this.hintSeen && this.time < this.hintUntil) {
      const alpha = clamp(Math.min(1, (this.hintUntil - this.time) / 0.5), 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      const text = this.getStartHint()
      setFont(ctx, 12, 800)
      const w = Math.min(this.w - 24, ctx.measureText(text).width + 62)
      const x = (this.w - w) / 2
      const y = this.h * 0.5
      fillRound(ctx, x, y + 4, w, 42, 21, 'rgba(80,52,28,0.12)')
      fillRound(ctx, x, y, w, 42, 21, 'rgba(255,250,238,0.94)')
      strokeRound(ctx, x, y, w, 42, 21, '#FFFFFF', 2)
      fillRound(ctx, x + 6, y + 6, 30, 30, 15, '#FFE7B6')
      this.drawHandIcon(x + 21, y + 21)
      drawLabel(ctx, text, x + 44 + (w - 44) / 2, y + 21, 12, '#75563F', 800)
      ctx.restore()
    }
    this.drawExtraOverlays()
  }

  drawExtraOverlays() {}

  drawStartScreen() {
    const ctx = this.ctx
    const H = this.h
    const W = this.w
    const top = this.safeTop + 12
    const center = W / 2

    const scrim = ctx.createLinearGradient(0, H * 0.42, 0, H)
    scrim.addColorStop(0, 'rgba(255,252,242,0)')
    scrim.addColorStop(0.45, 'rgba(255,252,242,0.7)')
    scrim.addColorStop(1, 'rgba(255,252,242,0.92)')
    ctx.fillStyle = scrim
    ctx.fillRect(0, H * 0.42, W, H * 0.58)

    if (H > 640) {
      const ageX = 58
      const ageW = Math.min(164, Math.max(108, W - 133 - ageX - 8))
      fillRound(ctx, ageX, top, ageW, 34, 17, 'rgba(255,251,242,0.82)')
      strokeRound(ctx, ageX, top, ageW, 34, 17, 'rgba(255,255,255,0.92)', 1.5)
      ctx.beginPath()
      ctx.fillStyle = '#82DFBF'
      ctx.arc(ageX + 15, top + 17, 4, 0, Math.PI * 2)
      ctx.fill()
      const ageText = ageW < 150 ? '4-9 岁' : this.config.ageText
      drawLabel(ctx, ageText, ageX + ageW / 2 + 7, top + 17, 10.5, '#75563F', 800)
    }
    this.drawCircleButton('back', 31, top + 19, 19, 'back')
    this.drawCircleButton('sound', W - 36, top + 19, 21, this.audio.muted ? 'muted' : 'sound')
    this.drawMapChip(W - 133, top + 2, 66, 34)

    const buttonH = clamp(H * 0.078, 56, 66)
    const buttonY = H * 0.635
    const heroBottom = buttonY - 20
    const heroSize = Math.min(W * 0.5, 196, Math.max(132, H * 0.22))
    const heroTop = heroBottom - heroSize
    const titleSize = clamp(W * 0.098, 29, 40)
    const titleY = Math.max(top + 104, heroTop - 64)
    const kickerY = titleY - 36

    const kickerW = 104
    fillRound(ctx, center - kickerW / 2, kickerY - 13, kickerW, 26, 13, 'rgba(255,250,239,0.9)')
    drawLabel(ctx, this.config.kicker, center, kickerY, 11, '#966443', 800)
    this.drawGameTitle(center, titleY, titleSize)

    setFont(ctx, 11, 800)
    const ribbonText = this.config.tagline
    const ribbonW = ctx.measureText(ribbonText).width + 52
    const ribbonY = titleY + titleSize * 0.55
    fillRound(ctx, center - ribbonW / 2, ribbonY, ribbonW, 25, 13, 'rgba(255,244,218,0.95)')
    drawLabel(ctx, ribbonText, center, ribbonY + 12.5, 11, '#85603F', 800)

    this.drawHostBackdrop(center, heroBottom, heroSize)
    const host = this.getHostImage()
    if (host) {
      const bob = Math.sin(this.time * 1.8) * 3
      ctx.drawImage(host, center - heroSize / 2, heroTop + bob, heroSize, heroSize)
    }

    const btnW = Math.min(W * 0.82, 318)
    const allDone = this.maxUnlocked >= this.MAX_LEVEL && this.completedLevels.has(this.MAX_LEVEL)
    const startLabel = allDone ? '再玩一次' : this.maxUnlocked > 1 ? '继续第 ' + this.maxUnlocked + ' 关' : this.config.startLabel
    this.drawPrimaryButton('start', center - btnW / 2, buttonY, btnW, buttonH, startLabel, true)
    const hintY = buttonY + buttonH + 18
    const hintText = this.getStartHint()
    setFont(ctx, 11.5, 800)
    const hintW = Math.min(W - 24, ctx.measureText(hintText).width + 48)
    fillRound(ctx, center - hintW / 2, hintY, hintW, 34, 17, 'rgba(255,255,255,0.62)')
    drawLabel(ctx, hintText, center, hintY + 17, 11.5, '#6E523C', 800)

    drawLabel(ctx, this.config.footer, center, H - this.safeBottom - 12, 9.5, '#8A6A50', 700)
  }

  drawGameTitle(center, y, size) {
    const ctx = this.ctx
    const letters = this.config.title.split('')
    const colors = this.config.titleColors
    const offsets = [-2.2, 1.8, -1.2, 2, -1.6]
    setFont(ctx, size, 900)
    const widths = letters.map((letter) => ctx.measureText(letter).width)
    const gap = size * 0.02
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * (letters.length - 1)
    let x = center - total / 2
    for (let i = 0; i < letters.length; i += 1) {
      const cx = x + widths[i] / 2
      ctx.save()
      ctx.translate(cx, y)
      ctx.rotate((((offsets[i % offsets.length]) * Math.PI) / 180))
      setFont(ctx, size, 900)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#5A3E2B'
      ctx.fillText(letters[i], 0, 4)
      ctx.globalAlpha = 1
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(5, size * 0.12)
      ctx.strokeStyle = '#FFFFFF'
      ctx.strokeText(letters[i], 0, 0)
      ctx.fillStyle = colors[i % colors.length]
      ctx.fillText(letters[i], 0, 0)
      ctx.restore()
      x += widths[i] + gap
    }
  }

  drawMapChip(x, y, w, h) {
    const ctx = this.ctx
    const pressed = this.pressedId === 'map'
    const offset = pressed ? 2 : 0
    fillRound(ctx, x, y + 3, w, h, h / 2, 'rgba(88,57,31,0.14)')
    fillRound(ctx, x, y + offset, w, h, h / 2, 'rgba(255,251,242,0.94)')
    strokeRound(ctx, x, y + offset, w, h, h / 2, 'rgba(255,255,255,0.95)', 1.5)
    const iconX = x + 18
    const iconY = y + offset + h / 2
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        strokeRound(ctx, iconX - 6 + col * 7, iconY - 6 + row * 7, 5, 5, 1.4, '#8A5C38', 1.4)
      }
    }
    drawLabel(ctx, '选关', x + 44, iconY, 10.5, '#75563F', 900)
    this.buttons.push({ id: 'map', x, y: y + offset, w, h })
  }

  drawLevelSelect() {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(45,33,23,0.52)'
    ctx.fillRect(0, 0, this.w, this.h)
    const panelW = Math.min(this.w - 24, 390)
    const rows = Math.ceil(this.MAX_LEVEL / this.levelsPerChapter)
    const maxRowH = 112
    const neededH = 72 + rows * (maxRowH + 8) + 52
    const panelH = Math.min(this.h - this.safeTop - this.safeBottom - 28, Math.max(neededH, 300))
    const x = (this.w - panelW) / 2
    const y = (this.h - panelH) / 2
    fillRound(ctx, x, y + 10, panelW, panelH, 30, 'rgba(60,40,24,0.32)')
    fillRound(ctx, x, y, panelW, panelH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, panelW, panelH, 30, '#FFFFFF', 3)

    drawLabel(ctx, '选择关卡', x + 22, y + 31, 21, '#5F432D', 900, 'left')
    drawLabel(ctx, '已通关 ' + this.completedLevels.size + ' / ' + this.MAX_LEVEL, x + 22, y + 53, 10.5, '#9A7758', 700, 'left')
    this.drawMapCloseButton(x + panelW - 30, y + 32, 17)

    const headerBottom = y + 72
    const footerTop = y + panelH - 42
    const gridLeft = x + 14
    const gridRight = x + panelW - 14
    const labelW = 46
    const cardGap = 7
    const rowGap = 8
    const cols = this.levelsPerChapter
    const cardW = (gridRight - gridLeft - labelW - cardGap * (cols - 1)) / cols
    const rowH = Math.min(maxRowH, (footerTop - headerBottom - rowGap * (rows - 1)) / rows)

    for (let row = 0; row < rows; row += 1) {
      const info = this.chapterNames[row] || this.chapterNames[this.chapterNames.length - 1]
      const rowY = headerBottom + row * (rowH + rowGap)
      fillRound(ctx, gridLeft + 4, rowY + 8, 3, rowH - 16, 1.5, CHAPTER_COLORS[row % 5])
      drawLabel(ctx, info.short, gridLeft + 26, rowY + rowH / 2, 9.5, CHAPTER_COLORS[row % 5], 900)
      for (let col = 0; col < cols; col += 1) {
        const level = row * cols + col + 1
        if (level > this.MAX_LEVEL) break
        const cfg = this.LEVELS[level - 1]
        const cx = gridLeft + labelW + col * (cardW + cardGap)
        const locked = level > this.maxUnlocked
        const completed = this.completedLevels.has(level)
        const isNext = level === this.maxUnlocked && !completed
        const cardY = rowY + 1
        const cardH = rowH - 2
        const bg = locked ? '#F2ECE3' : completed ? CHAPTER_TINTS[row % 5] : '#FFFDF7'
        if (isNext) {
          ctx.save()
          ctx.globalAlpha = 0.4 + 0.25 * Math.sin(this.time * 4)
          strokeRound(ctx, cx - 3, cardY - 3, cardW + 6, cardH + 6, 16, '#FFB35C', 4)
          ctx.restore()
        }
        fillRound(ctx, cx, cardY + 2, cardW, cardH, 13, 'rgba(120,86,55,0.1)')
        fillRound(ctx, cx, cardY, cardW, cardH, 13, bg)
        strokeRound(ctx, cx, cardY, cardW, cardH, 13, isNext ? '#FFD79B' : '#FFFFFF', 2)
        drawLabel(ctx, String(level), cx + cardW / 2, cardY + cardH * 0.4, Math.min(21, cardH * 0.26), locked ? '#B9A48E' : completed ? CHAPTER_COLORS[row % 5] : '#5F432D', 900)
        drawLabel(ctx, cfg.name, cx + cardW / 2, cardY + cardH * 0.7, Math.min(9, cardH * 0.11), locked ? '#BFAE9B' : CHAPTER_COLORS[row % 5], 800)
        if (locked) this.drawLockIcon(cx + cardW - 13, cardY + 16, 7)
        if (completed) {
          ctx.save()
          ctx.fillStyle = '#58A86F'
          ctx.beginPath()
          ctx.arc(cx + cardW - 13, cardY + 14, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(cx + cardW - 17, cardY + 14)
          ctx.lineTo(cx + cardW - 14, cardY + 17)
          ctx.lineTo(cx + cardW - 9, cardY + 11)
          ctx.stroke()
          ctx.restore()
        }
        if (isNext) {
          fillRound(ctx, cx + cardW - 31, cardY + 7, 25, 14, 7, '#FF9A45')
          drawLabel(ctx, 'NEW', cx + cardW - 18.5, cardY + 14, 7.5, '#FFFFFF', 900)
        }
        this.buttons.push({ id: 'level-' + level, x: cx, y: cardY, w: cardW, h: cardH })
      }
    }

    drawLabel(ctx, '完成一关，就会解锁下一关', this.w / 2, y + panelH - 20, 9.8, '#A0846B', 700)
    if (this.time < this.toastUntil) {
      setFont(ctx, 11, 800)
      const toastW = ctx.measureText(this.toastText).width + 34
      const toastX = (this.w - toastW) / 2
      const toastY = y + panelH - 70
      fillRound(ctx, toastX, toastY + 3, toastW, 30, 15, 'rgba(80,52,28,0.16)')
      fillRound(ctx, toastX, toastY, toastW, 30, 15, 'rgba(92,66,44,0.92)')
      drawLabel(ctx, this.toastText, this.w / 2, toastY + 15, 11, '#FFF7E9', 800)
    }
  }

  drawMapCloseButton(cx, cy, r) {
    const ctx = this.ctx
    fillRound(ctx, cx - r, cy - r + 2, r * 2, r * 2, r, 'rgba(120,86,55,0.14)')
    ctx.save()
    ctx.fillStyle = '#FFFDF8'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.strokeStyle = '#8A6A50'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 5, cy - 5)
    ctx.lineTo(cx + 5, cy + 5)
    ctx.moveTo(cx + 5, cy - 5)
    ctx.lineTo(cx - 5, cy + 5)
    ctx.stroke()
    ctx.restore()
    this.buttons.push({ id: 'close-map', x: cx - r - 4, y: cy - r - 4, w: r * 2 + 8, h: r * 2 + 8 })
  }

  drawExitPrompt() {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(45,33,23,0.5)'
    ctx.fillRect(0, 0, this.w, this.h)
    const s = clamp(this.w / 390, 0.84, 1.04)
    const cardW = Math.min(this.w * 0.84, 316)
    const cardH = Math.min(292 * s, this.h * 0.62)
    const x = (this.w - cardW) / 2
    const y = (this.h - cardH) / 2
    fillRound(ctx, x, y + 10, cardW, cardH, 30, 'rgba(78,47,23,0.26)')
    fillRound(ctx, x, y, cardW, cardH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, cardW, cardH, 30, '#FFFFFF', 3)
    const cx = this.w / 2
    const iconY = y + 48 * s
    fillRound(ctx, cx - 28 * s, iconY - 28 * s, 56 * s, 56 * s, 28 * s, '#FFF0C9')
    this.drawHomeIcon(cx, iconY + 2 * s, 15 * s, '#7A573B')
    drawLabel(ctx, '要回大厅吗？', cx, y + 102 * s, 21 * s, '#6E4D32', 900)
    drawLabel(ctx, '下次还可以继续玩', cx, y + 128 * s, 12 * s, '#927157', 600)
    const btnW = cardW - 36 * s
    this.drawPrimaryButton('exit-cancel', cx - btnW / 2, y + 152 * s, btnW, 50 * s, '继续玩', true)
    this.drawSecondaryButton('exit-home', cx - btnW / 2, y + 222 * s, btnW, 44 * s, '回到大厅', true)
    this.buttons = this.buttons.filter((button) => ['exit-cancel', 'exit-home'].includes(button.id))
  }

  drawPauseScreen() {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(48,34,24,0.38)'
    ctx.fillRect(0, 0, this.w, this.h)
    const cardW = Math.min(this.w * 0.86, 342)
    const s = clamp(this.w / 390, 0.84, 1.04)
    const cardH = Math.min(this.h * 0.66, 372 * s)
    const x = (this.w - cardW) / 2
    const y = (this.h - cardH) / 2
    fillRound(ctx, x, y + 10, cardW, cardH, 30, 'rgba(78,47,23,0.26)')
    fillRound(ctx, x, y, cardW, cardH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, cardW, cardH, 30, '#FFFFFF', 3)
    const cx = this.w / 2
    const host = this.getHostImage()
    const hostS = 92 * s
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#FFE7B8'
    ctx.beginPath()
    ctx.arc(cx, y + 78 * s, 58 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    if (host) ctx.drawImage(host, cx - hostS / 2, y + 22 * s, hostS, hostS)
    drawLabel(ctx, '休息一下', cx, y + 150 * s, 25 * s, '#6E4D32', 900)
    drawLabel(ctx, '准备好了再继续', cx, y + 178 * s, 12.5 * s, '#927157', 600)
    const btnW = cardW - 36
    this.drawPrimaryButton('resume', cx - btnW / 2, y + 204 * s, btnW, 54 * s, '继续玩', true)
    this.drawSecondaryButton('home', cx - btnW / 2, y + 278 * s, btnW, 47 * s, '回到游戏首页', true)
    this.drawCircleButton('sound', x + cardW - 34, y + 36 * s, 21, this.audio.muted ? 'muted' : 'sound')
    this.buttons = this.buttons.filter((button) => ['sound', 'resume', 'home'].includes(button.id))
  }

  drawCelebration() {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(47,37,28,0.34)'
    ctx.fillRect(0, 0, this.w, this.h)
    this.drawEffects()
    this.addConfettiIfNeeded()
    const s = clamp(this.w / 390, 0.84, 1.04)
    const center = this.w / 2
    const result = this.result || this.getResultLines()
    const badgeY = this.safeTop + Math.max(24, this.h * 0.13)
    const titleY = badgeY + 40 * s
    setFont(ctx, 11 * s, 900)
    const badgeText = this.celebrateFinal ? '全部通关啦！' : '过关啦！'
    const badgeW = ctx.measureText(badgeText).width + 44
    fillRound(ctx, center - badgeW / 2, badgeY - 14 * s, badgeW, 28 * s, 14 * s, 'rgba(255,250,239,0.95)')
    drawLabel(ctx, badgeText, center, badgeY, 11 * s, '#7B5A3F', 900)

    ctx.save()
    setFont(ctx, clamp(29 * s, 25, 36), 900)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(91,61,34,0.35)'
    ctx.strokeText(result.title, center, titleY + 2)
    ctx.fillStyle = '#FFFDF5'
    ctx.fillText(result.title, center, titleY)
    ctx.restore()

    const cardW = Math.min(this.w * 0.88, 342)
    const cardH = Math.min(this.h - titleY - 26, 360 * s)
    const x = center - cardW / 2
    const y = titleY + 28 * s
    fillRound(ctx, x, y + 10, cardW, cardH, 30, 'rgba(75,48,26,0.26)')
    fillRound(ctx, x, y, cardW, cardH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, cardW, cardH, 30, '#FFFFFF', 3)
    const pad = 16 * s
    const topAreaH = 104 * s
    const host = this.getHostImage()
    fillRound(ctx, x + pad, y + pad, cardW - pad * 2, topAreaH, 20, '#FFF3D8')
    ctx.save()
    roundedPath(ctx, x + pad, y + pad, cardW - pad * 2, topAreaH, 20)
    ctx.clip()
    ctx.strokeStyle = 'rgba(255,205,95,0.3)'
    ctx.lineWidth = 8
    for (let i = 0; i < 16; i += 1) {
      const angle = (i / 16) * Math.PI * 2 + this.time * 0.08
      ctx.beginPath()
      ctx.moveTo(center + Math.cos(angle) * 28, y + pad + topAreaH * 0.5 + Math.sin(angle) * 28)
      ctx.lineTo(center + Math.cos(angle) * topAreaH * 1.8, y + pad + topAreaH * 0.5 + Math.sin(angle) * topAreaH * 1.8)
      ctx.stroke()
    }
    ctx.restore()
    if (host) {
      const imgS = Math.min(topAreaH * 0.8, 92 * s)
      const bob = Math.sin(this.time * 2.2) * 2
      ctx.drawImage(host, center - imgS / 2, y + pad + (topAreaH - imgS) / 2 + bob, imgS, imgS)
    }
    fillRound(ctx, center - 52 * s, y + pad + topAreaH - 23 * s, 104 * s, 20 * s, 10 * s, '#FFFAF0')
    drawLabel(ctx, this.config.hostName, center, y + pad + topAreaH - 13 * s, 10 * s, '#8A5C38', 900)

    const copyY = y + pad + topAreaH + 19 * s
    setFont(ctx, 12.5 * s, 600)
    const lines = wrapLines(ctx, result.tip, cardW - pad * 2 - 12)
    lines.forEach((line, i) => {
      drawLabel(ctx, line, center, copyY + i * 19 * s, 12.5 * s, '#86664C', 600)
    })
    const countY = copyY + Math.max(26, lines.length * 19) + 9 * s
    setFont(ctx, 11 * s, 700)
    drawLabel(ctx, result.scoreText, center, countY, 11 * s, '#967253', 700)

    const buttonW = cardW - pad * 2
    if (this.celebrateFinal) {
      const buttonY = y + cardH - 126 * s
      this.drawPrimaryButton('replay', center - buttonW / 2, buttonY, buttonW, 48 * s, '再玩一次', false)
      const rowY = y + cardH - 60 * s
      const rowW = (buttonW - 12 * s) / 2
      this.drawSecondaryButton('map', center - buttonW / 2, rowY, rowW, 36 * s, '关卡地图', false)
      this.drawSecondaryButton('home', center - buttonW / 2 + rowW + 12 * s, rowY, rowW, 36 * s, '游戏首页', true)
    } else {
      const nextY = y + cardH - 116 * s
      this.drawPrimaryButton('next', center - buttonW / 2, nextY, buttonW, 48 * s, '继续探险', false)
      this.drawSecondaryButton('map', center - buttonW / 2, y + cardH - 48 * s, buttonW, 34 * s, '关卡地图', false)
    }
    this.buttons = this.buttons.filter((button) => ['replay', 'next', 'map', 'home'].includes(button.id))
  }

  addConfettiIfNeeded() {
    if (this.state !== 'celebrating') return
    if (this.time - this.lastCelebrationConfettiAt > 1.4) {
      this.lastCelebrationConfettiAt = this.time
      this.addConfettiBurst(16)
    }
  }

  // —— 按钮与图标 ——

  drawPrimaryButton(id, x, y, w, h, label, showPlay) {
    const ctx = this.ctx
    const pressed = this.pressedId === id
    const offset = pressed ? 4 : 0
    if (id === 'start') {
      ctx.save()
      ctx.globalAlpha = 0.24 + 0.1 * Math.sin(this.time * 2.4)
      strokeRound(ctx, x - 5, y - 5, w + 10, h + 10, (h + 10) / 2, '#FFC077', 3)
      ctx.restore()
    }
    fillRound(ctx, x, y + 6, w, h, h / 2, '#D66C1A')
    const grad = ctx.createLinearGradient(0, y, 0, y + h)
    grad.addColorStop(0, '#FFB45C')
    grad.addColorStop(1, '#FF8F31')
    roundedPath(ctx, x, y + offset, w, h, h / 2)
    ctx.fillStyle = pressed ? '#F18B31' : grad
    ctx.fill()
    ctx.save()
    setFont(ctx, clamp(w * 0.066, 18, 23), 900)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const labelWidth = ctx.measureText(label).width
    let contentX = x + w / 2 - (labelWidth + (showPlay ? 38 : 0)) / 2
    if (showPlay) {
      fillRound(ctx, contentX, y + offset + h / 2 - 15, 30, 30, 15, 'rgba(255,255,255,0.26)')
      this.drawPlayIcon(contentX + 16, y + offset + h / 2, 8)
      contentX += 38
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(label, contentX + labelWidth / 2, y + offset + h / 2 + 1)
    ctx.restore()
    this.buttons.push({ id, x, y, w, h })
  }

  drawSecondaryButton(id, x, y, w, h, label, icon) {
    const ctx = this.ctx
    const pressed = this.pressedId === id
    const offset = pressed ? 3 : 0
    fillRound(ctx, x, y + 5, w, h, h / 2, '#E3CDB2')
    fillRound(ctx, x, y + offset, w, h, h / 2, '#FFFDF7')
    strokeRound(ctx, x, y + offset, w, h, h / 2, '#FFFFFF', 2)
    setFont(ctx, 15, 800)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const labelWidth = ctx.measureText(label).width
    let contentX = x + w / 2 - labelWidth / 2
    if (icon) {
      this.drawHomeIcon(contentX - 14, y + offset + h / 2, 9, '#5A3E2B')
      contentX += 7
    }
    drawLabel(ctx, label, contentX + labelWidth / 2, y + offset + h / 2, 15, '#5A3E2B', 800)
    this.buttons.push({ id, x, y, w, h })
  }

  drawCircleButton(id, cx, cy, r, icon, disabled) {
    if (disabled) return
    const ctx = this.ctx
    const pressed = this.pressedId === id
    const offset = pressed ? 2 : 0
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(156,119,82,0.22)'
    ctx.arc(cx, cy + 4, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255,250,242,0.985)'
    ctx.arc(cx, cy + offset, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    if (icon === 'sound') this.drawSoundIcon(cx, cy + offset, 10)
    else if (icon === 'muted') this.drawMutedIcon(cx, cy + offset, 10)
    else if (icon === 'pause') this.drawPauseIcon(cx, cy + offset, 10)
    else if (icon === 'home') this.drawHomeIcon(cx, cy + offset, 10, '#5A3E2B')
    else if (icon === 'back') this.drawBackIcon(cx, cy + offset, 10)
    this.buttons.push({ id, x: cx - r - 4, y: cy - r - 4, w: r * 2 + 8, h: r * 2 + 8 })
  }

  drawPlayIcon(x, y, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.moveTo(x - size * 0.55, y - size)
    ctx.lineTo(x + size * 0.9, y)
    ctx.lineTo(x - size * 0.55, y + size)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  drawPauseIcon(x, y, size) {
    fillRound(this.ctx, x - size * 0.55, y - size, size * 0.42, size * 2, size * 0.2, '#5A3E2B')
    fillRound(this.ctx, x + size * 0.13, y - size, size * 0.42, size * 2, size * 0.2, '#5A3E2B')
  }

  drawSoundIcon(x, y, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = '#5A3E2B'
    ctx.beginPath()
    ctx.moveTo(x - size * 0.9, y - size * 0.35)
    ctx.lineTo(x - size * 0.45, y - size * 0.35)
    ctx.lineTo(x + size * 0.1, y - size * 0.9)
    ctx.lineTo(x + size * 0.1, y + size * 0.9)
    ctx.lineTo(x - size * 0.45, y + size * 0.35)
    ctx.lineTo(x - size * 0.9, y + size * 0.35)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#5A3E2B'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(x + size * 0.25, y, size * 0.65, -0.9, 0.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + size * 0.25, y, size * 1.05, -0.8, 0.8)
    ctx.stroke()
    ctx.restore()
  }

  drawMutedIcon(x, y, size) {
    this.drawSoundIcon(x, y, size)
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = '#A6735F'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 2, y - size)
    ctx.lineTo(x + size * 1.5, y + size)
    ctx.moveTo(x + size * 1.5, y - size)
    ctx.lineTo(x - 2, y + size)
    ctx.stroke()
    ctx.restore()
  }

  drawHomeIcon(x, y, r, color) {
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = Math.max(1.8, r * 0.18)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x - r, y)
    ctx.lineTo(x, y - r * 0.9)
    ctx.lineTo(x + r, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.rect(x - r * 0.65, y, r * 1.3, r * 0.85)
    ctx.stroke()
    ctx.restore()
  }

  drawBackIcon(x, y, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = '#5A3E2B'
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x + size * 0.35, y - size * 0.65)
    ctx.lineTo(x - size * 0.35, y)
    ctx.lineTo(x + size * 0.35, y + size * 0.65)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - size * 0.25, y)
    ctx.lineTo(x + size * 0.75, y)
    ctx.stroke()
    ctx.restore()
  }

  drawLockIcon(x, y, r) {
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = '#B89A7E'
    ctx.fillStyle = '#B89A7E'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(x, y - r * 0.35, r * 0.45, Math.PI, 0)
    ctx.stroke()
    fillRound(ctx, x - r * 0.7, y - r * 0.2, r * 1.4, r * 1.05, r * 0.25, '#B89A7E')
    ctx.restore()
  }

  drawHandIcon(x, y) {
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = '#B17627'
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 7, y)
    ctx.lineTo(x + 7, y)
    ctx.moveTo(x - 7, y)
    ctx.lineTo(x - 3, y - 4)
    ctx.moveTo(x - 7, y)
    ctx.lineTo(x - 3, y + 4)
    ctx.moveTo(x + 7, y)
    ctx.lineTo(x + 3, y - 4)
    ctx.moveTo(x + 7, y)
    ctx.lineTo(x + 3, y + 4)
    ctx.stroke()
    ctx.restore()
  }

  // —— 输入 ——

  buttonAt(x, y) {
    for (let i = this.buttons.length - 1; i >= 0; i -= 1) {
      const button = this.buttons[i]
      if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) return button
    }
    return null
  }

  touchStart(x, y) {
    this.pressStartX = x
    this.pressStartY = y
    const button = this.buttonAt(x, y)
    if (button) {
      this.pressedId = button.id
      return
    }
    this.pressedId = null
    if (this.exitPrompt) return
    if (this.state === 'playing' && this.gameMode === 'ready' && !this.finishing) {
      this.hintSeen = true
      this.hintUntil = 0
      this.onTapInPlay(x, y)
    }
  }

  onTapInPlay() {}

  touchMove(x, y) {
    if (this.pressedId) {
      const dx = x - this.pressStartX
      const dy = y - this.pressStartY
      if (Math.sqrt(dx * dx + dy * dy) > 18) this.pressedId = null
    }
  }

  touchEnd(x, y) {
    if (!this.pressedId) return
    const id = this.pressedId
    const button = this.buttonAt(x, y)
    this.pressedId = null
    if (!button || button.id !== id) return
    this.activate(id)
  }

  activate(id) {
    if (id === 'back') {
      this.requestExit()
      return
    }
    if (id === 'exit-cancel') {
      this.cancelExit()
      return
    }
    if (id === 'exit-home') {
      this.exitToLobby()
      return
    }
    if (id === 'sound') {
      this.toggleSound()
      return
    }
    if (id === 'map') {
      this.openLevelSelect()
      return
    }
    if (id === 'close-map') {
      this.closeLevelSelect()
      return
    }
    if (id.startsWith('level-')) {
      const level = Number(id.slice(6))
      if (level >= 1 && level <= this.MAX_LEVEL) this.startLevelFromMap(level)
      return
    }
    if (id === 'start') {
      this.startNewGame()
      return
    }
    if (id === 'pause') {
      this.pause()
      return
    }
    if (id === 'resume') {
      this.resume()
      return
    }
    if (id === 'home') {
      this.audio.play('ui')
      this.goHome()
      return
    }
    if (id === 'next') {
      this.nextLevel()
      return
    }
    if (id === 'replay') {
      this.replayGame()
      return
    }
    this.activateExtra(id)
  }

  activateExtra() {}

  destroy() {
    if (this.rafId && this.canvasContext) this.canvasContext.cancelAnimationFrame(this.rafId)
    this.audio.destroy()
  }

  debugState() {
    return {
      game: this.config.id,
      state: this.state,
      gameMode: this.gameMode,
      level: this.level,
      goal: this.goal,
      progress: this.progress,
      score: this.score,
      maxUnlocked: this.maxUnlocked,
      completed: Array.from(this.completedLevels),
      muted: this.audio.muted,
      imagesReady: this.imagesReady,
      buttons: this.buttons.map((button) => button.id),
      w: this.w,
      h: this.h,
    }
  }
}
