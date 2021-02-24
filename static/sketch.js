let nodes = [];

const circleSizeMultiplier = 50;

function windowHeightNoEditor() {
  return windowHeight - 200;
}

async function setup() {
  // retry in 100ms if the database hasn't connected yet
  if (!client.isConnected()) {
    return setTimeout(() => setup(), 100);
  }

  const circlesCollection = client.db('p5js').collection('circles');

  createCanvas(windowWidth, windowHeightNoEditor());
  textSize(14);
  textAlign(CENTER, CENTER);
  background(220);

  // Drop the "circles" collection, so we start fresh
  circlesCollection.drop();

  // Open the change stream
  const changeStream = circlesCollection.watch();
  changeStream.on('change', change => processChangeEvent(change));

  // Load sample data
  const sampleData = [
    {
      name: 'Lauren',
      color: 'pink',
      size: 5
    },
    {
      name: 'Eric',
      color: 'orange',
      size: 7
    },
    {
      name: 'Joe',
      color: 'green',
      size: 3
    },
  ]
  // Wait for the change stream to be started and then insert the sample data
  waitForStarted(changeStream, () => circlesCollection.insertMany(sampleData));

}

function draw() {
  clear();
  background('black');

  if (mouseIsPressed) {
    nodes.forEach(node => {
      if (isPointInsideCircle(mouseX, mouseY, node.x, node.y, node.size * circleSizeMultiplier / 2 )) {
        node.x = mouseX;
        node.y = mouseY;
      }
    });
  }

  nodes.forEach(node => {
    fill(node.color);
    ellipse(node.x, node.y, node.size * circleSizeMultiplier)
    
    fill('black');
    text(node.name, node.x, node.y);
  });

  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeightNoEditor());
}

/**
 * Waits for a change stream to start
 * This function taken from https://github.com/mongodb/node-mongodb-native/blob/3.6/test/functional/change_stream.test.js#L81-L96
 *
 * @param {ChangeStream} changeStream
 * @param {function} callback
 */
function waitForStarted(changeStream, callback) {
  const timeout = setTimeout(() => {
    throw new Error('Change stream never started');
  }, 2000);

  changeStream.cursor.once('init', () => {
    clearTimeout(timeout);
    callback();
  });
}

function isPointInsideCircle(pointX, pointY, circleX, circleY, radius) {
  if ( ((pointX - circleX) ** 2) + ((pointY - circleY) ** 2) <= radius ** 2 ) {
    return true;
  }
  return false;
}

function processChangeEvent(change) {
  console.log("Processing change event...");
  switch (change.operationType) {
    case 'insert':
      const doc = change.fullDocument;
      insertNode(doc._id, doc.name, doc.color, doc.size);
      break;
    case 'replace':
      replaceNode(change.documentKey._id, change.fullDocument);
      break;
    case 'update':
      updateNode(change.documentKey._id, change.updateDescription)
      break;
    case 'delete':
      deleteNode(change.documentKey._id)
      break;
  }
}

function insertNode(_id, name, color, size) {
  // I think I calculated the x and y correctly in order to keep the nodes in the canvas, but I'm not 100%

  // Calculate the maximum Node radius based on a size scale of 1 to 10
  const maxNodeRadius = 10 * circleSizeMultiplier / 2;
  let node = {
    _id,
    name,
    color,
    size: size,
    x: Math.floor(Math.random() * ( (windowWidth - maxNodeRadius) - maxNodeRadius)) + maxNodeRadius,
    y: Math.floor(Math.random() * ( (windowHeightNoEditor() - maxNodeRadius) - maxNodeRadius) ) + maxNodeRadius
  }
  nodes.push(node);
  console.log(`Inserted node with _id ${_id}`)
  return node;
}

function deleteNode(_id) {
  const index = nodes.findIndex(node => _id.equals(node._id));
  if (index < 0 ) {
    console.log(`Unable to find node with _id ${_id} so unable to remove the node`);
    throw new Error(`Unable to find node with _id ${_id} so unable to remove the node`);
  }
  nodes.splice(index, 1);
  console.log(`Deleted node with _id ${_id}`)
}

function updateNode(_id, updateDescription) {
  const nodeToUpdate = nodes.find(node => _id.equals(node._id));
  if (!nodeToUpdate) {
    throw new Error (`Unable to find node to update with _id: ${_id}`);
  }
  
  if (updateDescription.updatedFields.name) { nodeToUpdate.name = updateDescription.updatedFields.name};
  if (updateDescription.updatedFields.color) { nodeToUpdate.color = updateDescription.updatedFields.color};
  if (updateDescription.updatedFields.size) { nodeToUpdate.size = updateDescription.updatedFields.size};
  
  updateDescription.removedFields.forEach(field => {
    delete nodeToUpdate[field];
  });
  
  console.log(`Updated node with _id ${_id}`);
}

function replaceNode(_id, fullDocument) {
  try {
    deleteNode(_id);
    insertNode(_id, fullDocument.name, fullDocument.color, fullDocument.size);
  } catch (e) {
    throw new Error(`Unable to replace node with _id ${_id}.`);
  }

  console.log(`Replaced node with _id ${_id}.`);
}