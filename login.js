// ============================================
// ⭐ StarChat v2 - ورود و ثبت‌نام
// ============================================

const LOCAL_USERS_KEY = 'starchat_users';
const CURRENT_USER_KEY = 'starchat_current';


document.addEventListener('DOMContentLoaded', async () => {
    // ⚠️ چک نکن که مستقیم بری index — اول Supabase رو چک کن
    const currentUser = getCurrentUser();

    if (currentUser) {
        // اگه کاربر توی localStorage هست، برو index
        // ولی index خودش چک می‌کنه که بتونه لاگین کنه یا نه
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});


function switchTab(tab) {
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    hideMsg();
}


// ============================================
// 📝 ثبت‌نام
// ============================================
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim().toLowerCase();
    const fullName = document.getElementById('regFullName').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn = e.target.querySelector('button');

    if (!username || !fullName || !password) {
        showMsg('همه فیلدها الزامی هستن', 'error');
        return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        showMsg('نام کاربری: ۳ تا ۲۰ کاراکتر انگلیسی', 'error');
        return;
    }
    if (password.length < 6) {
        showMsg('رمز باید حداقل ۶ کاراکتر باشه', 'error');
        return;
    }

    const users = getLocalUsers();
    if (users.find(u => u.username === username)) {
        showMsg('❌ این نام کاربری قبلاً ثبت شده', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'در حال ثبت‌نام...';
    hideMsg();

    const hiddenEmail = `${username}@starchat.local`;

    try {
        if (initSupabase()) {
            const { data, error } = await db.auth.signUp({
                email: hiddenEmail,
                password: password,
                options: {
                    data: { username, full_name: fullName }
                }
            });

            if (error && !error.message.includes('already registered')) {
                console.warn('Supabase error:', error.message);
            }

            const localUser = {
                id: 'local_' + Date.now(),
                username: username,
                fullName: fullName,
                password: password,
                hiddenEmail: hiddenEmail,
                supabaseId: data?.user?.id || null,
                createdAt: new Date().toISOString()
            };
            users.push(localUser);
            saveLocalUsers(users);

            showMsg('✅ ثبت‌نام موفق! حالا وارد شو', 'success');
            document.getElementById('registerForm').reset();
            setTimeout(() => {
                switchTab('login');
                document.getElementById('loginUsername').value = username;
                btn.disabled = false;
                btn.textContent = 'ثبت‌نام در StarChat';
            }, 1500);
        }
    } catch (err) {
        console.error('خطا:', err);
        showMsg('❌ خطا در ثبت‌نام: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'ثبت‌نام در StarChat';
    }
}


// ============================================
// 🔐 ورود
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const btn = e.target.querySelector('button');

    if (!username || !password) {
        showMsg('نام کاربری و رمز عبور رو پر کن', 'error');
        return;
    }

    const users = getLocalUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        showMsg('❌ نام کاربری پیدا نشد', 'error');
        return;
    }
    if (user.password !== password) {
        showMsg('❌ رمز عبور اشتباهه', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'در حال ورود...';
    hideMsg();

    // ⚠️ مهم: اول به Supabase لاگین کن، بعد برو index
    if (!initSupabase()) {
        showMsg('❌ خطا در اتصال به سرور', 'error');
        btn.disabled = false;
        btn.textContent = 'ورود به StarChat';
        return;
    }

    const hiddenEmail = user.hiddenEmail || `${username}@starchat.local`;

    try {
        // اول لاگین
        let { data, error } = await db.auth.signInWithPassword({
            email: hiddenEmail,
            password: password
        });

        // اگه کاربر توی Supabase نیست → ثبت‌نامش کن
        if (error && error.message.includes('Invalid login credentials')) {
            console.log('🔄 کاربر جدید → ثبت‌نام در Supabase...');

            const { data: sd, error: se } = await db.auth.signUp({
                email: hiddenEmail,
                password: password,
                options: {
                    data: { username, full_name: user.fullName }
                }
            });

            if (se) {
                console.error('Supabase signup error:', se);
                showMsg('❌ خطا در ثبت‌نام Supabase: ' + se.message, 'error');
                btn.disabled = false;
                btn.textContent = 'ورود به StarChat';
                return;
            }

            // دوباره لاگین
            const { data: ld, error: le } = await db.auth.signInWithPassword({
                email: hiddenEmail,
                password: password
            });

            if (le) {
                showMsg('❌ خطا در ورود Supabase: ' + le.message, 'error');
                btn.disabled = false;
                btn.textContent = 'ورود به StarChat';
                return;
            }

            data = ld;
            error = null;
        }

        if (error) {
            showMsg('❌ خطا: ' + error.message, 'error');
            btn.disabled = false;
            btn.textContent = 'ورود به StarChat';
            return;
        }

        if (!data.session) {
            showMsg('❌ لاگین موفق نبود. تأیید ایمیل رو خاموش کن', 'error');
            btn.disabled = false;
            btn.textContent = 'ورود به StarChat';
            return;
        }

        // ✅ حالا که Supabase لاگین شد، کاربر رو ذخیره کن
        setCurrentUser({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            password: password,
            hiddenEmail: hiddenEmail,
            supabaseId: data.session.user.id
        });

        showMsg('✅ ورود موفق!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);

    } catch (err) {
        console.error('خطا:', err);
        showMsg('❌ خطا: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'ورود به StarChat';
    }
}


// ============================================
// 🛠️ کمکی‌ها
// ============================================
function getLocalUsers() {
    try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || []; }
    catch (e) { return []; }
}
function saveLocalUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}
function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null; }
    catch (e) { return null; }
}
function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}
function showMsg(text, type = 'error') {
    const el = document.getElementById('msg');
    el.textContent = text;
    el.className = 'msg ' + type;
    el.classList.remove('hidden');
}
function hideMsg() {
    document.getElementById('msg').classList.add('hidden');
}