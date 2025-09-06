class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextPieceCanvas = document.getElementById('nextPieceCanvas');
        this.nextPieceCtx = this.nextPieceCanvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.linesElement = document.getElementById('lines');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = Array.from({ length: this.BOARD_HEIGHT }, () => 
            Array.from({ length: this.BOARD_WIDTH }, () => 0)
        );
        
        this.score = 0;
        this.lines = 0;
        this.dropTime = 0;
        this.dropInterval = 500; // 落下速度を2倍に
        
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.colors = [
            '#000000', // 0: empty
            '#00FFFF', // 1: I - cyan
            '#FFFF00', // 2: O - yellow
            '#800080', // 3: T - purple
            '#00FF00', // 4: S - green
            '#FF0000', // 5: Z - red
            '#0000FF', // 6: J - blue
            '#FFA500'  // 7: L - orange
        ];
        
        this.pieces = [
            // I piece
            [
                [[0,0,0,0],
                 [1,1,1,1],
                 [0,0,0,0],
                 [0,0,0,0]],
                [[0,0,1,0],
                 [0,0,1,0],
                 [0,0,1,0],
                 [0,0,1,0]]
            ],
            // O piece
            [
                [[0,0,0,0],
                 [0,2,2,0],
                 [0,2,2,0],
                 [0,0,0,0]]
            ],
            // T piece
            [
                [[0,0,0,0],
                 [0,3,0,0],
                 [3,3,3,0],
                 [0,0,0,0]],
                [[0,0,0,0],
                 [0,3,0,0],
                 [0,3,3,0],
                 [0,3,0,0]],
                [[0,0,0,0],
                 [0,0,0,0],
                 [3,3,3,0],
                 [0,3,0,0]],
                [[0,0,0,0],
                 [0,3,0,0],
                 [3,3,0,0],
                 [0,3,0,0]]
            ],
            // S piece
            [
                [[0,0,0,0],
                 [0,4,4,0],
                 [4,4,0,0],
                 [0,0,0,0]],
                [[0,0,0,0],
                 [0,4,0,0],
                 [0,4,4,0],
                 [0,0,4,0]]
            ],
            // Z piece
            [
                [[0,0,0,0],
                 [5,5,0,0],
                 [0,5,5,0],
                 [0,0,0,0]],
                [[0,0,0,0],
                 [0,0,5,0],
                 [0,5,5,0],
                 [0,5,0,0]]
            ],
            // J piece
            [
                [[0,0,0,0],
                 [6,0,0,0],
                 [6,6,6,0],
                 [0,0,0,0]],
                [[0,0,0,0],
                 [0,6,6,0],
                 [0,6,0,0],
                 [0,6,0,0]],
                [[0,0,0,0],
                 [0,0,0,0],
                 [6,6,6,0],
                 [0,0,6,0]],
                [[0,0,0,0],
                 [0,6,0,0],
                 [0,6,0,0],
                 [6,6,0,0]]
            ],
            // L piece
            [
                [[0,0,0,0],
                 [0,0,7,0],
                 [7,7,7,0],
                 [0,0,0,0]],
                [[0,0,0,0],
                 [0,7,0,0],
                 [0,7,0,0],
                 [0,7,7,0]],
                [[0,0,0,0],
                 [0,0,0,0],
                 [7,7,7,0],
                 [7,0,0,0]],
                [[0,0,0,0],
                 [7,7,0,0],
                 [0,7,0,0],
                 [0,7,0,0]]
            ]
        ];
        
        this.init();
    }
    
    init() {
        this.spawnPiece();
        this.update();
        this.bindEvents();
    }
    
    spawnPiece() {
        const pieceType = Math.floor(Math.random() * this.pieces.length);
        this.currentPiece = {
            shape: this.pieces[pieceType],
            x: 3,
            y: 0,
            rotation: 0,
            type: pieceType
        };
        
        if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.rotation)) {
            this.gameOver();
        }
    }
    
    isValidMove(x, y, rotation) {
        const shape = this.currentPiece.shape[rotation];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        const shape = this.currentPiece.shape[this.currentPiece.rotation];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    
                    if (y >= 0) {
                        this.board[y][x] = shape[row][col];
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * (linesCleared);
            this.updateScore();
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
    }
    
    movePiece(dx, dy) {
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidMove(newX, newY, this.currentPiece.rotation)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        const newRotation = (this.currentPiece.rotation + 1) % this.currentPiece.shape.length;
        
        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, newRotation)) {
            this.currentPiece.rotation = newRotation;
        }
    }
    
    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.placePiece();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (!this.movePiece(0, 1)) {
                        this.placePiece();
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
            this.draw();
        });
    }
    
    update(now = 0) {
        if (!this.lastTime) {
            this.lastTime = now;
            requestAnimationFrame((time) => this.update(time));
            return;
        }
        
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        if (!this.gameOver) {
            this.dropTime += deltaTime;
            
            if (this.dropTime > this.dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.placePiece();
                }
                this.dropTime = 0;
            }
            
            this.draw();
            requestAnimationFrame((time) => this.update(time));
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextPieceCtx.clearRect(0, 0, this.nextPieceCanvas.width, this.nextPieceCanvas.height);
        
        this.drawBoard();
        this.drawCurrentPiece();
        this.drawNextPiece();
    }

    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                const value = this.board[y][x];
                if (value) {
                    this.ctx.fillStyle = this.colors[value];
                    this.ctx.fillRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                    
                    this.ctx.strokeStyle = '#FFF';
                    this.ctx.strokeRect(
                        x * this.BLOCK_SIZE,
                        y * this.BLOCK_SIZE,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }

document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});