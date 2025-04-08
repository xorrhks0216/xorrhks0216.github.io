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

// 도시 정보
const cities = [
    { position: 0, name: "무인도", description: "무인도에 도착했습니다", price: 0, rent: 0 },
    { position: 1, name: "라스베가스", description: "세계적인 도박의 도시", price: 200, rent: 20 },
    { position: 2, name: "특수1", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 3, name: "모스크바", description: "러시아의 수도", price: 180, rent: 18 },
    { position: 4, name: "베를린", description: "독일의 수도", price: 160, rent: 16 },
    { position: 5, name: "하와이", description: "태평양의 휴양지", price: 140, rent: 14 },
    { position: 6, name: "홍콩", description: "아시아의 금융 중심지", price: 220, rent: 22 },
    { position: 7, name: "도쿄", description: "일본의 수도", price: 240, rent: 24 },
    { position: 8, name: "특수1", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 9, name: "워싱턴", description: "미국의 수도", price: 260, rent: 26 },
    { position: 10, name: "생일", description: "생일 칸입니다", price: 0, rent: 0 },
    { position: 11, name: "스톡홀름", description: "스웨덴의 수도", price: 150, rent: 15 },
    { position: 21, name: "파리", description: "프랑스의 수도", price: 280, rent: 28 },
    { position: 22, name: "특수2", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 32, name: "특수2", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 33, name: "코펜하겐", description: "덴마크의 수도", price: 170, rent: 17 },
    { position: 43, name: "로마", description: "이탈리아의 수도", price: 190, rent: 19 },
    { position: 44, name: "헬싱키", description: "핀란드의 수도", price: 160, rent: 16 },
    { position: 54, name: "런던", description: "영국의 수도", price: 300, rent: 30 },
    { position: 55, name: "사이판", description: "태평양의 휴양지", price: 130, rent: 13 },
    { position: 65, name: "독도", description: "대한민국의 섬", price: 120, rent: 12 },
    { position: 66, name: "베이징", description: "중국의 수도", price: 250, rent: 25 },
    { position: 76, name: "뉴욕", description: "미국의 경제 중심지", price: 320, rent: 32 },
    { position: 77, name: "싱가포르", description: "아시아의 금융 중심지", price: 230, rent: 23 },
    { position: 87, name: "부산", description: "대한민국의 제2도시", price: 140, rent: 14 },
    { position: 88, name: "특수2", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 98, name: "생일축하금", description: "생일축하금 칸입니다", price: 0, rent: 0 },
    { position: 99, name: "방콕", description: "태국의 수도", price: 150, rent: 15 },
    { position: 109, name: "서울", description: "대한민국의 수도", price: 350, rent: 35 },
    { position: 110, name: "코너점프", description: "코너점프 칸입니다", price: 0, rent: 0 },
    { position: 111, name: "트리폴리", description: "리비아의 수도", price: 130, rent: 13 },
    { position: 112, name: "특수1", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 113, name: "바르샤바", description: "폴란드의 수도", price: 160, rent: 16 },
    { position: 114, name: "카이로", description: "이집트의 수도", price: 180, rent: 18 },
    { position: 115, name: "괌", description: "태평양의 휴양지", price: 140, rent: 14 },
    { position: 116, name: "멕시코시티", description: "멕시코의 수도", price: 200, rent: 20 },
    { position: 117, name: "브라질리아", description: "브라질의 수도", price: 190, rent: 19 },
    { position: 118, name: "특수1", description: "특수 칸입니다", price: 0, rent: 0 },
    { position: 119, name: "산티아고", description: "칠레의 수도", price: 170, rent: 17 },
    { position: 120, name: "출발점", description: "게임의 출발점입니다", price: 0, rent: 0 }
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
    
    // 플레이어 수와 초기 자금 설정
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

// 주사위 굴리기 함수 수정
async function rollDice() {
    // 주사위 요소 가져오기
    const dice1Element = document.getElementById('dice1');
    const dice2Element = document.getElementById('dice2');
    
    if (!dice1Element || !dice2Element) {
        console.error('주사위 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 주사위 던지기 버튼 비활성화
    rollDiceButton.disabled = true;
    
    // 일반 모드에서는 랜덤 주사위
    const dice1Value = Math.floor(Math.random() * 6) + 1;
    const dice2Value = Math.floor(Math.random() * 6) + 1;
    
    // 주사위 애니메이션
    dice1Element.classList.add('rolling');
    dice2Element.classList.add('rolling');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 주사위 결과 표시
    dice1Element.textContent = dice1Value;
    dice2Element.textContent = dice2Value;
    
    dice1Element.classList.remove('rolling');
    dice2Element.classList.remove('rolling');
    
    // 이동 처리
    const totalSteps = dice1Value + dice2Value;
    await movePlayer(currentPlayer, totalSteps);
    
    // 버튼 상태 변경
    updateButtonStates(false);
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
            cell.classList.add('border-cell');
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
function updateCityInfo(position) {
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

    // 현재 위치 표시 (0부터 시작)
    currentPosition.textContent = position;

    // 도시 정보 업데이트
    const city = cities.find(c => c.position === position);
    if (city) {
        cityName.textContent = city.name;
        cityDescription.textContent = city.description;
        cityPrice.textContent = `가격: ${city.price}만원`;
        cityRent.textContent = `임대료: ${city.rent}만원`;
        
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
        const currentPlayerProperties = playerProperties[currentPlayer - 1];
        const isOwned = currentPlayerProperties.includes(position);
        const isSpecialCell = city.price === 0;
        const buildings = cityBuildings[position];
        
        if (!isSpecialCell) {
            if (!isOwned) {
                // 땅 구매 버튼 표시
                buyPropertyButton.style.display = 'block';
                buildingActions.style.display = 'none';
                buyPropertyButton.disabled = playerFunds[currentPlayer - 1] < city.price;
            } else {
                // 건물 건설 버튼 표시
                buyPropertyButton.style.display = 'none';
                buildingActions.style.display = 'flex';
                
                // 펜션 건설 가능 여부
                buildPensionButton.disabled = buildings.pensions >= 4 || playerFunds[currentPlayer - 1] < city.price * 0.5;
                
                // 호텔 건설 가능 여부
                buildHotelButton.disabled = buildings.pensions < 4 || buildings.hotel || playerFunds[currentPlayer - 1] < city.price;
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
async function movePlayer(player, steps) {
    let currentPosition = playerPositions[player - 1];
    const piece = playerPieces[player - 1];
    const startPosition = 120; // 출발칸 위치
    const oldPosition = currentPosition; // 이동 전 위치 저장
    let currentCell = gameBoard.children[currentPosition];
    let passedStartPoint = false; // 출발점을 지나갔는지 여부
    
    // 이동 애니메이션
    for (let i = 0; i < steps; i++) {
        const newPosition = getNextPosition(currentPosition);
        
        // 출발점을 지나가는지 체크
        if (currentPosition > newPosition && currentPosition > startPosition) {
            passedStartPoint = true;
        }
        
        // 말 이동 애니메이션
        piece.classList.add('moving');
        await new Promise(resolve => setTimeout(resolve, 300));
        piece.classList.remove('moving');
        
        // 말 위치 업데이트
        const newCell = gameBoard.children[newPosition];
        
        currentCell.removeChild(piece);
        newCell.appendChild(piece);
        
        currentPosition = newPosition;
        currentCell = newCell;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    playerPositions[player - 1] = currentPosition;
    
    // 출발점을 지나가거나 도착한 경우에만 월급 지급
    if (passedStartPoint || currentPosition === startPosition) {
        // 해당 플레이어가 아직 월급을 받지 않은 경우에만 지급
        if (!playerSalaryReceived[player - 1]) {
            updatePlayerFunds(player, 80);
            alert(`월급 80만원을 받았습니다!`);
            playerSalaryReceived[player - 1] = true;
        }
    }
    
    // 도시 정보 업데이트
    updateCityInfo(currentPosition);
    
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
    const city = cities.find(c => c.position === currentPosition);
    
    if (city && playerFunds[currentPlayer - 1] >= city.price) {
        if (confirm(`${city.name}을(를) ${city.price}만원에 구매하시겠습니까?`)) {
            updatePlayerFunds(currentPlayer, -city.price);
            playerProperties[currentPlayer - 1].push(currentPosition);
            updateCityInfo(currentPosition);
            alert(`${city.name}을(를) 구매했습니다!`);
        }
    }
});

// 펜션 건설 버튼 클릭 처리
document.getElementById('build-pension').addEventListener('click', function() {
    const currentPosition = playerPositions[currentPlayer - 1];
    const city = cities.find(c => c.position === currentPosition);
    const buildings = cityBuildings[currentPosition];
    
    if (city && buildings.pensions < 4 && playerFunds[currentPlayer - 1] >= city.price * 0.5) {
        if (confirm(`${city.name}에 펜션을 건설하시겠습니까? (비용: ${city.price * 0.5}만원)`)) {
            updatePlayerFunds(currentPlayer, -city.price * 0.5);
            buildings.pensions++;
            updateCityInfo(currentPosition);
            alert(`${city.name}에 펜션을 건설했습니다! (현재 펜션: ${buildings.pensions}개)`);
        }
    }
});

// 호텔 건설 버튼 클릭 처리
document.getElementById('build-hotel').addEventListener('click', function() {
    const currentPosition = playerPositions[currentPlayer - 1];
    const city = cities.find(c => c.position === currentPosition);
    const buildings = cityBuildings[currentPosition];
    
    if (city && buildings.pensions === 4 && !buildings.hotel && playerFunds[currentPlayer - 1] >= city.price) {
        if (confirm(`${city.name}에 호텔을 건설하시겠습니까? (비용: ${city.price}만원)`)) {
            updatePlayerFunds(currentPlayer, -city.price);
            buildings.hotel = true;
            updateCityInfo(currentPosition);
            alert(`${city.name}에 호텔을 건설했습니다!`);
        }
    }
});

function handleJumpSelection(cellIndex) {
    if (!isJumpSelectionMode) return;
    
    // 선택한 칸으로 직접 이동
    const piece = playerPieces[jumpSelectionPlayer - 1];
    const currentCell = gameBoard.children[playerPositions[jumpSelectionPlayer - 1]];
    const newCell = gameBoard.children[cellIndex];
    
    // 말 이동 애니메이션
    piece.classList.add('moving');
    setTimeout(() => {
        piece.classList.remove('moving');
        
        // 말 위치 업데이트
        currentCell.removeChild(piece);
        newCell.appendChild(piece);
        playerPositions[jumpSelectionPlayer - 1] = cellIndex;
        
        // 도시 정보 업데이트
        updateCityInfo(cellIndex);
        
        // 점프 선택 모드 종료
        isJumpSelectionMode = false;
        jumpSelectionPlayer = null;
        
        // 선택 가능한 칸 표시 제거
        document.querySelectorAll('.board-cell.selectable').forEach(cell => {
            cell.classList.remove('selectable');
        });
        
        // 오버레이 제거
        const overlay = document.querySelector('.jump-selection-overlay');
        if (overlay) overlay.remove();
        
        // 이동이 완료된 후 버튼 상태 변경
        updateButtonStates(false);
    }, 300);
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