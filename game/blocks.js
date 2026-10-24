import {
  BaseGame, clamp, rand, drawSparkle, setFont, drawLabel, fillRound, strokeRound,
  roundedPath, mulberry32,
} from './engine.js'

// 积木拼图：小方块自己往下掉，铺满一整行就会消失。
// 堆得太高时彩虹魔法会帮忙清掉底下几行——没有失败，只会重新整理一下场地。

const LEVELS = [
  { chapter: 0, name: '第一堆积木', tip: '铺满一整行就会消失', goal: 3, cols: 6, rows: 10, speed: 0.85 },
  { chapter: 0, name: '再来一行', tip: '左右移动小方块', goal: 3, cols: 6, rows: 10, speed: 0.95 },
  { chapter: 0, name: '转一转', tip: '按中间的按钮转方向', goal: 4, cols: 6, rows: 10, speed: 1.0 },
  { chapter: 0, name: '小花园', tip: '铺满 4 行', goal: 4, cols: 6, rows: 10, speed: 1.08 },

  { chapter: 1, name: '积木果园', tip: '积木会掉得快一点', goal: 5, cols: 6, rows: 11, speed: 1.18 },
  { chapter: 1, name: '稳稳放好', tip: '慢慢放，不着急', goal: 5, cols: 7, rows: 11, speed: 1.25 },
  { chapter: 1, name: '七列积木', tip: '场地变宽啦', goal: 6, cols: 7, rows: 11, speed: 1.32 },
  { chapter: 1, name: '一层一层', tip: '铺满 6 行', goal: 6, cols: 7, rows: 11, speed: 1.4 },

  { chapter: 2, name: '晚霞积木', tip: '方块变快啦', goal: 7, cols: 7, rows: 12, speed: 1.5 },
  { chapter: 2, name: '高高低低', tip: '看清落点再放', goal: 7, cols: 8, rows: 12, speed: 1.58 },
  { chapter: 2, name: '积木塔', tip: '场地又高了一点', goal: 8, cols: 8, rows: 12, speed: 1.66 },
  { chapter: 2, name: '彩虹堆', tip: '铺满 8 行', goal: 8, cols: 8, rows: 12, speed: 1.74 },

  { chapter: 3, name: '星空积木', tip: '方块掉得真快', goal: 9, cols: 8, rows: 13, speed: 1.86 },
  { chapter: 3, name: '小小建筑师', tip: '一步一步来', goal: 9, cols: 8, rows: 13, speed: 1.96 },
  { chapter: 3, name: '积木大师', tip: '铺满 10 行', goal: 10, cols: 8, rows: 13, speed: 2.06 },
  { chapter: 3, name: '积木城堡', tip: '最后一段，加油', goal: 11, cols: 8, rows: 13, speed: 2.16 },
]

// 每种积木一组糖果色：浅色填面、深色描边。
const BLOCK_COLORS = [
  ['#FFD7E2', '#F58CAF'],
  ['#C7ECFB', '#74C7E8'],
  ['#FFE7AE', '#F2B23F'],
  ['#CDEFC0', '#7FCC6E'],
  ['#DCD2FB', '#9B85E0'],
  ['#FFD9C2', '#EF9A63'],
]

// cells 用 [列, 行] 表示，形状在生成时随机旋转。
const SHAPES = [
  { color: 0, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { color: 1, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { color: 2, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  { color: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
  { color: 4, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { color: 5, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
]

const CONFIG = {
  id: 'blocks',
  name: '积木拼图',
  title: '积木拼图',
  titleColors: ['#E9584A', '#E59313', '#2C9B63', '#3478D4'],
  kicker: '搭一搭',
  tagline: '放积木 · 铺满行',
  startLabel: '开始搭积木',
  loadingText: '积木正在排队…',
  ageText: '给 4-9 岁的小建筑师',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小浣熊',
  iconText: '▦',
  meterIcon: '▦',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '草地' }, { short: '果园' }, { short: '晚霞' }, { short: '星空' }],
  storageKey: 'kids-blocks-progress-v1',
  audioPath: '/static/audio/blocks/',
  bgm: 'bgm.mp3',
  sfx: {
    move: 'move.mp3', rotate: 'rotate.mp3', lock: 'lock.mp3', clearline: 'clearline.mp3',
    magic: 'magic.mp3', star: 'star.mp3', level: 'level.mp3', celebrate: 'celebrate.mp3',
    friend: 'friend.mp3', ui: 'ui.mp3', pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/raccoon.png',
  },
}

const SKIES = [
  ['#A9E4FF', '#FFF3D3', '#C7EDB4'],
  ['#9EDCFF', '#FFEFC8', '#BCE49A'],
  ['#8395E0', '#FFB79B', '#FFE8C2'],
  ['#3D477E', '#6D69A2', '#8A76B4'],
]

export class BlocksGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildScenery()
  }

  buildScenery() {
    const rng = mulberry32(this.level * 7919 + 41)
    this.sceneClouds = Array.from({ length: 4 }, () => ({
      x: rng(), y: 0.06 + rng() * 0.16, s: 0.6 + rng() * 0.7,
    }))
    this.sceneFlowers = Array.from({ length: 10 }, () => ({
      x: rng(), y: 0.9 + rng() * 0.08, s: 0.7 + rng() * 0.5,
      color: ['#FFB7C5', '#FFF6D8', '#FFD86B', '#C9E8FF'][Math.floor(rng() * 4)],
    }))
  }

  beginLevel(level, runStart) {
    this.buildScenery()
    // 天空渐变按章节缓存，换关时必须丢弃，否则晚霞关会沿用草地关的颜色。
    this.skyGradient = null
    super.beginLevel(level, runStart)
  }

  resetLevelData() {
    super.resetLevelData()
    this.board = []
    this.piece = null
    this.fallAcc = 0
    this.holdId = null
    this.holdTimer = 0
    this.clearing = false
    this.magicAt = 0
    this.lockedCount = 0
  }

  setupLevel(cfg) {
    this.goal = cfg.goal
    this.cols = cfg.cols
    this.rows = cfg.rows
    this.fallSpeed = cfg.speed
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null))
    this.piece = null
    this.fallAcc = 0
    this.clearing = false
    this.lockedCount = 0
    this.buildGeometry()
    this.spawnPiece()
  }

  buildGeometry() {
    const top = this.hudBottom + 62
    const bottom = this.h - this.safeBottom - 104
    const areaH = bottom - top
    const areaW = Math.min(this.w - 26, 360)
    const cell = Math.min(areaW / this.cols, areaH / this.rows)
    const gridW = cell * this.cols
    const gridH = cell * this.rows
    this.cell = cell
    this.gridX = (this.w - gridW) / 2
    this.gridY = top + Math.max(0, (areaH - gridH) / 2)
    this.gridW = gridW
    this.gridH = gridH
    this.controlY = this.h - this.safeBottom - 48
  }

  getObjectiveText() {
    return '铺满 ' + this.progress + '/' + this.goal + ' 行'
  }

  getStartHint() {
    return '铺满一整行就会消失'
  }

  drawGameOverlays() {
    // 场地几乎占满屏幕中部，关卡横幅会挡住正在下落的对象，只保留首次提示气泡。
    if (!this.hintSeen && this.time < this.hintUntil) this.drawHintBubble()
  }

  drawHintBubble() {
    const ctx = this.ctx
    const alpha = clamp(Math.min(1, (this.hintUntil - this.time) / 0.5), 0, 1)
    const text = this.getStartHint()
    setFont(ctx, 12, 800)
    const w = Math.min(this.w - 24, ctx.measureText(text).width + 62)
    const x = (this.w - w) / 2
    const y = this.hudBottom + 14
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

  getResultLines() {
    return {
      title: this.celebrateFinal ? '积木城堡！' : '搭得真好！',
      tip: '你铺满了 ' + this.goal + ' 行积木，小浣熊把城堡拍下来啦。',
      scoreText: '铺满 ' + this.progress + ' 行 · 积木 ' + (this.lockedCount || 0) + ' 块',
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    fillRound(ctx, cx - 7, cy - 7, 14, 14, 4, '#FFE1A8')
    strokeRound(ctx, cx - 7, cy - 7, 14, 14, 4, '#E5A93B', 2)
    fillRound(ctx, cx - 3, cy - 3, 6, 6, 2, '#E5A93B')
    ctx.restore()
  }

  // —— 玩法 ——

  spawnPiece() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
    let cells = shape.cells.map((cell) => [cell[0], cell[1]])
    const turns = Math.floor(Math.random() * 4)
    for (let i = 0; i < turns; i += 1) cells = rotateCells(cells)
    const width = Math.max(...cells.map((cell) => cell[0])) + 1
    const piece = {
      cells,
      color: shape.color,
      x: Math.floor((this.cols - width) / 2),
      y: 0,
    }
    if (this.collides(piece.cells, piece.x, piece.y)) {
      this.magicClear('彩虹魔法来帮忙')
      piece.y = 0
      if (this.collides(piece.cells, piece.x, piece.y)) {
        this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null))
      }
    }
    this.piece = piece
    this.fallAcc = 0
  }

  collides(cells, originX, originY) {
    for (const cell of cells) {
      const x = originX + cell[0]
      const y = originY + cell[1]
      if (x < 0 || x >= this.cols || y >= this.rows) return true
      if (y >= 0 && this.board[y][x] !== null) return true
    }
    return false
  }

  movePiece(dx) {
    if (!this.piece) return false
    if (this.collides(this.piece.cells, this.piece.x + dx, this.piece.y)) return false
    this.piece.x += dx
    this.audio.play('move')
    this.hintSeen = true
    return true
  }

  rotatePiece() {
    if (!this.piece) return
    const rotated = rotateCells(this.piece.cells)
    const kicks = [0, -1, 1, -2, 2]
    for (const kick of kicks) {
      if (!this.collides(rotated, this.piece.x + kick, this.piece.y)) {
        this.piece.cells = rotated
        this.piece.x += kick
        this.audio.play('rotate')
        return
      }
    }
    this.audio.play('nope')
  }

  stepDown() {
    if (!this.piece) return
    if (!this.collides(this.piece.cells, this.piece.x, this.piece.y + 1)) {
      this.piece.y += 1
      return
    }
    this.lockPiece()
  }

  lockPiece() {
    const piece = this.piece
    if (!piece) return
    let locked = 0
    piece.cells.forEach((cell) => {
      const x = piece.x + cell[0]
      const y = piece.y + cell[1]
      if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        this.board[y][x] = piece.color
        locked += 1
      }
    })
    this.lockedCount = (this.lockedCount || 0) + locked
    this.piece = null
    this.audio.play('lock')
    this.clearRows()
    if (this.state === 'playing' && this.gameMode === 'ready' && !this.finishing) this.spawnPiece()
  }

  clearRows() {
    const full = []
    for (let y = 0; y < this.rows; y += 1) {
      if (this.board[y].every((cell) => cell !== null)) full.push(y)
    }
    if (!full.length) return
    this.audio.play('clearline')
    full.forEach((row) => {
      const cy = this.gridY + row * this.cell + this.cell / 2
      for (let x = 0; x < this.cols; x += 1) {
        const cx = this.gridX + x * this.cell + this.cell / 2
        this.addParticle('sparkle', cx, cy, BLOCK_COLORS[this.board[row][x]][1], rand(3, 6), rand(0.4, 0.8))
      }
    })
    // 从下往上删除，行号不会错位。
    full.sort((a, b) => b - a).forEach((row) => {
      this.board.splice(row, 1)
      this.board.unshift(Array(this.cols).fill(null))
    })
    this.progress = Math.min(this.goal, this.progress + full.length)
    this.score = this.progress
    this.addFloater('+' + full.length + ' 行', this.w / 2, this.gridY - 8, '#E07A3B')
    if (full.length > 1) {
      this.audio.play('star')
      this.burstConfetti(18)
    }
    if (this.progress >= this.goal) this.finishRound(0.6)
  }

  // 堆到顶时不清空进度，只把底部几行变成彩带飞走。
  magicClear(text) {
    this.magicAt = this.time + 0.6
    this.audio.play('magic')
    this.showToast(text, 1.8)
    const rowsToClear = Math.min(4, Math.max(2, Math.floor(this.rows / 3)))
    for (let i = 0; i < rowsToClear; i += 1) {
      const row = this.rows - 1 - i
      for (let x = 0; x < this.cols; x += 1) {
        const value = this.board[row][x]
        if (value === null) continue
        const cx = this.gridX + x * this.cell + this.cell / 2
        const cy = this.gridY + row * this.cell + this.cell / 2
        this.addParticle('sparkle', cx, cy, BLOCK_COLORS[value][1], rand(4, 7), rand(0.6, 1.1))
        this.board[row][x] = null
      }
    }
    this.audio.play('star')
  }

  updatePlay(dt) {
    if (!this.piece) this.spawnPiece()
    this.handleHeldButtons(dt)
    if (!this.piece) return
    this.fallAcc += this.fallSpeed * dt
    while (this.fallAcc >= 1 && this.piece) {
      this.fallAcc -= 1
      this.stepDown()
    }
  }

  handleHeldButtons(dt) {
    if (this.pressedId !== this.holdId) {
      this.holdId = this.pressedId
      this.holdTimer = 'fresh'
    }
    if (this.holdId !== 'blocks-left' && this.holdId !== 'blocks-right') return
    const dir = this.holdId === 'blocks-left' ? -1 : 1
    if (this.holdTimer === 'fresh') {
      // 刚按下先挪一格，短按也能立刻看到反应；之后按 0.28 秒延迟连发。
      this.holdTimer = 0.28
      this.movePiece(dir)
      return
    }
    this.holdTimer -= dt
    if (this.holdTimer > 0) return
    this.holdTimer = 0.12
    this.movePiece(dir)
  }

  updateClear(dt) {
    // 过关时撒花由基类处理，这里不需要额外推进。
  }

  onTapInPlay(x, y) {
    // 点场地里的积木不会做任何事，避免小朋友误触；只响应下方三个大按钮。
    if (y > this.gridY + this.gridH) this.hintSeen = true
  }

  activateExtra(id) {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return
    if (id === 'blocks-rotate') this.rotatePiece()
  }

  // —— 绘制 ——

  drawWorld() {
    const ctx = this.ctx
    const W = this.w
    const H = this.h
    const chapter = this.levelConfig.chapter || 0
    const night = chapter === 3
    const skyColors = SKIES[chapter % SKIES.length]
    if (!this.skyGradient) {
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, skyColors[0])
      sky.addColorStop(0.6, skyColors[1])
      sky.addColorStop(1, skyColors[2])
      this.skyGradient = sky
    }
    ctx.fillStyle = this.skyGradient
    ctx.fillRect(0, 0, W, H)

    if (night) {
      for (let i = 0; i < 30; i += 1) {
        const x = (i * 137.5) % W
        const y = (i * 71.3) % (H * 0.5)
        ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.time * 1.6 + i))
        ctx.fillStyle = '#FFF6D5'
        ctx.beginPath()
        ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    } else {
      ctx.save()
      ctx.globalAlpha = 0.85
      ctx.fillStyle = '#FFE07A'
      ctx.beginPath()
      ctx.arc(W * 0.82, this.safeTop + 52, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    this.sceneClouds.forEach((cloud) => {
      const x = cloud.x * W
      const y = cloud.y * H
      const s = cloud.s * clamp(W / 390, 0.8, 1.2)
      ctx.save()
      ctx.globalAlpha = night ? 0.25 : 0.78
      ctx.fillStyle = night ? '#DCD6FF' : '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x - 30 * s, y + 6 * s, 17 * s, 0, Math.PI * 2)
      ctx.arc(x - 5 * s, y, 24 * s, 0, Math.PI * 2)
      ctx.arc(x + 24 * s, y + 6 * s, 19 * s, 0, Math.PI * 2)
      ctx.rect(x - 38 * s, y + 6 * s, 70 * s, 20 * s)
      ctx.fill()
      ctx.restore()
    })

    const groundY = H - clamp(H * 0.07, 40, 62)
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.bezierCurveTo(W * 0.3, groundY - 14, W * 0.62, groundY + 10, W, groundY - 6)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = night ? '#6F5E9E' : '#A8DF8E'
    ctx.fill()

    this.sceneFlowers.forEach((flower) => {
      const x = flower.x * W
      const y = groundY + 6 + (flower.y - 0.9) * H * 0.4
      const s = flower.s * clamp(W / 390, 0.8, 1.15)
      ctx.save()
      ctx.strokeStyle = night ? '#5C4E85' : '#79C36A'
      ctx.lineWidth = 1.8 * s
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y - 12 * s)
      ctx.stroke()
      ctx.fillStyle = flower.color
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.ellipse(x + Math.cos(angle) * 3.2 * s, y - 12 * s + Math.sin(angle) * 3.2 * s, 2.6 * s, 2 * s, angle, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#F7C948'
      ctx.beginPath()
      ctx.arc(x, y - 12 * s, 2 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  drawActors() {
    this.drawBoard()
    this.drawControls()
  }

  drawBoard() {
    const ctx = this.ctx
    const x = this.gridX
    const y = this.gridY
    const w = this.gridW
    const h = this.gridH
    fillRound(ctx, x - 8, y - 8, w + 16, h + 16, 24, 'rgba(255,250,242,0.72)')
    strokeRound(ctx, x - 8, y - 8, w + 16, h + 16, 24, '#FFFFFF', 3)
    fillRound(ctx, x, y, w, h, 16, 'rgba(255,253,247,0.55)')

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const value = this.board[row][col]
        if (value === null) continue
        this.drawCell(col, row, value, 1)
      }
    }

    if (this.piece) {
      const ghostY = this.ghostRow()
      if (ghostY > this.piece.y) {
        this.piece.cells.forEach((cell) => {
          const col = this.piece.x + cell[0]
          const row = ghostY + cell[1]
          if (row < 0) return
          const px = this.gridX + col * this.cell
          const py = this.gridY + row * this.cell
          ctx.save()
          ctx.globalAlpha = 0.2
          fillRound(ctx, px + 2, py + 2, this.cell - 4, this.cell - 4, this.cell * 0.22, BLOCK_COLORS[this.piece.color][1])
          ctx.restore()
        })
      }
      this.piece.cells.forEach((cell) => {
        const col = this.piece.x + cell[0]
        const row = this.piece.y + cell[1]
        if (row < 0) return
        this.drawCell(col, row, this.piece.color, 1)
      })
    }
  }

  ghostRow() {
    if (!this.piece) return 0
    let drop = 0
    while (!this.collides(this.piece.cells, this.piece.x, this.piece.y + drop + 1) && drop < this.rows) {
      drop += 1
    }
    return this.piece.y + drop
  }

  drawCell(col, row, colorIndex, alpha) {
    const ctx = this.ctx
    const size = this.cell
    const x = this.gridX + col * size
    const y = this.gridY + row * size
    const colors = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length]
    const pad = Math.max(1.5, size * 0.055)
    ctx.save()
    ctx.globalAlpha = alpha
    fillRound(ctx, x + pad, y + pad + 2, size - pad * 2, size - pad * 2, size * 0.22, 'rgba(90,62,43,0.18)')
    fillRound(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.22, colors[0])
    strokeRound(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.22, colors[1], Math.max(1.6, size * 0.055))
    fillRound(ctx, x + pad + size * 0.13, y + pad + size * 0.11, size * 0.3, size * 0.13, size * 0.06, 'rgba(255,255,255,0.6)')
    ctx.restore()
  }

  drawControls() {
    const y = this.controlY
    this.drawControlButton('blocks-left', this.w * 0.2, y, 31, 'left')
    this.drawControlButton('blocks-rotate', this.w * 0.5, y, 34, 'rotate')
    this.drawControlButton('blocks-right', this.w * 0.8, y, 31, 'right')
  }

  drawControlButton(id, cx, cy, r, kind) {
    const ctx = this.ctx
    const pressed = this.pressedId === id
    const offset = pressed ? 3 : 0
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = 'rgba(156,119,82,0.22)'
    ctx.arc(cx, cy + 5, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    if (pressed) ctx.fillStyle = '#FFE9C4'
    else ctx.fillStyle = 'rgba(255,250,242,0.985)'
    ctx.arc(cx, cy + offset, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()
    if (kind === 'rotate') {
      ctx.save()
      ctx.strokeStyle = '#7A573B'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(cx, cy + offset, r * 0.42, -Math.PI * 0.75, Math.PI * 0.65)
      ctx.stroke()
      ctx.fillStyle = '#7A573B'
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.34, cy + offset - r * 0.42)
      ctx.lineTo(cx + r * 0.58, cy + offset - r * 0.16)
      ctx.lineTo(cx + r * 0.24, cy + offset - r * 0.06)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    } else {
      ctx.save()
      ctx.strokeStyle = '#7A573B'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      const dir = kind === 'left' ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(cx - dir * r * 0.34, cy + offset - r * 0.36)
      ctx.lineTo(cx + dir * r * 0.3, cy + offset)
      ctx.lineTo(cx - dir * r * 0.34, cy + offset + r * 0.36)
      ctx.stroke()
      ctx.restore()
    }
    this.buttons.push({ id, x: cx - r - 6, y: cy - r - 6, w: r * 2 + 12, h: r * 2 + 12 })
  }

  drawExtraOverlays() {
    if (this.time < this.magicAt) {
      const ctx = this.ctx
      const alpha = clamp((this.magicAt - this.time) / 0.6, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha * 0.35
      ctx.fillStyle = '#FFE9A8'
      ctx.fillRect(this.gridX - 8, this.gridY - 8, this.gridW + 16, this.gridH + 16)
      ctx.restore()
    }
  }

  debugState() {
    return {
      ...super.debugState(),
      cols: this.cols,
      rows: this.rows,
      falling: !!this.piece,
      filled: this.board.reduce((sum, row) => sum + row.filter((cell) => cell !== null).length, 0),
    }
  }

  debugCompleteRow() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    for (let x = 0; x < this.cols; x += 1) this.board[this.rows - 1][x] = x % BLOCK_COLORS.length
    this.lockedCount = (this.lockedCount || 0) + this.cols
    this.clearRows()
    return true
  }

  debugFinishLevel() {
    let guard = 0
    while (this.state === 'playing' && this.gameMode === 'ready' && !this.finishing && guard < 60) {
      this.debugCompleteRow()
      guard += 1
    }
    return true
  }
}

function rotateCells(cells) {
  const rotated = cells.map((cell) => [cell[1], -cell[0]])
  const minCol = Math.min(...rotated.map((cell) => cell[0]))
  const minRow = Math.min(...rotated.map((cell) => cell[1]))
  return rotated.map((cell) => [cell[0] - minCol, cell[1] - minRow])
}
