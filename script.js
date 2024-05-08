class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  add(another) {
    return new Vector(this.x + another.x, this.y + another.y);
  }
  subtract(another) {
    return new Vector(this.x - another.x, this.y - another.y);
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  scale(scaler) {
    return new Vector(this.x * scaler, this.y * scaler);
  }
}

class Handle {
  constructor(element, vector) {
    this.element = element;
    this.vector = vector;
  }

  set isDraggable(value) {
    this.draggable = value;
    if (this.draggable) this.element.onmousedown = () => (this.dragging = true);
    else this.element.onmousedown = null;
  }

  set dragging(value) {
    if (value) this.element.classList.add("handle-dragging");
    else this.element.classList.remove("handle-dragging");
  }

  get dragging() {
    return this.element.classList.contains("handle-dragging");
  }

  get isDraggable() {
    return this.draggable;
  }

  set x(value) {
    this.element.style.left = value + "px";
    this.vector.x = value;
  }

  get x() {
    return this.vector.x;
  }

  set y(value) {
    this.element.style.top = value + "px";
    this.vector.y = value;
  }

  get y() {
    return this.vector.y;
  }
}

const canvas = document.querySelector("canvas");
const canvasContainer = document.querySelector(".canvas-container");
const curveSelectionItems = document.querySelectorAll(".curve-selection-item");
const canvasCtx = canvas.getContext("2d");
const CANVAS_WIDTH = canvas.getBoundingClientRect().width;
const CANVAS_HEIGHT = canvas.getBoundingClientRect().height;
const CANVAS_X = canvas.getBoundingClientRect().x;
const CANVAS_Y = canvas.getBoundingClientRect().y;
const CANVAS_MAX_X = CANVAS_X + CANVAS_WIDTH;
const CANVAS_MAX_Y = CANVAS_Y + CANVAS_HEIGHT;
const HANDLE_SIZE = 16 * 1.2;
let stopUpdate = false;
let isUpdateRunning = false;
let controlPoints = [];
addHandles(4);
function addHandles(count) {
  [...canvasContainer.children].forEach(child => {
    if (!child.isSameNode(canvas)) child.remove();
  });
  controlPoints = [];
  for (let i = 0; i < count; i++) {
    controlPoints.push(getHandle(true));
  }
}

window.onresize = () => window.location.reload();
curveSelectionItems.forEach(item => (item.onclick = onClickCurveSelectionItem));

async function onClickCurveSelectionItem() {
  curveSelectionItems.forEach(item => item.classList.remove("selected"));
  this.classList.add("selected");
  stopUpdate = true;
  while (isUpdateRunning) await sleep(100);
  switch (this.id) {
    case "linear":
      addHandles(2);
      break;
    case "quadratic":
      addHandles(3);
      break;
    case "cubic":
      addHandles(4);
      break;
    case "conic":
      addHandles(5);
      break;
  }
  stopUpdate = false;
  update();
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function getHandle(draggable = false, posX, posY) {
  const handle = new Handle(document.createElement("div").cloneNode(), new Vector(0, 0));
  handle.element.classList.add("handle");
  handle.x = posX ?? random(0, CANVAS_WIDTH - HANDLE_SIZE);
  handle.y = posY ?? random(0, CANVAS_HEIGHT - HANDLE_SIZE);
  handle.isDraggable = draggable;
  canvasContainer.appendChild(handle.element);
  return handle;
}

window.onmouseup = event => {
  for (const handle of controlPoints) {
    handle.dragging = false;
  }
};

window.onmousemove = event => {
  const mouseX = event.clientX - CANVAS_X;
  const mouseY = event.clientY - CANVAS_Y;
  for (const handle of controlPoints) {
    if (handle.dragging) {
      handle.x = clamp(0, mouseX - HANDLE_SIZE, CANVAS_WIDTH - HANDLE_SIZE);
      handle.y = clamp(0, mouseY - HANDLE_SIZE, CANVAS_HEIGHT - HANDLE_SIZE);
    }
  }
};

function onClickHandle(event) {}

function random(min, max) {
  return Math.floor((max - min) * Math.random() + min);
}

function clamp(min, value, max) {
  return Math.min(Math.max(min, value), max);
}
update();

function update() {
  isUpdateRunning = true;
  let bezierCurvePath = [];
  clearCanvas();
  drawLines();
  let curControlPoints = controlPoints.map(e => e.vector);
  for (let t = 0; t <= 1; t += 0.001) {
    while (curControlPoints.length !== 1) {
      const nextControlPoints = [];
      for (let i = 0; i < curControlPoints.length - 1; i++) {
        // drawPoint(curControlPoints[i].vector);
        // drawPoint(curControlPoints[i + 1].vector);
        const handleVector = lerp(curControlPoints[i], curControlPoints[i + 1], t);
        nextControlPoints.push(handleVector);
      }
      curControlPoints = nextControlPoints;
    }
    bezierCurvePath.push(curControlPoints[0]);
    curControlPoints = controlPoints.map(e => e.vector);
  }

  for (const point of bezierCurvePath) {
    drawPoint(point);
  }
  if (stopUpdate) {
    isUpdateRunning = false;
    return;
  }
  requestAnimationFrame(update);
}

function drawLines() {
  for (let i = 0; i < controlPoints.length - 1; i++)
    drawLine(controlPoints[i].vector, controlPoints[i + 1].vector);
}

function clearCanvas() {
  canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawLine(vectorA, vectorB) {
  canvasCtx.beginPath();
  canvasCtx.moveTo(vectorA.x, vectorA.y);
  canvasCtx.lineTo(vectorB.x, vectorB.y);
  canvasCtx.strokeStyle = "#484858";
  canvasCtx.lineWidth = 3;
  canvasCtx.stroke();
}

function drawPoint(vector) {
  canvasCtx.fillStyle = "#b3b4bd";
  canvasCtx.fillRect(vector.x, vector.y, 2, 2);
}

function lerp(vectorA, vectorB, t) {
  return vectorA.scale(1 - t).add(vectorB.scale(t));
}
