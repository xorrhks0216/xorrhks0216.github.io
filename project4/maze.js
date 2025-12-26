class MazeGame {
    constructor() {
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 20;
        this.rows = 0;
        this.cols = 0;
        this.maze = [];
        this.visited = [];
        this.path = [];
        this.playerPos = { row: 0, col: 0 };
        this.startPos = { row: 0, col: 0 };
        this.endPos = { row: 0, col: 0 };
        this.moveCount = 0;
        this.showPath = true;
        this.gameWon = false;
        
        // 키보드 연속 입력을 위한 변수
        this.keys = {};
        this.currentDirection = null;
        this.moveInterval = null;
        this.moveDelay = 150; // 초기 이동 지연 시간 (ms)
        this.fastMoveDelay = 50; // 연속 입력 시 빠른 이동 지연 시간 (ms)

        this.init();
    }

    init() {
        this.generateRandomSize();
        this.generateMaze();
        this.setupEventListeners();
        this.draw();
    }

    generateRandomSize() {
        // 입력된 크기 가져오기 또는 랜덤 생성
        const sizeInput = document.getElementById('mazeSizeInput');
        let size = parseInt(sizeInput.value) || 20;
        
        // 범위 체크 및 홀수 보정
        if (size < 15) size = 15;
        if (size > 35) size = 35;
        size = size % 2 === 0 ? size + 1 : size;
        
        this.rows = size;
        this.cols = size;
        
        // 캔버스 크기 조정
        const maxCanvasSize = Math.min(window.innerWidth - 100, 600);
        const cellSizeByWidth = Math.floor(maxCanvasSize / this.cols);
        const cellSizeByHeight = Math.floor((window.innerHeight - 400) / this.rows);
        this.cellSize = Math.min(cellSizeByWidth, cellSizeByHeight, 25);
        
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;

        // 미로 정보 업데이트
        document.getElementById('mazeSize').textContent = `${this.rows} x ${this.cols}`;
        sizeInput.value = size;
    }

    generateMaze() {
        // 미로 초기화 (모든 셀을 벽으로)
        this.maze = [];
        for (let i = 0; i < this.rows; i++) {
            this.maze[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.maze[i][j] = 1; // 1 = 벽, 0 = 길
            }
        }

        // DFS 알고리즘으로 미로 생성
        const stack = [];
        const startRow = 1;
        const startCol = 1;
        
        this.maze[startRow][startCol] = 0;
        stack.push([startRow, startCol]);

        const directions = [
            [0, 2],  // 오른쪽
            [2, 0],  // 아래
            [0, -2], // 왼쪽
            [-2, 0]  // 위
        ];

        while (stack.length > 0) {
            const [currentRow, currentCol] = stack[stack.length - 1];
            const neighbors = [];

            // 방문하지 않은 이웃 찾기
            for (const [dr, dc] of directions) {
                const newRow = currentRow + dr;
                const newCol = currentCol + dc;

                if (
                    newRow > 0 && newRow < this.rows - 1 &&
                    newCol > 0 && newCol < this.cols - 1 &&
                    this.maze[newRow][newCol] === 1
                ) {
                    neighbors.push([newRow, newCol, dr, dc]);
                }
            }

            if (neighbors.length > 0) {
                // 랜덤 이웃 선택
                const [newRow, newCol, dr, dc] = neighbors[
                    Math.floor(Math.random() * neighbors.length)
                ];
                
                // 벽 제거
                this.maze[newRow][newCol] = 0;
                this.maze[currentRow + dr / 2][currentCol + dc / 2] = 0;
                
                stack.push([newRow, newCol]);
            } else {
                stack.pop();
            }
        }

        // 시작점과 끝점 설정
        this.startPos = { row: 1, col: 1 };
        this.endPos = { row: this.rows - 2, col: this.cols - 2 };
        this.playerPos = { ...this.startPos };
        
        // 방문 기록 초기화
        this.visited = [];
        for (let i = 0; i < this.rows; i++) {
            this.visited[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.visited[i][j] = false;
            }
        }
        
        this.path = [];
        this.moveCount = 0;
        this.gameWon = false;
        document.getElementById('moveCount').textContent = '0';
        document.getElementById('winMessage').classList.add('hidden');
    }

    setupEventListeners() {
        // 키보드 이벤트 - 키 누름
        document.addEventListener('keydown', (e) => {
            if (this.gameWon) return;
            
            let direction = null;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    direction = { dr: -1, dc: 0 };
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    direction = { dr: 1, dc: 0 };
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    direction = { dr: 0, dc: -1 };
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    direction = { dr: 0, dc: 1 };
                    break;
            }
            
            if (direction) {
                const key = e.key.toLowerCase();
                if (!this.keys[key]) {
                    // 키 상태 업데이트
                    this.keys[key] = true;
                    this.currentDirection = direction;
                    
                    // 첫 번째 입력은 즉시 이동
                    this.movePlayer(direction.dr, direction.dc);
                    
                    // 연속 입력을 위한 인터벌 시작
                    this.startContinuousMove();
                }
            }
        });
        
        // 키보드 이벤트 - 키 떼기
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys[key]) {
                this.keys[key] = false;
                
                // 다른 키가 눌려있는지 확인하고 방향 업데이트
                this.updateCurrentDirection();
                
                // 모든 키가 떼어졌으면 연속 이동 중지
                if (!this.currentDirection) {
                    this.stopContinuousMove();
                }
            }
        });
        
        // 포커스 잃을 때 키 상태 초기화
        window.addEventListener('blur', () => {
            this.keys = {};
            this.stopContinuousMove();
        });

        // 버튼 이벤트
        document.getElementById('btnUp').addEventListener('click', () => {
            if (!this.gameWon) this.movePlayer(-1, 0);
        });
        document.getElementById('btnDown').addEventListener('click', () => {
            if (!this.gameWon) this.movePlayer(1, 0);
        });
        document.getElementById('btnLeft').addEventListener('click', () => {
            if (!this.gameWon) this.movePlayer(0, -1);
        });
        document.getElementById('btnRight').addEventListener('click', () => {
            if (!this.gameWon) this.movePlayer(0, 1);
        });

        // 옵션 토글
        document.getElementById('showPathToggle').addEventListener('change', (e) => {
            this.showPath = e.target.checked;
            this.draw();
        });

        // 리셋 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });

        // 새 미로 버튼
        document.getElementById('newMazeBtn').addEventListener('click', () => {
            this.generateRandomSize();
            this.generateMaze();
            this.draw();
        });
        
        // 크기 입력 변경 시
        document.getElementById('mazeSizeInput').addEventListener('change', (e) => {
            let size = parseInt(e.target.value) || 20;
            if (size < 15) size = 15;
            if (size > 35) size = 35;
            size = size % 2 === 0 ? size + 1 : size;
            e.target.value = size;
        });

        // 다시 하기 버튼
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.getElementById('winMessage').classList.add('hidden');
            this.generateRandomSize();
            this.generateMaze();
            this.draw();
        });
    }

    updateCurrentDirection() {
        // 눌려있는 키 중 가장 최근 키의 방향 찾기
        this.currentDirection = null;
        
        // 우선순위: ArrowUp > ArrowDown > ArrowLeft > ArrowRight
        const keyPriority = ['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'];
        
        for (const key of keyPriority) {
            if (this.keys[key]) {
                switch(key) {
                    case 'arrowup':
                    case 'w':
                        this.currentDirection = { dr: -1, dc: 0 };
                        return;
                    case 'arrowdown':
                    case 's':
                        this.currentDirection = { dr: 1, dc: 0 };
                        return;
                    case 'arrowleft':
                    case 'a':
                        this.currentDirection = { dr: 0, dc: -1 };
                        return;
                    case 'arrowright':
                    case 'd':
                        this.currentDirection = { dr: 0, dc: 1 };
                        return;
                }
            }
        }
    }
    
    startContinuousMove() {
        // 기존 인터벌 정리
        this.stopContinuousMove();
        
        if (!this.currentDirection) return;
        
        // 연속 이동 시작 (첫 이동 후 빠른 속도로)
        this.moveInterval = setTimeout(() => {
            this.moveInterval = setInterval(() => {
                if (!this.gameWon && this.currentDirection) {
                    this.movePlayer(this.currentDirection.dr, this.currentDirection.dc);
                } else {
                    this.stopContinuousMove();
                }
            }, this.fastMoveDelay);
        }, this.moveDelay);
    }
    
    stopContinuousMove() {
        if (this.moveInterval) {
            clearTimeout(this.moveInterval);
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
    }

    movePlayer(dr, dc) {
        const newRow = this.playerPos.row + dr;
        const newCol = this.playerPos.col + dc;

        // 경계 체크
        if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
            return;
        }

        // 벽 체크
        if (this.maze[newRow][newCol] === 1) {
            return;
        }

        // 이동
        this.playerPos.row = newRow;
        this.playerPos.col = newCol;
        this.moveCount++;
        document.getElementById('moveCount').textContent = this.moveCount;

        // 방문 기록
        if (this.showPath) {
            this.visited[newRow][newCol] = true;
            this.path.push({ row: newRow, col: newCol });
        }

        // 승리 체크
        if (newRow === this.endPos.row && newCol === this.endPos.col) {
            this.gameWon = true;
            document.getElementById('finalMoveCount').textContent = this.moveCount;
            document.getElementById('winMessage').classList.remove('hidden');
        }

        this.draw();
    }

    resetGame() {
        this.stopContinuousMove();
        this.keys = {};
        this.playerPos = { ...this.startPos };
        this.visited = [];
        for (let i = 0; i < this.rows; i++) {
            this.visited[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.visited[i][j] = false;
            }
        }
        this.path = [];
        this.moveCount = 0;
        this.gameWon = false;
        document.getElementById('moveCount').textContent = '0';
        document.getElementById('winMessage').classList.add('hidden');
        this.draw();
    }

    draw() {
        // 캔버스 클리어
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 미로 그리기
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const x = j * this.cellSize;
                const y = i * this.cellSize;

                if (this.maze[i][j] === 1) {
                    // 벽
                    this.ctx.fillStyle = '#34495e';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                } else {
                    // 길
                    this.ctx.fillStyle = '#ecf0f1';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

                    // 지나온 길 표시
                    if (this.showPath && this.visited[i][j]) {
                        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
                        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    }
                }
            }
        }

        // 시작점
        const startX = this.startPos.col * this.cellSize;
        const startY = this.startPos.row * this.cellSize;
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(startX, startY, this.cellSize, this.cellSize);
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${this.cellSize * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('S', startX + this.cellSize / 2, startY + this.cellSize / 2);

        // 끝점
        const endX = this.endPos.col * this.cellSize;
        const endY = this.endPos.row * this.cellSize;
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(endX, endY, this.cellSize, this.cellSize);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('E', endX + this.cellSize / 2, endY + this.cellSize / 2);

        // 플레이어
        const playerX = this.playerPos.col * this.cellSize;
        const playerY = this.playerPos.row * this.cellSize;
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.arc(
            playerX + this.cellSize / 2,
            playerY + this.cellSize / 2,
            this.cellSize * 0.35,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    new MazeGame();
});

