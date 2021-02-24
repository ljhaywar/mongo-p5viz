let nodes = [];

function windowHeightNoEditor() {
  return windowHeight - 200;
}

async function setup() {
  // retry in 100ms if the database hasnt connected yet
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

  // // Get started with some sample data
  // const sampleData = [
  //   {
  //     name: 'Lauren',
  //     color: 'pink',
  //     size: 5
  //   },
  //   {
  //     name: 'Eric',
  //     color: 'orange',
  //     size: 7
  //   },
  //   {
  //     name: 'Joe',
  //     color: 'green',
  //     size: 3
  //   },
  // ]
  // circlesCollection.insertMany(sampleData);

  setTimeout(() => {
    // Get started with some sample data
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
        size: 1
      },
    ]
    circlesCollection.insertMany(sampleData);
    resolve();
  }, 5000);

}

function draw() {
  clear();
  const now = Date.now();

  //   //TODO: figure out what these are doing
  //   const normX = Math.floor(windowWidth * circle.x / VIRTUAL_SIZE);
  //   const normY = Math.floor(windowHeightNoEditor() * circle.y / VIRTUAL_SIZE);

  nodes.forEach(node => {
    fill(node.color);
    ellipse(node.x, node.y, node.size * 50)
    
    fill('black');
    text(node.name, node.x, node.y);
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeightNoEditor());
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
  //TODO: fix x and y
  let node = {
    _id,
    name,
    color,
    size: size,
    x: Math.floor(Math.random() * 1000),
    y: Math.floor(Math.random() * 1000),
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
  
  console.log(`Updated node with _id ${_id}. New node:`);
  console.log(nodeToUpdate);
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