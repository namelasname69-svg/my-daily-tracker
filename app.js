// 1. ดึงองค์ประกอบจาก HTML
const habitList = document.getElementById('habit-list');
const addForm = document.getElementById('add-habit-form');
const habitInput = document.getElementById('habit-input');
const categoryInput = document.getElementById('category-input');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');
const dateText = document.getElementById('date-text');
const dailyNoteInput = document.getElementById('daily-note-input');
const saveNoteBtn = document.getElementById('save-note-btn');
const calendarGrid = document.getElementById('calendar-grid');
const historyDetail = document.getElementById('history-detail');
const historyDate = document.getElementById('history-date');
const historyNote = document.getElementById('history-note');
const streakCountDisplay = document.getElementById('streak-count');
const clearAllBtn = document.getElementById('clear-all-btn');

// 2. ตัวแปรเก็บข้อมูล
let allData = {}; 
let currentSelectedDateStr = ""; 
let currentStreak = 0;
let hasCelebratedToday = false; // กันไม่ให้พลุยิงซ้ำๆ ตอนกดติ๊กเข้าออก

// 3. ฟังก์ชันจัดการวันที่และระบบรีเซ็ต
function initDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateText.innerText = today.toLocaleDateString('th-TH', options);

    currentSelectedDateStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    
    if (!allData[currentSelectedDateStr]) {
        const dateKeys = Object.keys(allData);
        
        // รายการเริ่มต้นชุดใหม่ตามที่คุณสั่งเป๊ะๆ แยกหมวดหมู่ชัดเจน
        let templateHabits = [
            { text: '🏃‍♂️ วิ่งออกกำลังกาย', checked: false, category: 'health' },
            { text: '💪 เล่นฟิตเนส', checked: false, category: 'health' },
            { text: '👟 เดินครบ 10,000 ก้าว', checked: false, category: 'health' },
            { text: '📚 อ่านหนังสือ 15 นาที', checked: false, category: 'growth' },
            { text: '🇬🇧 เรียนภาษาอังกฤษ 1 บท', checked: false, category: 'growth' }
        ];
        
        // ถ้าเคยมีวันก่อนหน้า ให้ดึงรายการข้อความและประเภทเดิมมาใช้ แต่รีเซ็ตติ๊กถูกออก
        if (dateKeys.length > 0) {
            const lastKey = dateKeys[dateKeys.length - 1];
            templateHabits = allData[lastKey].habits.map(h => ({ text: h.text, checked: false, category: h.category }));
        }

        allData[currentSelectedDateStr] = {
            habits: templateHabits,
            note: ""
        };
        hasCelebratedToday = false; // วันใหม่ ยิงพลุใหม่ได้
        saveToLocalStorage();
    }
    
    calculateStreak();
}

// 4. ฟังก์ชันวาดรายการกิจกรรมบนหน้าจอ
function renderActiveDay() {
    const currentDayData = allData[currentSelectedDateStr];
    habitList.innerHTML = ''; 

    currentDayData.habits.forEach((habit, index) => {
        const li = document.createElement('li');
        // ใส่คลาสสไตล์สีแยกตามประเภท (เช่น cat-health, cat-growth)
        li.className = `habit-item cat-${habit.category || 'routine'}`;
        li.innerHTML = `
            <label>
                <input type="checkbox" class="habit-checkbox" ${habit.checked ? 'checked' : ''} data-index="${index}">
                <span>${habit.text}</span>
            </label>
            <button class="delete-btn" data-index="${index}">🗑️</button>
        `;
        habitList.appendChild(li);
    });

    dailyNoteInput.value = currentDayData.note || "";
    setupEventListeners();
    updateProgress();
    renderCalendar();
}

// 5. ระบบดักจับการทำกิจกรรม
function setupEventListeners() {
    const checkboxes = document.querySelectorAll('.habit-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = e.target.getAttribute('data-index');
            allData[currentSelectedDateStr].habits[index].checked = e.target.checked;
            saveToLocalStorage();
            updateProgress();
            renderCalendar();
            calculateStreak(); // ติ๊กเข้าออกให้คำนวณแต้มไฟใหม่
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            allData[currentSelectedDateStr].habits.splice(index, 1);
            saveToLocalStorage();
            renderActiveDay();
            calculateStreak();
        });
    });
}

// 6. อัปเดตและคำนวณแถบความคืบหน้า + ระบบยิงพลุ 🎉
function updateProgress() {
    const dayData = allData[currentSelectedDateStr];
    const total = dayData.habits.length;
    const checkedCount = dayData.habits.filter(h => h.checked).length;
    const percentage = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    
    progressBarFill.style.width = percentage + '%';
    progressPercentage.innerText = percentage + '%';

    // ถ้ารอบนี้กดจนครบ 100% เต็ม และวันนี้ยังไม่ได้ฉลอง ให้จุดพลุทันที!
    if (percentage === 100 && !hasCelebratedToday) {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 } // ยิงจากระดับล่างหน้าจอมือถือขึ้นมาสวยๆ
        });
        hasCelebratedToday = true;
    } else if (percentage < 100) {
        hasCelebratedToday = false; // ถ้าติ๊กออก ให้เคลียร์สิทธิ์เผื่อกดเต็มใหม่อีกครั้ง
    }
}

// 7. ระบบคำนวณไฟลุกต่อเนื่อง (Streak) 🔥
function calculateStreak() {
    let streak = 0;
    const today = new Date();
    
    // ตรวจสอบย้อนกลับไปเรื่อยๆ เริ่มจากวันนี้
    while (true) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - streak);
        const dateStr = checkDate.getDate() + '/' + (checkDate.getMonth() + 1) + '/' + checkDate.getFullYear();
        
        // ดูว่าวันนั้นมีข้อมูลไหม และทำครบ 100% หรือเปล่า
        if (allData[dateStr]) {
            const total = allData[dateStr].habits.length;
            const checked = allData[dateStr].habits.filter(h => h.checked).length;
            const isFull = total > 0 && checked === total;
            
            if (isFull) {
                streak++; // ครบถ้วน นับแต้มเพิ่ม
            } else {
                // ข้อยกเว้น: ถ้าเป็น "วันนี้" แล้วยังทำไม่ครบ ไม่ถือว่าสายขาด ให้ข้ามไปเช็กวันวานก่อนหน้า
                if (streak === 0) {
                    // แต่ถ้าลองไปดูวันวานแล้วไม่เต็มด้วย ถึงจะหยุดนับจริง
                    const yesterday = new Date(today);
                    yesterday.setDate(today.getDate() - 1);
                    const yestStr = yesterday.getDate() + '/' + (yesterday.getMonth() + 1) + '/' + yesterday.getFullYear();
                    if (allData[yestStr]) {
                        const yTotal = allData[yestStr].habits.length;
                        const yChecked = allData[yestStr].habits.filter(h => h.checked).length;
                        if (yTotal > 0 && yChecked === yTotal) {
                            streak = 0; // แปลว่าวันนี้ยังไม่เต็ม แต่วันก่อนๆ เต็ม กัปตันแต้มยังอยู่ที่ 0 (รอเติมให้เต็มวันนี้)
                            break;
                        }
                    }
                }
                break; // แต้มขาด สิ้นสุดวงลูป
            }
        } else {
            break; // ไม่มีข้อมูลวันนั้น หยุดนับ
        }
    }
    
    currentStreak = streak;
    streakCountDisplay.innerText = currentStreak;
    localStorage.setItem('myHabitStreak', currentStreak);
}

// 8. วาดปฏิทินย้อนหลัง 7 วัน
function renderCalendar() {
    calendarGrid.innerHTML = '';
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        
        const dayName = targetDate.toLocaleDateString('th-TH', { weekday: 'short' });
        const dateNum = targetDate.getDate();
        const dateStr = targetDate.getDate() + '/' + (targetDate.getMonth() + 1) + '/' + targetDate.getFullYear();

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        let pctClass = '';
        if (allData[dateStr]) {
            const total = allData[dateStr].habits.length;
            const checked = allData[dateStr].habits.filter(h => h.checked).length;
            const pct = total > 0 ? (checked / total) * 100 : 0;
            
            if (pct === 100) pctClass = 'pct-full';
            else if (pct >= 50) pctClass = 'pct-mid';
            else if (pct > 0) pctClass = 'pct-low';
        }

        if (pctClass) dayDiv.classList.add(pctClass);

        dayDiv.innerHTML = `
            <span class="day-label">${dayName}</span>
            <span style="font-weight:bold; margin-bottom:5px;">${dateNum}</span>
            <div class="status-dot"></div>
        `;

        dayDiv.addEventListener('click', () => {
            historyDetail.classList.remove('hidden');
            const formattedDateText = targetDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            historyDate.innerText = `📌 บันทึกของวันที่ ${formattedDateText}:`;
            
            if (allData[dateStr] && allData[dateStr].note) {
                historyNote.innerText = `"${allData[dateStr].note}"`;
            } else {
                historyNote.innerText = "(ไม่มีการบันทึกหมายเหตุไว้ในวันนี้)";
            }
        });

        calendarGrid.appendChild(dayDiv);
    }
}

// 9. บันทึกและดึงข้อมูลจาก LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('myHabitJournalDataPro', JSON.stringify(allData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('myHabitJournalDataPro');
    if (saved) {
        allData = JSON.parse(saved);
    } else {
        allData = {};
    }
    currentStreak = parseInt(localStorage.getItem('myHabitStreak')) || 0;
}

// 10. ระบบเพิ่มกิจกรรมตามแท็กสี
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = habitInput.value.trim();
    const category = categoryInput.value; // ดึงค่าแท็กสีแดง/น้ำเงิน/เขียว จากตัวเลือก
    
    if (text) {
        allData[currentSelectedDateStr].habits.push({ text: text, checked: false, category: category });
        saveToLocalStorage();
        renderActiveDay();
        calculateStreak();
        habitInput.value = '';
    }
});

// 11. ปุ่มกดบันทึกหมายเหตุ
saveNoteBtn.addEventListener('click', () => {
    const noteText = dailyNoteInput.value.trim();
    allData[currentSelectedDateStr].note = noteText;
    saveToLocalStorage();
    renderCalendar();
    alert('บันทึกหมายเหตุประจำวันเรียบร้อยแล้ว! 🎉');
});

// 12. ปุ่มล้างข้อมูลแอปทั้งหมด (Reset Factory)
clearAllBtn.addEventListener('click', () => {
    if (confirm('คุณแน่ใจใช่ไหมที่จะลบประวัติและกิจกรรมทั้งหมด? แอปจะกลับไปเริ่มต้นใหม่แกะกล่องทันที')) {
        localStorage.clear();
        location.reload(); // รีเฟรชหน้าเพื่อเริ่มระบบใหม่ทั้งหมด
    }
});

// สั่งทำงานเมื่อเปิดหน้าเว็บ
loadFromLocalStorage();
initDate();
renderActiveDay();
