// 전역 상태 관리
class StockConditionApp {
    constructor() {
        this.conditions = [];
        this.searchResults = [];
        this.performanceData = null;
        
        this.initializeApp();
        this.bindEvents();
        this.loadFromURL();
    }

    initializeApp() {
        // 조건 유형 변경 시 폼 업데이트
        this.updateConditionForm();
        
        // URL에서 조건 로드
        this.loadConditionsFromURL();
        
        // 초기 UI 상태 설정
        this.updateUI();
    }

    bindEvents() {
        // 조건 유형 변경
        document.getElementById('condition-type').addEventListener('change', () => {
            this.updateConditionForm();
        });

        // 조건 추가 폼 제출
        document.getElementById('condition-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCondition();
        });

        // 조건 전체 삭제
        document.getElementById('clear-conditions').addEventListener('click', () => {
            this.clearAllConditions();
        });

        // 실시간 검색
        document.getElementById('search-stocks').addEventListener('click', () => {
            this.performSearch();
        });

        // 성과 검증
        document.getElementById('run-backtest').addEventListener('click', () => {
            this.runBacktest();
        });

        // URL 관련 기능
        document.getElementById('copy-url').addEventListener('click', () => {
            this.copyShareURL();
        });

        document.getElementById('update-url').addEventListener('click', () => {
            this.updateShareURL();
        });

        document.getElementById('load-from-url').addEventListener('click', () => {
            this.loadFromShareURL();
        });

        // URL 변경 감지
        window.addEventListener('popstate', () => {
            this.loadConditionsFromURL();
        });
    }

    updateConditionForm() {
        const conditionType = document.getElementById('condition-type').value;
        
        // 모든 조건 폼 숨기기
        document.querySelectorAll('.condition-details-form').forEach(form => {
            form.classList.add('hidden');
        });

        // 선택된 조건 폼 보이기
        const activeForm = document.getElementById(`${conditionType}-condition`);
        if (activeForm) {
            activeForm.classList.remove('hidden');
        }
    }

    addCondition() {
        const formData = this.getFormData();
        
        if (this.validateCondition(formData)) {
            const condition = this.createCondition(formData);
            this.conditions.push(condition);
            this.updateConditionsList();
            this.updateSearchButton();
            this.updateShareURL();
            this.resetForm();
            
            this.showNotification('조건이 추가되었습니다.', 'success');
        }
    }

    getFormData() {
        const conditionType = document.getElementById('condition-type').value;
        const market = document.getElementById('market-select').value;

        const baseData = {
            type: conditionType,
            market: market,
            id: Date.now() // 고유 ID
        };

        switch (conditionType) {
            case 'price':
                return {
                    ...baseData,
                    priceType: document.getElementById('price-type').value,
                    daysAgo: parseInt(document.getElementById('days-ago').value),
                    changePercent: parseFloat(document.getElementById('change-percent').value),
                    direction: document.getElementById('change-direction').value
                };
            
            case 'stochastic':
                return {
                    ...baseData,
                    daysAgo: parseInt(document.getElementById('stoch-days').value),
                    comparison: document.getElementById('stoch-comparison').value
                };
            
            case 'rsi':
                return {
                    ...baseData,
                    daysAgo: parseInt(document.getElementById('rsi-days').value),
                    comparison: document.getElementById('rsi-comparison').value
                };
            
            default:
                return baseData;
        }
    }

    validateCondition(formData) {
        // 기본 검증
        if (!formData.type || !formData.market) {
            this.showNotification('필수 항목을 입력해주세요.', 'error');
            return false;
        }

        // 타입별 검증
        switch (formData.type) {
            case 'price':
                if (!formData.changePercent || formData.changePercent <= 0) {
                    this.showNotification('변화율은 0보다 큰 값이어야 합니다.', 'error');
                    return false;
                }
                break;
        }

        return true;
    }

    createCondition(formData) {
        const condition = {
            ...formData,
            createdAt: new Date().toISOString()
        };

        // 조건 설명 생성
        condition.description = this.generateConditionDescription(condition);
        condition.title = this.generateConditionTitle(condition);

        return condition;
    }

    generateConditionTitle(condition) {
        const marketText = {
            'both': '전체',
            'us': '미국',
            'kr': '한국'
        }[condition.market];

        switch (condition.type) {
            case 'price':
                const priceTypeText = {
                    'close': '종가',
                    'open': '시가',
                    'high': '고가',
                    'low': '저가'
                }[condition.priceType];
                
                const directionText = condition.direction === 'up' ? '상승' : '하락';
                
                return `${marketText} - ${priceTypeText} ${condition.changePercent}% ${directionText}`;
            
            case 'stochastic':
                return `${marketText} - Stochastic Slow 비교`;
            
            case 'rsi':
                return `${marketText} - RSI 비교`;
            
            default:
                return `${marketText} - 조건`;
        }
    }

    generateConditionDescription(condition) {
        switch (condition.type) {
            case 'price':
                const priceTypeText = {
                    'close': '종가',
                    'open': '시가',
                    'high': '고가',
                    'low': '저가'
                }[condition.priceType];
                
                const directionText = condition.direction === 'up' ? '상승' : '하락';
                
                return `${priceTypeText}가 ${condition.daysAgo}일 전 대비 ${condition.changePercent}% ${directionText}한 종목`;
            
            case 'stochastic':
                const stochCompText = {
                    'gt': '큰',
                    'gte': '크거나 같은',
                    'eq': '같은',
                    'lte': '작거나 같은',
                    'lt': '작은'
                }[condition.comparison];
                
                return `Stochastic Slow가 ${condition.daysAgo}일 전보다 ${stochCompText} 종목`;
            
            case 'rsi':
                const rsiCompText = {
                    'gt': '큰',
                    'gte': '크거나 같은',
                    'eq': '같은',
                    'lte': '작거나 같은',
                    'lt': '작은'
                }[condition.comparison];
                
                return `RSI가 ${condition.daysAgo}일 전보다 ${rsiCompText} 종목`;
            
            default:
                return '조건 설명';
        }
    }

    updateConditionsList() {
        const container = document.getElementById('conditions-list');
        
        if (this.conditions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>설정된 조건이 없습니다</h3>
                    <p>왼쪽에서 조건을 추가해보세요</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.conditions.map(condition => `
            <div class="condition-item" data-id="${condition.id}">
                <div class="condition-header">
                    <div class="condition-title">${condition.title}</div>
                    <div class="condition-actions">
                        <button class="btn btn-danger btn-sm" onclick="app.removeCondition(${condition.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="condition-details">
                    ${condition.description}
                </div>
            </div>
        `).join('');
    }

    removeCondition(conditionId) {
        this.conditions = this.conditions.filter(c => c.id !== conditionId);
        this.updateConditionsList();
        this.updateSearchButton();
        this.updateShareURL();
        
        this.showNotification('조건이 삭제되었습니다.', 'success');
    }

    clearAllConditions() {
        if (this.conditions.length === 0) return;
        
        if (confirm('모든 조건을 삭제하시겠습니까?')) {
            this.conditions = [];
            this.updateConditionsList();
            this.updateSearchButton();
            this.updateShareURL();
            this.clearSearchResults();
            
            this.showNotification('모든 조건이 삭제되었습니다.', 'success');
        }
    }

    updateSearchButton() {
        const searchButton = document.getElementById('search-stocks');
        searchButton.disabled = this.conditions.length === 0;
    }

    async performSearch() {
        if (this.conditions.length === 0) return;

        this.showSearchLoading();
        
        try {
            // TODO: 실제 API 호출로 대체
            await this.mockSearch();
            
        } catch (error) {
            console.error('검색 오류:', error);
            this.showNotification('검색 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideSearchLoading();
        }
    }

    async mockSearch() {
        // 실제 구현에서는 API 호출로 대체
        return new Promise((resolve) => {
            setTimeout(() => {
                this.searchResults = [
                    {
                        symbol: 'AAPL',
                        name: 'Apple Inc.',
                        market: 'NASDAQ',
                        price: 150.25,
                        change: '+2.5%',
                        volume: '45.2M'
                    },
                    {
                        symbol: 'TSLA',
                        name: 'Tesla Inc.',
                        market: 'NASDAQ',
                        price: 890.75,
                        change: '+5.2%',
                        volume: '28.1M'
                    },
                    {
                        symbol: '005930',
                        name: '삼성전자',
                        market: 'KOSPI',
                        price: 68000,
                        change: '+1.8%',
                        volume: '12.5M'
                    }
                ];
                
                this.displaySearchResults();
                resolve();
            }, 2000);
        });
    }

    showSearchLoading() {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                검색 중...
            </div>
        `;
        
        // 상태 표시기 업데이트
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-warning';
        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 검색중';
    }

    hideSearchLoading() {
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-success';
        statusIndicator.innerHTML = '<i class="fas fa-check"></i> 완료';
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('search-results');
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>검색 결과가 없습니다</h3>
                    <p>조건에 맞는 종목이 없습니다</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="mb-2">
                <strong>${this.searchResults.length}개의 종목이 발견되었습니다</strong>
            </div>
            <div class="results-grid">
                ${this.searchResults.map(stock => `
                    <div class="result-item">
                        <div class="result-symbol">${stock.symbol}</div>
                        <div class="result-name">${stock.name}</div>
                        <div class="result-metrics">
                            <div><strong>현재가:</strong> ${typeof stock.price === 'number' ? stock.price.toLocaleString() : stock.price}</div>
                            <div><strong>변화율:</strong> ${stock.change}</div>
                            <div><strong>거래량:</strong> ${stock.volume}</div>
                            <div><strong>시장:</strong> ${stock.market}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    clearSearchResults() {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>검색을 실행해주세요</h3>
                <p>조건을 설정한 후 "실시간 검색" 버튼을 눌러주세요</p>
            </div>
        `;
        
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-warning';
        statusIndicator.innerHTML = '<i class="fas fa-clock"></i> 대기중';
    }

    async runBacktest() {
        if (this.conditions.length === 0) {
            this.showNotification('조건을 먼저 설정해주세요.', 'warning');
            return;
        }

        const backtestButton = document.getElementById('run-backtest');
        const originalText = backtestButton.innerHTML;
        
        backtestButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 검증중...';
        backtestButton.disabled = true;

        try {
            // TODO: 실제 백테스트 API 호출로 대체
            await this.mockBacktest();
            
        } catch (error) {
            console.error('백테스트 오류:', error);
            this.showNotification('성과 검증 중 오류가 발생했습니다.', 'error');
        } finally {
            backtestButton.innerHTML = originalText;
            backtestButton.disabled = false;
        }
    }

    async mockBacktest() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.performanceData = {
                    totalReturn: 12.5,
                    winRate: 68.4,
                    averageReturn: 2.3,
                    maxDrawdown: -8.2,
                    totalTrades: 24
                };
                
                this.displayPerformanceResults();
                resolve();
            }, 3000);
        });
    }

    displayPerformanceResults() {
        const resultsContainer = document.getElementById('performance-results');
        const data = this.performanceData;
        
        // 결과 표시
        document.getElementById('total-return').textContent = 
            (data.totalReturn >= 0 ? '+' : '') + data.totalReturn.toFixed(2) + '%';
        document.getElementById('win-rate').textContent = data.winRate.toFixed(1) + '%';
        document.getElementById('avg-return').textContent = 
            (data.averageReturn >= 0 ? '+' : '') + data.averageReturn.toFixed(1) + '%';
        document.getElementById('max-drawdown').textContent = data.maxDrawdown.toFixed(1) + '%';
        document.getElementById('total-trades').textContent = data.totalTrades;
        
        // 총 수익률에 따른 색상 변경
        const totalReturnElement = document.getElementById('total-return');
        totalReturnElement.style.color = data.totalReturn >= 0 ? '#38a169' : '#e53e3e';
        
        resultsContainer.classList.remove('hidden');
    }

    // URL 공유 기능
    updateShareURL() {
        const shareData = {
            conditions: this.conditions,
            version: '1.0'
        };
        
        const encoded = btoa(JSON.stringify(shareData));
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('conditions', encoded);
        
        const shareUrl = currentUrl.toString();
        document.getElementById('share-url').textContent = shareUrl;
        
        // URL 히스토리 업데이트 (페이지 새로고침 없이)
        window.history.replaceState({}, '', shareUrl);
    }

    async copyShareURL() {
        const shareUrl = document.getElementById('share-url').textContent;
        
        if (shareUrl === '조건을 추가하면 공유 URL이 생성됩니다') {
            this.showNotification('공유할 조건이 없습니다.', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            this.showNotification('URL이 클립보드에 복사되었습니다.', 'success');
        } catch (error) {
            console.error('복사 실패:', error);
            this.showNotification('URL 복사에 실패했습니다.', 'error');
        }
    }

    loadFromShareURL() {
        const importUrl = document.getElementById('import-url').value.trim();
        
        if (!importUrl) {
            this.showNotification('URL을 입력해주세요.', 'warning');
            return;
        }

        try {
            const url = new URL(importUrl);
            const conditionsParam = url.searchParams.get('conditions');
            
            if (!conditionsParam) {
                this.showNotification('유효하지 않은 공유 URL입니다.', 'error');
                return;
            }

            const shareData = JSON.parse(atob(conditionsParam));
            
            if (shareData.conditions && Array.isArray(shareData.conditions)) {
                this.conditions = shareData.conditions;
                this.updateConditionsList();
                this.updateSearchButton();
                this.updateShareURL();
                this.clearSearchResults();
                
                // 입력 필드 초기화
                document.getElementById('import-url').value = '';
                
                this.showNotification(`${shareData.conditions.length}개의 조건을 불러왔습니다.`, 'success');
            } else {
                this.showNotification('유효하지 않은 조건 데이터입니다.', 'error');
            }
            
        } catch (error) {
            console.error('URL 로드 실패:', error);
            this.showNotification('URL 로드에 실패했습니다.', 'error');
        }
    }

    loadConditionsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const conditionsParam = urlParams.get('conditions');
        
        if (conditionsParam) {
            try {
                const shareData = JSON.parse(atob(conditionsParam));
                
                if (shareData.conditions && Array.isArray(shareData.conditions)) {
                    this.conditions = shareData.conditions;
                    this.updateConditionsList();
                    this.updateSearchButton();
                }
            } catch (error) {
                console.error('URL에서 조건 로드 실패:', error);
            }
        }
    }

    loadFromURL() {
        this.loadConditionsFromURL();
    }

    resetForm() {
        document.getElementById('condition-form').reset();
        this.updateConditionForm();
    }

    updateUI() {
        this.updateConditionsList();
        this.updateSearchButton();
        this.updateShareURL();
    }

    showNotification(message, type = 'info') {
        // 간단한 알림 표시 (실제 구현에서는 더 정교한 알림 시스템 사용)
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        // 임시 알림 요소 생성
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alertClass}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        // 타입별 배경색
        const bgColors = {
            'success': '#38a169',
            'error': '#e53e3e',
            'warning': '#d69e2e',
            'info': '#2b6cb0'
        };
        
        alertDiv.style.backgroundColor = bgColors[type] || bgColors['info'];
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }
}

// 앱 초기화
const app = new StockConditionApp(); 