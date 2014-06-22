var Mines = {

  MINE_TYPE: 7,
  EMPTY_TYPE: 0,
  EMPTY_TYPE_VISIBLE: -1,
  HIDDEN_STATE: 0,
  VISIBLE_STATE: 1,
  FLAGGED_STATE: 2,
  fillStyles: ['blue', 'green', 'red', 'darkblue', '#551111', 'teal'],
  colors: {
    mouseHold: '#888',
    mouseHover: '#eee',
    tileHiddenBg: '#ddd',
    tileVisibleBg: '#fff',
    lineColor: '#ccc'
  }

};

Mines.createGridLines = function() {
  this.context.beginPath();
  this.context.strokeStyle = this.colors.lineColor;
  for (var x = 0; x < this.gridSize * this.squareSize; x += this.squareSize) {
    this.context.moveTo(x, 0);
    this.context.lineTo(x, this.gridSize * this.squareSize);
    this.context.stroke();
    this.context.moveTo(0, x);
    this.context.lineTo(this.gridSize * this.squareSize, x);
    this.context.stroke();
  }
  this.context.closePath();
};

Mines.plantMines = function() {
  for (var i = 0; i < this.mineCount; i++) {
    var r = Math.floor(Math.random() * this.gridSize * this.gridSize);
    if (this.grid[r] === this.MINE_TYPE) {
      i--;
      continue;
    }
    this.grid[r % this.gridSize][Math.floor(r / this.gridSize)] = this.MINE_TYPE;
  }
};

Mines.revealBlanks = function(x, y) {
  this.grid[y][x] = this.EMPTY_TYPE_VISIBLE;
  this.placeSquare(x, y, null, this.colors.tileVisibleBg);
  for (var y1 = y - 1; y1 < y + 2; y1++) {
    if (this.grid[y1] === void 0) {
      continue;
    }
    for (var x1 = x - 1; x1 < x + 2; x1++) {
      if (this.grid[y1][x1] === void 0) {
        continue;
      }
      this.states[y1][x1] = this.VISIBLE_STATE;
      if (x1 === x && y1 === y) {
        continue;
      }
      if (this.grid[y1][x1] === this.EMPTY_TYPE) {
        this.grid[y1][x1] = this.EMPTY_TYPE_VISIBLE;
        this.revealBlanks(x1, y1);
      }
    }
  }
};

Mines.placeSquare = function(x, y, fg, bg, text) {
  this.context.fillStyle = bg || '';
  this.context.fillRect(x * this.squareSize + 1, y * this.squareSize + 1, this.squareSize - 2, this.squareSize - 2);
  this.context.fillStyle = fg || '';
  this.context.fillText(text || this.grid[y][x], x * this.squareSize + this.squareSize / 2, y * this.squareSize + this.squareSize / 2, 25);
  this.context.fillStyle = this.colors.mouseHold;
};

Mines.drawNumbers = function() {
  this.context.beginPath();
  for (var y = 0; y < this.gridSize; y++) {
    for (var x = 0; x < this.gridSize; x++) {
      if (this.states[y][x] === this.VISIBLE_STATE) {
        if (this.grid[y][x] === this.MINE_TYPE) {
          this.placeSquare(x, y, null, 'red');
        } else if (this.grid[y][x] > 0) {
          this.placeSquare(x, y, this.fillStyles[this.grid[y][x] - 1] || '#000', this.colors.tileVisibleBg);
        } else if (this.grid[y][x] === this.EMPTY_TYPE) {
          this.revealBlanks(x, y);
          return this.drawNumbers();
        }
      } else {
        if (this.states[y][x] === this.FLAGGED_STATE) {
          this.placeSquare(x, y, this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
        } else {
          this.placeSquare(x, y, null, this.colors.tileHiddenBg);
        }
      }
    }
  }
  this.context.fillStyle = this.colors.mouseHold;
  this.context.closePath();
};

Mines.createGrid = function() {
  return Array.apply(null, new Array(this.gridSize)).map(function() {
    return new Int8Array(this.gridSize);
  }.bind(this));
};

Mines.calculateNeighborLines = function() {
  for (var y = 0; y < this.gridSize; y++) {
    for (var x = 0; x < this.gridSize; x++) {
      if (this.grid[y][x] === this.MINE_TYPE) {
        continue;
      }
      var surroundingMines = this.EMPTY_TYPE;
      for (var y1 = y - 1; y1 < y + 2; y1++) {
        if (this.grid[y1] === void 0) {
          continue;
        }
        for (var x1 = x - 1; x1 < x + 2; x1++) {
          if (this.grid[y1][x1] === void 0 || (x1 === x && y1 === y)) {
            continue;
          }
          if (this.grid[y1][x1] === this.MINE_TYPE) {
            surroundingMines++;
          }
        }
      }
      this.grid[y][x] = surroundingMines;
    }
  }
};

Mines.pushSquare = function(x, y) {
  if (this.states[y][x] !== this.VISIBLE_STATE) {
    this.context.beginPath();
    this.context.fillRect(x * this.squareSize + 1, y * this.squareSize + 1, this.squareSize - 2, this.squareSize - 2);
    this.context.closePath();
  }
};

Mines.onMouseUp = function(event) {
  var boundingRect = this.canvas.getBoundingClientRect();
  var x = Math.floor(this.gridSize * ((event.clientX - boundingRect.left) / (this.gridSize * this.squareSize))),
      y = Math.floor(this.gridSize * ((event.clientY - boundingRect.top) / (this.gridSize * this.squareSize)));
  this.mouseDown = false;
  if (this.states[y][x] !== this.VISIBLE_STATE) {
    if (this.rightClick === true || (this.rightClick === true && this.states[y][x] === this.FLAGGED_STATE)) {
      if (this.states[y][x] === this.EMPTY_TYPE || (this.rightClick === false && this.states[y][x] === 1)) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
        this.states[y][x] = this.FLAGGED_STATE;
      } else {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null, this.colors.tileHiddenBg);
        this.states[y][x] = this.HIDDEN_STATE;
      }
    }
  }
  if (this.states[y][x] !== this.FLAGGED_STATE && this.rightClick === false && x === this.clickPos.x && y === this.clickPos.y) {
    if (this.firstClick) {
      while (this.grid[y][x] !== this.EMPTY_TYPE) {
        this.resetBoard();
      }
      this.firstClick = false;
    }
    this.states[y][x] = this.VISIBLE_STATE;
    this.drawNumbers();
  }
};

Mines.onMouseDown = function(event) {
  var boundingRect = this.canvas.getBoundingClientRect();
  this.clickPos = {
    x: Math.floor(this.gridSize * ((event.clientX - boundingRect.left) / (this.gridSize * this.squareSize))),
    y: Math.floor(this.gridSize * ((event.clientY - boundingRect.top) / (this.gridSize * this.squareSize)))
  };
  this.rightClick = event.button === 2;
  if (this.states[this.clickPos.y][this.clickPos.x] !== this.VISIBLE_STATE) {
    this.mouseDown = true;
    this.pushSquare(this.clickPos.x, this.clickPos.y);
  }
};

Mines.onMouseMove = function(event) {
  var x, y,
      boundingRect = this.canvas.getBoundingClientRect();
  if (this.mouseDown) {
    x = Math.floor(this.gridSize * ((event.clientX - boundingRect.left) / (this.gridSize * this.squareSize)));
    y = Math.floor(this.gridSize * ((event.clientY - boundingRect.top) / (this.gridSize * this.squareSize)));
    if (this.clickPos !== void 0 && this.grid[this.clickPos.y][this.clickPos.x] !== this.EMPTY_TYPE_VISIBLE && (x !== this.clickPos.x || y !== this.clickPos.y)) {
      if (this.states[this.clickPos.y][this.clickPos.x] === this.HIDDEN_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null, this.colors.tileHiddenBg);
      } else if (this.states[this.clickPos.y][this.clickPos.x] === this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
      }
      this.clickPos = {
        x: x,
        y: y
      };
      this.onMouseDown(event);
    }
  } else {
    if (this.clickPos && this.states[this.clickPos.y] !== void 0) {
      if (this.states[this.clickPos.y][this.clickPos.x] === this.HIDDEN_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null, this.colors.tileHiddenBg);
      } else if (this.states[this.clickPos.y][this.clickPos.x] === this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
      }
    }
    x = Math.floor(this.gridSize * ((event.clientX - boundingRect.left) / (this.gridSize * this.squareSize)));
    y = Math.floor(this.gridSize * ((event.clientY - boundingRect.top) / (this.gridSize * this.squareSize)));
    this.clickPos = {
      x: x,
      y: y
    };
    if (this.clickPos && this.states[this.clickPos.y] !== void 0) {
      if (this.states[this.clickPos.y][this.clickPos.x] === this.HIDDEN_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null, this.colors.mouseHover);
      } else if (this.states[this.clickPos.y][this.clickPos.x] === this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, this.colors.mouseHold, this.colors.mouseHover, 'F');
      }
    }
  }
};

Mines.resetBoard = function() {
  this.createGridLines();
  this.grid = this.createGrid();
  this.states = this.createGrid();
  this.plantMines();
  this.calculateNeighborLines();
  this.firstClick = true;
  this.context.font = 'bold ' + (this.squareSize - 15) + 'px monospace';
  this.context.textAlign = 'center';
  this.context.textBaseline = 'middle';
  this.context.fillStyle = this.colors.mouseHold;
  this.drawNumbers();
  this.clickPos = null;
};

Mines.setDifficulty = function(gridSize, mines) {
  this.mineCount = mines;
  this.gridSize = gridSize;
  this.squareSize = Math.floor(Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight) / (gridSize * 1.3));
  this.canvas.width = this.gridSize * this.squareSize;
  this.canvas.height = this.canvas.width;
  this.firstClick = true;
  this.resetBoard();
};

Mines.init = function() {
  this.canvas = document.getElementById('grid');
  this.context = this.canvas.getContext('2d');
  this.setDifficulty(16, 40);
  this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
  this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
  this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), true);
  this.canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  }, true);
};

document.addEventListener('DOMContentLoaded', Mines.init.bind(Mines), false);
