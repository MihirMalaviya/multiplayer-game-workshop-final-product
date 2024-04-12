/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function (min, max) {
  return Math.min(Math.max(this, min), max);
};

DAMPING = 0.75;

class Player {
  /**
   * Represents a player with a circular body.
   * @param {number} x - The x-coordinate of the player's position.
   * @param {number} y - The y-coordinate of the player's position.
   * @param {number} r - The radius of the player's body.
   * @param {number} [vx=0] - The player's velocity along the x-axis.
   * @param {number} [vy=0] - The player's velocity along the y-axis.
   */
  constructor(x, y, r = 10, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = vx;
    this.vy = vy;

    this.speed = 1.5;

    // input management
    this.left = false;
    this.up = false;
    this.right = false;
    this.down = false;
    this.action = false;
  }

  /**
   * Updates the player's position based on its velocity and delta time.
   * @param {number} deltaTime - The time elapsed since the last update.
   */
  updatePosition() {
    // handle inputs
    if (this.left) this.vx -= this.speed;
    else if (this.right) this.vx += this.speed;
    if (this.up) this.vy -= this.speed;
    else if (this.down) this.vy += this.speed;

    // apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // clamp positions
    this.x = this.x.clamp(this.r, 640 - this.r);
    this.y = this.y.clamp(this.r, 480 - this.r);

    // apply friction to velocity
    this.vx *= DAMPING;
    this.vy *= DAMPING;
  }

  /**
   * Checks for collision with another player and updates velocities accordingly.
   * @param {Player} other - The other player object to check collision with.
   */
  collide(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.r + other.r) {
      const collisionAngle = Math.atan2(dy, dx);

      this.vx = -this.speed * Math.cos(collisionAngle);
      this.vy = -this.speed * Math.sin(collisionAngle);
    }
  }
}

const DEPLOY = 1;

const express = require("express");
const app = express();

const port = 3000;
const PORT = process.env.PORT || port;
app.use(express.static("public"));

let http;
let server;

if (DEPLOY) {
  http = require("http").Server(app);

  server = http;

  server.keepAliveTimeout = 120 * 1000;
  server.headersTimeout = 120 * 1000;
} else {
  server = app.listen(port);
}

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  console.log("__dirname = " + __dirname);

  res.sendFile(__dirname + "/index.html");
});

if (DEPLOY) {
  http.listen(PORT, function () {
    console.log(`listening on ${PORT}`);
  });
}

setInterval(serverLoop, 1000 / 60);

let players = {};
let playerData = {};

io.on("connection", connected);
function connected(socket) {
  socket.on("newPlayer", () => {
    console.log("New client connected with id: " + socket.id);

    players[socket.id] = new Player(Math.random() * 640, Math.random() * 480);

    // set data x and y
    // .toFixed(2) makes it only 2 decimal places
    playerData[socket.id] = {
      x: players[socket.id].x.toFixed(2),
      y: players[socket.id].y.toFixed(2),
    };

    console.log("Current number of players: " + Object.keys(playerData).length);
    console.log("players dictionary: ", playerData);

    io.emit("updatePlayers", playerData);
  });

  socket.on("disconnect", function () {
    delete players[socket.id];
    delete playerData[socket.id];
    console.log("Goodbye client with id " + socket.id);
    console.log("Current number of players: " + Object.keys(playerData).length);
    console.log("players dictionary: ", playerData);

    io.emit("updatePlayers", playerData);
  });

  socket.on("userCommands", (data) => {
    if (!players[socket.id]) {
      players[socket.id] = {};
    }

    for (const key in data) {
      players[socket.id][key] = data[key];
    }

    // console.log(data);
    // console.log(players[socket.id]);
  });
}

function serverLoop() {
  // update everyones positions
  for (const id in players) {
    for (const otherId in players) {
      if (id != otherId) players[id].collide(players[otherId]);
    }
    players[id].updatePosition();
  }

  for (const id in players) {
    playerData[id] = {
      x: players[id].x.toFixed(2),
      y: players[id].y.toFixed(2),
    };
    playerData[id].action = players[id].action;
  }

  // console.log(playerData);

  io.emit("positionUpdate", playerData);
}
