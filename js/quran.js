// مصفوفة الأيام المكتملة
let completedDays = JSON.parse(localStorage.getItem('completed_days')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("...جاري التحميل"); // يظهر في صورتك image_a481e9.png

    // 1. المزامنة مع السحاب فور الدخول
    if (typeof _supabase !== 'undefined') {
        await loadProgressFromCloud();
    } else {
        console.error("خطأ: _supabase غير معرف. راجع ترتيب الملفات في الـ HTML.");
    }

    const savedKhatmas = localStorage.getItem('user_khatmas');
    const savedSessions = localStorage.getItem('user_sessions');
    const savedDays = localStorage.getItem('user_days'); 

    if (savedKhatmas && savedSessions && savedDays) {
        calculatePlan(savedKhatmas, savedSessions, savedDays, false);
    } else {
        // إذا لم توجد بيانات، نظهر نافذة الأسئلة
        document.getElementById('setup-modal').style.display = 'flex';
    }
});

function calculatePlan(manualKhatmas = null, manualSessions = null, manualDays = null, shouldSave = true) {
    const khatmas = manualKhatmas || document.getElementById('target-khatma').value;
    const sessions = manualSessions || document.getElementById('daily-sessions').value;
    const days = manualDays || document.getElementById('target-days').value; 

    if (!khatmas || !sessions || !days) return;

    const totalPagesPerDay = Math.ceil((khatmas * 600) / days);
    const pagesPerSession = (totalPagesPerDay / sessions).toFixed(1);

    const calcText = document.getElementById('calc-text');
    if (calcText) {
        calcText.innerHTML = `خطتك لمدة <b>${days}</b> يوماً: قراءة <b>${totalPagesPerDay}</b> صفحة يومياً.<br>عليك قراءة <b>${pagesPerSession}</b> صفحة في كل جلسة.`;
    }

    document.getElementById('setup-modal').style.display = 'none';
    document.getElementById('plan-result').style.display = 'block';

    if (shouldSave) {
        localStorage.setItem('user_khatmas', khatmas);
        localStorage.setItem('user_sessions', sessions);
        localStorage.setItem('user_days', days);
        saveProgressToCloud(); // حفظ في السحاب
    }
    generateGrid(pagesPerSession, days);
}

function generateGrid(pages, totalDays) {
    const grid = document.getElementById('days-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

    for (let i = 1; i <= totalDays; i++) {
        const isDone = completedDays.includes(i);
        const dayDiv = document.createElement('div');
        dayDiv.className = `day-card ${isDone ? 'completed' : 'pending'}`; 
        dayDiv.id = `day-${i}`;
        dayDiv.innerHTML = `<span class="day-number">يوم ${i}</span><div class="status-icon"><i class="fas ${isDone ? 'fa-check-circle' : 'fa-times-circle'}"></i></div>`;
        dayDiv.onclick = () => toggleDay(i, pages);
        grid.appendChild(dayDiv);
    }
}

async function toggleDay(dayNumber, pages) {
    const dayElem = document.getElementById(`day-${dayNumber}`);
    const isDone = completedDays.includes(dayNumber);

    // استخدام Swal للنوافذ الجميلة
    const result = await Swal.fire({
        title: isDone ? 'تراجع؟' : 'تأكيد الإنجاز',
        text: isDone ? 'إلغاء تحديد اليوم؟' : `أتممت ورد اليوم ${dayNumber}؟`,
        icon: isDone ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonColor: '#1e5631',
        confirmButtonText: 'نعم'
    });

    if (result.isConfirmed) {
        if (!isDone) completedDays.push(dayNumber);
        else completedDays = completedDays.filter(d => d !== dayNumber);
        
        updateDayUI(dayElem, !isDone);
        saveProgressLocal();
        await saveProgressToCloud();
    }
}

async function loadProgressFromCloud() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await _supabase.from('quran_progress').select('*').eq('user_id', user.id).maybeSingle();
        if (data && data.khatma_plan) {
            localStorage.setItem('user_khatmas', data.khatma_plan.khatmas);
            localStorage.setItem('user_sessions', data.khatma_plan.sessions);
            localStorage.setItem('user_days', data.khatma_plan.days);
            completedDays = data.completed_days || [];
            localStorage.setItem('completed_days', JSON.stringify(completedDays));
        }
    } catch (e) { console.log("تحميل البيانات من السحاب..."); }
}


async function saveProgressToCloud() {
    // 1. أول رسالة للتأكد أن الدالة تم استدعاؤها أصلاً
    console.log("1. بدأت دالة الحفظ بالعمل الآن..."); 

    const { data: { user } } = await _supabase.auth.getUser();
    
    // 2. رسالة لفحص هل المتصفح يرى المستخدم أم لا
    if (!user) {
        console.error("2. توقف الكود: المتصفح لا يرى أي مستخدم مسجل دخول!");
        return;
    }
    
    console.log("3. تم العثور على المستخدم: ", user.email);

    const { error } = await _supabase.from('quran_progress').upsert({ 
        user_id: user.id, 
        completed_days: completedDays,
        khatma_plan: {
            khatmas: localStorage.getItem('user_khatmas'),
            sessions: localStorage.getItem('user_sessions'),
            days: localStorage.getItem('user_days')
        },
        updated_at: new Date()
    }, { onConflict: 'user_id' });

    if (error) {
        console.error("4. خطأ من سوبابيس أثناء الإرسال: ", error.message);
    } else {
        console.log("5. مبروك! تم إرسال البيانات وتخزينها بنجاح ✅");
        refreshDayCards();
    }
}






function updateDayUI(elem, isDone) {
    if (isDone) {
        elem.classList.replace('pending', 'completed');
        elem.querySelector('i').className = 'fas fa-check-circle';
    } else {
        elem.classList.replace('completed', 'pending');
        elem.querySelector('i').className = 'fas fa-times-circle';
    }
}

function refreshDayCards() {
    const grid = document.getElementById('days-grid');
    if (!grid) return;
    for (let i = 0; i < grid.children.length; i++) {
        const card = grid.children[i];
        const id = card.id || '';
        const parts = id.split('-');
        const n = parseInt(parts[1], 10);
        if (!Number.isNaN(n)) {
            const done = completedDays.includes(n);
            card.classList.toggle('completed', done);
            card.classList.toggle('pending', !done);
            const icon = card.querySelector('i');
            if (icon) icon.className = 'fas ' + (done ? 'fa-check-circle' : 'fa-times-circle');
        }
    }
}
function saveProgressLocal() { localStorage.setItem('completed_days', JSON.stringify(completedDays)); }

function showSetup() {
    Swal.fire({
        title: 'تعديل الخطة؟',
        text: "سيمسح التقدم الحالي والبدء من جديد.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            location.reload(); 
        }
    });
}







 
