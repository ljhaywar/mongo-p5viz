const circles = [];
const MAX_CIRCLES = 100;

function windowHeightNoEditor() {
  return windowHeight - 200;
}

function setup() {
  // retry in 100ms if the database hasnt connected yet
  if (!client.isConnected()) {
    return setTimeout(() => setup(), 100);
  }
  const changeStream = client.db('p5js').collection('circles').watch();
  createCanvas(windowWidth, windowHeightNoEditor());
  changeStream.on('change', change => {
    const circle = change.fullDocument;
    if (!circle) return;
    circles.push(Object.assign({ added: Date.now() }, circle));
    if (circles.length > MAX_CIRCLES) circles.shift();
  });
}

function draw() {
  clear();
  const now = Date.now();
  for (const circle of circles) {
    const circleColor = color(...circle.color);
    const normX = Math.floor(windowWidth * circle.x / VIRTUAL_SIZE);
    const normY = Math.floor(windowHeightNoEditor() * circle.y / VIRTUAL_SIZE);
    const age = now - circle.added;
    circleColor.setAlpha(Math.max(255 - age / 100, 0));
    fill(circleColor);
    ellipse(normX, normY, circle.r, circle.r);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeightNoEditor());
}