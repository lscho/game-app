import {
  BaseGame, clamp, rand, drawSparkle, setFont, drawLabel, fillRound, strokeRound,
  roundedPath, mulberry32,
} from './engine.js'

// 小小乐队：看乐谱，按顺序敲乐器。敲错了只会提示，不会中断演奏。
// 关卡只调两件事：乐谱长度和节奏速度。

const INSTRUMENTS = [
  { id: 'drum', name: '小鼓', color: '#F26D62', tint: '#FFE0DC' },
  { id: 'xylophone', name: '木琴', color: '#FFA94D', tint: '#FFEBD6' },
  { id: 'bell', name: '小铃铛', color: '#F2B93B', tint: '#FFF3D2' },
  { id: 'maracas', name: '沙锤', color: '#7FCB8A', tint: '#E4F6E5' },
  { id: 'tambourine', name: '手鼓', color: '#5CC8FF', tint: '#E0F4FF' },
  { id: 'trumpet', name: '小号', color: '#B08CFF', tint: '#EFE8FF' },
]

const LEVELS = [
  { chapter: 0, name: '第一首曲子', goal: 4, pool: 2, speed: 0, tip: '看乐谱，跟着敲' },
  { chapter: 0, name: '咚次咚次', goal: 5, pool: 2, speed: 0, tip: '按顺序敲一敲' },
  { chapter: 0, name: '三种乐器', goal: 5, pool: 3, speed: 0, tip: '多了一种乐器' },
  { chapter: 0, name: '小手准备好了', goal: 6, pool: 3, speed: 0, tip: '敲满 6 个音符' },

  { chapter: 1, name: '四种乐器', goal: 6, pool: 4, speed: 0, tip: '看清楚乐谱哦' },
  { chapter: 1, name: '节奏来了', goal: 7, pool: 4, speed: 1.2, tip: '跟着节奏敲' },
  { chapter: 1, name: '五重奏', goal: 7, pool: 5, speed: 1.1, tip: '五种乐器一起玩' },
  { chapter: 1, name: '节拍加快', goal: 8, pool: 5, speed: 1.0, tip: '节奏会快一点' },

  { chapter: 2, name: '乐队合奏', goal: 8, pool: 6, speed: 0.95, tip: '六种乐器都来啦' },
  { chapter: 2, name: '小小指挥', goal: 9, pool: 5, speed: 0.9, tip: '看准乐谱再敲' },
  { chapter: 2, name: '连奏', goal: 10, pool: 6, speed: 0.85, tip: '一口气敲 10 个' },
  { chapter: 2, name: '稳稳的节奏', goal: 10, pool: 6, speed: 0.8, tip: '不着急，跟着拍子' },

  { chapter: 3, name: '大舞台', goal: 12, pool: 6, speed: 0.75, tip: '舞台亮起来啦' },
  { chapter: 3, name: '快快快', goal: 12, pool: 6, speed: 0.68, tip: '节奏变快啦' },
  { chapter: 3, name: '乐队指挥家', goal: 14, pool: 6, speed: 0.62, tip: '敲满 14 个音符' },
  { chapter: 3, name: '音乐会', goal: 16, pool: 6, speed: 0.56, tip: '最后一场音乐会' },
]

const CONFIG = {
  id: 'band',
  name: '小小乐队',
  title: '小小乐队',
  titleColors: ['#E9584A', '#E59313', '#2C9B63', '#3478D4'],
  kicker: '敲一敲',
  tagline: '看乐谱 · 敲乐器',
  startLabel: '开始演奏',
  loadingText: '乐器正在调音…',
  ageText: '给 4-9 岁的小音乐家',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小乌龟',
  iconText: '♪',
  meterIcon: '♪',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '练习' }, { short: '合奏' }, { short: '舞台' }, { short: '音乐会' }],
  storageKey: 'kids-band-progress-v1',
  audioPath: '/static/audio/band/',
  bgm: 'bgm.mp3',
  sfx: {
    drum: 'drum.mp3', xylophone: 'xylophone.mp3', bell: 'bell.mp3',
    maracas: 'maracas.mp3', tambourine: 'tambourine.mp3', trumpet: 'trumpet.mp3',
    star: 'star.mp3', level: 'level.mp3', celebrate: 'celebrate.mp3',
    friend: 'friend.mp3', ui: 'ui.mp3', pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/turtle.png',
    drum: '/static/img/instruments/drum.png',
    xylophone: '/static/img/instruments/xylophone.png',
    bell: '/static/img/instruments/bell.png',
    maracas: '/static/img/instruments/maracas.png',
    tambourine: '/static/img/instruments/tambourine.png',
    trumpet: '/static/img/instruments/trumpet.png',
  },
}

export class BandGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildStage()
  }

  buildStage() {
    const rng = mulberry32(this.level * 7919 + 41)
    this.stageLights = Array.from({ length: 3 }, (_, index) => ({
      x: 0.18 + index * 0.32, color: ['#FFB0B8', '#BEE7FF', '#FFE08A'][index],
      phase: rng() * Math.PI * 2, sway: 0.4 + rng() * 0.3,
    }))
    this.stageStars = Array.from({ length: 18 }, () => ({
      x: rng(), y: 0.06 + rng() * 0.3, phase: rng() * Math.PI * 2, r: 1 + rng() * 1.6,
    }))
  }

  beginLevel(level, runStart) {
    this.buildStage()
    super.beginLevel(level, runStart)
  }

  resetLevelData() {
    super.resetLevelData()
    this.sequence = []
    this.step = 0
    this.beatTimer = 0
    this.beatIndex = 0
    this.padFlash = {}
    this.padHitAt = {}
    this.metronomePhase = 0
    this.wrongAt = 0
    this.wrongPad = null
    this.streak = 0
    this.bestStreak = 0
    this.playingSolo = false
    this.soloIndex = 0
    this.soloTimer = 0
    this.sparkleAt = 0
  }

  setupLevel(cfg) {
    this.sequence = this.makeSequence(cfg)
    this.step = 0
    this.streak = 0
    this.padFlash = {}
    this.padHitAt = {}
    this.wrongAt = 0
    this.wrongPad = null
    this.playingSolo = false
    this.soloIndex = 0
    this.soloTimer = 0
    this.beatLength = cfg.speed || 0
    this.beatTimer = 0.9
    this.beatIndex = 0
    this.buildPads(cfg.pool)
  }

  makeSequence(cfg) {
    const pool = INSTRUMENTS.slice(0, cfg.pool)
    const sequence = []
    let previous = ''
    for (let i = 0; i < cfg.goal; i += 1) {
      let pick = pool[Math.floor(Math.random() * pool.length)]
      let guard = 0
      while (pick.id === previous && cfg.pool > 1 && guard < 8) {
        pick = pool[Math.floor(Math.random() * pool.length)]
        guard += 1
      }
      sequence.push(pick.id)
      previous = pick.id
    }
    return sequence
  }

  buildPads(count) {
    const top = this.hudBottom + 116
    const bottom = this.h - this.safeBottom - 18
    const areaH = bottom - top
    const columns = count <= 2 ? 2 : 3
    const rows = Math.ceil(count / columns)
    const gap = clamp(this.w * 0.032, 8, 13)
    const areaW = this.w - 28
    let size = Math.min((areaW - gap * (columns - 1)) / columns, 200)
    size = Math.min(size, (areaH - gap * (rows - 1)) / rows)
    const gridW = columns * size + (columns - 1) * gap
    const gridH = rows * size + (rows - 1) * gap
    const originX = (this.w - gridW) / 2
    const originY = top + Math.max(0, (areaH - gridH) * 0.72)
    this.pads = INSTRUMENTS.slice(0, count).map((instrument, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      return {
        ...instrument,
        x: originX + col * (size + gap),
        y: originY + row * (size + gap),
        w: size,
        h: size,
      }
    })
  }

  getObjectiveText() {
    return '音符 ' + this.step + '/' + this.goal
  }

  drawGameOverlays() {
    // 乐器面板几乎占满下半屏，横幅会挡住按键，因此只保留提示气泡。
    if (!this.hintSeen && this.time < this.hintUntil) this.drawHintBubble()
    this.drawExtraOverlays()
  }

  drawHintBubble() {
    const ctx = this.ctx
    const alpha = clamp(Math.min(1, (this.hintUntil - this.time) / 0.5), 0, 1)
    const text = this.getStartHint()
    setFont(ctx, 12, 800)
    const w = Math.min(this.w - 24, ctx.measureText(text).width + 62)
    const x = (this.w - w) / 2
    // 提示放在乐谱条与乐器按键之间，不遮挡要敲的键，也不压住幕布上的伙伴。
    const padTop = (this.pads && this.pads.length) ? this.pads[0].y : this.h * 0.6
    const y = clamp(padTop - 64, this.hudBottom + 96, padTop - 56)
    ctx.save()
    ctx.globalAlpha = alpha
    fillRound(ctx, x, y + 4, w, 42, 21, 'rgba(80,52,28,0.12)')
    fillRound(ctx, x, y, w, 42, 21, 'rgba(255,250,238,0.96)')
    strokeRound(ctx, x, y, w, 42, 21, '#FFFFFF', 2)
    fillRound(ctx, x + 6, y + 6, 30, 30, 15, '#FFE7B6')
    this.drawHandIcon(x + 21, y + 21)
    drawLabel(ctx, text, x + 44 + (w - 44) / 2, y + 21, 12, '#75563F', 800)
    ctx.restore()
  }

  getStartHint() {
    return '看乐谱，按顺序敲'
  }

  getResultLines() {
    return {
      title: this.celebrateFinal ? '音乐会圆满！' : '真好听！',
      tip: '你和乐队一起演奏了 ' + this.sequence.length + ' 个音符，小乌龟都跳起舞来啦。',
      scoreText: '完成 ' + this.sequence.length + ' 个音符 · 最长连奏 ' + (this.bestStreak || 0),
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    drawLabel(ctx, '♪', cx, cy - 1, 17, '#E06C9F', 900)
    ctx.restore()
  }

  updatePlay(dt) {
    const pads = this.pads || []
    pads.forEach((pad) => {
      const flash = this.padFlash[pad.id]
      if (flash) {
        flash.glow = Math.max(0, flash.glow - dt * 4)
        flash.press = Math.max(0, flash.press - dt * 6)
      }
    })
    if (this.beatLength && !this.playingSolo && this.sequence.length) {
      this.beatTimer -= dt
      if (this.beatTimer <= 0) {
        this.beatTimer = this.beatLength
        this.beatIndex = (this.beatIndex + 1) % 4
        this.metronomePhase = 1
      }
    }
    if (this.metronomePhase > 0) this.metronomePhase = Math.max(0, this.metronomePhase - dt * 3)
    if (this.playingSolo) {
      this.soloTimer -= dt
      if (this.soloTimer <= 0) {
        const key = this.sequence[this.soloIndex]
        const pad = this.pads.find((item) => item.id === key)
        if (pad) this.playPad(pad, true)
        this.addFloater('♪', (pad ? pad.x + pad.w / 2 : this.w / 2), (pad ? pad.y : this.h * 0.5) - 12, '#E06C9F')
        this.soloIndex += 1
        this.soloTimer = 0.34
        if (this.soloIndex >= this.sequence.length) {
          this.playingSolo = false
          this.finishRound(0.7)
        }
      }
    }
  }

  updateClear(dt) {
    const pads = this.pads || []
    pads.forEach((pad) => {
      const flash = this.padFlash[pad.id]
      if (flash) flash.glow = Math.max(0, flash.glow - dt * 2)
    })
  }

  onTapInPlay(x, y) {
    if (this.playingSolo) return
    const pads = this.pads || []
    for (let i = pads.length - 1; i >= 0; i -= 1) {
      const pad = pads[i]
      if (x >= pad.x && x <= pad.x + pad.w && y >= pad.y && y <= pad.y + pad.h) {
        this.tapPad(pad)
        return
      }
    }
  }

  tapPad(pad) {
    const required = this.sequence[this.step]
    if (!required) return
    if (pad.id === required) {
      this.step += 1
      this.streak += 1
      this.bestStreak = Math.max(this.bestStreak || 0, this.streak)
      this.score = this.step
      this.progress = this.step
      this.playPad(pad, false)
      this.padFlash[pad.id] = { glow: 1, press: 1 }
      this.sparkleAt = this.time + 0.3
      this.burstNotes(pad, this.streak >= 4 ? 12 : 8)
      if (this.streak >= 4 && this.streak % 4 === 0) {
        this.audio.play('star')
        this.addFloater('连奏 ×' + this.streak, pad.x + pad.w / 2, pad.y - 16, '#C76BB2')
        this.burstConfetti(14)
      }
      if (this.step >= this.sequence.length) {
        this.playingSolo = true
        this.soloIndex = 0
        this.soloTimer = 0.55
      }
    } else {
      this.streak = 0
      this.wrongAt = this.time + 0.5
      this.wrongPad = pad.id
      this.hudShakeUntil = this.time + 0.22
      this.playPad(pad, true)
      this.audio.play('nope')
      this.addFloater('先敲' + this.instrumentName(required), this.w / 2, this.h * 0.42, '#B5623E')
    }
  }

  instrumentName(id) {
    const found = INSTRUMENTS.find((item) => item.id === id)
    return found ? found.name : ''
  }

  playPad(pad, quiet) {
    this.audio.play(pad.id)
    if (!quiet) this.padFlash[pad.id] = { glow: 1, press: 1 }
  }

  burstNotes(pad, count) {
    const notes = ['♪', '♫', '♬']
    const colors = ['#FF9FB4', '#FFC145', '#7BD88F', '#5CC8FF', '#B08CFF']
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        type: 'note', x: pad.x + pad.w / 2 + rand(-pad.w * 0.3, pad.w * 0.3),
        y: pad.y + pad.h * 0.4, vx: rand(-50, 50), vy: rand(-150, -60),
        gravity: 90, size: rand(11, 18), color: colors[i % colors.length],
        life: rand(0.6, 1), max: 1, rotation: rand(-0.3, 0.3), spin: rand(-1.5, 1.5),
        text: notes[i % notes.length],
      })
    }
    for (let i = 0; i < 5; i += 1) {
      this.particles.push({
        type: 'sparkle', x: pad.x + pad.w / 2 + rand(-pad.w * 0.35, pad.w * 0.35),
        y: pad.y + pad.h * 0.5 + rand(-pad.h * 0.3, pad.h * 0.3),
        vx: rand(-60, 60), vy: rand(-80, 10), gravity: 140, size: rand(3, 6),
        color: '#FFFFFF', life: rand(0.4, 0.7), max: 0.7, rotation: 0, spin: 0,
      })
    }
  }

  drawWorld() {
    const ctx = this.ctx
    const W = this.w
    const H = this.h
    const chapter = this.levelConfig.chapter || 0
    const night = chapter >= 2

    const sky = ctx.createLinearGradient(0, 0, 0, H)
    if (night) {
      sky.addColorStop(0, '#3B3F6E')
      sky.addColorStop(0.55, '#6C5A96')
      sky.addColorStop(1, '#9A6E86')
    } else {
      sky.addColorStop(0, '#C8EEFF')
      sky.addColorStop(0.55, '#E8F7FF')
      sky.addColorStop(1, '#FFF1D8')
    }
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    if (night) {
      this.stageStars.forEach((star) => {
        ctx.globalAlpha = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(this.time * 1.4 + star.phase))
        ctx.fillStyle = '#FFF6D5'
        ctx.beginPath()
        ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
    }

    this.stageLights.forEach((light) => {
      const sway = Math.sin(this.time * light.sway + light.phase) * 0.12
      ctx.save()
      ctx.globalAlpha = night ? 0.2 : 0.14
      ctx.fillStyle = light.color
      ctx.beginPath()
      ctx.moveTo(W * light.x, 0)
      ctx.lineTo(W * (light.x + 0.1), 0)
      ctx.lineTo(W * (light.x + 0.36 + sway), H * 0.86)
      ctx.lineTo(W * (light.x - 0.18 + sway), H * 0.86)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    })

    // curtain
    const curtainH = clamp(H * 0.09, 44, 70)
    const curtainTop = H - curtainH
    ctx.fillStyle = night ? '#6E3F70' : '#E4647C'
    ctx.beginPath()
    ctx.moveTo(0, curtainTop)
    ctx.bezierCurveTo(W * 0.24, curtainTop - 16, W * 0.5, curtainTop + 12, W * 0.72, curtainTop - 4)
    ctx.bezierCurveTo(W * 0.86, curtainTop - 12, W * 0.94, curtainTop + 6, W, curtainTop)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fill()
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      ctx.moveTo(W * (0.04 + i * 0.22), curtainTop + 2)
      ctx.lineTo(W * (0.12 + i * 0.22), curtainTop + 2)
      ctx.lineTo(W * (0.2 + i * 0.22), H)
      ctx.lineTo(W * (0.08 + i * 0.22), H)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    if (this.state !== 'start' && this.state !== 'loading' && this.images.host) {
      const size = clamp(W * 0.19, 58, 84)
      const bob = Math.sin(this.time * 2.4) * 5
      const dance = Math.sin(this.time * 3.2) * 0.08
      ctx.save()
      ctx.translate(W - size * 0.62 - 2, curtainTop - size * 0.42 + bob)
      ctx.rotate(dance)
      ctx.drawImage(this.images.host, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  drawHostBackdrop(center, bottom, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = 0.65
    ctx.beginPath()
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2
      ctx.fillStyle = ['#FFB0B8', '#BEE7FF', '#FFE08A'][i % 3]
      ctx.beginPath()
      ctx.moveTo(center, bottom - size * 0.42)
      ctx.lineTo(center + Math.cos(angle - 0.18) * size * 0.85, bottom - size * 0.42 + Math.sin(angle - 0.18) * size * 0.85)
      ctx.lineTo(center + Math.cos(angle + 0.18) * size * 0.85, bottom - size * 0.42 + Math.sin(angle + 0.18) * size * 0.85)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  drawActors() {
    if (this.state !== 'playing' && this.state !== 'paused') return
    this.drawScore()
    this.drawPads()
  }

  drawScore() {
    const ctx = this.ctx
    const padTop = (this.pads && this.pads.length) ? this.pads[0].y : this.h * 0.5
    // 乐谱条放在目标条与乐器之间，竖向留白均匀
    const y = clamp((this.hudBottom + padTop) / 2 - 22, this.hudBottom + 14, padTop - 60)
    const width = Math.min(this.w - 28, 340)
    const x = (this.w - width) / 2
    const height = 44
    fillRound(ctx, x, y + 3, width, height, 16, 'rgba(88,57,31,0.12)')
    fillRound(ctx, x, y, width, height, 16, 'rgba(255,250,242,0.97)')
    strokeRound(ctx, x, y, width, height, 16, '#FFFFFF', 2)

    const visible = 7
    const start = Math.max(0, Math.min(this.step - 2, this.sequence.length - visible))
    const slice = this.sequence.slice(start, start + visible)
    const slot = (width - 24) / visible
    slice.forEach((id, index) => {
      const absolute = start + index
      const cx = x + 12 + slot * (index + 0.5)
      const cy = y + height / 2
      const done = absolute < this.step
      const current = absolute === this.step
      if (current) {
        ctx.save()
        ctx.globalAlpha = 0.36 + 0.22 * Math.sin(this.time * 6)
        fillRound(ctx, cx - slot / 2 + 2, cy - 17, slot - 4, 34, 11, '#FFE3A8')
        ctx.restore()
        ctx.strokeStyle = '#F2B23F'
        ctx.lineWidth = 2
        roundedPath(ctx, cx - slot / 2 + 2, cy - 17, slot - 4, 34, 11)
        ctx.stroke()
      }
      const image = this.images[id]
      const iconSize = Math.min(30, slot * 0.78)
      ctx.save()
      ctx.globalAlpha = done ? 0.32 : current ? 1 : 0.72
      if (image) {
        ctx.drawImage(image, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize)
      } else {
        ctx.fillStyle = '#F2B93B'
        ctx.beginPath()
        ctx.arc(cx, cy, iconSize * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      if (done) {
        ctx.strokeStyle = 'rgba(88,171,111,0.9)'
        ctx.lineWidth = 2.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx - 2, cy)
        ctx.lineTo(cx + 3, cy + 5)
        ctx.lineTo(cx + 9, cy - 6)
        ctx.stroke()
      }
      if (index < slice.length - 1) {
        ctx.strokeStyle = 'rgba(150,119,88,0.28)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cx + slot / 2, cy - 7)
        ctx.lineTo(cx + slot / 2, cy + 7)
        ctx.stroke()
      }
    })
  }

  drawPads() {
    const ctx = this.ctx
    const pads = this.pads || []
    const current = this.sequence[this.step]
    pads.forEach((pad) => {
      const flash = this.padFlash[pad.id] || { glow: 0, press: 0 }
      const press = flash.press
      const lift = press > 0 ? press * 4 : 0
      const isNext = !this.playingSolo && pad.id === current
      const isWrong = this.wrongPad === pad.id && this.time < this.wrongAt
      const x = pad.x
      const y = pad.y + lift
      const size = pad.w

      ctx.save()
      if (isNext) {
        ctx.save()
        ctx.globalAlpha = 0.35 + 0.22 * Math.sin(this.time * 5)
        fillRound(ctx, x - 6, y - 6, size + 12, size + 12, size * 0.3, '#FFD166')
        ctx.restore()
      }
      fillRound(ctx, x, y + 6, size, size, size * 0.26, 'rgba(70,45,26,0.2)')
      const grad = ctx.createLinearGradient(0, y, 0, y + size)
      if (isWrong) {
        grad.addColorStop(0, '#FFD3CE')
        grad.addColorStop(1, '#FFB3AA')
      } else {
        grad.addColorStop(0, pad.tint)
        grad.addColorStop(1, '#FFFFFF')
      }
      fillRound(ctx, x, y, size, size, size * 0.26, grad)
      strokeRound(ctx, x, y, size, size, size * 0.26, isNext ? '#F2B23F' : '#FFFFFF', isNext ? 3.5 : 3)
      if (flash.glow > 0) {
        ctx.save()
        ctx.globalAlpha = flash.glow * 0.5
        fillRound(ctx, x, y, size, size, size * 0.26, pad.color)
        ctx.restore()
      }
      const image = this.images[pad.id]
      const iconSize = size * 0.58
      if (image) {
        ctx.drawImage(image, x + (size - iconSize) / 2, y + size * 0.12, iconSize, iconSize)
      }
      drawLabel(ctx, pad.name, x + size / 2, y + size * 0.84, Math.min(12, size * 0.12), '#6E513A', 800)
      ctx.restore()
    })

    if (this.beatLength && this.metronomePhase > 0 && !this.playingSolo) {
      const cx = this.w / 2
      const cy = this.hudBottom + 46
      ctx.save()
      ctx.globalAlpha = this.metronomePhase * 0.7
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  drawExtraHud(y) {
    const ctx = this.ctx
    if (this.streak >= 2) {
      drawLabel(ctx, '连奏 ×' + this.streak, this.w - 22, y + 6, 11, '#C76BB2', 900, 'right')
    }
  }

  drawExtraOverlays() {
    const ctx = this.ctx
    if (this.playingSolo) {
      const text = '一起合奏！'
      setFont(ctx, 15, 900)
      const width = ctx.measureText(text).width + 40
      const x = (this.w - width) / 2
      const y = this.h * 0.235
      ctx.save()
      fillRound(ctx, x, y + 3, width, 34, 17, 'rgba(201,98,51,0.25)')
      fillRound(ctx, x, y, width, 34, 17, '#F9A94A')
      strokeRound(ctx, x, y, width, 34, 17, '#FFFFFF', 2)
      drawLabel(ctx, text, this.w / 2, y + 17, 15, '#FFFFFF', 900)
      ctx.restore()
    }
  }

  drawEffects() {
    const ctx = this.ctx
    this.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      if (particle.type === 'sparkle') {
        drawSparkle(ctx, particle.x, particle.y, particle.size, particle.color)
      } else if (particle.type === 'note') {
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        drawLabel(ctx, particle.text || '♪', 0, 0, particle.size, particle.color, 900)
      } else {
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    })
    this.floaters.forEach((floater) => {
      const alpha = clamp(floater.life / floater.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      setFont(ctx, clamp(this.w * 0.054, 17, 23), 900)
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

  debugState() {
    return {
      ...super.debugState(),
      step: this.step,
      sequence: this.sequence.slice(),
      next: this.sequence[this.step] || null,
      streak: this.streak,
      solo: this.playingSolo,
      pads: (this.pads || []).map((pad) => pad.id),
    }
  }

  debugTapNext() {
    if (this.state !== 'playing' || this.gameMode !== 'ready' || this.playingSolo) return false
    const next = this.sequence[this.step]
    if (!next) return false
    const pad = (this.pads || []).find((item) => item.id === next)
    if (!pad) return false
    this.tapPad(pad)
    return true
  }

  debugFinishLevel() {
    let guard = 0
    while (this.state === 'playing' && this.gameMode === 'ready' && guard < 80) {
      if (this.playingSolo) break
      this.debugTapNext()
      guard += 1
    }
    return true
  }
}
