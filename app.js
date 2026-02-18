// ننتظر تحميل الصفحة بالكامل لضمان عمل النافبار والمزامنة
document.addEventListener('DOMContentLoaded', async function() {

    // ---------- 1. المتغيرات والأساسيات ----------
    let maghribTimeStr = ""; // تخزين وقت المغرب من الـ API

    // دالة مساعدة لتحويل الأرقام العربية إلى إنجليزية
    function convertArabicNumeralsToEnglish(str) {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.replace(/[٠-٩]/g, (d) => englishNumerals[arabicNumerals.indexOf(d)]);
    }

    // ---------- 2. النافبار (الهامبرغر) ----------
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.onclick = function() {
            navLinks.classList.toggle('active');
        };
    }

    // ---------- 4. نظام وقت الأذان الذكي ----------
    async function initPrayerTimes() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchPrayerData(pos.coords.latitude, pos.coords.longitude),
                () => fetchPrayerData(35.69, -0.63) // وهران كافتراضي
            );
        } else {
            fetchPrayerData(35.69, -0.63);
        }
    }

    async function fetchPrayerData(lat, lon) {
        try {
            const date = new Date();
            const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            
            // نستخدم adjustment=-1 لمحاولة التصحيح من المصدر
            const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=3&adjustment=-1`);
            const json = await res.json();
            const data = json.data;

            maghribTimeStr = convertArabicNumeralsToEnglish(data.timings.Maghrib);
            const maghribElem = document.getElementById('maghrib-time');
            if (maghribElem) maghribElem.innerText = maghribTimeStr;
            
            // تحديث التاريخ الهجري مع تصحيح يدوي خاص (1 رمضان -> 30 شعبان) ومعالجة أرقام عربية
            if(document.getElementById('hijri-date')) {
                const rawDay = String(data.date.hijri.day);
                let hDay = parseInt(convertArabicNumeralsToEnglish(rawDay), 10);
                let hMonth = data.date.hijri.month.ar; 
                let hYear = convertArabicNumeralsToEnglish(String(data.date.hijri.year));

                // إزاحة خاصة للجزائر: -1 يوم
                const hijriOffsetDays = -1;
                if (hijriOffsetDays === -1) {
                    if (hMonth.includes('رمضان') && hDay === 1) {
                        hDay = 30;
                        hMonth = 'شعبان';
                    } else if (!Number.isNaN(hDay) && hDay > 1) {
                        hDay = hDay - 1;
                    }
                } 
                
                window.__HIJRI_DAY = hDay;
                try { localStorage.setItem('hijri_day', String(hDay)); } catch (e) {}
                try { window.dispatchEvent(new CustomEvent('hijriDayReady', { detail: { day: hDay, month: hMonth, year: hYear } })); } catch (e) {}
                
                document.getElementById('hijri-date').innerText = `${hDay} ${hMonth} ${hYear} هـ`;
            }

            if(document.getElementById('gregorianDisplay')) {
                const arabicGregorianDate = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const englishNumberedGregorianDate = convertArabicNumeralsToEnglish(arabicGregorianDate);
                document.getElementById('gregorianDisplay').innerHTML = `<i class="fas fa-calendar"></i><span>${englishNumberedGregorianDate}</span>`;
            }
        } catch (err) { console.error("خطأ في جلب المواقيت:", err); }
    }

    function updateEverySecond() {
        const now = new Date();
        if(document.getElementById('liveTime')) {
            document.getElementById('liveTime').innerText = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        const countdownElem = document.getElementById('countdown-timer');
        if (maghribTimeStr && countdownElem) {
            const [h, m] = maghribTimeStr.split(':');
            const maghribDate = new Date();
            maghribDate.setHours(h, m, 0);

            let diff = maghribDate - now;
            if (diff < 0) {
                countdownElem.innerText = "أفطرتم هنيئاً!";
            } else {
                const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                countdownElem.innerText = `${hrs}:${mins}:${secs}`;
            }
        }
    }

    // تشغيل محرك الوقت
    initPrayerTimes();
    setInterval(updateEverySecond, 1000);
});
