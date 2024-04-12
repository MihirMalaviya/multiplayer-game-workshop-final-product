class Player {
  constructor(x, y) {
    this.r = 10;
    this.x = x;
    this.y = y;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fillStyle = this.action ? "red" : "black";
    ctx.fill();
  }
}
