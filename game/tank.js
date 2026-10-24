import {
  BaseGame, clamp, rand, drawSparkle, setFont, drawLabel, fillRound, strokeRound,
  roundedPath, mulberry32,
} from './engine.js'

// 小坦克打气球：小坦克沿地面左右开，按下开炮打掉从天上下来的彩色气球。
// 气球碰到地面只是弹走、不扣分；漏掉的气球会自己飞回天空，永远打不完。

const LEVELS = [
  { chapter: 0, name: '第一炮', tip: '点左边或右边移动', goal: 4, rate: 1.5, speed: 0.55 },
  { chapter: 0, name: '气球来啦', tip: '瞄准了再开炮', goal: 5, rate: 1.4, speed: 0.6 },
  { chapter: 0, name: '两个气球', tip: '气球会同时出现', goal: 6, rate: 1.3, speed: 0.66, max: 2 },
  { chapter: 0, name: '打准一点', tip: '打中 6 个气球', goal: 7, rate: 1.2, speed: 0.7, max: 2 },

  { chapter: 1, name: '小树林', tip: '气球飘得快一点', goal: 8, rate: 1.1, speed: 0.8, max: 3 },
  { chapter: 1, name: '气球多多', tip: '一次来三个', goal: 9, rate: 1.0, speed: 0.86, max: 3 },
  { chapter: 1, name: '左右开弓', tip: '小坦克跑得快啦', goal: 10, rate: 0.95, speed: 0.92, max: 3, moveSpeed: 1.25 },
  { chapter: 1, name: '瞄准小气球', tip: '小气球要瞄准一点', goal: 11, rate: 0.9, speed: 0.98, max: 3, small: true },

  { chapter: 2, name: '晚霞气球', tip: '气球越来越快', goal: 12, rate: 0.85, speed: 1.08, max: 4, moveSpeed: 1.35 },
  { chapter: 2, name: '四只气球', tip: '同时来四只', goal: 13, rate: 0.8, speed: 1.14, max: 4 },
  { chapter: 2, name: '闪亮气球', tip: '闪亮气球要打两下', goal: 14, rate: 0.78, speed: 1.2, max: 4, sparkly: true },
  { chapter: 2, name: '快炮手', tip: '开炮快一点', goal: 15, rate: 0.72, speed: 1.26, max: 4, sparkly: true },

  { chapter: 3, name: '星空气球', tip: '最后一程，慢慢来', goal: 16, rate: 0.68, speed: 1.34, max: 5, moveSpeed: 1.45 },
  { chapter: 3, name: '气球雨', tip: '气球像下雨一样', goal: 17, rate: 0.64, speed: 1.4, max: 5, small: true },
  { chapter: 3, name: '小小神炮手', tip: '打中 18 个气球', goal: 18, rate: 0.6, speed: 1.46, max: 5, sparkly: true },
  { chapter: 3, name: '气球城堡', tip: '最后一段，加油', goal: 20, rate: 0.56, speed: 1.54, max: 6, small: true, sparkly: true },
]

const BALLOON_COLORS = [
  ['#FFD1DC', '#F58CAF'],
  ['#C7ECFB', '#74C7E8'],
  ['#FFE7AE', '#F2B23F'],
  ['#CDEFC0', '#7FCC6E'],
  ['#DCD2FB', '#9B85E0'],
  ['#FFD9C2', '#EF9A63'],
]

const CONFIG = {
  id: 'tank',
  name: '坦克打气球',
  title: '坦克打气球',
  titleColors: ['#E9584A', '#E59313', '#2C9B63', '#3478D4'],
  kicker: '开一炮',
  tagline: '开坦克 · 打气球',
  startLabel: '开始开坦克',
  loadingText: '小坦克正在加油…',
  ageText: '给 4-9 岁的小炮手',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小老虎',
  iconText: '●',
  meterIcon: '●',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '草地' }, { short: '树林' }, { short: '晚霞' }, { short: '星空' }],
  storageKey: 'kids-tank-progress-v1',
  audioPath: '/static/audio/tank/',
  bgm: 'bgm.mp3',
  sfx: {
    shoot: 'shoot.mp3', hit: 'hit.mp3', star: 'star.mp3', level: 'level.mp3',
    celebrate: 'celebrate.mp3', friend: 'friend.mp3', ui: 'ui.mp3',
    pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/tiger.png',
  },
}

const SKIES = [
  ['#A9E4FF', '#FFF3D3', '#C7EDB4'],
  ['#9EDCFF', '#FFEFC8', '#BCE49A'],
  ['#8395E0', '#FFB79B', '#FFE8C2'],
  ['#3D477E', '#6D69A2', '#8A76B4'],
]

export class TankGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildScenery()
  }

  buildScenery() {
    const rng = mulberry32(this.level * 7919 + 41)
    this.sceneClouds = Array.from({ length: 4 }, () => ({
      x: rng(), y: 0.05 + rng() * 0.18, s: 0.6 + rng() * 0.7,
    }))
    this.sceneTrees = Array.from({ length: 5 }, () => ({
      x: 0.06 + rng() * 0.88, s: 0.7 + rng() * 0.6,
    }))
  }

  beginLevel(level, runStart) {
    this.buildScenery()
    this.skyGradient = null
    super.beginLevel(level, runStart)
  }

  resetLevelData() {
    super.resetLevelData()
    this.balloons = []
    this.shots = []
    this.spawnTimer = 0.6
    this.tankX = 0
    this.tankTarget = null
    this.recoil = 0
    this.lockedThisLevel = 0
  }

  setupLevel(cfg) {
    this.goal = cfg.goal
    this.spawnEvery = cfg.rate
    this.balloonSpeed = cfg.speed
    this.maxBalloons = cfg.max || 1
    this.smallBalloons = !!cfg.small
    this.sparklyBalloons = !!cfg.sparkly
    this.moveSpeed = cfg.moveSpeed || 1
    this.buildGeometry()
    this.balloons = []
    this.shots = []
    this.spawnTimer = 0.7
    this.tankX = this.w / 2
    this.tankTarget = null
    this.lockedThisLevel = 0
  }

  buildGeometry() {
    const top = this.hudBottom + 58
    this.fieldTop = top
    this.fieldBottom = this.h - this.safeBottom - 92
    this.groundY = this.fieldBottom
    const tankW = clamp(this.w * 0.19, 62, 84)
    this.tankW = tankW
    this.tankH = tankW * 0.62
    this.tankMinX = tankW / 2 + 10
    this.tankMaxX = this.w - tankW / 2 - 10
    this.controlY = this.h - this.safeBottom - 40
  }

  getObjectiveText() {
    return '打中 ' + this.progress + '/' + this.goal + ' 个'
  }

  getStartHint() {
    return '点两边移动，按中间开炮'
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
      title: this.celebrateFinal ? '气球全打中！' : '打得真准！',
      tip: '你打中了 ' + this.goal + ' 个彩色气球，小老虎给你鼓掌啦。',
      scoreText: '打中 ' + this.progress + ' 个 · 开炮 ' + (this.shotCount || 0) + ' 次',
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = '#FFC6D6'
    ctx.strokeStyle = '#E4718F'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(cx, cy - 1, 6, 7.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy + 6.5)
    ctx.lineTo(cx, cy + 11)
    ctx.stroke()
    ctx.restore()
  }

  // —— 玩法 ——

  updatePlay(dt) {
    this.updateTank(dt)
    this.updateShots(dt)
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0 && this.balloons.length < this.maxBalloons) {
      this.spawnBalloon()
      this.spawnTimer = this.spawnEvery * rand(0.8, 1.15)
    }
    this.updateBalloons(dt)
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 4)
  }

  // 点屏幕左半边往左挪一步，右半边往右挪一步；连续点就能走到任意位置。
  onTapInPlay(x) {
    const dir = x < this.w / 2 ? -1 : 1
    const from = this.tankTarget === null ? this.tankX : this.tankTarget
    this.tankTarget = clamp(from + dir * this.tankW * 0.85, this.tankMinX, this.tankMaxX)
  }

  updateTank(dt) {
    if (this.tankTarget === null) return
    const dx = this.tankTarget - this.tankX
    const step = clamp(this.w * 2.2, 640, 1000) * this.moveSpeed * dt
    if (Math.abs(dx) <= step) {
      this.tankX = this.tankTarget
      this.tankTarget = null
      return
    }
    this.tankX = clamp(this.tankX + Math.sign(dx) * step, this.tankMinX, this.tankMaxX)
  }

  updateShots(dt) {
    for (let i = this.shots.length - 1; i >= 0; i -= 1) {
      const shot = this.shots[i]
      shot.y -= shot.speed * dt
      if (shot.y < this.fieldTop - 20) {
        this.shots.splice(i, 1)
        continue
      }
      let hit = false
      for (let j = this.balloons.length - 1; j >= 0; j -= 1) {
        const balloon = this.balloons[j]
        const dx = shot.x - balloon.x
        const dy = shot.y - balloon.y
        if (dx * dx + dy * dy <= (balloon.r + 12) * (balloon.r + 12)) {
          this.hitBalloon(j)
          hit = true
          break
        }
      }
      if (hit) this.shots.splice(i, 1)
    }
  }

  updateBalloons(dt) {
    for (let i = this.balloons.length - 1; i >= 0; i -= 1) {
      const balloon = this.balloons[i]
      balloon.y += balloon.speed * dt
      balloon.phase += dt * balloon.sway
      balloon.x = balloon.baseX + Math.sin(balloon.phase) * balloon.amp
      if (balloon.y + balloon.r >= this.groundY - 4) {
        // 落到草地不算失败：气球轻轻散开飞走，过一会儿再来一个。
        for (let k = 0; k < 6; k += 1) {
          this.addParticle('sparkle', balloon.x + rand(-balloon.r, balloon.r), this.groundY - 8, balloon.color[1], rand(2, 4), rand(0.3, 0.6))
        }
        this.balloons.splice(i, 1)
        this.spawnTimer = Math.min(this.spawnTimer, 0.5)
      }
    }
  }

  spawnBalloon() {
    const base = this.smallBalloons ? rand(0.055, 0.07) : rand(0.075, 0.095)
    const r = clamp(this.w * base, 20, this.smallBalloons ? 28 : 38)
    const baseX = rand(r + 18, this.w - r - 18)
    this.balloons.push({
      id: this.makeUid('k'),
      x: baseX,
      baseX,
      y: this.fieldTop - r,
      r,
      speed: rand(26, 40) * this.balloonSpeed,
      phase: rand(0, Math.PI * 2),
      sway: rand(0.6, 1.1),
      amp: rand(6, 18),
      hp: this.sparklyBalloons && Math.random() < 0.28 ? 2 : 1,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      bob: rand(0, Math.PI * 2),
      pop: 0,
    })
  }

  fire() {
    this.audio.play('shoot')
    this.shotCount = (this.shotCount || 0) + 1
    this.recoil = 1
    this.shots.push({
      x: this.tankX,
      y: this.groundY - this.tankH - 18,
      speed: clamp(this.h * 1.15, 620, 980),
    })
    for (let i = 0; i < 4; i += 1) {
      this.addParticle('sparkle', this.tankX, this.groundY - this.tankH - 6, '#FFD166', rand(2, 4), rand(0.2, 0.4))
    }
  }

  hitBalloon(index) {
    const balloon = this.balloons[index]
    balloon.hp -= 1
    if (balloon.hp > 0) {
      this.audio.play('hit')
      this.addFloater('再来一下', balloon.x, balloon.y - balloon.r - 10, '#E07A3B')
      this.burstBalloon(balloon, balloon.color[1], 5)
      return
    }
    this.balloons.splice(index, 1)
    this.audio.play('hit')
    this.progress = Math.min(this.goal, this.progress + 1)
    this.score = this.progress
    this.burstBalloon(balloon, balloon.color[1], 12)
    this.addFloater('+1', balloon.x, balloon.y - balloon.r * 0.6, balloon.color[1])
    if (this.progress >= this.goal) {
      this.audio.play('star')
      this.burstConfetti(40)
      this.finishRound(0.5)
    }
  }

  burstBalloon(balloon, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(50, 170)
      this.particles.push({
        type: i % 3 === 0 ? 'sparkle' : 'dot',
        x: balloon.x, y: balloon.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 60, size: rand(2.5, 6), color: i % 3 === 0 ? '#FFFFFF' : color,
        life: rand(0.35, 0.7), max: 0.7, rotation: rand(0, Math.PI), spin: rand(-5, 5),
      })
    }
  }

  activateExtra(id) {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return
    if (id === 'tank-fire') this.fire()
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
      for (let i = 0; i < 28; i += 1) {
        const x = (i * 149.3) % W
        const y = (i * 83.1) % (H * 0.46)
        ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.time * 1.5 + i))
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
      ctx.globalAlpha = night ? 0.24 : 0.76
      ctx.fillStyle = night ? '#DCD6FF' : '#FFFFFF'
      ctx.beginPath()
      ctx.arc(x - 30 * s, y + 6 * s, 17 * s, 0, Math.PI * 2)
      ctx.arc(x - 5 * s, y, 24 * s, 0, Math.PI * 2)
      ctx.arc(x + 24 * s, y + 6 * s, 19 * s, 0, Math.PI * 2)
      ctx.rect(x - 38 * s, y + 6 * s, 70 * s, 20 * s)
      ctx.fill()
      ctx.restore()
    })

    // 远树
    this.sceneTrees.forEach((tree) => {
      const x = tree.x * W
      const s = tree.s * clamp(W / 390, 0.8, 1.2)
      ctx.save()
      ctx.globalAlpha = night ? 0.5 : 0.75
      ctx.fillStyle = night ? '#4A4478' : '#8FD98B'
      ctx.beginPath()
      ctx.arc(x, this.groundY - 26 * s, 22 * s, 0, Math.PI * 2)
      ctx.arc(x - 18 * s, this.groundY - 16 * s, 15 * s, 0, Math.PI * 2)
      ctx.arc(x + 18 * s, this.groundY - 16 * s, 15 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // 地面
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    ctx.bezierCurveTo(W * 0.3, this.groundY - 10, W * 0.66, this.groundY + 8, W, this.groundY - 4)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = night ? '#6F5E9E' : '#A8DF8E'
    ctx.fill()

    if (this.images.host && this.state !== 'start') {
      const size = clamp(W * 0.17, 54, 76)
      const bob = Math.sin(this.time * 1.6) * 4
      ctx.save()
      ctx.globalAlpha = 0.95
      ctx.drawImage(this.images.host, W - size - 4, this.groundY - size * 0.78 + bob, size, size)
      ctx.restore()
    }
  }

  drawActors() {
    this.drawShots()
    this.drawBalloons()
    this.drawTank()
    this.drawControls()
  }

  drawBalloons() {
    const ctx = this.ctx
    this.balloons.forEach((balloon) => {
      const r = balloon.r
      const bob = Math.sin(this.time * 2 + balloon.bob) * 2
      const x = balloon.x
      const y = balloon.y + bob
      ctx.save()
      // 线
      ctx.strokeStyle = 'rgba(138,106,80,0.55)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(x, y + r * 0.92)
      ctx.quadraticCurveTo(x + 6, y + r * 1.5, x - 2, y + r * 2.1)
      ctx.stroke()
      // 球身
      const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r)
      grad.addColorStop(0, '#FFFFFF')
      grad.addColorStop(0.4, balloon.color[0])
      grad.addColorStop(1, balloon.color[1])
      ctx.beginPath()
      ctx.ellipse(x, y, r * 0.88, r, 0, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 3
      ctx.stroke()
      // 结
      ctx.fillStyle = balloon.color[1]
      ctx.beginPath()
      ctx.moveTo(x, y + r * 0.98)
      ctx.lineTo(x - r * 0.16, y + r * 1.2)
      ctx.lineTo(x + r * 0.16, y + r * 1.2)
      ctx.closePath()
      ctx.fill()
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.beginPath()
      ctx.ellipse(x - r * 0.3, y - r * 0.36, r * 0.18, r * 0.26, -0.5, 0, Math.PI * 2)
      ctx.fill()
      if (balloon.hp > 1) {
        drawSparkle(ctx, x + r * 0.52, y - r * 0.5, 5, '#FFF6C9')
        drawLabel(ctx, '×2', x, y - r * 0.02, Math.max(9, r * 0.34), '#FFFFFF', 900)
      }
      ctx.restore()
    })
  }

  drawShots() {
    const ctx = this.ctx
    this.shots.forEach((shot) => {
      ctx.save()
      ctx.fillStyle = 'rgba(255,209,102,0.35)'
      ctx.beginPath()
      ctx.ellipse(shot.x, shot.y + 12, 5, 14, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFB45C'
      ctx.beginPath()
      ctx.arc(shot.x, shot.y, 7.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.restore()
    })
  }

  drawTank() {
    const ctx = this.ctx
    const w = this.tankW
    const h = this.tankH
    const x = this.tankX
    const y = this.groundY - h
    const recoil = this.recoil * 3
    ctx.save()
    ctx.translate(x, y)
    // 影子
    ctx.save()
    ctx.globalAlpha = 0.16
    ctx.fillStyle = '#5B3E2B'
    ctx.beginPath()
    ctx.ellipse(0, h + 3, w * 0.5, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // 履带
    fillRound(ctx, -w / 2, h * 0.5, w, h * 0.5, h * 0.25, '#7FD8C8')
    strokeRound(ctx, -w / 2, h * 0.5, w, h * 0.5, h * 0.25, '#5B3E2B', 3)
    for (let i = 0; i < 3; i += 1) {
      const cx = -w * 0.3 + i * w * 0.3
      ctx.save()
      ctx.fillStyle = '#5FBFAE'
      ctx.beginPath()
      ctx.arc(cx, h * 0.75, h * 0.13, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#5B3E2B'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
    // 车身
    fillRound(ctx, -w * 0.42, h * 0.12, w * 0.84, h * 0.42, h * 0.2, '#FFCE7A')
    strokeRound(ctx, -w * 0.42, h * 0.12, w * 0.84, h * 0.42, h * 0.2, '#5B3E2B', 3)
    // 炮管
    fillRound(ctx, -w * 0.045, -h * 0.5 - recoil, w * 0.09, h * 0.62, w * 0.045, '#FFB45C')
    ctx.strokeStyle = '#5B3E2B'
    ctx.lineWidth = 3
    roundedPath(ctx, -w * 0.045, -h * 0.5 - recoil, w * 0.09, h * 0.62, w * 0.045)
    ctx.stroke()
    // 炮塔（带笑脸）
    ctx.beginPath()
    ctx.fillStyle = '#FFB45C'
    ctx.arc(0, -h * 0.06 - recoil * 0.4, h * 0.36, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#5B3E2B'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(-h * 0.12, -h * 0.12 - recoil * 0.4, h * 0.075, 0, Math.PI * 2)
    ctx.arc(h * 0.12, -h * 0.12 - recoil * 0.4, h * 0.075, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3E2A1D'
    ctx.beginPath()
    ctx.arc(-h * 0.1, -h * 0.11 - recoil * 0.4, h * 0.036, 0, Math.PI * 2)
    ctx.arc(h * 0.14, -h * 0.11 - recoil * 0.4, h * 0.036, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#3E2A1D'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, h * 0.02 - recoil * 0.4, h * 0.1, 0.25, Math.PI - 0.25)
    ctx.stroke()
    ctx.restore()
  }

  drawControls() {
    // 只剩一个发射按钮；左右移动改为点屏幕两侧。
    this.drawFireButton(this.w * 0.5, this.controlY, 38)
  }

  drawFireButton(cx, cy, r) {
    const ctx = this.ctx
    const pressed = this.pressedId === 'tank-fire'
    const offset = pressed ? 4 : 0
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = '#D66C1A'
    ctx.arc(cx, cy + 6, r, 0, Math.PI * 2)
    ctx.fill()
    const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r)
    grad.addColorStop(0, '#FFB45C')
    grad.addColorStop(1, '#FF8F31')
    ctx.beginPath()
    ctx.fillStyle = pressed ? '#F18B31' : grad
    ctx.arc(cx, cy + offset, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cx, cy + offset, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * r * 0.44, cy + offset + Math.sin(angle) * r * 0.44)
      ctx.lineTo(cx + Math.cos(angle) * r * 0.66, cy + offset + Math.sin(angle) * r * 0.66)
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()
    }
    ctx.restore()
    this.buttons.push({ id: 'tank-fire', x: cx - r - 6, y: cy - r - 6, w: r * 2 + 12, h: r * 2 + 12 })
  }

  debugState() {
    return {
      ...super.debugState(),
      balloons: this.balloons.length,
      shots: this.shots.length,
      tankX: Math.round(this.tankX),
    }
  }

  debugHitOne() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    if (!this.balloons.length) this.spawnBalloon()
    const index = this.balloons.findIndex((balloon) => balloon.hp <= 1)
    this.hitBalloon(index >= 0 ? index : 0)
    return true
  }

  debugFinishLevel() {
    let guard = 0
    while (this.state === 'playing' && this.gameMode === 'ready' && guard < 100) {
      this.debugHitOne()
      guard += 1
    }
    return true
  }
}
