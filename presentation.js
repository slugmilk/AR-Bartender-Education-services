document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================
       SLIDE NAVIGATION CONTROLLER
       ========================================== */
    let currentSlide = 0;
    const totalSlides = 9;
    const slidesContainer = document.getElementById('slides-container');
    const slides = document.querySelectorAll('.slide');
    const pageNumText = document.getElementById('page-num');
    const progressBar = document.getElementById('progress-bar');
    const slideDotsContainer = document.getElementById('slide-dots');
    
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    const startBtn = document.getElementById('start-presentation');

    // Generate Navigation Dots
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        slideDotsContainer.appendChild(dot);
    }
    const dots = document.querySelectorAll('.dot');

    // Go to Specific Slide
    function goToSlide(index) {
        if (index < 0 || index >= totalSlides) return;
        
        currentSlide = index;
        
        // Translate slides container
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}vw)`;
        
        // Update active class for slides (triggers animations)
        slides.forEach((slide, idx) => {
            if (idx === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update indicators
        pageNumText.textContent = `${currentSlide + 1} / ${totalSlides}`;
        progressBar.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
        
        // Update dots active class
        dots.forEach((dot, idx) => {
            if (idx === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Special actions per slide
        if (currentSlide === 1) {
            calculateCost(); // Trigger cost calculation when entering Slide 2
        }
    }

    // Button event listeners
    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    
    if (startBtn) {
        startBtn.addEventListener('click', () => goToSlide(1));
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            e.preventDefault();
            goToSlide(currentSlide + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            goToSlide(currentSlide - 1);
        }
    });

    // Touch swiping navigation (Mobile devices)
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const threshold = 50; // swipe offset minimum
        if (touchStartX - touchEndX > threshold) {
            // Swiped Left -> Next slide
            goToSlide(currentSlide + 1);
        } else if (touchEndX - touchStartX > threshold) {
            // Swiped Right -> Prev slide
            goToSlide(currentSlide - 1);
        }
    }

    /* ==========================================
       SLIDE 2: COST CALCULATOR WIDGET
       ========================================== */
    const studentsRange = document.getElementById('calc-students');
    const sessionsRange = document.getElementById('calc-sessions');
    const valStudents = document.getElementById('val-students');
    const valSessions = document.getElementById('val-sessions');
    
    const costOriginalText = document.getElementById('cost-original');
    const costSavedText = document.getElementById('cost-saved');

    if (studentsRange && sessionsRange) {
        studentsRange.addEventListener('input', (e) => {
            valStudents.textContent = `${e.target.value}명`;
            calculateCost();
        });

        sessionsRange.addEventListener('input', (e) => {
            valSessions.textContent = `${e.target.value}회`;
            calculateCost();
        });
    }

    function calculateCost() {
        const students = parseInt(studentsRange.value);
        const sessions = parseInt(sessionsRange.value);
        
        // Single session materials estimation cost (liquor, ice, garnish: avg 2,500 KRW)
        const costPerPractice = 2500;
        const totalSessionsPerWeek = students * sessions;
        const weeklyCost = totalSessionsPerWeek * costPerPractice;
        
        // Assuming 40 academic weeks per year
        const annualSavings = weeklyCost * 40;

        // Display formatted
        costOriginalText.textContent = `${weeklyCost.toLocaleString()}원`;
        costSavedText.textContent = `${annualSavings.toLocaleString()}원`;
    }

    /* ==========================================
       SLIDE 7: INTERACTIVE SCENARIO TIMELINE
       ========================================== */
    const timeButtons = document.querySelectorAll('.time-btn');
    const detailTitle = document.getElementById('timeline-detail-title');
    const detailDesc = document.getElementById('timeline-detail-desc');
    const visualMock = document.getElementById('timeline-visual-mock');

    const timelineData = {
        1: {
            title: '1단계: 과제 선택 (스마트폰 앱)',
            desc: '사용자는 훈련 전 스마트폰 앱에서 연습할 조주과제(예: 드라이 마티니, 위스키 사워 등 시험 출제 39종 중 선택)를 로드하고 가이드 모드 및 타이머 세션을 활성화합니다.',
            mock: '📱 스마트폰 화면: 레시피 목록 대시보드 및 실습 로드 완료'
        },
        2: {
            title: '2단계: 도구 및 재료 준비 (훈련대 배치)',
            desc: '칵테일에 필요한 빈 병(베이스 스피릿, 리큐르), 지거, 셰이커, 믹싱글라스 및 서빙 글라스 등 마커가 부착된 훈련용 교구를 훈련대 위에 올바르게 정렬 배치합니다.',
            mock: '🍾 훈련대 배치: 지거, 셰이커, 바 스푼 정위치 배치 상태'
        },
        3: {
            title: '3단계: 마커 스캔 (카메라 인식)',
            desc: 'AR 글래스 또는 MR HMD를 착용하면 내장 카메라가 훈련용 도구에 부착된 식별 코드/무광 스티커를 즉각 매핑하여 3D 공간 좌표 상에 정렬합니다.',
            mock: '🔍 AR 뷰 파인더: [지거 스캔 완료] / [셰이커 인식됨 (100%)]'
        },
        4: {
            title: '4단계: 가이드 조주 실습 (실시간 HUD 안내)',
            desc: '시야 위에 오버레이된 3D 가이드를 보며 칵테일을 조주합니다. 푸어링 속도(기울기), 계량 수치(oz), 스터/셰이크 횟수가 정확히 지켜지는지 실시간 경고 및 안내를 제공합니다.',
            mock: '🕶️ AR 글래스 시야: "진 1.5 oz 투입 중... [1.2 oz] (기울기 적정)"'
        },
        5: {
            title: '5단계: AI 종합 실기 리포트 생성 (수행도 분석)',
            desc: '조주가 완료되면 전체 소요 시간, 계량 오차, 셰이킹 유지력, 레시피 절차 준수 여부를 바탕으로 AI가 자동 감점을 적용하여 100점 만점으로 수행도 보고서를 앱에 저장합니다.',
            mock: '📊 최종 결과서: "92점 - 합격권 (계량 오차 +0.1oz 감점 8점)"'
        }
    };

    timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const step = btn.getAttribute('data-step');
            const data = timelineData[step];
            
            if (data) {
                detailTitle.textContent = data.title;
                detailDesc.textContent = data.desc;
                visualMock.textContent = data.mock;
                
                // Add fade animation reset
                const container = document.getElementById('timeline-detail-box');
                container.style.opacity = 0;
                container.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    container.style.opacity = 1;
                    container.style.transform = 'translateY(0)';
                }, 50);
            }
        });
    });
});
