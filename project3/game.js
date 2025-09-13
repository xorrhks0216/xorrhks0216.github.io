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
        
        // 플랫폼들
        this.platforms = [
            { x: 0, y: 350, width: 200, height: 50, color: '#8B4513' },
            { x: 250, y: 320, width: 150, height: 30, color: '#8B4513' },
            { x: 450, y: 280, width: 120, height: 30, color: '#8B4513' },
            { x: 620, y: 250, width: 100, height: 30, color: '#8B4513' },
            { x: 800, y: 300, width: 150, height: 30, color: '#8B4513' },
            { x: 1000, y: 200, width: 120, height: 30, color: '#8B4513' },
            { x: 1200, y: 320, width: 200, height: 30, color: '#8B4513' },
            { x: 1500, y: 250, width: 100, height: 30, color: '#8B4513' },
            { x: 1700, y: 180, width: 150, height: 30, color: '#8B4513' },
            { x: 2000, y: 300, width: 200, height: 50, color: '#8B4513' }
        ];
        
        // 가시 함정들 (물리 시스템 적용)
        this.spikes = [
            // 첫 번째 플랫폼 위의 가시
            { x: 300, y: 290, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 250, platformY: 320 },
            
            // 두 번째 플랫폼 위의 가시
            { x: 500, y: 250, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 450, platformY: 280 },
            
            // 세 번째 플랫폼 위의 가시
            { x: 670, y: 220, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 620, platformY: 250 },
            
            // 네 번째 플랫폼 위의 가시
            { x: 850, y: 270, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 800, platformY: 300 },
            
            // 다섯 번째 플랫폼 위의 가시
            { x: 1050, y: 170, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1000, platformY: 200 },
            
            // 여섯 번째 플랫폼 위의 가시
            { x: 1250, y: 290, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1200, platformY: 320 },
            
            // 일곱 번째 플랫폼 위의 가시
            { x: 1550, y: 220, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1500, platformY: 250 },
            
            // 여덟 번째 플랫폼 위의 가시
            { x: 1750, y: 150, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1700, platformY: 180 }
        ];
        
        // 동전들
        this.coins = [
            { x: 300, y: 280, width: 15, height: 15, collected: false, animation: 0 },
            { x: 500, y: 240, width: 15, height: 15, collected: false, animation: 0 },
            { x: 670, y: 210, width: 15, height: 15, collected: false, animation: 0 },
            { x: 850, y: 260, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1050, y: 160, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1250, y: 280, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1550, y: 210, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1750, y: 140, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1900, y: 250, width: 15, height: 15, collected: false, animation: 0 },
            { x: 2100, y: 270, width: 15, height: 15, collected: false, animation: 0 }
        ];
        
        // 깃발 (승리 목표)
        this.flag = {
            x: 2200,
            y: 250,
            width: 30,
            height: 100,
            poleHeight: 80
        };
        
        // 키 입력 상태
        this.keys = {};
        
        // 물리 상수
        this.gravity = 0.8;
        this.friction = 0.8;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
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
        
        // 가시들 초기 위치로 리셋
        this.spikes = [
            { x: 300, y: 290, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 250, platformY: 320 },
            { x: 500, y: 250, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 450, platformY: 280 },
            { x: 670, y: 220, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 620, platformY: 250 },
            { x: 850, y: 270, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 800, platformY: 300 },
            { x: 1050, y: 170, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1000, platformY: 200 },
            { x: 1250, y: 290, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1200, platformY: 320 },
            { x: 1550, y: 220, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1500, platformY: 250 },
            { x: 1750, y: 150, width: 20, height: 20, velocityY: 0, onGround: false, platformX: 1700, platformY: 180 }
        ];
        
        // 동전들 초기 상태로 리셋
        this.coins = [
            { x: 300, y: 280, width: 15, height: 15, collected: false, animation: 0 },
            { x: 500, y: 240, width: 15, height: 15, collected: false, animation: 0 },
            { x: 670, y: 210, width: 15, height: 15, collected: false, animation: 0 },
            { x: 850, y: 260, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1050, y: 160, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1250, y: 280, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1550, y: 210, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1750, y: 140, width: 15, height: 15, collected: false, animation: 0 },
            { x: 1900, y: 250, width: 15, height: 15, collected: false, animation: 0 },
            { x: 2100, y: 270, width: 15, height: 15, collected: false, animation: 0 }
        ];
        
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
    
    handleInput() {
        // 게임이 시작되지 않은 상태에서 방향키 입력 시 게임 시작
        if (!this.isRunning && !this.isVictory && (this.keys['a'] || this.keys['d'] || this.keys['arrowleft'] || this.keys['arrowright'] || this.keys['w'] || this.keys['arrowup'])) {
            this.startGame();
            return;
        }
        
        // 게임오버 상태에서 방향키 입력 시 게임 재시작
        if (this.isGameOver && (this.keys['a'] || this.keys['d'] || this.keys['arrowleft'] || this.keys['arrowright'] || this.keys['w'] || this.keys['arrowup'])) {
            this.resetGame();
            this.startGame();
            return;
        }
        
        if (!this.isRunning) return;
        
        // 좌우 이동
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.player.velocityX = -this.player.speed;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            this.player.velocityX = this.player.speed;
        } else {
            this.player.velocityX *= this.friction;
        }
        
        // 점프
        if ((this.keys['w'] || this.keys['arrowup']) && this.player.onGround) {
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
