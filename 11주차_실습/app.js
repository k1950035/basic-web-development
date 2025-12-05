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
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
};

let heroImg;
let enemyImg;
let laserImg;
let lifeImg;
let smallLaserImg;
let supportImg;
let explosionImg;
let bossImg;
let bossLaserImg;

let canvas;
let ctx;
let gameObjects = [];
let hero;
let supportShips = [];
let eventEmitter = new EventEmitter();

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
    this.speed = { x: 0, y: 0 };
    this.cooldown = 0;
    this.life = 3;
    this.points = 0;
  }

  decrementLife() {
    this.life--;
    if (this.life === 0) {
      this.dead = true;
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
      gameObjects.push(new Laser(this.x + 45, this.y - 10));
      this.cooldown = 500;

      let id = setInterval(() => {
        if (this.cooldown > 0) {
          this.cooldown -= 100;
        } else {
          clearInterval(id);
        }
      }, 100);
    }
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";

    const id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        console.log("Stopped at", this.y);
        clearInterval(id);
      }
    }, 300);
  }
}

class Boss extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 200;
    this.height = 200;
    this.type = "Boss";
    this.img = bossImg;
    this.hp = 30;

    this.speedX = 4;
    this.fireTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.fireTimer);
        return;
      }
      gameObjects.push(
        new BossLaser(this.x + this.width / 2 - 5, this.y + this.height)
      );
    }, 800);

    this.moveTimer = setInterval(() => {
      if (this.dead) {
        clearInterval(this.moveTimer);
        return;
      }

      this.x += this.speedX;

      if (this.x <= 20 || this.x + this.width >= canvas.width - 20) {
        this.speedX *= -1;
      }
    }, 100);
  }

  hit(damage = 1) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.dead = true;
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  }
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;

    let id = setInterval(() => {
      if (this.dead) {
        clearInterval(id);
        return;
      }
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class BossLaser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 12;
    this.height = 30;
    this.type = "BossLaser";
    this.img = bossLaserImg;

    const id = setInterval(() => {
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
    }, 700);
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

function createEnemies() {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  for (let x = START_X; x < STOP_X; x += 98) {
    for (let y = 0; y < 50 * 5; y += 50) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
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
  const bossExists = gameObjects.some((go) => go.type === "Boss");
  const projectiles = gameObjects.filter(
    (go) => go.type === "Laser" || go.type === "SmallLaser"
  );

  projectiles.forEach((p) => {
    enemies.forEach((m) => {
      if (intersectRect(p.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: p,
          second: m,
        });
      }
    });
  });

  const heroRect = hero.rectFromGameObject();
  enemies.forEach((enemy) => {
    if (intersectRect(heroRect, enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, {
        enemy,
        hero,
      });
    }
  });

  const bosses = gameObjects.filter((go) => go.type === "Boss");

  projectiles.forEach((p) => {
    bosses.forEach((boss) => {
      if (intersectRect(p.rectFromGameObject(), boss.rectFromGameObject())) {
        p.dead = true;
        boss.hit();
        hero.points += 100;
      }
    });
  });

  const bossLasers = gameObjects.filter((go) => go.type === "BossLaser");

  bossLasers.forEach((bl) => {
    if (intersectRect(bl.rectFromGameObject(), hero.rectFromGameObject())) {
      bl.dead = true;
      hero.decrementLife();

      if (isHeroDead()) eventEmitter.emit(Messages.GAME_END_LOSS);
    }
  });

  if (enemies.length === 0 && !bossExists) {
    spawnBoss();
  }
  // --- 죽은 오브젝트 정리 ---
  gameObjects = gameObjects.filter((go) => !go.dead);
}

function drawGameObjects(ctx) {
  gameObjects.forEach((go) => go.draw(ctx));
}

function initGame() {
  gameObjects = [];
  supportShips = [];

  createEnemies();
  createHero();
  createSupportShips();
  drawPoints();
  drawLife();

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();
  });
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= 5;
    supportShips.forEach((s) => (s.y -= 5));
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
    supportShips.forEach((s) => (s.y += 5));
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
    supportShips.forEach((s) => (s.x -= 5));
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
    supportShips.forEach((s) => (s.x += 5));
  });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      hero.fire();
    }
  });
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    gameObjects.push(new Explosion(second.x, second.y));
  });
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();
  });
  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead()) {
      // 추가
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // loss before victory
    }
  });
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    // 추가
    endGame(true);
  });
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    // 추가
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
  laserImg = await loadTexture("assets/laserRed.png");
  smallLaserImg = await loadTexture("assets/laserGreen.png");
  supportImg = await loadTexture("assets/playerLeft.png");
  explosionImg = await loadTexture("assets/laserGreenShot.png");
  bossImg = await loadTexture("assets/enemyUFO.png");
  bossLaserImg = await loadTexture("assets/meteorBig.png");

  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawPoints();
    drawLife();
    drawGameObjects(ctx);
    updateGameObjects();
  }, 100);
};

function drawLife() {
  const START_POS = canvas.width - 180;
  for (let i = 0; i < hero.life; i++) {
    ctx.drawImage(lifeImg, START_POS + 45 * (i + 1), canvas.height - 37);
  }
}
function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "left";
  drawText("Points: " + hero.points, 10, canvas.height - 20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

function isHeroDead() {
  return hero.life <= 0;
}
function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
  clearInterval(gameLoopId);
  // 게임 화면이 겹칠 수 있으니, 200ms 지연
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage(
        "Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew",
        "green"
      );
    } else {
      displayMessage(
        "You died !!! Press [Enter] to start a new game Captain Pew Pew"
      );
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId); // 게임 루프 중지, 중복 실행 방지
    eventEmitter.clear(); // 모든 이벤트 리스너 제거, 이전 게임 세션 충돌 방지
    initGame(); // 게임 초기 상태 실행
    gameLoopId = setInterval(() => {
      // 100ms 간격으로 새로운 게임 루프 시작
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

function spawnBoss() {
  const x = canvas.width / 2 - 100;
  const y = 50;

  const boss = new Boss(x, y);
  gameObjects.push(boss);
}
