const fs = require('fs');
const { MongoClient } = require('mongodb');
let currentSketch = fs.readFileSync('./static/sketch.js').toString();
const VIRTUAL_SIZE = 1000;

const client = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017',
  { useUnifiedTopology: true, useNewUrlParser: true }
);

// generate some mock data
// client.connect()
//   .then(() => client.db('p5js').dropCollection('circles'))
//   .catch(() => {})
//   .then(() => client.db('p5js').createCollection('circles', {
//     // these circles are ephemeral, so a small capped collection will suffice
//     capped: true,
//     size: 1024
//   }))
//   .then(recursivelyAddCircles);

client.connect();

function randomInt(maximum) {
  return Math.floor(maximum * Math.random());
}

function recursivelyAddCircles(collection) {
  collection.insertOne({
    x: randomInt(VIRTUAL_SIZE),
    y: randomInt(VIRTUAL_SIZE),
    r: randomInt(50),
    color: [randomInt(255), randomInt(255), randomInt(255)]
  }, () => setTimeout(
    () => recursivelyAddCircles(collection),
    randomInt(1000)
  ));
}
