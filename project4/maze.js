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
        this.showPath = false;
        this.gameWon = false;
        this.gameOver = false;
        this.horrorMode = false;
        this.viewMode = '2D'; // '2D' or '3D'
        this.wallTexture = 'default'; // 벽면 텍스처 스타일
        this.wallTexturePatterns = {}; // 2D 패턴 캐시
        this.wallTexture3D = {}; // 3D 텍스처 캐시
        this.textureImages = {}; // 로드된 이미지 캐시
        
        // 괴물 관련 변수
        this.monster = {
            row: 0,
            col: 0,
            direction: null, // 이동 방향
            moveTimer: null,
            moveInterval: 800, // 괴물 이동 간격 (ms)
            speed: 1 // 이동 속도 (칸 단위)
        };
        this.monster3D = null; // 3D 괴물 객체
        
        // 키보드 연속 입력을 위한 변수
        this.keys = {};
        this.currentDirection = null;
        this.moveInterval = null;
        this.moveDelay = 150; // 초기 이동 지연 시간 (ms)
        this.fastMoveDelay = 50; // 연속 입력 시 빠른 이동 지연 시간 (ms)

        // 3D 관련 변수
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.walls = [];
        this.floor = null;
        this.ceiling = null;
        this.startMarker = null;
        this.endMarker = null;
        this.player3D = null;
        this.pathMarkers = []; // 지나온 길 마커들
        this.isPointerLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.moveSpeed = 0.1;
        this.rotationSpeed = 0.002;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.lastLogTime = 0;
        this.lastCollisionLog = 0;

        this.init();
    }

    init() {
        this.generateRandomSize();
        this.generateMaze();
        this.setupEventListeners();
        this.setup3D();
        this.preloadTextures();
        this.draw();
    }

    // 텍스처 이미지 미리 로드 (2D용만, project1 방식 참고)
    // 3D는 TextureLoader를 사용하므로 여기서는 2D Canvas Pattern용만 로드
    preloadTextures() {
        const textureFiles = {
            'wood': 'textures/wood.png',
            'vine': 'textures/vine.png',
            'brick': 'textures/brick.png',
        };

        Object.keys(textureFiles).forEach(textureName => {
            const img = new Image();
            // project1처럼 crossOrigin 설정 없이 직접 로드 (2D Canvas Pattern용)
            img.onload = () => {
                this.textureImages[textureName] = img;
                // 이미지 로드 후 2D 모드에서만 다시 그리기
                // 3D는 TextureLoader를 사용하므로 여기서 처리하지 않음
                if (this.viewMode === '2D' && this.wallTexture === textureName) {
                    this.wallTexturePatterns[textureName] = null; // 캐시 초기화
                    this.draw();
                }
            };
            img.onerror = () => {
                // 이미지 로드 실패 시 기본 패턴 사용 (조용히 처리)
            };
            // src 설정은 onload/onerror 등록 후에 해야 함
            img.src = textureFiles[textureName];
        });
    }

    generateRandomSize() {
        // 입력된 크기 가져오기 또는 랜덤 생성
        const sizeInput = document.getElementById('mazeSizeInput');
        let size = parseInt(sizeInput.value) || 30;
        
        // 범위 체크 및 홀수 보정
        if (size < 15) size = 15;
        if (size > 50) size = 50;
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

        // Recursive Division + Randomized Prim's 혼합 알고리즘
        // 더 복잡하고 어려운 미로 생성
        
        // 1단계: 모든 홀수 좌표를 길로 초기화
        for (let i = 1; i < this.rows - 1; i += 2) {
            for (let j = 1; j < this.cols - 1; j += 2) {
                this.maze[i][j] = 0;
            }
        }
        
        // 2단계: Randomized Prim's Algorithm으로 복잡한 경로 생성
        const walls = [];
        const startRow = 1;
        const startCol = 1;
        
        // 시작점 주변의 벽을 추가
        const addWalls = (row, col) => {
            const directions = [
                [0, 2], [2, 0], [0, -2], [-2, 0]
            ];
            
            for (const [dr, dc] of directions) {
                const wallRow = row + dr / 2;
                const wallCol = col + dc / 2;
                const nextRow = row + dr;
                const nextCol = col + dc;
                
                if (nextRow > 0 && nextRow < this.rows - 1 &&
                    nextCol > 0 && nextCol < this.cols - 1) {
                    walls.push([wallRow, wallCol, nextRow, nextCol]);
                }
            }
        };
        
        addWalls(startRow, startCol);
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);
        
        // Prim's Algorithm: 가중치 기반으로 벽 제거
        while (walls.length > 0) {
            // 랜덤하게 벽 선택 (가중치 적용으로 더 복잡한 구조)
            const randomIndex = Math.floor(Math.pow(Math.random(), 1.5) * walls.length);
            const [wallRow, wallCol, nextRow, nextCol] = walls[randomIndex];
            walls.splice(randomIndex, 1);
            
            if (!visited.has(`${nextRow},${nextCol}`) && 
                this.maze[nextRow][nextCol] === 0) {
                // 벽 제거
                this.maze[wallRow][wallCol] = 0;
                visited.add(`${nextRow},${nextCol}`);
                addWalls(nextRow, nextCol);
            }
        }
        
        // 3단계: Recursive Division으로 추가 복잡성 부여
        const recursiveDivision = (minRow, maxRow, minCol, maxCol, depth = 0) => {
            const width = maxCol - minCol;
            const height = maxRow - minRow;
            
            // 분할할 공간이 충분히 큰 경우에만 실행
            if (width < 4 || height < 4 || depth > 3) return;
            
            // 수평/수직 분할 결정 (더 긴 쪽을 분할)
            const horizontal = height > width;
            
            if (horizontal) {
                // 수평 분할
                const possibleRows = [];
                for (let row = minRow + 2; row < maxRow - 1; row += 2) {
                    possibleRows.push(row);
                }
                if (possibleRows.length === 0) return;
                
                const wallRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];
                
                // 벽 생성 (일부만)
                for (let col = minCol + 1; col < maxCol; col++) {
                    if (Math.random() < 0.7) { // 70% 확률로 벽 생성
                        this.maze[wallRow][col] = 1;
                    }
                }
                
                // 통로 생성 (최소 1개, 최대 3개)
                const numPassages = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numPassages; i++) {
                    const passageCol = minCol + 1 + Math.floor(Math.random() * (maxCol - minCol - 2));
                    if (passageCol % 2 === 1) {
                        this.maze[wallRow][passageCol] = 0;
                    }
                }
                
                // 재귀적으로 분할
                if (Math.random() < 0.6) { // 60% 확률로 계속 분할
                    recursiveDivision(minRow, wallRow, minCol, maxCol, depth + 1);
                    recursiveDivision(wallRow, maxRow, minCol, maxCol, depth + 1);
                }
            } else {
                // 수직 분할
                const possibleCols = [];
                for (let col = minCol + 2; col < maxCol - 1; col += 2) {
                    possibleCols.push(col);
                }
                if (possibleCols.length === 0) return;
                
                const wallCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];
                
                // 벽 생성 (일부만)
                for (let row = minRow + 1; row < maxRow; row++) {
                    if (Math.random() < 0.7) { // 70% 확률로 벽 생성
                        this.maze[row][wallCol] = 1;
                    }
                }
                
                // 통로 생성 (최소 1개, 최대 3개)
                const numPassages = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numPassages; i++) {
                    const passageRow = minRow + 1 + Math.floor(Math.random() * (maxRow - minRow - 2));
                    if (passageRow % 2 === 1) {
                        this.maze[passageRow][wallCol] = 0;
                    }
                }
                
                // 재귀적으로 분할
                if (Math.random() < 0.6) { // 60% 확률로 계속 분할
                    recursiveDivision(minRow, maxRow, minCol, wallCol, depth + 1);
                    recursiveDivision(minRow, maxRow, wallCol, maxCol, depth + 1);
                }
            }
        };
        
        // 미로 크기가 충분히 크면 Recursive Division 적용
        if (this.rows >= 21 && this.cols >= 21) {
            recursiveDivision(1, this.rows - 1, 1, this.cols - 1);
        }
        
        // 4단계: 추가 루프 생성으로 복잡도 증가
        const loopCount = Math.floor((this.rows * this.cols) / 150); // 미로 크기에 비례
        
        for (let i = 0; i < loopCount; i++) {
            const row = Math.floor(Math.random() * (this.rows - 2)) + 1;
            const col = Math.floor(Math.random() * (this.cols - 2)) + 1;
            
            if (this.maze[row][col] === 1) {
                // 주변에 2개 이상의 길이 있는 경우에만 벽 제거
                let pathCount = 0;
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                
                for (const [dr, dc] of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    if (newRow >= 0 && newRow < this.rows &&
                        newCol >= 0 && newCol < this.cols &&
                        this.maze[newRow][newCol] === 0) {
                        pathCount++;
                    }
                }
                
                if (pathCount >= 2 && Math.random() < 0.5) {
                    this.maze[row][col] = 0;
                }
            }
        }
        
        // 5단계: 막다른 길 확장 (더 긴 잘못된 경로 생성)
        const deadEndExtensions = Math.floor((this.rows * this.cols) / 200);
        
        for (let i = 0; i < deadEndExtensions; i++) {
            // 막다른 길 찾기
            for (let row = 1; row < this.rows - 1; row++) {
                for (let col = 1; col < this.cols - 1; col++) {
                    if (this.maze[row][col] === 0) {
                        let wallCount = 0;
                        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                        
                        for (const [dr, dc] of directions) {
                            if (this.maze[row + dr][col + dc] === 1) {
                                wallCount++;
                            }
                        }
                        
                        // 막다른 길(3면이 벽)에서 랜덤하게 확장
                        if (wallCount === 3 && Math.random() < 0.3) {
                            for (const [dr, dc] of directions) {
                                const newRow = row + dr * 2;
                                const newCol = col + dc * 2;
                                const midRow = row + dr;
                                const midCol = col + dc;
                                
                                if (newRow > 0 && newRow < this.rows - 1 &&
                                    newCol > 0 && newCol < this.cols - 1 &&
                                    this.maze[newRow][newCol] === 1 &&
                                    this.maze[midRow][midCol] === 1) {
                                    this.maze[midRow][midCol] = 0;
                                    this.maze[newRow][newCol] = 0;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 시작점과 끝점 설정
        this.startPos = { row: 1, col: 1 };
        this.endPos = { row: this.rows - 2, col: this.cols - 2 };
        this.playerPos = { ...this.startPos };
        
        // 시작점과 끝점이 길인지 확인하고, 아니면 길로 만들기
        this.maze[this.startPos.row][this.startPos.col] = 0;
        this.maze[this.endPos.row][this.endPos.col] = 0;
        
        // 시작점에서 끝점까지 경로가 있는지 확인 (BFS)
        if (!this.hasPath(this.startPos.row, this.startPos.col, this.endPos.row, this.endPos.col)) {
            // 경로가 없으면 강제로 경로 생성
            this.createPath(this.startPos.row, this.startPos.col, this.endPos.row, this.endPos.col);
        }
        
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
        this.gameOver = false;
        document.getElementById('moveCount').textContent = '0';
        document.getElementById('winMessage').classList.add('hidden');
        document.getElementById('gameOverMessage').classList.add('hidden');
        
        // 공포 모드가 활성화되어 있으면 괴물 초기화
        if (this.horrorMode && this.monster) {
            this.initializeMonster();
            this.startMonsterMovement();
        } else if (this.monster) {
            this.stopMonsterMovement();
            this.removeMonster();
        }
        
        // 3D 미로도 업데이트
        if (this.viewMode === '3D' && this.scene) {
            this.create3DMaze(true); // 새 미로이므로 위치 리셋
        }
    }

    // BFS로 시작점에서 끝점까지 경로가 있는지 확인
    hasPath(startRow, startCol, endRow, endCol) {
        if (this.maze[startRow][startCol] === 1 || this.maze[endRow][endCol] === 1) {
            return false;
        }
        
        const queue = [[startRow, startCol]];
        const visited = new Set();
        visited.add(`${startRow},${startCol}`);
        
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            if (row === endRow && col === endCol) {
                return true;
            }
            
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                const key = `${newRow},${newCol}`;
                
                if (newRow >= 0 && newRow < this.rows &&
                    newCol >= 0 && newCol < this.cols &&
                    !visited.has(key) &&
                    this.maze[newRow][newCol] === 0) {
                    visited.add(key);
                    queue.push([newRow, newCol]);
                }
            }
        }
        
        return false;
    }

    // 시작점에서 끝점까지 경로 강제 생성
    createPath(startRow, startCol, endRow, endCol) {
        // A* 알고리즘을 사용하여 최단 경로 생성
        const openSet = [{ row: startRow, col: startCol, g: 0, h: 0, f: 0 }];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const getKey = (row, col) => `${row},${col}`;
        const heuristic = (row1, col1, row2, col2) => Math.abs(row1 - row2) + Math.abs(col1 - col2);
        
        gScore.set(getKey(startRow, startCol), 0);
        fScore.set(getKey(startRow, startCol), heuristic(startRow, startCol, endRow, endCol));
        
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        while (openSet.length > 0) {
            // f 점수가 가장 낮은 노드 선택
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const currentKey = getKey(current.row, current.col);
            
            if (current.row === endRow && current.col === endCol) {
                // 경로 재구성
                const path = [];
                let node = current;
                while (node) {
                    path.push(node);
                    const nodeKey = getKey(node.row, node.col);
                    node = cameFrom.get(nodeKey);
                }
                
                // 경로를 따라 벽 제거
                for (const node of path) {
                    this.maze[node.row][node.col] = 0;
                    // 주변 벽도 일부 제거하여 더 넓은 경로 생성
                    for (const [dr, dc] of directions) {
                        const newRow = node.row + dr;
                        const newCol = node.col + dc;
                        if (newRow > 0 && newRow < this.rows - 1 &&
                            newCol > 0 && newCol < this.cols - 1 &&
                            Math.random() < 0.3) { // 30% 확률로 주변 벽도 제거
                            this.maze[newRow][newCol] = 0;
                        }
                    }
                }
                return;
            }
            
            for (const [dr, dc] of directions) {
                const neighborRow = current.row + dr;
                const neighborCol = current.col + dc;
                const neighborKey = getKey(neighborRow, neighborCol);
                
                if (neighborRow < 0 || neighborRow >= this.rows ||
                    neighborCol < 0 || neighborCol >= this.cols) {
                    continue;
                }
                
                // 벽이면 제거 비용이 더 높음
                const tentativeG = gScore.get(currentKey) + (this.maze[neighborRow][neighborCol] === 1 ? 10 : 1);
                
                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    const h = heuristic(neighborRow, neighborCol, endRow, endCol);
                    const f = tentativeG + h;
                    fScore.set(neighborKey, f);
                    
                    if (!openSet.some(n => n.row === neighborRow && n.col === neighborCol)) {
                        openSet.push({ row: neighborRow, col: neighborCol, g: tentativeG, h: h, f: f });
                    }
                }
            }
        }
        
        // A* 실패 시 단순 경로 생성
        let row = startRow;
        let col = startCol;
        
        // 먼저 행을 맞춤
        while (row !== endRow) {
            this.maze[row][col] = 0;
            row += row < endRow ? 1 : -1;
            this.maze[row][col] = 0;
        }
        
        // 그 다음 열을 맞춤
        while (col !== endCol) {
            this.maze[row][col] = 0;
            col += col < endCol ? 1 : -1;
            this.maze[row][col] = 0;
        }
    }

    setupEventListeners() {
        // 키보드 이벤트 - 키 누름
        document.addEventListener('keydown', (e) => {
            if (this.gameWon || this.gameOver) return;
            
            const key = e.key.toLowerCase();
            const isMovementKey = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
            
            // 이동 키 처리
            if (isMovementKey) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.keys[key]) {
                    this.keys[key] = true;
                }
                
                // 2D 모드에서만 즉시 이동 처리
                if (this.viewMode === '2D') {
                    let direction = null;
                    switch(e.key) {
                        case 'ArrowUp':
                        case 'w':
                        case 'W':
                            direction = { dr: -1, dc: 0 };
                            break;
                        case 'ArrowDown':
                        case 's':
                        case 'S':
                            direction = { dr: 1, dc: 0 };
                            break;
                        case 'ArrowLeft':
                        case 'a':
                        case 'A':
                            direction = { dr: 0, dc: -1 };
                            break;
                        case 'ArrowRight':
                        case 'd':
                        case 'D':
                            direction = { dr: 0, dc: 1 };
                            break;
                    }
                    
                    if (direction) {
                        this.currentDirection = direction;
                        this.movePlayer(direction.dr, direction.dc);
                        this.startContinuousMove();
                    }
                }
                // 3D 모드는 애니메이션 루프에서 자동 처리됨
                return;
            }
            
            // ESC 키로 포인터 잠금 해제
            if (e.key === 'Escape' && this.isPointerLocked) {
                try {
                    document.exitPointerLock = document.exitPointerLock || 
                        document.mozExitPointerLock || 
                        document.webkitExitPointerLock;
                    if (document.exitPointerLock) {
                        document.exitPointerLock();
                    }
                } catch (err) {
                    // 포인터 잠금 해제 실패는 무시
                }
                return;
            }
            
            // 단축키 처리
            // 입력 필드에 포커스가 있을 때는 단축키 무시
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                return;
            }
            
            switch(key) {
                case '2':
                    // 2D 보기
                    e.preventDefault();
                    if (this.viewMode !== '2D') {
                        document.getElementById('view2D').checked = true;
                        this.switchTo2D();
                    }
                    break;
                case '3':
                    // 3D 보기
                    e.preventDefault();
                    if (this.viewMode !== '3D') {
                        document.getElementById('view3D').checked = true;
                        this.switchTo3D();
                    }
                    break;
                case 'h':
                    // 지나온 길 표시 토글
                    e.preventDefault();
                    const showPathToggle = document.getElementById('showPathToggle');
                    showPathToggle.checked = !showPathToggle.checked;
                    this.showPath = showPathToggle.checked;
                    if (this.viewMode === '2D') {
                        this.draw();
                    } else if (this.viewMode === '3D') {
                        this.update3DPathMarkers();
                    }
                    break;
                case 'f':
                    // 공포 모드 토글
                    e.preventDefault();
                    const horrorModeToggle = document.getElementById('horrorModeToggle');
                    const wasEnabled = this.horrorMode;
                    horrorModeToggle.checked = !horrorModeToggle.checked;
                    this.horrorMode = horrorModeToggle.checked;
                    
                    if (this.horrorMode && !wasEnabled) {
                        // 공포 모드 활성화 시 게임 재시작
                        this.resetGame();
                        this.initializeMonster();
                        this.startMonsterMovement();
                    } else if (!this.horrorMode && wasEnabled) {
                        // 공포 모드 비활성화 시 괴물 제거
                        this.stopMonsterMovement();
                        this.removeMonster();
                    }
                    break;
                case 'r':
                    // 미로 리셋
                    e.preventDefault();
                    this.resetGame();
                    break;
                case 'n':
                    // 새 미로
                    e.preventDefault();
                    this.generateRandomSize();
                    this.generateMaze();
                    if (this.viewMode === '2D') {
                        this.draw();
                    } else {
                        this.create3DMaze(true); // 새 미로이므로 위치 리셋
                    }
                    break;
            }
        });
        
        // 키보드 이벤트 - 키 떼기
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys[key]) {
                this.keys[key] = false;
                
                // 2D 모드일 때만 방향 업데이트 및 연속 이동 처리
                if (this.viewMode === '2D') {
                    this.updateCurrentDirection();
                    
                    if (!this.currentDirection) {
                        this.stopContinuousMove();
                    }
                }
            }
        });
        
        // 포커스 잃을 때 키 상태 초기화
        window.addEventListener('blur', () => {
            this.keys = {};
            this.stopContinuousMove();
        });

        // 버튼 이벤트
        const setupButton = (btnId, handler) => {
            const btn = document.getElementById(btnId);
            // 클릭 이벤트
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
            // 터치 이벤트 (모바일 확대 방지)
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handler();
            });
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
            });
        };
        
        setupButton('btnUp', () => {
            if (!this.gameWon) this.movePlayer(-1, 0);
        });
        setupButton('btnDown', () => {
            if (!this.gameWon) this.movePlayer(1, 0);
        });
        setupButton('btnLeft', () => {
            if (!this.gameWon) this.movePlayer(0, -1);
        });
        setupButton('btnRight', () => {
            if (!this.gameWon) this.movePlayer(0, 1);
        });

        // 옵션 토글
        document.getElementById('showPathToggle').addEventListener('change', (e) => {
            this.showPath = e.target.checked;
            if (this.viewMode === '2D') {
                this.draw();
            } else if (this.viewMode === '3D') {
                this.update3DPathMarkers();
            }
        });

        // 공포 모드 토글
        document.getElementById('horrorModeToggle').addEventListener('change', (e) => {
            const wasEnabled = this.horrorMode;
            this.horrorMode = e.target.checked;
            
            if (this.horrorMode && !wasEnabled) {
                // 공포 모드 활성화 시 게임 재시작
                this.resetGame();
                this.initializeMonster();
                this.startMonsterMovement();
            } else if (!this.horrorMode && wasEnabled) {
                // 공포 모드 비활성화 시 괴물 제거
                this.stopMonsterMovement();
                this.removeMonster();
            }
        });

        // 리셋 버튼
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });

        // 새 미로 버튼
        document.getElementById('newMazeBtn').addEventListener('click', () => {
            this.generateRandomSize();
            this.generateMaze();
            if (this.viewMode === '2D') {
                this.draw();
            } else {
                this.create3DMaze(true); // 새 미로이므로 위치 리셋
            }
        });
        
        // 크기 입력 변경 시
        document.getElementById('mazeSizeInput').addEventListener('change', (e) => {
            let size = parseInt(e.target.value) || 30;
            if (size < 15) size = 15;
            if (size > 50) size = 50;
            size = size % 2 === 0 ? size + 1 : size;
            e.target.value = size;
        });

        // 2D/3D 전환
        document.getElementById('view2D').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.switchTo2D();
            }
        });

        document.getElementById('view3D').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.switchTo3D();
            }
        });

        // 다시 하기 버튼
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.getElementById('winMessage').classList.add('hidden');
            this.generateRandomSize();
            this.generateMaze();
            if (this.viewMode === '2D') {
                this.draw();
            } else {
                this.create3DMaze(true); // 새 미로이므로 위치 리셋
            }
        });

        // 게임 오버 후 다시 하기 버튼
        document.getElementById('restartAfterGameOverBtn').addEventListener('click', () => {
            document.getElementById('gameOverMessage').classList.add('hidden');
            this.resetGame();
            if (this.horrorMode) {
                this.initializeMonster();
                this.startMonsterMovement();
            }
        });

        // 벽면 텍스처 선택
        document.getElementById('wallTextureSelect').addEventListener('change', (e) => {
            this.wallTexture = e.target.value;
            this.wallTexturePatterns = {}; // 패턴 캐시 초기화
            this.wallTexture3D = {}; // 3D 텍스처 캐시 초기화
            
            if (this.viewMode === '2D') {
                this.draw();
            } else if (this.viewMode === '3D' && this.scene) {
                this.create3DMaze(false); // 현재 위치 유지하며 미로 재생성
            }
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

        // 방문 기록 (항상 기록, 표시 여부와 무관)
        this.visited[newRow][newCol] = true;
        this.path.push({ row: newRow, col: newCol });

        // 승리 체크
        if (newRow === this.endPos.row && newCol === this.endPos.col) {
            this.gameWon = true;
            if (this.horrorMode) {
                this.stopMonsterMovement();
            }
            document.getElementById('finalMoveCount').textContent = this.moveCount;
            document.getElementById('winMessage').classList.remove('hidden');
        }

        // 괴물 충돌 체크
        if (this.horrorMode && this.monster) {
            this.checkMonsterCollision();
        }

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
                    // 벽 - 텍스처 적용
                    const pattern = this.getWallTexturePattern2D();
                    this.ctx.fillStyle = pattern;
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

        // 괴물 (공포 모드일 때만)
        if (this.horrorMode && this.monster) {
            const monsterX = this.monster.col * this.cellSize;
            const monsterY = this.monster.row * this.cellSize;
            this.ctx.fillStyle = '#8b0000'; // 어두운 빨간색
            this.ctx.beginPath();
            this.ctx.arc(
                monsterX + this.cellSize / 2,
                monsterY + this.cellSize / 2,
                this.cellSize * 0.4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            // 괴물 눈 표시
            this.ctx.fillStyle = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(
                monsterX + this.cellSize / 2 - this.cellSize * 0.15,
                monsterY + this.cellSize / 2 - this.cellSize * 0.1,
                this.cellSize * 0.08,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(
                monsterX + this.cellSize / 2 + this.cellSize * 0.15,
                monsterY + this.cellSize / 2 - this.cellSize * 0.1,
                this.cellSize * 0.08,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    setup3D() {
        const container = document.getElementById('maze3D');
        if (!container) return;

        // 씬 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경
        this.scene.fog = new THREE.Fog(0x87ceeb, 0, 100);

        // 카메라 생성
        const updateSize = () => {
            const width = container.clientWidth || 800;
            const height = container.clientHeight || 600;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        };

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 1.6, 0); // 1인칭 시점 높이

        // 렌더러 생성
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 리사이즈 이벤트
        window.addEventListener('resize', updateSize);

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 남쪽에서 오는 햇빛 (해 높이를 높게 설정하여 그림자가 짧게)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        // 남쪽은 Z축 양의 방향, 해를 높게 설정 (y값을 크게)
        directionalLight.position.set(0, 30, 20); // 남쪽에서 높은 위치
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        // 그림자 범위 설정 (짧은 그림자를 위해 범위 조정)
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        this.scene.add(directionalLight);

        // 3D 컨트롤 이벤트
        this.setup3DControls();
    }

    setup3DControls() {
        const container = document.getElementById('maze3D');
        if (!container) return;

        // 마우스 잠금
        container.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                try {
                    container.requestPointerLock = container.requestPointerLock || 
                        container.mozRequestPointerLock || 
                        container.webkitRequestPointerLock;
                    if (container.requestPointerLock) {
                        container.requestPointerLock();
                    }
                } catch (err) {
                    // 포인터 잠금 실패해도 게임은 계속 진행
                    console.log('Pointer lock not available, continuing without it');
                }
            }
        });

        // Pointer Lock API 이벤트
        const pointerLockChange = () => {
            this.isPointerLocked = document.pointerLockElement === container ||
                document.mozPointerLockElement === container ||
                document.webkitPointerLockElement === container;
            const info = document.getElementById('pointerLockInfo');
            if (info) {
                if (this.isPointerLocked) {
                    info.classList.add('hidden');
                } else {
                    // 3D 모드일 때만 메시지 표시
                    if (this.viewMode === '3D') {
                        info.classList.remove('hidden');
                    } else {
                        info.classList.add('hidden');
                    }
                }
            }
        };

        document.addEventListener('pointerlockchange', pointerLockChange);
        document.addEventListener('mozpointerlockchange', pointerLockChange);
        document.addEventListener('webkitpointerlockchange', pointerLockChange);

        document.addEventListener('pointerlockerror', () => {
            // 포인터 잠금 실패는 무시 (선택적 기능)
        });
        document.addEventListener('mozpointerlockerror', () => {});
        document.addEventListener('webkitpointerlockerror', () => {});

        // 마우스 이동으로 시점 조작 (포인터 잠금이 있을 때만)
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked || this.viewMode !== '3D' || !this.camera) return;

            const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

            if (movementX !== 0 || movementY !== 0) {
                // Euler 각도 업데이트
                this.euler.setFromQuaternion(this.camera.quaternion);
                this.euler.y -= movementX * this.rotationSpeed; // 좌우 회전
                this.euler.x -= movementY * this.rotationSpeed; // 상하 회전
                
                // 상하 시점 제한 (-90도 ~ +90도)
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
                
                // 카메라 회전 적용
                this.camera.quaternion.setFromEuler(this.euler);
            }
        });

        // 3D 이동 (WASD) - 클래스 메서드로 변경
        this.move3D = () => {
            if (this.viewMode !== '3D' || this.gameWon || !this.camera) {
                return;
            }

            // 키 입력 확인
            const forward = this.keys['w'] || this.keys['arrowup'];
            const backward = this.keys['s'] || this.keys['arrowdown'];
            const left = this.keys['a'] || this.keys['arrowleft'];
            const right = this.keys['d'] || this.keys['arrowright'];

            // 이동이 있을 때만 처리
            if (!forward && !backward && !left && !right) {
                return;
            }

            // 카메라의 방향 벡터 가져오기
            const direction = new THREE.Vector3();
            const right_vec = new THREE.Vector3();
            
            // 카메라가 바라보는 방향 벡터 (전방)
            this.camera.getWorldDirection(direction);
            
            // 수평 이동만 하도록 Y축 제거하고 정규화
            direction.y = 0;
            direction.normalize();
            
            // 오른쪽 방향 벡터 계산 (전방 벡터를 Y축 기준으로 90도 회전)
            right_vec.crossVectors(direction, new THREE.Vector3(0, 1, 0));
            right_vec.normalize();
            
            // 이동 벡터 계산
            let moveX = 0;
            let moveZ = 0;
            
            // W: 앞으로
            if (forward) {
                moveX += direction.x * this.moveSpeed;
                moveZ += direction.z * this.moveSpeed;
            }
            
            // S: 뒤로
            if (backward) {
                moveX -= direction.x * this.moveSpeed;
                moveZ -= direction.z * this.moveSpeed;
            }
            
            // A: 왼쪽으로
            if (left) {
                moveX -= right_vec.x * this.moveSpeed;
                moveZ -= right_vec.z * this.moveSpeed;
            }
            
            // D: 오른쪽으로
            if (right) {
                moveX += right_vec.x * this.moveSpeed;
                moveZ += right_vec.z * this.moveSpeed;
            }

            const currentX = this.camera.position.x;
            const currentZ = this.camera.position.z;
            const newX = currentX + moveX;
            const newZ = currentZ + moveZ;

            // 벽 미끄러짐 로직: X축과 Z축을 분리해서 체크
            let finalX = currentX;
            let finalZ = currentZ;

            // 전체 이동이 가능하면 그대로 이동
            if (this.canMove3D(newX, newZ)) {
                finalX = newX;
                finalZ = newZ;
            } else {
                // X축만 이동 시도
                if (this.canMove3D(newX, currentZ)) {
                    finalX = newX;
                    finalZ = currentZ;
                }
                // Z축만 이동 시도
                else if (this.canMove3D(currentX, newZ)) {
                    finalX = currentX;
                    finalZ = newZ;
                }
                // 둘 다 막혔으면 이동하지 않음
            }

            // 위치가 변경되었으면 적용
            if (finalX !== currentX || finalZ !== currentZ) {
                this.camera.position.x = finalX;
                this.camera.position.z = finalZ;
                this.updatePlayer3DPos();
            }
        };

        // 애니메이션 루프
        const animate = () => {
            requestAnimationFrame(animate);
            if (this.viewMode === '3D' && this.scene && this.camera && this.renderer) {
                this.move3D();
                this.updateCompass();
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }

    canMove3D(x, z) {
        // 미로 좌표로 변환 (미로는 중앙에 배치)
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;

        // 월드 좌표를 미로 좌표로 변환
        const col = Math.round(x / cellSize + offset);
        const row = Math.round(z / cellSize + offset);

        // 경계 체크
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            console.log('Out of bounds:', { row, col, rows: this.rows, cols: this.cols });
            return false;
        }

        // 목표 위치가 벽인지 확인
        if (this.maze[row][col] === 1) {
            console.log('Wall at target:', { row, col, mazeValue: this.maze[row][col] });
            return false;
        }

        // 플레이어 주변의 4방향 체크 (대각선 포함)
        const playerRadius = 0.3; // 플레이어 반경을 조금 크게
        const checks = [
            { dx: playerRadius, dz: 0 },      // 오른쪽
            { dx: -playerRadius, dz: 0 },     // 왼쪽
            { dx: 0, dz: playerRadius },      // 아래
            { dx: 0, dz: -playerRadius },     // 위
            { dx: playerRadius, dz: playerRadius },   // 오른쪽 아래
            { dx: -playerRadius, dz: playerRadius },  // 왼쪽 아래
            { dx: playerRadius, dz: -playerRadius },  // 오른쪽 위
            { dx: -playerRadius, dz: -playerRadius }  // 왼쪽 위
        ];

        for (const check of checks) {
            const checkX = x + check.dx;
            const checkZ = z + check.dz;
            const checkCol = Math.round(checkX / cellSize + offset);
            const checkRow = Math.round(checkZ / cellSize + offset);

            if (checkRow >= 0 && checkRow < this.rows && checkCol >= 0 && checkCol < this.cols) {
                if (this.maze[checkRow][checkCol] === 1) {
                    console.log('Wall detected at offset:', { checkRow, checkCol, dx: check.dx, dz: check.dz });
                    return false;
                }
            }
        }

        return true;
    }

    create3DMaze(resetPosition = true) {
        if (!this.scene) return;

        // 기존 벽 제거
        this.walls.forEach(wall => this.scene.remove(wall));
        this.walls = [];
        if (this.floor) this.scene.remove(this.floor);
        if (this.ceiling) this.scene.remove(this.ceiling);
        if (this.startMarker) this.scene.remove(this.startMarker);
        if (this.endMarker) this.scene.remove(this.endMarker);
        // 지나온 길 마커 제거
        this.pathMarkers.forEach(marker => this.scene.remove(marker));
        this.pathMarkers = [];

        const cellSize = 1;
        const wallHeight = 2;
        const offset = (this.cols - 1) / 2;

        // 바닥 생성
        const floorGeometry = new THREE.PlaneGeometry(this.cols * cellSize, this.rows * cellSize);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.set(0, 0, 0);
        this.floor.receiveShadow = true;
        this.scene.add(this.floor);

        // 천장 제거 (사용자 요청)
        this.ceiling = null;

        // 벽 생성 - 텍스처 적용
        const wallMaterial = this.getWallTextureMaterial3D();
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.maze[i][j] === 1) {
                    const wallGeometry = new THREE.BoxGeometry(cellSize, wallHeight, cellSize);
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(
                        (j - offset) * cellSize,
                        wallHeight / 2,
                        (i - offset) * cellSize
                    );
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    this.scene.add(wall);
                    this.walls.push(wall);
                }
            }
        }

        // 시작점 마커
        const startGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const startMaterial = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        this.startMarker = new THREE.Mesh(startGeometry, startMaterial);
        this.startMarker.position.set(
            (this.startPos.col - offset) * cellSize,
            0.05,
            (this.startPos.row - offset) * cellSize
        );
        this.scene.add(this.startMarker);

        // 괴물 제거 (재생성 전)
        if (this.monster3D) {
            this.scene.remove(this.monster3D);
            this.monster3D = null;
        }

        // 끝점 마커
        const endGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const endMaterial = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        this.endMarker = new THREE.Mesh(endGeometry, endMaterial);
        this.endMarker.position.set(
            (this.endPos.col - offset) * cellSize,
            0.05,
            (this.endPos.row - offset) * cellSize
        );
        this.scene.add(this.endMarker);

        // 플레이어 위치 초기화 (resetPosition이 true일 때만)
        if (resetPosition) {
            const startX = (this.startPos.col - offset) * cellSize;
            const startZ = (this.startPos.row - offset) * cellSize;
            this.camera.position.set(startX, 1.6, startZ);
            
            // 카메라를 정면(북쪽)으로 향하도록 설정
            this.camera.rotation.set(0, 0, 0);
            this.euler.set(0, 0, 0);
            
            console.log('=== Camera Initialization ===');
            console.log('Start position (grid):', this.startPos);
            console.log('Camera position (world):', { x: startX, y: 1.6, z: startZ });
            console.log('Camera rotation:', { x: 0, y: 0, z: 0 });
            console.log('Maze value at start:', this.maze[this.startPos.row][this.startPos.col]);
            console.log('===========================');
        } else {
            // 현재 플레이어 위치를 3D 좌표로 변환
            const currentX = (this.playerPos.col - offset) * cellSize;
            const currentZ = (this.playerPos.row - offset) * cellSize;
            this.camera.position.set(currentX, 1.6, currentZ);
            
            console.log('=== Camera Position Restored ===');
            console.log('Current position (grid):', this.playerPos);
            console.log('Camera position (world):', { x: currentX, y: 1.6, z: currentZ });
            console.log('===========================');
        }
        
        // 지나온 길 마커 생성
        this.update3DPathMarkers();

        // 공포 모드일 때 괴물 생성
        if (this.horrorMode) {
            this.createMonster3D();
        }
    }
    
    add3DPathMarker(row, col) {
        // showPath가 false면 마커 추가하지 않음
        if (!this.showPath) return;
        
        // 시작점과 끝점은 제외
        if ((row === this.startPos.row && col === this.startPos.col) ||
            (row === this.endPos.row && col === this.endPos.col)) {
            return;
        }
        
        // 이미 마커가 있는지 확인
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;
        const x = (col - offset) * cellSize;
        const z = (row - offset) * cellSize;
        
        const exists = this.pathMarkers.some(marker => 
            Math.abs(marker.position.x - x) < 0.1 && 
            Math.abs(marker.position.z - z) < 0.1
        );
        
        if (exists) return;
        
        const pathGeometry = new THREE.PlaneGeometry(cellSize * 0.8, cellSize * 0.8);
        const pathMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3498db,
            transparent: true,
            opacity: 0.4
        });
        const pathMarker = new THREE.Mesh(pathGeometry, pathMaterial);
        pathMarker.rotation.x = -Math.PI / 2;
        pathMarker.position.set(x, 0.01, z);
        this.scene.add(pathMarker);
        this.pathMarkers.push(pathMarker);
    }
    
    update3DPathMarkers() {
        if (!this.scene || !this.showPath) {
            // 옵션이 꺼져있으면 모든 마커 제거
            this.pathMarkers.forEach(marker => this.scene.remove(marker));
            this.pathMarkers = [];
            return;
        }
        
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;
        
        // 기존 마커 제거
        this.pathMarkers.forEach(marker => this.scene.remove(marker));
        this.pathMarkers = [];
        
        // visited된 위치에 마커 추가
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.visited[i] && this.visited[i][j] && this.maze[i][j] === 0) {
                    // 시작점과 끝점은 제외
                    if ((i === this.startPos.row && j === this.startPos.col) ||
                        (i === this.endPos.row && j === this.endPos.col)) {
                        continue;
                    }
                    
                    const pathGeometry = new THREE.PlaneGeometry(cellSize * 0.8, cellSize * 0.8);
                    const pathMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x3498db,
                        transparent: true,
                        opacity: 0.4
                    });
                    const pathMarker = new THREE.Mesh(pathGeometry, pathMaterial);
                    pathMarker.rotation.x = -Math.PI / 2;
                    pathMarker.position.set(
                        (j - offset) * cellSize,
                        0.01,
                        (i - offset) * cellSize
                    );
                    this.scene.add(pathMarker);
                    this.pathMarkers.push(pathMarker);
                }
            }
        }
    }

    updatePlayer3DPos() {
        // 3D 위치를 2D 좌표로 변환
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;
        const col = Math.round(this.camera.position.x / cellSize + offset);
        const row = Math.round(this.camera.position.z / cellSize + offset);

        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const oldRow = this.playerPos.row;
            const oldCol = this.playerPos.col;

            if (oldRow !== row || oldCol !== col) {
                this.playerPos.row = row;
                this.playerPos.col = col;
                this.moveCount++;
                document.getElementById('moveCount').textContent = this.moveCount;

                // 방문 기록 (항상 기록)
                this.visited[row][col] = true;
                
                // 표시 여부는 showPath 옵션에 따라 결정
                if (this.showPath && this.viewMode === '3D' && this.scene) {
                    this.add3DPathMarker(row, col);
                }

                // 승리 체크
                if (row === this.endPos.row && col === this.endPos.col) {
                    this.gameWon = true;
                    this.stopMonsterMovement();
                    document.getElementById('finalMoveCount').textContent = this.moveCount;
                    document.getElementById('winMessage').classList.remove('hidden');
                    if (this.isPointerLocked) {
                        document.exitPointerLock();
                    }
                }
                
                // 괴물 충돌 체크
                if (this.horrorMode && this.monster) {
                    this.checkMonsterCollision();
                }
            }
        }
    }

    switchTo2D() {
        this.viewMode = '2D';
        document.getElementById('mazeCanvas').classList.remove('hidden');
        document.getElementById('maze3D').classList.add('hidden');
        document.getElementById('instructions2D').classList.remove('hidden');
        document.getElementById('instructions3D').classList.add('hidden');
        
        // 나침반 숨기기
        const compass = document.getElementById('compass');
        if (compass) {
            compass.classList.add('hidden');
        }
        
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
        // 3D 모드 메시지 숨기기
        const info = document.getElementById('pointerLockInfo');
        if (info) {
            info.classList.add('hidden');
        }
        this.draw();
    }

    switchTo3D() {
        this.viewMode = '3D';
        console.log('Switching to 3D mode');
        document.getElementById('mazeCanvas').classList.add('hidden');
        document.getElementById('maze3D').classList.remove('hidden');
        document.getElementById('instructions2D').classList.add('hidden');
        document.getElementById('instructions3D').classList.remove('hidden');
        
        // 나침반 표시
        const compass = document.getElementById('compass');
        if (compass) {
            compass.classList.remove('hidden');
        }
        
        if (!this.scene) {
            this.setup3D();
        }
        
        // 약간의 지연 후 미로 생성 (렌더러가 준비될 때까지)
        // resetPosition = false: 현재 플레이어 위치 유지
        setTimeout(() => {
            this.create3DMaze(false);
            console.log('3D maze created, camera:', this.camera);
        }, 100);
        
        // 공포 모드가 활성화되어 있으면 괴물 이동 계속
        if (this.horrorMode) {
            this.startMonsterMovement();
        }
    }

    // 2D 벽면 텍스처 패턴 생성
    getWallTexturePattern2D() {
        if (this.wallTexturePatterns[this.wallTexture]) {
            return this.wallTexturePatterns[this.wallTexture];
        }

        // 외부 이미지가 있으면 사용
        if (this.textureImages[this.wallTexture]) {
            const pattern = this.ctx.createPattern(this.textureImages[this.wallTexture], 'repeat');
            this.wallTexturePatterns[this.wallTexture] = pattern;
            return pattern;
        }

        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = this.cellSize;
        patternCanvas.height = this.cellSize;
        const patternCtx = patternCanvas.getContext('2d');

        switch(this.wallTexture) {
            case 'wood':
                // 나무벽 스타일 (이미지가 없을 때만 사용)
                patternCtx.fillStyle = '#8B4513';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.strokeStyle = '#654321';
                patternCtx.lineWidth = 1;
                for (let i = 0; i < patternCanvas.height; i += 3) {
                    patternCtx.beginPath();
                    patternCtx.moveTo(0, i);
                    patternCtx.lineTo(patternCanvas.width, i);
                    patternCtx.stroke();
                }
                break;
            case 'vine':
                // 덩쿨 스타일 (이미지가 없을 때만 사용)
                patternCtx.fillStyle = '#2d5016';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.strokeStyle = '#1a3009';
                patternCtx.lineWidth = 2;
                // 덩쿨 패턴
                for (let i = 0; i < patternCanvas.width; i += 8) {
                    patternCtx.beginPath();
                    patternCtx.moveTo(i, 0);
                    patternCtx.quadraticCurveTo(i + 4, patternCanvas.height / 2, i, patternCanvas.height);
                    patternCtx.stroke();
                }
                break;
            case 'brick':
                // 벽돌 스타일
                patternCtx.fillStyle = '#B22222';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.strokeStyle = '#8B0000';
                patternCtx.lineWidth = 1;
                // 벽돌 줄
                for (let i = 0; i < patternCanvas.height; i += patternCanvas.height / 3) {
                    patternCtx.beginPath();
                    patternCtx.moveTo(0, i);
                    patternCtx.lineTo(patternCanvas.width, i);
                    patternCtx.stroke();
                    // 교차 줄
                    if (i % (patternCanvas.height / 1.5) === 0) {
                        patternCtx.beginPath();
                        patternCtx.moveTo(patternCanvas.width / 2, i);
                        patternCtx.lineTo(patternCanvas.width / 2, i + patternCanvas.height / 3);
                        patternCtx.stroke();
                    }
                }
                break;
            case 'alley':
                // 골목 스타일
                patternCtx.fillStyle = '#2C2C2C';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.fillStyle = '#1a1a1a';
                // 돌 패턴
                for (let i = 0; i < patternCanvas.width; i += 4) {
                    for (let j = 0; j < patternCanvas.height; j += 4) {
                        if ((i + j) % 8 === 0) {
                            patternCtx.fillRect(i, j, 2, 2);
                        }
                    }
                }
                break;
            case 'garden':
                // 정원 스타일
                patternCtx.fillStyle = '#90EE90';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.fillStyle = '#228B22';
                // 잎사귀 패턴
                for (let i = 0; i < patternCanvas.width; i += 6) {
                    for (let j = 0; j < patternCanvas.height; j += 6) {
                        patternCtx.beginPath();
                        patternCtx.arc(i, j, 2, 0, Math.PI * 2);
                        patternCtx.fill();
                    }
                }
                break;
            case 'flower':
                // 꽃나무 스타일
                patternCtx.fillStyle = '#FFB6C1';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
                patternCtx.fillStyle = '#FF69B4';
                // 꽃 패턴
                for (let i = 0; i < patternCanvas.width; i += 8) {
                    for (let j = 0; j < patternCanvas.height; j += 8) {
                        patternCtx.beginPath();
                        patternCtx.arc(i, j, 3, 0, Math.PI * 2);
                        patternCtx.fill();
                        patternCtx.fillStyle = '#FF1493';
                        patternCtx.beginPath();
                        patternCtx.arc(i, j, 1, 0, Math.PI * 2);
                        patternCtx.fill();
                        patternCtx.fillStyle = '#FF69B4';
                    }
                }
                break;
            default:
                // 기본 스타일
                patternCtx.fillStyle = '#34495e';
                patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
        }

        const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
        this.wallTexturePatterns[this.wallTexture] = pattern;
        return pattern;
    }

    // 3D 벽면 텍스처 재질 생성 (project1 방식 참고 - TextureLoader만 사용)
    // Image 객체를 직접 사용하면 CORS 오류 발생하므로 TextureLoader만 사용
    getWallTextureMaterial3D() {
        if (this.wallTexture3D[this.wallTexture]) {
            return this.wallTexture3D[this.wallTexture].clone();
        }

        // 외부 이미지 파일이 있는 텍스처는 TextureLoader 사용 (project1 방식)
        const textureFiles = ['wood', 'vine', 'brick'];
        if (textureFiles.includes(this.wallTexture)) {
            const texturePath = `textures/${this.wallTexture}.png`;
            const loader = new THREE.TextureLoader();
            // project1처럼 직접 경로 사용, crossOrigin 설정하지 않음 (같은 도메인)
            // TextureLoader는 내부적으로 Image 객체를 생성하지만 올바르게 처리함
            const loadedTexture = loader.load(
                texturePath,
                // 로드 성공
                (tex) => {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.repeat.set(1, 1);
                },
                // 진행 중
                undefined,
                // 에러 - 기본 재질 사용
                () => {
                    // 에러 시 기본 재질 사용 (조용히 처리)
                }
            );
            const loadedMaterial = new THREE.MeshStandardMaterial({ map: loadedTexture });
            this.wallTexture3D[this.wallTexture] = loadedMaterial;
            return loadedMaterial;
        }

        // 이미지가 없는 텍스처는 Canvas로 생성
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 256;
        textureCanvas.height = 256;
        const textureCtx = textureCanvas.getContext('2d');

        switch(this.wallTexture) {
            case 'wood':
                // 나무벽 스타일 (이미지가 없을 때만 사용)
                textureCtx.fillStyle = '#8B4513';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.strokeStyle = '#654321';
                textureCtx.lineWidth = 2;
                for (let i = 0; i < textureCanvas.height; i += 8) {
                    textureCtx.beginPath();
                    textureCtx.moveTo(0, i);
                    textureCtx.lineTo(textureCanvas.width, i);
                    textureCtx.stroke();
                }
                break;
            case 'vine':
                // 덩쿨 스타일 (이미지가 없을 때만 사용)
                textureCtx.fillStyle = '#2d5016';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.strokeStyle = '#1a3009';
                textureCtx.lineWidth = 4;
                for (let i = 0; i < textureCanvas.width; i += 16) {
                    textureCtx.beginPath();
                    textureCtx.moveTo(i, 0);
                    textureCtx.quadraticCurveTo(i + 8, textureCanvas.height / 2, i, textureCanvas.height);
                    textureCtx.stroke();
                }
                break;
            case 'brick':
                // 벽돌 스타일
                textureCtx.fillStyle = '#B22222';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.strokeStyle = '#8B0000';
                textureCtx.lineWidth = 2;
                const brickHeight = textureCanvas.height / 6;
                for (let i = 0; i < textureCanvas.height; i += brickHeight) {
                    textureCtx.beginPath();
                    textureCtx.moveTo(0, i);
                    textureCtx.lineTo(textureCanvas.width, i);
                    textureCtx.stroke();
                    if (Math.floor(i / brickHeight) % 2 === 0) {
                        textureCtx.beginPath();
                        textureCtx.moveTo(textureCanvas.width / 2, i);
                        textureCtx.lineTo(textureCanvas.width / 2, i + brickHeight);
                        textureCtx.stroke();
                    }
                }
                break;
            case 'alley':
                // 골목 스타일
                textureCtx.fillStyle = '#2C2C2C';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.fillStyle = '#1a1a1a';
                for (let i = 0; i < textureCanvas.width; i += 8) {
                    for (let j = 0; j < textureCanvas.height; j += 8) {
                        if ((i + j) % 16 === 0) {
                            textureCtx.fillRect(i, j, 4, 4);
                        }
                    }
                }
                break;
            case 'garden':
                // 정원 스타일
                textureCtx.fillStyle = '#90EE90';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.fillStyle = '#228B22';
                for (let i = 0; i < textureCanvas.width; i += 12) {
                    for (let j = 0; j < textureCanvas.height; j += 12) {
                        textureCtx.beginPath();
                        textureCtx.arc(i, j, 4, 0, Math.PI * 2);
                        textureCtx.fill();
                    }
                }
                break;
            case 'flower':
                // 꽃나무 스타일
                textureCtx.fillStyle = '#FFB6C1';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
                textureCtx.fillStyle = '#FF69B4';
                for (let i = 0; i < textureCanvas.width; i += 16) {
                    for (let j = 0; j < textureCanvas.height; j += 16) {
                        textureCtx.beginPath();
                        textureCtx.arc(i, j, 6, 0, Math.PI * 2);
                        textureCtx.fill();
                        textureCtx.fillStyle = '#FF1493';
                        textureCtx.beginPath();
                        textureCtx.arc(i, j, 2, 0, Math.PI * 2);
                        textureCtx.fill();
                        textureCtx.fillStyle = '#FF69B4';
                    }
                }
                break;
            default:
                // 기본 스타일
                textureCtx.fillStyle = '#34495e';
                textureCtx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
        }

        const canvasTexture = new THREE.CanvasTexture(textureCanvas);
        canvasTexture.wrapS = THREE.RepeatWrapping;
        canvasTexture.wrapT = THREE.RepeatWrapping;
        canvasTexture.repeat.set(1, 1);

        const canvasMaterial = new THREE.MeshStandardMaterial({ map: canvasTexture });
        this.wallTexture3D[this.wallTexture] = canvasMaterial;
        return canvasMaterial;
    }

    // 나침반 업데이트
    updateCompass() {
        if (!this.camera || this.viewMode !== '3D') return;
        
        const compass = document.getElementById('compass');
        const needle = compass?.querySelector('.compass-needle');
        if (!compass || !needle) return;
        
        // euler.y를 직접 사용하여 수평 회전만 반영 (상하 회전은 무시)
        // euler.y는 좌우 수평 회전만 나타내므로 나침반에 적합
        const horizontalRotation = this.euler.y;
        
        // 라디안을 도로 변환
        // 카메라가 북쪽(0)을 바라볼 때 바늘이 위(0도)를 가리켜야 함
        // 카메라가 동쪽(π/2)을 바라볼 때 바늘이 오른쪽(90도)을 가리켜야 함
        const degrees = horizontalRotation * (180 / Math.PI);
        
        // 바늘 회전 (카메라가 바라보는 방향의 반대 방향)
        needle.style.transform = `translate(-50%, -100%) rotate(${-degrees}deg)`;
    }

    // 괴물 초기화
    initializeMonster() {
        // 괴물을 끝점 근처에 배치
        this.monster.row = this.endPos.row;
        this.monster.col = this.endPos.col;
        this.monster.direction = null;
        
        // 3D 괴물 생성
        if (this.viewMode === '3D' && this.scene) {
            this.createMonster3D();
        }
    }

    // 괴물 이동 시작
    startMonsterMovement() {
        if (!this.horrorMode) return;
        
        this.stopMonsterMovement();
        
        this.monster.moveTimer = setInterval(() => {
            if (this.gameWon || this.gameOver || !this.horrorMode) {
                this.stopMonsterMovement();
                return;
            }
            
            this.moveMonster();
        }, this.monster.moveInterval);
    }

    // 괴물 이동 중지
    stopMonsterMovement() {
        if (this.monster && this.monster.moveTimer) {
            clearInterval(this.monster.moveTimer);
            this.monster.moveTimer = null;
        }
    }

    // 괴물 이동 로직
    moveMonster() {
        if (!this.monster || !this.maze) return;
        
        const directions = [
            [0, 1],   // 오른쪽
            [1, 0],   // 아래
            [0, -1],  // 왼쪽
            [-1, 0]   // 위
        ];
        
        // 현재 방향이 없거나 막혔으면 새 방향 선택
        if (!this.monster.direction || this.isMonsterBlocked()) {
            const availableDirections = [];
            
            for (const [dr, dc] of directions) {
                const newRow = this.monster.row + dr;
                const newCol = this.monster.col + dc;
                
                if (newRow >= 0 && newRow < this.rows &&
                    newCol >= 0 && newCol < this.cols &&
                    this.maze[newRow] && this.maze[newRow][newCol] === 0) {
                    availableDirections.push([dr, dc]);
                }
            }
            
            if (availableDirections.length > 0) {
                // 랜덤하게 방향 선택 (플레이어 쪽으로 약간 치우치게)
                const playerDir = this.getDirectionToPlayer();
                if (playerDir && availableDirections.some(d => d[0] === playerDir[0] && d[1] === playerDir[1])) {
                    // 플레이어 방향이 가능하면 60% 확률로 선택
                    if (Math.random() < 0.6) {
                        this.monster.direction = playerDir;
                    } else {
                        this.monster.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                    }
                } else {
                    this.monster.direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
                }
            }
        }
        
        // 이동
        if (this.monster.direction) {
            const [dr, dc] = this.monster.direction;
            const newRow = this.monster.row + dr;
            const newCol = this.monster.col + dc;
            
            if (newRow >= 0 && newRow < this.rows &&
                newCol >= 0 && newCol < this.cols &&
                this.maze[newRow] && this.maze[newRow][newCol] === 0) {
                this.monster.row = newRow;
                this.monster.col = newCol;
                
                // 3D 괴물 위치 업데이트
                if (this.viewMode === '3D' && this.monster3D) {
                    this.updateMonster3DPos();
                }
                
                // 충돌 체크
                this.checkMonsterCollision();
                
                // 렌더링 업데이트
                if (this.viewMode === '2D') {
                    this.draw();
                }
            } else {
                // 막혔으면 방향 초기화
                this.monster.direction = null;
            }
        }
    }

    // 괴물이 막혔는지 확인
    isMonsterBlocked() {
        if (!this.monster || !this.monster.direction) return true;
        
        const [dr, dc] = this.monster.direction;
        const newRow = this.monster.row + dr;
        const newCol = this.monster.col + dc;
        
        return !(newRow >= 0 && newRow < this.rows &&
                 newCol >= 0 && newCol < this.cols &&
                 this.maze[newRow] && this.maze[newRow][newCol] === 0);
    }

    // 플레이어 방향 계산
    getDirectionToPlayer() {
        if (!this.monster || !this.playerPos) return null;
        
        const dr = this.playerPos.row - this.monster.row;
        const dc = this.playerPos.col - this.monster.col;
        
        // 가장 가까운 방향 반환
        if (Math.abs(dr) > Math.abs(dc)) {
            return dr > 0 ? [1, 0] : [-1, 0];
        } else {
            return dc > 0 ? [0, 1] : [0, -1];
        }
    }

    // 괴물과 플레이어 충돌 체크
    checkMonsterCollision() {
        if (!this.monster || !this.playerPos) return;
        
        if (this.monster.row === this.playerPos.row && 
            this.monster.col === this.playerPos.col) {
            this.gameOver = true;
            this.stopMonsterMovement();
            document.getElementById('gameOverMessage').classList.remove('hidden');
        }
    }

    // 괴물 제거
    removeMonster() {
        this.stopMonsterMovement();
        if (this.viewMode === '3D' && this.scene && this.monster3D) {
            this.scene.remove(this.monster3D);
            this.monster3D = null;
        }
    }

    // 3D 괴물 생성
    createMonster3D() {
        if (!this.scene || !this.horrorMode || !this.monster) return;
        
        // 기존 괴물 제거
        if (this.monster3D) {
            this.scene.remove(this.monster3D);
        }
        
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;
        const x = (this.monster.col - offset) * cellSize;
        const z = (this.monster.row - offset) * cellSize;
        
        // 괴물 지오메트리 (큰 원기둥)
        const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x8b0000,
            emissive: 0x440000 // 약간의 빛 발산
        });
        this.monster3D = new THREE.Mesh(geometry, material);
        this.monster3D.position.set(x, 0.75, z);
        this.scene.add(this.monster3D);
        
        // 눈 추가
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.3, 0.4);
        this.monster3D.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.3, 0.4);
        this.monster3D.add(rightEye);
    }

    // 3D 괴물 위치 업데이트
    updateMonster3DPos() {
        if (!this.monster3D || !this.horrorMode || !this.monster) return;
        
        const cellSize = 1;
        const offset = (this.cols - 1) / 2;
        const x = (this.monster.col - offset) * cellSize;
        const z = (this.monster.row - offset) * cellSize;
        
        this.monster3D.position.set(x, 0.75, z);
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
        this.gameOver = false;
        document.getElementById('moveCount').textContent = '0';
        document.getElementById('winMessage').classList.add('hidden');
        document.getElementById('gameOverMessage').classList.add('hidden');
        
        // 공포 모드가 활성화되어 있으면 괴물 재초기화
        if (this.horrorMode) {
            this.initializeMonster();
            this.startMonsterMovement();
        } else {
            this.stopMonsterMovement();
            this.removeMonster();
        }
        
        // 3D 모드에서 지나온 길 마커 제거
        if (this.viewMode === '3D' && this.scene) {
            this.pathMarkers.forEach(marker => this.scene.remove(marker));
            this.pathMarkers = [];
        }
        
        if (this.viewMode === '2D') {
            this.draw();
        } else {
            // 3D 모드에서 리셋
            const cellSize = 1;
            const offset = (this.cols - 1) / 2;
            const startX = (this.startPos.col - offset) * cellSize;
            const startZ = (this.startPos.row - offset) * cellSize;
            this.camera.position.set(startX, 1.6, startZ);
            this.camera.rotation.set(0, 0, 0); // 정면을 바라봄
            this.euler.set(0, 0, 0);
        }
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    new MazeGame();
});

