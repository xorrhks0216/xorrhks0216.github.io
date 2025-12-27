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
        this.viewMode = '2D'; // '2D' or '3D'
        
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
        
        // 3D 미로도 업데이트
        if (this.viewMode === '3D' && this.scene) {
            this.create3DMaze(true); // 새 미로이므로 위치 리셋
        }
    }

    setupEventListeners() {
        // 키보드 이벤트 - 키 누름
        document.addEventListener('keydown', (e) => {
            if (this.gameWon) return;
            
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
            if (this.viewMode === '2D') {
                this.draw();
            } else {
                this.create3DMaze(true); // 새 미로이므로 위치 리셋
            }
        });
        
        // 크기 입력 변경 시
        document.getElementById('mazeSizeInput').addEventListener('change', (e) => {
            let size = parseInt(e.target.value) || 20;
            if (size < 15) size = 15;
            if (size > 35) size = 35;
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

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
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
            if (this.isPointerLocked) {
                info.classList.add('hidden');
            } else {
                info.classList.remove('hidden');
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

            const newX = this.camera.position.x + moveX;
            const newZ = this.camera.position.z + moveZ;

            // 충돌 체크
            if (this.canMove3D(newX, newZ)) {
                this.camera.position.x = newX;
                this.camera.position.z = newZ;
                this.updatePlayer3DPos();
            }
        };

        // 애니메이션 루프
        const animate = () => {
            requestAnimationFrame(animate);
            if (this.viewMode === '3D' && this.scene && this.camera && this.renderer) {
                this.move3D();
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

        // 천장 생성
        const ceilingGeometry = new THREE.PlaneGeometry(this.cols * cellSize, this.rows * cellSize);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        this.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        this.ceiling.rotation.x = Math.PI / 2;
        this.ceiling.position.set(0, wallHeight, 0);
        this.scene.add(this.ceiling);

        // 벽 생성
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x34495e });
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

                if (this.showPath) {
                    this.visited[row][col] = true;
                }

                // 승리 체크
                if (row === this.endPos.row && col === this.endPos.col) {
                    this.gameWon = true;
                    document.getElementById('finalMoveCount').textContent = this.moveCount;
                    document.getElementById('winMessage').classList.remove('hidden');
                    if (this.isPointerLocked) {
                        document.exitPointerLock();
                    }
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
        if (this.isPointerLocked) {
            document.exitPointerLock();
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
        
        if (!this.scene) {
            this.setup3D();
        }
        
        // 약간의 지연 후 미로 생성 (렌더러가 준비될 때까지)
        // resetPosition = false: 현재 플레이어 위치 유지
        setTimeout(() => {
            this.create3DMaze(false);
            console.log('3D maze created, camera:', this.camera);
        }, 100);
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

