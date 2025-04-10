const playerButtons = document.querySelectorAll('.player-button');
let selectedPlayerCount = 1;
const gameSettingsScreen = document.getElementById('game-settings-screen');
const gameScreen = document.getElementById('game-screen');
const gameBoard = document.querySelector('.game-board');
const playerInfo = document.querySelector('.player-info');
const rollDiceButton = document.getElementById('roll-dice');
const endTurnButton = document.getElementById('end-turn');
let dice1 = document.getElementById('dice1');
let dice2 = document.getElementById('dice2');
const devModeToggle = document.getElementById('dev-mode-toggle');
const devDiceInput = document.getElementById('dev-dice-input');
const devDice1 = document.getElementById('dev-dice1');
const devDice2 = document.getElementById('dev-dice2');
const devRollDiceButton = document.getElementById('dev-roll-dice');

// 테스트 플래그 제거
let isTestMode = false;
let testDiceCombination = null;

let currentPlayer = 1;
let playerPieces = [];
let playerPositions = [];
let isDiceRolled = false;
let currentDiceSum = 0;
let playerFunds = []; // 플레이어별 자금을 저장하는 배열
let playerSalaryReceived = []; // 플레이어별 월급 수령 여부를 저장하는 배열
let playerProperties = []; // 플레이어별 소유 도시 정보를 저장하는 배열
let cityBuildings = []; // 도시별 건물 정보를 저장하는 배열
let isJumpSelectionMode = false;
let jumpSelectionPlayer = null;

// 도시 소유자 정보를 저장하는 배열 추가
let cityOwners = Array(121).fill(null);

const CellType = {
    REGION: 'region',           // 지역
    ISLAND: 'island',           // 섬
    SPECIAL_CARD: 'special_card', // 스페셜카드
    JUMP: 'jump',               // 점프
    DESERT_ISLAND: 'desert_island', // 무인도
    BIRTHDAY_PARTY: 'birthday_party', // 생일파티
    BIRTHDAY_FUND: 'birthday_fund', // 생일파티 기금 모금
    START: 'start'              // 출발
};

const gameCells = [
    { position: 0, type: CellType.DESERT_ISLAND, name: "무인도", description: "무인도에 도착했습니다" },
    { 
        position: 1, 
        type: CellType.REGION, 
        name: "라스베가스", 
        description: "세계적인 도박의 도시", 
        price: 83,
        rent: {
            base: 14,
            pension1: 42,
            pension2: 120,
            pension3: 310, 
            pension4: 380,
            hotel: 445
        },
        buildingCost: {
            pension: 50,
            hotel: 280
        }
    },
    { position: 2, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다." },
    { 
        position: 3, 
        type: CellType.REGION, 
        name: "모스크바", 
        description: "러시아의 수도", 
        price: 85,
        rent: {
            base: 15,
            pension1: 43,
            pension2: 128,
            pension3: 318,
            pension4: 388   ,
            hotel: 455
        },
        buildingCost: {
            pension: 50,
            hotel: 280
        }
    },
    { 
        position: 4, 
        type: CellType.REGION, 
        name: "베를린", 
        description: "독일의 수도", 
        price: 95,
        rent: {
            base: 16,
            pension1: 45,
            pension2: 132,
            pension3: 325,
            pension4: 395,
            hotel: 465
        },
        buildingCost: {
            pension: 50,
            hotel: 280
        }
    },
    { 
        position: 5, 
        type: CellType.ISLAND, 
        name: "하와이", 
        description: "태평양의 휴양지", 
        price: 140,
        rent: {
            base: 14,
            pension1: 28,
            pension2: 56,
            pension3: 112,
            pension4: 224,
            hotel: 420
        },
        buildingCost: {
            pension: 70,
            hotel: 210
        }
    },
    { 
        position: 6, 
        type: CellType.REGION, 
        name: "홍콩", 
        description: "아시아의 금융 중심지", 
        price: 105,
        rent: {
            base: 16,
            pension1: 48,
            pension2: 144,
            pension3: 340,
            pension4: 410,
            hotel: 485
        },
        buildingCost: {
            pension: 60,
            hotel: 320
        }
    },
    { 
        position: 7, 
        type: CellType.REGION, 
        name: "도쿄", 
        description: "일본의 수도", 
        price: 110,
        rent: {
            base: 17,
            pension1: 50,
            pension2: 148,
            pension3: 345,
            pension4: 415,
            hotel: 490
        },
        buildingCost: {
            pension: 60,
            hotel: 320
        }
    },
    { position: 8, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { 
        position: 9, 
        type: CellType.REGION, 
        name: "워싱턴", 
        description: "미국의 수도", 
        price: 115,
        rent: {
            base: 17,
            pension1: 52,
            pension2: 155,
            pension3: 355,
            pension4: 425,
            hotel: 495
        },
        buildingCost: {
            pension: 60,
            hotel: 320
        }
    },
    { position: 10, type: CellType.BIRTHDAY_PARTY, name: "생일", description: "생일 칸입니다", price: 0, rent: 0 },
    { 
        position: 11, 
        type: CellType.REGION, 
        name: "스톡홀름", 
        description: "스웨덴의 수도", 
        price: 80,
        rent: {
            base: 14,
            pension1: 40,
            pension2: 125,
            pension3: 320,
            pension4: 358,
            hotel: 460
        },
        buildingCost: {
            pension: 45,
            hotel: 240
        }
    },
    { 
        position: 21, 
        type: CellType.REGION, 
        name: "파리", 
        description: "프랑스의 수도", 
        price: 115,
        rent: {
            base: 18,
            pension1: 55,
            pension2: 160,
            pension3: 360,
            pension4: 430,
            hotel: 500
        },
        buildingCost: {
            pension: 70,
            hotel: 360
        }
    },
    { position: 22, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { position: 32, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { 
        position: 33, 
        type: CellType.REGION, 
        name: "코펜하겐", 
        description: "덴마크의 수도", 
        price: 77,
        rent: {
            base: 13,
            pension1: 39,
            pension2: 115,
            pension3: 310,
            pension4: 370,
            hotel: 450
        },
        buildingCost: {
            pension: 45,
            hotel: 240
        }
    },
    { 
        position: 43, 
        type: CellType.REGION, 
        name: "로마", 
        description: "이탈리아의 수도", 
        price: 125,
        rent: {
            base: 19,
            pension1: 57,
            pension2: 170,
            pension3: 370,
            pension4: 450,
            hotel: 520
        },
        buildingCost: {
            pension: 70,
            hotel: 360
        }
    },
    { 
        position: 44, 
        type: CellType.REGION, 
        name: "헬싱키", 
        description: "핀란드의 수도", 
        price: 72,
        rent: {
            base: 13,
            pension1: 38,
            pension2: 100,
            pension3: 260,
            pension4: 330,
            hotel: 430
        },
        buildingCost: {
            pension: 45,
            hotel: 240
        }
    },
    { 
        position: 54, 
        type: CellType.REGION, 
        name: "런던", 
        description: "영국의 수도", 
        price: 130,
        rent: {
            base: 20,
            pension1: 62,
            pension2: 180,
            pension3: 400,
            pension4: 480,
            hotel: 560
        },
        buildingCost: {
            pension: 70,
            hotel: 360
        }
    },
    { 
        position: 55, 
        type: CellType.ISLAND, 
        name: "사이판", 
        description: "태평양의 휴양지", 
        price: 130,
        rent: {
            base: 13,
            pension1: 26,
            pension2: 52,
            pension3: 104,
            pension4: 208,
            hotel: 390
        },
        buildingCost: {
            pension: 65,
            hotel: 195
        }
    },
    { 
        position: 65, 
        type: CellType.ISLAND, 
        name: "독도", 
        description: "대한민국의 섬", 
        price: 120,
        rent: {
            base: 12,
            pension1: 24,
            pension2: 48,
            pension3: 96,
            pension4: 192,
            hotel: 360
        },
        buildingCost: {
            pension: 60,
            hotel: 180
        }
    },
    { 
        position: 66, 
        type: CellType.REGION, 
        name: "베이징", 
        description: "중국의 수도", 
        price: 67,
        rent: {
            base: 12,
            pension1: 35,
            pension2: 90,
            pension3: 240,
            pension4: 325,
            hotel: 400
        },
        buildingCost: {
            pension: 40,
            hotel: 200
        }
    },
    { 
        position: 76, 
        type: CellType.REGION, 
        name: "뉴욕", 
        description: "미국의 경제 중심지", 
        price: 135,
        rent: {
            base: 21,
            pension1: 68,
            pension2: 200,
            pension3: 420,
            pension4: 500,
            hotel: 590
        },
        buildingCost: {
            pension: 80,
            hotel: 400
        }
    },
    { 
        position: 77, 
        type: CellType.REGION, 
        name: "싱가포르", 
        description: "아시아의 금융 중심지", 
        price: 65,
        rent: {
            base: 11,
            pension1: 32,
            pension2: 85,
            pension3: 220,
            pension4: 320,
            hotel: 380
        },
        buildingCost: {
            pension: 40,
            hotel: 200
        }
    },
    { 
        position: 87, 
        type: CellType.REGION, 
        name: "부산", 
        description: "대한민국의 제2도시", 
        price: 140,
        rent: {
            base: 22,
            pension1: 72,
            pension2: 210,
            pension3: 450,
            pension4: 530,
            hotel: 610
        },
        buildingCost: {
            pension: 80,
            hotel: 400
        }
    },
    { position: 88, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { position: 98, type: CellType.BIRTHDAY_FUND, name: "생일축하금", description: "생일축하금 칸입니다", price: 0, rent: 0 },
    { 
        position: 99, 
        type: CellType.REGION, 
        name: "방콕", 
        description: "태국의 수도", 
        price: 60,
        rent: {
            base: 10,
            pension1: 30,
            pension2: 80,
            pension3: 200,
            pension4: 310,
            hotel: 360
        },
        buildingCost: {
            pension: 40,
            hotel: 200
        }
    },
    { 
        position: 109, 
        type: CellType.REGION, 
        name: "서울", 
        description: "대한민국의 수도", 
        price: 160,
        rent: {
            base: 23,
            pension1: 80,
            pension2: 240,
            pension3: 560,
            pension4: 680,
            hotel: 800
        },
        buildingCost: {
            pension: 80,
            hotel: 400
        }
    },
    { position: 110, type: CellType.JUMP, name: "코너점프", description: "코너점프 칸입니다", price: 0, rent: 0 },
    { 
        position: 111, 
        type: CellType.REGION, 
        name: "트리폴리", 
        description: "리비아의 수도", 
        price: 55,
        rent: {
            base: 9,
            pension1: 25,
            pension2: 70,
            pension3: 180,
            pension4: 280,
            hotel: 340
        },
        buildingCost: {
            pension: 30,
            hotel: 150
        }
    },
    { position: 112, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { 
        position: 113, 
        type: CellType.REGION, 
        name: "바르샤바", 
        description: "폴란드의 수도", 
        price: 52,
        rent: {
            base: 8,
            pension1: 22,
            pension2: 65,
            pension3: 150,
            pension4: 260,
            hotel: 320
        },
        buildingCost: {
            pension: 30,
            hotel: 150
        }
    },
    { 
        position: 114, 
        type: CellType.REGION, 
        name: "카이로", 
        description: "이집트의 수도", 
        price: 45,
        rent: {
            base: 7,
            pension1: 20,
            pension2: 50,
            pension3: 130,
            pension4: 240,
            hotel: 300
        },
        buildingCost: {
            pension: 30,
            hotel: 150
        }
    },
    { 
        position: 115, 
        type: CellType.ISLAND, 
        name: "괌", 
        description: "태평양의 휴양지", 
        price: 140,
        rent: {
            base: 14,
            pension1: 28,
            pension2: 56,
            pension3: 112,
            pension4: 224,
            hotel: 420
        },
        buildingCost: {
            pension: 70,
            hotel: 210
        }
    },
    { 
        position: 116, 
        type: CellType.REGION, 
        name: "멕시코시티", 
        description: "멕시코의 수도", 
        price: 35,
        rent: {
            base: 6,
            pension1: 18,
            pension2: 40,
            pension3: 120,
            pension4: 200,
            hotel: 280
        },
        buildingCost: {
            pension: 20,
            hotel: 100
        }
    },
    { 
        position: 117, 
        type: CellType.REGION, 
        name: "브라질리아", 
        description: "브라질의 수도", 
        price: 28,
        rent: {
            base: 5,
            pension1: 15,
            pension2: 35,
            pension3: 110,
            pension4: 180,
            hotel: 250
        },
        buildingCost: {
            pension: 20,
            hotel: 100
        }
    },
    { position: 118, type: CellType.SPECIAL_CARD, name: "스페셜 카드", description: "스페셜 카드를 한장 뽑습니다.", price: 0, rent: 0 },
    { 
        position: 119, 
        type: CellType.REGION, 
        name: "산티아고", 
        description: "칠레의 수도", 
        price: 25,
        rent: {
            base: 4,
            pension1: 10,
            pension2: 32,
            pension3: 100,
            pension4: 160,
            hotel: 220
        },
        buildingCost: {
            pension: 20,
            hotel: 100
        }
    },
    { position: 120, type: CellType.START, name: "출발점", description: "게임의 출발점입니다", price: 0, rent: 0 }
];

// 플레이어 수 버튼 이벤트 리스너
document.querySelectorAll('.player-button').forEach(button => {
    button.addEventListener('click', function() {
        // 모든 버튼에서 active 클래스 제거
        document.querySelectorAll('.player-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 클릭된 버튼에 active 클래스 추가
        this.classList.add('active');
        
        // 선택된 플레이어 수 업데이트
        selectedPlayerCount = parseInt(this.dataset.value);
    });
});

// 게임 설정 폼 제출
document.getElementById('game-settings').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const initialFunds = parseInt(document.getElementById('initial-funds').value);
    
    // 게임판 생성
    createGameBoard();
    
    // 플레이어 정보 생성
    createPlayerInfo(initialFunds);
    
    // 플레이어 자금 초기화
    playerFunds = Array(selectedPlayerCount).fill(initialFunds);
    // 플레이어별 월급 수령 여부 초기화
    playerSalaryReceived = Array(selectedPlayerCount).fill(false);
    // 플레이어별 소유 도시 초기화
    playerProperties = Array(selectedPlayerCount).fill([]);
    // 도시별 건물 정보 초기화
    cityBuildings = Array(121).fill({ pensions: 0, hotel: false });
    // 도시 소유자 정보 초기화
    cityOwners = Array(121).fill(null);
    
    // 화면 전환
    gameSettingsScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    // 첫 번째 플레이어의 턴 시작
    startPlayerTurn();
});

// 버튼 상태 관리 함수
function updateButtonStates(isDicePhase) {
    if (isDicePhase) {
        // 주사위 던지기 단계
        rollDiceButton.style.display = 'block';
        rollDiceButton.disabled = false;
        endTurnButton.style.display = 'none';
    } else {
        // 턴 종료 단계
        rollDiceButton.style.display = 'none';
        endTurnButton.style.display = 'block';
    }
}

let isDevMode = false;

// 개발자 모드 토글 이벤트 리스너
devModeToggle.addEventListener('change', function() {
    isDevMode = this.checked;
    if (isDevMode) {
        devDiceInput.classList.remove('hidden');
    } else {
        devDiceInput.classList.add('hidden');
    }
});

// 개발자 모드 주사위 적용 버튼 이벤트 리스너
devRollDiceButton.addEventListener('click', function() {
    const dice1Value = parseInt(devDice1.value);
    const dice2Value = parseInt(devDice2.value);
    
    if (dice1Value < 1 || dice1Value > 6 || dice2Value < 1 || dice2Value > 6) {
        alert('주사위 값은 1부터 6 사이여야 합니다.');
        return;
    }
    
    dice1.textContent = dice1Value;
    dice2.textContent = dice2Value;
    currentDiceSum = dice1Value + dice2Value;
    
    showAdditionProblem(dice1Value, dice2Value);
});

// 주사위 굴리기 함수 수정
async function rollDice() {
    if (!isDiceRolled) {
        if (isDevMode) {
            devDiceInput.classList.remove('hidden');
            return;
        }

        // 주사위 요소 가져오기
        const dice1Element = document.getElementById('dice1');
        const dice2Element = document.getElementById('dice2');
        
        if (!dice1Element || !dice2Element) {
            console.error('주사위 요소를 찾을 수 없습니다.');
            return;
        }

        // 주사위 던지기 버튼 비활성화
        rollDiceButton.disabled = true;
        
        const dice1Value = Math.floor(Math.random() * 6) + 1;
        const dice2Value = Math.floor(Math.random() * 6) + 1;

        // 주사위 애니메이션
        dice1Element.classList.add('rolling');
        dice2Element.classList.add('rolling');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        dice1.textContent = dice1Value;
        dice2.textContent = dice2Value;
        currentDiceSum = dice1Value + dice2Value;

        dice1Element.classList.remove('rolling');
        dice2Element.classList.remove('rolling');
        
        showAdditionProblem(dice1Value, dice2Value);
    }
}

// 덧셈 문제 표시 함수
function showAdditionProblem(dice1Value, dice2Value) {
    const additionProblemOverlay = document.querySelector('.addition-problem-overlay');
    const dice1ValueSpan = document.getElementById('dice1-value');
    const dice2ValueSpan = document.getElementById('dice2-value');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    
    // 문제 표시
    dice1ValueSpan.textContent = dice1Value;
    dice2ValueSpan.textContent = dice2Value;
    answerInput.textContent = '?';
    answerInput.style.color = '#333';
    
    // 오버레이 표시
    additionProblemOverlay.classList.remove('hidden');
    
    let currentAnswer = '';
    
    // 숫자 버튼 이벤트 리스너 추가
    const numberButtons = document.querySelectorAll('.number-button');
    numberButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('clear')) {
                currentAnswer = '';
                answerInput.textContent = '?';
                return;
            }
            
            if (currentAnswer.length < 2) {
                currentAnswer += this.textContent;
                answerInput.textContent = currentAnswer;
            }
        });
    });
    
    // 정답 제출 버튼 이벤트 리스너
    submitButton.onclick = function() {
        const userAnswer = parseInt(currentAnswer);
        const correctAnswer = dice1Value + dice2Value;
        
        if (userAnswer === correctAnswer) {
            // 정답일 경우
            answerInput.style.color = '#4CAF50';
            setTimeout(() => {
                additionProblemOverlay.classList.add('hidden');
                // 이동 처리
                movePlayer(currentPlayer, dice1Value + dice2Value);
            }, 200);
        } else {
            // 오답일 경우
            answerInput.style.color = '#f44336';
            setTimeout(() => {
                currentAnswer = '';
                answerInput.textContent = '?';
                answerInput.style.color = '#333';
            }, 1000);
        }
    };
}

// 턴 종료 버튼 클릭 처리
endTurnButton.addEventListener('click', function() {
    // 다음 플레이어로 턴 넘기기
    currentPlayer = currentPlayer % selectedPlayerCount + 1;
    updatePlayerTurn();
    
    // 주사위 초기화
    dice1.textContent = '0';
    dice2.textContent = '0';
    isDiceRolled = false;
    currentDiceSum = 0;
    
    // 버튼 상태 변경
    updateButtonStates(true);
    
    // 현재 플레이어의 월급 수령 상태 초기화
    playerSalaryReceived[currentPlayer - 1] = false;
    
    // 현재 플레이어의 위치 정보 업데이트
    updateCityInfo(playerPositions[currentPlayer - 1]);
});

// 플레이어 턴 시작 처리
function startPlayerTurn() {
    updatePlayerTurn();
    updateButtonStates(true);
    isDiceRolled = false;
    currentDiceSum = 0;
}

// 게임판 생성 함수
function createGameBoard() {
    gameBoard.innerHTML = '';
    
    // 11x11 게임판 생성
    for (let i = 0; i < 121; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        
        // 테두리 칸만 표시
        const row = Math.floor(i / 11);
        const col = i % 11;
        if (row === 0 || row === 10 || col === 0 || col === 10) {
            if (i !== 110) { // 110은 점프칸 위치
                cell.classList.add('border-cell');
            }
        }
        
        // 출발칸 설정 (오른쪽 아래)
        if (i === 120) {
            cell.classList.add('start');
        }
        
        // 특수 칸 설정
        switch(i) {
            case 0: cell.classList.add('muindo'); break;
            case 1: cell.classList.add('lasvegas'); break;
            case 2: cell.classList.add('special1'); break;
            case 3: cell.classList.add('moscow'); break;
            case 4: cell.classList.add('berlin'); break;
            case 5: cell.classList.add('hawaii'); break;
            case 6: cell.classList.add('hongkong'); break;
            case 7: cell.classList.add('tokyo'); break;
            case 8: cell.classList.add('special1'); break;
            case 9: cell.classList.add('washington'); break;
            case 10: cell.classList.add('birthday'); break;
            case 11: cell.classList.add('stockholm'); break;
            case 21: cell.classList.add('paris'); break;
            case 22: cell.classList.add('special2'); break;
            case 32: cell.classList.add('special2'); break;
            case 33: cell.classList.add('copenhagen'); break;
            case 43: cell.classList.add('rome'); break;
            case 44: cell.classList.add('helsinki'); break;
            case 54: cell.classList.add('london'); break;
            case 55: cell.classList.add('saipan'); break;
            case 65: cell.classList.add('dokdo'); break;
            case 66: cell.classList.add('beijing'); break;
            case 76: cell.classList.add('new-york'); break;
            case 77: cell.classList.add('singapore'); break;
            case 87: cell.classList.add('busan'); break;
            case 88: cell.classList.add('special2'); break;
            case 98: cell.classList.add('pay-birthday'); break;
            case 99: cell.classList.add('bangkok'); break;
            case 109: cell.classList.add('seoul'); break;
            case 110: cell.classList.add('corner-jump'); break;
            case 111: cell.classList.add('tripoli'); break;
            case 112: cell.classList.add('special1'); break;
            case 113: cell.classList.add('warszawa'); break;
            case 114: cell.classList.add('cairo'); break;
            case 115: cell.classList.add('guam'); break;
            case 116: cell.classList.add('mexico-city'); break;
            case 117: cell.classList.add('brasilia'); break;
            case 118: cell.classList.add('special1'); break;
            case 119: cell.classList.add('santiago'); break;
        }
        
        // 소유자 정보가 있는 경우 테두리 추가
        if (cityOwners[i] !== null) {
            cell.classList.add(`owned-by-player-${cityOwners[i]}`);
        }
        
        gameBoard.appendChild(cell);
    }
    
    // 플레이어 말 생성
    playerPieces = [];
    playerPositions = [];
    for (let i = 1; i <= selectedPlayerCount; i++) {
        const startCell = gameBoard.children[120];
        const playerPiece = document.createElement('div');
        playerPiece.className = 'player-piece';
        playerPiece.setAttribute('data-player', i);
        startCell.appendChild(playerPiece);
        playerPieces.push(playerPiece);
        playerPositions.push(120);
    }
}

// 플레이어 정보 생성 함수
function createPlayerInfo(initialFunds) {
    playerInfo.innerHTML = '';
    
    for (let i = 1; i <= selectedPlayerCount; i++) {
        const playerStatus = document.createElement('div');
        playerStatus.className = 'player-status';
        playerStatus.innerHTML = `
            <div class="player-status-header">
                <div class="player-piece-indicator" data-player="${i}"></div>
                <div>플레이어 ${i}</div>
            </div>
            <div>자금: <span class="player-funds">${initialFunds}</span>만원</div>
        `;
        playerInfo.appendChild(playerStatus);
    }
    
    // 첫 번째 플레이어 활성화
    updatePlayerTurn();
}

// 플레이어 턴 업데이트
function updatePlayerTurn() {
    const playerStatuses = document.querySelectorAll('.player-status');
    playerStatuses.forEach((status, index) => {
        if (index + 1 === currentPlayer) {
            status.classList.add('active');
        } else {
            status.classList.remove('active');
        }
    });
}

// 도시 정보 업데이트 함수
function updateCityInfo(position, checkBuildingEligibility = false) {
    const cityName = document.getElementById('city-name');
    const cityDescription = document.getElementById('city-description');
    const cityPrice = document.getElementById('city-price');
    const cityRent = document.getElementById('city-rent');
    const currentPosition = document.getElementById('current-position');
    const locationImage = document.querySelector('.location-image');
    const buyPropertyButton = document.getElementById('buy-property');
    const buildingActions = document.querySelector('.building-actions');
    const buildPensionButton = document.getElementById('build-pension');
    const buildHotelButton = document.getElementById('build-hotel');

    // 현재 위치 표시
    currentPosition.textContent = position;

    // 도시 정보 업데이트
    const city = gameCells.find(c => c.position === position);
    if (city) {
        cityName.textContent = city.name;
        cityDescription.textContent = city.description;
        cityPrice.textContent = `${city.price}만원`;
        cityRent.textContent = `${calculateRent(position)}만원`;
        
        // 도시 이미지 설정
        let imagePath = '';
        switch(position) {
            case 0: imagePath = 'images/muindo.jpg'; break;
            case 1: imagePath = 'images/lasvegas.jpg'; break;
            case 2: imagePath = 'images/special1.jpg'; break;
            case 3: imagePath = 'images/moscow.jpg'; break;
            case 4: imagePath = 'images/berlin.jpg'; break;
            case 5: imagePath = 'images/hawaii.jpg'; break;
            case 6: imagePath = 'images/hongkong.jpg'; break;
            case 7: imagePath = 'images/tokyo.jpg'; break;
            case 8: imagePath = 'images/special1.jpg'; break;
            case 9: imagePath = 'images/washington.jpg'; break;
            case 10: imagePath = 'images/birthday.jpg'; break;
            case 11: imagePath = 'images/stockholm.jpg'; break;
            case 21: imagePath = 'images/paris.jpg'; break;
            case 22: imagePath = 'images/special2.jpg'; break;
            case 32: imagePath = 'images/special2.jpg'; break;
            case 33: imagePath = 'images/copenhagen.jpg'; break;
            case 43: imagePath = 'images/rome.jpg'; break;
            case 44: imagePath = 'images/helsinki.jpg'; break;
            case 54: imagePath = 'images/london.jpg'; break;
            case 55: imagePath = 'images/saipan.jpg'; break;
            case 65: imagePath = 'images/dokdo.jpg'; break;
            case 66: imagePath = 'images/beijing.jpg'; break;
            case 76: imagePath = 'images/new_york.jpg'; break;
            case 77: imagePath = 'images/singapore.jpg'; break;
            case 87: imagePath = 'images/busan.jpg'; break;
            case 88: imagePath = 'images/special2.jpg'; break;
            case 98: imagePath = 'images/pay_birthday.jpg'; break;
            case 99: imagePath = 'images/bangkok.jpg'; break;
            case 109: imagePath = 'images/seoul.jpg'; break;
            case 110: imagePath = 'images/corner_jump.jpg'; break;
            case 111: imagePath = 'images/tripoli.jpg'; break;
            case 112: imagePath = 'images/special1.jpg'; break;
            case 113: imagePath = 'images/warszawa.jpg'; break;
            case 114: imagePath = 'images/cairo.jpg'; break;
            case 115: imagePath = 'images/guam.jpg'; break;
            case 116: imagePath = 'images/mexico_city.jpg'; break;
            case 117: imagePath = 'images/brasilia.jpg'; break;
            case 118: imagePath = 'images/special1.jpg'; break;
            case 119: imagePath = 'images/santiago.jpg'; break;
            case 120: imagePath = 'images/start.jpg'; break;
            default: imagePath = '';
        }
        
        if (imagePath) {
            locationImage.style.backgroundImage = `url(${imagePath})`;
            locationImage.style.display = 'block';
        } else {
            locationImage.style.backgroundImage = 'none';
            locationImage.style.display = 'none';
        }

        // 땅 구매/건물 건설 버튼 상태 업데이트
        const isOwned = cityOwners[position] !== null;
        const isSpecialCell = city.price === 0;
        const buildings = cityBuildings[position];
        
        if (!isSpecialCell) {
            if (!isOwned) {
                // 땅 구매 버튼 표시
                buyPropertyButton.style.display = 'block';
                buildingActions.style.display = 'none';
                buyPropertyButton.disabled = playerFunds[currentPlayer - 1] < city.price;
            } else if (cityOwners[position] === currentPlayer) {
                // 건물 건설 버튼 표시 (소유자인 경우)
                buyPropertyButton.style.display = 'none';
                buildingActions.style.display = 'flex';
                
                if (checkBuildingEligibility) {
                    // 펜션 건설 가능 여부
                    buildPensionButton.disabled = buildings.pensions >= 4 || playerFunds[currentPlayer - 1] < city.buildingCost.pension;
                    
                    // 호텔 건설 가능 여부
                    buildHotelButton.disabled = buildings.pensions < 4 || buildings.hotel || playerFunds[currentPlayer - 1] < city.buildingCost.hotel;
                } else {
                    // 건물 건설 비활성화
                    buildPensionButton.disabled = true;
                    buildHotelButton.disabled = true;
                }
            } else {
                // 다른 플레이어의 땅인 경우
                buyPropertyButton.style.display = 'none';
                buildingActions.style.display = 'none';
            }
        } else {
            buyPropertyButton.style.display = 'none';
            buildingActions.style.display = 'none';
        }
    } else {
        cityName.textContent = "-";
        cityDescription.textContent = "일반 칸";
        cityPrice.textContent = "가격: -";
        cityRent.textContent = "임대료: -";
        locationImage.style.backgroundImage = 'none';
        locationImage.style.display = 'none';
        buyPropertyButton.style.display = 'none';
        buildingActions.style.display = 'none';
    }
}

// 플레이어 자금 업데이트 함수
function updatePlayerFunds(player, amount) {
    playerFunds[player - 1] += amount;
    const playerStatus = document.querySelectorAll('.player-status')[player - 1];
    const fundsElement = playerStatus.querySelector('.player-funds');
    fundsElement.textContent = playerFunds[player - 1];
}

// 플레이어 말 이동 함수
async function movePlayer(player, steps, speed = 300) {
    let currentPosition = playerPositions[player - 1];
    const piece = playerPieces[player - 1];
    const startPosition = 120; // 출발칸 위치
    const oldPosition = currentPosition; // 이동 전 위치 저장
    let currentCell = gameBoard.children[currentPosition];
    let passedStartPoint = false; // 출발점을 지나갔는지 여부
    
    // 이동 애니메이션
    for (let i = 0; i < steps; i++) {
        const newPosition = getNextPosition(currentPosition);
        
        // 말 이동 애니메이션
        piece.classList.add('moving');
        await new Promise(resolve => setTimeout(resolve, speed));
        piece.classList.remove('moving');
        
        // 말 위치 업데이트
        const newCell = gameBoard.children[newPosition];
        
        currentCell.removeChild(piece);
        newCell.appendChild(piece);
        
        currentPosition = newPosition;
        currentCell = newCell;
        await new Promise(resolve => setTimeout(resolve, speed / 3));

        // 출발점을 지나가거나 도착했는지 체크하고 월급 지급
        if ((currentPosition > newPosition && currentPosition > startPosition) || newPosition === startPosition) {
            if (!playerSalaryReceived[player - 1]) {
                updatePlayerFunds(player, 80);
                alert(`월급 80만원을 받았습니다!`);
                playerSalaryReceived[player - 1] = true;
            }
        }
    }
    
    playerPositions[player - 1] = currentPosition;
    
    // 도시 정보 업데이트
    updateCityInfo(currentPosition, true);
    
    // 다른 플레이어의 땅에 도착한 경우 임대료 지불
    const city = gameCells.find(c => c.position === currentPosition);
    if (city && cityOwners[currentPosition] !== null && cityOwners[currentPosition] !== player) {
        const rent = calculateRent(currentPosition);
        if (playerFunds[player - 1] >= rent) {
            updatePlayerFunds(player, -rent);
            updatePlayerFunds(cityOwners[currentPosition], rent);
            alert(`플레이어 ${cityOwners[currentPosition]}님의 땅에 도착했습니다. 임대료 ${rent}만원을 지불했습니다.`);
        } else {
            alert(`임대료 ${rent}만원을 지불할 자금이 부족합니다. 파산했습니다!`);
            // 게임 종료 처리 추가 필요
        }
    }
    
    // 점프칸에 도달했을 때
    if (currentCell.classList.contains('corner-jump')) {
        const jumpCost = 10;
        if (playerFunds[player - 1] >= jumpCost) {
            if (confirm(`점프칸에 도착했습니다! 10만원을 지불하고 원하는 칸으로 이동하시겠습니까?`)) {
                updatePlayerFunds(player, -jumpCost);
                showJumpSelection(player);
                return;
            }
        } else {
            alert(`자금이 부족하여 점프칸을 사용할 수 없습니다.`);
        }
    }

    // 이동이 완료된 후 버튼 상태 변경
    updateButtonStates(false);
}

// 다음 위치 계산 함수
function getNextPosition(currentPosition) {
    const row = Math.floor(currentPosition / 11);
    const col = currentPosition % 11;
    
    // 오른쪽으로 이동
    if (row === 0 && col < 10) {
        return currentPosition + 1;
    }
    // 아래로 이동
    else if (col === 10 && row < 10) {
        return currentPosition + 11;
    }
    // 왼쪽으로 이동
    else if (row === 10 && col > 0) {
        return currentPosition - 1;
    }
    // 위로 이동
    else if (col === 0 && row > 0) {
        return currentPosition - 11;
    }
    // 시작점으로 돌아가기
    else {
        return 120;
    }
}

// 땅 구매 버튼 클릭 처리
document.getElementById('buy-property').addEventListener('click', function() {
    const currentPosition = playerPositions[currentPlayer - 1];
    const city = gameCells.find(c => c.position === currentPosition);
    
    if (city && playerFunds[currentPlayer - 1] >= city.price) {
        if (confirm(`${city.name}을(를) ${city.price}만원에 구매하시겠습니까?`)) {
            updatePlayerFunds(currentPlayer, -city.price);
            playerProperties[currentPlayer - 1].push(currentPosition);
            // 도시 소유자 정보 업데이트
            cityOwners[currentPosition] = currentPlayer;
            
            // 셀 테두리 업데이트
            const cell = gameBoard.children[currentPosition];
            // 기존 소유자 클래스 제거
            cell.classList.remove('owned-by-player-1', 'owned-by-player-2', 'owned-by-player-3', 'owned-by-player-4');
            // 새로운 소유자 클래스 추가
            cell.classList.add(`owned-by-player-${currentPlayer}`);
            
            updateCityInfo(currentPosition);
            alert(`${city.name}을(를) 구매했습니다!`);
        }
    }
});

// 펜션 건설 버튼 클릭 처리
document.getElementById('build-pension').addEventListener('click', function() {
    const currentPosition = playerPositions[currentPlayer - 1];
    const city = gameCells.find(c => c.position === currentPosition);
    const buildings = cityBuildings[currentPosition];
    
    if (city && buildings.pensions < 4 && playerFunds[currentPlayer - 1] >= city.buildingCost.pension) {
        if (confirm(`${city.name}에 펜션을 건설하시겠습니까? (비용: ${city.buildingCost.pension}만원)`)) {
            updatePlayerFunds(currentPlayer, -city.buildingCost.pension);
            buildings.pensions++;
            updateCityInfo(currentPosition);
            alert(`${city.name}에 펜션을 건설했습니다! (현재 펜션: ${buildings.pensions}개)`);
        }
    }
});

// 호텔 건설 버튼 클릭 처리
document.getElementById('build-hotel').addEventListener('click', function() {
    const currentPosition = playerPositions[currentPlayer - 1];
    const city = gameCells.find(c => c.position === currentPosition);
    const buildings = cityBuildings[currentPosition];
    
    if (city && buildings.pensions === 4 && !buildings.hotel && playerFunds[currentPlayer - 1] >= city.buildingCost.hotel) {
        if (confirm(`${city.name}에 호텔을 건설하시겠습니까? (비용: ${city.buildingCost.hotel}만원)`)) {
            updatePlayerFunds(currentPlayer, -city.buildingCost.hotel);
            buildings.hotel = true;
            updateCityInfo(currentPosition);
            alert(`${city.name}에 호텔을 건설했습니다!`);
        }
    }
});

function handleJumpSelection(cellIndex) {
    if (!isJumpSelectionMode) return;
    
    // 현재 위치에서 목표 위치까지의 칸 수 계산
    const currentPosition = playerPositions[jumpSelectionPlayer - 1];
    let steps = 0;
    let position = currentPosition;
    
    while (position !== cellIndex) {
        position = getNextPosition(position);
        steps++;
    }
    
    // 선택 가능한 칸 표시 제거
    document.querySelectorAll('.board-cell.selectable').forEach(cell => {
        cell.classList.remove('selectable');
    });
    
    // 오버레이 제거
    const overlay = document.querySelector('.jump-selection-overlay');
    if (overlay) overlay.remove();
    
    // movePlayer 함수를 통해 이동 (더 빠른 속도로)
    movePlayer(jumpSelectionPlayer, steps, 100);

    // 점프 선택 모드 종료
    isJumpSelectionMode = false;
    jumpSelectionPlayer = null;
}

function showJumpSelection(player) {
    isJumpSelectionMode = true;
    jumpSelectionPlayer = player;
    
    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'jump-selection-overlay';
    overlay.innerHTML = `
        <div class="jump-selection-message">
            <h3>이동할 칸을 선택하세요</h3>
            <p>플레이어 ${player}님, 점프할 칸을 선택해주세요.</p>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 테두리 칸만 선택 가능하게 만들고 클릭 이벤트 추가
    const cells = document.querySelectorAll('.board-cell');
    cells.forEach((cell, index) => {
        // 테두리 칸인 경우에만 선택 가능
        if (cell.classList.contains('border-cell')) {
            cell.classList.add('selectable');
            cell.addEventListener('click', () => handleJumpSelection(index));
        }
    });
}

// 주사위 던지기 버튼 클릭 처리
rollDiceButton.addEventListener('click', async function() {
    if (isDiceRolled) return;
    
    await rollDice();
    isDiceRolled = true;
});

function calculateRent(position) {
    const cell = gameCells.find(c => c.position === position);
    if (!cell || cell.type !== CellType.REGION) return 0;

    const buildings = cityBuildings[position];
    
    // 건물이 없는 경우 기본 통행료
    if (!buildings || (buildings.pensions === 0 && !buildings.hotel)) {
        return cell.rent.base;
    }
    
    // 호텔이 있는 경우
    if (buildings.hotel) {
        return cell.rent.hotel;
    }
    
    // 펜션 개수에 따른 통행료
    switch(buildings.pensions) {
        case 1: return cell.rent.pension1;
        case 2: return cell.rent.pension2;
        case 3: return cell.rent.pension3;
        case 4: return cell.rent.pension4;
        default: return cell.rent.base;
    }
}