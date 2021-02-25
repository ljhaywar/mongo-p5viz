const fs = require('fs');
const { MongoClient } = require('mongodb');
const { ipcRenderer } = require('electron');
const { IPC } = require('./const');
const VIRTUAL_SIZE = 1000;
const selectedSketch = require('./selected');
const sketchFiles = fs.readdirSync('./sketches');
let editor;

window.onload = async function() {
  for (const sketchFile of sketchFiles) {
    const opt = document.createElement('option');
    opt.innerHTML = sketchFile;
    if (sketchFile === selectedSketch) opt.selected = true;
    document.getElementById('switch-sketch').appendChild(opt);
  }
}

function currentSketch() {
  const select = document.getElementById('switch-sketch');
  return select.options[select.selectedIndex].text;
}

function initialize(monaco) {
  editor = monaco;
  editor.setValue(fs.readFileSync(`./sketches/${selectedSketch}`).toString());
}

function actionData(actionName) {
  switch (actionName) {
    case 'save':
      return { file: currentSketch(), content: editor.getValue() };
    case 'new':
      const userSketches = sketchFiles
        .filter(file => file.startsWith('sketch'))
        .map(file => parseInt(file.replace(/^sketch(\d+)\.js$/, '$1')));
      const next = Math.max(0, ...userSketches) + 1;
      return { file: `sketch${next}.js` };
    case 'switch':
      return { file: currentSketch() };
    default:
      return {};
  }
}

async function updateUI(actionName, result) {
  switch (actionName) {
    case 'new':
    case 'switch':
      await ipcRenderer.invoke(IPC.STATE, 'set', 'selectedSketch', result.file);
    case 'save':
      await userAction('refresh');
      break;
  }
}

async function userAction(actionName) {
  try {
    await updateUI(
      actionName,
      await ipcRenderer.invoke(IPC.ACTION, actionName, actionData(actionName))
    );
  } catch (error) {
    console.error(error);
  }
}
window.userAction = userAction;

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
