const supabaseUrl = 'https://yyzhoblvziqtsixvyafk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5emhvYmx2emlxdHNpeHZ5YWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjA1MDcsImV4cCI6MjA4NjQ5NjUwN30.mbdSlbg6gDHBZ3FRyzK0SticDT7k7cVRmYVGamhwwA4';

// 2. إنشاء الاتصال
const _supabase = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage
    }
});

// 3. دالة إنشاء حساب جديد (المرتبطة بزر "تسجيل")
async function register() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('regPassword').value;
    const name = document.getElementById('fullName').value;

    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: name } 
        }
    });

    if (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'فشل التسجيل', text: error.message });
        } else {
            alert("فشل التسجيل: " + error.message);
        }
    } else {
        if (typeof Swal !== 'undefined') {
            await Swal.fire({ icon: 'success', title: 'تم إنشاء الحساب!', text: 'تفقد بريدك الإلكتروني لتأكيده.' });
        } else {
            alert("تم إنشاء الحساب بنجاح! تفقد بريدك الإلكتروني لتأكيده.");
        }
        toggleAuth(); // نقله لصفحة تسجيل الدخول
    }
}


async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ icon: 'error', title: 'خطأ في الدخول', text: error.message });
        } else {
            alert("خطأ في الدخول: " + error.message);
        }
    } else {
        if (typeof Swal !== 'undefined') {
            await Swal.fire({ icon: 'success', title: 'أهلاً بك مجدداً!', text: 'تم تسجيل الدخول بنجاح', timer: 1500, showConfirmButton: false });
        } else {
            alert("أهلاً بك مجدداً في خطوات المسلم!");
        }
        // بعد النجاح، نعيد تحميل الصفحة لتحديث حالة المستخدم
        window.location.href = "index.html"; 
    }
}
// مراقب حالة المستخدم الذكي
_supabase.auth.onAuthStateChange((event, session) => {
    const profileLink = document.getElementById('profileLink');
    const authSection = document.querySelector('.auth-section'); // قسم نماذج الدخول

    if (session) {
        // 1. تحديث اسم المستخدم في الهيدر
        const userName = session.user.user_metadata.full_name || "ياسين";
        if (profileLink) {
            profileLink.innerHTML = `<i class="fas fa-user-circle"></i> أهلاً، ${userName}`;
            profileLink.href = "#"; 
        }

        // 2. إخفاء نماذج تسجيل الدخول إذا كان المستخدم داخلاً بالفعل
        if (authSection) {
            authSection.style.display = 'none'; 
            // يمكنك إظهار رسالة ترحيب كبيرة مكانها
        }
        
        console.log("تأكيد: المستخدم داخل الآن باسم", userName);
    } else {
        // في حالة الخروج
        if (profileLink) {
            profileLink.innerHTML = `<i class="fas fa-user"></i> الملف الشخصي`;
            profileLink.href = "auth.html";
        }
        if (authSection) {
            authSection.style.display = 'block';
        }
    }
});
// أضف هذه الدالة في auth.js
async function handleLogout() {
    await _supabase.auth.signOut();
    alert("تم تسجيل الخروج");
    window.location.reload(); // لإعادة الموقع لحالته الأصلية
}

// دالة لتبديل عرض نماذج تسجيل الدخول/إنشاء الحساب
function toggleAuth() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm && signupForm) {
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        }
    }
}
