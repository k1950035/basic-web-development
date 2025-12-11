function loadTexture(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("이미지 로딩 실패:", src, e);
      reject(e);
    };
    img.src = src;
  });
}

class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }

  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }

  clear() {
    this.listeners = {};
  }
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  COLLISION_ENEMY_HERO: "COLLISION_ENEMY_HERO",
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
};

let heroImg;
let enemyImg;
let laserImg;
let enemyLaserImg;
let lifeImg;
let smallLaserImg;
let supportImg;
let explosionImg;
let skill1Img, skill2Img, skill3Img, skill4Img;
let skill5Img, skill6Img, skill7Img, skill8Img;
let bossImg;

let currentStage = 1;
let currentDimension = 1;

// 스킬 데이터
const SKILL_DATA = [
  {
    id: "fan_shot",
    name: "부채 슈팅",
    desc: "전방 1발이던 총알이 3갈래(부채꼴)로 나갑니다.",
    type: "skill",
    imgIndex: 1,
  },
  {
    id: "explosion",
    name: "폭발 확산",
    desc: "적 처치 시 폭발이 일어나 주변 적에게 데미지를 줍니다.",
    type: "skill",
    imgIndex: 2,
  },
  {
    id: "time_stop",
    name: "시간 정지",
    desc: "피격된 적이 30% 확률로 1.5초간 얼어붙습니다.",
    type: "skill",
    imgIndex: 3,
  },
  {
    id: "homing",
    name: "자동 추적",
    desc: "2초마다 유도 미사일이 자동으로 발사됩니다.",
    type: "skill",
    imgIndex: 4,
  },
  {
    id: "glass_cannon",
    name: "탄환 강화",
    desc: "공격력이 2배 증가하지만, 최대 체력이 1로 고정됩니다.",
    type: "item",
    imgIndex: 5,
  },
  {
    id: "revive_kit",
    name: "응급키트",
    desc: "체력이 0이 될 때 1회 부활하며 주변 탄막을 제거합니다.",
    type: "item",
    imgIndex: 7,
  },
];

let canvas;
let ctx;
let gameObjects = [];
let hero;
let supportShips = [];
let eventEmitter = new EventEmitter();
let gameLoopId;
let backgroundImg;
let bgY = 0;

const playerStats = {
  maxHp: 3,
  hp: 3,
  damage: 1,
  fireRate: 500,
  moveSpeed: 15,
  projectileCount: 1,
  hasExplosion: false,
  hasFreeze: false,
  hasHoming: false,
  canRevive: false,
};

class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }

  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }

  draw(ctx) {
    if (!this.img) return;
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = "Hero";
    this.cooldown = 0;
    this.points = 0;

    // 자동 추적 용 타이머
    this.homingTimer = setInterval(() => {
      if (this.dead) return;
      if (playerStats.hasHoming) {
        this.fireHoming();
      }
    }, 2000);
  }

  decrementLife() {
    playerStats.hp--;
    if (playerStats.hp <= 0) {
      // 응급 키트 사용 여부 체크
      if (playerStats.canRevive) {
        playerStats.canRevive = false;
        playerStats.hp = playerStats.maxHp;
        console.log("응급키트 발동! 부활했습니다.");

        gameObjects.forEach((go) => {
          if (go.type === "EnemyLaser") go.dead = true;
        });
      } else {
        this.dead = true;
        clearInterval(this.homingTimer);
      }
    }
  }

  incrementPoints() {
    this.points += 100;
  }

  canFire() {
    return this.cooldown === 0;
  }

  fire() {
    if (this.canFire()) {
      if (playerStats.projectileCount === 3) {
        gameObjects.push(new Laser(this.x + 45, this.y - 10, -5));
        gameObjects.push(new Laser(this.x + 45, this.y - 10, 0));
        gameObjects.push(new Laser(this.x + 45, this.y - 10, 5));
      } else {
        gameObjects.push(new Laser(this.x + 45, this.y - 10, 0));
      }

      this.cooldown = playerStats.fireRate;

      let id = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown -= 100;
          if (this.cooldown < 0) {
            this.cooldown = 0;
          }
        } else {
          this.cooldown = 0;
          clearInterval(id);
        }
      }, 100);
    }
  }

  fireHoming() {
    const targets = gameObjects.filter(
      (go) => go.type === "Enemy" || go.type === "Boss"
    );

    if (targets.length === 0) return;

    let closest = targets[0];
    let minDist = 99999;

    targets.forEach((e) => {
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = e;
      }
    });

    gameObjects.push(new HomingLaser(this.x + 45, this.y, closest));
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    this.hp = 3;
    this.freezeTimer = 0;

    const moveId = setInterval(() => {
      if (this.dead) {
        clearInterval(moveId);
        return;
      }

      if (this.freezeTimer > 0) {
        this.freezeTimer -= 100;
        return;
      }

      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        clearInterval(moveId);
      }
    }, 300);

    const fireInterval = Math.random() * 6000 + 4000;
    this.fireTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.fireTimer);
        return;
      }

      if (this.freezeTimer > 0) return;

      gameObjects.push(
        new EnemyLaser(this.x + this.width / 2 - 4.5, this.y + this.height)
      );
    }, fireInterval);
  }

  hit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.dead = true;
      if (this.fireTimer) clearInterval(this.fireTimer);
    }
  }

  freeze() {
    this.freezeTimer = 1500;
  }
}

class Boss extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 200;
    this.height = 200;
    this.type = "Boss";
    this.img = bossImg;
    this.hp = 50;
    this.speedX = 3;

    this.moveTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.moveTimer);
        return;
      }

      this.x += this.speedX;

      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        this.speedX *= -1;
      }
    }, 20);

    this.fireTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.fireTimer);
        return;
      }
      gameObjects.push(
        new EnemyLaser(this.x + this.width / 2 - 5, this.y + this.height)
      );
    }, 1500);
  }

  hit(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.dead = true;
      if (this.moveTimer) clearInterval(this.moveTimer);
      if (this.fireTimer) clearInterval(this.fireTimer);
    }
  }
}

class Laser extends GameObject {
  constructor(x, y, angle = 0) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;
    this.angle = angle;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y > 0) {
        this.y -= 15;
        this.x += this.angle;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class EnemyLaser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "EnemyLaser";
    this.img = enemyLaserImg;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y < canvas.height) {
        this.y += 10;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class SmallLaser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 5;
    this.height = 20;
    this.type = "SmallLaser";
    this.img = smallLaserImg;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y > 0) {
        this.y -= 12;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class SupportShip extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 80;
    this.height = 55;
    this.type = "Support";
    this.img = supportImg;

    this.fireTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.fireTimer);
        return;
      }
      gameObjects.push(new SmallLaser(this.x + this.width / 2 - 2, this.y - 5));
    }, 2000);
  }
}

class Explosion extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Explosion";
    this.img = explosionImg;

    setTimeout(() => {
      this.dead = true;
    }, 300);
  }
}

let onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37:
    case 38:
    case 39:
    case 40:
    case 32:
      e.preventDefault();
      break;
    default:
      break;
  }
};

window.addEventListener("keydown", onKeyDown);

window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key === "ArrowDown") {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key === "ArrowLeft") {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key === "ArrowRight") {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if (evt.keyCode === 32) {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  } else if (evt.key === "Enter") {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
});

function createEnemies(pattern = "GRID") {
  let COLUMNS = 4;
  let ROWS = 3;

  if (pattern === "GRID") {
    COLUMNS = 5;
    ROWS = 3;
  }

  const ENEMY_WIDTH = 98;
  const ENEMY_HEIGHT = 50;
  const MONSTER_WIDTH = COLUMNS * ENEMY_WIDTH;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;

  const spawn = (col, row) => {
    const x = START_X + col * ENEMY_WIDTH;
    const y = row * ENEMY_HEIGHT;
    const enemy = new Enemy(x, y);
    enemy.img = enemyImg;
    gameObjects.push(enemy);
  };

  switch (pattern) {
    case "GRID":
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
          spawn(col, row);
        }
      }
      break;

    case "PYRAMID":
      const center = Math.floor(5 / 2);
      for (let row = 0; row < 3; row++) {
        for (let col = center - row; col <= center + row; col++) {
          spawn(col, row);
        }
      }
      break;

    case "INVERTED":
      const centerInv = Math.floor(5 / 2);
      for (let row = 0; row < 3; row++) {
        for (let col = row; col < 5 - row; col++) {
          spawn(col, row);
        }
      }
      break;

    default:
      console.error("Unknown Pattern");
      break;
  }
}

function createBoss() {
  const boss = new Boss(canvas.width / 2 - 100, 50);
  gameObjects.push(boss);
}

function createHero() {
  hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
  hero.img = heroImg;
  gameObjects.push(hero);
}

function createSupportShips() {
  supportShips = [];
  const left = new SupportShip(hero.x - 120, hero.y + 30);
  const right = new SupportShip(hero.x + hero.width + 40, hero.y + 30);
  supportShips.push(left, right);
  gameObjects.push(left, right);
}

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function updateGameObjects() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy");
  const bosses = gameObjects.filter((go) => go.type === "Boss");

  const playerProjectiles = gameObjects.filter(
    (go) => go.type === "Laser" || go.type === "SmallLaser"
  );
  const enemyProjectiles = gameObjects.filter((go) => go.type === "EnemyLaser");

  playerProjectiles.forEach((p) => {
    enemies.forEach((m) => {
      if (intersectRect(p.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: p,
          second: m,
        });
      }
    });

    bosses.forEach((boss) => {
      if (intersectRect(p.rectFromGameObject(), boss.rectFromGameObject())) {
        p.dead = true;
        boss.hit(playerStats.damage);

        hero.incrementPoints();

        if (boss.dead) {
          gameObjects.push(
            new Explosion(boss.x + boss.width / 2, boss.y + boss.height / 2)
          );
        }
      }
    });
  });

  const heroRect = hero.rectFromGameObject();

  enemies.forEach((enemy) => {
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy, hero });
    }
  });

  bosses.forEach((boss) => {
    if (intersectRect(heroRect, boss.rectFromGameObject())) {
      hero.decrementLife();
      if (isHeroDead()) eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  });

  enemyProjectiles.forEach((p) => {
    if (intersectRect(p.rectFromGameObject(), heroRect)) {
      p.dead = true;
      hero.decrementLife();
      if (isHeroDead()) {
        eventEmitter.emit(Messages.GAME_END_LOSS);
      }
    }
  });

  if (enemies.length === 0 && bosses.length === 0) {
    checkStageClear();
  }

  gameObjects = gameObjects.filter((go) => !go.dead);
}

function drawGameObjects(ctx) {
  gameObjects.forEach((go) => go.draw(ctx));
}

function drawBackground() {
  if (!backgroundImg) return;
  bgY += 2;
  if (bgY >= canvas.height) {
    bgY = 0;
  }
  ctx.save();
  ctx.translate(0, bgY);
  const pattern = ctx.createPattern(backgroundImg, "repeat");
  ctx.fillStyle = pattern;
  ctx.fillRect(0, -canvas.height, canvas.width, canvas.height * 2);
  ctx.restore();
}

function initGame() {
  gameObjects.forEach((go) => {
    go.dead = true;
  });
  gameObjects = [];
  supportShips = [];

  if (currentDimension === 1) {
    if (currentStage === 1) {
      createEnemies("PYRAMID");
    } else if (currentStage === 2) {
      createEnemies("INVERTED");
    } else if (currentStage === 3) {
      createEnemies("GRID");
    } else if (currentStage === 4) {
      createBoss();
    }
  } else {
    createEnemies("GRID");
  }

  createHero();
  createSupportShips();
  drawPoints();
  drawLife();
  eventEmitter.clear();

  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= playerStats.moveSpeed;
    supportShips.forEach((s) => (s.y -= playerStats.moveSpeed));
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += playerStats.moveSpeed;
    supportShips.forEach((s) => (s.y += playerStats.moveSpeed));
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= playerStats.moveSpeed;
    supportShips.forEach((s) => (s.x -= playerStats.moveSpeed));
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += playerStats.moveSpeed;
    supportShips.forEach((s) => (s.x += playerStats.moveSpeed));
  });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.hit(playerStats.damage);

    hero.incrementPoints();

    if (playerStats.hasFreeze) {
      if (Math.random() < 0.3) {
        second.freeze();
      }
    }

    if (second.dead) {
      gameObjects.push(new Explosion(second.x, second.y));

      if (playerStats.hasExplosion) {
        gameObjects.forEach((go) => {
          if (go.type === "Enemy" && !go.dead && go !== second) {
            const dx = go.x - second.x;
            const dy = go.y - second.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              go.hit(1);
              if (go.dead) {
                hero.incrementPoints();
                gameObjects.push(new Explosion(go.x, go.y));
              }
            }
          }
        });
      }
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  });

  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });
}

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  lifeImg = await loadTexture("assets/life.png");
  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserGreen.png");
  enemyLaserImg = await loadTexture("assets/laserRed.png");
  smallLaserImg = await loadTexture("assets/laserGreen.png");
  supportImg = await loadTexture("assets/playerLeft.png");
  explosionImg = await loadTexture("assets/laserGreenShot.png");
  backgroundImg = await loadTexture("assets/Background/background1.png");
  skill1Img = await loadTexture("assets/skill1.png");
  skill2Img = await loadTexture("assets/skill2.png");
  skill3Img = await loadTexture("assets/skill3.png");
  skill4Img = await loadTexture("assets/skill4.png");
  skill5Img = await loadTexture("assets/skill5.png");
  skill6Img = await loadTexture("assets/skill6.png");
  skill7Img = await loadTexture("assets/skill7.png");
  skill8Img = await loadTexture("assets/skill8.png");
  bossImg = await loadTexture("assets/bossImg.png");
  addGameStyles();

  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPoints();
    drawLife();
    updateGameObjects();
    drawGameObjects(ctx);
  }, 100);
};

function drawLife() {
  const START_POS = canvas.width - 180;
  for (let i = 0; i < playerStats.hp; i++) {
    ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
  }
}

function isHeroDead() {
  return playerStats.hp <= 0;
}

function drawPoints() {
  ctx.font = "30px 'NeoDunggeunmo'";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height - 20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

function displayMessage(message, color = "red") {
  ctx.font = "30px 'NeoDunggeunmo'";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
  clearInterval(gameLoopId);
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage("게임 클리어!", "blue");
    } else {
      displayMessage("게임 오버!", "red");
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    eventEmitter.clear();
    initGame();
    gameLoopId = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawPoints();
      drawLife();
      updateGameObjects();
      drawGameObjects(ctx);
    }, 100);
  }
}

function addGameStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    /* 1. 웹 폰트 임포트 (픽셀 스타일 폰트: NeoDunggeunmo) */
    @import url('https://cdn.jsdelivr.net/gh/Dalgona/neodgm-webfont@1.521/neodgm/style.css');

    .modal-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      z-index: 10;
      
      /* 2. 폰트 적용 (전체 상속) */
      font-family: 'NeoDunggeunmo', 'Courier New', monospace; 
    }

    .skill-container {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      padding-bottom: 140px;
    }

    .skill-card {
      background: #1a1a2e;
      border: 2px solid #0f3460;
      border-radius: 10px;
      padding: 20px;
      width: 200px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s, border-color 0.2s;
      
      /* 카드 내 텍스트 줄바꿈 처리 */
      word-break: keep-all; 
    }

    .skill-card:hover {
      transform: scale(1.05);
      border-color: #3d71ffff;
    }

    .skill-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 10px;
      image-rendering: pixelated; 
    }

    .skill-name {
      font-size: 20px; /* 폰트가 조금 작아보일 수 있어 크기 조정 */
      font-weight: bold;
      color: #3d71ffff;
      margin-bottom: 10px;
    }

    .skill-desc {
      font-size: 14px;
      color: #cccccc;
      line-height: 1.5;
    }

    .stage-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 2px 2px 0px #000; /* 제목에 그림자 효과 추가 */
    }
  `;
  document.head.appendChild(style);
}

function checkStageClear() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    gameLoopId = null;
  }

  if (currentStage === 4) {
    eventEmitter.emit(Messages.GAME_END_WIN);
  } else {
    showRewardSelection();
  }
}

function showRewardSelection() {
  let mandatoryIds = [];

  if (currentStage === 1) {
    mandatoryIds = ["glass_cannon", "time_stop"];
  } else if (currentStage === 2) {
    mandatoryIds = ["revive_kit", "explosion"];
  } else if (currentStage === 3) {
    mandatoryIds = ["fan_shot", "homing"];
  }

  const mandatorySkills = SKILL_DATA.filter((skill) =>
    mandatoryIds.includes(skill.id)
  );
  const otherSkills = SKILL_DATA.filter(
    (skill) => !mandatoryIds.includes(skill.id)
  );

  const shuffledOthers = otherSkills.sort(() => 0.5 - Math.random());
  const randomPicks = shuffledOthers.slice(0, 3 - mandatorySkills.length);

  const finalSelection = [...mandatorySkills, ...randomPicks];

  finalSelection.sort(() => 0.5 - Math.random());

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const title = document.createElement("div");
  title.className = "stage-title";
  title.innerText = `Stage ${currentDimension}-${currentStage} Clear!`;

  const subTitle = document.createElement("div");
  subTitle.style.marginBottom = "20px";
  subTitle.style.color = "#aaaaaa";
  subTitle.innerText = "능력을 하나 선택하세요!";

  const container = document.createElement("div");
  container.className = "skill-container";

  finalSelection.forEach((skill) => {
    const card = document.createElement("div");
    card.className = "skill-card";

    const imgPath = `assets/skill${skill.imgIndex}.png`;

    card.innerHTML = `
      <img src="${imgPath}" class="skill-icon" alt="${skill.name}">
      <div class="skill-name">${skill.name}</div>
      <div class="skill-desc">${skill.desc}</div>
    `;

    card.onclick = () => {
      applySkill(skill.id);
      const gameContainer = document.getElementById("game-container");
      gameContainer.removeChild(overlay);
      nextStage();
    };

    container.appendChild(card);
  });

  overlay.appendChild(title);
  overlay.appendChild(subTitle);
  overlay.appendChild(container);
  document.getElementById("game-container").appendChild(overlay);
}

function applySkill(skillId) {
  console.log(`Applying New Skill: ${skillId} (Reseting previous stats...)`);

  playerStats.damage = 1;
  playerStats.fireRate = 500;
  playerStats.projectileCount = 1;

  playerStats.hasExplosion = false;
  playerStats.hasFreeze = false;
  playerStats.hasHoming = false;
  playerStats.canRevive = false;

  playerStats.maxHp = 3;
  if (playerStats.hp > playerStats.maxHp) {
    playerStats.hp = playerStats.maxHp;
  }

  switch (skillId) {
    case "fan_shot":
      playerStats.projectileCount = 3;
      break;
    case "explosion":
      playerStats.hasExplosion = true;
      break;
    case "time_stop":
      playerStats.hasFreeze = true;
      break;
    case "homing":
      playerStats.hasHoming = true;
      break;

    case "glass_cannon":
      playerStats.damage *= 2;
      playerStats.maxHp = 1;
      playerStats.hp = 1;
      break;

    case "revive_kit":
      playerStats.canRevive = true;
      break;

    case "rapid_fire":
      playerStats.fireRate = Math.floor(playerStats.fireRate * 0.7);
      break;
  }
}

function nextStage() {
  currentStage++;
  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPoints();
    drawLife();
    updateGameObjects();
    drawGameObjects(ctx);
  }, 100);
}

class HomingLaser extends GameObject {
  constructor(x, y, target) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;
    this.target = target;
    this.speed = 15;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }

      if (this.target && !this.target.dead) {
        const dx = this.target.x + this.target.width / 2 - this.x;
        const dy = this.target.y + this.target.height / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      } else {
        this.y -= this.speed;
      }

      if (this.y < 0 || this.y > canvas.height) {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}
