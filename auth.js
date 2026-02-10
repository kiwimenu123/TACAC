// ============================================
// TAC - Tactical Anti Cheat
// Authentication System
// ============================================

// Initialize storage with default data
function initializeStorage() {
    // Valid license keys (only "123" for now, single use)
    if (!localStorage.getItem('tac_license_keys')) {
        localStorage.setItem('tac_license_keys', JSON.stringify({
            '123': { used: false, usedBy: null }
        }));
    }
    
    // Users database
    if (!localStorage.getItem('tac_users')) {
        localStorage.setItem('tac_users', JSON.stringify({}));
    }
    
    // Current session
    if (!localStorage.getItem('tac_session')) {
        localStorage.setItem('tac_session', JSON.stringify(null));
    }
}

// Initialize on load
initializeStorage();

// ============================================
// Alert Functions
// ============================================

function showError(elementId, message) {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.textContent = message;
        alert.classList.add('show');
        setTimeout(() => alert.classList.remove('show'), 5000);
    }
}

function showSuccess(elementId, message) {
    const alert = document.getElementById(elementId);
    if (alert) {
        alert.textContent = message;
        alert.classList.add('show');
    }
}

// ============================================
// Registration
// ============================================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const serverName = document.getElementById('serverName').value.trim();
        const licenseKey = document.getElementById('licenseKey').value.trim();
        
        // Validation
        if (password !== confirmPassword) {
            showError('registerError', 'Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            showError('registerError', 'Password must be at least 6 characters!');
            return;
        }
        
        // Check if username already exists
        const users = JSON.parse(localStorage.getItem('tac_users'));
        if (users[username]) {
            showError('registerError', 'Username already exists!');
            return;
        }
        
        // Check license key
        const keys = JSON.parse(localStorage.getItem('tac_license_keys'));
        if (!keys[licenseKey]) {
            showError('registerError', 'Invalid license key!');
            return;
        }
        
        if (keys[licenseKey].used) {
            showError('registerError', 'This license key has already been redeemed!');
            return;
        }
        
        // Create user
        users[username] = {
            email: email,
            password: password, // In production, this should be hashed
            serverName: serverName,
            licenseKey: licenseKey,
            createdAt: new Date().toISOString(),
            settings: {
                godmode: true,
                speedhack: true,
                noclip: true,
                weapons: true,
                vehicles: true,
                explosions: true,
                injection: true,
                teleport: true,
                punishmentAction: 'kick',
                banDuration: '7',
                discordEnabled: false,
                discordWebhook: ''
            },
            data: {
                bans: [],
                kicks: [],
                admins: [],
                whitelist: [],
                players: [],
                detections: [],
                activityLog: []
            }
        };
        
        // Mark key as used
        keys[licenseKey].used = true;
        keys[licenseKey].usedBy = username;
        
        // Save to storage
        localStorage.setItem('tac_users', JSON.stringify(users));
        localStorage.setItem('tac_license_keys', JSON.stringify(keys));
        
        // Show success and redirect
        showSuccess('registerSuccess', 'Account created successfully! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    });
}

// ============================================
// Login
// ============================================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Get users
        const users = JSON.parse(localStorage.getItem('tac_users'));
        
        // Check credentials
        if (!users[username]) {
            showError('loginError', 'Invalid username or password!');
            return;
        }
        
        if (users[username].password !== password) {
            showError('loginError', 'Invalid username or password!');
            return;
        }
        
        // Create session
        const session = {
            username: username,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('tac_session', JSON.stringify(session));
        
        // Add login activity
        users[username].data.activityLog.unshift({
            type: 'login',
            message: 'User logged in',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('tac_users', JSON.stringify(users));
        
        // Show success and redirect
        showSuccess('loginSuccess', 'Login successful! Redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// ============================================
// Session Check
// ============================================

function checkSession() {
    const session = JSON.parse(localStorage.getItem('tac_session'));
    return session !== null;
}

function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem('tac_session'));
    if (!session) return null;
    
    const users = JSON.parse(localStorage.getItem('tac_users'));
    return users[session.username] || null;
}

function getCurrentUsername() {
    const session = JSON.parse(localStorage.getItem('tac_session'));
    return session ? session.username : null;
}

function logout() {
    localStorage.setItem('tac_session', JSON.stringify(null));
    window.location.href = 'login.html';
}

// Redirect if already logged in (for login/register pages)
if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
    if (checkSession()) {
        window.location.href = 'dashboard.html';
    }
}
