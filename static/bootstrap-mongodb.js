const { MongoClient } = require('mongodb');

const client = new MongoClient(
  process.env.MONGODB_URI || 'mongodb://localhost:27017',
  { useUnifiedTopology: true, useNewUrlParser: true }
);

// generate some mock data
client.connect().then(
  () => recursivelyAddCircles(client.db('p5js').collection('circles'))
);

function randomInt(maximum) {
  return Math.floor(maximum * Math.random());
}

function recursivelyAddCircles(collection) {
  collection.insertOne({
    x: randomInt(800),
    y: randomInt(600),
    r: randomInt(50),
    color: [randomInt(255), randomInt(255), randomInt(255)]
  }, () => setTimeout(
    () => recursivelyAddCircles(collection),
    randomInt(1000)
  ));
}
