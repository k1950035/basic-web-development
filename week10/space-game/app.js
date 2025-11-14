function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
  });
}

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  const bgImg = new Image();
  bgImg.src = "assets/canvas_create_parttern.png";

  bgImg.onload = async () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pattern = ctx.createPattern(bgImg, "repeat");

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;

    const heroImg = await loadTexture("assets/player.png");
    const enemyImg = await loadTexture("assets/enemyShip.png");

    const heroX = canvas.width / 2 - 45;
    const heroY = canvas.height - canvas.height / 4;

    ctx.drawImage(heroImg, heroX, heroY);
    createSubHero(ctx, heroImg, heroX, heroY);
    createEnemies2(ctx, canvas, enemyImg);
  };
};

function createSubHero(ctx, heroImg, heroX, heroY) {
  const subHeroWidth = heroImg.width * 0.5;
  const subHeroHeight = heroImg.height * 0.5;
  ctx.drawImage(
    heroImg,
    heroX - subHeroWidth - 10,
    heroY + 20,
    subHeroWidth,
    subHeroHeight
  );
  ctx.drawImage(
    heroImg,
    heroX + heroImg.width + 10,
    heroY + 20,
    subHeroWidth,
    subHeroHeight
  );
}

function createEnemies(ctx, canvas, enemyImg) {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;
  for (let x = START_X; x < STOP_X; x += enemyImg.width) {
    for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

function createEnemies2(ctx, canvas, enemyImg) {
  const ROWS = 5;
  const MAX_COLS = 5;

  for (let row = 0; row < ROWS; row++) {
    const cols = MAX_COLS - row;
    const rowWidth = cols * enemyImg.width;
    const rowStartX = (canvas.width - rowWidth) / 2;

    const y = row * enemyImg.height;

    for (let col = 0; col < cols; col++) {
      const x = rowStartX + col * enemyImg.width;
      ctx.drawImage(enemyImg, x, y);
    }
  }
}
