import {
  BaseGame, clamp, rand, drawSparkle, fillRound, strokeRound, mulberry32,
} from './engine.js'

// 连线小方块：把两个一样的小方块连起来，中间的路线最多拐两个弯。
// 连不起来只会提示「换一对试试」，不会扣任何东西；没有可连的对子时自动重新排一排。

const LEVELS = [
  { chapter: 0, name: '第一对', tip: '点两个一样的方块', goal: 6, cols: 4, rows: 3, kinds: 3 },
  { chapter: 0, name: '排排坐', tip: '中间的路要空着', goal: 8, cols: 4, rows: 4, kinds: 3 },
  { chapter: 0, name: '五颜六色', tip: '颜色一样才能连', goal: 10, cols: 5, rows: 4, kinds: 4 },
  { chapter: 0, name: '拐个弯', tip: '最多可以拐两个弯', goal: 12, cols: 6, rows: 4, kinds: 4 },

  { chapter: 1, name: '小花园', tip: '慢慢找，不着急', goal: 10, cols: 5, rows: 4, kinds: 4 },
  { chapter: 1, name: '六种图案', tip: '图案变多啦', goal: 12, cols: 6, rows: 4, kinds: 5 },
  { chapter: 1, name: '两排一起连', tip: '连完一对再找下一对', goal: 12, cols: 6, rows: 4, kinds: 5 },
  { chapter: 1, name: '小方阵', tip: '排得满满的', goal: 14, cols: 7, rows: 4, kinds: 5 },

  { chapter: 2, name: '晚霞连线', tip: '图案更多了', goal: 12, cols: 6, rows: 4, kinds: 5 },
  { chapter: 2, name: '六种朋友', tip: '看清图案再连', goal: 12, cols: 6, rows: 4, kinds: 6 },
  { chapter: 2, name: '拐弯高手', tip: '绕一绕也能连上', goal: 14, cols: 7, rows: 4, kinds: 6 },
  { chapter: 2, name: '满屏方块', tip: '不用急，慢慢来', goal: 15, cols: 6, rows: 5, kinds: 6 },

  { chapter: 3, name: '星空连线', tip: '最后一程啦', goal: 14, cols: 7, rows: 4, kinds: 6 },
  { chapter: 3, name: '小星星排排站', tip: '连完就亮起来', goal: 15, cols: 6, rows: 5, kinds: 6 },
  { chapter: 3, name: '连线小达人', tip: '你已经很熟练啦', goal: 16, cols: 8, rows: 4, kinds: 6 },
  { chapter: 3, name: '方块大团圆', tip: '最后一段，加油', goal: 18, cols: 6, rows: 6, kinds: 6 },
]

// 每种图案一种糖果色：同一种图案颜色相同，方便 4 岁小朋友靠颜色也能配对。
const TILE_KINDS = [
  { color: ['#FFD7E2', '#F58CAF'], symbol: 'star' },
  { color: ['#C7ECFB', '#74C7E8'], symbol: 'heart' },
  { color: ['#FFE7AE', '#F2B23F'], symbol: 'circle' },
  { color: ['#CDEFC0', '#7FCC6E'], symbol: 'leaf' },
  { color: ['#DCD2FB', '#9B85E0'], symbol: 'diamond' },
  { color: ['#FFD9C2', '#EF9A63'], symbol: 'flower' },
]

const CONFIG = {
  id: 'lines',
  name: '连线小方块',
  title: '连线小方块',
  titleColors: ['#E9584A', '#E59313', '#2C9B63', '#3478D4'],
  kicker: '连一连',
  tagline: '一样的 · 连起来',
  startLabel: '开始连线',
  loadingText: '小方块正在排队…',
  ageText: '给 4-9 岁的连线小手',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小企鹅',
  iconText: '✦',
  meterIcon: '✦',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '草地' }, { short: '花园' }, { short: '晚霞' }, { short: '星空' }],
  storageKey: 'kids-lines-progress-v1',
  audioPath: '/static/audio/lines/',
  bgm: 'bgm.mp3',
  sfx: {
    connect: 'connect.mp3', done: 'done.mp3', star: 'star.mp3', level: 'level.mp3',
    celebrate: 'celebrate.mp3', friend: 'friend.mp3', ui: 'ui.mp3',
    pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/penguin.png',
  },
}

const SKIES = [
  ['#A9E4FF', '#FFF3D3', '#C7EDB4'],
  ['#B4F0E2', '#FFF6D9', '#C7EDB4'],
  ['#8395E0', '#FFB79B', '#FFE8C2'],
  ['#3D477E', '#6D69A2', '#8A76B4'],
]

export class LinesGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildScenery()
  }

  buildScenery() {
    const rng = mulberry32(this.level * 7919 + 41)
    this.sceneClouds = Array.from({ length: 3 }, () => ({
      x: rng(), y: 0.05 + rng() * 0.14, s: 0.6 + rng() * 0.6,
    }))
    this.sceneFlowers = Array.from({ length: 11 }, () => ({
      x: rng(), y: 0.9 + rng() * 0.08, s: 0.7 + rng() * 0.5,
      color: ['#FFB7C5', '#FFF6D8', '#FFD86B', '#C9E8FF'][Math.floor(rng() * 4)],
    }))
  }

  beginLevel(level, runStart) {
    this.buildScenery()
    this.skyGradient = null
    super.beginLevel(level, runStart)
  }

  resetLevelData() {
    super.resetLevelData()
    this.board = []
    this.selected = null
    this.dragPoint = null
    this.hintPair = null
    this.hintAt = 0
    this.hintUntil = 0
    this.clearedPairs = 0
    this.shuffleFlashAt = 0
  }

  setupLevel(cfg) {
    this.goal = cfg.goal
    this.cols = cfg.cols
    this.rows = cfg.rows
    this.kinds = cfg.kinds
    this.clearedPairs = 0
    this.selected = null
    this.dragPoint = null
    this.hintPair = null
    this.hintAt = this.time + 9
    this.hintUntil = 0
    this.buildGeometry()
    this.fillBoard()
  }

  buildGeometry() {
    const top = this.hudBottom + 58
    const bottom = this.h - this.safeBottom - 20
    const areaH = bottom - top
    const areaW = this.w - 26
    const gapRatio = 0.14
    let cell = Math.min(areaW / (this.cols + (this.cols - 1) * gapRatio), areaH / (this.rows + (this.rows - 1) * gapRatio))
    cell = Math.min(cell, 88)
    const gap = cell * gapRatio
    const gridW = this.cols * cell + (this.cols - 1) * gap
    const gridH = this.rows * cell + (this.rows - 1) * gap
    this.cell = cell
    this.gap = gap
    this.gridX = (this.w - gridW) / 2
    this.gridY = top + Math.max(0, (areaH - gridH) / 2)
    this.gridW = gridW
    this.gridH = gridH
  }

  // 棋盘外圈留一圈空格，路线可以绕到场外，这是「最多拐两个弯」能连通的关键。
  fillBoard() {
    const total = this.cols * this.rows
    const pairCount = Math.floor(total / 2)
    const deck = []
    for (let i = 0; i < pairCount; i += 1) {
      const kind = i % this.kinds
      deck.push(kind)
      deck.push(kind)
    }
    shuffle(deck)
    this.board = Array.from({ length: this.rows + 2 }, (_, row) => (
      Array.from({ length: this.cols + 2 }, (_, col) => {
        if (row === 0 || col === 0 || row === this.rows + 1 || col === this.cols + 1) return null
        const value = deck[(row - 1) * this.cols + (col - 1)]
        return { kind: value, pop: 0, x: col, y: row }
      })
    ))
    this.ensureSolvable(true)
    this.goal = pairCount
  }

  ensureSolvable(initial) {
    if (this.findAnyPair()) return
    let guard = 0
    while (guard < 80 && !this.findAnyPair()) {
      this.reshuffleTiles()
      guard += 1
    }
    if (!initial) {
      this.shuffleFlashAt = this.time + 0.8
      this.showToast('重新排一排', 1.6)
      this.audio.play('ui')
    }
  }

  reshuffleTiles() {
    const tiles = []
    for (let row = 1; row <= this.rows; row += 1) {
      for (let col = 1; col <= this.cols; col += 1) {
        if (this.board[row][col]) tiles.push(this.board[row][col])
      }
    }
    const kinds = tiles.map((tile) => tile.kind)
    shuffle(kinds)
    tiles.forEach((tile, index) => {
      tile.kind = kinds[index]
      tile.pop = 1
    })
  }

  // —— 路径判定 ——

  isOpen(x, y) {
    if (y < 0 || y >= this.rows + 2 || x < 0 || x >= this.cols + 2) return false
    return this.board[y][x] === null
  }

  findPath(from, to) {
    if (!from || !to || from === to) return false
    if (from.kind !== to.kind) return false
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    const best = new Map()
    const queue = []
    for (let d = 0; d < 4; d += 1) {
      const nx = from.x + dirs[d][0]
      const ny = from.y + dirs[d][1]
      if (nx === to.x && ny === to.y) return true
      if (!this.isOpen(nx, ny)) continue
      queue.push({ x: nx, y: ny, dir: d, turns: 0 })
      best.set(nx + ',' + ny + ',' + d, 0)
    }
    let head = 0
    while (head < queue.length) {
      const state = queue[head]
      head += 1
      for (let d = 0; d < 4; d += 1) {
        const turns = d === state.dir ? state.turns : state.turns + 1
        if (turns > 2) continue
        const nx = state.x + dirs[d][0]
        const ny = state.y + dirs[d][1]
        if (nx === to.x && ny === to.y) return true
        if (!this.isOpen(nx, ny)) continue
        const key = nx + ',' + ny + ',' + d
        const seen = best.get(key)
        if (seen !== undefined && seen <= turns) continue
        best.set(key, turns)
        queue.push({ x: nx, y: ny, dir: d, turns })
      }
    }
    return false
  }

  findAnyPair() {
    const tiles = []
    for (let row = 1; row <= this.rows; row += 1) {
      for (let col = 1; col <= this.cols; col += 1) {
        if (this.board[row][col]) tiles.push(this.board[row][col])
      }
    }
    for (let i = 0; i < tiles.length; i += 1) {
      for (let j = i + 1; j < tiles.length; j += 1) {
        if (tiles[i].kind !== tiles[j].kind) continue
        if (this.findPath(tiles[i], tiles[j])) return [tiles[i], tiles[j]]
      }
    }
    return null
  }

  // —— 交互 ——

  tileAt(x, y) {
    if (!this.board.length) return null
    const col = Math.floor((x - this.gridX) / (this.cell + this.gap)) + 1
    const row = Math.floor((y - this.gridY) / (this.cell + this.gap)) + 1
    if (row < 1 || row > this.rows || col < 1 || col > this.cols) return null
    const tile = this.board[row][col]
    if (!tile) return null
    const lx = this.gridX + (col - 1) * (this.cell + this.gap)
    const ly = this.gridY + (row - 1) * (this.cell + this.gap)
    if (x < lx - this.gap / 2 || x > lx + this.cell + this.gap / 2) return null
    if (y < ly - this.gap / 2 || y > ly + this.cell + this.gap / 2) return null
    return tile
  }

  touchTile(tile) {
    if (!tile) {
      this.selected = null
      return
    }
    if (!this.selected) {
      this.selected = tile
      this.dragPoint = null
      this.audio.play('connect')
      return
    }
    if (this.selected === tile) {
      this.selected = null
      this.audio.play('ui')
      return
    }
    this.tryConnect(this.selected, tile)
  }

  tryConnect(first, second) {
    if (!first || !second) return false
    if (first === second) return false
    if (!this.board[first.y] || !this.board[second.y]) return false
    if (first.kind !== second.kind) {
      this.audio.play('nope')
      this.addFloater('要两个一样的', this.tileCx(second), this.tileCy(second) - this.cell * 0.8, '#B5623E')
      this.selected = second
      this.hintAt = this.time + 5
      return false
    }
    if (!this.findPath(first, second)) {
      this.audio.play('nope')
      this.addFloater('换一对试试', this.tileCx(second), this.tileCy(second) - this.cell * 0.8, '#B5623E')
      this.selected = second
      this.hintAt = this.time + 5
      return false
    }
    this.clearPair(first, second)
    return true
  }

  clearPair(first, second) {
    this.board[first.y][first.x] = null
    this.board[second.y][second.x] = null
    this.selected = null
    this.dragPoint = null
    this.hintPair = null
    this.clearedPairs += 1
    this.progress = Math.min(this.goal, this.clearedPairs)
    this.score = this.progress
    this.hintAt = this.time + 9
    this.hintUntil = 0
    this.audio.play('done')
    this.burstTiles(first)
    this.burstTiles(second)
    this.addFloater('连上啦！', this.tileCx(second), this.tileCy(second) - this.cell * 0.6, '#2C9B63')
    if (this.clearedPairs % 4 === 0) {
      this.audio.play('star')
      this.burstConfetti(14)
    }
    if (this.clearedPairs >= this.goal) {
      this.audio.play('star')
      this.burstConfetti(36)
      this.finishRound(0.5)
      return
    }
    this.ensureSolvable(false)
  }

  burstTiles(tile) {
    const cx = this.tileCx(tile)
    const cy = this.tileCy(tile)
    const colors = TILE_KINDS[tile.kind % TILE_KINDS.length].color
    for (let i = 0; i < 12; i += 1) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(50, 160)
      this.particles.push({
        type: i % 3 === 0 ? 'sparkle' : 'dot',
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 90, size: rand(2.5, 6), color: i % 3 === 0 ? '#FFFFFF' : colors[1],
        life: rand(0.35, 0.7), max: 0.7, rotation: rand(0, Math.PI), spin: rand(-5, 5),
      })
    }
  }

  tileCx(tile) {
    return this.gridX + (tile.x - 1) * (this.cell + this.gap) + this.cell / 2
  }

  tileCy(tile) {
    return this.gridY + (tile.y - 1) * (this.cell + this.gap) + this.cell / 2
  }

  onTapInPlay(x, y) {
    this.touchTile(this.tileAt(x, y))
  }

  onDragStart(x, y) {
    if (this.selected) this.dragPoint = { x, y }
  }

  onDragMove(x, y) {
    if (!this.selected) return
    this.dragPoint = { x, y }
  }

  onDragEnd(x, y) {
    if (!this.selected) {
      this.dragPoint = null
      return
    }
    const tile = this.tileAt(x, y)
    // 松手落在另一张牌上就尝试连线；落在别处只是取消拖动，保留已选中的牌。
    if (tile && tile !== this.selected) this.tryConnect(this.selected, tile)
    this.dragPoint = null
  }

  updatePlay(dt) {
    for (let row = 1; row <= this.rows; row += 1) {
      for (let col = 1; col <= this.cols; col += 1) {
        const tile = this.board[row][col]
        if (!tile) continue
        if (tile.pop > 0) tile.pop = Math.max(0, tile.pop - dt * 3)
      }
    }
    // 卡住一会儿就轻轻提示一对可以连的牌，提示只亮 2.6 秒，避免一直替小朋友思考。
    if (!this.hintPair && this.time > this.hintAt) {
      this.hintPair = this.findAnyPair()
      this.hintUntil = this.time + 2.6
      this.hintAt = this.time + 9
    }
    if (this.hintPair) {
      const [a, b] = this.hintPair
      if (this.time > this.hintUntil || !this.board[a.y][a.x] || !this.board[b.y][b.x]) this.hintPair = null
    }
  }

  updateClear(dt) {
    // 过关时由基类播放庆祝，无需额外推进。
  }

  getObjectiveText() {
    return '连好 ' + this.progress + '/' + this.goal + ' 对'
  }

  getStartHint() {
    return '点两个一样的小方块'
  }

  drawGameOverlays() {
    // 场地几乎占满屏幕中部，关卡横幅会挡住画面，只保留首次提示气泡。
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
      title: this.celebrateFinal ? '全部连好啦！' : '连得真好！',
      tip: '你把 ' + this.goal + ' 对一模一样的小方块都连起来了，小企鹅给你拍拍手。',
      scoreText: '连好 ' + this.progress + ' 对 · 用了 ' + (this.clearedPairs || 0) + ' 次连线',
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    ctx.strokeStyle = '#7B8FD4'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 7, cy + 4)
    ctx.lineTo(cx - 1, cy - 3)
    ctx.lineTo(cx + 3, cy + 1)
    ctx.lineTo(cx + 7, cy - 5)
    ctx.stroke()
    ctx.fillStyle = '#FFC6D6'
    ctx.beginPath()
    ctx.arc(cx - 7, cy + 4, 2.4, 0, Math.PI * 2)
    ctx.arc(cx + 7, cy - 5, 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
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
      ctx.globalAlpha = night ? 0.24 : 0.75
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

    if (this.images.host && this.state !== 'start') {
      const size = clamp(W * 0.17, 54, 76)
      const bob = Math.sin(this.time * 1.6) * 4
      ctx.save()
      ctx.globalAlpha = 0.95
      ctx.drawImage(this.images.host, W - size - 4, groundY - size * 0.78 + bob, size, size)
      ctx.restore()
    }
  }

  drawActors() {
    this.drawBoardFrame()
    this.drawHint()
    this.drawDragLine()
    this.drawTiles()
  }

  drawBoardFrame() {
    const ctx = this.ctx
    fillRound(ctx, this.gridX - 10, this.gridY - 10, this.gridW + 20, this.gridH + 20, 24, 'rgba(255,250,242,0.62)')
    strokeRound(ctx, this.gridX - 10, this.gridY - 10, this.gridW + 20, this.gridH + 20, 24, '#FFFFFF', 3)
  }

  drawHint() {
    if (!this.hintPair) return
    const ctx = this.ctx
    const pulse = 0.45 + 0.3 * Math.sin(this.time * 5)
    ctx.save()
    ctx.globalAlpha = pulse
    this.hintPair.forEach((tile) => {
      const cx = this.tileCx(tile)
      const cy = this.tileCy(tile)
      strokeRound(ctx, cx - this.cell / 2 - 4, cy - this.cell / 2 - 4, this.cell + 8, this.cell + 8, this.cell * 0.28, '#FFD166', 4)
    })
    ctx.restore()
  }

  drawDragLine() {
    if (!this.selected || !this.dragPoint) return
    const ctx = this.ctx
    const fromX = this.tileCx(this.selected)
    const fromY = this.tileCy(this.selected)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(this.dragPoint.x, this.dragPoint.y)
    ctx.stroke()
    ctx.strokeStyle = TILE_KINDS[this.selected.kind % TILE_KINDS.length].color[1]
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(this.dragPoint.x, this.dragPoint.y)
    ctx.stroke()
    ctx.restore()
  }

  drawTiles() {
    const ctx = this.ctx
    const cell = this.cell
    for (let row = 1; row <= this.rows; row += 1) {
      for (let col = 1; col <= this.cols; col += 1) {
        const tile = this.board[row][col]
        if (!tile) continue
        const kind = TILE_KINDS[tile.kind % TILE_KINDS.length]
        const cx = this.gridX + (col - 1) * (cell + this.gap)
        const cy = this.gridY + (row - 1) * (cell + this.gap)
        const selected = this.selected === tile
        const lift = selected ? -3 : 0
        const scale = 1 + (selected ? 0.04 : 0) + (tile.pop || 0) * 0.08
        ctx.save()
        ctx.translate(cx + cell / 2, cy + cell / 2 + lift)
        ctx.scale(scale, scale)
        fillRound(ctx, -cell / 2, -cell / 2 + 3, cell, cell, cell * 0.24, 'rgba(90,62,43,0.18)')
        fillRound(ctx, -cell / 2, -cell / 2, cell, cell, cell * 0.24, kind.color[0])
        strokeRound(ctx, -cell / 2, -cell / 2, cell, cell, cell * 0.24, selected ? '#FFFFFF' : kind.color[1], selected ? 4 : 2.5)
        fillRound(ctx, -cell / 2 + cell * 0.13, -cell / 2 + cell * 0.1, cell * 0.3, cell * 0.12, cell * 0.06, 'rgba(255,255,255,0.55)')
        drawTileSymbol(ctx, kind.symbol, 0, 0, cell * 0.56, '#FFFFFF')
        ctx.restore()
      }
    }
  }
}

function drawTileSymbol(ctx, symbol, cx, cy, size, color) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = size * 0.13
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = size / 2
  if (symbol === 'star') {
    drawSparkle(ctx, 0, 0, r, color)
  } else if (symbol === 'heart') {
    ctx.beginPath()
    ctx.moveTo(0, r * 0.72)
    ctx.bezierCurveTo(-r * 1.15, -r * 0.05, -r * 0.5, -r * 0.95, 0, -r * 0.32)
    ctx.bezierCurveTo(r * 0.5, -r * 0.95, r * 1.15, -r * 0.05, 0, r * 0.72)
    ctx.closePath()
    ctx.fill()
  } else if (symbol === 'circle') {
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.beginPath()
    ctx.arc(-r * 0.2, -r * 0.22, r * 0.2, 0, Math.PI * 2)
    ctx.fill()
  } else if (symbol === 'leaf') {
    ctx.beginPath()
    ctx.moveTo(-r * 0.72, r * 0.66)
    ctx.bezierCurveTo(-r * 0.9, -r * 0.5, -r * 0.1, -r * 0.86, r * 0.72, -r * 0.62)
    ctx.bezierCurveTo(r * 0.8, r * 0.2, r * 0.1, r * 0.9, -r * 0.72, r * 0.66)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 0.7
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = size * 0.06
    ctx.beginPath()
    ctx.moveTo(-r * 0.5, r * 0.5)
    ctx.lineTo(r * 0.42, -r * 0.42)
    ctx.stroke()
  } else if (symbol === 'diamond') {
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.78)
    ctx.lineTo(r * 0.66, 0)
    ctx.lineTo(0, r * 0.78)
    ctx.lineTo(-r * 0.66, 0)
    ctx.closePath()
    ctx.fill()
  } else {
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.ellipse(Math.cos(angle) * r * 0.38, Math.sin(angle) * r * 0.38, r * 0.3, r * 0.22, angle, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#FFD166'
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = list[i]
    list[i] = list[j]
    list[j] = tmp
  }
  return list
}
