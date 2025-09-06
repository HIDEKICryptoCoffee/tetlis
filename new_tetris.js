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
        this.dropInterval = 1000 * 0.7; // 落下速度を0.7倍に
        this.lastTime = 0;
        this.gameOver = false;
        this.soundEnabled = true;
        
        // サウンドエフェクトの作成
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.explosionSound = this.createExplosionSound();
        
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
        this.board = Array.from({ length: this.BOARD_HEIGHT }, () => 
            Array.from({ length: this.BOARD_WIDTH }, () => 0)
        );
        
        this.score = 0;
        this.lines = 0;
        this.dropTime = 0;
        this.lastTime = 0;
        this.gameOver = false;
        
        this.scoreElement.textContent = this.score;
        this.linesElement.textContent = this.lines;
        
        this.spawnPiece();
        this.spawnPiece(); // 次のピースを生成
        
        this.setupControls();
        this.lastTime = 0;
        requestAnimationFrame((time) => this.update(time));
    }

    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            const randomPiece = Math.floor(Math.random() * this.pieces.length);
            this.currentPiece = {
                shape: randomPiece,
                rotation: 0,
                x: Math.floor((this.BOARD_WIDTH - this.pieces[randomPiece][0][0].length) / 2),
                y: 0
            };
        }
        
        // 次のピースを生成
        const nextRandomPiece = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            shape: nextRandomPiece,
            rotation: 0,
            x: 0,
            y: 0
        };
        
        // ゲームオーバーチェック
        if (this.checkCollision()) {
            this.gameOver = true;
            alert('ゲームオーバー！');
            this.init();
        }
    }

    checkCollision(offsetX = 0, offsetY = 0, rotation = this.currentPiece.rotation) {
        const shape = this.pieces[this.currentPiece.shape][rotation % this.pieces[this.currentPiece.shape].length];
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const newX = this.currentPiece.x + x + offsetX;
                    const newY = this.currentPiece.y + y + offsetY;
                    
                    if (newX < 0 || 
                        newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT ||
                        (newY >= 0 && this.board[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placePiece() {
        const shape = this.pieces[this.currentPiece.shape][this.currentPiece.rotation];
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.shape + 1;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }

    createExplosionSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3;
        const numChannels = 1;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(numChannels, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // ノイズを生成
        for (let i = 0; i < frameCount; i++) {
            const progress = i / frameCount;
            // 時間とともに減衰するノイズ
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 2);
        }
        
        return buffer;
    }
    
    playExplosionSound() {
        if (!this.soundEnabled) return;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.explosionSound;
        
        // エフェクトを追加
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
        return source;
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
                
                // ラインが消えた時に爆発音を再生
                this.playExplosionSound();
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += [0, 100, 300, 500, 800][linesCleared];
            this.scoreElement.textContent = this.score;
            this.linesElement.textContent = this.lines;
        }
    }

    movePiece(offsetX, offsetY) {
        if (!this.checkCollision(offsetX, offsetY)) {
            this.currentPiece.x += offsetX;
            this.currentPiece.y += offsetY;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const nextRotation = (this.currentPiece.rotation + 1) % this.pieces[this.currentPiece.shape].length;
        
        if (!this.checkCollision(0, 0, nextRotation)) {
            this.currentPiece.rotation = nextRotation;
            return true;
        }
        return false;
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.placePiece();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
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

    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        const shape = this.pieces[this.currentPiece.shape][this.currentPiece.rotation];
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x] !== 0) {
                    const drawX = (this.currentPiece.x + x) * this.BLOCK_SIZE;
                    const drawY = (this.currentPiece.y + y) * this.BLOCK_SIZE;
                    
                    this.ctx.fillStyle = this.colors[this.currentPiece.shape + 1];
                    this.ctx.fillRect(
                        drawX,
                        drawY,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                    
                    this.ctx.strokeStyle = '#FFF';
                    this.ctx.strokeRect(
                        drawX,
                        drawY,
                        this.BLOCK_SIZE,
                        this.BLOCK_SIZE
                    );
                }
            }
        }
    }

    drawNextPiece() {
        if (!this.nextPiece) return;
        
        const shape = this.pieces[this.nextPiece.shape][0]; // 最初の回転状態を表示
        const blockSize = 20; // 次のブロック用のサイズ
        const offsetX = 1; // 中央寄せのためのオフセット
        const offsetY = 1;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y] && shape[y][x] !== 0) {
                    const colorIndex = this.nextPiece.shape + 1;
                    this.nextPieceCtx.fillStyle = this.colors[colorIndex];
                    this.nextPieceCtx.fillRect(
                        (x + offsetX) * blockSize, 
                        (y + offsetY) * blockSize, 
                        blockSize - 1, 
                        blockSize - 1
                    );
                    this.nextPieceCtx.strokeStyle = '#FFF';
                    this.nextPieceCtx.strokeRect(
                        (x + offsetX) * blockSize, 
                        (y + offsetY) * blockSize, 
                        blockSize - 1, 
                        blockSize - 1
                    );
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Tetris();
});
