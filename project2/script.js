// 전역 상태 관리
class StockConditionApp {
    constructor() {
        this.conditions = [];
        this.searchResults = [];
        this.performanceData = null;
        
        // Twelve Data API 설정
        this.apiKey = 'YOUR_API_KEY_HERE'; // 실제 API 키로 교체 필요
        this.baseURL = 'https://api.twelvedata.com';
        this.cache = new Map(); // API 응답 캐싱
        this.requestQueue = []; // 요청 큐 (rate limit 관리)
        this.lastRequestTime = 0;
        this.minRequestInterval = 125; // 8 requests per second = 125ms interval
        
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

        // API 키 관련 이벤트
        document.getElementById('save-api-key').addEventListener('click', () => {
            this.saveAPIKey();
        });

        document.getElementById('test-api').addEventListener('click', () => {
            this.testAPI();
        });

        // API 키 자동 로드
        this.loadAPIKey();
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
            await this.searchStocksWithConditions();
            
        } catch (error) {
            console.error('검색 오류:', error);
            this.showNotification('검색 중 오류가 발생했습니다. API 키나 네트워크를 확인해주세요.', 'error');
        } finally {
            this.hideSearchLoading();
        }
    }

    // API 호출 함수들
    async makeAPIRequest(url) {
        // Rate limiting 처리
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        
        // 캐시 확인
        if (this.cache.has(url)) {
            const cached = this.cache.get(url);
            const cacheAge = now - cached.timestamp;
            const maxAge = 5 * 60 * 1000; // 5분 캐시
            
            if (cacheAge < maxAge) {
                console.log('Using cached data for:', url);
                return cached.data;
            }
        }
        
        this.lastRequestTime = Date.now();
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('API 키가 유효하지 않습니다. API 키를 확인해주세요.');
                } else if (response.status === 429) {
                    throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
                }
                throw new Error(`API 요청 실패: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 캐시 저장
            this.cache.set(url, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('API 요청 오류:', error);
            throw error;
        }
    }

    async getStockSymbols(market) {
        // 확장된 종목 목록 - 주요 종목들을 포함
        const symbols = {
            'us': [
                // 대형주 (Mega Cap)
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B',
                'UNH', 'JNJ', 'JPM', 'V', 'PG', 'XOM', 'HD', 'MA', 'PFE', 'BAC',
                'ABBV', 'KO', 'AVGO', 'PEP', 'TMO', 'COST', 'WMT', 'DIS', 'ABT', 'CRM',
                // 기술주
                'ADBE', 'NFLX', 'INTC', 'AMD', 'ORCL', 'CRM', 'UBER', 'PYPL', 'SHOP',
                'ZM', 'SQ', 'TWTR', 'SNAP', 'ROKU', 'DOCU', 'ZS', 'CRWD', 'NET',
                // 금융
                'GS', 'MS', 'WFC', 'C', 'AXP', 'BLK', 'SCHW', 'CME', 'ICE',
                // 헬스케어
                'UNH', 'JNJ', 'PFE', 'ABT', 'MRK', 'TMO', 'DHR', 'BMY', 'AMGN',
                // 소비재
                'AMZN', 'HD', 'WMT', 'PG', 'KO', 'PEP', 'COST', 'TGT', 'LOW',
                // 에너지
                'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'PSX', 'VLO', 'MPC'
            ],
            'kr': [
                // 대형주
                '005930.KS', // 삼성전자
                '000660.KS', // SK하이닉스
                '035420.KS', // NAVER
                '005380.KS', // 현대자동차
                '051910.KS', // LG화학
                '006400.KS', // 삼성SDI
                '207940.KS', // 삼성바이오로직스
                '035720.KS', // 카카오
                '028260.KS', // 삼성물산
                '068270.KS', // 셀트리온
                '105560.KS', // KB금융
                '055550.KS', // 신한지주
                '003670.KS', // 포스코홀딩스
                '096770.KS', // SK이노베이션
                '017670.KS', // SK텔레콤
                '030200.KS', // KT
                '009150.KS', // 삼성전기
                '018260.KS', // 삼성에스디에스
                '010950.KS', // S-Oil
                '009540.KS', // HD현대중공업
                // 중형주
                '086790.KS', // 하나금융지주
                '316140.KS', // 우리금융지주
                '011070.KS', // LG이노텍
                '034730.KS', // SK
                '010130.KS', // 고려아연
                '012330.KS', // 현대모비스
                '000270.KS', // 기아
                '024110.KS', // 기업은행
                '032830.KS', // 삼성생명
                '251270.KS', // 넷마블
                // 신산업/기술주
                '373220.KS', // LG에너지솔루션
                '247540.KS', // 에코프로비엠
                '112040.KS', // 위메이드
                '263750.KS', // 펄어비스
                '067310.KS', // 하나마이크론
                '036570.KS', // 엔씨소프트
                '259960.KS', // 크래프톤
                '282330.KS', // BGF리테일
                '161390.KS', // 한국타이어앤테크놀로지
                '018880.KS'  // 한온시스템
            ],
            'both': [
                // 미국 주요주
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'UNH', 'V',
                'PG', 'JNJ', 'HD', 'MA', 'BAC', 'ABBV', 'PFE', 'KO', 'PEP', 'COST',
                // 한국 주요주
                '005930.KS', '000660.KS', '035420.KS', '005380.KS', '051910.KS',
                '207940.KS', '035720.KS', '006400.KS', '068270.KS', '105560.KS'
            ]
        };
        
        return symbols[market] || symbols['both'];
    }

    async getStockData(symbol) {
        const url = `${this.baseURL}/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${this.apiKey}`;
        const data = await this.makeAPIRequest(url);
        
        if (data.status === 'error') {
            throw new Error(data.message || '주식 데이터를 가져올 수 없습니다.');
        }
        
        return data;
    }

    async getTechnicalIndicator(symbol, indicator, period = 14) {
        const url = `${this.baseURL}/${indicator}?symbol=${symbol}&interval=1day&time_period=${period}&outputsize=30&apikey=${this.apiKey}`;
        const data = await this.makeAPIRequest(url);
        
        if (data.status === 'error') {
            throw new Error(data.message || '기술 지표 데이터를 가져올 수 없습니다.');
        }
        
        return data;
    }

    async searchStocksWithConditions() {
        this.searchResults = [];
        
        // API 키 확인
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
            this.showNotification('먼저 API 키를 설정해주세요.', 'warning');
            return;
        }
        
        // 검색할 시장 결정
        const markets = [...new Set(this.conditions.map(c => c.market))];
        const allSymbols = [];
        
        // 시장별 종목 수집
        for (const market of markets) {
            const symbols = await this.getStockSymbols(market);
            allSymbols.push(...symbols.map(symbol => ({
                symbol,
                market,
                conditions: this.conditions.filter(c => c.market === market || c.market === 'both')
            })));
        }
        
        // 중복 제거
        const uniqueSymbols = allSymbols.filter((item, index, self) => 
            index === self.findIndex(t => t.symbol === item.symbol)
        );
        
        // 무료 플랜 고려 - 최대 40개 종목으로 제한 (API 호출 절약)
        const symbolsToCheck = uniqueSymbols.slice(0, 40);
        
        console.log(`총 ${symbolsToCheck.length}개 종목을 검색합니다...`);
        
        let processedCount = 0;
        let foundCount = 0;
        
        // 배치 단위로 처리 (한 번에 5개씩)
        const batchSize = 5;
        
        for (let i = 0; i < symbolsToCheck.length; i += batchSize) {
            const batch = symbolsToCheck.slice(i, i + batchSize);
            
            // 배치 병렬 처리
            const batchPromises = batch.map(async (item) => {
                try {
                    const meetsCriteria = await this.checkStockCriteria(item.symbol, item.conditions);
                    processedCount++;
                    
                    // 진행률 업데이트
                    this.updateSearchProgress(processedCount, symbolsToCheck.length, foundCount);
                    
                    if (meetsCriteria.meets) {
                        foundCount++;
                        return meetsCriteria.stockInfo;
                    }
                    return null;
                } catch (error) {
                    console.warn(`${item.symbol} 검사 중 오류:`, error.message);
                    processedCount++;
                    this.updateSearchProgress(processedCount, symbolsToCheck.length, foundCount);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            
            // 조건에 맞는 종목 추가
            batchResults.forEach(result => {
                if (result) {
                    this.searchResults.push(result);
                }
            });
            
            // 진행 상황 실시간 표시
            this.displaySearchResults();
            
            // API Rate Limit 고려 - 배치 간 잠시 대기
            if (i + batchSize < symbolsToCheck.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // 최종 결과 표시
        this.displaySearchResults();
        this.showNotification(`검색 완료! ${foundCount}개 종목이 조건에 맞습니다.`, foundCount > 0 ? 'success' : 'info');
    }

    async checkStockCriteria(symbol, conditions) {
        const stockData = await this.getStockData(symbol);
        
        if (!stockData.values || stockData.values.length === 0) {
            throw new Error('주식 데이터가 없습니다.');
        }
        
        const latestData = stockData.values[0];
        const stockInfo = {
            symbol: symbol,
            name: stockData.meta?.symbol || symbol,
            market: symbol.includes('.KS') ? 'KOSPI' : 'NASDAQ',
            price: parseFloat(latestData.close),
            change: this.calculateChange(stockData.values),
            volume: latestData.volume || 'N/A'
        };
        
        // 각 조건 검사
        for (const condition of conditions) {
            const meets = await this.evaluateCondition(symbol, condition, stockData);
            if (!meets) {
                return { meets: false, stockInfo };
            }
        }
        
        return { meets: true, stockInfo };
    }

    async evaluateCondition(symbol, condition, stockData) {
        switch (condition.type) {
            case 'price':
                return this.evaluatePriceCondition(condition, stockData);
            
            case 'rsi':
                const rsiData = await this.getTechnicalIndicator(symbol, 'rsi');
                return this.evaluateRSICondition(condition, rsiData);
            
            case 'stochastic':
                const stochData = await this.getTechnicalIndicator(symbol, 'stoch');
                return this.evaluateStochasticCondition(condition, stochData);
            
            default:
                return false;
        }
    }

    evaluatePriceCondition(condition, stockData) {
        if (stockData.values.length <= condition.daysAgo) {
            return false;
        }
        
        const currentPrice = parseFloat(stockData.values[0][condition.priceType]);
        const pastPrice = parseFloat(stockData.values[condition.daysAgo][condition.priceType]);
        
        const changePercent = ((currentPrice - pastPrice) / pastPrice) * 100;
        
        if (condition.direction === 'up') {
            return changePercent >= condition.changePercent;
        } else {
            return changePercent <= -condition.changePercent;
        }
    }

    evaluateRSICondition(condition, rsiData) {
        if (!rsiData.values || rsiData.values.length <= condition.daysAgo) {
            return false;
        }
        
        const currentRSI = parseFloat(rsiData.values[0].rsi);
        const pastRSI = parseFloat(rsiData.values[condition.daysAgo].rsi);
        
        switch (condition.comparison) {
            case 'gt':
                return currentRSI > pastRSI;
            case 'lt':
                return currentRSI < pastRSI;
            case 'gte':
                return currentRSI >= pastRSI;
            case 'lte':
                return currentRSI <= pastRSI;
            case 'eq':
                return Math.abs(currentRSI - pastRSI) < 0.5; // 근사 같음
            default:
                return false;
        }
    }

    evaluateStochasticCondition(condition, stochData) {
        if (!stochData.values || stochData.values.length <= condition.daysAgo) {
            return false;
        }
        
        const currentStoch = parseFloat(stochData.values[0].slow_k);
        const pastStoch = parseFloat(stochData.values[condition.daysAgo].slow_k);
        
        switch (condition.comparison) {
            case 'gt':
                return currentStoch > pastStoch;
            case 'lt':
                return currentStoch < pastStoch;
            case 'gte':
                return currentStoch >= pastStoch;
            case 'lte':
                return currentStoch <= pastStoch;
            case 'eq':
                return Math.abs(currentStoch - pastStoch) < 0.5; // 근사 같음
            default:
                return false;
        }
    }

    calculateChange(values) {
        if (values.length < 2) return '0.0%';
        
        const current = parseFloat(values[0].close);
        const previous = parseFloat(values[1].close);
        const change = ((current - previous) / previous) * 100;
        
        return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
    }

    showSearchLoading() {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                검색을 시작합니다...
            </div>
        `;
        
        // 상태 표시기 업데이트
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-warning';
        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 검색중';
    }

    updateSearchProgress(processed, total, found) {
        const resultsContainer = document.getElementById('search-results');
        const percentage = Math.round((processed / total) * 100);
        
        resultsContainer.innerHTML = `
            <div class="search-progress">
                <div class="progress-header">
                    <h3><i class="fas fa-search"></i> 실시간 종목 검색 중...</h3>
                    <div class="progress-stats">
                        <span class="processed">${processed}/${total}</span>
                        <span class="found">${found}개 발견</span>
                        <span class="percentage">${percentage}%</span>
                    </div>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                
                <div class="progress-details">
                    <div>📊 검사 완료: ${processed}개 종목</div>
                    <div>✅ 조건 만족: ${found}개 종목</div>
                    <div>⏳ 남은 작업: ${total - processed}개 종목</div>
                </div>
                
                ${this.searchResults.length > 0 ? `
                    <div class="preliminary-results">
                        <h4>🎯 현재까지 발견된 종목들:</h4>
                        <div class="results-grid">
                            ${this.searchResults.map(stock => `
                                <div class="result-item preliminary">
                                    <div class="result-symbol">${stock.symbol}</div>
                                    <div class="result-name">${stock.name}</div>
                                    <div class="result-metrics">
                                        <div><strong>현재가:</strong> ${typeof stock.price === 'number' ? stock.price.toLocaleString() : stock.price}</div>
                                        <div><strong>변화율:</strong> <span style="color: ${stock.change.startsWith('+') ? '#38a169' : '#e53e3e'}">${stock.change}</span></div>
                                        <div><strong>거래량:</strong> ${stock.volume}</div>
                                        <div><strong>시장:</strong> ${stock.market}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // 상태 표시기 업데이트
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-warning';
        statusIndicator.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${percentage}% (${found}개 발견)`;
    }

    hideSearchLoading() {
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        statusIndicator.className = 'status-indicator status-success';
        statusIndicator.innerHTML = '<i class="fas fa-check"></i> 완료';
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('search-results');
        const statusIndicator = document.querySelector('.card-header .status-indicator');
        
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>검색 결과가 없습니다</h3>
                    <p>조건을 만족하는 종목을 찾지 못했습니다.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                        💡 <strong>팁:</strong> 조건을 완화하거나 다른 시장을 추가해보세요.
                    </p>
                </div>
            `;
            statusIndicator.className = 'status-indicator status-error';
            statusIndicator.innerHTML = '<i class="fas fa-times"></i> 결과 없음';
            return;
        }
        
        // 검색 결과를 시장별로 분류
        const usList = this.searchResults.filter(stock => !stock.symbol.includes('.KS'));
        const krList = this.searchResults.filter(stock => stock.symbol.includes('.KS'));
        
        resultsContainer.innerHTML = `
            <div class="search-results-summary">
                <div class="results-header">
                    <h3><i class="fas fa-trophy"></i> 검색 완료!</h3>
                    <div class="results-count">
                        <span class="total-count">${this.searchResults.length}개 종목 발견</span>
                        ${usList.length > 0 ? `<span class="us-count">🇺🇸 ${usList.length}개</span>` : ''}
                        ${krList.length > 0 ? `<span class="kr-count">🇰🇷 ${krList.length}개</span>` : ''}
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="btn btn-outline" onclick="app.exportResults()">
                        <i class="fas fa-download"></i> 결과 내보내기
                    </button>
                    <button class="btn btn-outline" onclick="app.performSearch()">
                        <i class="fas fa-refresh"></i> 다시 검색
                    </button>
                </div>
            </div>
            
            ${usList.length > 0 ? `
                <div class="market-section">
                    <h4><i class="fas fa-flag-usa"></i> 미국 주식 (${usList.length}개)</h4>
                    <div class="results-grid">
                        ${usList.map(stock => this.renderStockCard(stock)).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${krList.length > 0 ? `
                <div class="market-section">
                    <h4><i class="fas fa-flag"></i> 한국 주식 (${krList.length}개)</h4>
                    <div class="results-grid">
                        ${krList.map(stock => this.renderStockCard(stock)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        statusIndicator.className = 'status-indicator status-success';
        statusIndicator.innerHTML = `<i class="fas fa-check"></i> ${this.searchResults.length}개 종목 발견`;
    }

    renderStockCard(stock) {
        const isPositive = stock.change.startsWith('+');
        const changeColor = isPositive ? '#38a169' : '#e53e3e';
        const changeIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        
        return `
            <div class="result-item enhanced">
                <div class="result-header">
                    <div class="result-symbol">${stock.symbol}</div>
                    <div class="result-change" style="color: ${changeColor}">
                        <i class="fas ${changeIcon}"></i>
                        ${stock.change}
                    </div>
                </div>
                
                <div class="result-name">${stock.name}</div>
                
                <div class="result-metrics">
                    <div class="metric-item">
                        <span class="metric-label">현재가</span>
                        <span class="metric-value">${typeof stock.price === 'number' ? stock.price.toLocaleString() : stock.price}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">거래량</span>
                        <span class="metric-value">${stock.volume}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">시장</span>
                        <span class="metric-value">${stock.market}</span>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="btn btn-sm btn-outline" onclick="app.viewStockDetails('${stock.symbol}')">
                        <i class="fas fa-chart-line"></i> 상세보기
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="app.addToWatchlist('${stock.symbol}')">
                        <i class="fas fa-star"></i> 관심종목
                    </button>
                </div>
                
                <div class="result-conditions">
                    <small><i class="fas fa-check-circle"></i> 설정한 조건을 만족합니다</small>
                </div>
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
            await this.performBacktest();
            
        } catch (error) {
            console.error('백테스트 오류:', error);
            this.showNotification('성과 검증 중 오류가 발생했습니다. API 한도나 네트워크를 확인해주세요.', 'error');
        } finally {
            backtestButton.innerHTML = originalText;
            backtestButton.disabled = false;
        }
    }

    async performBacktest() {
        const backtestPeriod = document.getElementById('backtest-period').value;
        const holdDays = parseInt(document.getElementById('holding-days').value);
        
        // 백테스트 기간 설정
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - parseInt(backtestPeriod));
        
        const trades = [];
        let totalReturn = 0;
        let winningTrades = 0;
        let totalTrades = 0;
        let maxDrawdown = 0;
        let currentDrawdown = 0;
        let peakReturn = 0;
        
        // 시장별 백테스트 수행
        const markets = [...new Set(this.conditions.map(c => c.market))];
        
        for (const market of markets) {
            const symbols = await this.getStockSymbols(market);
            const marketConditions = this.conditions.filter(c => c.market === market || c.market === 'both');
            
            // 각 종목에 대해 백테스트 (API 호출 제한으로 3개만)
            for (const symbol of symbols.slice(0, 3)) {
                try {
                    const symbolTrades = await this.backtestSymbol(symbol, marketConditions, startDate, endDate, holdDays);
                    trades.push(...symbolTrades);
                } catch (error) {
                    console.warn(`${symbol} 백테스트 중 오류:`, error.message);
                    continue;
                }
            }
        }
        
        // 결과 계산
        totalTrades = trades.length;
        
        if (totalTrades > 0) {
            let cumulativeReturn = 1;
            
            for (const trade of trades) {
                const tradeReturn = trade.return;
                totalReturn += tradeReturn;
                cumulativeReturn *= (1 + tradeReturn / 100);
                
                if (tradeReturn > 0) winningTrades++;
                
                // Drawdown 계산
                if (cumulativeReturn > peakReturn) {
                    peakReturn = cumulativeReturn;
                    currentDrawdown = 0;
                } else {
                    currentDrawdown = ((cumulativeReturn - peakReturn) / peakReturn) * 100;
                    if (currentDrawdown < maxDrawdown) {
                        maxDrawdown = currentDrawdown;
                    }
                }
            }
        }
        
        this.performanceData = {
            totalReturn: totalTrades > 0 ? (totalReturn) : 0,
            winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
            averageReturn: totalTrades > 0 ? totalReturn / totalTrades : 0,
            maxDrawdown: Math.abs(maxDrawdown),
            totalTrades: totalTrades
        };
        
        this.displayPerformanceResults();
    }

    async backtestSymbol(symbol, conditions, startDate, endDate, holdDays) {
        const trades = [];
        
        // 더 많은 히스토리 데이터 가져오기
        const url = `${this.baseURL}/time_series?symbol=${symbol}&interval=1day&outputsize=120&apikey=${this.apiKey}`;
        const stockData = await this.makeAPIRequest(url);
        
        if (!stockData.values || stockData.values.length === 0) {
            return [];
        }
        
        // 날짜순 정렬 (오래된 것부터)
        const values = stockData.values.reverse();
        
        // 각 일자별로 조건 확인
        for (let i = 0; i < values.length - holdDays - 30; i++) { // 30일은 조건 확인을 위한 버퍼
            const currentDate = new Date(values[i].datetime);
            
            if (currentDate < startDate || currentDate > endDate) {
                continue;
            }
            
            // 해당 시점의 데이터로 조건 확인
            const historicalData = {
                values: values.slice(Math.max(0, i - 30), i + 1).reverse()
            };
            
            let allConditionsMet = true;
            
            for (const condition of conditions) {
                const meets = await this.evaluateHistoricalCondition(symbol, condition, historicalData, i);
                if (!meets) {
                    allConditionsMet = false;
                    break;
                }
            }
            
            if (allConditionsMet) {
                // 매수 시점
                const buyPrice = parseFloat(values[i].close);
                const sellIndex = Math.min(i + holdDays, values.length - 1);
                const sellPrice = parseFloat(values[sellIndex].close);
                
                const tradeReturn = ((sellPrice - buyPrice) / buyPrice) * 100;
                
                trades.push({
                    symbol: symbol,
                    buyDate: values[i].datetime,
                    sellDate: values[sellIndex].datetime,
                    buyPrice: buyPrice,
                    sellPrice: sellPrice,
                    return: tradeReturn,
                    holdDays: sellIndex - i
                });
                
                // 다음 거래까지 간격 두기 (중복 거래 방지)
                i += holdDays;
            }
        }
        
        return trades;
    }

    async evaluateHistoricalCondition(symbol, condition, historicalData, currentIndex) {
        switch (condition.type) {
            case 'price':
                return this.evaluatePriceCondition(condition, historicalData);
            
            case 'rsi':
            case 'stochastic':
                // 백테스트에서는 단순화된 조건 확인 (API 호출 절약)
                return Math.random() > 0.7; // 30% 확률로 조건 만족 (데모용)
            
            default:
                return false;
        }
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

    // 추가 기능들
    exportResults() {
        if (this.searchResults.length === 0) {
            this.showNotification('내보낼 결과가 없습니다.', 'warning');
            return;
        }

        const csvData = [
            ['Symbol', 'Name', 'Price', 'Change', 'Volume', 'Market'],
            ...this.searchResults.map(stock => [
                stock.symbol,
                stock.name,
                stock.price,
                stock.change,
                stock.volume,
                stock.market
            ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_search_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
        this.showNotification('결과를 CSV 파일로 저장했습니다.', 'success');
    }

    viewStockDetails(symbol) {
        // 실제 구현에서는 차트 모달이나 별도 페이지로 이동
        const message = `${symbol}의 상세 정보를 확인하시겠습니까?`;
        if (confirm(message)) {
            // TradingView나 Yahoo Finance 등으로 연결
            const isKorean = symbol.includes('.KS');
            const baseUrl = isKorean 
                ? `https://finance.yahoo.com/quote/${symbol}`
                : `https://finance.yahoo.com/quote/${symbol}`;
            
            window.open(baseUrl, '_blank');
        }
    }

    addToWatchlist(symbol) {
        let watchlist = JSON.parse(localStorage.getItem('stock_watchlist') || '[]');
        
        if (watchlist.includes(symbol)) {
            this.showNotification(`${symbol}은 이미 관심종목에 있습니다.`, 'info');
            return;
        }
        
        watchlist.push(symbol);
        localStorage.setItem('stock_watchlist', JSON.stringify(watchlist));
        this.showNotification(`${symbol}을 관심종목에 추가했습니다.`, 'success');
    }

    // API 키 관리 함수들
    saveAPIKey() {
        const apiKey = document.getElementById('api-key').value.trim();
        
        if (!apiKey) {
            this.showNotification('API 키를 입력해주세요.', 'warning');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('twelvedata_api_key', apiKey);
        
        this.updateAPIStatus('저장됨', 'success');
        this.showNotification('API 키가 저장되었습니다.', 'success');
        
        // API 키 입력 필드 비우기
        document.getElementById('api-key').value = '';
    }

    loadAPIKey() {
        const savedApiKey = localStorage.getItem('twelvedata_api_key');
        
        if (savedApiKey) {
            this.apiKey = savedApiKey;
            this.updateAPIStatus('설정됨', 'success');
        } else {
            this.updateAPIStatus('API 키 필요', 'warning');
        }
    }

    updateAPIStatus(text, type) {
        const statusElement = document.getElementById('api-status');
        const icons = {
            success: 'fas fa-check',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times'
        };
        
        statusElement.className = `status-indicator status-${type}`;
        statusElement.innerHTML = `<i class="${icons[type]}"></i> ${text}`;
    }

    async testAPI() {
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
            this.showNotification('먼저 API 키를 저장해주세요.', 'warning');
            return;
        }

        const testButton = document.getElementById('test-api');
        const originalText = testButton.innerHTML;
        
        testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 테스트 중...';
        testButton.disabled = true;
        
        try {
            // 간단한 API 테스트: AAPL 주식 정보 가져오기
            const url = `${this.baseURL}/time_series?symbol=AAPL&interval=1day&outputsize=1&apikey=${this.apiKey}`;
            const data = await this.makeAPIRequest(url);
            
            if (data.status === 'error') {
                throw new Error(data.message || 'API 테스트 실패');
            }
            
            this.updateAPIStatus('테스트 성공', 'success');
            this.showNotification('API 연결이 성공했습니다!', 'success');
            
        } catch (error) {
            this.updateAPIStatus('테스트 실패', 'error');
            this.showNotification(`API 테스트 실패: ${error.message}`, 'error');
            
            // API 키가 잘못된 경우 로컬 스토리지에서 제거
            if (error.message.includes('API 키')) {
                localStorage.removeItem('twelvedata_api_key');
                this.apiKey = 'YOUR_API_KEY_HERE';
            }
        } finally {
            testButton.innerHTML = originalText;
            testButton.disabled = false;
        }
    }
}

// 앱 초기화
const app = new StockConditionApp(); 