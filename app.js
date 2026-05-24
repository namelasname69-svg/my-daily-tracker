// 1. ดึงองค์ประกอบจาก HTML
const habitList = document.getElementById('habit-list');
const addForm = document.getElementById('add-habit-form');
const habitInput = document.getElementById('habit-input');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentage = document.getElementById('progress-percentage');
const dateText = document.getElementById('date-text');

// 2. ตัวแปรหลักที่จะใช้เก็บรายการกิจกรรมทั้งหมดในแอป
let habits = [];

// 3. ฟังก์ชันจัดการวันที่ และระบบรีเซ็ตเมื่อขึ้นวันใหม่ อัตโนมัติ
function handleDateAndReset() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateText.innerText = today.toLocaleDateString('th-TH', options);

    // สร้างข้อความระบุวันที่แบบสั้นเพื่อใช้เปรียบเทียบ เช่น "24/5/2026"
    const todayString = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    const lastSavedDate = localStorage.getItem('lastSavedDate');

    // ตรวจสอบ: ถ้ามีวันที่เซฟไว้ในเครื่อง แล้ววันนั้น "ไม่ใช่ซ้ำกับวันนี้" แปลว่าขึ้นวันใหม่แล้ว!
    if (lastSavedDate && lastSavedDate !== todayString) {
        // วนลูปเปลี่ยนสถานะทุกกิจกรรมให้กลับเป็น false (เริ่มใหม่หมด)
        habits.forEach(habit => habit.checked = false);
        saveToLocalStorage();
    }
    
    // บันทึกวันที่ปัจจุบันไว้เปรียบเทียบในครั้งต่อไป
    localStorage.setItem('lastSavedDate', todayString);
}

// 4. ฟังก์ชันสำหรับวาดรายการกิจกรรมออกมาบนหน้าจอเว็บ
function renderHabits() {
    habitList.innerHTML = ''; // เคลียร์หน้าจอให้ว่างก่อนวาดใหม่

    habits.forEach((habit, index) => {
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

    // หลังจากวาดเสร็จ ให้ผูกระบบดักจับการกดเข้ากับ Checkbox และ ปุ่มลบ ทันที
    setupEventListeners();
    updateProgress();
}

// 5. ฟังก์ชันตั้งค่าการดักจับเหตุการณ์ (ติ๊กถูก และ ลบกิจกรรม)
function setupEventListeners() {
    // ดักจับการติ๊กถูก
    const checkboxes = document.querySelectorAll('.habit-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const index = e.target.getAttribute('data-index');
            habits[index].checked = e.target.checked; // อัปเดตสถานะในตัวแปร
            saveToLocalStorage();
            updateProgress();
        });
    });

    // ดักจับการกดปุ่มลบกิจกรรม
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            habits.splice(index, 1); // ลบกิจกรรมนั้นออกจากตัวแปร Array
            saveToLocalStorage();
            renderHabits(); // วาดหน้าจอใหม่หลังลบ
        });
    });
}

// 6. ฟังก์ชันคำนวณและอัปเดตแถบความคืบหน้า
function updateProgress() {
    const totalHabits = habits.length;
    const checkedCount = habits.filter(habit => habit.checked).length;
    const percentage = totalHabits > 0 ? Math.round((checkedCount / totalHabits) * 100) : 0;
    
    progressBarFill.style.width = percentage + '%';
    progressPercentage.innerText = percentage + '%';
}

// 7. ฟังก์ชันบันทึกข้อมูลลงเครื่อง
function saveToLocalStorage() {
    localStorage.setItem('myDynamicHabits', JSON.stringify(habits));
}

// 8. ฟังก์ชันดึงข้อมูลเริ่มต้นจากเครื่อง
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('myDynamicHabits');
    if (savedData) {
        habits = JSON.parse(savedData);
    } else {
        // ถ้าเป็นผู้ใช้ใหม่และไม่มีข้อมูลในเครื่องเลย ให้ใส่ค่าเริ่มต้นไว้ให้ 3 อันก่อน
        habits = [
            { text: '🏃‍♂️ ออกกำลังกาย / วิ่ง', checked: false },
            { text: '👟 เดินให้ครบ 10,000 ก้าว', checked: false },
            { text: '📚 อ่านหนังสือ 15 นาที', checked: false }
        ];
        saveToLocalStorage();
    }
}

// 9. ระบบดักจับตอนที่ผู้ใช้พิมพ์กิจกรรมใหม่แล้วกดส่งฟอร์ม (หรือกดปุ่ม +)
addForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ป้องกันไม่ให้เว็บรีเฟรชหน้าตาเองตามธรรมชาติของฟอร์ม
    const text = habitInput.value.trim(); // ตัดช่องว่างส่วนเกินออก
    
    if (text) {
        habits.push({ text: text, checked: false }); // เพิ่มกิจกรรมใหม่เข้าไป
        saveToLocalStorage();
        renderHabits(); // วาดหน้าจอใหม่เพื่อให้รายการอัปเดต
        habitInput.value = ''; // เคลียร์ช่องพิมพ์ให้ว่างพร้อมพิมพ์อันต่อไป
    }
});

// 10. สั่งให้ระบบเริ่มทำงานทั้งหมดตามลำดับ
loadFromLocalStorage();
handleDateAndReset();
renderHabits();