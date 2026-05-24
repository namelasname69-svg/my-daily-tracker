// 1. ดึงองค์ประกอบจาก HTML
const habitList = document.getElementById('habit-list');
const addForm = document.getElementById('add-habit-form');
const habitInput = document.getElementById('habit-input');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');
const dateText = document.getElementById('date-text');
const dailyNoteInput = document.getElementById('daily-note-input');
const saveNoteBtn = document.getElementById('save-note-btn');
const calendarGrid = document.getElementById('calendar-grid');
const historyDetail = document.getElementById('history-detail');
const historyDate = document.getElementById('history-date');
const historyNote = document.getElementById('history-note');

// 2. ตัวแปรหลักคุมข้อมูลแอปทั้งหมด (โครงสร้างใหม่เก็บแยกตามวันที่)
let allData = {}; 
let currentSelectedDateStr = ""; // เก็บวันที่ปัจจุบันที่กำลังเปิดดูอยู่ (รูปแบบ DD/MM/YYYY)

// 3. ฟังก์ชันจัดการวันที่และสร้างคีย์ประจำวัน
function initDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateText.innerText = today.toLocaleDateString('th-TH', options);

    // สร้างคีย์วันที่สำหรับวันนี้ เช่น "24/5/2026"
    currentSelectedDateStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    
    // ถ้าวันนี้เป็นวันใหม่และยังไม่มีข้อมูลในระบบ ให้สร้างโครงสร้างข้อมูลเปล่าเตรียมไว้
    if (!allData[currentSelectedDateStr]) {
        // ดึงรายการกิจกรรมจากวันล่าสุดที่มี (ถ้ามี) เพื่อให้กิจกรรมเดิมยังอยู่ ไม่ต้องพิมพ์ใหม่ทุกวัน
        const dateKeys = Object.keys(allData);
        let templateHabits = [
            { text: '🏃‍♂️ ออกกำลังกาย / วิ่ง', checked: false },
            { text: '👟 เดินให้ครบ 10,000 ก้าว', checked: false },
            { text: '📚 อ่านหนังสือ 15 นาที', checked: false }
        ];
        
        if (dateKeys.length > 0) {
            const lastKey = dateKeys[dateKeys.length - 1];
            // ลอกรายการข้อความกิจกรรมมาจากวันก่อน แต่เซ็ตให้เป็น false (ยังไม่ได้ทำ) ทั้งหมด
            templateHabits = allData[lastKey].habits.map(h => ({ text: h.text, checked: false }));
        }

        allData[currentSelectedDateStr] = {
            habits: templateHabits,
            note: ""
        };
        saveToLocalStorage();
    }
}

// 4. ฟังก์ชันวาดรายการเช็คลิสต์และแสดงหมายเหตุของวันนั้นๆ
function renderActiveDay() {
    const currentDayData = allData[currentSelectedDateStr];
    habitList.innerHTML = ''; 

    // วาดเช็คลิสต์
    currentDayData.habits.forEach((habit, index) => {
        const li = document.createElement('li');
        li.className = 'habit-item';
        li.innerHTML = `
            <label>
                <input type="checkbox" class="habit-checkbox" ${habit.checked ? 'checked' : ''} data-index="${index}">
                <span>${habit.text}</span>
            </label>
            <button class="delete-btn" data-index="${index}">🗑️</button>
        `;
        habitList.appendChild(li);
    });

    // ดึงข้อความหมายเหตุมาใส่ในกล่องข้อความ
    dailyNoteInput.value = currentDayData.note || "";

    setupEventListeners();
    updateProgress();
    renderCalendar(); // อัปเดตสีของปฏิทินด้วย
}

// 5. ฟังก์ชันตั้งค่า Event การกดติ๊กถูกและลบ
function setupEventListeners() {
    const checkboxes = document.querySelectorAll('.habit-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = e.target.getAttribute('data-index');
            allData[currentSelectedDateStr].habits[index].checked = e.target.checked;
            saveToLocalStorage();
            updateProgress();
            renderCalendar(); // ติ๊กถูกปุ๊บ สีปฏิทินเปลี่ยนตามทันที
        });
    });

    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            allData[currentSelectedDateStr].habits.splice(index, 1);
            saveToLocalStorage();
            renderActiveDay();
        });
    });
}

// 6. ฟังก์ชันคำนวณและอัปเดตเปอร์เซ็นต์ Progress Bar
function updateProgress() {
    const dayData = allData[currentSelectedDateStr];
    const total = dayData.habits.length;
    const checkedCount = dayData.habits.filter(h => h.checked).length;
    const percentage = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    
    progressBarFill.style.width = percentage + '%';
    progressPercentage.innerText = percentage + '%';
}

// [เพิ่มใหม่] 7. ฟังก์ชันสร้างและวาดแถบปฏิทินย้อนหลัง 7 วัน
function renderCalendar() {
    calendarGrid.innerHTML = '';
    const today = new Date();

    // วนลูปสร้างกล่องวันย้อนหลังจากวันนี้กลับไป 7 วัน
    for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        
        const dayName = targetDate.toLocaleDateString('th-TH', { weekday: 'short' });
        const dateNum = targetDate.getDate();
        const dateStr = targetDate.getDate() + '/' + (targetDate.getMonth() + 1) + '/' + targetDate.getFullYear();

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        // คำนวณเปอร์เซ็นต์ของวันนั้นๆ เพื่อเลือกสีเม็ดจุด
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

        // เมื่อกดคลิกที่กล่องวันในปฏิทิน จะเปิดแสดงบันทึกหมายเหตุย้อนหลังของวันนั้น
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

// 8. บันทึกและดึงข้อมูลจาก LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('myHabitJournalData', JSON.stringify(allData));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('myHabitJournalData');
    if (saved) {
        allData = JSON.parse(saved);
    } else {
        allData = {};
    }
}

// 9. ดักจับการเพิ่มกิจกรรมใหม่
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = habitInput.value.trim();
    if (text) {
        allData[currentSelectedDateStr].habits.push({ text: text, checked: false });
        saveToLocalStorage();
        renderActiveDay();
        habitInput.value = '';
    }
});

// [เพิ่มใหม่] 10. ดักจับปุ่มกดบันทึกหมายเหตุประจำวัน
saveNoteBtn.addEventListener('click', () => {
    const noteText = dailyNoteInput.value.trim();
    allData[currentSelectedDateStr].note = noteText;
    saveToLocalStorage();
    renderCalendar(); // รีเฟรชปฏิทินเผื่อเปิดดูประวัติทันที
    alert('บันทึกหมายเหตุประจำวันเรียบร้อยแล้ว! 🎉');
});

// สั่งทำงานเมื่อเปิดหน้าเว็บ
loadFromLocalStorage();
initDate();
renderActiveDay();
