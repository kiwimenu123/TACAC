// ============================================
// TAC - Tactical Anti Cheat
// Dashboard System
// ============================================

// ============================================
// Session & Data Management
// ============================================

function checkSession() {
    const session = JSON.parse(localStorage.getItem('tac_session'));
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function getCurrentUsername() {
    const session = JSON.parse(localStorage.getItem('tac_session'));
    return session ? session.username : null;
}

function getUserData() {
    const username = getCurrentUsername();
    if (!username) return null;
    
    const users = JSON.parse(localStorage.getItem('tac_users'));
    return users[username] || null;
}

function saveUserData(data) {
    const username = getCurrentUsername();
    if (!username) return;
    
    const users = JSON.parse(localStorage.getItem('tac_users'));
    users[username] = data;
    localStorage.setItem('tac_users', JSON.stringify(users));
}

function addActivity(type, message) {
    const userData = getUserData();
    if (!userData) return;
    
    userData.data.activityLog.unshift({
        type: type,
        message: message,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 activities
    if (userData.data.activityLog.length > 100) {
        userData.data.activityLog = userData.data.activityLog.slice(0, 100);
    }
    
    saveUserData(userData);
}

// ============================================
// Initialize Dashboard
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (!checkSession()) return;
    
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    // Set server name
    document.getElementById('serverNameDisplay').textContent = userData.serverName;
    
    // Initialize all sections
    updateStats();
    loadRecentActivity();
    loadPlayers();
    loadBans();
    loadKicks();
    loadDetections();
    loadAdmins();
    loadWhitelist();
    loadFullActivityLog();
    loadSettings();
    generateConfig();
    
    // Setup event listeners
    setupNavigation();
    setupForms();
    setupLogout();
    setupSearch();
});

// ============================================
// Navigation
// ============================================

function setupNavigation() {
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const section = this.getAttribute('data-section');
            
            // Update active state
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            document.querySelectorAll('.dashboard-section').forEach(s => {
                s.classList.remove('section-visible');
                s.classList.add('section-hidden');
            });
            
            document.getElementById(section).classList.remove('section-hidden');
            document.getElementById(section).classList.add('section-visible');
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.setItem('tac_session', JSON.stringify(null));
        window.location.href = 'login.html';
    });
}

// ============================================
// Stats
// ============================================

function updateStats() {
    const userData = getUserData();
    if (!userData) return;
    
    document.getElementById('totalPlayers').textContent = userData.data.players.length;
    document.getElementById('totalBans').textContent = userData.data.bans.length;
    document.getElementById('totalKicks').textContent = userData.data.kicks.length;
    document.getElementById('totalAdmins').textContent = userData.data.admins.length;
    
    // Count today's detections
    const today = new Date().toDateString();
    const todayDetections = userData.data.detections.filter(d => 
        new Date(d.timestamp).toDateString() === today
    ).length;
    document.getElementById('totalDetections').textContent = todayDetections;
    
    // Detection type counts
    const godmode = userData.data.detections.filter(d => d.type === 'godmode').length;
    const speed = userData.data.detections.filter(d => d.type === 'speedhack').length;
    const noclip = userData.data.detections.filter(d => d.type === 'noclip').length;
    const weapon = userData.data.detections.filter(d => d.type === 'weapon').length;
    
    if (document.getElementById('godmodeDetections')) {
        document.getElementById('godmodeDetections').textContent = godmode;
        document.getElementById('speedDetections').textContent = speed;
        document.getElementById('noclipDetections').textContent = noclip;
        document.getElementById('weaponDetections').textContent = weapon;
    }
}

// ============================================
// Activity Log
// ============================================

function formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getActivityIcon(type) {
    const icons = {
        'login': { icon: 'fa-sign-in-alt', color: 'blue' },
        'ban': { icon: 'fa-ban', color: 'red' },
        'unban': { icon: 'fa-check', color: 'green' },
        'kick': { icon: 'fa-boot', color: 'orange' },
        'detection': { icon: 'fa-exclamation-triangle', color: 'purple' },
        'admin_add': { icon: 'fa-user-shield', color: 'green' },
        'admin_remove': { icon: 'fa-user-slash', color: 'red' },
        'whitelist_add': { icon: 'fa-check-circle', color: 'green' },
        'whitelist_remove': { icon: 'fa-times-circle', color: 'red' },
        'settings': { icon: 'fa-cog', color: 'blue' }
    };
    return icons[type] || { icon: 'fa-info-circle', color: 'blue' };
}

function loadRecentActivity() {
    const userData = getUserData();
    if (!userData) return;
    
    const container = document.getElementById('recentActivity');
    const activities = userData.data.activityLog.slice(0, 5);
    
    if (activities.length === 0) {
        container.innerHTML = '<li class="activity-item"><p style="color: var(--text-secondary);">No recent activity</p></li>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const iconData = getActivityIcon(activity.type);
        return `
            <li class="activity-item">
                <div class="activity-icon stat-icon ${iconData.color}">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.message}</h4>
                    <p>${activity.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </li>
        `;
    }).join('');
}

function loadFullActivityLog() {
    const userData = getUserData();
    if (!userData) return;
    
    const container = document.getElementById('fullActivityLog');
    const activities = userData.data.activityLog;
    
    if (activities.length === 0) {
        container.innerHTML = '<li class="activity-item"><p style="color: var(--text-secondary);">No activity recorded</p></li>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const iconData = getActivityIcon(activity.type);
        return `
            <li class="activity-item">
                <div class="activity-icon stat-icon ${iconData.color}">
                    <i class="fas ${iconData.icon}"></i>
                </div>
                <div class="activity-info">
                    <h4>${activity.message}</h4>
                    <p>${new Date(activity.timestamp).toLocaleString()}</p>
                </div>
                <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </li>
        `;
    }).join('');
}

function clearLogs() {
    if (!confirm('Are you sure you want to clear all activity logs?')) return;
    
    const userData = getUserData();
    userData.data.activityLog = [];
    saveUserData(userData);
    loadFullActivityLog();
    loadRecentActivity();
}

// ============================================
// Players
// ============================================

function loadPlayers() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('playersTableBody');
    
    if (userData.data.players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No players tracked yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = userData.data.players.map((player, index) => `
        <tr>
            <td>${player.name}</td>
            <td><code style="font-size: 0.8rem;">${player.identifier.substring(0, 30)}...</code></td>
            <td>${new Date(player.firstSeen).toLocaleDateString()}</td>
            <td>${new Date(player.lastSeen).toLocaleDateString()}</td>
            <td><span class="badge ${player.banned ? 'badge-danger' : 'badge-success'}">${player.banned ? 'Banned' : 'Clean'}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-danger" onclick="banPlayer(${index})"><i class="fas fa-ban"></i></button>
                <button class="btn btn-small btn-secondary" onclick="removePlayer(${index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function banPlayer(index) {
    const userData = getUserData();
    const player = userData.data.players[index];
    
    document.getElementById('banPlayerName').value = player.name;
    document.getElementById('banIdentifier').value = player.identifier;
    openModal('addBanModal');
}

function removePlayer(index) {
    if (!confirm('Remove this player from tracking?')) return;
    
    const userData = getUserData();
    const player = userData.data.players[index];
    userData.data.players.splice(index, 1);
    saveUserData(userData);
    
    addActivity('player_remove', `Removed player: ${player.name}`);
    loadPlayers();
    updateStats();
}

// ============================================
// Bans
// ============================================

function loadBans() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('bansTableBody');
    
    if (userData.data.bans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No active bans</td></tr>';
        return;
    }
    
    tbody.innerHTML = userData.data.bans.map((ban, index) => `
        <tr>
            <td>${ban.playerName}</td>
            <td><code style="font-size: 0.8rem;">${ban.identifier.substring(0, 25)}...</code></td>
            <td>${ban.reason}</td>
            <td>${ban.bannedBy}</td>
            <td>${new Date(ban.timestamp).toLocaleDateString()}</td>
            <td><span class="badge ${ban.expiry === 0 ? 'badge-danger' : 'badge-warning'}">${ban.expiry === 0 ? 'Permanent' : ban.expiry + ' days'}</span></td>
            <td class="actions">
                <button class="btn btn-small btn-success" onclick="unban(${index})"><i class="fas fa-check"></i> Unban</button>
            </td>
        </tr>
    `).join('');
}

function unban(index) {
    if (!confirm('Are you sure you want to unban this player?')) return;
    
    const userData = getUserData();
    const ban = userData.data.bans[index];
    userData.data.bans.splice(index, 1);
    saveUserData(userData);
    
    addActivity('unban', `Unbanned: ${ban.playerName}`);
    loadBans();
    updateStats();
    loadRecentActivity();
}

// ============================================
// Kicks
// ============================================

function loadKicks() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('kicksTableBody');
    
    if (userData.data.kicks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No kicks recorded</td></tr>';
        return;
    }
    
    tbody.innerHTML = userData.data.kicks.slice(0, 50).map(kick => `
        <tr>
            <td>${kick.playerName}</td>
            <td>${kick.reason}</td>
            <td>${kick.kickedBy}</td>
            <td>${new Date(kick.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
}

// ============================================
// Detections
// ============================================

function loadDetections() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('detectionsTableBody');
    
    if (userData.data.detections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No detections recorded</td></tr>';
        return;
    }
    
    const typeColors = {
        'godmode': 'danger',
        'speedhack': 'warning',
        'noclip': 'info',
        'weapon': 'danger',
        'vehicle': 'warning',
        'explosion': 'danger',
        'injection': 'danger',
        'teleport': 'warning'
    };
    
    tbody.innerHTML = userData.data.detections.slice(0, 50).map(detection => `
        <tr>
            <td>${detection.playerName}</td>
            <td><span class="badge badge-${typeColors[detection.type] || 'info'}">${detection.type.toUpperCase()}</span></td>
            <td>${detection.details}</td>
            <td><span class="badge badge-${detection.action === 'ban' ? 'danger' : detection.action === 'kick' ? 'warning' : 'info'}">${detection.action.toUpperCase()}</span></td>
            <td>${new Date(detection.timestamp).toLocaleString()}</td>
        </tr>
    `).join('');
}

// ============================================
// Admins
// ============================================

function loadAdmins() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('adminsTableBody');
    
    if (userData.data.admins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No admins added</td></tr>';
        return;
    }
    
    const roleColors = {
        'moderator': 'info',
        'admin': 'warning',
        'superadmin': 'danger'
    };
    
    tbody.innerHTML = userData.data.admins.map((admin, index) => `
        <tr>
            <td>${admin.name}</td>
            <td><code style="font-size: 0.8rem;">${admin.identifier}</code></td>
            <td><span class="badge badge-${roleColors[admin.role]}">${admin.role.toUpperCase()}</span></td>
            <td>${new Date(admin.addedAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-small btn-danger" onclick="removeAdmin(${index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function removeAdmin(index) {
    if (!confirm('Remove this admin?')) return;
    
    const userData = getUserData();
    const admin = userData.data.admins[index];
    userData.data.admins.splice(index, 1);
    saveUserData(userData);
    
    addActivity('admin_remove', `Removed admin: ${admin.name}`);
    loadAdmins();
    updateStats();
    loadRecentActivity();
}

// ============================================
// Whitelist
// ============================================

function loadWhitelist() {
    const userData = getUserData();
    if (!userData) return;
    
    const tbody = document.getElementById('whitelistTableBody');
    
    if (userData.data.whitelist.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No whitelisted players</td></tr>';
        return;
    }
    
    tbody.innerHTML = userData.data.whitelist.map((entry, index) => `
        <tr>
            <td>${entry.name}</td>
            <td><code style="font-size: 0.8rem;">${entry.identifier}</code></td>
            <td><span class="badge badge-success">${entry.bypass.toUpperCase()}</span></td>
            <td>${entry.addedBy}</td>
            <td>${new Date(entry.addedAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-small btn-danger" onclick="removeWhitelist(${index})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function removeWhitelist(index) {
    if (!confirm('Remove from whitelist?')) return;
    
    const userData = getUserData();
    const entry = userData.data.whitelist[index];
    userData.data.whitelist.splice(index, 1);
    saveUserData(userData);
    
    addActivity('whitelist_remove', `Removed from whitelist: ${entry.name}`);
    loadWhitelist();
    loadRecentActivity();
}

// ============================================
// Settings
// ============================================

function loadSettings() {
    const userData = getUserData();
    if (!userData) return;
    
    const settings = userData.settings;
    
    document.getElementById('settingGodmode').checked = settings.godmode;
    document.getElementById('settingSpeedhack').checked = settings.speedhack;
    document.getElementById('settingNoclip').checked = settings.noclip;
    document.getElementById('settingWeapons').checked = settings.weapons;
    document.getElementById('settingVehicles').checked = settings.vehicles;
    document.getElementById('settingExplosions').checked = settings.explosions;
    document.getElementById('settingInjection').checked = settings.injection;
    document.getElementById('settingTeleport').checked = settings.teleport;
    document.getElementById('punishmentAction').value = settings.punishmentAction;
    document.getElementById('banDuration').value = settings.banDuration;
    document.getElementById('settingDiscord').checked = settings.discordEnabled;
    document.getElementById('discordWebhook').value = settings.discordWebhook || '';
}

function saveSettings() {
    const userData = getUserData();
    
    userData.settings = {
        godmode: document.getElementById('settingGodmode').checked,
        speedhack: document.getElementById('settingSpeedhack').checked,
        noclip: document.getElementById('settingNoclip').checked,
        weapons: document.getElementById('settingWeapons').checked,
        vehicles: document.getElementById('settingVehicles').checked,
        explosions: document.getElementById('settingExplosions').checked,
        injection: document.getElementById('settingInjection').checked,
        teleport: document.getElementById('settingTeleport').checked,
        punishmentAction: document.getElementById('punishmentAction').value,
        banDuration: document.getElementById('banDuration').value,
        discordEnabled: document.getElementById('settingDiscord').checked,
        discordWebhook: document.getElementById('discordWebhook').value
    };
    
    saveUserData(userData);
    addActivity('settings', 'Settings updated');
    loadRecentActivity();
    generateConfig();
    
    alert('Settings saved successfully!');
}

// ============================================
// Config Generation
// ============================================

function generateConfig() {
    const userData = getUserData();
    if (!userData) return;
    
    const username = getCurrentUsername();
    
    const config = `--[[
    ████████╗ █████╗  ██████╗
    ╚══██╔══╝██╔══██╗██╔════╝
       ██║   ███████║██║     
       ██║   ██╔══██║██║     
       ██║   ██║  ██║╚██████╗
       ╚═╝   ╚═╝  ╚═╝ ╚═════╝
    Tactical Anti Cheat - Configuration
    Generated for: ${userData.serverName}
]]--

Config = {}

-- ============================================
-- AUTHENTICATION (DO NOT SHARE)
-- ============================================
Config.WebsiteUsername = "${username}"
Config.WebsitePassword = "${userData.password}"
Config.ServerName = "${userData.serverName}"
Config.LicenseKey = "${userData.licenseKey}"

-- ============================================
-- DETECTION MODULES
-- ============================================
Config.Detections = {
    GodMode = ${userData.settings.godmode},
    SpeedHack = ${userData.settings.speedhack},
    NoClip = ${userData.settings.noclip},
    WeaponBlacklist = ${userData.settings.weapons},
    VehicleBlacklist = ${userData.settings.vehicles},
    ExplosionDetection = ${userData.settings.explosions},
    ResourceInjection = ${userData.settings.injection},
    TeleportDetection = ${userData.settings.teleport}
}

-- ============================================
-- PUNISHMENT SETTINGS
-- ============================================
Config.Punishment = {
    DefaultAction = "${userData.settings.punishmentAction}", -- "kick", "ban", "warn"
    DefaultBanDuration = ${userData.settings.banDuration}, -- Days (0 = permanent)
}

-- ============================================
-- DISCORD INTEGRATION
-- ============================================
Config.Discord = {
    Enabled = ${userData.settings.discordEnabled},
    WebhookURL = "${userData.settings.discordWebhook}",
    BotName = "TAC Anticheat",
    BotAvatar = "https://i.imgur.com/your-logo.png"
}

-- ============================================
-- SPEED HACK SETTINGS
-- ============================================
Config.SpeedLimits = {
    OnFoot = 15.0, -- Max speed on foot (m/s)
    InVehicle = 100.0, -- Max vehicle speed (m/s)
    Swimming = 8.0, -- Max swimming speed (m/s)
    Tolerance = 1.5 -- Multiplier tolerance
}

-- ============================================
-- TELEPORT SETTINGS
-- ============================================
Config.Teleport = {
    MaxDistance = 500.0, -- Max distance per tick
    CheckInterval = 1000 -- ms between checks
}

-- ============================================
-- BLACKLISTED WEAPONS
-- ============================================
Config.BlacklistedWeapons = {
    \`WEAPON_RAILGUN\`,
    \`WEAPON_MINIGUN\`,
    \`WEAPON_RPG\`,
    \`WEAPON_GRENADELAUNCHER\`,
    \`WEAPON_HOMINGLAUNCHER\`,
    \`WEAPON_FIREWORK\`,
    \`WEAPON_RAILGUNXM3\`
}

-- ============================================
-- BLACKLISTED VEHICLES
-- ============================================
Config.BlacklistedVehicles = {
    \`cargoplane\`,
    \`jet\`,
    \`lazer\`,
    \`hydra\`,
    \`rhino\`,
    \`khanjali\`,
    \`akula\`,
    \`hunter\`,
    \`savage\`
}

-- ============================================
-- EXPLOSION SETTINGS
-- ============================================
Config.Explosions = {
    MaxPerMinute = 5, -- Max explosions per player per minute
    LogAll = true -- Log all explosions
}

-- ============================================
-- ADMIN IDENTIFIERS
-- ============================================
Config.Admins = {
${userData.data.admins.map(a => `    ["${a.identifier}"] = "${a.role}",`).join('\n') || '    -- No admins configured'}
}

-- ============================================
-- WHITELIST (Bypass detections)
-- ============================================
Config.Whitelist = {
${userData.data.whitelist.map(w => `    ["${w.identifier}"] = "${w.bypass}",`).join('\n') || '    -- No whitelist configured'}
}

-- ============================================
-- BAN MESSAGES
-- ============================================
Config.Messages = {
    BanMessage = "🛡️ TAC | You have been banned from this server.\\nReason: %s\\nExpires: %s",
    KickMessage = "🛡️ TAC | You have been kicked from this server.\\nReason: %s",
    DetectionMessage = "🛡️ TAC | Cheating detected: %s"
}`;
    
    document.getElementById('configDisplay').textContent = config;
}

function copyConfig() {
    const config = document.getElementById('configDisplay').textContent;
    navigator.clipboard.writeText(config).then(() => {
        alert('Configuration copied to clipboard!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = config;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Configuration copied to clipboard!');
    });
}

// ============================================
// Modal Functions
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });
});

// ============================================
// Form Handlers
// ============================================

function setupForms() {
    // Add Ban Form
    document.getElementById('addBanForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = getUserData();
        const username = getCurrentUsername();
        
        const ban = {
            playerName: document.getElementById('banPlayerName').value,
            identifier: document.getElementById('banIdentifier').value,
            reason: document.getElementById('banReason').value,
            expiry: parseInt(document.getElementById('banExpiry').value),
            bannedBy: username,
            timestamp: new Date().toISOString()
        };
        
        userData.data.bans.push(ban);
        saveUserData(userData);
        
        addActivity('ban', `Banned: ${ban.playerName} - ${ban.reason}`);
        
        closeModal('addBanModal');
        this.reset();
        loadBans();
        updateStats();
        loadRecentActivity();
    });
    
    // Add Admin Form
    document.getElementById('addAdminForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = getUserData();
        
        const admin = {
            name: document.getElementById('adminName').value,
            identifier: document.getElementById('adminIdentifier').value,
            role: document.getElementById('adminRole').value,
            addedAt: new Date().toISOString()
        };
        
        userData.data.admins.push(admin);
        saveUserData(userData);
        
        addActivity('admin_add', `Added admin: ${admin.name} (${admin.role})`);
        
        closeModal('addAdminModal');
        this.reset();
        loadAdmins();
        updateStats();
        loadRecentActivity();
        generateConfig();
    });
    
    // Add Whitelist Form
    document.getElementById('addWhitelistForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userData = getUserData();
        const username = getCurrentUsername();
        
        const entry = {
            name: document.getElementById('whitelistName').value,
            identifier: document.getElementById('whitelistIdentifier').value,
            bypass: document.getElementById('whitelistBypass').value,
            addedBy: username,
            addedAt: new Date().toISOString()
        };
        
        userData.data.whitelist.push(entry);
        saveUserData(userData);
        
        addActivity('whitelist_add', `Whitelisted: ${entry.name} (${entry.bypass})`);
        
        closeModal('addWhitelistModal');
        this.reset();
        loadWhitelist();
        loadRecentActivity();
        generateConfig();
    });
}

// ============================================
// Search Functions
// ============================================

function setupSearch() {
    // Player search
    const playerSearch = document.getElementById('playerSearch');
    if (playerSearch) {
        playerSearch.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#playersTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
    
    // Ban search
    const banSearch = document.getElementById('banSearch');
    if (banSearch) {
        banSearch.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#bansTableBody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
}

// ============================================
// Demo Data (for testing)
// ============================================

function addDemoData() {
    const userData = getUserData();
    if (!userData) return;
    
    // Add some demo players
    userData.data.players = [
        { name: 'Player1', identifier: 'license:abc123def456', firstSeen: new Date(Date.now() - 86400000 * 7).toISOString(), lastSeen: new Date().toISOString(), banned: false },
        { name: 'Cheater_Guy', identifier: 'steam:110000112345678', firstSeen: new Date(Date.now() - 86400000 * 3).toISOString(), lastSeen: new Date(Date.now() - 86400000).toISOString(), banned: true },
        { name: 'NewPlayer', identifier: 'license:xyz789ghi012', firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), banned: false }
    ];
    
    // Add some demo detections
    userData.data.detections = [
        { playerName: 'Cheater_Guy', type: 'godmode', details: 'Health never decreased after 50 damage', action: 'ban', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { playerName: 'SuspiciousPlayer', type: 'speedhack', details: 'Velocity exceeded 45 m/s on foot', action: 'kick', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ];
    
    saveUserData(userData);
    
    // Reload all data
    loadPlayers();
    loadDetections();
    updateStats();
}
