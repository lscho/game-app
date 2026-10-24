import {
  BaseGame, clamp, rand, drawSparkle, setFont, drawLabel, fillRound, strokeRound,
  roundedPath, mulberry32,
} from './engine.js'

// 翻翻乐：点开卡片找一样的小动物。翻错只会自己翻回去，不扣任何东西。
// 关卡只调卡片数量和主题（卡片越多，图案越丰富）。

const LEVELS = [
  { chapter: 0, pairs: 3, name: '小猫小狗', tip: '找到一样的卡片', animals: ['cat', 'dog', 'rabbit'] },
  { chapter: 0, pairs: 3, name: '再来一组', tip: '一次翻两张', animals: ['bear', 'fox', 'pig'] },
  { chapter: 0, pairs: 4, name: '四对朋友', tip: '找齐 4 对', animals: ['cat', 'dog', 'rabbit', 'bear'] },
  { chapter: 0, pairs: 4, name: '森林伙伴', tip: '森林里都是朋友', animals: ['fox', 'pig', 'panda', 'frog'] },

  { chapter: 1, pairs: 5, name: '五对朋友', tip: '找齐 5 对', animals: ['cat', 'dog', 'rabbit', 'bear', 'fox'] },
  { chapter: 1, pairs: 5, name: '动物园', tip: '慢慢记住位置', animals: ['pig', 'panda', 'frog', 'cat', 'dog'] },
  { chapter: 1, pairs: 6, name: '六对朋友', tip: '卡片变多啦', animals: ['cat', 'dog', 'rabbit', 'bear', 'fox', 'pig'] },
  { chapter: 1, pairs: 6, name: '记住它们', tip: '翻过的卡片要看仔细', animals: ['panda', 'frog', 'cat', 'dog', 'rabbit', 'bear'] },

  { chapter: 2, pairs: 6, name: '海边伙伴', tip: '找齐 6 对', animals: ['fish', 'crab', 'star', 'jelly', 'shell', 'octopus'] },
  { chapter: 2, pairs: 8, name: '八对朋友', tip: '一次多记几张', animals: ['cat', 'dog', 'rabbit', 'bear', 'fox', 'pig', 'panda', 'frog'] },
  { chapter: 2, pairs: 8, name: '更多伙伴', tip: '不着急，慢慢翻', animals: ['fish', 'crab', 'star', 'jelly', 'shell', 'octopus', 'cat', 'dog'] },
  { chapter: 2, pairs: 8, name: '好朋友集合', tip: '找齐 8 对', animals: ['bear', 'fox', 'pig', 'panda', 'frog', 'rabbit', 'cat', 'dog'] },

  { chapter: 3, pairs: 9, name: '九对朋友', tip: '卡片铺满啦', animals: ['cat', 'dog', 'rabbit', 'bear', 'fox', 'pig', 'panda', 'frog', 'fish'] },
  { chapter: 3, pairs: 9, name: '记忆高手', tip: '记住每一张', animals: ['crab', 'star', 'jelly', 'shell', 'octopus', 'cat', 'dog', 'rabbit', 'bear'] },
  { chapter: 3, pairs: 10, name: '十对朋友', tip: '最后的大挑战', animals: ['cat', 'dog', 'rabbit', 'bear', 'fox', 'pig', 'panda', 'frog', 'fish', 'crab'] },
  { chapter: 3, pairs: 10, name: '全部找到', tip: '找齐 10 对，你就赢啦', animals: ['star', 'jelly', 'shell', 'octopus', 'cat', 'dog', 'rabbit', 'bear', 'fox', 'pig'] },
]

const CARD_COLORS = [
  ['#FFE0E8', '#FFB9CC', '#F58CAF'],
  ['#E4F7FF', '#B9E8FB', '#74C7E8'],
  ['#FFF3D6', '#FFD98F', '#F2B23F'],
  ['#E9F8E2', '#BFEAAF', '#7FCC6E'],
  ['#F0EAFF', '#CDBEFA', '#9B85E0'],
]

const CONFIG = {
  id: 'memory',
  name: '动物翻翻乐',
  title: '动物翻翻乐',
  titleColors: ['#E9584A', '#E59313', '#2C9B63', '#3478D4'],
  kicker: '找一找',
  tagline: '翻一翻 · 找一对',
  startLabel: '开始翻卡片',
  loadingText: '小动物们正在躲猫猫…',
  ageText: '给 4-9 岁的记忆小达人',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小猴子',
  iconText: '★',
  meterIcon: '★',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '草地' }, { short: '树林' }, { short: '海边' }, { short: '星空' }],
  storageKey: 'kids-memory-progress-v1',
  audioPath: '/static/audio/memory/',
  bgm: 'bgm.mp3',
  sfx: {
    flip: 'flip.mp3', match: 'match.mp3', pick: 'pick.mp3', level: 'level.mp3',
    celebrate: 'celebrate.mp3', friend: 'friend.mp3', ui: 'ui.mp3',
    pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/monkey.png',
    cat: '/static/img/animals/cat.png',
    dog: '/static/img/animals/dog.png',
    rabbit: '/static/img/animals/rabbit.png',
    bear: '/static/img/animals/bear.png',
    fox: '/static/img/animals/fox.png',
    pig: '/static/img/animals/pig.png',
    panda: '/static/img/animals/panda.png',
    frog: '/static/img/animals/frog.png',
    fish: '/static/img/sea/fish.png',
    crab: '/static/img/sea/crab.png',
    star: '/static/img/sea/star.png',
    jelly: '/static/img/sea/jelly.png',
    shell: '/static/img/sea/shell.png',
    octopus: '/static/img/sea/octopus.png',
  },
}

export class MemoryGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildScenery()
  }

  buildScenery() {
    const rng = mulberry32(this.level * 7919 + 41)
    this.sceneClouds = Array.from({ length: 4 }, () => ({
      x: rng(), y: 0.08 + rng() * 0.18, s: 0.6 + rng() * 0.7, v: 0.004 + rng() * 0.006,
    }))
    this.sceneFlowers = Array.from({ length: 12 }, () => ({
      x: rng(), y: 0.9 + rng() * 0.08, s: 0.7 + rng() * 0.6,
      color: ['#FFB7C5', '#FFF6D8', '#FFD86B', '#C9E8FF'][Math.floor(rng() * 4)],
    }))
  }

  beginLevel(level, runStart) {
    this.buildScenery()
    super.beginLevel(level, runStart)
  }

  resetLevelData() {
    super.resetLevelData()
    this.cards = []
    this.flipped = []
    this.matchedPairs = 0
    this.lockUntil = 0
    this.wrongFlashUntil = 0
    this.wrongCards = []
    this.previewUntil = 0
    this.previewShown = false
    this.selectedCard = null
    this.flips = 0
    this.wrongBackAt = 0
    this.wrongPair = null
  }

  setupLevel(cfg) {
    this.goal = cfg.pairs
    this.cards = []
    this.flipped = []
    this.matchedPairs = 0
    this.previewUntil = this.time + 1.6
    this.previewShown = false
    this.flips = 0
    this.wrongPair = null
    this.wrongBackAt = 0
    const pairCount = cfg.pairs
    const total = pairCount * 2
    const deck = []
    for (let i = 0; i < pairCount; i += 1) {
      const key = cfg.animals[i % cfg.animals.length]
      deck.push(key)
      deck.push(key)
    }
    shuffle(deck)
    const layout = this.cardLayout(total)
    deck.forEach((key, index) => {
      const slot = layout[index]
      this.cards.push({
        id: this.makeUid('c'),
        key,
        index,
        x: slot.x,
        y: slot.y,
        size: slot.size,
        open: false,
        matched: false,
        flip: 0,
        pop: 0,
        wiggle: 0,
      })
    })
    this.maxPairs = pairCount
  }

  cardLayout(total) {
    const top = this.hudBottom + 76
    const bottom = this.h - this.safeBottom - 16
    const areaW = this.w - 24
    const areaH = bottom - top
    const gap = clamp(this.w * 0.025, 7, 11)
    let best = null
    for (let cols = 2; cols <= 5; cols += 1) {
      const rows = Math.ceil(total / cols)
      if (rows > 5) continue
      const cardW = Math.min((areaW - gap * (cols - 1)) / cols, 136)
      const cardH = Math.min((areaH - gap * (rows - 1)) / rows, cardW * 1.18)
      const size = Math.min(cardW, cardH / 1.18)
      if (!best || size > best.size + 0.5) best = { cols, rows, size }
    }
    if (!best) best = { cols: 4, rows: Math.ceil(total / 4), size: 60 }
    const cols = best.cols
    const rows = best.rows
    const size = best.size
    const gridW = cols * size + (cols - 1) * gap
    const startX = (this.w - gridW) / 2
    const startY = top + Math.max(0, (areaH - (rows * size * 1.18 + (rows - 1) * gap)) / 2)
    const slots = []
    for (let i = 0; i < total; i += 1) {
      const col = i % cols
      const row = Math.floor(i / cols)
      slots.push({
        x: startX + col * (size + gap),
        y: startY + row * (size * 1.18 + gap),
        size,
      })
    }
    return slots
  }

  getObjectiveText() {
    return '找到 ' + this.matchedPairs + '/' + this.maxPairs + ' 对'
  }

  drawGameOverlays() {
    // 卡片占满屏幕中部，横幅会挡住要记的牌，只保留首次提示气泡。
    if (!this.hintSeen && this.time < this.hintUntil) this.drawHintBubble()
  }

  drawHintBubble() {
    const ctx = this.ctx
    const alpha = clamp(Math.min(1, (this.hintUntil - this.time) / 0.5), 0, 1)
    const text = this.getStartHint()
    setFont(ctx, 12, 800)
    const w = Math.min(this.w - 24, ctx.measureText(text).width + 62)
    const x = (this.w - w) / 2
    // 卡片从 hudBottom + 76 开始，提示放在 HUD 与卡片之间，避免挡住要记的牌。
    const y = this.hudBottom + 18
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
    return '一次翻两张卡片'
  }

  getResultLines() {
    return {
      title: this.celebrateFinal ? '全都找到啦！' : '真棒！',
      tip: '你把 ' + this.maxPairs + ' 对朋友都找齐了，它们的记性都没有你好。',
      scoreText: '找到 ' + this.maxPairs + ' 对 · 翻牌 ' + this.flips + ' 次',
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    fillRound(ctx, cx - 7, cy - 8, 14, 16, 4, '#FFE1A8')
    strokeRound(ctx, cx - 7, cy - 8, 14, 16, 4, '#E5A93B', 2)
    ctx.fillStyle = '#E5A93B'
    ctx.beginPath()
    ctx.arc(cx, cy - 1, 2.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  updatePlay(dt) {
    this.cards.forEach((card) => {
      const target = card.matched || card.open ? 1 : 0
      card.flip += (target - card.flip) * Math.min(1, dt * 12)
      if (card.pop > 0) card.pop = Math.max(0, card.pop - dt * 2.4)
      if (card.wiggle > 0) card.wiggle = Math.max(0, card.wiggle - dt * 3)
    })
    if (!this.previewShown && this.time > this.previewUntil) {
      this.previewShown = true
      this.cards.forEach((card) => {
        if (!card.matched) card.open = false
      })
    }
    if (this.wrongPair && this.time >= this.wrongBackAt) {
      this.wrongPair.forEach((card) => {
        if (!card.matched) card.open = false
      })
      this.wrongPair = null
    }
    if (this.cards.length && this.matchedPairs >= this.maxPairs) {
      // finishing 期间引擎不再调用 updatePlay()，翻转动画会停住。
      // 所以等最后一张牌也翻正再收尾，否则它停在半翻的背面。
      const settled = this.cards.every((card) => card.flip > 0.99)
      if (settled) this.finishRound(0.5)
    }
  }

  updateClear(dt) {
    this.cards.forEach((card) => {
      card.pop = Math.min(1, card.pop + dt * 1.4)
    })
  }

  onTapInPlay(x, y) {
    if (this.time < this.lockUntil) return
    for (let i = this.cards.length - 1; i >= 0; i -= 1) {
      const card = this.cards[i]
      if (x >= card.x && x <= card.x + card.size && y >= card.y && y <= card.y + card.size * 1.18) {
        this.tapCard(card)
        return
      }
    }
  }

  tapCard(card) {
    if (card.matched || card.open || this.flipped.length >= 2) return
    if (!this.previewShown) {
      this.previewShown = true
      this.previewUntil = this.time
      this.cards.forEach((item) => {
        if (!item.matched && item !== card) item.open = false
      })
    }
    card.open = true
    this.flips = (this.flips || 0) + 1
    this.audio.play('flip')
    this.flipped.push(card)
    if (this.flipped.length === 1) {
      this.selectedCard = card.id
      this.audio.play('pick')
      return
    }
    const [first, second] = this.flipped
    if (first.key === second.key) {
      this.matchPair(first, second)
    } else {
      this.lockUntil = this.time + 0.9
      this.wrongBackAt = this.time + 0.82
      this.wrongPair = [first, second]
      first.wiggle = 1
      second.wiggle = 1
      this.audio.play('nope')
      this.flipped = []
    }
  }

  matchPair(first, second) {
    first.matched = true
    second.matched = true
    first.open = false
    second.open = false
    this.flipped = []
    this.selectedCard = null
    this.matchedPairs += 1
    this.progress = this.matchedPairs
    this.score = this.matchedPairs
    this.audio.play('match')
    this.burstMatch(first)
    this.burstMatch(second)
    this.addFloater('找到啦！', second.x + second.size / 2, second.y - 10, '#E07A3B')
    this.happyUntil = this.time + 0.4
    if (this.matchedPairs >= this.maxPairs) {
      this.audio.play('star')
      this.burstConfetti(40)
    }
  }

  burstMatch(card) {
    const colors = ['#FFD166', '#7BD88F', '#5CC8FF', '#FF9FB4']
    for (let i = 0; i < 12; i += 1) {
      const angle = rand(-Math.PI, 0)
      const speed = rand(50, 150)
      this.particles.push({
        type: i % 2 === 0 ? 'petal' : 'sparkle',
        x: card.x + card.size / 2, y: card.y + card.size * 0.6,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 260, size: rand(3, 6), color: colors[i % colors.length],
        life: rand(0.45, 0.85), max: 0.85, rotation: rand(0, Math.PI), spin: rand(-5, 5),
      })
    }
  }

  drawWorld() {
    const ctx = this.ctx
    const W = this.w
    const H = this.h
    const chapter = this.levelConfig.chapter || 0

    const skyTop = chapter === 3 ? '#4E4E96' : chapter === 2 ? '#7FD5F2' : '#A9E4FF'
    const skyBottom = chapter === 3 ? '#C6A7D8' : chapter === 2 ? '#FFF0CF' : '#FFF6D9'
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, skyTop)
    sky.addColorStop(0.6, skyBottom)
    sky.addColorStop(1, chapter === 3 ? '#8E76C0' : '#C7EDB4')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    if (chapter === 3) {
      for (let i = 0; i < 34; i += 1) {
        const x = ((i * 137.5) % W)
        const y = ((i * 71.3) % (H * 0.62))
        const twinkle = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(this.time * 1.6 + i))
        ctx.globalAlpha = twinkle
        ctx.fillStyle = '#FFF6D5'
        ctx.beginPath()
        ctx.arc(x, y, 1 + (i % 3) * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.save()
      ctx.fillStyle = '#FFF1C4'
      ctx.beginPath()
      ctx.arc(W * 0.8, this.safeTop + 54, 26, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = skyTop
      ctx.beginPath()
      ctx.arc(W * 0.8 + 12, this.safeTop + 46, 23, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else {
      ctx.save()
      ctx.fillStyle = chapter === 2 ? '#FFE28A' : '#FFE07A'
      ctx.globalAlpha = 0.85
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
      ctx.globalAlpha = chapter === 3 ? 0.28 : 0.82
      ctx.fillStyle = chapter === 3 ? '#DCD6FF' : '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x - 30 * s, y + 6 * s, 17 * s, 0, Math.PI * 2)
      ctx.arc(x - 5 * s, y, 24 * s, 0, Math.PI * 2)
      ctx.arc(x + 24 * s, y + 6 * s, 19 * s, 0, Math.PI * 2)
      ctx.rect(x - 38 * s, y + 6 * s, 70 * s, 20 * s)
      ctx.fill()
      ctx.restore()
    })

    const groundY = H - clamp(H * 0.09, 52, 76)
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.bezierCurveTo(W * 0.3, groundY - 16, W * 0.62, groundY + 10, W, groundY - 6)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = chapter === 3 ? '#6F5E9E' : '#A8DF8E'
    ctx.fill()

    this.sceneFlowers.forEach((flower) => {
      const x = flower.x * W
      const y = groundY + 6 + (flower.y - 0.9) * H * 0.6
      const s = flower.s * clamp(W / 390, 0.8, 1.15)
      ctx.save()
      ctx.strokeStyle = chapter === 3 ? '#5C4E85' : '#79C36A'
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

    if (this.state !== 'start' && this.state !== 'loading' && this.images.host) {
      const size = clamp(W * 0.2, 62, 90)
      const bob = Math.sin(this.time * 1.5) * 4
      ctx.save()
      ctx.globalAlpha = 0.95
      ctx.drawImage(this.images.host, 6, groundY - size * 0.86 + bob, size, size)
      ctx.restore()
    }
  }

  drawActors() {
    const ctx = this.ctx
    this.cards.forEach((card) => {
      this.drawCard(card)
    })
  }

  drawCard(card) {
    const ctx = this.ctx
    const size = card.size
    const centerX = card.x + size / 2
    const centerY = card.y + size * 0.59
    const flip = card.flip
    const preview = !this.previewShown && !card.matched
    const scaleX = preview ? 1 : Math.abs(Math.cos(flip * Math.PI))
    const showFront = preview || flip > 0.5
    const idx = card.index % CARD_COLORS.length
    const palette = CARD_COLORS[idx]
    const wiggle = card.wiggle > 0 ? Math.sin(this.time * 40) * 4 * card.wiggle : 0
    const lift = card.pop > 0 ? -card.pop * 6 : 0

    ctx.save()
    ctx.translate(centerX + wiggle, centerY + lift)
    ctx.scale(Math.max(0.04, scaleX), 1)

    // shadow
    ctx.save()
    ctx.globalAlpha = 0.14
    ctx.fillStyle = '#4A3222'
    fillRound(ctx, -size / 2, -size * 0.59 + 5, size, size * 1.18, size * 0.2, '#4A3222')
    ctx.restore()

    if (!showFront) {
      const grad = ctx.createLinearGradient(0, -size * 0.59, 0, size * 0.59)
      grad.addColorStop(0, palette[1])
      grad.addColorStop(1, palette[0])
      fillRound(ctx, -size / 2, -size * 0.59, size, size * 1.18, size * 0.2, grad)
      strokeRound(ctx, -size / 2, -size * 0.59, size, size * 1.18, size * 0.2, '#FFFFFF', 3)

      // back pattern: paw print
      const pawY = -size * 0.06
      ctx.fillStyle = 'rgba(255,255,255,0.62)'
      ctx.beginPath()
      ctx.ellipse(0, pawY + size * 0.1, size * 0.15, size * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath()
        ctx.arc((i - 1) * size * 0.12, pawY - size * 0.03, size * 0.055, 0, Math.PI * 2)
        ctx.fill()
      }
      if (this.selectedCard === card.id) {
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'
        ctx.lineWidth = 4
        roundedPath(ctx, -size / 2 - 3, -size * 0.59 - 3, size + 6, size * 1.18 + 6, size * 0.22)
        ctx.stroke()
      }
    } else {
      const matched = card.matched
      fillRound(ctx, -size / 2, -size * 0.59, size, size * 1.18, size * 0.2, matched ? '#FFF8E0' : '#FFFFFF')
      strokeRound(
        ctx, -size / 2, -size * 0.59, size, size * 1.18, size * 0.2,
        matched ? '#FFD166' : palette[1], matched ? 4 : 3
      )
      const image = this.images[card.key]
      if (image) {
        const imgSize = size * 0.78
        ctx.drawImage(image, -imgSize / 2, -imgSize / 2, imgSize, imgSize)
      }
      if (matched) {
        ctx.save()
        ctx.globalAlpha = 0.55 + 0.3 * Math.sin(this.time * 5 + card.index)
        drawSparkle(ctx, size * 0.33, -size * 0.4, size * 0.1, '#FFD166')
        ctx.restore()
      }
    }
    ctx.restore()
  }

  drawExtraHud() {}

  drawEffects() {
    const ctx = this.ctx
    this.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      if (particle.type === 'sparkle') {
        drawSparkle(ctx, particle.x, particle.y, particle.size, particle.color)
      } else {
        ctx.translate(particle.x, particle.y)
        ctx.rotate(particle.rotation)
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.ellipse(0, 0, particle.size, particle.size * 0.55, 0, 0, Math.PI * 2)
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
      pairs: this.matchedPairs,
      maxPairs: this.maxPairs,
      flipped: this.flipped.length,
      cards: this.cards.length,
      preview: !this.previewShown,
    }
  }

  debugMatchAll() {
    let guard = 0
    while (this.state === 'playing' && this.gameMode === 'ready' && guard < 40) {
      const open = this.cards.filter((card) => !card.matched)
      if (open.length < 2) break
      const first = open[0]
      const second = open.find((card) => card !== first && card.key === first.key)
      if (first && second) {
        first.open = true
        second.open = true
        this.matchPair(first, second)
      }
      guard += 1
    }
    return true
  }
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
