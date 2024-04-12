const DEPLOY = 0;

let socket;

if (DEPLOY) {
  socket = io.connect("");
} else {
  socket = io.connect("http://localhost:3000");
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let players = {};
let selfID;

socket.on("connect", () => {
  selfID = socket.id;
  let startX = Math.random() * 500;
  let startY = Math.random() * 500;
  players[socket.id] = new Player(startX, startY, 10);
  players[socket.id].player = true;

  socket.emit("newPlayer", { x: startX, y: startY });
});

socket.on("updatePlayers", (updatedPlayers) => {
  playersFound = {};
  for (let id in updatedPlayers) {
    // if we dont have the player and it is not us
    if (players[id] === undefined && id !== socket.id) {
      // make a new player
      players[id] = new Player(updatedPlayers[id].x, updatedPlayers[id].y, 32);
    }
    playersFound[id] = true;

    console.log(updatedPlayers[id]);
  }

  // if a player was not in players, that means it had to have been deleted so we delete here
  for (let id in players) {
    if (!playersFound[id]) {
      delete players[id];
    }
  }
});

socket.on("positionUpdate", (playerPos) => {
  for (let id in playerPos) {
    if (players[id] !== undefined) {
      players[id].x = playerPos[id].x;
      players[id].y = playerPos[id].y;
      players[id].action = playerPos[id].action;
    }
  }
});

canvas.addEventListener("keydown", (event) => {
  handleKeyEvent(event, true);
});

canvas.addEventListener("keyup", (event) => {
  handleKeyEvent(event, false);
});

function handleKeyEvent(event, isKeyDown) {
  commands = {};

  if (event.code === "ArrowLeft" || event.code === "KeyA")
    commands.left = isKeyDown;
  if (event.code === "ArrowUp" || event.code === "KeyW")
    commands.up = isKeyDown;
  if (event.code === "ArrowRight" || event.code === "KeyD")
    commands.right = isKeyDown;
  if (event.code === "ArrowDown" || event.code === "KeyS")
    commands.down = isKeyDown;
  if (event.code === "Space") commands.action = isKeyDown;

  socket.emit("userCommands", commands);
}

function render() {
  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw the players
  for (let id in players) {
    players[id].draw(ctx);
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

canvas.focus();
