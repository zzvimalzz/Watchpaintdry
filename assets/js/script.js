let startTime = Date.now();
let timerInterval;
let pausedTime = 0;
let isPaused = false;

function updateTimer() {
    if (isPaused) return;
    
    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const display = document.getElementById('timerDisplay');
    display.textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

timerInterval = setInterval(updateTimer, 100);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isPaused = true;
        pausedTime = Date.now() - startTime;
    } else {
        if (isPaused) {
            startTime = Date.now() - pausedTime;
            isPaused = false;
        }
    }
});

const audio = document.getElementById('ambienceAudio');
const audioToggle = document.getElementById('audioToggle');
let isPlaying = false; 
let audioInitialized = false;

audioToggle.classList.add('muted');

audio.addEventListener('play', () => {
    isPlaying = true;
    audioInitialized = true;
    audioToggle.classList.remove('muted');
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    audioToggle.classList.add('muted');
});

audio.addEventListener('error', (e) => {
    isPlaying = false;
    audioToggle.classList.add('muted');
});

audio.addEventListener('loadeddata', () => {});

function tryPlayAudio() {
    if (!audioInitialized) {
        audio.play().then(() => {}).catch((error) => {
            isPlaying = false;
            audioToggle.classList.add('muted');
        });
    }
}

document.addEventListener('click', tryPlayAudio, { once: true });
document.addEventListener('touchstart', tryPlayAudio, { once: true });

audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        audioToggle.classList.add('muted');
    } else {
        audio.play().then(() => {
            isPlaying = true;
            audioToggle.classList.remove('muted');
        }).catch(() => {
            isPlaying = false;
            audioToggle.classList.add('muted');
        });
    }
});

const paintWall = document.getElementById('paintWall');
const message = document.getElementById('message');
let messageTimeout;
let messages = [];
let patienceLevels = [];
let achievements = [];
let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
let unlockedPatienceLevels = JSON.parse(localStorage.getItem('unlockedPatienceLevels') || '[]');

fetch('assets/data/messages.json')
    .then(response => response.json())
    .then(data => {
        messages = data;
    })
    .catch(() => {
        messages = [
            "The paint is still wet!",
            "Patience, young grasshopper... the paint needs more time.",
            "Still drying! Go make a coffee",
            "Did you think it would dry faster if you clicked?"
        ];
    });

fetch('assets/data/patience-levels.json')
    .then(response => response.json())
    .then(data => {
        patienceLevels = data;
        renderPatienceLevels();
    })
    .catch((error) => {
        patienceLevels = [
            { minMinutes: 0, maxMinutes: 5, emoji: '🎨', title: 'Beginner' },
            { minMinutes: 5, maxMinutes: 15, emoji: '🌟', title: 'Getting There' },
            { minMinutes: 15, maxMinutes: 30, emoji: '⭐', title: 'Dedicated' },
            { minMinutes: 30, maxMinutes: 60, emoji: '💎', title: 'Expert Watcher' },
            { minMinutes: 60, maxMinutes: 999999999, emoji: '🏆', title: 'Paint Master' }
        ];
        renderPatienceLevels();
    });

fetch('assets/data/achievements.json')
    .then(response => response.json())
    .then(data => {
        achievements = data;
        renderAchievements();
    })
    .catch(() => {});

function checkAchievements(sessionMinutes, clicks) {
    const visits = parseInt(localStorage.getItem('paintDryVisits') || '0');
    let newlyUnlocked = [];
    
    achievements.forEach(achievement => {
        if (!unlockedAchievements.includes(achievement.id)) {
            let unlocked = false;
            
            if (achievement.requirement.type === 'session' && sessionMinutes >= achievement.requirement.value) {
                unlocked = true;
            } else if (achievement.requirement.type === 'clicks' && clicks >= achievement.requirement.value) {
                unlocked = true;
            } else if (achievement.requirement.type === 'visits' && visits >= achievement.requirement.value) {
                unlocked = true;
            }
            
            if (unlocked) {
                unlockedAchievements.push(achievement.id);
                newlyUnlocked.push(achievement);
            }
        }
    });
    
    if (newlyUnlocked.length > 0) {
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        renderAchievements();
        
        newlyUnlocked.forEach((achievement) => {
            showUnlockNotification(achievement.icon, 'Achievement Unlocked!', achievement.name);
        });
    }
}

function renderAchievements() {
    const achievementsContainer = document.getElementById('achievementsDrawer');
    if (!achievementsContainer || achievements.length === 0) return;
    
    achievementsContainer.innerHTML = achievements.map(achievement => {
        const isUnlocked = unlockedAchievements.includes(achievement.id);
        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderPatienceLevels() {
    const patienceLevelsContainer = document.getElementById('patienceLevelsDrawer');
    if (!patienceLevelsContainer) {
        return;
    }
    if (patienceLevels.length === 0) {
        return;
    }
    
    patienceLevelsContainer.innerHTML = patienceLevels.map((level, index) => {
        const levelKey = `${level.minMinutes}-${level.maxMinutes}`;
        const isUnlocked = unlockedPatienceLevels.includes(levelKey);
        const timeRange = level.maxMinutes >= 999999999 
            ? `${level.minMinutes}+ min` 
            : `${level.minMinutes}-${level.maxMinutes} min`;
        
        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${level.emoji}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${level.title}</div>
                    <div class="achievement-description">${timeRange}</div>
                </div>
            </div>
        `;
    }).join('');
}

let notificationQueue = [];
let isShowingNotification = false;

function showUnlockNotification(icon, title, name) {
    notificationQueue.push({ icon, title, name });
    
    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }
    
    isShowingNotification = true;
    const { icon, title, name } = notificationQueue.shift();
    
    const notification = document.getElementById('unlockNotification');
    const iconElement = document.getElementById('unlockIcon');
    const titleElement = document.getElementById('unlockTitle');
    const nameElement = document.getElementById('unlockName');
    
    iconElement.textContent = icon;
    titleElement.textContent = title;
    nameElement.textContent = name;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        
        setTimeout(() => {
            processNotificationQueue();
        }, 500);
    }, 3000);
}

let isMessageShowing = false;

function showMessage() {
    if (isMessageShowing) return;
    
    isMessageShowing = true;
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    message.textContent = randomMessage;
    
    message.classList.add('show');
    
    messageTimeout = setTimeout(() => {
        message.classList.remove('show');
        setTimeout(() => {
            isMessageShowing = false;
        }, 300);
    }, 2000);
    
    let totalClicks = parseInt(localStorage.getItem('paintClicks') || '0') + 1;
    localStorage.setItem('paintClicks', totalClicks.toString());
}

paintWall.addEventListener('click', showMessage);

paintWall.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showMessage();
});

paintWall.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showMessage();
});

const badgeToggle = document.getElementById('badgeToggle');
const statsPanel = document.getElementById('statsPanel');
const closePanel = document.getElementById('closePanel');
const longestSessionDisplay = document.getElementById('longestSession');

function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

badgeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    statsPanel.classList.toggle('show');
    if (statsPanel.classList.contains('show')) {
        const currentSessionTime = Date.now() - startTime;
        
        const longestSession = parseInt(localStorage.getItem('longestSession') || '0');
        const displayLongest = Math.max(longestSession, currentSessionTime);
        longestSessionDisplay.textContent = formatTime(displayLongest);
        
        const clicks = parseInt(localStorage.getItem('paintClicks') || '0');
        document.getElementById('totalClicks').textContent = clicks;
        
        const sessionMinutes = Math.floor(currentSessionTime / 60000);
        
        let level = '🎨 Beginner';
        for (const pLevel of patienceLevels) {
            if (sessionMinutes >= pLevel.minMinutes && sessionMinutes < pLevel.maxMinutes) {
                level = `${pLevel.emoji} ${pLevel.title}`;
                break;
            }
        }
        
        document.getElementById('patienceLevel').textContent = level;
    }
});

const drawerHeaders = document.querySelectorAll('.drawer-header');
const drawerBodies = document.querySelectorAll('.drawer-body');

function closeAllDrawers() {
    drawerHeaders.forEach(header => header.classList.remove('active'));
    drawerBodies.forEach(body => body.classList.remove('active'));
}

drawerHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const drawerBody = header.nextElementSibling;
        const isActive = header.classList.contains('active');
        
        drawerHeaders.forEach(h => {
            if (h !== header) {
                h.classList.remove('active');
                h.nextElementSibling.classList.remove('active');
            }
        });
        
        header.classList.toggle('active');
        drawerBody.classList.toggle('active');
    });
});

document.addEventListener('click', (e) => {
    if (statsPanel.classList.contains('show') && 
        !statsPanel.contains(e.target) && 
        e.target !== badgeToggle) {
        statsPanel.classList.remove('show');
        closeAllDrawers();
    }
});

document.addEventListener('touchstart', (e) => {
    if (statsPanel.classList.contains('show') && 
        !statsPanel.contains(e.target) && 
        e.target !== badgeToggle && 
        !badgeToggle.contains(e.target)) {
        statsPanel.classList.remove('show');
        closeAllDrawers();
    }
});

let totalVisits = parseInt(localStorage.getItem('paintDryVisits') || '0') + 1;
localStorage.setItem('paintDryVisits', totalVisits.toString());
document.getElementById('totalVisits').textContent = totalVisits;

function saveSessionTime() {
    const elapsed = Date.now() - startTime;
    const storedTime = parseInt(localStorage.getItem('totalWatchTime') || '0');
    localStorage.setItem('totalWatchTime', (storedTime + elapsed).toString());
    
    const longestSession = parseInt(localStorage.getItem('longestSession') || '0');
    if (elapsed > longestSession) {
        localStorage.setItem('longestSession', elapsed.toString());
    }
}

setInterval(saveSessionTime, 10000);
window.addEventListener('beforeunload', saveSessionTime);

setInterval(() => {
    const sessionTime = Date.now() - startTime;
    const sessionMinutes = Math.floor(sessionTime / 60000);
    const clicks = parseInt(localStorage.getItem('paintClicks') || '0');
    
    checkAchievements(sessionMinutes, clicks);
    
    checkPatienceLevels(sessionMinutes);
}, 1000);

function checkPatienceLevels(sessionMinutes) {
    let newlyUnlockedLevels = [];
    
    for (const pLevel of patienceLevels) {
        if (sessionMinutes >= pLevel.minMinutes && sessionMinutes < pLevel.maxMinutes) {
            patienceLevels.forEach(pl => {
                const key = `${pl.minMinutes}-${pl.maxMinutes}`;
                if (pl.minMinutes <= pLevel.minMinutes && !unlockedPatienceLevels.includes(key)) {
                    unlockedPatienceLevels.push(key);
                    newlyUnlockedLevels.push(pl);
                }
            });
            
            if (newlyUnlockedLevels.length > 0) {
                localStorage.setItem('unlockedPatienceLevels', JSON.stringify(unlockedPatienceLevels));
                renderPatienceLevels();
                
                newlyUnlockedLevels.forEach((pl) => {
                    showUnlockNotification(pl.emoji, 'Patience Level Unlocked!', pl.title);
                });
            }
            
            break;
        }
    }
}

const paints = [
    { id: 'default', name: 'Classic Pink', color: 'linear-gradient(135deg, #ffd6e8 0%, #ffe5f0 50%, #ffdde7 100%)', locked: false },
    { id: 'sage', name: 'Sage Green', color: 'linear-gradient(135deg, #C9E4CA 0%, #E1F0E1 50%, #C9E4CA 100%)', locked: false },
    { id: 'sky', name: 'Sky Blue', color: 'linear-gradient(135deg, #d6e8ff 0%, #e5f0ff 50%, #dde7ff 100%)', locked: false },
    { id: 'lavender', name: 'Lavender', color: 'linear-gradient(135deg, #e8d6ff 0%, #f0e5ff 50%, #e7ddff 100%)', locked: false },
    { id: 'golden', name: 'Golden Hour', color: 'linear-gradient(135deg, #ffd700 0%, #ffec8b 50%, #ffdf00 100%)', locked: true, code: 'GOLDEN2025' },
    { id: 'midnight', name: 'Midnight', color: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #2c3e50 100%)', locked: true, code: 'NIGHTOWL' },
    { id: 'rainbow', name: 'Prism', color: 'linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)', locked: true, code: 'PRISM' }
];

let unlockedPaints = JSON.parse(localStorage.getItem('unlockedPaints') || '["default", "sage", "sky", "lavender"]');
let currentPaint = localStorage.getItem('currentPaint') || 'default';

function renderPaints() {
    const grid = document.getElementById('paintsGrid');
    grid.innerHTML = '';
    
    paints.forEach(paint => {
        const isLocked = paint.locked && !unlockedPaints.includes(paint.id);
        const swatch = document.createElement('div');
        swatch.className = `paint-swatch ${isLocked ? 'locked' : ''} ${currentPaint === paint.id ? 'active' : ''}`;
        swatch.style.background = paint.color;
        swatch.title = isLocked ? 'Locked (Redeem code to unlock)' : paint.name;
        
        swatch.addEventListener('click', () => {
            if (!isLocked) {
                setPaint(paint.id);
            } else {
                alert('This paint is locked! Enter a code to unlock it.');
            }
        });
        
        grid.appendChild(swatch);
    });
}

function setPaint(paintId) {
    const paint = paints.find(p => p.id === paintId);
    if (paint) {
        currentPaint = paintId;
        localStorage.setItem('currentPaint', paintId);
        document.querySelector('.paint-wall').style.background = paint.color;
        renderPaints();
    }
}

document.getElementById('redeemButton').addEventListener('click', () => {
    const input = document.getElementById('redeemInput');
    const code = input.value.trim().toUpperCase();
    
    const paintToUnlock = paints.find(p => p.code === code);
    
    if (paintToUnlock) {
        if (!unlockedPaints.includes(paintToUnlock.id)) {
            unlockedPaints.push(paintToUnlock.id);
            localStorage.setItem('unlockedPaints', JSON.stringify(unlockedPaints));
            renderPaints();
            alert(`Unlocked: ${paintToUnlock.name}!`);
            setPaint(paintToUnlock.id);
            input.value = '';
        } else {
            alert('You already unlocked this paint!');
        }
    } else {
        alert('Invalid code. Try again!');
    }
});

setPaint(currentPaint);
renderPaints();

updateTimer();

const bottomPanelTrigger = document.getElementById('bottomPanelTrigger');
const bottomPanel = document.getElementById('bottomPanel');
const closeBottomPanel = document.getElementById('closeBottomPanel');

if (bottomPanelTrigger && bottomPanel && closeBottomPanel) {
    bottomPanelTrigger.addEventListener('click', () => {
        bottomPanel.classList.add('open');
    });

    closeBottomPanel.addEventListener('click', () => {
        bottomPanel.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
        if (bottomPanel.classList.contains('open') && 
            !bottomPanel.contains(e.target) && 
            !bottomPanelTrigger.contains(e.target)) {
            bottomPanel.classList.remove('open');
        }
    });

    const dragHandle = bottomPanel.querySelector('.panel-drag-handle');
    let isDragging = false;
    let startY = 0;
    let currentTranslateY = 0;

    const getClientY = (e) => e.touches ? e.touches[0].clientY : e.clientY;

    const startDrag = (e) => {
        isDragging = true;
        startY = getClientY(e);
        bottomPanel.classList.add('is-dragging');
    };

    const drag = (e) => {
        if (!isDragging) return;

        e.preventDefault(); 
        
        const currentY = getClientY(e);
        const deltaY = currentY - startY;
        
        if (deltaY > 0) {
            currentTranslateY = deltaY;
            bottomPanel.style.transform = `translateX(-50%) translateY(${currentTranslateY}px)`;
        }
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        bottomPanel.classList.remove('is-dragging');
        
        if (currentTranslateY > 100) {
            bottomPanel.classList.remove('open');
        }
        
        bottomPanel.style.transform = ''; 
        currentTranslateY = 0;
    };

    if (dragHandle) {
        dragHandle.addEventListener('mousedown', startDrag);
        dragHandle.addEventListener('touchstart', startDrag);

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
}
