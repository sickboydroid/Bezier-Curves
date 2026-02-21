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

  distSq(another) {
    const dx = this.x - another.x;
    const dy = this.y - another.y;
    return dx * dx + dy * dy;
  }
}

class Point {
  constructor(pos, isControlPoint = false) {
    this.pos = pos;
    this.selected = false;
    this.is_control_point = isControlPoint;
    this.color = this.is_control_point ? "#ff4444" : "#0096FF";
    this.selected_color = "white";
    this.radius = 5;
    this.selected_radius = this.radius * 2;
  }

  draw(ctx) {
    if (this.selected) {
      ctx.fillStyle = this.selected_color;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.selected_radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
}

const canvas = document.querySelector("canvas");
const curveSelectionItems = document.querySelectorAll(".curve-selection-item");
const ctx = canvas.getContext("2d");

let CANVAS_WIDTH = 0;
let CANVAS_HEIGHT = 0;
let points = [];
let selectedPoint = null;
let currentMode = "cubic";

initCanvas();
initMode();
update();

window.addEventListener("resize", () => {
  initCanvas();
  initMode();
});

function initCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  CANVAS_WIDTH = rect.width;
  CANVAS_HEIGHT = rect.height;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

/***** Menu UI & Mode Switching *******/

curveSelectionItems.forEach((item) => {
  item.addEventListener("click", function () {
    curveSelectionItems.forEach((el) => el.classList.remove("selected"));
    this.classList.add("selected");
    currentMode = this.id;
    initMode();
  });
});

function initMode() {
  points = [];
  if (currentMode === "linear") addRandomPoints(2);
  else if (currentMode === "quadratic") addRandomPoints(3);
  else if (currentMode === "cubic") addRandomPoints(4);
  else if (currentMode === "conic") addRandomPoints(5);
}

function addRandomPoints(count) {
  for (let i = 0; i < count; i++) {
    const x = random(50, CANVAS_WIDTH - 50);
    const y = random(50, CANVAS_HEIGHT - 50);
    points.push(new Point(new Vector(x, y)));
  }
}

/****************Input Handlers******************/

canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const clickVec = new Vector(mouseX, mouseY);

  let closestPoint = null;
  let closestDist = Infinity;

  for (const point of points) {
    const distSqr = point.pos.distSq(clickVec);
    if (distSqr < closestDist) {
      closestPoint = point;
      closestDist = distSqr;
    }
  }

  // If mouse within 20 pixels of point then select it otherwise add new point
  if (closestDist < 20 * 20 && closestPoint) {
    selectedPoint = closestPoint;
    selectedPoint.selected = true;
  } else if (currentMode === "custom") {
    addCustomCurvePoint(clickVec);
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (selectedPoint) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    selectedPoint.pos.x = clamp(0, mouseX, CANVAS_WIDTH);
    selectedPoint.pos.y = clamp(0, mouseY, CANVAS_HEIGHT);
  }
});

const endDrag = () => {
  if (selectedPoint) {
    selectedPoint.selected = false;
    selectedPoint = null;
  }
};

canvas.addEventListener("mouseup", endDrag);
canvas.addEventListener("mouseleave", endDrag);

function addCustomCurvePoint(at) {
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    let lastControlPointVector = new Vector(
      lastPoint.pos.x + 40,
      lastPoint.pos.y,
    );

    if (!lastPoint.is_control_point) {
      lastControlPointVector = new Vector(
        lastPoint.pos.x,
        lastPoint.pos.y - 40,
      );
    }

    const controlPointLast = new Point(lastControlPointVector, true);
    const controlPointCur = new Point(new Vector(at.x, at.y - 60), true);
    const point = new Point(new Vector(at.x, at.y));

    points.push(controlPointLast);
    points.push(point);
    points.push(controlPointCur);
  } else {
    points.push(new Point(new Vector(at.x, at.y)));
  }
}

/****************Drawing Logic****************/

function update() {
  clearCanvas();
  drawLines();

  if (currentMode === "custom") {
    drawNativeBezier();
  } else if (points.length > 0) {
    drawMathematicalBezier();
  }

  for (const point of points) {
    point.draw(ctx);
  }

  requestAnimationFrame(update);
}

function clearCanvas() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawLines() {
  ctx.beginPath();
  ctx.strokeStyle = "#484858";
  ctx.lineWidth = 2;

  if (currentMode === "custom") {
    if (points.length >= 2) {
      ctx.moveTo(points[0].pos.x, points[0].pos.y);
      ctx.lineTo(points[1].pos.x, points[1].pos.y);
      for (let i = 2; i < points.length - 1; i += 3) {
        ctx.moveTo(points[i].pos.x, points[i].pos.y);
        ctx.lineTo(points[i + 1].pos.x, points[i + 1].pos.y);
        if (i + 2 < points.length) {
          ctx.moveTo(points[i].pos.x, points[i].pos.y);
          ctx.lineTo(points[i + 2].pos.x, points[i + 2].pos.y);
        }
      }
    }
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      ctx.moveTo(points[i].pos.x, points[i].pos.y);
      ctx.lineTo(points[i + 1].pos.x, points[i + 1].pos.y);
    }
  }
  ctx.stroke();
}

function drawMathematicalBezier() {
  let bezierCurvePath = [];
  let curControlPoints = points.map((p) => p.pos);

  for (let t = 0; t <= 1; t += 0.001) {
    let tempPoints = [...curControlPoints];
    while (tempPoints.length > 1) {
      const nextControlPoints = [];
      for (let i = 0; i < tempPoints.length - 1; i++) {
        nextControlPoints.push(lerp(tempPoints[i], tempPoints[i + 1], t));
      }
      tempPoints = nextControlPoints;
    }
    bezierCurvePath.push(tempPoints[0]);
  }

  ctx.fillStyle = "#b3b4bd";
  for (const pathPoint of bezierCurvePath) {
    ctx.fillRect(pathPoint.x, pathPoint.y, 2, 2);
  }
}

function drawNativeBezier() {
  if (points.length <= 1) return;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();

  ctx.moveTo(points[0].pos.x, points[0].pos.y);

  if (points.length >= 4) {
    ctx.bezierCurveTo(
      points[1].pos.x,
      points[1].pos.y,
      points[3].pos.x,
      points[3].pos.y,
      points[2].pos.x,
      points[2].pos.y,
    );
    for (let i = 2; i <= points.length - 4; i += 3) {
      ctx.bezierCurveTo(
        points[i + 2].pos.x,
        points[i + 2].pos.y,
        points[i + 4].pos.x,
        points[i + 4].pos.y,
        points[i + 3].pos.x,
        points[i + 3].pos.y,
      );
    }
  }
  ctx.stroke();
}

/***************Helpers***************/
function lerp(vectorA, vectorB, t) {
  return vectorA.scale(1 - t).add(vectorB.scale(t));
}

function random(min, max) {
  return Math.floor((max - min) * Math.random() + min);
}

function clamp(min, value, max) {
  return Math.min(Math.max(min, value), max);
}
