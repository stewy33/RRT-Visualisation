import { quadtree } from "d3-quadtree";

// Set up fullscreen canvas
var canvas = document.getElementById("app");
var ctx = canvas.getContext("2d");

class Node {
  constructor(x, y, parent = null) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.children = [];

    if (this.parent) {
      this.parent.children.push(this);
    }
  }

  render() {
    if (this.parent) {
      ctx.moveTo(this.parent.x, this.parent.y);
      ctx.lineWidth = 0.5;
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class RRT {
  constructor(startNodePos, goalNodePos, validArea, maxEdgeLength) {
    // Initialize quadTree used to find nearest node to a sampling location
    this.quadTree = quadtree();
    // Set x and y accessors for Node data type
    this.quadTree = this.quadTree.x(node => node.x);
    this.quadTree = this.quadTree.y(node => node.y);
    // Tell quadtree to cover rectangle from (0, 0) to (canvas width, canvas height)
    this.quadTree.extent([0, 0], validArea);

    this.validArea = validArea;
    this.maxEdgeLength = maxEdgeLength;

    // Create and add start and goal nodes to tree
    const startNode = new Node(startNodePos[0], startNodePos[1]);
    const goalNode = new Node(goalNodePos[0], goalNodePos[1]);
    this.nodes = [startNode, goalNode];
    this.quadTree.addAll([startNode, goalNode]);
    this.dirtyNodes = [startNode, goalNode];
  }

  sampleLocation() {
    return [
      this.validArea[0] * (0.98 * Math.random() + 0.01),
      this.validArea[1] * (0.98 * Math.random() + 0.01)
    ];
  }

  // Creates a node at (x, y) with the nearest node as its parent
  extend(x, y) {
    const parent = this.quadTree.find(x, y);

    // Limit maximum edge length while keeping same heading
    const distToNearestNode = Math.sqrt(
      Math.pow(x - parent.x, 2) + Math.pow(y - parent.y, 2)
    );
    if (distToNearestNode > this.maxEdgeLength) {
      x = parent.x + (this.maxEdgeLength / distToNearestNode) * (x - parent.x);
      y = parent.y + (this.maxEdgeLength / distToNearestNode) * (y - parent.y);
    }

    // Create newNode and add to tree
    const newNode = new Node(x, y, parent);
    this.nodes.push(newNode);
    this.quadTree.add(newNode);
    this.dirtyNodes.push(newNode);

    return newNode;
  }

  render() {
    for (let i = 0; i < this.dirtyNodes.length; i++) {
      this.dirtyNodes[i].render();
    }
    this.dirtyNodes = [];
  }
}

const update = world => {
  const rrt = world.rrt;

  const [x, y] = rrt.sampleLocation();
  rrt.extend(x, y);

  world.numNodes += 1;
};

const render = world => {
  world.rrt.render();
};

const step = world => {
  if (world.numNodes < 1000) {
    update(world);
    render(world);
  }
};

const go = () => {
  const [startX, startY] = [50, ctx.canvas.height - 100];
  const [goalX, goalY] = [ctx.canvas.width - 50, 100];

  const rrt = new RRT(
    [startX, startY],
    [goalX, goalY],
    [ctx.canvas.width, ctx.canvas.height],
    100
  );

  const world = {
    rrt: rrt,
    numNodes: 0
  };

  ctx.fillStyle = "#f6f8f9";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw start and goal regions
  ctx.font = "20px Arial";

  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(startX, startY, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillText("Start", startX - 20, startY + 30);

  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(goalX, goalY, 10, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillText("Goal", goalX - 20, goalY - 18);

  ctx.fillStyle = "black";

  // Begin rrt algo + animation
  window.setInterval(() => step(world), 30);
};

go();
