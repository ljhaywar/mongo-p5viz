const changeStream = client.db('p5js').collection('circles').watch();

const circles = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  changeStream.on('change', change => circles.push(change.fullDocument));
}

function draw() {
  for (const circle of circles) {
    fill(...circle.color);
    ellipse(circle.x, circle.y, circle.r, circle.r);
  }
}
