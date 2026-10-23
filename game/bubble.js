import {
  BaseGame, clamp, rand, drawSparkle, setFont, drawLabel, fillRound, strokeRound,
} from './engine.js'

// 泡泡海洋：戳破浮起来的海水泡泡，泡泡里会藏着海洋朋友。
// 关卡只调三件事：同屏泡泡数、上浮速度、泡泡造型（大/小/带刺）。

const LEVELS = [
  { chapter: 0, name: '小泡泡', goal: 6, bubbles: 6, speed: 0.55, friends: 1, tip: '戳破 6 个泡泡' },
  { chapter: 0, name: '泡泡多多', goal: 9, bubbles: 7, speed: 0.65, friends: 1, tip: '戳破 9 个泡泡' },
  { chapter: 0, name: '找朋友', goal: 12, bubbles: 7, speed: 0.72, friends: 2, tip: '找一找海洋朋友' },
  { chapter: 0, name: '泡泡雨', goal: 14, bubbles: 8, speed: 0.8, friends: 2, tip: '泡泡会飘得快一点' },

  { chapter: 1, name: '大泡泡', goal: 12, bubbles: 6, speed: 0.72, friends: 2, big: true, tip: '戳破大泡泡' },
  { chapter: 1, name: '稳稳戳', goal: 16, bubbles: 8, speed: 0.84, friends: 2, tip: '一个一个慢慢戳' },
  { chapter: 1, name: '三只朋友', goal: 16, bubbles: 8, speed: 0.88, friends: 3, tip: '找齐 3 位朋友' },
  { chapter: 1, name: '泡泡海浪', goal: 20, bubbles: 9, speed: 0.94, friends: 3, tip: '泡泡像海浪一样飘' },

  { chapter: 2, name: '泡泡派对', goal: 20, bubbles: 9, speed: 0.98, friends: 3, tip: '戳破 20 个泡泡' },
  { chapter: 2, name: '躲开小刺', goal: 20, bubbles: 9, speed: 1.02, friends: 3, spiky: 1, tip: '别戳有刺的泡泡' },
  { chapter: 2, name: '小小泡泡', goal: 22, bubbles: 10, speed: 1.06, friends: 3, small: true, tip: '小泡泡要戳准一点' },
  { chapter: 2, name: '更多小刺', goal: 22, bubbles: 10, speed: 1.1, friends: 3, spiky: 2, small: true, tip: '看清楚再戳' },

  { chapter: 3, name: '朋友集合', goal: 24, bubbles: 10, speed: 1.14, friends: 4, tip: '找齐 4 位海洋朋友' },
  { chapter: 3, name: '泡泡风暴', goal: 26, bubbles: 11, speed: 1.2, friends: 4, spiky: 1, tip: '泡泡很多，慢慢来' },
  { chapter: 3, name: '闪亮泡泡', goal: 26, bubbles: 11, speed: 1.24, friends: 4, spiky: 2, tip: '闪亮的泡泡算两个' },
  { chapter: 3, name: '海洋大冒险', goal: 30, bubbles: 12, speed: 1.3, friends: 4, spiky: 2, small: true, tip: '最后一段，加油' },
]

const FRIENDS = [
  { id: 'fish' },
  { id: 'crab' },
  { id: 'star' },
  { id: 'jelly' },
  { id: 'shell' },
  { id: 'octopus' },
]

const COLORS = [
  ['#F2FBFF', '#AEE6FB', '#5FC6EA'],
  ['#FFF0F6', '#FFC3D8', '#F58CAF'],
  ['#F3FDEC', '#C3EFB4', '#7FD070'],
  ['#FFF8E4', '#FFE1A6', '#F3B34B'],
  ['#F6F1FF', '#D5C7FA', '#A28CE8'],
]

const CONFIG = {
  id: 'bubble',
  name: '泡泡海洋',
  title: '泡泡海洋',
  titleColors: ['#2AA5DA', '#35BCD4', '#FFA63D', '#FF7E9E'],
  kicker: '戳一戳',
  tagline: '戳泡泡 · 找朋友',
  startLabel: '开始戳泡泡',
  loadingText: '海水正在变蓝…',
  ageText: '给 4-9 岁的泡泡小手',
  footer: '16 个关卡 · 无广告 · 可离线玩',
  hostName: '小海獭',
  iconText: '泡泡',
  meterIcon: '●',
  levels: LEVELS,
  levelsPerChapter: 4,
  chapters: [{ short: '浅湾' }, { short: '珊瑚' }, { short: '深海' }, { short: '浪花' }],
  storageKey: 'kids-bubble-progress-v1',
  audioPath: '/static/audio/bubble/',
  bgm: 'bgm.mp3',
  sfx: {
    pop: 'pop.mp3', star: 'star.mp3', splash: 'splash.mp3', level: 'level.mp3',
    celebrate: 'celebrate.mp3', friend: 'friend.mp3', ui: 'ui.mp3',
    pause: 'pause.mp3', resume: 'resume.mp3', nope: 'nope.mp3',
  },
  assets: {
    host: '/static/img/hosts/otter.png',
    fish: '/static/img/sea/fish.png',
    crab: '/static/img/sea/crab.png',
    star: '/static/img/sea/star.png',
    jelly: '/static/img/sea/jelly.png',
    shell: '/static/img/sea/shell.png',
    octopus: '/static/img/sea/octopus.png',
  },
}

export class BubbleGame extends BaseGame {
  constructor(options) {
    super(options, CONFIG)
    this.buildDecor()
  }

  buildDecor() {
    // 背景光柱与浮游微粒在关卡间保持一致，避免换关时画面跳动。
    const rng = this.level * 7919 + 41
    const random = mulberry((rng >>> 0))
    this.lights = Array.from({ length: 5 }, (_, index) => ({
      x: 0.08 + index * 0.22, width: 40 + random() * 26, phase: random() * Math.PI * 2,
    }))
    this.motes = Array.from({ length: 10 }, (_, index) => ({
      x: 0.06 + ((index * 0.117) % 0.9), offset: random() * 900,
      phase: random() * Math.PI * 2, r: 3 + random() * 6,
    }))
  }

  beginLevel(level, runStart) {
    super.beginLevel(level, runStart)
    this.buildDecor()
  }

  resetLevelData() {
    super.resetLevelData()
    this.bubbles = []
    this.spawnTimer = 0
    this.foundFriends = []
    this.friendOrder = []
    this.combo = 0
    this.comboUntil = 0
    this.sparkleUntil = 0
    this.lastPopAt = -10
  }

  setupLevel(cfg) {
    this.bubbles = []
    this.foundFriends = []
    this.combo = 0
    this.sparkleUntil = 0
    this.spawnTimer = 0.1
    this.maxBubbles = cfg.bubbles
    this.bubbleSpeed = cfg.speed
    this.spikyCount = cfg.spiky || 0
    this.bigBubbles = !!cfg.big
    this.smallBubbles = !!cfg.small
    this.friendsNeeded = cfg.friends || 1
    this.friendOrder = shuffle(FRIENDS.slice()).slice(0, this.friendsNeeded)
    this.nextFriendPop = Math.max(2, Math.round(this.goal / (this.friendsNeeded + 1)))
    this.popsUntilFriend = this.nextFriendPop
    for (let i = 0; i < 3; i += 1) this.spawnBubble(true)
  }

  getObjectiveText() {
    if (this.foundFriends.length < this.friendsNeeded) {
      return '找朋友 ' + this.foundFriends.length + '/' + this.friendsNeeded
    }
    return '戳破泡泡 ' + this.progress + '/' + this.goal
  }

  getStartHint() {
    return '戳一戳泡泡'
  }

  getResultLines() {
    const best = Math.max(this.bestScores[this.level] || 0, this.score)
    const friendText = this.foundFriends.length
      ? '你找到了 ' + this.foundFriends.length + ' 位海洋朋友！'
      : '泡泡都变成彩色的啦！'
    return {
      title: this.celebrateFinal ? '海洋大丰收！' : '真棒！',
      tip: friendText + ' 下一片海还想和你玩。',
      scoreText: '戳破 ' + this.score + ' 个泡泡 · 最好 ' + best + ' 个',
    }
  }

  drawObjectiveIcon(cx, cy) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = 'rgba(160,226,246,0.85)'
    ctx.strokeStyle = '#3AA8CC'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(cx - 2.4, cy - 2.8, 2.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  updatePlay(dt) {
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0 && this.bubbles.length < this.maxBubbles) {
      this.spawnBubble(false)
      this.spawnTimer = rand(0.24, 0.46)
    }
    if (this.combo > 0 && this.time > this.comboUntil) this.combo = 0

    for (let i = this.bubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.bubbles[i]
      bubble.y -= bubble.speed * dt
      bubble.phase += dt * bubble.wobbleSpeed
      bubble.x = bubble.baseX + Math.sin(bubble.phase) * bubble.wobble
      if (bubble.y < -bubble.r - 24) {
        this.bubbles.splice(i, 1)
        this.spawnTimer = Math.min(this.spawnTimer, 0.12)
      }
    }
  }

  updateClear(dt) {
    this.bubbles.forEach((bubble) => {
      bubble.y -= bubble.speed * 0.5 * dt
      bubble.alpha = Math.max(0, bubble.alpha - dt * 0.9)
    })
    this.bubbles = this.bubbles.filter((bubble) => bubble.alpha > 0.02)
  }

  spawnBubble(initial) {
    const W = this.w
    const H = this.h
    const base = this.smallBubbles ? rand(0.13, 0.17) : this.bigBubbles ? rand(0.21, 0.27) : rand(0.16, 0.22)
    const r = clamp(W * base, 30, this.smallBubbles ? 50 : 74)
    const spikyLeft = this.bubbles.reduce((count, item) => count + (item.spiky ? 1 : 0), 0)
    const spiky = spikyLeft < this.spikyCount && Math.random() < 0.25
    const friendWaiting = this.foundFriends.length < this.friendsNeeded
    const friendOnScreen = this.bubbles.some((item) => item.friend)
    const shouldCarryFriend = !spiky && friendWaiting && !friendOnScreen && this.popsUntilFriend <= 0
    const friend = shouldCarryFriend ? this.friendOrder[this.foundFriends.length] : null
    if (shouldCarryFriend) {
      this.popsUntilFriend = Math.max(2, Math.round(this.goal / (this.friendsNeeded + 1)))
    } else if (!friendOnScreen) {
      this.popsUntilFriend -= 1
    }
    const baseX = rand(r + 16, W - r - 16)
    const bubble = {
      id: this.makeUid('b'),
      x: baseX, baseX,
      y: initial ? rand(H * 0.34, H * 0.9) : H + r + 8,
      r,
      phase: rand(0, Math.PI * 2), wobble: rand(5, 16), wobbleSpeed: rand(0.6, 1.2),
      speed: rand(26, 40) * this.bubbleSpeed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spiky,
      friend: shouldCarryFriend ? friend : null,
      sparkly: !spiky && !shouldCarryFriend && Math.random() < 0.14,
      alpha: 1,
    }
    this.bubbles.push(bubble)
    return bubble
  }

  onTapInPlay(x, y) {
    for (let i = this.bubbles.length - 1; i >= 0; i -= 1) {
      const bubble = this.bubbles[i]
      const dx = x - bubble.x
      const dy = y - bubble.y
      if (dx * dx + dy * dy <= (bubble.r + 14) * (bubble.r + 14)) {
        this.popBubble(bubble)
        return
      }
    }
    this.addRipple(x, y)
  }

  addRipple(x, y) {
    this.particles.push({
      type: 'ring', x, y, vx: 0, vy: 0, gravity: 0, size: 6, grow: 70,
      color: 'rgba(255,255,255,0.7)', life: 0.45, max: 0.45,
    })
  }

  popBubble(bubble) {
    if (this.finishing) return
    const index = this.bubbles.indexOf(bubble)
    if (index >= 0) this.bubbles.splice(index, 1)
    if (bubble.spiky) {
      this.audio.play('nope')
      this.combo = 0
      this.hudShakeUntil = this.time + 0.24
      this.addFloater('这个有刺哦', bubble.x, bubble.y - bubble.r, '#B5623E')
      this.burstBubble(bubble, '#D9C3B4', 5)
      this.spawnTimer = Math.min(this.spawnTimer, 0.2)
      return
    }

    const combo = this.time - this.lastPopAt <= 2.4 ? this.combo + 1 : 1
    this.combo = combo
    this.comboUntil = this.time + 2.4
    this.lastPopAt = this.time
    this.audio.play(combo % 4 === 0 ? 'star' : 'pop')

    const value = bubble.sparkly ? 2 : 1
    this.score += value
    this.progress = Math.min(this.goal, this.progress + value)
    this.burstBubble(bubble, bubble.color[1], bubble.sparkly ? 16 : 10)
    this.addFloater(bubble.sparkly ? '+2' : '+1', bubble.x, bubble.y - bubble.r * 0.65, bubble.color[2])

    if (bubble.friend) {
      this.foundFriends.push(bubble.friend)
      this.sparkleUntil = this.time + 0.9
      this.audio.play('friend')
      this.addFloater('找到朋友啦！', bubble.x, bubble.y - bubble.r - 26, '#1E8DB4')
      this.burstConfetti(12)
    }

    if (this.progress >= this.goal) this.finishRound(0.3)
  }

  burstBubble(bubble, color, count) {
    this.audio.play('splash')
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(50, 180)
      this.particles.push({
        type: i % 3 === 0 ? 'sparkle' : 'bubble', x: bubble.x, y: bubble.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30,
        gravity: 50, size: rand(2.5, 6), color: i % 3 === 0 ? '#FFFFFF' : color,
        life: rand(0.35, 0.7), max: 0.7, rotation: 0, spin: 0,
      })
    }
  }

  drawWorld() {
    const ctx = this.ctx
    const W = this.w
    const H = this.h
    const floor = H - clamp(H * 0.1, 52, 82)

    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#C9F1FF')
    sky.addColorStop(0.45, '#93E1F6')
    sky.addColorStop(1, '#58C8EC')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    for (const light of this.lights) {
      const x = W * light.x + Math.sin(this.time * 0.3 + light.phase) * 10
      ctx.save()
      ctx.globalAlpha = 0.13
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + light.width, 0)
      ctx.lineTo(x - 30, H)
      ctx.lineTo(x - 30 - light.width, H)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    for (const mote of this.motes) {
      const y = H - ((this.time * 16 + mote.offset) % (H + 90)) + 30
      const x = W * mote.x + Math.sin(this.time * 0.6 + mote.phase) * 12
      ctx.beginPath()
      ctx.arc(x, y, mote.r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    const sand = ctx.createLinearGradient(0, floor, 0, H)
    sand.addColorStop(0, '#FFE9BC')
    sand.addColorStop(1, '#EFC987')
    ctx.beginPath()
    ctx.moveTo(0, floor + 14)
    ctx.bezierCurveTo(W * 0.2, floor - 8, W * 0.42, floor + 12, W * 0.62, floor + 2)
    ctx.bezierCurveTo(W * 0.82, floor - 6, W * 0.92, floor + 10, W, floor)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = sand
    ctx.fill()

    ctx.save()
    ctx.strokeStyle = '#6FCFA2'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    for (let i = 0; i < 5; i += 1) {
      const x = W * (0.1 + i * 0.2)
      const sway = Math.sin(this.time * 1.2 + i) * 10
      ctx.beginPath()
      ctx.moveTo(x, H - 4)
      ctx.quadraticCurveTo(x + sway, H - 44, x + sway * 1.3, H - 82)
      ctx.stroke()
    }
    ctx.restore()

    const coralColors = ['#FF9FB0', '#FFB36B', '#B79BF0']
    coralColors.forEach((color, i) => {
      const bx = W * (0.12 + i * 0.37)
      const by = floor + 6
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.quadraticCurveTo(bx - 10, by - 40, bx - 4, by - 66)
      ctx.moveTo(bx, by - 24)
      ctx.quadraticCurveTo(bx + 22, by - 44, bx + 26, by - 66)
      ctx.moveTo(bx - 2, by - 40)
      ctx.quadraticCurveTo(bx - 26, by - 52, bx - 30, by - 72)
      ctx.stroke()
      ctx.restore()
    })

    if (this.state === 'playing' && this.images.host) {
      const size = clamp(W * 0.2, 64, 92)
      const bob = Math.sin(this.time * 1.6) * 5
      ctx.save()
      ctx.globalAlpha = 0.96
      ctx.drawImage(this.images.host, W - size - 6, floor - size * 0.72 + bob, size, size)
      ctx.restore()
    }
  }

  drawHostBackdrop(center, bottom, size) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.ellipse(center, bottom - size * 0.42, size * 0.6, size * 0.56, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawActors() {
    const ctx = this.ctx
    this.bubbles.forEach((bubble) => {
      const r = bubble.r
      ctx.save()
      ctx.globalAlpha = bubble.alpha

      if (bubble.spiky) {
        ctx.strokeStyle = 'rgba(255,138,128,0.4)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, r + 5, 0, Math.PI * 2)
        ctx.stroke()
      }

      const grad = ctx.createRadialGradient(
        bubble.x - r * 0.34, bubble.y - r * 0.36, r * 0.1,
        bubble.x, bubble.y, r
      )
      grad.addColorStop(0, 'rgba(255,255,255,0.95)')
      grad.addColorStop(0.42, bubble.color[0])
      grad.addColorStop(1, bubble.color[1])
      ctx.beginPath()
      ctx.arc(bubble.x, bubble.y, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = bubble.spiky ? '#E8746B' : '#FFFFFF'
      ctx.lineWidth = 3
      ctx.stroke()

      if (bubble.spiky) {
        ctx.fillStyle = '#E8746B'
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2 + this.time * 0.5
          const px = bubble.x + Math.cos(angle) * r
          const py = bubble.y + Math.sin(angle) * r
          ctx.beginPath()
          ctx.moveTo(px + Math.cos(angle) * 9, py + Math.sin(angle) * 9)
          ctx.lineTo(px + Math.cos(angle + 0.55) * 3, py + Math.sin(angle + 0.55) * 3)
          ctx.lineTo(px + Math.cos(angle - 0.55) * 3, py + Math.sin(angle - 0.55) * 3)
          ctx.closePath()
          ctx.fill()
        }
      }

      if (bubble.friend) {
        const image = this.images[bubble.friend.id]
        if (image) {
          ctx.save()
          ctx.beginPath()
          ctx.arc(bubble.x, bubble.y + 1, r * 0.6, 0, Math.PI * 2)
          ctx.clip()
          ctx.globalAlpha = bubble.alpha * 0.92
          ctx.drawImage(image, bubble.x - r * 0.66, bubble.y - r * 0.65, r * 1.32, r * 1.32)
          ctx.restore()
        }
      } else if (bubble.sparkly) {
        for (let i = 0; i < 2; i += 1) {
          const angle = this.time * 1.8 + i * Math.PI
          drawSparkle(ctx, bubble.x + Math.cos(angle) * r * 0.42, bubble.y + Math.sin(angle) * r * 0.42, 4.5, '#FFF6C9')
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.beginPath()
      ctx.ellipse(bubble.x - r * 0.33, bubble.y - r * 0.4, r * 0.19, r * 0.13, -0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(bubble.x + r * 0.29, bubble.y + r * 0.32, r * 0.08, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  drawExtraHud(y) {
    if (this.friendsNeeded <= 1) return
    const ctx = this.ctx
    const gap = 30
    const startX = this.w / 2 - ((this.friendsNeeded - 1) * gap) / 2
    for (let i = 0; i < this.friendsNeeded; i += 1) {
      const found = i < this.foundFriends.length
      const cx = startX + i * gap
      ctx.save()
      if (found) {
        const image = this.images[this.foundFriends[i].id]
        if (image) ctx.drawImage(image, cx - 12, y - 12, 24, 24)
      } else {
        ctx.globalAlpha = 0.8
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.beginPath()
        ctx.arc(cx, y, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#8FD9F7'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  drawExtraOverlays() {
    const ctx = this.ctx
    if (this.combo >= 3) {
      const text = '连戳 ×' + this.combo
      setFont(ctx, 15, 900)
      const width = ctx.measureText(text).width + 36
      const x = (this.w - width) / 2
      const y = this.h * 0.22
      const grad = ctx.createLinearGradient(x, y, x, y + 34)
      grad.addColorStop(0, '#63CFF0')
      grad.addColorStop(1, '#3FA9D8')
      ctx.save()
      fillRound(ctx, x, y + 3, width, 34, 17, 'rgba(33,120,155,0.25)')
      fillRound(ctx, x, y, width, 34, 17, grad)
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
      if (particle.type === 'ring') {
        particle.size += 70 * 0.016
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.stroke()
      } else if (particle.type === 'bubble') {
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.strokeStyle = particle.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      } else if (particle.type === 'sparkle') {
        drawSparkle(ctx, particle.x, particle.y, particle.size, particle.color)
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
      found: this.foundFriends.map((friend) => friend.id),
      friendsNeeded: this.friendsNeeded,
      bubbles: this.bubbles.length,
      combo: this.combo,
    }
  }

  debugPopOne() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    if (!this.bubbles.length) this.spawnBubble(false)
    const usable = this.bubbles.filter((bubble) => !bubble.spiky)
    this.popBubble(usable[0] || this.bubbles[0])
    return true
  }

  debugPopAll() {
    let guard = 0
    while (this.state === 'playing' && this.gameMode === 'ready' && guard < 200) {
      this.debugPopOne()
      guard += 1
    }
    return true
  }
}

function mulberry(seed) {
  let state = seed >>> 0
  return function random() {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
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
