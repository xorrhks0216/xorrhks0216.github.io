// 게임 상태 관리
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 게임 상태
        this.isRunning = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.score = 0;
        this.camera = { x: 0, y: 0 };
        this.gameStatusElement = document.getElementById('gameStatus');
        this.spikesEnabled = true; // 가시 활성화 상태
        this.coinsEnabled = true; // 동전 활성화 상태
        this.mapSeed = null; // 맵 시드 저장
        this.originalMapSeed = null; // 원본 시드 저장 (재생성용)
        
        // 플레이어
        this.player = {
            x: 50,
            y: 300,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            speed: 5,
            jumpPower: 15,
            onGround: false,
            color: '#ff6b6b'
        };
        
        // 플랫폼들, 가시, 동전, 깃발은 랜덤 생성으로 초기화
        this.platforms = [];
        this.spikes = [];
        this.coins = [];
        this.flag = { x: 0, y: 0, width: 30, height: 100, poleHeight: 80 };
        
        // 키 입력 상태
        this.keys = {};
        
        // 터치 상태
        this.touchState = {
            left: false,
            right: false,
            jump: false
        };
        
        // 물리 상수
        this.gravity = 0.8;
        this.friction = 0.8;
        
        // 가시와 동전의 초기 위치 저장 (리셋용)
        this.initialSpikes = [];
        this.initialCoins = [];
        
        // 초기 맵 생성 (init 전에 호출하여 플랫폼이 제대로 생성되도록)
        this.generateRandomMap();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTouchControls();
        // 초기 렌더링 실행 (플랫폼이 보이도록)
        this.render();
        this.gameLoop();
    }
    
    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 버튼 이벤트
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // 맵 메뉴 버튼 이벤트
        document.getElementById('regenerateMapBtn').addEventListener('click', () => {
            this.regenerateCurrentMap();
        });
        
        document.getElementById('newMapBtn').addEventListener('click', () => {
            this.generateNewMap();
        });
        
        // 가시 토글 이벤트
        document.getElementById('spikesToggle').addEventListener('change', (e) => {
            this.spikesEnabled = e.target.checked;
            this.updateGameStatus();
        });
        
        // 동전 토글 이벤트
        document.getElementById('coinsToggle').addEventListener('change', (e) => {
            this.coinsEnabled = e.target.checked;
            this.updateGameStatus();
        });
    }
    
    setupTouchControls() {
        const touchLeft = document.getElementById('touchLeft');
        const touchRight = document.getElementById('touchRight');
        const touchJump = document.getElementById('touchJump');
        
        // 왼쪽 버튼
        touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.left = true;
            this.keys['a'] = true;
        });
        
        touchLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.left = false;
            this.keys['a'] = false;
        });
        
        touchLeft.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchState.left = false;
            this.keys['a'] = false;
        });
        
        // 마우스 이벤트도 지원 (데스크톱에서 테스트용)
        touchLeft.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchState.left = true;
            this.keys['a'] = true;
        });
        
        touchLeft.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchState.left = false;
            this.keys['a'] = false;
        });
        
        touchLeft.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.touchState.left = false;
            this.keys['a'] = false;
        });
        
        // 오른쪽 버튼
        touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.right = true;
            this.keys['d'] = true;
        });
        
        touchRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.right = false;
            this.keys['d'] = false;
        });
        
        touchRight.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchState.right = false;
            this.keys['d'] = false;
        });
        
        touchRight.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchState.right = true;
            this.keys['d'] = true;
        });
        
        touchRight.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchState.right = false;
            this.keys['d'] = false;
        });
        
        touchRight.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.touchState.right = false;
            this.keys['d'] = false;
        });
        
        // 점프 버튼
        touchJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.jump = true;
            this.keys['w'] = true;
        });
        
        touchJump.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.keys['w'] = false;
        });
        
        touchJump.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.keys['w'] = false;
        });
        
        touchJump.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.touchState.jump = true;
            this.keys['w'] = true;
        });
        
        touchJump.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.keys['w'] = false;
        });
        
        touchJump.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.keys['w'] = false;
        });
    }
    
    startGame() {
        this.isRunning = true;
        this.isGameOver = false;
        this.isVictory = false;
        this.updateGameStatus();
    }
    
    updateGameStatus() {
        if (this.isRunning) {
            let status = '게임 진행 중...';
            if (this.spikesEnabled && this.coinsEnabled) {
                status += ' (가시 활성화, 동전 활성화)';
            } else if (this.spikesEnabled) {
                status += ' (가시 활성화, 동전 비활성화)';
            } else if (this.coinsEnabled) {
                status += ' (가시 비활성화, 동전 활성화)';
            } else {
                status += ' (가시 비활성화, 동전 비활성화)';
            }
            this.gameStatusElement.textContent = status;
        } else if (this.isGameOver) {
            this.gameStatusElement.textContent = '게임 오버! 방향키를 눌러 다시 시작하세요!';
        } else if (this.isVictory) {
            this.gameStatusElement.textContent = '승리! 리셋 버튼을 눌러 새 게임을 시작하세요!';
        } else {
            this.gameStatusElement.textContent = '방향키를 눌러 게임을 시작하세요!';
        }
    }
    
    resetGame() {
        this.isRunning = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.score = 0;
        this.player.x = 50;
        this.player.y = 300;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.color = '#ff6b6b';
        this.camera.x = 0;
        this.camera.y = 0;
        
        // 가시와 동전을 초기 위치로 복원 (맵은 유지)
        if (this.initialSpikes.length > 0) {
            this.spikes = JSON.parse(JSON.stringify(this.initialSpikes));
        }
        if (this.initialCoins.length > 0) {
            this.coins = JSON.parse(JSON.stringify(this.initialCoins));
        }
        
        this.updateGameStatus();
        document.getElementById('score').textContent = this.score;
    }
    
    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.player.color = '#ffffff'; // 뼈다귀 색상
        this.updateGameStatus();
    }
    
    victory() {
        this.isVictory = true;
        this.isRunning = false;
        this.updateGameStatus();
    }
    
    // 시드 기반 랜덤 생성기
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // 랜덤 맵 생성
    generateRandomMap(seed = null) {
        // 시드 설정
        if (seed === null) {
            this.originalMapSeed = Math.random() * 1000000;
        } else {
            this.originalMapSeed = seed;
        }
        
        // 현재 시드를 원본 시드로 초기화
        this.mapSeed = this.originalMapSeed;
        
        let rng = (max = 1, min = 0) => {
            this.mapSeed = (this.mapSeed * 9301 + 49297) % 233280;
            return min + (this.mapSeed / 233280) * (max - min);
        };
        
        // 플랫폼 초기화
        this.platforms = [];
        this.spikes = [];
        this.coins = [];
        
        // 시작 플랫폼 (항상 고정)
        this.platforms.push({ x: 0, y: 350, width: 200, height: 50, color: '#8B4513' });
        
        // 플레이어 점프 능력 계산
        // 최대 점프 높이 = (jumpPower^2) / (2 * gravity) = (15^2) / (2 * 0.8) ≈ 140픽셀
        // 최대 점프 거리 = speed * (jumpPower * 2 / gravity) = 5 * (30 / 0.8) ≈ 187픽셀
        const maxJumpHeight = (this.player.jumpPower * this.player.jumpPower) / (2 * this.gravity);
        const maxJumpDistance = this.player.speed * (this.player.jumpPower * 2 / this.gravity);
        
        // 안전 마진을 고려한 최대 거리와 높이 차이
        const maxHorizontalGap = maxJumpDistance * 0.9; // 90%로 제한 (약 168픽셀)
        const maxVerticalUp = maxJumpHeight * 0.8; // 위로 점프 시 80%로 제한 (약 112픽셀)
        const maxVerticalDown = 200; // 아래로 점프는 더 여유롭게 (200픽셀)
        
        // 랜덤 플랫폼 생성
        const numPlatforms = 8 + Math.floor(rng(5, 0)); // 8-12개
        let lastX = 200; // 시작 플랫폼의 끝
        let lastY = 350; // 시작 플랫폼의 Y 위치
        const minGap = 80;
        const maxGap = maxHorizontalGap; // 점프 가능한 최대 거리로 제한
        const minWidth = 100;
        const maxWidth = 200;
        const minHeight = 30;
        const maxHeight = 50;
        const minY = 150;
        const maxY = 320;
        
        for (let i = 0; i < numPlatforms; i++) {
            const width = rng(maxWidth, minWidth);
            const height = rng(maxHeight, minHeight);
            
            // 이전 플랫폼 끝에서 다음 플랫폼 시작까지의 거리
            let gap = rng(maxGap, minGap);
            let x = lastX + gap;
            
            // Y 위치 결정 (점프 가능한 범위 내)
            let y;
            if (i === 0) {
                y = rng(320, 280);
            } else {
                // 수평 거리에 따른 최대 높이 차이 계산
                // 거리가 멀수록 높이 차이는 작아야 함
                const horizontalDistance = gap;
                const distanceRatio = horizontalDistance / maxHorizontalGap;
                
                // 거리에 따른 최대 높이 차이 계산
                let maxAllowedHeightDiff;
                if (distanceRatio < 0.5) {
                    // 가까운 거리: 높이 차이를 더 크게 가능
                    maxAllowedHeightDiff = maxVerticalUp;
                } else if (distanceRatio < 0.8) {
                    // 중간 거리: 높이 차이를 중간 정도로
                    maxAllowedHeightDiff = maxVerticalUp * (1 - (distanceRatio - 0.5) * 0.67);
                } else {
                    // 먼 거리: 높이 차이를 작게 제한
                    maxAllowedHeightDiff = maxVerticalUp * 0.3;
                }
                
                // 아래로 점프는 더 여유롭게
                const maxDownDiff = Math.min(maxVerticalDown, maxAllowedHeightDiff * 1.5);
                
                // 높이 차이 결정 (위로 또는 아래로)
                let yVariation;
                if (rng(1) < 0.5) {
                    // 위로 점프
                    yVariation = -rng(maxAllowedHeightDiff, 0);
                } else {
                    // 아래로 점프
                    yVariation = rng(maxDownDiff, 0);
                }
                
                y = lastY + yVariation;
                y = Math.max(minY, Math.min(maxY, y));
                
                // 최종 점프 가능 여부 재검증
                const finalHorizontalDist = x - lastX;
                const finalVerticalDist = Math.abs(y - lastY);
                
                // 수평 거리가 최대치에 가까우면 높이 차이를 더 제한
                if (finalHorizontalDist > maxHorizontalGap * 0.85) {
                    const strictMaxHeight = maxVerticalUp * 0.5;
                    if (finalVerticalDist > strictMaxHeight) {
                        // 높이 차이를 줄여서 재조정
                        if (y > lastY) {
                            y = lastY + strictMaxHeight;
                        } else {
                            y = lastY - strictMaxHeight;
                        }
                        y = Math.max(minY, Math.min(maxY, y));
                    }
                }
            }
            
            this.platforms.push({ x, y, width, height, color: '#8B4513' });
            lastX = x + width;
            lastY = y;
        }
        
        // 마지막 플랫폼 (깃발용, 항상 추가) - 점프 가능한 거리 내에 배치
        let finalGap = rng(maxHorizontalGap * 0.7, minGap);
        const finalPlatformX = lastX + finalGap;
        
        // 마지막 플랫폼의 Y 위치도 점프 가능한 범위 내에
        let finalPlatformY;
        const finalHeightDiff = rng(Math.min(50, maxVerticalDown), -Math.min(60, maxVerticalUp));
        finalPlatformY = Math.max(minY, Math.min(maxY, lastY + finalHeightDiff));
        
        this.platforms.push({ 
            x: finalPlatformX, 
            y: finalPlatformY, 
            width: 200, 
            height: 50, 
            color: '#8B4513' 
        });
        
        // 가시 생성 (일부 플랫폼에만)
        for (let i = 1; i < this.platforms.length - 1; i++) {
            const platform = this.platforms[i];
            // 60% 확률로 가시 생성
            if (rng(1) < 0.6) {
                const spikeX = platform.x + rng(platform.width - 40, 20);
                const spikeY = platform.y - 20;
                this.spikes.push({
                    x: spikeX,
                    y: spikeY,
                    width: 20,
                    height: 20,
                    velocityY: 0,
                    onGround: false,
                    platformX: platform.x,
                    platformY: platform.y
                });
            }
        }
        
        // 동전 생성 (가시와 겹치지 않도록)
        for (let i = 1; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            const spikeOnPlatform = this.spikes.find(s => 
                s.platformX === platform.x && s.platformY === platform.y
            );
            
            // 플랫폼당 1-2개의 동전
            const numCoins = rng(2.5, 0.5) < 1.5 ? 1 : 2;
            
            for (let j = 0; j < numCoins; j++) {
                let coinX, coinY;
                let attempts = 0;
                let validPosition = false;
                
                // 가시와 겹치지 않는 위치 찾기
                while (!validPosition && attempts < 20) {
                    coinX = platform.x + rng(platform.width - 30, 15);
                    coinY = platform.y - 15;
                    
                    // 가시와의 거리 확인
                    if (spikeOnPlatform) {
                        const distance = Math.abs(coinX - spikeOnPlatform.x);
                        if (distance > 40) {
                            validPosition = true;
                        }
                    } else {
                        validPosition = true;
                    }
                    
                    // 다른 동전과의 거리 확인
                    if (validPosition) {
                        for (let coin of this.coins) {
                            if (Math.abs(coin.x - coinX) < 30) {
                                validPosition = false;
                                break;
                            }
                        }
                    }
                    
                    attempts++;
                }
                
                if (validPosition) {
                    this.coins.push({
                        x: coinX,
                        y: coinY,
                        width: 15,
                        height: 15,
                        collected: false,
                        animation: rng(Math.PI * 2, 0)
                    });
                }
            }
        }
        
        // 깃발 위치 설정 (마지막 플랫폼 위)
        const finalPlatform = this.platforms[this.platforms.length - 1];
        this.flag = {
            x: finalPlatform.x + finalPlatform.width / 2 - 15,
            y: finalPlatform.y - 100,
            width: 30,
            height: 100,
            poleHeight: 80
        };
        
        // 초기 위치 저장 (리셋용)
        this.initialSpikes = JSON.parse(JSON.stringify(this.spikes));
        this.initialCoins = JSON.parse(JSON.stringify(this.coins));
    }
    
    // 같은 맵 다시 생성
    regenerateCurrentMap() {
        if (this.originalMapSeed !== null) {
            this.generateRandomMap(this.originalMapSeed);
        } else {
            this.generateRandomMap();
        }
        this.resetGame();
    }
    
    // 새 맵 생성
    generateNewMap() {
        this.generateRandomMap();
        this.resetGame();
    }
    
    handleInput() {
        // 게임이 시작되지 않은 상태에서 방향키 입력 시 게임 시작
        if (!this.isRunning && !this.isVictory && (this.keys['a'] || this.keys['d'] || this.keys['arrowleft'] || this.keys['arrowright'] || this.keys['w'] || this.keys['arrowup'] || this.touchState.left || this.touchState.right || this.touchState.jump)) {
            this.startGame();
            return;
        }
        
        // 게임오버 상태에서 방향키 입력 시 게임 재시작
        if (this.isGameOver && (this.keys['a'] || this.keys['d'] || this.keys['arrowleft'] || this.keys['arrowright'] || this.keys['w'] || this.keys['arrowup'] || this.touchState.left || this.touchState.right || this.touchState.jump)) {
            this.resetGame();
            this.startGame();
            return;
        }
        
        if (!this.isRunning) return;
        
        // 좌우 이동 (키보드 + 터치)
        if (this.keys['a'] || this.keys['arrowleft'] || this.touchState.left) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['d'] || this.keys['arrowright'] || this.touchState.right) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        // 점프 (키보드 + 터치)
        if ((this.keys['w'] || this.keys['arrowup'] || this.touchState.jump) && this.player.onGround) {
            this.player.velocityY = -this.player.jumpPower;
            this.player.onGround = false;
        }
    }
    
    updatePhysics() {
        if (!this.isRunning || this.isGameOver || this.isVictory) return;
        
        // 중력 적용
        this.player.velocityY += this.gravity;
        
        // 플레이어 위치 업데이트
        this.player.x += this.player.velocityX;
        this.player.y += this.player.velocityY;
        
        // 바닥으로 떨어지면 게임오버
        if (this.player.y > this.height) {
            this.gameOver();
            return;
        }
        
        // 공중 플랫폼에서 떨어지면 게임오버 (첫 번째 플랫폼 제외)
        if (this.player.y > this.height - 50 && this.player.x > 200) {
            this.gameOver();
            return;
        }
        
        // 가시 물리 업데이트 (가시가 활성화된 경우에만)
        if (this.spikesEnabled) {
            this.updateSpikePhysics();
            
            // 가시 충돌 검사
            this.checkSpikeCollisions();
        }
        
        // 동전 업데이트 (동전이 활성화된 경우에만)
        if (this.coinsEnabled) {
            this.updateCoins();
            this.checkCoinCollisions();
        }
        
        // 깃발 충돌 검사
        this.checkFlagCollision();
        
        // 플랫폼 충돌 검사
        this.checkPlatformCollisions();
        
        // 카메라 업데이트
        this.updateCamera();
        
        // 점수 업데이트
        this.score = Math.floor(this.player.x / 10);
        document.getElementById('score').textContent = this.score;
        
        // 바닥 충돌 검사 (첫 번째 플랫폼 영역에서만)
        if (this.player.y > this.height - 50 && this.player.x <= 200) {
            this.player.y = this.height - 50;
            this.player.velocityY = 0;
            this.player.onGround = true;
        }
    }
    
    updateSpikePhysics() {
        for (let spike of this.spikes) {
            // 가시에 중력 적용
            spike.velocityY += this.gravity;
            
            // 가시 위치 업데이트
            spike.y += spike.velocityY;
            
            // 가시가 바닥에 떨어지면 게임오버
            if (spike.y > this.height) {
                this.gameOver();
                return;
            }
            
            // 가시가 바닥에 착지
            if (spike.y > this.height - 50) {
                spike.y = this.height - 50;
                spike.velocityY = 0;
                spike.onGround = true;
            }
            
            // 가시가 플랫폼에 착지
            for (let platform of this.platforms) {
                if (this.isColliding(spike, platform)) {
                    if (spike.velocityY > 0 && spike.y < platform.y) {
                        spike.y = platform.y - spike.height;
                        spike.velocityY = 0;
                        spike.onGround = true;
                    }
                }
            }
        }
    }
    
    checkSpikeCollisions() {
        for (let spike of this.spikes) {
            if (this.isColliding(this.player, spike)) {
                this.gameOver();
                return;
            }
        }
    }
    
    updateCoins() {
        for (let coin of this.coins) {
            if (!coin.collected) {
                // 동전 애니메이션 (위아래로 떠다니는 효과)
                coin.animation += 0.1;
                coin.y += Math.sin(coin.animation) * 0.5;
            }
        }
    }
    
    checkCoinCollisions() {
        for (let coin of this.coins) {
            if (!coin.collected && this.isColliding(this.player, coin)) {
                coin.collected = true;
                this.score += 100; // 동전당 100점
                document.getElementById('score').textContent = this.score;
            }
        }
    }
    
    checkFlagCollision() {
        if (this.isColliding(this.player, this.flag)) {
            this.victory();
            return;
        }
    }
    
    checkPlatformCollisions() {
        this.player.onGround = false;
        
        for (let platform of this.platforms) {
            if (this.isColliding(this.player, platform)) {
                // 플랫폼 위에 착지
                if (this.player.velocityY > 0 && 
                    this.player.y < platform.y) {
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.onGround = true;
                }
                // 플랫폼 아래에서 충돌
                else if (this.player.velocityY < 0 && 
                         this.player.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
                // 좌우 충돌
                else if (this.player.velocityX > 0) {
                    this.player.x = platform.x - this.player.width;
                    this.player.velocityX = 0;
                } else if (this.player.velocityX < 0) {
                    this.player.x = platform.x + platform.width;
                    this.player.velocityX = 0;
                }
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateCamera() {
        // 플레이어를 따라 카메라 이동
        this.camera.x = this.player.x - this.width / 2;
        
        // 카메라 경계 제한
        if (this.camera.x < 0) this.camera.x = 0;
    }
    
    render() {
        // 화면 지우기
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 배경 그리기
        this.drawBackground();
        
        // 플랫폼들 그리기
        this.drawPlatforms();
        
        // 가시들 그리기 (가시가 활성화된 경우에만)
        if (this.spikesEnabled) {
            this.drawSpikes();
        }
        
        // 동전들 그리기 (동전이 활성화된 경우에만)
        if (this.coinsEnabled) {
            this.drawCoins();
        }
        
        // 깃발 그리기
        this.drawFlag();
        
        // 플레이어 그리기
        this.drawPlayer();
        
        // UI 그리기
        this.drawUI();
    }
    
    drawBackground() {
        // 하늘 그라디언트
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 구름들
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 200 - this.camera.x * 0.5) % (this.width + 100);
            const y = 50 + Math.sin(i) * 20;
            this.drawCloud(x, y);
        }
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPlatforms() {
        for (let platform of this.platforms) {
            const screenX = platform.x - this.camera.x;
            const screenY = platform.y - this.camera.y;
            
            // 화면에 보이는 플랫폼만 그리기
            if (screenX + platform.width > 0 && screenX < this.width) {
                // 플랫폼 그림자
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.fillRect(screenX + 3, screenY + 3, platform.width, platform.height);
                
                // 플랫폼
                this.ctx.fillStyle = platform.color;
                this.ctx.fillRect(screenX, screenY, platform.width, platform.height);
                
                // 플랫폼 테두리
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(screenX, screenY, platform.width, platform.height);
            }
        }
    }
    
    drawSpikes() {
        for (let spike of this.spikes) {
            const screenX = spike.x - this.camera.x;
            const screenY = spike.y - this.camera.y;
            
            // 화면에 보이는 가시만 그리기
            if (screenX + spike.width > 0 && screenX < this.width) {
                // 가시 그림자
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(screenX + 2, screenY + 2, spike.width, spike.height);
                
                // 가시
                this.ctx.fillStyle = '#8B0000';
                this.ctx.beginPath();
                this.ctx.moveTo(screenX + spike.width / 2, screenY);
                this.ctx.lineTo(screenX, screenY + spike.height);
                this.ctx.lineTo(screenX + spike.width, screenY + spike.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // 가시 테두리
                this.ctx.strokeStyle = '#4B0000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }
    
    drawCoins() {
        for (let coin of this.coins) {
            if (!coin.collected) {
                const screenX = coin.x - this.camera.x;
                const screenY = coin.y - this.camera.y;
                
                // 화면에 보이는 동전만 그리기
                if (screenX + coin.width > 0 && screenX < this.width) {
                    // 동전 그림자
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.fillRect(screenX + 1, screenY + 1, coin.width, coin.height);
                    
                    // 동전 외곽
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX + coin.width/2, screenY + coin.height/2, coin.width/2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 동전 내부
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX + coin.width/2, screenY + coin.height/2, coin.width/2 - 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 동전 테두리
                    this.ctx.strokeStyle = '#B8860B';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    
                    // 동전 반짝임 효과
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.beginPath();
                    this.ctx.arc(screenX + coin.width/2 - 2, screenY + coin.height/2 - 2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawFlag() {
        const screenX = this.flag.x - this.camera.x;
        const screenY = this.flag.y - this.camera.y;
        
        // 화면에 보이는 깃발만 그리기
        if (screenX + this.flag.width > 0 && screenX < this.width) {
            // 깃발 기둥
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(screenX, screenY, 5, this.flag.poleHeight);
            
            // 깃발
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(screenX + 5, screenY, 25, 15);
            
            // 깃발 테두리
            this.ctx.strokeStyle = '#8B0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(screenX + 5, screenY, 25, 15);
            
            // 깃발 움직임 효과
            const waveOffset = Math.sin(Date.now() * 0.01) * 2;
            this.ctx.save();
            this.ctx.translate(screenX + 17.5, screenY + 7.5);
            this.ctx.rotate(waveOffset * 0.1);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('★', 0, 3);
            this.ctx.restore();
        }
    }
    
    drawPlayer() {
        const screenX = this.player.x - this.camera.x;
        const screenY = this.player.y - this.camera.y;
        
        // 플레이어 그림자
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(screenX + 2, screenY + 2, this.player.width, this.player.height);
        
        if (this.isGameOver) {
            // 뼈다귀 그리기
            this.drawSkeleton(screenX, screenY);
        } else {
            // 일반 플레이어 그리기
            this.drawNormalPlayer(screenX, screenY);
        }
        
        // 플레이어 테두리
        this.ctx.strokeStyle = this.isGameOver ? '#666' : '#8B0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(screenX, screenY, this.player.width, this.player.height);
    }
    
    drawNormalPlayer(screenX, screenY) {
        // 플레이어 몸체
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(screenX, screenY, this.player.width, this.player.height);
        
        // 플레이어 얼굴
        this.ctx.fillStyle = '#FFE4B5';
        this.ctx.fillRect(screenX + 5, screenY + 5, 20, 15);
        
        // 눈
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 8, screenY + 8, 3, 3);
        this.ctx.fillRect(screenX + 19, screenY + 8, 3, 3);
        
        // 입
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 12, screenY + 14, 6, 2);
    }
    
    drawSkeleton(screenX, screenY) {
        // 뼈다귀 몸체
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(screenX, screenY, this.player.width, this.player.height);
        
        // 뼈다귀 얼굴
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(screenX + 5, screenY + 5, 20, 15);
        
        // 뼈 눈 (빈 공간)
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 8, screenY + 8, 4, 4);
        this.ctx.fillRect(screenX + 18, screenY + 8, 4, 4);
        
        // 뼈 코
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 13, screenY + 12, 4, 2);
        
        // 뼈 이빨
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(screenX + 10, screenY + 16, 2, 3);
        this.ctx.fillRect(screenX + 13, screenY + 16, 2, 3);
        this.ctx.fillRect(screenX + 16, screenY + 16, 2, 3);
        this.ctx.fillRect(screenX + 19, screenY + 16, 2, 3);
        
        // 뼈 갈비뼈
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(screenX + 8, screenY + 25 + i * 3);
            this.ctx.lineTo(screenX + 22, screenY + 25 + i * 3);
            this.ctx.stroke();
        }
    }
    
    drawUI() {
        // 게임 오버 메시지
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💀 게임 오버! 💀', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`최종 점수: ${this.score}`, this.width / 2, this.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('리셋 버튼을 눌러 다시 시작하세요', this.width / 2, this.height / 2 + 30);
        }
        // 승리 메시지
        else if (this.isVictory) {
            this.ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏆 승리! 🏆', this.width / 2, this.height / 2 - 40);
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(`최종 점수: ${this.score}`, this.width / 2, this.height / 2);
            this.ctx.font = '16px Arial';
            this.ctx.fillText('깃발에 도착했습니다!', this.width / 2, this.height / 2 + 30);
        }
    }
    
    gameLoop() {
        this.handleInput();
        this.updatePhysics();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new Game();
});
