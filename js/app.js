document.addEventListener('DOMContentLoaded', async function() {

    let maghribTimeStr = "";

    function convertArabicNumeralsToEnglish(str) {
        const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.replace(/[٠-٩]/g, (d) => englishNumerals[arabicNumerals.indexOf(d)]);
    }

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.onclick = function() {
            navLinks.classList.toggle('active');
        };
    }

    async function initPrayerTimes() {
        const CACHE_KEY = 'prayer_times_cache_v10_hijri_pure_api';
        const todayStr = new Date().toDateString();

        let prayerData = null;

        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.date === todayStr && parsed.data) {
                    console.log("Using cached prayer data");
                    prayerData = parsed.data;
                }
            }
        } catch (e) {
            console.error("Cache error:", e);
        }

        if (!prayerData) {
            try {
                const city = 'Oran';
                const country = 'Algeria';
                const method = 3; 
                const adjustment = -1; 

                console.log(`Fetching prayer times for ${city}, ${country} with adjustment ${adjustment}...`);

                const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}&adjustment=${adjustment}`);
                const json = await response.json();
                
                console.log("API Response:", json);

                if (json.code === 200 && json.data) {
                    prayerData = json.data;
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        date: todayStr,
                        data: prayerData
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch prayer times:", err);
            }
        }

        if (prayerData) {
            updateUI(prayerData);
        }
    }

    function updateUI(data) {
        if (data.timings) {
            maghribTimeStr = convertArabicNumeralsToEnglish(data.timings.Maghrib);
            const maghribElem = document.getElementById('maghrib-time');
            if (maghribElem) maghribElem.innerText = maghribTimeStr;
        }

        if (data.date && data.date.hijri) {
            const hijri = data.date.hijri;
            let hDay = parseInt(convertArabicNumeralsToEnglish(String(hijri.day)), 10);
            const hMonth = hijri.month.ar;
            const hYear = convertArabicNumeralsToEnglish(String(hijri.year));

            window.__HIJRI_DAY = hDay;
            localStorage.setItem('hijri_day', String(hDay));

            window.dispatchEvent(new CustomEvent('hijriDayReady', { 
                detail: { day: hDay, month: hMonth, year: hYear } 
            }));

            const hijriElem = document.getElementById('hijri-date');
            if (hijriElem) {
                hijriElem.innerText = `${hDay} ${hMonth} ${hYear} هـ`;
            }
        }

        const gregorianElem = document.getElementById('gregorianDisplay');
        if (gregorianElem) {
            const arabicGregorianDate = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const englishNumberedGregorianDate = convertArabicNumeralsToEnglish(arabicGregorianDate);
            gregorianElem.innerHTML = `<i class="fas fa-calendar"></i><span>${englishNumberedGregorianDate}</span>`;
        }
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

    initPrayerTimes();
    setInterval(updateEverySecond, 1000);
});
