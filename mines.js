var Mines = {
  MINE_TYPE: 7,
  EMPTY_TYPE: 0,
  EMPTY_TYPE_VISIBLE: -1,

  HIDDEN_STATE: 0,
  VISIBLE_STATE: 1,
  FLAGGED_STATE: 2,

  fillStyles: ['blue', 'green', 'red', 'darkblue', '#551111', 'teal'],

  colors: {
    mouseHold: '#aaa',
    mouseHover: '#eee',
    tileHiddenBg: '#ddd',
    tileVisibleBg: '#fff',
    lineColor: '#ccc'
  },

  difficultyPresets: {
    beginner:     [8, 8, 10],
    intermediate: [16, 16, 40],
    expert:       [30, 16, 99]
  }
};

Mines.createGridLines = function() {
  this.canvas.width = this.xs * this.squareSize;
  this.canvas.height = this.ys * this.squareSize;

  this.context.beginPath();
  this.context.strokeStyle = this.colors.lineColor;
  for (var y = 0; y < this.ys * this.squareSize; y += this.squareSize) {
    this.context.moveTo(0, y);
    this.context.lineTo(this.xs * this.squareSize, y);
    this.context.stroke();
  }
  for (var x = 0; x < this.xs * this.squareSize; x += this.squareSize) {
    this.context.moveTo(x, 0);
    this.context.lineTo(x, this.ys * this.squareSize);
    this.context.stroke();
  }
  this.context.closePath();
};

Mines.createOverlay = function(string) {
  if (string !== 'Paused') {
    this.context.globalAlpha = 0.5;
  }
  var width  = this.xs * this.squareSize,
      height = this.ys * this.squareSize;
  this.context.fillRect(0, 0, width, height);
  this.context.globalAlpha = 1;
  this.context.fillStyle = '#555';
  this.context.font = 'bold ' + (this.squareSize - 5) + 'px monospace';
  this.context.fillText(string, width / 2, height / 2);
  this.context.font = 'bold ' + (this.squareSize - 15) + 'px monospace';
};

Mines.plantMines = function() {
  var n, x, y;
  var avail = Array.apply(null, new Array(this.xs * this.ys))
    .map(function(e, i) {
      return i;
    });
  for (var i = 0; i < this.mineCount; i++) {
    n = Math.floor(Math.random() * avail.length);
    y = Math.floor(avail[n] / this.xs);
    x = avail[n] % this.xs;
    avail.splice(n, 1);
    this.grid[y][x] = this.MINE_TYPE;
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
  this.context.fillRect(x * this.squareSize + 1, y * this.squareSize + 1,
                        this.squareSize - 2, this.squareSize - 2);
  this.context.fillStyle = fg || '';
  this.context.fillText(text || this.grid[y][x],
                        x * this.squareSize + this.squareSize / 2,
                        y * this.squareSize + this.squareSize / 2 + 1, 25);
  this.context.fillStyle = this.colors.mouseHold;
};

Mines.revealMines = function(state) {
  for (var y = 0; y < this.ys; y++) {
    for (var x = 0; x < this.xs; x++) {
      if (this.grid[y][x] === this.MINE_TYPE) {
        switch (state) {
        case this.HIDDEN_STATE:
          this.states[y][x] = this.HIDDEN_STATE;
          this.placeSquare(x, y, null, 'red');
          break;
        case this.FLAGGED_STATE:
          this.states[y][x] = this.FLAGGED_STATE;
          this.placeSquare(x, y, this.colors.mouseHold,
              this.colors.tileHiddenBg, 'F');
          break;
        }
      }
    }
  }
};

Mines.drawNumbers = function() {
  this.context.beginPath();
  for (var y = 0; y < this.ys; y++) {
    for (var x = 0; x < this.xs; x++) {
      if (this.states[y][x] === this.VISIBLE_STATE) {
        if (this.grid[y][x] === this.MINE_TYPE) {
          this.revealMines(this.HIDDEN_STATE);
          this.gameInProgess = false;
          this.gameActive = false;
          this.gamePaused = true;
          this.context.closePath();
          return this.createOverlay('Game Over!');
        } else if (this.grid[y][x] > 0) {
          this.placeSquare(x, y, this.fillStyles[this.grid[y][x] - 1] || '#000',
                           this.colors.tileVisibleBg);
        } else if (this.grid[y][x] === this.EMPTY_TYPE) {
          this.revealBlanks(x, y);
          return this.drawNumbers();
        } else {
          this.placeSquare(x, y, null, this.colors.tileVisibleBg);
        }
      } else {
        if (this.states[y][x] === this.FLAGGED_STATE) {
          this.placeSquare(x, y, this.colors.mouseHold,
              this.colors.tileHiddenBg, 'F');
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
  return Array.apply(null, new Array(this.ys)).map(function() {
    return new Int8Array(this.xs);
  }.bind(this));
};

Mines.calculateNeighborLines = function() {
  for (var y = 0; y < this.ys; y++) {
    for (var x = 0; x < this.xs; x++) {
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
    this.context.fillRect(x * this.squareSize + 1, y * this.squareSize + 1,
                          this.squareSize - 2, this.squareSize - 2);
    this.context.closePath();
  }
};

Mines.checkWin = function() {
  for (var y = 0; y < this.ys; y++) {
    for (var x = 0; x < this.xs; x++) {
      if (this.grid[y][x] !== this.MINE_TYPE &&
          this.states[y][x] !== this.VISIBLE_STATE) {
        return false;
      }
    }
  }
  return true;
};

Mines.onMouseUp = function(event) {
  if (this.gamePaused) {
    return;
  }
  var x = Math.floor(event.offsetX / this.squareSize);
  var y = Math.floor(event.offsetY / this.squareSize);
  this.mouseDown = false;
  if (this.states[y][x] !== this.VISIBLE_STATE) {
    if (this.rightClick === true ||
        (this.rightClick === true &&
         this.states[y][x] === this.FLAGGED_STATE)) {
      if (this.states[y][x] === this.EMPTY_TYPE || (this.rightClick === false &&
          this.states[y][x] === 1)) {
        this.placeSquare(this.clickPos.x, this.clickPos.y,
            this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
        this.states[y][x] = this.FLAGGED_STATE;
        this.mineCountEl.textContent--;
      } else {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null,
            this.colors.tileHiddenBg);
        this.states[y][x] = this.HIDDEN_STATE;
        this.mineCountEl.textContent++;
      }
    }
  } else if (!this.rightClick && this.grid[y][x] !== -1) {
    var hiddenSquares = [];
    var flagCount = 0;
    for (var i = -1; i < 2; i++) {
      var _y = y + i;
      if (_y < 0 || _y >= this.grid.length)
        continue;
      for (var j = -1; j < 2; j++) {
        var _x = x + j;
        if (_x < 0 || _x >= this.grid[0].length)
          continue;
        flagCount += +(this.states[_y][_x] === this.FLAGGED_STATE);
        if (this.states[_y][_x] !== this.VISIBLE_STATE &&
            this.states[_y][_x] !== this.FLAGGED_STATE) {
          hiddenSquares.push([_x, _y]);
        }
      }
    }
    if (flagCount === this.grid[y][x]) {
      (function() {
        hiddenSquares.forEach(function(coords) {
          var x = coords[0], y = coords[1];
          this.states[y][x] = this.VISIBLE_STATE;
        }.bind(this));
      }.bind(this))();
    }
  }
  if (this.states[y][x] !== this.FLAGGED_STATE && this.rightClick === false &&
      x === this.clickPos.x && y === this.clickPos.y) {
    if (this.firstClick) {
      while (this.grid[y][x] !== this.EMPTY_TYPE) {
        this.grid = this.createGrid();
        this.plantMines();
        this.calculateNeighborLines();
      }
      this.startGame();
      this.firstClick = false;
    }
    this.states[y][x] = this.VISIBLE_STATE;
    this.drawNumbers();
  }
  if (this.checkWin()) {
    this.gameInProgess = false;
    this.gameActive = false;
    this.gamePaused = true;
    this.revealMines(this.FLAGGED_STATE);
    this.context.closePath();
    return this.createOverlay('You Win!');
  }
};

Mines.onMouseDown = function(event) {
  if (this.gamePaused) {
    return;
  }
  this.clickPos = {
    x: Math.floor(event.offsetX / this.squareSize),
    y: Math.floor(event.offsetY / this.squareSize),
  };
  this.rightClick = event.button === 2;
  this.mouseDown = true;
  if (this.states[this.clickPos.y][this.clickPos.x] !== this.VISIBLE_STATE) {
    this.pushSquare(this.clickPos.x, this.clickPos.y);
  } else if (!this.rightClick) {
    for (var i = -1; i < 2; i++) {
      var _y = this.clickPos.y + i;
      if (_y < 0 || _y >= this.grid.length)
        continue;
      for (var j = -1; j < 2; j++) {
        var _x = this.clickPos.x + j;
        if (_x < 0 || _x >= this.grid[0].length)
          continue;
        if (this.states[_y][_x] !== this.VISIBLE_STATE &&
            this.states[_y][_x] !== this.FLAGGED_STATE) {
          this.pushSquare(_x, _y);
        }
      }
    }
  }
};

Mines.onMouseMove = function(event) {
  var x, y;
  if (this.gamePaused) {
    return;
  }
  if (this.mouseDown) {
    x = Math.floor(event.offsetX / this.squareSize);
    y = Math.floor(event.offsetY / this.squareSize);
    if (x !== this.clickPos.x || y !== this.clickPos.y) {
      this.drawNumbers();
    }
    if (this.clickPos !== void 0 &&
        (x !== this.clickPos.x || y !== this.clickPos.y)) {
      if (this.states[this.clickPos.y][this.clickPos.x] === this.HIDDEN_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null,
            this.colors.tileHiddenBg);
      } else if (this.states[this.clickPos.y][this.clickPos.x] ===
                 this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y,
            this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
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
        this.placeSquare(this.clickPos.x, this.clickPos.y, null,
            this.colors.tileHiddenBg);
      } else if (this.states[this.clickPos.y][this.clickPos.x] ===
                 this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y,
            this.colors.mouseHold, this.colors.tileHiddenBg, 'F');
      }
    }
    x = Math.floor(event.offsetX / this.squareSize);
    y = Math.floor(event.offsetY / this.squareSize);
    this.clickPos = {
      x: x,
      y: y
    };
    if (this.clickPos && this.states[this.clickPos.y] !== void 0) {
      if (this.states[this.clickPos.y][this.clickPos.x] === this.HIDDEN_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y, null,
            this.colors.mouseHover);
      } else if (this.states[this.clickPos.y][this.clickPos.x] ===
                 this.FLAGGED_STATE) {
        this.placeSquare(this.clickPos.x, this.clickPos.y,
            this.colors.mouseHold, this.colors.mouseHover, 'F');
      }
    }
  }
};

Mines.onKeyPress = function(event) {
  if (this.gameInProgess === true) {
    var key = String.fromCharCode(event.which);
    switch (key) {
    case 'p':
      this.gamePaused = !this.gamePaused;
      if (this.gamePaused) {
        this.drawNumbers();
        this.createOverlay('Paused');
      } else {
        this.redrawBoard();
      }
      break;
    }
  }
};

Mines.redrawBoard = function() {
  this.createGridLines();
  this.context.font = 'bold ' + (this.squareSize - 8) + 'px monospace';
  this.context.textAlign = 'center';
  this.context.textBaseline = 'middle';
  this.context.fillStyle = this.colors.mouseHold;
  this.drawNumbers();
  this.clickPos = null;
};

Mines.resetBoard = function() {
  this.grid = this.createGrid();
  this.states = this.createGrid();
  this.plantMines();
  this.calculateNeighborLines();
  this.firstClick = true;
  this.clickPos = null;
  this.redrawBoard();
};

Mines.setDifficulty = function(xs, ys, mines) {
  if (typeof xs === 'string') {
    return this.setDifficulty.apply(this, this.difficultyPresets[xs]);
  }
  window.clearInterval(this.timerInterval);
  this.timer.textContent = '0';
  this.gamePaused = false;
  this.mineCount = mines;
  this.mineCountEl.textContent = mines;
  this.xs = xs;
  this.ys = ys;
  this.squareSize = 26;
  this.canvas.width = this.xs * this.squareSize;
  this.canvas.height = this.ys * this.squareSize;
  this.canvas.style.width = this.canvas.width + 'px';
  this.canvas.style.height = this.canvas.height + 'px';

  this.firstClick = true;
  this.resetBoard();
};

Mines.startGame = function() {
  this.gameActive = true;
  this.gamePaused = false;
  this.gameInProgess = true;
  this.timerInterval = window.setInterval(function() {
    if (this.gameActive === true && this.gamePaused === false) {
      this.timer.textContent++;
    } else if (!this.gameInProgess) {
      window.clearInterval(this.timerInterval);
    }
  }.bind(this), 1000);
  window.addEventListener('blur', function() {
    this.gameActive = false;
  }.bind(this));
  window.addEventListener('focus', function() {
    this.gameActive = true;
  }.bind(this));
};

Mines.init = function() {
  this.canvas = document.getElementById('grid');
  this.timer = document.getElementById('timer');
  this.mineCountEl = document.getElementById('mine-count');
  this.context = this.canvas.getContext('2d');
  this.newGameButton = document.getElementById('new-game');
  this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this), true);
  this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this), true);
  this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this), true);
  this.canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault();
  }, true);
  document.addEventListener('keypress', this.onKeyPress.bind(this), true);
};

document.addEventListener('DOMContentLoaded', function() {
  Mines.init();

  var newGame = document.getElementById('new-game');
  var difficultyMenu = document.getElementById('difficulty');
  newGame.onclick = function() {
    Mines.setDifficulty(difficultyMenu.value);
  };
  newGame.onclick();

});
