document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================
       NAVBAR SCROLL EFFECT & MOBILE MENU
       ========================================== */
    const navbar = document.getElementById('main-nav');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });
    }

    // Close menu when clicking links on mobile
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });
    });

    /* ==========================================
       DEVICE SHOWCASE TABS SELECTOR
       ========================================== */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Find matching tab pane
            const targetTab = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    /* ==========================================
       CONTACT FORM SUBMITTER
       ========================================== */
    const inquiryForm = document.getElementById('inquiry-form');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('감사합니다! 문의 사항이 성공적으로 접수되었습니다. 담당자가 빠르게 검토 후 연락드리겠습니다.');
            inquiryForm.reset();
        });
    }

    /* ==========================================
       INTERACTIVE AR SIMULATOR GAME
       ========================================== */
    // Simulator states
    let state = {
        recipe: 'martini', // 'martini' | 'sour'
        active: false,
        step: 'idle', // 'idle' | 'pick-jigger' | 'pour-1' | 'pour-2' | 'pick-tool2' | 'action-tool2' | 'complete'
        toolSelected: null, // 'jigger' | 'spoon' | 'shaker'
        jiggerVolume: 0.0,
        glassFluidPercent: 0,
        stirCount: 0,
        shakePercent: 0,
        errors: [],
        warningsTriggered: 0,
        timeElapsed: 0,
        timerInterval: null,
        pourInterval: null
    };

    // DOM Elements
    const recipeBtns = document.querySelectorAll('.recipe-btn');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const step1Group = document.getElementById('sim-step-1');
    const step2Group = document.getElementById('sim-step-2');
    const step3Group = document.getElementById('sim-step-3');
    
    // Actions Interface
    const pourInterface = document.getElementById('pour-interface');
    const stirInterface = document.getElementById('stir-interface');
    const shakeInterface = document.getElementById('shake-interface');
    
    // Pouring elements
    const pouringRange = document.getElementById('pouring-range');
    const pourHoldBtn = document.getElementById('pour-hold-btn');
    const tiltAngleText = document.getElementById('tilt-angle');
    
    // Action elements
    const stirActionBtn = document.getElementById('stir-action-btn');
    const shakeActionBtn = document.getElementById('shake-action-btn');
    
    // Session buttons
    const startSessionBtn = document.getElementById('start-session-btn');
    const resetSessionBtn = document.getElementById('reset-session-btn');
    
    // Viewport HUD Elements
    const viewportGuideText = document.getElementById('viewport-guide-text');
    const fluidIndicator = document.getElementById('fluid-indicator');
    const cupFillHeight = document.getElementById('cup-fill-height');
    const cupCurrentValue = document.getElementById('cup-current-value');
    const feedbackToast = document.getElementById('viewport-feedback-toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastText = document.getElementById('toast-text');
    const reticle = document.getElementById('viewport-reticle');
    const reticleLabel = document.getElementById('reticle-label');
    const glassFluid = document.getElementById('glass-fluid');
    const bottleObject = document.getElementById('bottle-object');
    const pourStream = document.getElementById('pour-stream');
    const glassObject = document.getElementById('glass-object');

    // Report elements
    const reportModal = document.getElementById('report-modal');
    const closeReportBtn = document.getElementById('close-report-btn');
    const reportScore = document.getElementById('report-score');
    const reportGrade = document.getElementById('report-grade');
    const valSequence = document.getElementById('val-sequence');
    const valAccuracy = document.getElementById('val-accuracy');
    const valTime = document.getElementById('val-time');
    const valMotion = document.getElementById('val-motion');
    const reportCritiqueText = document.getElementById('report-critique-text');
    const reportRestartBtn = document.getElementById('report-restart-btn');

    // Select Recipe
    recipeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.active) return; // Can't change recipe during active session
            recipeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.recipe = btn.getAttribute('data-recipe');
            
            // Adjust visual representation in glass
            if (state.recipe === 'sour') {
                glassObject.className = 'sandbox-glass'; // generic glass
            } else {
                glassObject.className = 'sandbox-glass martini-glass'; // martini glass
            }
        });
    });

    // Start Session
    startSessionBtn.addEventListener('click', () => {
        if (!state.active) {
            startSession();
        } else if (state.step === 'complete') {
            finishSession();
        }
    });

    resetSessionBtn.addEventListener('click', resetSession);
    closeReportBtn.addEventListener('click', () => reportModal.style.display = 'none');
    reportRestartBtn.addEventListener('click', () => {
        reportModal.style.display = 'none';
        resetSession();
        startSession();
    });

    // Tool Picker
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!state.active) return;
            const tool = btn.getAttribute('data-tool');
            
            // Handle logical progression
            if (state.step === 'pick-jigger' && tool === 'jigger') {
                selectTool('jigger');
                advanceToPour1();
            } else if (state.step === 'pick-tool2') {
                if (state.recipe === 'martini' && tool === 'spoon') {
                    selectTool('spoon');
                    advanceToStir();
                } else if (state.recipe === 'sour' && tool === 'shaker') {
                    selectTool('shaker');
                    advanceToShake();
                } else {
                    showToast('❌', '레시피에 맞지 않는 조주 도구입니다!', 'error');
                    state.errors.push('부적절한 도구 선택');
                }
            } else {
                showToast('ℹ️', '지금 사용할 단계가 아닙니다.', 'info');
            }
        });
    });

    function showToast(icon, text, type = 'warning') {
        feedbackToast.style.display = 'flex';
        toastIcon.textContent = icon;
        toastText.textContent = text;
        feedbackToast.className = 'viewport-toast';
        if (type === 'error') {
            feedbackToast.style.borderColor = 'var(--color-red)';
            feedbackToast.style.boxShadow = '0 4px 25px rgba(239, 68, 68, 0.25)';
        } else if (type === 'success') {
            feedbackToast.style.borderColor = 'var(--color-green)';
            feedbackToast.style.boxShadow = '0 4px 25px rgba(16, 185, 129, 0.25)';
        } else {
            feedbackToast.style.borderColor = 'var(--color-pink)';
            feedbackToast.style.boxShadow = '0 4px 25px rgba(255, 0, 122, 0.25)';
        }
    }

    function selectTool(tool) {
        state.toolSelected = tool;
        toolBtns.forEach(btn => {
            if (btn.getAttribute('data-tool') === tool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function startSession() {
        state.active = true;
        state.step = 'pick-jigger';
        state.errors = [];
        state.warningsTriggered = 0;
        state.timeElapsed = 0;
        state.jiggerVolume = 0.0;
        state.glassFluidPercent = 0;
        state.stirCount = 0;
        state.shakePercent = 0;
        glassFluid.style.height = '0%';
        
        // Disable recipe selector
        step1Group.classList.add('disabled');
        
        // Enable tool picker
        step2Group.classList.remove('disabled');
        toolBtns.forEach(btn => {
            if (btn.getAttribute('data-tool') === 'jigger') {
                btn.removeAttribute('disabled');
            } else {
                btn.setAttribute('disabled', true);
            }
        });

        // Hide action interfaces
        pourInterface.style.display = 'none';
        stirInterface.style.display = 'none';
        shakeInterface.style.display = 'none';
        
        // UI elements
        startSessionBtn.setAttribute('disabled', true);
        resetSessionBtn.style.display = 'block';

        // HUD view setup
        reticle.style.borderColor = 'var(--color-cyan)';
        reticleLabel.textContent = '지거 스캔 대기 중...';
        viewportGuideText.innerHTML = `<strong>[1단계: 도구 준비]</strong><br>테이블 위에 있는 <strong>지거 (Jigger)</strong>를 쥐어 카메라(리클)에 인식시켜 주세요.`;
        
        // Timer
        state.timerInterval = setInterval(() => {
            state.timeElapsed++;
        }, 1000);
    }

    function advanceToPour1() {
        state.step = 'pour-1';
        
        // Enable Action Panel
        step3Group.classList.remove('disabled');
        pourInterface.style.display = 'block';
        pouringRange.removeAttribute('disabled');
        pourHoldBtn.removeAttribute('disabled');
        fluidIndicator.style.display = 'flex';
        updateJiggerHUD(0);

        // Visual bottle show
        bottleObject.style.display = 'block';
        bottleObject.style.transform = 'rotate(0deg)';

        const baseLiquid = state.recipe === 'martini' ? '드라이 진 (Dry Gin)' : '버번 위스키 (Bourbon)';
        reticleLabel.textContent = '주류 병 인식됨';
        viewportGuideText.innerHTML = `<strong>[2단계: 베이스 푸어링]</strong><br>계량을 위해 <strong>${baseLiquid}</strong> 병을 지거 위로 기울여 <strong>1.5 oz</strong>를 채우세요.<br><small>* 슬라이더로 기울기를 맞추고 [푸어링] 버튼을 길게 누르세요.</small>`;

        setupPouringLogic(1.5, () => {
            // Success pouring 1
            pourIntoGlass(30);
            advanceToPour2();
        });
    }

    function advanceToPour2() {
        state.step = 'pour-2';
        state.jiggerVolume = 0.0;
        updateJiggerHUD(0);
        
        const accentLiquid = state.recipe === 'martini' ? '드라이 버무스 (Vermouth)' : '레몬 주스 (Lemon)';
        const targetVol = state.recipe === 'martini' ? 0.5 : 0.75;
        
        viewportGuideText.innerHTML = `<strong>[3단계: 부재료 푸어링]</strong><br>지거에 <strong>${accentLiquid} ${targetVol} oz</strong>를 계량하여 추가로 투입하세요.`;

        setupPouringLogic(targetVol, () => {
            pourIntoGlass(state.recipe === 'martini' ? 15 : 20);
            advanceToNextTool();
        });
    }

    function advanceToNextTool() {
        state.step = 'pick-tool2';
        state.toolSelected = null;
        pourInterface.style.display = 'none';
        bottleObject.style.display = 'none';
        fluidIndicator.style.display = 'none';

        // Update tool picker
        toolBtns.forEach(btn => {
            const tool = btn.getAttribute('data-tool');
            if (state.recipe === 'martini' && tool === 'spoon') {
                btn.removeAttribute('disabled');
            } else if (state.recipe === 'sour' && tool === 'shaker') {
                btn.removeAttribute('disabled');
            } else {
                btn.setAttribute('disabled', true);
                btn.classList.remove('active');
            }
        });

        const nextTool = state.recipe === 'martini' ? '바 스푼 (Bar Spoon)' : '셰이커 (Shaker)';
        reticleLabel.textContent = '다음 도구 대기';
        viewportGuideText.innerHTML = `<strong>[4단계: 혼합 준비]</strong><br>지거를 내려놓고, 다음 동작을 위해 <strong>${nextTool}</strong>을 잡으세요.`;
    }

    function advanceToStir() {
        state.step = 'action-tool2';
        stirInterface.style.display = 'block';
        stirActionBtn.removeAttribute('disabled');
        state.stirCount = 0;
        stirActionBtn.innerHTML = `<i data-lucide="rotate-cw"></i> 믹싱글라스 스터링 (0 / 10회)`;
        lucide.createIcons();

        reticleLabel.textContent = '바 스푼 감지됨';
        viewportGuideText.innerHTML = `<strong>[5단계: 스터링]</strong><br>바 스푼을 믹싱글라스 벽에 대고 <strong>10회 이상</strong> 회전시켜 냉각과 혼합을 진행하세요. (버튼 연타)`;
        
        stirActionBtn.onclick = () => {
            state.stirCount++;
            stirActionBtn.innerHTML = `<i data-lucide="rotate-cw"></i> 믹싱글라스 스터링 (${state.stirCount} / 10회)`;
            lucide.createIcons();

            // Swirl animation visual
            glassFluid.style.transform = 'scaleX(1.03)';
            setTimeout(() => glassFluid.style.transform = 'scaleX(1)', 150);

            if (state.stirCount === 1) {
                showToast('🔄', '스터링 스냅 감지 중...', 'info');
            }

            if (state.stirCount >= 10) {
                advanceToComplete();
            }
        };
    }

    function advanceToShake() {
        state.step = 'action-tool2';
        shakeInterface.style.display = 'block';
        shakeActionBtn.removeAttribute('disabled');
        state.shakePercent = 0;
        shakeActionBtn.textContent = `⚡ 셰이킹 액션 연타! (0%)`;

        reticleLabel.textContent = '셰이커 닫힘 감지';
        viewportGuideText.innerHTML = `<strong>[5단계: 셰이킹]</strong><br>셰이커를 두 손으로 잡고 신속하게 흔들어 게이지 <strong>100%</strong>를 만드세요!`;
        
        let decayInterval = setInterval(() => {
            if (state.shakePercent > 0 && state.shakePercent < 100) {
                state.shakePercent = Math.max(0, state.shakePercent - 1);
                updateShakeBar();
            }
        }, 100);

        shakeActionBtn.onclick = () => {
            state.shakePercent = Math.min(100, state.shakePercent + 8);
            updateShakeBar();
            
            // Vibration animation on glass object to mimic shaker
            glassObject.style.transform = `translate(${Math.random()*10 - 5}px, ${Math.random()*10 - 5}px)`;
            setTimeout(() => glassObject.style.transform = 'translate(0, 0)', 50);

            if (state.shakePercent >= 100) {
                clearInterval(decayInterval);
                advanceToComplete();
            }
        };
    }

    function updateShakeBar() {
        const fill = document.getElementById('shake-bar-fill');
        if (fill) fill.style.width = `${state.shakePercent}%`;
        shakeActionBtn.textContent = `⚡ 셰이킹 액션 연타! (${state.shakePercent}%)`;
    }

    function advanceToComplete() {
        state.step = 'complete';
        stirInterface.style.display = 'none';
        shakeInterface.style.display = 'none';
        
        // Visual finalize fluid level
        glassFluid.style.height = `${state.glassFluidPercent + 15}%`;

        const garnish = state.recipe === 'martini' ? '올리브 가니시' : '체리 & 오렌지 가니시';
        reticleLabel.textContent = '조주 완료 대기';
        viewportGuideText.innerHTML = `<strong>[6단계: 최종 제출]</strong><br>글라스에 칵테일을 따르고, <strong>${garnish}</strong>를 배치하여 조주를 마무리하세요.<br>마무리되면 <strong>[트레이닝 종료 및 리포트]</strong> 버튼을 누르세요.`;

        startSessionBtn.removeAttribute('disabled');
        startSessionBtn.textContent = '트레이닝 종료 및 리포트';
        startSessionBtn.className = 'btn btn-accent btn-block';
    }

    function finishSession() {
        clearInterval(state.timerInterval);
        state.active = false;
        
        // Calculate scores
        calculateReport();
        
        // Show report
        reportModal.style.display = 'flex';
    }

    function calculateReport() {
        // Simple evaluation based on parameters
        let score = 100;
        let details = {
            sequence: '우수 (100% 준수)',
            accuracy: '최우수 (오차 범위 극소)',
            time: `통과 (${state.timeElapsed}초 소요)`,
            motion: '충족 완료'
        };
        let critiques = [];

        // 1. Time penalties
        if (state.timeElapsed > 120) {
            score -= 10;
            details.time = `주의 (${state.timeElapsed}초 - 지체됨)`;
            critiques.push('조주 속도가 다소 느립니다. 시험에서는 7분 안에 3가지 칵테일을 제출해야 하므로 각 칵테일은 2분 이내 완료를 지향하십시오.');
        } else {
            critiques.push('시간 관리 면에서 우수한 성과를 보였습니다.');
        }

        // 2. Warnings / Angle penalties
        if (state.warningsTriggered > 0) {
            score -= Math.min(15, state.warningsTriggered * 4);
            details.accuracy = `감점 (푸어링 각도 불안정 ${state.warningsTriggered}회)`;
            critiques.push('병 푸어링 시 기울기를 지나치게 급격히 꺾었습니다. AR 피드백 가이드의 안전 경고 범위(45도~60도)를 준수해야 계량 실수를 방지합니다.');
        } else {
            critiques.push('푸어링 시 병의 기울기가 매우 안정적이었습니다.');
        }

        // 3. User Errors logged
        if (state.errors.length > 0) {
            score -= state.errors.length * 8;
            details.sequence = '일부 이탈';
            critiques.push(`훈련 과정 중 감점 습관(${state.errors.join(', ')})이 검출되었습니다. 시험 기준에 유의하여 실습을 재도전하십시오.`);
        } else {
            critiques.push('레시피 순서와 도구 사용 순서가 한 치의 오차 없이 완벽하게 이행되었습니다.');
        }

        score = Math.max(30, score);
        
        // Render to Report UI
        reportScore.textContent = score;
        if (score >= 80) {
            reportGrade.textContent = '합격권 (PASS)';
            reportGrade.className = 'score-grade text-success';
        } else {
            reportGrade.textContent = '불합격권 (FAIL)';
            reportGrade.className = 'score-grade text-danger';
        }

        valSequence.textContent = details.sequence;
        valAccuracy.textContent = details.accuracy;
        valTime.textContent = details.time;
        valMotion.textContent = details.motion;

        reportCritiqueText.innerHTML = critiques.map(c => `<li>${c}</li>`).join('<br>');
    }

    function setupPouringLogic(targetVolume, onComplete) {
        let isPouring = false;
        
        // Slide / Tilt angle listener
        pouringRange.value = 0;
        tiltAngleText.textContent = `0° (수직)`;
        
        pouringRange.oninput = (e) => {
            const angle = parseInt(e.target.value);
            tiltAngleText.textContent = `${angle}°`;

            // Rotate bottle graphic representation
            bottleObject.style.transform = `rotate(-${angle}deg)`;
            
            if (angle > 60) {
                tiltAngleText.className = 'text-danger';
                if (Math.random() < 0.1) {
                    state.warningsTriggered++;
                    showToast('⚠️', '경고: 푸어링 각도가 너무 큽니다! (오버플로우 위험)', 'error');
                }
            } else {
                tiltAngleText.className = 'text-gradient';
            }
        };

        // Push button hold listener
        pourHoldBtn.onmousedown = startPour;
        pourHoldBtn.ontouchstart = startPour;

        window.onmouseup = stopPour;
        window.ontouchend = stopPour;

        function startPour(e) {
            if (e) e.preventDefault();
            const angle = parseInt(pouringRange.value);
            if (angle < 15) {
                showToast('❌', '병을 먼저 15도 이상 기울이세요!', 'error');
                state.errors.push('기울기 미달 상태 푸어링 시도');
                return;
            }

            isPouring = true;
            pourStream.style.display = 'block';
            
            // Liquid pour interval simulation
            state.pourInterval = setInterval(() => {
                if (!isPouring) return;
                
                // Pouring speed depends on angle
                const rate = 0.03 + (angle / 90) * 0.08;
                state.jiggerVolume = Math.min(targetVolume + 0.5, state.jiggerVolume + rate);
                
                updateJiggerHUD(targetVolume);

                if (state.jiggerVolume >= targetVolume + 0.3) {
                    showToast('⚠️', '용량이 과도합니다! 즉시 멈추세요!', 'error');
                }
            }, 100);
        }

        function stopPour() {
            if (!isPouring) return;
            isPouring = false;
            pourStream.style.display = 'none';
            clearInterval(state.pourInterval);

            // Double check volume margin
            const diff = Math.abs(state.jiggerVolume - targetVolume);
            if (diff <= 0.15) {
                showToast('✅', '완벽한 계량입니다! 잔에 붓는 중...', 'success');
                setTimeout(() => {
                    onComplete();
                }, 1200);
            } else if (state.jiggerVolume < targetVolume) {
                showToast('❌', '계량 용량이 부족합니다. 조금 더 따르세요.', 'error');
            } else {
                showToast('⚠️', '계량 용량을 초과했습니다! 그래도 일단 붓습니다.', 'warning');
                state.errors.push('계량 오차 초과');
                setTimeout(() => {
                    onComplete();
                }, 1200);
            }
        }
    }

    function pourIntoGlass(addPercent) {
        state.glassFluidPercent += addPercent;
        glassFluid.style.height = `${state.glassFluidPercent}%`;
    }

    function updateJiggerHUD(target) {
        const percent = Math.min(100, (state.jiggerVolume / target) * 100);
        cupFillHeight.style.height = `${percent}%`;
        cupCurrentValue.textContent = `${state.jiggerVolume.toFixed(2)} oz / ${target} oz`;
    }

    function resetSession() {
        clearInterval(state.timerInterval);
        clearInterval(state.pourInterval);
        state.active = false;
        state.step = 'idle';
        state.toolSelected = null;
        state.jiggerVolume = 0.0;
        state.glassFluidPercent = 0;
        state.stirCount = 0;
        state.shakePercent = 0;
        
        // Reset controls
        step1Group.classList.remove('disabled');
        step2Group.classList.add('disabled');
        step3Group.classList.add('disabled');

        pourInterface.style.display = 'none';
        stirInterface.style.display = 'none';
        shakeInterface.style.display = 'none';

        toolBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('disabled', true);
        });

        startSessionBtn.removeAttribute('disabled');
        startSessionBtn.textContent = '트레이닝 시작';
        startSessionBtn.className = 'btn btn-primary btn-block';
        resetSessionBtn.style.display = 'none';

        viewportGuideText.textContent = '[트레이닝 시작] 버튼을 누르면 AR 카메라 시뮬레이션이 활성화됩니다.';
        fluidIndicator.style.display = 'none';
        feedbackToast.style.display = 'none';
        reticle.style.borderColor = 'rgba(0, 245, 212, 0.3)';
        reticleLabel.textContent = '마커 스캔 중...';
        
        glassFluid.style.height = '0%';
        bottleObject.style.display = 'none';
        pourStream.style.display = 'none';
    }
});
