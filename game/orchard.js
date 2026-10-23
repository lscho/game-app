const STORAGE_FRIENDS = 'bunny-native-friends-v1'
const STORAGE_MUTED = 'bunny-native-muted-v1'
const STORAGE_PROGRESS = 'bunny-native-progress-v1'
const MAX_LEVEL = 20

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const rand = (min, max) => min + Math.random() * (max - min)

const RAINBOW = ['#FF6B6B', '#FFA94D', '#FFD93D', '#7BD88F', '#5CC8FF', '#B08CFF']

const FRUITS = {
  apple: { points: 1, colors: ['#FF7B73', '#FFD1CE', '#E74B58'] },
  orange: { points: 1, colors: ['#FFB75C', '#FFE2AC', '#F79932'] },
  strawberry: { points: 1, colors: ['#FF7E9C', '#FFC4D0', '#EE4C73'] },
  banana: { points: 1, colors: ['#FFD95E', '#FFF4B8', '#F8CB47'] },
  grape: { points: 1, colors: ['#B18CFF', '#DDCBFF', '#8D63E8'] },
  watermelon: { points: 1, colors: ['#FF7884', '#A6E3AE', '#63C174'] },
  star: { points: 2, colors: ['#FFD35C', '#FFF3B8', '#FFB52F'] }
}
const FRUIT_LABELS = {
  apple: '苹果',
  orange: '橙子',
  strawberry: '草莓',
  banana: '香蕉',
  grape: '葡萄',
  watermelon: '西瓜',
  star: '星星果'
}
const COLLECT_KEYS = ['apple', 'orange', 'strawberry', 'banana', 'grape', 'watermelon']

const CHAPTERS = [
  { name: '晨光果园', short: '晨光', color: '#D58A12', tint: '#FFF0C4' },
  { name: '彩虹山谷', short: '彩虹', color: '#279C86', tint: '#DDF7EF' },
  { name: '晚霞果园', short: '晚霞', color: '#D96F4B', tint: '#FFE4D7' },
  { name: '星光果园', short: '星光', color: '#6674C9', tint: '#E7E9FF' },
  { name: '云端果园', short: '云端', color: '#338FC4', tint: '#DFF2FF' }
]

const MECHANIC_LABELS = {
  classic: '采摘',
  order: '顺序',
  target: '目标',
  avoid: '躲蜂',
  combo: '连击',
  collect: '收集',
  star: '星星'
}

const FRIENDS = [
  { id: 'squirrel', name: '小松鼠', line: '小松鼠闻到了果香，跑来和你做朋友！' },
  { id: 'hedgehog', name: '小刺猬', line: '小刺猬背着小红果，来给你鼓掌啦！' },
  { id: 'bird', name: '小鸟', line: '小鸟也飞来了，三个好朋友都到齐啦！' }
]

const THEMES = [
  {
    name: '晨光果园',
    skyTop: '#8ADFFF', skyMid: '#D8F6FF', skyBottom: '#FFF4D7',
    sunType: 'sun', sunColor: '#FFE07A', sunRay: 'rgba(255,207,84,0.42)', sunY: 0.135,
    hills: ['#C7E9AE', '#A3DD97', '#7FCC87'],
    groundTop: '#90D98B', groundBottom: '#61B970',
    treeCanopy: '#78C77C', treeLight: '#9BDC92', trunk: '#A7794D', treeFruit: '#FF8E76',
    grass: '#5FAE66', flowers: ['#FFB7C5', '#FFF6D8', '#FFD86B'],
    rainbowAlpha: 0.1, stars: 0, butterflies: 0, fireflies: 0, petals: 7, night: false,
    cloudCount: 5, clouds: '#FFFFFF'
  },
  {
    name: '彩虹山谷',
    skyTop: '#91D8FF', skyMid: '#FFE8D4', skyBottom: '#FFF5E4',
    sunType: 'sun', sunColor: '#FFCE70', sunRay: 'rgba(255,184,82,0.4)', sunY: 0.17,
    hills: ['#BBE6A1', '#94D48A', '#73C37C'],
    groundTop: '#86D381', groundBottom: '#59AF68',
    treeCanopy: '#6FBF74', treeLight: '#9BDB8D', trunk: '#9E7249', treeFruit: '#FFAA69',
    grass: '#58A961', flowers: ['#FFAFC4', '#FFF3D2', '#FFCE69'],
    rainbowAlpha: 0.26, stars: 0, butterflies: 3, fireflies: 0, petals: 4, night: false,
    cloudCount: 5, clouds: '#FFFFFF'
  },
  {
    name: '晚霞果园',
    skyTop: '#8395E0', skyMid: '#FFB79B', skyBottom: '#FFE8C2',
    sunType: 'sun', sunColor: '#FFC46B', sunRay: 'rgba(255,177,104,0.36)', sunY: 0.205,
    hills: ['#C9D48E', '#AFC07C', '#93AE70'],
    groundTop: '#9AC878', groundBottom: '#6C9F58',
    treeCanopy: '#6FA967', treeLight: '#8CC17D', trunk: '#8B6547', treeFruit: '#FFB26E',
    grass: '#5F9354', flowers: ['#FFC1C9', '#FFE9C9', '#F7B76B'],
    rainbowAlpha: 0.18, stars: 0, butterflies: 0, fireflies: 6, petals: 5, night: false,
    cloudCount: 4, clouds: '#FFE8DE'
  },
  {
    name: '星光果园',
    skyTop: '#3D477E', skyMid: '#6D69A2', skyBottom: '#F0AC97',
    sunType: 'moon', sunColor: '#FFF1C4', sunRay: 'rgba(255,238,192,0.22)', sunY: 0.14,
    hills: ['#56747E', '#44656E', '#35545F'],
    groundTop: '#4B8169', groundBottom: '#315F54',
    treeCanopy: '#3C6059', treeLight: '#4A7165', trunk: '#4A4A4C', treeFruit: '#FFB06E',
    grass: '#3B6E5F', flowers: ['#DAB9E8', '#FFE6BC', '#F4B7C1'],
    rainbowAlpha: 0.1, stars: 32, butterflies: 0, fireflies: 14, petals: 0, night: true,
    cloudCount: 5, clouds: '#D8DDF6'
  },
  {
    name: '云端果园',
    skyTop: '#5EC8FF', skyMid: '#C7EDFF', skyBottom: '#F8FDFF',
    sunType: 'sun', sunColor: '#FFF0A8', sunRay: 'rgba(255,238,158,0.4)', sunY: 0.12,
    hills: ['#CDEBBC', '#A9DCA6', '#7FC98A'],
    groundTop: '#A5DFA0', groundBottom: '#76C181',
    treeCanopy: '#79C98B', treeLight: '#A2DEA5', trunk: '#A87C52', treeFruit: '#FF9A7E',
    grass: '#66B473', flowers: ['#FFF0B0', '#FFC8D8', '#C6E8FF'],
    rainbowAlpha: 0.3, stars: 0, butterflies: 5, fireflies: 0, petals: 9, night: false,
    cloudCount: 8, clouds: '#FFFFFF'
  }
]

const LEVELS = [
  { chapter: 0, name: '初次采摘', mechanic: 'classic', goal: 8, tip: '接住 8 个水果，唤醒彩虹', speed: 0.21, spawn: 1.12, maxFruits: 4, starChance: 0 },
  { chapter: 0, name: '果香满筐', mechanic: 'classic', goal: 10, tip: '接住 10 个水果，星星果会加分', speed: 0.225, spawn: 1.0, maxFruits: 4, starChance: 0.07 },
  { chapter: 0, name: '只接苹果', mechanic: 'target', goal: 6, tip: '只接红苹果，别接错哦', speed: 0.225, spawn: 0.95, maxFruits: 4, targetKeys: ['apple'], targetRate: 0.55 },
  { chapter: 0, name: '红果任务', mechanic: 'target', goal: 8, tip: '苹果和草莓都算，接满 8 个', speed: 0.235, spawn: 0.92, maxFruits: 5, targetKeys: ['apple', 'strawberry'], targetRate: 0.52 },

  { chapter: 1, name: '顺序小达人', mechanic: 'order', goal: 6, tip: '按照上面的顺序接水果', orderLength: 3, speed: 0.23, spawn: 0.95, maxFruits: 4 },
  { chapter: 1, name: '顺序接力', mechanic: 'order', goal: 8, tip: '顺序会变，看仔细哦', orderLength: 3, speed: 0.245, spawn: 0.88, maxFruits: 5 },
  { chapter: 1, name: '连击彩虹', mechanic: 'combo', goal: 5, tip: '一口气连击 5 次，不要断哦', comboWindow: 2.6, speed: 0.235, spawn: 0.7, maxFruits: 5 },
  { chapter: 1, name: '四种水果', mechanic: 'order', goal: 8, tip: '顺序更长了，慢慢来', orderLength: 4, speed: 0.25, spawn: 0.86, maxFruits: 5 },

  { chapter: 2, name: '小心蜜蜂', mechanic: 'avoid', goal: 10, tip: '躲开小蜜蜂，接住 10 个水果', hazardChance: 0.2, speed: 0.24, spawn: 0.9, maxFruits: 5 },
  { chapter: 2, name: '蜜蜂来了', mechanic: 'avoid', goal: 12, tip: '蜜蜂变多了，保护好篮筐', hazardChance: 0.28, speed: 0.255, spawn: 0.84, maxFruits: 6 },
  { chapter: 2, name: '边躲边排队', mechanic: 'order', goal: 8, tip: '按顺序接，还要躲开蜜蜂', orderLength: 4, hazardChance: 0.16, speed: 0.25, spawn: 0.86, maxFruits: 5 },
  { chapter: 2, name: '换目标啦', mechanic: 'target', goal: 9, tip: '每接 3 个，目标就会换', targetKeys: ['orange', 'grape', 'watermelon'], targetRotate: 3, targetRate: 0.52, hazardChance: 0.1, speed: 0.255, spawn: 0.85, maxFruits: 5 },

  { chapter: 3, name: '星星雨', mechanic: 'star', goal: 5, tip: '接住 5 颗星星果', starRate: 0.52, speed: 0.24, spawn: 0.9, maxFruits: 5 },
  { chapter: 3, name: '更多星星', mechanic: 'star', goal: 7, tip: '星星果藏在水果里，接住 7 颗', starRate: 0.48, speed: 0.26, spawn: 0.82, maxFruits: 6 },
  { chapter: 3, name: '彩虹收集', mechanic: 'collect', goal: 6, tip: '每种水果各接 1 个', speed: 0.245, spawn: 0.85, maxFruits: 5 },
  { chapter: 3, name: '星光连击', mechanic: 'combo', goal: 7, tip: '在星光下连击 7 次', comboWindow: 2.6, speed: 0.255, spawn: 0.66, maxFruits: 6 },

  { chapter: 4, name: '收集彩虹', mechanic: 'collect', goal: 12, tip: '收集两轮彩虹，共 12 个', speed: 0.26, spawn: 0.8, maxFruits: 6 },
  { chapter: 4, name: '云端长队', mechanic: 'order', goal: 9, tip: '五连顺序，还要躲蜜蜂', orderLength: 5, hazardChance: 0.16, speed: 0.265, spawn: 0.78, maxFruits: 6 },
  { chapter: 4, name: '蜜蜂大作战', mechanic: 'avoid', goal: 15, tip: '接住 15 个水果，躲开蜜蜂', hazardChance: 0.32, speed: 0.275, spawn: 0.72, maxFruits: 7 },
  { chapter: 4, name: '彩虹终章', mechanic: 'collect', goal: 12, tip: '最后挑战：收集彩虹，还要躲蜜蜂', hazardChance: 0.2, speed: 0.275, spawn: 0.74, maxFruits: 6 }
]

function mulberry32(seed) {
  let state = seed >>> 0
  return function random() {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function fillRound(ctx, x, y, width, height, radius, color) {
  roundedPath(ctx, x, y, width, height, radius)
  ctx.fillStyle = color
  ctx.fill()
}

function strokeRound(ctx, x, y, width, height, radius, color, lineWidth) {
  roundedPath(ctx, x, y, width, height, radius)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

// Path2D 版本：Path2D 创建时本身就是空路径，不能像 ctx 那样先 beginPath。
function roundRectOn(path, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  path.moveTo(x + r, y)
  path.arcTo(x + width, y, x + width, y + height, r)
  path.arcTo(x + width, y + height, x, y + height, r)
  path.arcTo(x, y + height, x, y, r)
  path.arcTo(x, y, x + width, y, r)
  path.closePath()
}

// 同一条 Path2D 里连续 arc/ellipse 会用直线连接上一个子路径，
// 批量作画前必须先 moveTo 到起点，否则不同树、不同花之间会连出直线。
function arcOn(path, x, y, radius, start, end, anticlockwise) {
  path.moveTo(x + Math.cos(start) * radius, y + Math.sin(start) * radius)
  path.arc(x, y, radius, start, end, !!anticlockwise)
}

function ellipseOn(path, x, y, radiusX, radiusY, rotation, start, end, anticlockwise) {
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const px = radiusX * Math.cos(start)
  const py = radiusY * Math.sin(start)
  path.moveTo(x + px * cos - py * sin, y + px * sin + py * cos)
  path.ellipse(x, y, radiusX, radiusY, rotation, start, end, !!anticlockwise)
}

function setFont(ctx, size, weight) {
  ctx.font = `${weight || 700} ${Math.round(size)}px sans-serif`
}

function drawLabel(ctx, text, x, y, size, color, weight, align) {
  setFont(ctx, size, weight)
  ctx.fillStyle = color
  ctx.textAlign = align || 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

function wrapLines(ctx, text, maxWidth) {
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

function drawSparkle(ctx, x, y, size, color) {
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

function readBoolean(key, fallback) {
  try {
    const value = uni.getStorageSync(key)
    if (value === '' || value === undefined || value === null) return fallback
    return value === true || value === 'true' || value === 1 || value === '1'
  } catch (error) {
    return fallback
  }
}

function readFriends() {
  try {
    const raw = uni.getStorageSync(STORAGE_FRIENDS)
    if (!raw) return []
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id) => FRIENDS.some((friend) => friend.id === id))
  } catch (error) {
    return []
  }
}

function readProgress() {
  try {
    const raw = uni.getStorageSync(STORAGE_PROGRESS)
    if (!raw) return { unlocked: 1, completed: [] }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const unlocked = clamp(Number(parsed && parsed.unlocked) || 1, 1, MAX_LEVEL)
    const completed = Array.isArray(parsed && parsed.completed)
      ? parsed.completed.map((value) => Number(value)).filter((value) => value >= 1 && value <= MAX_LEVEL)
      : []
    return { unlocked, completed: Array.from(new Set(completed)) }
  } catch (error) {
    return { unlocked: 1, completed: [] }
  }
}

class NativeAudio {
  constructor() {
    this.ready = false
    this.muted = readBoolean(STORAGE_MUTED, false)
    this.musicDesired = false
    this.playSafe = (audio) => {
      try {
        const result = audio.play()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // Ignore playback errors.
      }
    }
    this.pauseSafe = (audio) => {
      try {
        const result = audio.pause()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // Ignore pause errors.
      }
    }
    this.stopSafe = (audio) => {
      try {
        const result = audio.stop()
        if (result && typeof result.catch === 'function') result.catch(() => {})
      } catch (error) {
        // Ignore stop errors.
      }
    }
    this.bgm = null
    this.voiceContext = null
    this.voiceTimer = null
    this.sfx = {}
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
    this.bgm = this.makeContext('/static/audio/bgm.mp3', this.muted ? 0 : 0.3, true)
    this.voiceContext = this.makeContext('', 1, false)
    const files = {
      'catch-1': 'catch-1.mp3', 'catch-2': 'catch-2.mp3', 'catch-3': 'catch-3.mp3',
      'catch-4': 'catch-4.mp3', 'catch-5': 'catch-5.mp3', 'catch-6': 'catch-6.mp3',
      star: 'star.mp3', miss: 'miss.mp3', ui: 'ui.mp3', pause: 'pause.mp3',
      resume: 'resume.mp3', level: 'level.mp3', friend: 'friend.mp3', celebrate: 'celebrate.mp3'
    }
    Object.keys(files).forEach((key) => {
      this.sfx[key] = this.makeContext('/static/audio/' + files[key], key === 'celebrate' ? 1 : 0.95, false)
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
    try {
      uni.setStorageSync(STORAGE_MUTED, this.muted)
    } catch (error) {
      // Ignore storage errors.
    }
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

  playVoice(key) {
    this.ensure()
    if (this.muted || !this.voiceContext) return
    this.stopSafe(this.voiceContext)
    this.voiceContext.src = '/static/audio/voice/' + key + '.mp3'
    this.voiceContext.volume = 1
    this.playSafe(this.voiceContext)
  }

  stopVoice() {
    if (this.voiceTimer) {
      clearTimeout(this.voiceTimer)
      this.voiceTimer = null
    }
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
        // Ignore.
      }
    })
    this.sfx = {}
    this.bgm = null
    this.voiceContext = null
    this.ready = false
  }
}

export class OrchardGame {
  constructor(options) {
    this.canvasContext = options.canvasContext
    this.ctx = options.ctx
    this.w = options.width
    this.h = options.height
    this.dpr = options.dpr || 2
    this.safeTop = options.safeTop || 0
    this.safeBottom = options.safeBottom || 0
    this.images = {}
    this.imagesReady = false
    this.imagesLoaded = 0
    this.imagesTotal = 17
    this.audio = new NativeAudio()
    this.unlocked = readFriends()
    const savedProgress = readProgress()
    this.maxUnlocked = savedProgress.unlocked
    this.completedLevels = new Set(savedProgress.completed)
    this.buttons = []
    this.pressedId = null
    this.pressStartX = 0
    this.pressStartY = 0
    this.exitPrompt = false
    this.state = 'loading'
    this.gameMode = 'idle'
    this.time = 0
    this.lastTs = 0
    this.totalCaught = 0
    this.level = 1
    this.levelConfig = LEVELS[0]
    this.goal = LEVELS[0].goal
    this.theme = THEMES[LEVELS[0].chapter]
    this.layout()
    this.buildDecor()
    this.resetRoundData()
    this.friends = FRIENDS
    this.hintSeen = false
    this.hintUntil = 0
    this.bannerTitle = ''
    this.bannerSub = ''
    this.bannerUntil = 0
    this.comboUntil = 0
    this.celebrateFinal = false
    this.celebrateCaught = 0
    this.celebrateCount = 0
    this.celebrateFriend = null
    this.celebrateNewFriend = false
    this.pendingVoice = null
    this.roundClearAt = 0
    this.rainbowReveal = 0
    this.mapReturnState = 'start'
    this.toastText = ''
    this.toastUntil = 0
    this.loadImages()
    this.rafId = 0
    this.loopBound = this.loop.bind(this)
    this.rafId = this.canvasContext.requestAnimationFrame(this.loopBound)

    if (typeof window !== 'undefined') {
      window.__orchardGame = this
    }
  }

  layout() {
    this.groundY = this.h - clamp(this.h * 0.115, 84, 112)
    this.bunnyW = clamp(this.w * 0.47, 148, 198)
    this.bunnyH = this.bunnyW * 250 / 220
    this.bunnyBottom = this.groundY + 8
    this.bunnyX = this.bunnyX || this.w / 2
    this.targetX = this.targetX || this.bunnyX
    this.tilt = 0
    this.catchY = this.bunnyBottom - this.bunnyH * 0.232 - 12
    this.catchHalf = this.bunnyW * 0.41
    this.minX = Math.max(38, this.w * 0.1)
    this.maxX = this.w - this.minX
  }

  loadImages() {
    const sources = {
      apple: '/static/img/fruits/apple.png',
      orange: '/static/img/fruits/orange.png',
      strawberry: '/static/img/fruits/strawberry.png',
      banana: '/static/img/fruits/banana.png',
      grape: '/static/img/fruits/grape.png',
      watermelon: '/static/img/fruits/watermelon.png',
      star: '/static/img/fruits/star.png',
      squirrel: '/static/img/friends/squirrel.png',
      hedgehog: '/static/img/friends/hedgehog.png',
      bird: '/static/img/friends/bird.png',
      bunnyIdle: '/static/img/bunny-idle.png',
      bunnyBlink: '/static/img/bunny-blink.png',
      bunnyHappy: '/static/img/bunny-happy.png'
    }
    this.imagesTotal = Object.keys(sources).length
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

  resetRoundData() {
    this.progress = 0
    this.caughtInLevel = 0
    this.combo = 0
    this.bestCombo = 0
    this.lastCatchAt = -20
    this.fruits = []
    this.particles = []
    this.floaters = []
    this.confetti = []
    this.splashes = []
    this.bunnyX = this.w / 2
    this.targetX = this.w / 2
    this.tilt = 0
    this.startGrace = 1
    this.spawnTimer = 0.1
    this.playTime = 0
    this.happyUntil = 0
    this.blinkUntil = 0
    this.nextBlinkAt = 4
    this.rainbowReveal = 0
    this.pendingVoice = null
    this.orderQueue = []
    this.lastOrderKey = ''
    this.collected = []
    this.collectionCycle = 0
    this.targetIndex = 0
    this.targetCatchCount = 0
    this.targetFlashUntil = 0
    this.hudShakeUntil = 0
    this.dizzyUntil = 0
  }

  buildDecor() {
    const t = this.theme
    const rng = mulberry32(this.level * 7919 + 41)
    // buildDecor 在构造、beginLevel、goHome 时被调用；缓存在这里统一失效重建。
    this.clouds = Array.from({ length: t.cloudCount || 5 }, () => ({
      x: rng(), y: 0.07 + rng() * 0.27, s: 0.55 + rng() * 0.7, v: 0.005 + rng() * 0.01, a: 0.4 + rng() * 0.45
    }))
    this.trees = [
      { x: 0.075, s: 0.72, alt: 0 }, { x: 0.22, s: 1.02, alt: 1 },
      { x: 0.78, s: 0.9, alt: 0 }, { x: 0.94, s: 0.66, alt: 1 }
    ]
    this.grassDeco = Array.from({ length: 20 }, () => ({ x: rng(), y: rng(), s: 0.6 + rng() * 0.8 }))
    this.flowerDeco = Array.from({ length: 14 }, () => ({
      x: rng(), y: rng(), type: rng() > 0.5 ? 0 : 1, color: Math.floor(rng() * 3), s: 0.65 + rng() * 0.65
    }))
    this.starDeco = Array.from({ length: t.stars }, () => ({
      x: rng(), y: rng() * 0.62, r: 0.7 + rng() * 1.8, phase: rng() * Math.PI * 2, speed: 0.7 + rng() * 1.6
    }))
    this.fireflyDeco = Array.from({ length: t.fireflies }, () => ({
      x: 0.08 + rng() * 0.84, y: 0.44 + rng() * 0.4, phase: rng() * Math.PI * 2, speed: 0.5 + rng() * 0.7, r: 0.8 + rng() * 1.4
    }))
    this.butterflyDeco = Array.from({ length: t.butterflies }, (_, index) => ({
      x: 0.12 + rng() * 0.74, y: 0.32 + rng() * 0.3,
      phase: rng() * Math.PI * 2, s: 0.7 + rng() * 0.5,
      color: index % 2 === 0 ? '#FFB05C' : '#F58AA5'
    }))
    this.petalDeco = Array.from({ length: t.petals }, () => ({
      x: rng(), y: 0.22 + rng() * 0.6, phase: rng() * Math.PI * 2,
      speed: 0.012 + rng() * 0.02, s: 2.5 + rng() * 3, rotation: rng() * Math.PI * 2
    }))
    this.buildSceneryCache()
  }

  startMusicForRun() {
    this.audio.startMusic()
  }

  pause() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    this.state = 'paused'
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.pauseMusic()
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

  saveProgress() {
    try {
      uni.setStorageSync(STORAGE_PROGRESS, JSON.stringify({
        unlocked: this.maxUnlocked,
        completed: Array.from(this.completedLevels)
      }))
    } catch (error) {
      // Progress saving is optional.
    }
  }

  startNewGame() {
    this.audio.ensure()
    this.audio.startMusic()
    this.audio.play('ui')
    this.totalCaught = 0
    const allDone = this.maxUnlocked >= MAX_LEVEL && this.completedLevels.has(MAX_LEVEL)
    const startLevel = allDone ? 1 : clamp(this.maxUnlocked, 1, MAX_LEVEL)
    this.beginLevel(startLevel, startLevel === 1)
  }

  beginLevel(level, runStart) {
    this.level = clamp(level, 1, MAX_LEVEL)
    this.levelConfig = LEVELS[this.level - 1]
    this.goal = this.levelConfig.goal
    if (!Number.isFinite(this.totalCaught)) this.totalCaught = 0
    this.theme = THEMES[this.levelConfig.chapter]
    this.buildDecor()
    this.layout()
    this.resetRoundData()
    if (this.levelConfig.mechanic === 'order') this.makeOrderQueue()
    this.state = 'playing'
    this.gameMode = 'ready'
    this.buttons = []
    this.hintUntil = 0
    this.bannerUntil = 0
    this.comboUntil = 0
    this.rainbowReveal = 0
    this.bannerTitle = '第 ' + this.level + ' 关 · ' + this.levelConfig.name
    this.bannerSub = this.levelConfig.tip
    this.bannerUntil = this.time + 2.3
    if (this.level === 1 && !this.hintSeen) this.hintUntil = this.time + 5.2
    this.audio.play('level')
    if (runStart) this.queueVoice('start', 0.9)
  }

  makeOrderQueue() {
    const length = this.levelConfig.orderLength || 3
    const queue = []
    let previous = this.lastOrderKey
    for (let i = 0; i < length; i += 1) {
      let key = previous
      while (key === previous) key = COLLECT_KEYS[Math.floor(Math.random() * COLLECT_KEYS.length)]
      queue.push(key)
      previous = key
    }
    this.orderQueue = queue
    this.lastOrderKey = queue[queue.length - 1] || ''
  }

  currentOrderKey() {
    if (this.levelConfig.mechanic !== 'order' || !this.orderQueue.length) return null
    return this.orderQueue[0]
  }

  currentTargetKeys() {
    const cfg = this.levelConfig
    if (cfg.mechanic !== 'target') return []
    const keys = cfg.targetKeys || ['apple']
    if (!cfg.targetRotate) return keys
    return [keys[this.targetIndex % keys.length]]
  }

  startLevelFromMap(level) {
    if (level > this.maxUnlocked) {
      this.audio.ensure()
      this.audio.play('ui')
      this.showToast('先完成前面的关卡吧')
      return
    }
    this.audio.ensure()
    this.audio.startMusic()
    this.audio.play('ui')
    this.audio.stopVoice()
    this.pendingVoice = null
    this.totalCaught = 0
    this.beginLevel(level, false)
  }

  replayGame() {
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.play('ui')
    this.totalCaught = 0
    this.beginLevel(1, false)
    this.queueVoice('replay', 0.5)
  }

  nextLevel() {
    if (this.state !== 'celebrating' || this.celebrateFinal) return
    this.audio.stopVoice()
    this.pendingVoice = null
    this.audio.play('ui')
    this.beginLevel(this.level + 1, false)
  }

  goHome() {
    this.audio.stopVoice()
    this.pendingVoice = null
    this.state = 'start'
    this.gameMode = 'idle'
    this.level = 1
    this.levelConfig = LEVELS[0]
    this.goal = LEVELS[0].goal
    this.theme = THEMES[LEVELS[0].chapter]
    this.buildDecor()
    this.resetRoundData()
    this.buttons = []
    this.bannerUntil = 0
    this.comboUntil = 0
    this.hintUntil = 0
    this.rainbowReveal = 0
    this.toastUntil = 0
    this.audio.resumeMusic()
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

  queueVoice(key, delay) {
    this.pendingVoice = { key, at: this.time + delay }
  }

  openLevelSelect() {
    if (this.state !== 'start' && this.state !== 'celebrating' && this.state !== 'paused') return
    this.mapReturnState = this.state
    this.state = 'levelselect'
    this.buttons = []
    this.pressedId = null
    this.dragging = false
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

  update(dt) {
    if (this.exitPrompt) {
      this.buttons = []
      return
    }
    if (this.state !== 'paused') {
      this.time += dt
      this.updateEffects(dt)
      this.updateAmbient()
      if (this.state === 'playing' && this.gameMode === 'ready') this.updatePlaying(dt)
      if (this.state === 'playing' && this.gameMode === 'roundclear') this.updateRoundClear(dt)
      if (this.state === 'celebrating') this.time = this.time
      if (this.pendingVoice && this.time >= this.pendingVoice.at) {
        const key = this.pendingVoice.key
        this.pendingVoice = null
        this.audio.playVoice(key)
      }
    }
    this.buttons = []
  }

  updateAmbient() {
    this.clouds.forEach((cloud) => {
      cloud.x += cloud.v * 0.016
      if (cloud.x > 1.24) cloud.x = -0.24
    })
    this.petalDeco.forEach((petal) => {
      petal.y += petal.speed * 0.016
      if (petal.y > 1.04) petal.y = 0.18
    })
  }

  updatePlaying(dt) {
    const diff = this.targetX - this.bunnyX
    const follow = 1 - Math.exp(-11 * dt)
    const previous = this.bunnyX
    this.bunnyX += diff * follow
    if (Math.abs(diff) < 0.3) this.bunnyX = this.targetX
    const velocity = (this.bunnyX - previous) / Math.max(dt, 0.001)
    const targetTilt = clamp(velocity * 0.018, -6, 6)
    this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 10)

    this.playTime += dt
    this.startGrace -= dt
    this.spawnTimer -= dt
    const maxOnScreen = this.levelConfig.maxFruits || 5
    if (this.startGrace <= 0 && this.spawnTimer <= 0 && this.fruits.length < maxOnScreen) {
      if (this.shouldSpawnBee()) this.spawnBee()
      else this.spawnFruit()
      this.spawnTimer = this.nextSpawnDelay()
    }
    if (this.combo > 0 && this.comboUntil && this.time > this.comboUntil) {
      this.combo = 0
      this.comboUntil = 0
    }

    if (this.time > this.nextBlinkAt && this.time > this.happyUntil) {
      this.blinkUntil = this.time + 0.12
      this.nextBlinkAt = this.time + rand(3.6, 6)
    }

    for (let i = this.fruits.length - 1; i >= 0; i -= 1) {
      const fruit = this.fruits[i]
      if (fruit.removed) continue
      fruit.phase += dt * fruit.swaySpeed
      fruit.y += fruit.speed * dt
      fruit.x = fruit.baseX + Math.sin(fruit.phase) * fruit.sway
      fruit.rotation += fruit.spin * dt
      if (fruit.kind !== 'bee' && fruit.star && fruit.y > 0) {
        fruit.sparkleTimer -= dt
        if (fruit.sparkleTimer <= 0) {
          fruit.sparkleTimer = 0.2
          this.addParticle('sparkle', fruit.x + rand(-20, 20), fruit.y + rand(-20, 20), RAINBOW[Math.floor(Math.random() * RAINBOW.length)], 2.5, 0.3)
        }
      }
      const aligned = Math.abs(fruit.x - this.bunnyX) <= this.catchHalf + fruit.r * 0.18
      if (fruit.y >= this.catchY - fruit.r * 0.15 && aligned) {
        this.fruits.splice(i, 1)
        this.collectFruit(fruit)
        if (this.gameMode !== 'ready') break
        continue
      }
      if (fruit.y - fruit.r * 0.3 >= this.groundY) {
        this.fruits.splice(i, 1)
        this.missFruit(fruit)
      }
    }
    this.fruits = this.fruits.filter((fruit) => !fruit.removed)
  }

  updateRoundClear(dt) {
    this.rainbowReveal = Math.min(1, this.rainbowReveal + dt * 0.9)
    this.fruits.forEach((fruit) => {
      fruit.y += fruit.speed * 0.28 * dt
      fruit.alpha = Math.max(0, fruit.alpha - dt * 0.8)
    })
    this.fruits = this.fruits.filter((fruit) => fruit.alpha > 0.02)
    if (this.time - this.roundClearAt > 1.35) this.openCelebration()
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
    this.splashes.forEach((splash) => {
      splash.life -= dt
    })
    this.splashes = this.splashes.filter((splash) => splash.life > 0)
    this.confetti.forEach((piece) => {
      piece.life -= dt
      piece.vy += 120 * dt
      piece.x += piece.vx * dt + Math.sin(this.time * piece.sway + piece.phase) * 14 * dt
      piece.y += piece.vy * dt
      piece.rotation += piece.spin * dt
    })
    this.confetti = this.confetti.filter((piece) => piece.life > 0 && piece.y < this.h + 30)
  }

  nextSpawnDelay() {
    const cfg = this.levelConfig
    const ratio = this.goal ? this.progress / this.goal : 0
    return clamp((cfg.spawn || 0.9) * (1 - ratio * 0.12) * rand(0.9, 1.12), 0.48, 1.3)
  }

  shouldSpawnBee() {
    const chance = this.levelConfig.hazardChance || 0
    if (chance <= 0 || this.playTime < 1.6) return false
    const beeCount = this.fruits.reduce((total, fruit) => total + (fruit.kind === 'bee' ? 1 : 0), 0)
    if (beeCount >= 2) return false
    return Math.random() < chance
  }

  chooseFruitKey() {
    const cfg = this.levelConfig
    const mechanic = cfg.mechanic
    const pick = (list) => list[Math.floor(Math.random() * list.length)]

    if (mechanic === 'order') {
      const required = this.currentOrderKey()
      if (required && Math.random() < 0.76) return required
      const decoys = COLLECT_KEYS.filter((key) => key !== required && key !== this.lastFruitKey)
      return pick(decoys.length ? decoys : COLLECT_KEYS)
    }

    if (mechanic === 'target') {
      const targets = this.currentTargetKeys()
      if (targets.length && Math.random() < (cfg.targetRate || 0.5)) return pick(targets)
      const decoys = COLLECT_KEYS.filter((key) => !targets.includes(key) && key !== this.lastFruitKey)
      return pick(decoys.length ? decoys : COLLECT_KEYS.filter((key) => !targets.includes(key)))
    }

    if (mechanic === 'star') {
      if (Math.random() < (cfg.starRate || 0.5)) return 'star'
      const decoys = COLLECT_KEYS.filter((key) => key !== this.lastFruitKey)
      return pick(decoys.length ? decoys : COLLECT_KEYS)
    }

    if (mechanic === 'collect') {
      const remaining = COLLECT_KEYS.filter((key) => !this.collected.includes(key))
      if (remaining.length && Math.random() < 0.7) return pick(remaining)
      return pick(COLLECT_KEYS)
    }

    if (cfg.starChance && Math.random() < cfg.starChance) return 'star'
    const options = COLLECT_KEYS.filter((key) => key !== this.lastFruitKey)
    return pick(options.length ? options : COLLECT_KEYS)
  }

  spawnFruit(forcedKey, forcedX) {
    const key = forcedKey || this.chooseFruitKey()
    const size = clamp(this.w * 0.165, 52, 68) * (key === 'star' ? 0.92 : 1) * rand(0.94, 1.06)
    const r = size / 2
    let baseX = forcedX === undefined ? rand(r + 24, this.w - r - 24) : forcedX
    if (forcedX === undefined) {
      let guard = 0
      while (Math.abs(baseX - this.lastSpawnX) < 90 && guard < 6) {
        baseX = rand(r + 24, this.w - r - 24)
        guard += 1
      }
    }
    const speedBase = this.levelConfig.speed || 0.24
    const fruit = {
      kind: 'fruit',
      key, x: baseX, baseX, y: -size * 0.7, r, size,
      speed: this.h * speedBase * rand(0.97, 1.1),
      sway: rand(4, 14), swaySpeed: rand(0.5, 1.1), phase: rand(0, Math.PI * 2),
      rotation: rand(-0.28, 0.28), spin: rand(-0.55, 0.55), star: key === 'star',
      sparkleTimer: 0.1, alpha: 1
    }
    this.fruits.push(fruit)
    this.lastSpawnX = baseX
    this.lastFruitKey = key
    return fruit
  }

  spawnBee() {
    const size = clamp(this.w * 0.135, 42, 56) * rand(0.95, 1.05)
    const r = size / 2
    let baseX = rand(r + 26, this.w - r - 26)
    let guard = 0
    while (Math.abs(baseX - this.lastSpawnX) < 80 && guard < 6) {
      baseX = rand(r + 26, this.w - r - 26)
      guard += 1
    }
    const speedBase = this.levelConfig.speed || 0.24
    const bee = {
      kind: 'bee',
      key: 'bee',
      x: baseX, baseX, y: -size * 0.7, r, size,
      speed: this.h * speedBase * 1.12 * rand(0.96, 1.08),
      sway: rand(6, 16), swaySpeed: rand(0.6, 1.2), phase: rand(0, Math.PI * 2),
      rotation: rand(-0.2, 0.2), spin: rand(-0.4, 0.4),
      star: false, sparkleTimer: 0.1, alpha: 1
    }
    this.fruits.push(bee)
    this.lastSpawnX = baseX
    return bee
  }

  targetLabel() {
    return this.currentTargetKeys().map((key) => FRUIT_LABELS[key]).join('和')
  }

  clearFallingFruits(key) {
    this.fruits.forEach((item, index) => {
      if (item.kind === 'bee' || item.key !== key || item.removed) return
      item.removed = true
      this.addParticle('sparkle', item.x, item.y, RAINBOW[index % RAINBOW.length], 3, 0.35)
    })
  }

  collectFruit(fruit) {
    if (fruit.kind === 'bee') {
      this.hitBee(fruit)
      return
    }
    const cfg = this.levelConfig
    const mechanic = cfg.mechanic
    if (mechanic === 'order') {
      const required = this.currentOrderKey()
      if (fruit.key !== required) {
        this.wrongCatch(fruit, '先接' + FRUIT_LABELS[required])
        return
      }
    }
    if (mechanic === 'target') {
      const targets = this.currentTargetKeys()
      if (!targets.includes(fruit.key)) {
        this.wrongCatch(fruit, '只接' + this.targetLabel())
        return
      }
    }
    if (mechanic === 'star' && fruit.key !== 'star') {
      this.wrongCatch(fruit, '要接星星果！')
      return
    }
    if (mechanic === 'collect' && this.collected.includes(fruit.key)) {
      this.wrongCatch(fruit, '这个已经收集啦')
      return
    }

    const comboWindow = cfg.comboWindow || 2.2
    const newCombo = this.time - this.lastCatchAt <= comboWindow ? this.combo + 1 : 1
    this.combo = newCombo
    this.bestCombo = Math.max(this.bestCombo, newCombo)
    this.lastCatchAt = this.time
    this.comboUntil = this.time + comboWindow
    if (fruit.star) this.audio.play('star')
    else this.audio.play('catch-' + clamp(newCombo, 1, 6))

    let floater = '+1'
    if (mechanic === 'order') {
      this.progress += 1
      this.orderQueue.shift()
      this.lastOrderKey = fruit.key
      if (!this.orderQueue.length) this.makeOrderQueue()
    } else if (mechanic === 'target') {
      this.progress += 1
      this.targetCatchCount += 1
      if (cfg.targetRotate && this.targetCatchCount % cfg.targetRotate === 0 && this.progress < this.goal) {
        const keys = cfg.targetKeys || ['apple']
        const oldKey = keys[this.targetIndex % keys.length]
        this.targetIndex = (this.targetIndex + 1) % keys.length
        this.clearFallingFruits(oldKey)
        this.targetFlashUntil = this.time + 1.5
        this.floaters.push({
          x: this.w / 2, y: this.catchY - 76, text: '新目标：' + this.targetLabel(),
          color: '#C67935', life: 1.15, max: 1.15
        })
        this.audio.play('ui')
      }
    } else if (mechanic === 'collect') {
      this.collected.push(fruit.key)
      this.clearFallingFruits(fruit.key)
      this.progress += 1
      if (this.collected.length >= COLLECT_KEYS.length) {
        this.collectionCycle += 1
        if (this.progress < this.goal) {
          this.collected = []
          this.floaters.push({
            x: this.w / 2, y: this.catchY - 82, text: '第 ' + this.collectionCycle + ' 轮完成！',
            color: '#279C86', life: 1.2, max: 1.2
          })
          this.audio.play('star')
          this.burstConfetti(18)
        }
      }
    } else if (mechanic === 'star') {
      this.progress += 1
    } else if (mechanic === 'combo') {
      this.progress = Math.max(this.progress, this.combo)
      floater = '×' + this.combo
    } else {
      this.progress += FRUITS[fruit.key].points
      floater = fruit.star ? '+2' : '+1'
    }

    this.progress = Math.min(this.goal, this.progress)
    this.caughtInLevel += 1
    this.totalCaught += 1
    this.happyUntil = this.time + 0.48
    const colors = FRUITS[fruit.key].colors
    const y = Math.min(fruit.y, this.catchY - 6)
    this.addCatchParticles(fruit.x, y, colors, fruit.star)
    this.floaters.push({
      x: clamp(fruit.x, 30, this.w - 30), y: y - 28, text: floater,
      color: fruit.star ? '#F4A61E' : colors[2], life: 0.95, max: 0.95
    })
    if (fruit.star) this.burstConfetti(22)
    if (this.progress >= this.goal) this.beginRoundClear()
  }

  wrongCatch(fruit, message) {
    this.audio.play('miss')
    this.combo = 0
    this.comboUntil = 0
    this.hudShakeUntil = this.time + 0.26
    const colors = FRUITS[fruit.key] ? FRUITS[fruit.key].colors : RAINBOW
    for (let i = 0; i < 6; i += 1) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(50, 130)
      this.particles.push({
        type: 'bubble', x: fruit.x, y: fruit.y, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30, gravity: 300, size: rand(2, 4.5),
        color: colors[i % colors.length], life: rand(0.3, 0.55), max: 0.55,
        rotation: 0, spin: 0
      })
    }
    this.floaters.push({
      x: clamp(fruit.x, 44, this.w - 44), y: Math.min(fruit.y, this.catchY - 24),
      text: message, color: '#B5623E', life: 1.05, max: 1.05
    })
  }

  hitBee(fruit) {
    this.audio.play('miss')
    this.combo = 0
    this.comboUntil = 0
    this.dizzyUntil = this.time + 0.9
    this.hudShakeUntil = this.time + 0.35
    const y = Math.min(fruit.y, this.catchY - 10)
    for (let i = 0; i < 10; i += 1) {
      this.addParticle(
        i % 2 === 0 ? 'sparkle' : 'bubble',
        fruit.x + rand(-22, 22), y + rand(-16, 16),
        i % 2 === 0 ? '#FFE07A' : '#E9A23B', rand(2.5, 5), rand(0.35, 0.55)
      )
    }
    this.floaters.push({
      x: clamp(fruit.x, 44, this.w - 44), y: y - 30,
      text: '嗡嗡！', color: '#B5623E', life: 1.1, max: 1.1
    })
  }

  missFruit(fruit) {
    if (fruit.kind === 'bee') {
      for (let i = 0; i < 3; i += 1) {
        this.addParticle('bubble', fruit.x + rand(-8, 8), this.groundY - 4, '#E6C06A', rand(1.5, 3), 0.35)
      }
      return
    }
    this.audio.play('miss')
    this.combo = 0
    this.comboUntil = 0
    const colors = FRUITS[fruit.key].colors
    this.splashes.push({ x: fruit.x, y: this.groundY + 3, color: colors[0], size: fruit.r * 0.7, life: 0.85, max: 0.85 })
    for (let i = 0; i < 7; i += 1) {
      const angle = rand(Math.PI * 1.05, Math.PI * 1.95)
      const speed = rand(40, 120)
      this.particles.push({
        x: fruit.x, y: this.groundY - 2, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
        gravity: 260, size: rand(2.5, 5), color: colors[0], life: rand(0.35, 0.6), max: 0.6,
        rotation: 0, spin: 0, type: 'drop'
      })
    }
    const required = this.currentOrderKey()
    if (required && fruit.key === required) {
      this.floaters.push({
        x: clamp(fruit.x, 44, this.w - 44), y: this.groundY - 40,
        text: '要接' + FRUIT_LABELS[required], color: '#967253', life: 1.1, max: 1.1
      })
    }
  }

  recordLevelComplete() {
    this.completedLevels.add(this.level)
    this.maxUnlocked = Math.max(this.maxUnlocked, Math.min(MAX_LEVEL, this.level + 1))
    this.saveProgress()
  }

  beginRoundClear() {
    if (this.gameMode !== 'ready') return
    this.gameMode = 'roundclear'
    this.roundClearAt = this.time
    this.rainbowReveal = 0
    this.combo = 0
    this.comboUntil = 0
    this.happyUntil = this.time + 1.1
    this.recordLevelComplete()
    this.audio.play('celebrate')
    this.burstConfetti(72)
  }

  addParticle(type, x, y, color, size, life) {
    this.particles.push({
      type, x, y, vx: rand(-18, 18), vy: rand(-30, 6), gravity: 20,
      size, color, life, max: life, rotation: Math.random() * Math.PI, spin: rand(-2, 2)
    })
  }

  addCatchParticles(x, y, colors, isStar) {
    const count = isStar ? 20 : 13
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(70, isStar ? 250 : 195)
      this.particles.push({
        type: i % 4 === 0 ? 'sparkle' : 'bubble', x, y, vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 55, gravity: 380, size: rand(2.6, isStar ? 7 : 6),
        color: colors[Math.floor(Math.random() * colors.length)], life: rand(0.45, 0.9), max: 0.9,
        rotation: rand(0, Math.PI), spin: rand(-4, 4)
      })
    }
    if (isStar) {
      for (let i = 0; i < 7; i += 1) this.addParticle('sparkle', x + rand(-30, 30), y + rand(-30, 30), RAINBOW[i % RAINBOW.length], rand(2, 4), 0.5)
    }
  }

  burstConfetti(count) {
    for (let i = 0; i < count; i += 1) {
      this.confetti.push({
        x: rand(0, this.w), y: -rand(8, this.h * 0.55),
        vx: rand(-45, 45), vy: rand(30, 120), width: rand(4, 9), height: rand(7, 14),
        color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)], life: rand(3.8, 6),
        rotation: rand(0, Math.PI * 2), spin: rand(-5, 5), sway: rand(1, 3), phase: rand(0, Math.PI * 2)
      })
    }
  }

  openCelebration() {
    if (this.state !== 'playing' || this.gameMode !== 'roundclear') return
    this.state = 'celebrating'
    this.gameMode = 'celebrated'
    this.celebrateFinal = this.level >= MAX_LEVEL
    this.celebrateCaught = this.caughtInLevel
    this.celebrateCount = this.celebrateFinal ? this.totalCaught : this.caughtInLevel
    const friendIndex = this.celebrateFinal ? FRIENDS.length - 1 : this.level <= 7 ? 0 : this.level <= 14 ? 1 : 2
    this.celebrateFriend = FRIENDS[friendIndex]
    this.celebrateNewFriend = !this.unlocked.includes(this.celebrateFriend.id)
    if (this.celebrateFinal) {
      FRIENDS.forEach((friend) => {
        if (!this.unlocked.includes(friend.id)) this.unlocked.push(friend.id)
      })
    } else if (this.celebrateNewFriend) {
      this.unlocked.push(this.celebrateFriend.id)
    }
    try {
      uni.setStorageSync(STORAGE_FRIENDS, JSON.stringify(this.unlocked))
    } catch (error) {
      // Ignore storage failures.
    }
    this.audio.play('friend')
    if (this.celebrateFinal) this.queueVoice('final', 0.6)
    else if (this.level <= 2) this.queueVoice('celebrate-' + this.level + '-' + clamp(this.caughtInLevel, 6, 12), 0.6)
    this.hintUntil = 0
  }

  addConfettiBurst(count) {
    for (let i = 0; i < count; i += 1) {
      this.confetti.push({
        x: rand(0, this.w), y: rand(-30, 40), vx: rand(-70, 70), vy: rand(10, 80),
        width: rand(3, 7), height: rand(5, 10), color: RAINBOW[i % RAINBOW.length],
        life: rand(2.5, 4.5), rotation: rand(0, Math.PI * 2), spin: rand(-5, 5),
        sway: rand(1, 3), phase: rand(0, Math.PI * 2)
      })
    }
  }

  loop(timestamp) {
    if (!this.lastTs) this.lastTs = timestamp
    const dt = Math.min(0.05, Math.max(0.001, (timestamp - this.lastTs) / 1000))
    this.lastTs = timestamp
    try {
      this.update(dt)
      this.draw()
    } catch (error) {
      if (typeof console !== 'undefined') console.error('Game frame error', error)
    }
    this.rafId = this.canvasContext.requestAnimationFrame(this.loopBound)
  }

  draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    if (this.state === 'loading') {
      this.drawScene()
      this.drawLoading()
      return
    }
    this.drawScene()
    if (this.state === 'start') {
      this.drawStartScreen()
      if (this.exitPrompt) this.drawExitPrompt()
      return
    }
    if (this.state === 'levelselect') {
      this.drawLevelSelect()
      return
    }
    this.drawBunny()
    this.drawFruits()
    this.drawEffects()
    if (this.state === 'playing' || this.state === 'paused') this.drawHud()
    if (this.state === 'playing') this.drawGameOverlays()
    if (this.state === 'paused') this.drawPauseScreen()
    if (this.state === 'celebrating') this.drawCelebration()
    if (this.exitPrompt) this.drawExitPrompt()
  }

  drawScene() {
    const ctx = this.ctx
    const t = this.theme
    this.drawSky()

    this.drawSunMoon()

    if (t.stars) {
      this.starDeco.forEach((star) => {
        const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * star.speed + star.phase))
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#FFF6D5'
        ctx.beginPath()
        ctx.arc(star.x * this.w, star.y * this.h, star.r, 0, Math.PI * 2)
        ctx.fill()
        if (star.r > 1.8) {
          ctx.strokeStyle = 'rgba(255,245,210,0.6)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(star.x * this.w - star.r * 2.4, star.y * this.h)
          ctx.lineTo(star.x * this.w + star.r * 2.4, star.y * this.h)
          ctx.moveTo(star.x * this.w, star.y * this.h - star.r * 2.4)
          ctx.lineTo(star.x * this.w, star.y * this.h + star.r * 2.4)
          ctx.stroke()
        }
      })
      ctx.globalAlpha = 1
    }

    const strongRainbow = this.gameMode === 'roundclear' || this.state === 'celebrating'
    this.drawRainbow(strongRainbow ? 0.96 : t.rainbowAlpha, strongRainbow ? this.rainbowReveal : 1)

    this.drawClouds()
    // Path2D 缓存不可用（旧版基座、Web 预览）时退回逐帧绘制，画面不变，只是慢一些。
    if (!this.scenery || !this.drawSceneryCache()) {
      this.scenery = null
      this.drawHills()
      this.drawTrees()
      this.drawGround()
      this.drawGroundDecor()
    }
    this.drawAmbient()
  }

  drawSky() {
    const ctx = this.ctx
    let sky = this.skyGradient
    if (!sky) {
      const t = this.theme
      sky = ctx.createLinearGradient(0, 0, 0, this.groundY + 20)
      sky.addColorStop(0, t.skyTop)
      sky.addColorStop(0.62, t.skyMid)
      sky.addColorStop(1, t.skyBottom)
    }
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, this.w, this.h)
  }

  createPath() {
    if (!this.canvasContext || typeof this.canvasContext.createPath2D !== 'function') return null
    return this.canvasContext.createPath2D()
  }

  // 静态场景（远山、树、地面、草花）每帧要执行近千次 Canvas 调用，
  // 在 App 端会拖慢帧率；这里把固定形状一次性写进 Path2D，之后每帧只 fill/stroke。
  buildSceneryCache() {
    this.scenery = null
    this.skyGradient = null
    this.groundGradient = null
    this.sunGlow = null
    this.sunRayPath = null
    this.sunFacePath = null
    this.rainbowPaths = null
    this.cloudPaths = null
    this.uiPaths = null
    const ctx = this.ctx
    if (!ctx || !this.theme) return
    try {
      const sky = ctx.createLinearGradient(0, 0, 0, this.groundY + 20)
      sky.addColorStop(0, this.theme.skyTop)
      sky.addColorStop(0.62, this.theme.skyMid)
      sky.addColorStop(1, this.theme.skyBottom)
      this.skyGradient = sky
      const ground = ctx.createLinearGradient(0, this.groundY, 0, this.h)
      ground.addColorStop(0, this.theme.groundTop)
      ground.addColorStop(1, this.theme.groundBottom)
      this.groundGradient = ground
    } catch (error) {
      this.skyGradient = null
      this.groundGradient = null
    }
    if (typeof this.canvasContext.createPath2D !== 'function') return
    try {
      this.buildSceneryPaths()
      this.buildSunPaths()
      this.buildRainbowPaths()
      this.buildCloudPaths()
      this.buildUiPaths()
    } catch (error) {
      this.scenery = null
    }
  }

  // HUD 每帧都在画：圆钮底、章节图标、彩虹图标、进度点。
  // 这些形状在关卡内保持不变，缓存成 Path2D 后每帧只剩 fill/stroke。
  buildUiPaths() {
    const paths = { buttons: {}, chapters: {} }
    const buttonSizes = [19, 21]
    buttonSizes.forEach((r) => {
      const shadow = this.createPath()
      if (shadow) arcOn(shadow, 0, 4, r, 0, Math.PI * 2, false)
      const face = this.createPath()
      if (face) arcOn(face, 0, 0, r, 0, Math.PI * 2, false)
      paths.buttons[r] = { shadow, face }
    })
    // 进度点：已完成（带白描边）与未完成两种半径各一张路径。
    const dot = this.createPath()
    if (dot) arcOn(dot, 0, 0, 4.8, 0, Math.PI * 2, false)
    paths.dot = dot
    const smallDot = this.createPath()
    if (smallDot) arcOn(smallDot, 0, 0, 4.1, 0, Math.PI * 2, false)
    paths.smallDot = smallDot
    // 章节图标：晨光/晚霞的太阳、彩虹章、星光章的月亮、云端章的云。
    this.buildChapterPaths(paths)
    this.uiPaths = paths
  }

  buildChapterPaths(paths) {
    // 图标都按单位半径建路径，绘制时 translate + scale，尺寸与 drawXxxIcon 原实现一致。
    // 太阳圆盘与光芒分开：圆盘只填充，光芒只描边，混合在一张路径里会给圆盘描一圈粗边。
    const sunDisc = this.createPath()
    if (sunDisc) arcOn(sunDisc, 0, 0, 0.62, 0, Math.PI * 2, false)
    paths.chapters.sun = sunDisc
    const sunRays = this.createPath()
    if (sunRays) {
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2
        sunRays.moveTo(Math.cos(a) * 0.85, Math.sin(a) * 0.85)
        sunRays.lineTo(Math.cos(a) * 1.18, Math.sin(a) * 1.18)
      }
    }
    paths.chapters.sunRays = sunRays
    const moon = this.createPath()
    if (moon) arcOn(moon, 0, 0, 1, 0, Math.PI * 2, false)
    paths.chapters.moon = moon
    const moonCut = this.createPath()
    if (moonCut) arcOn(moonCut, 0.46, -0.36, 0.95, 0, Math.PI * 2, false)
    paths.chapters.moonCut = moonCut
    const cloud = this.createPath()
    if (cloud) {
      arcOn(cloud, -0.42, 0.16, 0.38, 0, Math.PI * 2, false)
      arcOn(cloud, -0.02, -0.14, 0.46, 0, Math.PI * 2, false)
      arcOn(cloud, 0.42, 0.12, 0.34, 0, Math.PI * 2, false)
      cloud.rect(-0.42, 0.14, 0.9, 0.3)
    }
    paths.chapters.cloud = cloud
    // 彩虹图标每条弧颜色不同，必须分开建路径，否则同一路径会被后一种颜色盖住。
    paths.chapters.rainbow = [0, 1, 2, 3].map((i) => {
      const path = this.createPath()
      if (path) arcOn(path, 0, 0.22, 0.95 - i * 0.2, Math.PI, Math.PI * 2, false)
      return path
    })
  }

  buildSceneryPaths() {
    const layers = []
    const fill = (path, style, alpha) => {
      if (path) layers.push({ type: 'fill', path, style, alpha })
    }
    const stroke = (path, style, width, alpha) => {
      if (path) layers.push({ type: 'stroke', path, style, width, alpha })
    }
    const circle = (path, x, y, radius) => arcOn(path, x, y, radius, 0, Math.PI * 2, false)

    const hills = [
      { base: this.groundY - 6, amp: 42, color: this.theme.hills[0], offset: 0.3 },
      { base: this.groundY + 4, amp: 28, color: this.theme.hills[1], offset: 1.2 },
      { base: this.groundY + 14, amp: 17, color: this.theme.hills[2], offset: 2.4 }
    ]
    hills.forEach((layer) => {
      const path = this.createPath()
      if (!path) return
      const y1 = layer.base - Math.sin(layer.offset) * layer.amp
      const y2 = layer.base + Math.sin(layer.offset + 1.7) * layer.amp * 0.55
      const y3 = layer.base - Math.sin(layer.offset + 2.5) * layer.amp
      path.moveTo(-30, layer.base)
      path.bezierCurveTo(this.w * 0.22, y1, this.w * 0.34, y2, this.w * 0.53, layer.base - layer.amp * 0.35)
      path.bezierCurveTo(this.w * 0.74, y3, this.w * 0.86, layer.base - layer.amp * 0.1, this.w + 30, layer.base - layer.amp * 0.7)
      path.lineTo(this.w + 30, this.h + 20)
      path.lineTo(-30, this.h + 20)
      path.closePath()
      fill(path, layer.color)
    })

    // 每棵树单独成层，保持「树干 → 树冠 → 高光 → 果子」的原始顺序；
    // 相邻树的树冠互相覆盖，合并成一层会改变绘制层级。
    this.trees.forEach((tree) => {
      const x = tree.x * this.w
      const s = tree.s * clamp(this.w / 390, 0.78, 1.18)
      const baseY = this.groundY + 6
      const trunkH = 50 * s
      const canopyY = baseY - trunkH - 10 * s
      const trunk = this.createPath()
      if (trunk) {
        roundRectOn(trunk, x - 4.5 * s, baseY - trunkH, 9 * s, trunkH + 12, 4 * s)
        fill(trunk, this.theme.trunk)
      }
      const canopy = this.createPath()
      if (canopy) {
        circle(canopy, x - 20 * s, canopyY + 2 * s, 24 * s)
        circle(canopy, x + 17 * s, canopyY - 3 * s, 27 * s)
        circle(canopy, x, canopyY - 21 * s, 29 * s)
        fill(canopy, tree.alt === 0 ? this.theme.treeCanopy : this.theme.treeLight)
      }
      const glow = this.createPath()
      if (glow) {
        circle(glow, x - 18 * s, canopyY + 2 * s, 13 * s)
        circle(glow, x + 21 * s, canopyY + 4 * s, 11 * s)
        fill(glow, this.theme.treeCanopy, 0.55)
      }
      const fruits = this.createPath()
      if (!fruits) return
      const dots = [[-18, 2], [7, -20], [23, 2], [-2, 5], [13, 17]]
      dots.forEach((dot, i) => {
        if (i > 3 && tree.alt !== 0) return
        circle(fruits, x + dot[0] * s, canopyY + dot[1] * s, 3.2 * s)
      })
      fill(fruits, this.theme.treeFruit)
    })

    const top = this.groundY
    const ground = this.createPath()
    if (ground) {
      ground.moveTo(0, top + 4)
      ground.bezierCurveTo(this.w * 0.24, top - 4, this.w * 0.52, top + 8, this.w * 0.72, top + 2)
      ground.bezierCurveTo(this.w * 0.86, top - 2, this.w * 0.94, top + 5, this.w, top + 1)
      ground.lineTo(this.w, this.h)
      ground.lineTo(0, this.h)
      ground.closePath()
      fill(ground, this.groundGradient || this.theme.groundTop)
    }
    const gloss = this.createPath()
    if (gloss) {
      gloss.moveTo(0, top + 5)
      gloss.bezierCurveTo(this.w * 0.24, top - 2, this.w * 0.52, top + 9, this.w * 0.72, top + 3)
      gloss.bezierCurveTo(this.w * 0.86, top - 1, this.w * 0.94, top + 6, this.w, top + 2)
      gloss.lineTo(this.w, top + 17)
      gloss.bezierCurveTo(this.w * 0.7, top + 22, this.w * 0.32, top + 8, 0, top + 20)
      gloss.closePath()
      fill(gloss, 'rgba(255,255,255,0.1)')
    }

    // 草叶与花茎的线宽随尺寸变化，按精确线宽分组，每桶只 stroke 一次。
    const grassAlpha = this.theme.night ? 0.55 : 0.7
    const grassBuckets = {}
    this.grassDeco.forEach((tuft) => {
      const x = tuft.x * this.w
      const y = this.groundY + 22 + tuft.y * Math.max(18, this.h - this.groundY - 42)
      const s = tuft.s * clamp(this.w / 390, 0.8, 1.15)
      const width = 2 * s
      const key = String(width)
      if (!grassBuckets[key]) grassBuckets[key] = { path: this.createPath(), width }
      const path = grassBuckets[key].path
      if (!path) return
      path.moveTo(x, y)
      path.quadraticCurveTo(x - 3 * s, y - 7 * s, x - 5 * s, y - 11 * s)
      path.moveTo(x, y)
      path.quadraticCurveTo(x + 1 * s, y - 8 * s, x + 3 * s, y - 13 * s)
      path.moveTo(x, y)
      path.quadraticCurveTo(x + 5 * s, y - 5 * s, x + 7 * s, y - 8 * s)
    })
    Object.keys(grassBuckets).forEach((key) =>
      stroke(grassBuckets[key].path, this.theme.grass, grassBuckets[key].width, grassAlpha)
    )

    const flowerAlpha = this.theme.night ? 0.72 : 0.96
    const stemBuckets = {}
    // 花瓣与花心按「每朵一组」逐层写入：不同颜色的花交错摆放时，
    // 后画的花瓣仍会盖住前一朵的花心，与逐朵绘制时的层级一致。
    const flowerLayers = []
    this.flowerDeco.forEach((flower) => {
      const x = flower.x * this.w
      const y = this.groundY + 28 + flower.y * Math.max(10, this.h - this.groundY - 66)
      const s = flower.s * clamp(this.w / 390, 0.82, 1.16)
      const width = 1.8 * s
      const key = String(width)
      if (!stemBuckets[key]) stemBuckets[key] = { path: this.createPath(), width }
      const stem = stemBuckets[key].path
      if (stem) {
        stem.moveTo(x, y)
        stem.quadraticCurveTo(x - 2 * s, y - 8 * s, x, y - 14 * s)
      }
      const headY = y - 14 * s
      const petalPath = this.createPath()
      if (!petalPath) return
      if (flower.type === 0) {
        for (let i = 0; i < 5; i += 1) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
          ellipseOn(
            petalPath,
            x + Math.cos(angle) * 3.4 * s, headY + Math.sin(angle) * 3.4 * s,
            2.8 * s, 2.1 * s, angle, 0, Math.PI * 2, false
          )
        }
        const centerPath = this.createPath()
        if (centerPath) {
          circle(centerPath, x, headY, 2.2 * s)
          flowerLayers.push({ type: 'fill', path: petalPath, style: this.theme.flowers[clamp(flower.color, 0, 2)], alpha: flowerAlpha })
          flowerLayers.push({ type: 'fill', path: centerPath, style: '#F7C948', alpha: flowerAlpha })
        }
      } else {
        ellipseOn(petalPath, x, headY, 3.6 * s, 5.2 * s, 0, 0, Math.PI * 2, false)
        ellipseOn(petalPath, x - 3.2 * s, headY - s, 2.8 * s, 4.2 * s, -0.4, 0, Math.PI * 2, false)
        ellipseOn(petalPath, x + 3.2 * s, headY - s, 2.8 * s, 4.2 * s, 0.4, 0, Math.PI * 2, false)
        flowerLayers.push({ type: 'fill', path: petalPath, style: this.theme.flowers[clamp(flower.color, 0, 2)], alpha: flowerAlpha })
      }
    })
    Object.keys(stemBuckets).forEach((key) =>
      stroke(stemBuckets[key].path, this.theme.grass, stemBuckets[key].width, flowerAlpha)
    )
    flowerLayers.forEach((layer) => layers.push(layer))

    this.scenery = layers
  }

  drawSceneryCache() {
    const ctx = this.ctx
    const layers = this.scenery
    try {
      for (let i = 0; i < layers.length; i += 1) {
        const layer = layers[i]
        // 半透明层（树冠高光、草花）用完立即复位，避免影响后续层。
        if (layer.alpha !== undefined) ctx.globalAlpha = layer.alpha
        if (layer.type === 'stroke') {
          ctx.strokeStyle = layer.style
          ctx.lineWidth = layer.width
          ctx.lineCap = 'round'
          ctx.stroke(layer.path)
        } else {
          ctx.fillStyle = layer.style
          ctx.fill(layer.path)
        }
        if (layer.alpha !== undefined) ctx.globalAlpha = 1
      }
      return true
    } catch (error) {
      return false
    }
  }

  buildSunPaths() {
    const night = this.theme.sunType === 'moon'
    const radius = night ? Math.min(34, this.w * 0.082) : Math.min(44, this.w * 0.108) * (this.levelConfig.chapter === 1 ? 1.1 : 1)
    const face = this.createPath()
    if (face) {
      const eye = radius * 0.1
      const eyeY = -radius * 0.02
      arcOn(face, -radius * 0.27, eyeY, eye, Math.PI, Math.PI * 2, false)
      arcOn(face, radius * 0.27, eyeY, eye, Math.PI, Math.PI * 2, false)
      arcOn(face, 0, radius * 0.12, radius * 0.22, 0.15, Math.PI - 0.15, false)
      this.sunFacePath = face
    }
    if (!night) {
      const rays = this.createPath()
      if (rays) {
        for (let i = 0; i < 12; i += 1) {
          const angle = (Math.PI * 2 * i) / 12
          rays.moveTo(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 1.35)
          rays.lineTo(Math.cos(angle) * radius * 1.64, Math.sin(angle) * radius * 1.64)
        }
        this.sunRayPath = rays
      }
    }
    try {
      const cx = this.w * 0.8
      const cy = this.h * this.theme.sunY
      const glow = this.ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.7)
      glow.addColorStop(0, night ? 'rgba(255,240,191,0.55)' : 'rgba(255,224,122,0.55)')
      glow.addColorStop(0.45, night ? 'rgba(255,240,191,0.16)' : 'rgba(255,224,122,0.2)')
      glow.addColorStop(1, 'rgba(255,240,191,0)')
      this.sunGlow = glow
    } catch (error) {
      this.sunGlow = null
    }
  }

  buildRainbowPaths() {
    const cx = this.w / 2
    const cy = this.groundY + 2
    const outer = Math.min(this.w * 0.78, this.h * 0.38)
    const band = clamp(this.w * 0.032, 9, 14)
    const paths = []
    RAINBOW.forEach((color, i) => {
      const radius = outer - i * band
      if (radius <= 0) {
        paths.push(null)
        return
      }
      const path = this.createPath()
      if (path) arcOn(path, cx, cy, radius, Math.PI, Math.PI * 2, false)
      paths.push(path)
    })
    this.rainbowPaths = paths
  }

  buildCloudPaths() {
    const paths = []
    this.clouds.forEach(() => {
      // 按单位尺寸建路径，绘制时再 translate/scale，避免把 cloud.s 重复乘两次。
      const path = this.createPath()
      if (!path) {
        paths.push(null)
        return
      }
      arcOn(path, -34, 7, 20, 0, Math.PI * 2, false)
      arcOn(path, -7, 0, 29, 0, Math.PI * 2, false)
      arcOn(path, 27, 6, 22, 0, Math.PI * 2, false)
      arcOn(path, 4, 15, 24, 0, Math.PI * 2, false)
      path.rect(-44, 7, 82, 25)
      paths.push(path)
    })
    this.cloudPaths = paths
  }

  drawSunMoon() {
    const ctx = this.ctx
    const night = this.theme.sunType === 'moon'
    const cx = this.w * 0.8
    const cy = this.h * this.theme.sunY
    const radius = night ? Math.min(34, this.w * 0.082) : Math.min(44, this.w * 0.108) * (this.levelConfig.chapter === 1 ? 1.1 : 1)
    let glow = this.sunGlow
    if (!glow) {
      glow = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.7)
      glow.addColorStop(0, night ? 'rgba(255,240,191,0.55)' : 'rgba(255,224,122,0.55)')
      glow.addColorStop(0.45, night ? 'rgba(255,240,191,0.16)' : 'rgba(255,224,122,0.2)')
      glow.addColorStop(1, 'rgba(255,240,191,0)')
    }
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 2.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.translate(cx, cy)
    if (!night) {
      ctx.rotate(this.time * 0.035)
      ctx.strokeStyle = this.theme.sunRay
      ctx.lineWidth = Math.max(3, radius * 0.11)
      ctx.lineCap = 'round'
      if (this.sunRayPath) {
        ctx.stroke(this.sunRayPath)
      } else {
        for (let i = 0; i < 12; i += 1) {
          const angle = (Math.PI * 2 * i) / 12
          ctx.beginPath()
          ctx.moveTo(Math.cos(angle) * radius * 1.35, Math.sin(angle) * radius * 1.35)
          ctx.lineTo(Math.cos(angle) * radius * 1.64, Math.sin(angle) * radius * 1.64)
          ctx.stroke()
        }
      }
      ctx.rotate(-this.time * 0.035)
      ctx.fillStyle = this.theme.sunColor
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.arc(-radius * 0.28, -radius * 0.3, radius * 0.35, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = this.theme.sunColor
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(214,198,162,0.22)'
      ctx.beginPath()
      ctx.arc(-radius * 0.28, -radius * 0.18, radius * 0.2, 0, Math.PI * 2)
      ctx.arc(radius * 0.3, radius * 0.1, radius * 0.14, 0, Math.PI * 2)
      ctx.fill()
    }
    const face = night ? 'rgba(107,74,53,0.55)' : 'rgba(107,74,53,0.5)'
    ctx.strokeStyle = face
    ctx.lineWidth = Math.max(1.6, radius * 0.055)
    ctx.lineCap = 'round'
    if (this.sunFacePath) {
      ctx.stroke(this.sunFacePath)
    } else {
      ctx.beginPath()
      ctx.arc(-radius * 0.27, -radius * 0.02, radius * 0.1, Math.PI, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(radius * 0.27, -radius * 0.02, radius * 0.1, Math.PI, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, radius * 0.12, radius * 0.22, 0.15, Math.PI - 0.15)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawRainbow(alpha, reveal) {
    if (alpha <= 0 || reveal <= 0) return
    const ctx = this.ctx
    const cx = this.w / 2
    const cy = this.groundY + 2
    const outer = Math.min(this.w * 0.78, this.h * 0.38)
    const band = clamp(this.w * 0.032, 9, 14)
    const paths = this.rainbowPaths
    const full = paths && reveal === 1
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.lineCap = 'round'
    RAINBOW.forEach((color, i) => {
      const radius = outer - i * band
      if (radius <= 0) return
      ctx.strokeStyle = color
      ctx.lineWidth = band - 1
      if (full && paths[i]) {
        ctx.stroke(paths[i])
        return
      }
      ctx.beginPath()
      ctx.arc(cx, cy, radius, Math.PI, Math.PI + Math.PI * reveal)
      ctx.stroke()
    })
    if (reveal > 0.35) {
      ctx.globalAlpha = alpha * 0.75
      ctx.fillStyle = '#FFF7CD'
      const spots = [0.14, 0.36, 0.62, 0.84]
      spots.forEach((fraction, i) => {
        if (fraction > reveal) return
        const angle = Math.PI + Math.PI * fraction
        const radius = outer - ((i % 3) * band + band)
        drawSparkle(ctx, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 3 + (i % 2), '#FFF7CD')
      })
    }
    ctx.restore()
  }

  drawClouds() {
    const ctx = this.ctx
    const alpha = this.theme.night ? 0.24 : 0.82
    const paths = this.cloudPaths
    this.clouds.forEach((cloud, index) => {
      const x = cloud.x * this.w
      const y = cloud.y * this.h
      const s = cloud.s * clamp(this.w / 390, 0.8, 1.2)
      ctx.save()
      ctx.globalAlpha = alpha * cloud.a
      ctx.fillStyle = this.theme.clouds || (this.theme.night ? '#D8DDF6' : '#FFFFFF')
      const path = paths ? paths[index] : null
      if (path) {
        ctx.translate(x, y)
        ctx.scale(s, s)
        ctx.fill(path)
      } else {
        ctx.beginPath()
        ctx.arc(x - 34 * s, y + 7 * s, 20 * s, 0, Math.PI * 2)
        ctx.arc(x - 7 * s, y, 29 * s, 0, Math.PI * 2)
        ctx.arc(x + 27 * s, y + 6 * s, 22 * s, 0, Math.PI * 2)
        ctx.arc(x + 4 * s, y + 15 * s, 24 * s, 0, Math.PI * 2)
        ctx.rect(x - 44 * s, y + 7 * s, 82 * s, 25 * s)
        ctx.fill()
      }
      ctx.restore()
    })
  }

  drawHills() {
    const ctx = this.ctx
    const layers = [
      { base: this.groundY - 6, amp: 42, color: this.theme.hills[0], offset: 0.3 },
      { base: this.groundY + 4, amp: 28, color: this.theme.hills[1], offset: 1.2 },
      { base: this.groundY + 14, amp: 17, color: this.theme.hills[2], offset: 2.4 }
    ]
    layers.forEach((layer) => {
      ctx.beginPath()
      ctx.moveTo(-30, layer.base)
      const y1 = layer.base - Math.sin(layer.offset) * layer.amp
      const y2 = layer.base + Math.sin(layer.offset + 1.7) * layer.amp * 0.55
      const y3 = layer.base - Math.sin(layer.offset + 2.5) * layer.amp
      ctx.bezierCurveTo(this.w * 0.22, y1, this.w * 0.34, y2, this.w * 0.53, layer.base - layer.amp * 0.35)
      ctx.bezierCurveTo(this.w * 0.74, y3, this.w * 0.86, layer.base - layer.amp * 0.1, this.w + 30, layer.base - layer.amp * 0.7)
      ctx.lineTo(this.w + 30, this.h + 20)
      ctx.lineTo(-30, this.h + 20)
      ctx.closePath()
      ctx.fillStyle = layer.color
      ctx.fill()
    })
  }

  drawTrees() {
    const ctx = this.ctx
    this.trees.forEach((tree) => {
      const x = tree.x * this.w
      const s = tree.s * clamp(this.w / 390, 0.78, 1.18)
      const baseY = this.groundY + 6
      const trunkH = 50 * s
      ctx.fillStyle = this.theme.trunk
      fillRound(ctx, x - 4.5 * s, baseY - trunkH, 9 * s, trunkH + 12, 4 * s, this.theme.trunk)
      const canopyY = baseY - trunkH - 10 * s
      ctx.fillStyle = tree.alt === 0 ? this.theme.treeCanopy : this.theme.treeLight
      // 每个圆先用 moveTo 起步；直接连续 arc 会被直线连起来，在树冠上留下缺口。
      ctx.beginPath()
      arcOn(ctx, x - 20 * s, canopyY + 2 * s, 24 * s, 0, Math.PI * 2, false)
      arcOn(ctx, x + 17 * s, canopyY - 3 * s, 27 * s, 0, Math.PI * 2, false)
      arcOn(ctx, x, canopyY - 21 * s, 29 * s, 0, Math.PI * 2, false)
      ctx.fill()
      ctx.fillStyle = this.theme.treeCanopy
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      arcOn(ctx, x - 18 * s, canopyY + 2 * s, 13 * s, 0, Math.PI * 2, false)
      arcOn(ctx, x + 21 * s, canopyY + 4 * s, 11 * s, 0, Math.PI * 2, false)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = this.theme.treeFruit
      const dots = [[-18, 2], [7, -20], [23, 2], [-2, 5], [13, 17]]
      dots.forEach((dot, i) => {
        if (i > 3 && tree.alt !== 0) return
        ctx.beginPath()
        ctx.arc(x + dot[0] * s, canopyY + dot[1] * s, 3.2 * s, 0, Math.PI * 2)
        ctx.fill()
      })
    })
  }

  drawGround() {
    const ctx = this.ctx
    const top = this.groundY
    const grad = ctx.createLinearGradient(0, top, 0, this.h)
    grad.addColorStop(0, this.theme.groundTop)
    grad.addColorStop(1, this.theme.groundBottom)
    ctx.beginPath()
    ctx.moveTo(0, top + 4)
    ctx.bezierCurveTo(this.w * 0.24, top - 4, this.w * 0.52, top + 8, this.w * 0.72, top + 2)
    ctx.bezierCurveTo(this.w * 0.86, top - 2, this.w * 0.94, top + 5, this.w, top + 1)
    ctx.lineTo(this.w, this.h)
    ctx.lineTo(0, this.h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, top + 5)
    ctx.bezierCurveTo(this.w * 0.24, top - 2, this.w * 0.52, top + 9, this.w * 0.72, top + 3)
    ctx.bezierCurveTo(this.w * 0.86, top - 1, this.w * 0.94, top + 6, this.w, top + 2)
    ctx.lineTo(this.w, top + 17)
    ctx.bezierCurveTo(this.w * 0.7, top + 22, this.w * 0.32, top + 8, 0, top + 20)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fill()
  }

  drawGroundDecor() {
    const ctx = this.ctx
    this.grassDeco.forEach((tuft) => {
      const x = tuft.x * this.w
      const y = this.groundY + 22 + tuft.y * Math.max(18, this.h - this.groundY - 42)
      const s = tuft.s * clamp(this.w / 390, 0.8, 1.15)
      ctx.strokeStyle = this.theme.grass
      ctx.globalAlpha = this.theme.night ? 0.55 : 0.7
      ctx.lineWidth = 2 * s
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x - 3 * s, y - 7 * s, x - 5 * s, y - 11 * s)
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + 1 * s, y - 8 * s, x + 3 * s, y - 13 * s)
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + 5 * s, y - 5 * s, x + 7 * s, y - 8 * s)
      ctx.stroke()
    })
    ctx.globalAlpha = 1
    this.flowerDeco.forEach((flower) => {
      const x = flower.x * this.w
      const y = this.groundY + 28 + flower.y * Math.max(10, this.h - this.groundY - 66)
      this.drawFlower(x, y, flower.s * clamp(this.w / 390, 0.82, 1.16), this.theme.flowers[flower.color], flower.type)
    })
  }

  drawFlower(x, y, s, color, type) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = this.theme.night ? 0.72 : 0.96
    ctx.strokeStyle = this.theme.grass
    ctx.lineWidth = 1.8 * s
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x - 2 * s, y - 8 * s, x, y - 14 * s)
    ctx.stroke()
    ctx.translate(x, y - 14 * s)
    ctx.fillStyle = color
    if (type === 0) {
      for (let i = 0; i < 5; i += 1) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
        ctx.beginPath()
        ctx.ellipse(Math.cos(angle) * 3.4 * s, Math.sin(angle) * 3.4 * s, 2.8 * s, 2.1 * s, angle, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#F7C948'
      ctx.beginPath()
      ctx.arc(0, 0, 2.2 * s, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.ellipse(0, 0, 3.6 * s, 5.2 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(-3.2 * s, -s, 2.8 * s, 4.2 * s, -0.4, 0, Math.PI * 2)
      ctx.ellipse(3.2 * s, -s, 2.8 * s, 4.2 * s, 0.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  drawAmbient() {
    const ctx = this.ctx
    this.petalDeco.forEach((petal) => {
      const x = petal.x * this.w + Math.sin(this.time * 1.3 + petal.phase) * 12
      const y = petal.y * this.h
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.translate(x, y)
      ctx.rotate(petal.rotation + this.time * 0.2)
      ctx.fillStyle = '#FFD6DE'
      ctx.beginPath()
      ctx.ellipse(0, 0, petal.s, petal.s * 0.48, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    this.butterflyDeco.forEach((butterfly) => {
      const x = butterfly.x * this.w + Math.sin(this.time * 0.35 + butterfly.phase) * 28
      const y = butterfly.y * this.h + Math.sin(this.time * 1.1 + butterfly.phase) * 16
      const flap = 0.3 + 0.7 * Math.abs(Math.sin(this.time * 9 + butterfly.phase))
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(butterfly.s, butterfly.s)
      ctx.fillStyle = butterfly.color
      ctx.strokeStyle = 'rgba(90,62,43,0.35)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(-7, -2, 8 * flap, 11, -0.4, 0, Math.PI * 2)
      ctx.ellipse(7, -2, 8 * flap, 11, 0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#6B4A35'
      ctx.beginPath()
      ctx.ellipse(0, 2, 1.6, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    this.fireflyDeco.forEach((fly) => {
      const x = fly.x * this.w + Math.sin(this.time * fly.speed + fly.phase) * 18
      const y = fly.y * this.h + Math.cos(this.time * fly.speed * 0.7 + fly.phase) * 13
      const alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(this.time * 2.2 + fly.phase))
      ctx.save()
      ctx.globalAlpha = alpha * 0.35
      ctx.fillStyle = '#FFE58F'
      ctx.beginPath()
      ctx.arc(x, y, fly.r * 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#FFF0A8'
      ctx.beginPath()
      ctx.arc(x, y, fly.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  drawBunny() {
    const ctx = this.ctx
    let image = this.images.bunnyIdle
    if (this.time < this.happyUntil) image = this.images.bunnyHappy
    else if (this.time < this.blinkUntil) image = this.images.bunnyBlink
    if (!image) return
    const dizzy = this.time < this.dizzyUntil
    const bob = this.time < this.happyUntil ? 0 : Math.sin(this.time * 2.1) * 1.8
    const wobble = dizzy ? Math.sin(this.time * 34) * 5 : 0
    ctx.save()
    ctx.translate(this.bunnyX, this.bunnyBottom)
    ctx.rotate(((this.tilt + wobble) * Math.PI) / 180)
    ctx.drawImage(image, -this.bunnyW / 2, -this.bunnyH + bob, this.bunnyW, this.bunnyH)
    if (dizzy) {
      for (let i = 0; i < 3; i += 1) {
        const angle = this.time * 6 + i * 2.1
        drawSparkle(ctx, Math.cos(angle) * 28, -this.bunnyH * 0.97 + Math.sin(angle) * 9, 3.4, '#FFE07A')
      }
    }
    ctx.restore()
  }

  drawFruits() {
    const ctx = this.ctx
    this.fruits.forEach((fruit) => {
      if (fruit.removed) return
      if (fruit.kind === 'bee') {
        this.drawBeeFruit(fruit)
        return
      }
      const image = this.images[fruit.key]
      ctx.save()
      ctx.globalAlpha = fruit.alpha
      ctx.translate(fruit.x, fruit.y)
      ctx.rotate(fruit.rotation)
      if (!image) {
        const colors = FRUITS[fruit.key] ? FRUITS[fruit.key].colors : RAINBOW
        ctx.fillStyle = colors[0]
        ctx.beginPath()
        ctx.arc(0, 0, fruit.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.arc(-fruit.r * 0.28, -fruit.r * 0.3, fruit.r * 0.22, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        return
      }
      if (fruit.star) {
        const glow = ctx.createRadialGradient(0, 0, fruit.r * 0.2, 0, 0, fruit.r * 1.6)
        glow.addColorStop(0, 'rgba(255,231,145,0.48)')
        glow.addColorStop(1, 'rgba(255,231,145,0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(0, 0, fruit.r * 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.drawImage(image, -fruit.size / 2, -fruit.size / 2, fruit.size, fruit.size)
      ctx.restore()
    })
  }

  drawBeeFruit(bee) {
    const ctx = this.ctx
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 6)
    ctx.save()
    ctx.globalAlpha = bee.alpha
    ctx.strokeStyle = 'rgba(255,125,80,' + (0.16 + 0.2 * pulse).toFixed(3) + ')'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(bee.x, bee.y, bee.r * 1.28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    this.drawBeeArt(bee.x, bee.y, bee.size, bee.rotation, bee.alpha)
  }

  drawBeeArt(cx, cy, size, rotation, alpha) {
    const ctx = this.ctx
    const r = size / 2
    const flap = 0.35 + 0.45 * Math.abs(Math.sin(this.time * 16))
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation || 0)
    ctx.globalAlpha = alpha === undefined ? 1 : alpha

    ctx.fillStyle = 'rgba(244,252,255,0.92)'
    ctx.strokeStyle = 'rgba(126,167,196,0.6)'
    ctx.lineWidth = Math.max(1, size * 0.03)
    ctx.beginPath()
    ctx.ellipse(-r * 0.14, -r * 0.58, r * 0.34, r * 0.44 * flap, -0.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(r * 0.22, -r * 0.55, r * 0.3, r * 0.4 * flap, 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#6B4A2F'
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.62, r * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.62, r * 0.45, 0, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#FFD85C'
    ctx.fillRect(-r * 0.18, -r * 0.5, r * 0.2, r)
    ctx.fillRect(r * 0.2, -r * 0.5, r * 0.17, r)
    ctx.restore()

    ctx.fillStyle = '#FFF6DF'
    ctx.beginPath()
    ctx.arc(r * 0.44, -r * 0.06, r * 0.13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3F2A1B'
    ctx.beginPath()
    ctx.arc(r * 0.47, -r * 0.06, r * 0.06, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#3F2A1B'
    ctx.lineWidth = Math.max(1, size * 0.035)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(r * 0.36, r * 0.05, r * 0.14, 0.2, 1.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(r * 0.3, -r * 0.24)
    ctx.quadraticCurveTo(r * 0.26, -r * 0.5, r * 0.4, -r * 0.56)
    ctx.moveTo(r * 0.46, -r * 0.26)
    ctx.quadraticCurveTo(r * 0.48, -r * 0.48, r * 0.6, -r * 0.52)
    ctx.stroke()

    ctx.fillStyle = '#4A3020'
    ctx.beginPath()
    ctx.moveTo(-r * 0.58, 0)
    ctx.lineTo(-r * 0.82, -r * 0.1)
    ctx.lineTo(-r * 0.6, r * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  drawEffects() {
    const ctx = this.ctx
    this.splashes.forEach((splash) => {
      const p = 1 - splash.life / splash.max
      ctx.save()
      ctx.globalAlpha = (1 - p) * 0.4
      ctx.fillStyle = splash.color
      ctx.beginPath()
      ctx.ellipse(splash.x, splash.y, splash.size * (0.8 + p * 0.9), splash.size * 0.26 * (0.8 + p), 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    this.particles.forEach((particle) => {
      const alpha = clamp(particle.life / particle.max, 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation || 0)
      ctx.fillStyle = particle.color
      if (particle.type === 'sparkle') {
        drawSparkle(ctx, 0, 0, particle.size, particle.color)
      } else if (particle.type === 'drop') {
        ctx.beginPath()
        ctx.ellipse(0, 0, particle.size * 0.7, particle.size * 1.2, 0, 0, Math.PI * 2)
        ctx.fill()
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
      setFont(ctx, clamp(this.w * 0.064, 20, 28), 900)
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

  drawHud() {
    const ctx = this.ctx
    const shake = this.time < this.hudShakeUntil ? Math.sin(this.time * 52) * 4 : 0
    ctx.save()
    ctx.translate(shake, 0)
    const top = this.safeTop + 10
    const left = 12
    const chapter = this.levelConfig.chapter
    const info = CHAPTERS[chapter]
    const chipW = this.w > 360 ? 112 : 98
    const chipH = 40
    const shadow = 'rgba(88,57,31,0.12)'
    this.drawCircleButton('back', left + 19, top + chipH / 2, 19, 'back')
    const chipX = left + 46
    fillRound(ctx, chipX, top + 4, chipW, chipH, 20, shadow)
    fillRound(ctx, chipX, top, chipW, chipH, 20, 'rgba(255,250,242,0.985)')
    strokeRound(ctx, chipX, top, chipW, chipH, 20, '#FFFFFF', 2)
    const iconCx = chipX + 22
    const iconCy = top + chipH / 2
    fillRound(ctx, iconCx - 14, iconCy - 14, 28, 28, 14, info.tint)
    this.drawChapterIcon(iconCx, iconCy, chapter)
    drawLabel(ctx, '第 ' + this.level + ' 关', chipX + 42, iconCy, 12, '#6E513A', 900, 'left')

    this.drawCircleButton('sound', this.w - 68, top + chipH / 2, 21, this.audio.muted ? 'muted' : 'sound')
    this.drawCircleButton('pause', this.w - 22, top + chipH / 2, 21, 'pause', this.progress >= this.goal)

    const meterW = Math.min(this.w - 32, 300)
    const meterX = (this.w - meterW) / 2
    const meterY = top + chipH + 8
    fillRound(ctx, meterX, meterY + 3, meterW, 36, 18, shadow)
    fillRound(ctx, meterX, meterY, meterW, 36, 18, 'rgba(255,250,242,0.985)')
    strokeRound(ctx, meterX, meterY, meterW, 36, 18, '#FFFFFF', 2)
    this.drawRainbowIcon(meterX + 22, meterY + 18, 18)

    const countText = this.progress + '/' + this.goal
    setFont(ctx, 10, 900)
    const countW = ctx.measureText(countText).width
    const areaStart = meterX + 44
    const areaEnd = meterX + meterW - 16 - countW - 8
    if (this.goal <= 12) {
      const span = Math.max(24, areaEnd - areaStart)
      const dotGap = this.goal > 1 ? span / (this.goal - 1) : 0
      const ui = this.uiPaths
      const dot = ui && ui.dot
      const smallDot = ui && ui.smallDot
      for (let i = 0; i < this.goal; i += 1) {
        const x = this.goal > 1 ? areaStart + i * dotGap : areaStart + span / 2
        const filled = i < this.progress
        ctx.fillStyle = filled ? RAINBOW[i % RAINBOW.length] : 'rgba(124,94,68,0.18)'
        if (filled && dot) {
          ctx.save()
          ctx.translate(x, meterY + 18)
          ctx.fill(dot)
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.stroke(dot)
          ctx.restore()
        } else if (!filled && smallDot) {
          ctx.save()
          ctx.translate(x, meterY + 18)
          ctx.fill(smallDot)
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(x, meterY + 18, filled ? 4.8 : 4.1, 0, Math.PI * 2)
          ctx.fill()
          if (filled) {
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            ctx.stroke()
          }
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

    this.drawObjective(meterY + 44)
    ctx.restore()
  }

  drawObjective(y) {
    const ctx = this.ctx
    const mechanic = this.levelConfig.mechanic
    const tall = mechanic === 'order' || mechanic === 'collect'
    const height = tall ? 42 : 36
    const width = Math.min(this.w - 28, tall ? 344 : 312)
    const x = (this.w - width) / 2
    const cy = y + height / 2
    const shadow = 'rgba(88,57,31,0.12)'
    fillRound(ctx, x, y + 3, width, height, height / 2, shadow)
    fillRound(ctx, x, y, width, height, height / 2, 'rgba(255,250,242,0.96)')
    strokeRound(ctx, x, y, width, height, height / 2, '#FFFFFF', 2)

    if (mechanic === 'order') this.drawOrderObjective(x, cy, width)
    else if (mechanic === 'target') this.drawTargetObjective(x, cy, width)
    else if (mechanic === 'collect') this.drawCollectObjective(x, cy, width)
    else if (mechanic === 'combo') this.drawComboObjective(x, cy, width)
    else if (mechanic === 'star') this.drawStarObjective(x, cy, width)
    else if (mechanic === 'avoid') this.drawAvoidObjective(x, cy, width)
    else this.drawClassicObjective(x, cy, width)
  }

  drawOrderObjective(x, cy, width) {
    const ctx = this.ctx
    const label = '按顺序'
    setFont(ctx, 10.5, 900)
    const labelW = ctx.measureText(label).width
    drawLabel(ctx, label, x + 16, cy, 10.5, '#8A6A50', 900, 'left')
    const queue = this.orderQueue.slice(0, 5)
    const start = x + 16 + labelW + 12
    const slot = Math.min(30, (x + width - 16 - start) / Math.max(queue.length, 1))
    ctx.save()
    ctx.strokeStyle = 'rgba(150,119,88,0.35)'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    for (let i = 1; i < queue.length; i += 1) {
      const cx = start + slot * i - 4
      ctx.beginPath()
      ctx.moveTo(cx - 2, cy - 4)
      ctx.lineTo(cx + 2, cy)
      ctx.lineTo(cx - 2, cy + 4)
      ctx.stroke()
    }
    ctx.restore()
    queue.forEach((key, index) => {
      const cx = start + slot * (index + 0.5)
      const current = index === 0
      if (current) {
        const pulse = 1 + 0.04 * Math.sin(this.time * 7)
        fillRound(ctx, cx - 13 * pulse, cy - 13 * pulse, 26 * pulse, 26 * pulse, 9, '#FFF2D2')
        strokeRound(ctx, cx - 13 * pulse, cy - 13 * pulse, 26 * pulse, 26 * pulse, 9, '#EAB24E', 1.8)
      }
      this.drawFruitIcon(key, cx, cy - 2, current ? 22 : 20, current ? 1 : 0.65)
      drawLabel(ctx, String(index + 1), cx, cy + 14, 7.5, current ? '#B87A16' : '#A0846B', 900)
    })
  }

  drawTargetObjective(x, cy, width) {
    const ctx = this.ctx
    const flash = this.time < this.targetFlashUntil
    const label = flash ? '新目标' : '只接'
    setFont(ctx, 10.5, 900)
    const labelW = ctx.measureText(label).width
    drawLabel(ctx, label, x + 16, cy, 10.5, flash ? '#D96F4B' : '#8A6A50', 900, 'left')
    let iconX = x + 16 + labelW + 10
    const targets = this.currentTargetKeys()
    targets.forEach((key) => {
      this.drawFruitIcon(key, iconX + 13, cy, 26, 1)
      iconX += 31
    })
    const names = targets.map((key) => FRUIT_LABELS[key]).join(' / ')
    drawLabel(ctx, names, iconX + 4, cy, 11, flash ? '#C67935' : '#6E513A', 800, 'left')
    if (flash) {
      ctx.save()
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.time * 10)
      fillRound(ctx, x + width - 46, cy - 10, 32, 20, 10, '#FFE2C9')
      drawLabel(ctx, '看！', x + width - 30, cy, 9.5, '#C0623B', 900)
      ctx.restore()
    }
  }

  drawCollectObjective(x, cy, width) {
    const ctx = this.ctx
    const label = '本轮 ' + this.collected.length + '/6'
    setFont(ctx, 10.5, 900)
    const labelW = ctx.measureText(label).width
    drawLabel(ctx, label, x + 16, cy, 10.5, '#8A6A50', 900, 'left')
    const start = x + 16 + labelW + 12
    const slot = Math.min(28, (x + width - 16 - start) / COLLECT_KEYS.length)
    COLLECT_KEYS.forEach((key, index) => {
      const cx = start + slot * (index + 0.5)
      const got = this.collected.includes(key)
      this.drawFruitIcon(key, cx, cy, 22, got ? 1 : 0.3)
      if (got) {
        ctx.save()
        ctx.strokeStyle = 'rgba(69,157,96,0.85)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(cx, cy, 13, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    })
  }

  drawComboObjective(x, cy, width) {
    const ctx = this.ctx
    this.drawFruitIcon('star', x + 32, cy, 24, 1)
    drawLabel(ctx, '连击目标 ×' + this.goal, x + 50, cy, 11, '#6E513A', 800, 'left')
    const status = this.combo > 0 ? '现在 ×' + this.combo : '不要断哦'
    drawLabel(ctx, status, x + width - 16, cy, 11, this.combo >= 3 ? '#E07A3B' : '#8A6A50', 900, 'right')
  }

  drawStarObjective(x, cy, width) {
    const ctx = this.ctx
    this.drawFruitIcon('star', x + 32, cy, 28, 1)
    drawLabel(ctx, '只接星星果 · 接满 ' + this.goal + ' 颗', x + 52, cy, 11, '#6E513A', 800, 'left')
    drawLabel(ctx, this.progress + '/' + this.goal, x + width - 16, cy, 10.5, '#B9872E', 900, 'right')
  }

  drawAvoidObjective(x, cy, width) {
    const ctx = this.ctx
    this.drawBeeArt(x + 31, cy, 25, 0, 1)
    drawLabel(ctx, '躲开蜜蜂', x + 50, cy, 11, '#B5623E', 900, 'left')
    drawLabel(ctx, '接住水果 ' + this.goal + ' 个', x + width - 16, cy, 10.5, '#6E513A', 800, 'right')
  }

  drawClassicObjective(x, cy, width) {
    const ctx = this.ctx
    this.drawRainbowIcon(x + 31, cy, 17)
    drawLabel(ctx, '接住水果，唤醒彩虹', x + 51, cy, 11, '#6E513A', 800, 'left')
    drawLabel(ctx, '目标 ' + this.goal + ' 个', x + width - 16, cy, 10.5, '#8A6A50', 900, 'right')
  }

  drawChapterIcon(cx, cy, index) {
    const ctx = this.ctx
    const cached = this.uiPaths && this.uiPaths.chapters
    if (cached && cached.sun && cached.moon && cached.moonCut && cached.cloud) {
      ctx.save()
      ctx.translate(cx, cy)
      if (index === 3) {
        ctx.fillStyle = '#6674C9'
        ctx.scale(13, 13)
        ctx.fill(cached.moon)
        ctx.fillStyle = '#E9EBFF'
        ctx.fill(cached.moonCut)
      } else if (index === 4) {
        ctx.fillStyle = '#338FC4'
        ctx.scale(14, 14)
        ctx.fill(cached.cloud)
      } else if (index === 1) {
        ctx.restore()
        this.drawRainbowIcon(cx, cy, 17)
        return
      } else {
        ctx.fillStyle = CHAPTERS[index].color
        ctx.scale(15, 15)
        ctx.fill(cached.sun)
        if (cached.sunRays) {
          ctx.strokeStyle = CHAPTERS[index].color
          ctx.lineWidth = 1.8 / 15
          ctx.lineCap = 'round'
          ctx.stroke(cached.sunRays)
        }
      }
      ctx.restore()
      return
    }
    if (index === 3) this.drawMoonIcon(cx, cy, 13, '#6674C9')
    else if (index === 4) this.drawCloudIcon(cx, cy, 14, '#338FC4')
    else if (index === 1) this.drawRainbowIcon(cx, cy, 17)
    else this.drawSunIcon(cx, cy, 15, CHAPTERS[index].color)
  }

  drawCloudIcon(cx, cy, r, color) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx - r * 0.42, cy + r * 0.16, r * 0.38, 0, Math.PI * 2)
    ctx.arc(cx - r * 0.02, cy - r * 0.14, r * 0.46, 0, Math.PI * 2)
    ctx.arc(cx + r * 0.42, cy + r * 0.12, r * 0.34, 0, Math.PI * 2)
    ctx.rect(cx - r * 0.42, cy + r * 0.14, r * 0.9, r * 0.3)
    ctx.fill()
    ctx.restore()
  }

  drawFruitIcon(key, cx, cy, size, alpha) {
    const ctx = this.ctx
    const image = this.images[key]
    ctx.save()
    ctx.globalAlpha = alpha
    if (image) {
      ctx.drawImage(image, cx - size / 2, cy - size / 2, size, size)
    } else if (FRUITS[key]) {
      ctx.fillStyle = FRUITS[key].colors[0]
      ctx.beginPath()
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  drawGameOverlays() {
    const ctx = this.ctx
    if (this.time < this.bannerUntil) {
      const remaining = this.bannerUntil - this.time
      const alpha = clamp(remaining > 2.1 ? (2.3 - remaining) / 0.2 : Math.min(1, remaining / 0.3), 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      const title = this.bannerTitle
      setFont(ctx, 19, 900)
      const titleWidth = ctx.measureText(title).width
      setFont(ctx, 11, 700)
      const subWidth = ctx.measureText(this.bannerSub).width
      const width = Math.min(this.w - 24, Math.max(titleWidth + 44, subWidth + 40, 170))
      const x = (this.w - width) / 2
      const y = Math.max(this.h * 0.25, this.safeTop + 152)
      fillRound(ctx, x, y + 4, width, 66, 22, 'rgba(80,52,28,0.14)')
      fillRound(ctx, x, y, width, 66, 22, 'rgba(255,250,239,0.97)')
      strokeRound(ctx, x, y, width, 66, 22, '#FFFFFF', 2)
      drawLabel(ctx, title, this.w / 2, y + 25, 19, '#684729', 900)
      drawLabel(ctx, this.bannerSub, this.w / 2, y + 47, 11, '#9A7758', 700)
      ctx.restore()
    }
    if (!this.hintSeen && this.time < this.hintUntil) {
      const alpha = clamp(Math.min(1, (this.hintUntil - this.time) / 0.5), 0, 1)
      ctx.save()
      ctx.globalAlpha = alpha
      const text = '左右拖动，接住水果'
      setFont(ctx, 12, 800)
      const w = ctx.measureText(text).width + 54
      const x = (this.w - w) / 2
      const y = this.h * 0.46
      fillRound(ctx, x, y + 4, w, 42, 21, 'rgba(80,52,28,0.12)')
      fillRound(ctx, x, y, w, 42, 21, 'rgba(255,250,238,0.94)')
      strokeRound(ctx, x, y, w, 42, 21, '#FFFFFF', 2)
      fillRound(ctx, x + 6, y + 6, 30, 30, 15, '#FFE7B6')
      this.drawHandIcon(x + 21, y + 21)
      drawLabel(ctx, text, x + 44 + (w - 44) / 2, y + 21, 12, '#75563F', 800)
      ctx.restore()
    }
    if (this.combo >= 3 && this.time < this.comboUntil) {
      const text = '连击 ×' + this.combo
      setFont(ctx, 15, 900)
      const width = ctx.measureText(text).width + 36
      const x = (this.w - width) / 2
      const y = this.h * 0.24
      const grad = ctx.createLinearGradient(x, y, x, y + 34)
      grad.addColorStop(0, '#FFA95F')
      grad.addColorStop(1, '#FF7A5E')
      fillRound(ctx, x, y + 3, width, 34, 17, 'rgba(209,98,51,0.26)')
      fillRound(ctx, x, y, width, 34, 17, grad)
      strokeRound(ctx, x, y, width, 34, 17, '#FFFFFF', 2)
      drawLabel(ctx, text, this.w / 2, y + 17, 15, '#FFFFFF', 900)
    }
  }

  drawLoading() {
    const ctx = this.ctx
    const cardW = Math.min(this.w * 0.7, 280)
    const cardH = 140
    const x = (this.w - cardW) / 2
    const y = this.h * 0.46 - cardH / 2
    fillRound(ctx, x, y + 5, cardW, cardH, 26, 'rgba(80,52,28,0.14)')
    fillRound(ctx, x, y, cardW, cardH, 26, 'rgba(255,250,239,0.95)')
    strokeRound(ctx, x, y, cardW, cardH, 26, '#FFFFFF', 2)
    const fruitKeys = ['apple', 'strawberry', 'orange']
    fruitKeys.forEach((key, i) => {
      const image = this.images[key]
      const px = this.w / 2 + (i - 1) * 62
      const py = y + 50 + Math.sin(this.time * 4 + i) * 7
      if (image) ctx.drawImage(image, px - 22, py - 22, 44, 44)
      else {
        ctx.fillStyle = ['#FF7B73', '#FF7E9C', '#FFB75C'][i]
        ctx.beginPath()
        ctx.arc(px, py, 20, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    drawLabel(ctx, '果园正在醒来…', this.w / 2, y + 102, 13, '#7A5B40', 800)
  }

  drawStartScreen() {
    const ctx = this.ctx
    const H = this.h
    const W = this.w
    const top = this.safeTop + 12
    const soundCx = W - 36
    const soundCy = top + 19

    this.drawCircleButton('back', 31, top + 17, 19, 'back')

    const bottomShade = ctx.createLinearGradient(0, H * 0.58, 0, H)
    bottomShade.addColorStop(0, 'rgba(255,246,222,0)')
    bottomShade.addColorStop(1, 'rgba(255,246,222,0.82)')
    ctx.fillStyle = bottomShade
    ctx.fillRect(0, H * 0.58, W, H * 0.42)

    if (H > 700) {
      const ageX = 58
      const ageW = Math.min(156, Math.max(108, W - 133 - ageX - 8))
      fillRound(ctx, ageX, top, ageW, 34, 17, 'rgba(255,251,242,0.82)')
      strokeRound(ctx, ageX, top, ageW, 34, 17, 'rgba(255,255,255,0.92)', 1.5)
      ctx.beginPath()
      ctx.fillStyle = '#82DFBF'
      ctx.arc(ageX + 15, top + 17, 4, 0, Math.PI * 2)
      ctx.fill()
      const ageText = ageW < 150 ? '4-7 岁' : '给 4-7 岁的采摘小能手'
      drawLabel(ctx, ageText, ageX + ageW / 2 + 7, top + 17, 10.5, '#75563F', 800)
    }
    this.drawCircleButton('sound', soundCx, soundCy, 21, this.audio.muted ? 'muted' : 'sound')
    this.drawMapChip(W - 133, top + 2, 66, 34)

    const buttonH = clamp(H * 0.078, 56, 66)
    const buttonY = H * 0.61
    const heroBottom = buttonY - 12
    const heroW = Math.min(W * 0.55, 200, Math.max(140, H * 0.24))
    const heroH = heroW * 250 / 220
    const heroTop = heroBottom - heroH
    const center = W / 2
    const titleSize = clamp(W * 0.139, 40, 58)
    const titleY = Math.max(top + 110, heroTop - 78)
    const kickerY = titleY - 48
    const ribbonY = Math.max(titleY + titleSize * 0.7 + 18, heroTop - 12)

    const kickerW = 92
    fillRound(ctx, center - kickerW / 2, kickerY - 13, kickerW, 26, 13, 'rgba(255,250,239,0.9)')
    drawLabel(ctx, '小兔子的', center, kickerY, 11, '#966443', 800)
    this.drawGameTitle(center, titleY, titleSize)

    setFont(ctx, 11, 800)
    const ribbonText = '接住水果 · 唤醒彩虹'
    const ribbonW = ctx.measureText(ribbonText).width + 52
    fillRound(ctx, center - ribbonW / 2, ribbonY - 12, ribbonW, 25, 13, 'rgba(255,244,218,0.95)')
    this.drawRainbowIcon(center - ribbonW / 2 + 18, ribbonY, 17)
    drawLabel(ctx, ribbonText, center + 14, ribbonY, 11, '#85603F', 800)

    ctx.save()
    const glow = ctx.createRadialGradient(center, heroBottom - heroH * 0.45, 4, center, heroBottom - heroH * 0.45, heroW * 0.8)
    glow.addColorStop(0, 'rgba(255,255,255,0.78)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(center, heroBottom - heroH * 0.45, heroW * 0.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    this.drawHeroRainbow(center, heroBottom, heroW)
    const floats = [
      { key: 'apple', x: center - heroW * 0.72, y: heroBottom - heroH * 0.46, s: clamp(W * 0.12, 40, 54), bob: 0.2 },
      { key: 'strawberry', x: center + heroW * 0.72, y: heroBottom - heroH * 0.38, s: clamp(W * 0.11, 38, 51), bob: 1.1 },
      { key: 'star', x: center + heroW * 0.58, y: heroBottom - heroH * 0.82, s: clamp(W * 0.09, 30, 41), bob: 0.7 }
    ]
    floats.forEach((item) => {
      const image = this.images[item.key]
      if (!image) return
      const py = item.y + Math.sin(this.time * 1.6 + item.bob) * 5
      ctx.drawImage(image, item.x - item.s / 2, py - item.s / 2, item.s, item.s)
    })
    const bunny = this.images.bunnyIdle
    if (bunny) {
      const bob = Math.sin(this.time * 1.8) * 3
      ctx.drawImage(bunny, center - heroW / 2, heroBottom - heroH + bob, heroW, heroH)
    }

    const btnW = Math.min(W * 0.82, 318)
    const allDone = this.maxUnlocked >= MAX_LEVEL && this.completedLevels.has(MAX_LEVEL)
    const startLabel = allDone ? '再玩一次' : this.maxUnlocked > 1 ? '继续第 ' + this.maxUnlocked + ' 关' : '开始采摘'
    this.drawPrimaryButton('start', center - btnW / 2, buttonY, btnW, buttonH, startLabel, true)
    const hintY = buttonY + buttonH + 18
    const hintText = '拖动小兔，去接水果'
    setFont(ctx, 11.5, 800)
    const hintW = ctx.measureText(hintText).width + 48
    fillRound(ctx, center - hintW / 2, hintY, hintW, 34, 17, 'rgba(255,255,255,0.6)')
    fillRound(ctx, center - hintW / 2 + 5, hintY + 5, 24, 24, 12, '#FFE7B6')
    this.drawHandIcon(center - hintW / 2 + 17, hintY + 17)
    drawLabel(ctx, hintText, center + 7, hintY + 17, 11.5, '#6E523C', 800)

    const shelfH = 82
    const shelfBottom = H - this.safeBottom - 20
    const shelfY = shelfBottom - shelfH
    this.drawFriendShelf(16, shelfY, W - 32, shelfH)
    drawLabel(ctx, '20 个关卡 · 无广告 · 可离线玩', center, H - this.safeBottom - 9, 9.5, '#8A6A50', 700)
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
    const panelH = Math.min(this.h - this.safeTop - this.safeBottom - 28, 700)
    const x = (this.w - panelW) / 2
    const y = (this.h - panelH) / 2
    fillRound(ctx, x, y + 10, panelW, panelH, 30, 'rgba(60,40,24,0.32)')
    fillRound(ctx, x, y, panelW, panelH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, panelW, panelH, 30, '#FFFFFF', 3)

    drawLabel(ctx, '选择关卡', x + 22, y + 31, 21, '#5F432D', 900, 'left')
    drawLabel(ctx, '已通关 ' + this.completedLevels.size + ' / ' + MAX_LEVEL, x + 22, y + 53, 10.5, '#9A7758', 700, 'left')
    this.drawMapCloseButton(x + panelW - 30, y + 32, 17)

    const headerBottom = y + 72
    const footerTop = y + panelH - 42
    const gridLeft = x + 14
    const gridRight = x + panelW - 14
    const labelW = 46
    const cardGap = 7
    const rowGap = 8
    const cardW = (gridRight - gridLeft - labelW - cardGap * 3) / 4
    const rowH = Math.min(112, (footerTop - headerBottom - rowGap * 4) / 5)

    for (let row = 0; row < 5; row += 1) {
      const info = CHAPTERS[row]
      const rowY = headerBottom + row * (rowH + rowGap)
      fillRound(ctx, gridLeft + 4, rowY + 8, 3, rowH - 16, 1.5, info.color)
      setFont(ctx, 9.5, 900)
      drawLabel(ctx, info.short, gridLeft + 26, rowY + rowH / 2 - 7, 9.5, info.color, 900)
      drawLabel(ctx, '果园', gridLeft + 26, rowY + rowH / 2 + 7, 9.5, info.color, 700)
      for (let col = 0; col < 4; col += 1) {
        const level = row * 4 + col + 1
        const cfg = LEVELS[level - 1]
        const cx = gridLeft + labelW + col * (cardW + cardGap)
        const locked = level > this.maxUnlocked
        const completed = this.completedLevels.has(level)
        const isNext = level === this.maxUnlocked && !completed
        const cardY = rowY + 1
        const cardH = rowH - 2
        const bg = locked ? '#F2ECE3' : completed ? info.tint : '#FFFDF7'
        if (isNext) {
          ctx.save()
          ctx.globalAlpha = 0.4 + 0.25 * Math.sin(this.time * 4)
          strokeRound(ctx, cx - 3, cardY - 3, cardW + 6, cardH + 6, 16, '#FFB35C', 4)
          ctx.restore()
        }
        fillRound(ctx, cx, cardY + 2, cardW, cardH, 13, 'rgba(120,86,55,0.1)')
        fillRound(ctx, cx, cardY, cardW, cardH, 13, bg)
        strokeRound(ctx, cx, cardY, cardW, cardH, 13, isNext ? '#FFD79B' : '#FFFFFF', 2)
        drawLabel(ctx, String(level), cx + cardW / 2, cardY + cardH * 0.4, Math.min(21, cardH * 0.26), locked ? '#B9A48E' : completed ? info.color : '#5F432D', 900)
        drawLabel(ctx, MECHANIC_LABELS[cfg.mechanic], cx + cardW / 2, cardY + cardH * 0.68, Math.min(9.5, cardH * 0.12), locked ? '#BFAE9B' : info.color, 800)
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

  drawGameTitle(center, y, size) {
    const ctx = this.ctx
    const letters = ['彩', '虹', '果', '园']
    const colors = ['#E9584A', '#E59313', '#2C9B63', '#3478D4']
    const offsets = [-2.4, 1.6, -1.2, 2.2]
    setFont(ctx, size, 900)
    const widths = letters.map((letter) => ctx.measureText(letter).width)
    const gap = size * 0.018
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * (letters.length - 1)
    let x = center - total / 2
    for (let i = 0; i < letters.length; i += 1) {
      const cx = x + widths[i] / 2
      ctx.save()
      ctx.translate(cx, y + Math.abs(offsets[i]) * 0.35)
      ctx.rotate((offsets[i] * Math.PI) / 180)
      setFont(ctx, size, 900)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#5A3E2B'
      ctx.fillText(letters[i], 0, 4)
      ctx.globalAlpha = 1
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(5, size * 0.11)
      ctx.strokeStyle = '#FFFFFF'
      ctx.strokeText(letters[i], 0, 0)
      ctx.fillStyle = colors[i]
      ctx.fillText(letters[i], 0, 0)
      ctx.restore()
      x += widths[i] + gap
    }
  }

  drawHeroRainbow(center, bottom, heroW) {
    const ctx = this.ctx
    const cy = bottom - heroW * 0.05
    const outer = heroW * 0.8
    const band = Math.max(8, heroW * 0.062)
    ctx.save()
    ctx.globalAlpha = 0.92
    ctx.lineCap = 'round'
    RAINBOW.forEach((color, i) => {
      ctx.strokeStyle = color
      ctx.lineWidth = band - 1
      ctx.beginPath()
      ctx.arc(center, cy, outer - i * band, Math.PI, Math.PI * 2)
      ctx.stroke()
    })
    ctx.restore()
  }

  drawFriendShelf(x, y, w, h) {
    const ctx = this.ctx
    fillRound(ctx, x, y + 5, w, h, 22, 'rgba(98,71,45,0.1)')
    fillRound(ctx, x, y, w, h, 22, 'rgba(255,250,240,0.8)')
    strokeRound(ctx, x, y, w, h, 22, 'rgba(255,255,255,0.9)', 2)
    drawLabel(ctx, '我的果园伙伴', x + 16, y + 16, 10.5, '#76563D', 900, 'left')
    const remaining = FRIENDS.length - this.unlocked.length
    drawLabel(ctx, remaining <= 0 ? '三位朋友都认识啦' : '再认识 ' + remaining + ' 位朋友', x + w - 16, y + 16, 9.5, '#AA8B70', 700, 'right')
    const gap = 8
    const slotW = (w - 26 - gap * 2) / 3
    const slotY = y + 28
    const slotH = h - 38
    FRIENDS.forEach((friend, index) => {
      const sx = x + 13 + index * (slotW + gap)
      const unlocked = this.unlocked.includes(friend.id)
      fillRound(ctx, sx, slotY, slotW, slotH, 12, unlocked ? '#FFFDF8' : 'rgba(255,255,255,0.45)')
      const image = this.images[friend.id]
      if (image) {
        ctx.save()
        ctx.globalAlpha = unlocked ? 1 : 0.2
        const s = Math.min(slotH - 8, 38)
        ctx.drawImage(image, sx + (slotW - s) / 2, slotY + (slotH - s) / 2, s, s)
        ctx.restore()
      }
      if (!unlocked) this.drawLockIcon(sx + slotW - 15, slotY + slotH - 13, 10)
    })
  }

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
    const cached = this.uiPaths && this.uiPaths.buttons[r]
    ctx.save()
    if (cached && cached.shadow && cached.face) {
      ctx.translate(cx, cy)
      ctx.fillStyle = 'rgba(156,119,82,0.22)'
      ctx.fill(cached.shadow)
      ctx.translate(0, offset)
      ctx.fillStyle = 'rgba(255,250,242,0.985)'
      ctx.fill(cached.face)
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.stroke(cached.face)
      ctx.restore()
    } else {
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
    }
    if (icon === 'sound') this.drawSoundIcon(cx, cy + offset, 10)
    else if (icon === 'muted') this.drawMutedIcon(cx, cy + offset, 10)
    else if (icon === 'pause') this.drawPauseIcon(cx, cy + offset, 10)
    else if (icon === 'home') this.drawHomeIcon(cx, cy + offset, 10, '#5A3E2B')
    else if (icon === 'back') this.drawBackIcon(cx, cy + offset, 10)
    this.buttons.push({ id, x: cx - r - 4, y: cy - r - 4, w: r * 2 + 8, h: r * 2 + 8 })
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
    const cardH = Math.min(this.h * 0.67, 392 * s)
    const x = (this.w - cardW) / 2
    const y = (this.h - cardH) / 2
    fillRound(ctx, x, y + 10, cardW, cardH, 30, 'rgba(78,47,23,0.26)')
    fillRound(ctx, x, y, cardW, cardH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, cardW, cardH, 30, '#FFFFFF', 3)
    const cx = this.w / 2
    const bunnyS = 94 * s
    const bunnyH = bunnyS * 250 / 220
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#FFE7B8'
    ctx.beginPath()
    ctx.arc(cx, y + 76 * s, 58 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    if (this.images.bunnyIdle) ctx.drawImage(this.images.bunnyIdle, cx - bunnyS / 2, y + 22 * s, bunnyS, bunnyH)
    drawLabel(ctx, '休息一下', cx, y + 150 * s, 25 * s, '#6E4D32', 900)
    drawLabel(ctx, '小兔子在果园里等你哦', cx, y + 179 * s, 12.5 * s, '#927157', 600)
    const btnW = cardW - 36
    this.drawPrimaryButton('resume', cx - btnW / 2, y + 205 * s, btnW, 54 * s, '继续玩', true)
    this.drawSecondaryButton('home', cx - btnW / 2, y + 279 * s, btnW, 47 * s, '回到游戏首页', true)
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
    const badgeY = this.safeTop + Math.max(22, this.h * 0.135)
    const titleY = badgeY + 40 * s
    setFont(ctx, 11 * s, 900)
    const badgeText = '彩虹出现啦！'
    const badgeW = ctx.measureText(badgeText).width + 44
    fillRound(ctx, center - badgeW / 2, badgeY - 14 * s, badgeW, 28 * s, 14 * s, 'rgba(255,250,239,0.95)')
    this.drawRainbowIcon(center - badgeW / 2 + 17 * s, badgeY, 18 * s)
    drawLabel(ctx, badgeText, center + 7 * s, badgeY, 11 * s, '#7B5A3F', 900)
    const title = this.celebrateFinal ? '果园大丰收！' : this.level === 1 ? '太棒了！' : this.level % 4 === 0 ? '过关啦！' : '真棒！'
    ctx.save()
    setFont(ctx, clamp(29 * s, 25, 36), 900)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(91,61,34,0.35)'
    ctx.strokeText(title, center, titleY + 2)
    ctx.fillStyle = '#FFFDF5'
    ctx.fillText(title, center, titleY)
    ctx.restore()

    const cardW = Math.min(this.w * 0.88, 342)
    const cardH = Math.min(this.h - titleY - 26, 360 * s)
    const x = center - cardW / 2
    const y = titleY + 28 * s
    fillRound(ctx, x, y + 10, cardW, cardH, 30, 'rgba(75,48,26,0.26)')
    fillRound(ctx, x, y, cardW, cardH, 30, '#FFF9EE')
    strokeRound(ctx, x, y, cardW, cardH, 30, '#FFFFFF', 3)
    const pad = 16 * s
    const topAreaH = (this.celebrateFinal ? 108 : 104) * s
    const friend = this.celebrateFriend || FRIENDS[0]
    if (this.celebrateFinal) {
      fillRound(ctx, x + pad, y + pad, cardW - pad * 2, topAreaH, 20, '#FFF3D8')
      const images = this.friends.map((item) => this.images[item.id])
      const each = Math.min((cardW - pad * 2) / 3 - 6, 86 * s)
      const totalW = each * 3 - each * 0.15 * 2
      images.forEach((image, i) => {
        if (!image) return
        const ix = center - totalW / 2 + i * (each * 0.85) + each * 0.2
        const bob = Math.sin(this.time * 2 + i * 0.7) * 3
        ctx.drawImage(image, ix, y + pad + topAreaH * 0.18 + bob, each, each)
      })
    } else {
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
      const image = this.images[friend.id]
      const imgS = Math.min(topAreaH * 0.78, 96 * s)
      if (image) ctx.drawImage(image, center - imgS / 2, y + pad + (topAreaH - imgS) / 2, imgS, imgS)
      fillRound(ctx, center - 38 * s, y + pad + topAreaH - 23 * s, 76 * s, 20 * s, 10 * s, '#FFFAF0')
      drawLabel(ctx, friend.name, center, y + pad + topAreaH - 13 * s, 10 * s, '#8A5C38', 900)
    }
    const copyY = y + pad + topAreaH + 19 * s
    const copy = this.celebrateFinal
      ? '小松鼠、小刺猬和小鸟都来庆祝啦，你是最棒的采摘小能手！'
      : this.celebrateNewFriend
        ? friend.line
        : friend.name + '来为你加油啦，下一关也要稳稳接住哦！'
    setFont(ctx, 12.5 * s, 600)
    const lines = wrapLines(ctx, copy, cardW - pad * 2 - 12)
    lines.forEach((line, i) => {
      drawLabel(ctx, line, center, copyY + i * 19 * s, 12.5 * s, '#86664C', 600)
    })
    const countY = copyY + Math.max(26, lines.length * 19) + 9 * s
    const starLevel = this.levelConfig.mechanic === 'star'
    const countText = (this.celebrateFinal ? '一共接住了 ' : '这一关接住了 ') + this.celebrateCount + (starLevel ? ' 颗星星果' : ' 个水果')
    setFont(ctx, 11 * s, 700)
    const countW = ctx.measureText(countText).width + 30
    fillRound(ctx, center - countW / 2, countY - 14 * s, countW, 28 * s, 14 * s, '#FFF8EB')
    drawLabel(ctx, countText, center, countY, 11 * s, '#967253', 700)
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
    if (!this.lastCelebrationConfettiAt) this.lastCelebrationConfettiAt = 0
    if (this.time - this.lastCelebrationConfettiAt > 1.4) {
      this.lastCelebrationConfettiAt = this.time
      this.addConfettiBurst(18)
    }
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
    const ctx = this.ctx
    ctx.fillStyle = '#5A3E2B'
    fillRound(ctx, x - size * 0.55, y - size, size * 0.42, size * 2, size * 0.2, '#5A3E2B')
    fillRound(ctx, x + size * 0.13, y - size, size * 0.42, size * 2, size * 0.2, '#5A3E2B')
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

  drawSunIcon(x, y, r, color) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r * 0.62, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85)
      ctx.lineTo(x + Math.cos(a) * r * 1.18, y + Math.sin(a) * r * 1.18)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawMoonIcon(x, y, r, color) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#E9EBFF'
    ctx.beginPath()
    ctx.arc(x + r * 0.46, y - r * 0.36, r * 0.95, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawRainbowIcon(x, y, r) {
    const ctx = this.ctx
    ctx.save()
    ctx.lineCap = 'round'
    const colors = ['#FF6B6B', '#FFB347', '#FFD93D', '#6FD58D']
    const cached = this.uiPaths && this.uiPaths.chapters.rainbow
    if (cached && cached[0]) {
      ctx.translate(x, y)
      ctx.scale(r, r)
      colors.forEach((color, i) => {
        if (!cached[i]) return
        ctx.strokeStyle = color
        // 线宽按缩放后的视觉尺寸固定，避免随半径放大过粗。
        ctx.lineWidth = Math.max(2, r * 0.16) / r
        ctx.stroke(cached[i])
      })
      ctx.restore()
      return
    }
    colors.forEach((color, i) => {
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(2, r * 0.16)
      ctx.beginPath()
      ctx.arc(x, y + r * 0.22, r * (0.95 - i * 0.2), Math.PI, Math.PI * 2)
      ctx.stroke()
    })
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
    if (this.state === 'playing' && this.gameMode === 'ready') {
      this.dragging = true
      this.targetX = clamp(x, this.minX, this.maxX)
      this.hintSeen = true
      this.hintUntil = 0
    }
  }

  touchMove(x, y) {
    if (this.dragging && this.state === 'playing' && this.gameMode === 'ready') {
      this.targetX = clamp(x, this.minX, this.maxX)
    }
    if (this.pressedId) {
      const dx = x - this.pressStartX
      const dy = y - this.pressStartY
      if (Math.sqrt(dx * dx + dy * dy) > 18) this.pressedId = null
    }
  }

  touchEnd(x, y) {
    this.dragging = false
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
      if (level >= 1 && level <= MAX_LEVEL) this.startLevelFromMap(level)
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
    }
  }

  destroy() {
    if (this.rafId && this.canvasContext) this.canvasContext.cancelAnimationFrame(this.rafId)
    this.audio.destroy()
  }

  debugCorrectKey() {
    const mechanic = this.levelConfig.mechanic
    if (mechanic === 'order') return this.currentOrderKey() || 'apple'
    if (mechanic === 'target') return this.currentTargetKeys()[0] || 'apple'
    if (mechanic === 'star') return 'star'
    if (mechanic === 'collect') return COLLECT_KEYS.find((key) => !this.collected.includes(key)) || 'apple'
    return 'apple'
  }

  debugCatchOne(key) {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    const fruit = this.spawnFruit(key || this.debugCorrectKey(), clamp(this.bunnyX, 50, this.w - 50))
    this.fruits = this.fruits.filter((item) => item !== fruit)
    this.collectFruit(fruit)
    return true
  }

  debugHitBee() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    const bee = this.spawnBee()
    this.fruits = this.fruits.filter((item) => item !== bee)
    this.collectFruit(bee)
    return true
  }

  debugDropFruit(key) {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    const fruit = this.spawnFruit(key || 'apple', clamp(this.bunnyX, 50, this.w - 50))
    fruit.y = this.catchY - fruit.r - 42
    fruit.speed = this.h * 0.16
    fruit.sway = 0
    fruit.phase = 0
    return true
  }

  debugFinishLevel() {
    if (this.state !== 'playing' || this.gameMode !== 'ready') return false
    let guard = 0
    while (this.gameMode === 'ready' && guard < 100) {
      this.debugCatchOne()
      guard += 1
    }
    return true
  }

  debugState() {
    return {
      state: this.state,
      gameMode: this.gameMode,
      level: this.level,
      mechanic: this.levelConfig.mechanic,
      goal: this.goal,
      progress: this.progress,
      caught: this.caughtInLevel,
      total: this.totalCaught,
      bestCombo: this.bestCombo,
      orderQueue: this.orderQueue.slice(),
      targets: this.currentTargetKeys(),
      collected: this.collected.slice(),
      maxUnlocked: this.maxUnlocked,
      completed: Array.from(this.completedLevels),
      unlocked: this.unlocked.slice(),
      muted: this.audio.muted,
      imagesReady: this.imagesReady,
      buttons: this.buttons.map((button) => button.id),
      toast: this.time < this.toastUntil ? this.toastText : '',
      w: this.w,
      h: this.h
    }
  }
}
