document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const medicationNameInput = document.getElementById('medicationName');
    const dosageInput = document.getElementById('dosage');
    const periodValueInput = document.getElementById('periodValue');
    const periodTypeSelect = document.getElementById('periodType');
    const addMedicationButton = document.getElementById('addMedication');
    const medicationsList = document.getElementById('medicationsList');
    const calendar = document.getElementById('calendar');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const currentMonthElement = document.getElementById('currentMonth');

    // Current date
    let currentDate = new Date();
    let selectedMonth = currentDate.getMonth();
    let selectedYear = currentDate.getFullYear();

    // Medications array
    let medications = JSON.parse(localStorage.getItem('medications')) || [];

    // Months in Turkish
    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    // Parse dosage function
    function parseDosage(dosageStr) {
        // Expecting format like "4x1.0"
        const match = dosageStr.match(/(\d+)x(\d+(?:\.\d+)?)/);

        if (match) {
            return {
                timesPerDay: parseInt(match[1]),
                amount: parseFloat(match[2])
            };
        }

        return null;
    }

    // Calculate days for period type
    function calculatePeriodDays(value, type) {
        switch (type) {
            case 'day':
                return value;
            case 'week':
                return value * 7;
            case 'month':
                return value * 30; // Approximate
            case 'year':
                return value * 365; // Approximate
            default:
                return value;
        }
    }

    // Add medication
    addMedicationButton.addEventListener('click', () => {
        const name = medicationNameInput.value.trim();
        const dosageStr = dosageInput.value.trim();
        const periodValue = parseInt(periodValueInput.value) || 1;
        const periodType = periodTypeSelect.value;

        if (!name || !dosageStr || periodValue < 1) {
            alert('Lütfen tüm alanları doğru şekilde doldurun.');
            return;
        }

        const dosage = parseDosage(dosageStr);
        if (!dosage) {
            alert('Doz formatı hatalı. Örnek: 4x1.0');
            return;
        }

        // Calculate period in days
        const periodDays = calculatePeriodDays(periodValue, periodType);

        const newMedication = {
            id: Date.now(),
            name,
            dosageStr,
            timesPerDay: dosage.timesPerDay,
            amount: dosage.amount,
            periodValue,
            periodType,
            periodDays,
            startDate: new Date().toISOString()
        };

        medications.push(newMedication);
        saveMedications();
        renderMedicationsList();
        renderCalendar();

        // Clear inputs
        medicationNameInput.value = '';
        dosageInput.value = '';
        periodValueInput.value = '1';
        periodTypeSelect.value = 'day';
    });

    // Save medications to localStorage
    function saveMedications() {
        localStorage.setItem('medications', JSON.stringify(medications));
    }

    // Create period text
    function getPeriodText(med) {
        if (med.periodValue === 1) {
            switch (med.periodType) {
                case 'day': return 'Her gün';
                case 'week': return 'Her hafta';
                case 'month': return 'Her ay';
                case 'year': return 'Her yıl';
            }
        } else {
            switch (med.periodType) {
                case 'day': return `${med.periodValue} günde bir`;
                case 'week': return `${med.periodValue} haftada bir`;
                case 'month': return `${med.periodValue} ayda bir`;
                case 'year': return `${med.periodValue} yılda bir`;
            }
        }
        return `${med.periodValue} ${med.periodType}`;
    }

    // Render medications list
    function renderMedicationsList() {
        medicationsList.innerHTML = '';

        if (medications.length === 0) {
            medicationsList.innerHTML = '<li>Henüz ilaç eklenmedi.</li>';
            return;
        }

        medications.forEach(med => {
            const li = document.createElement('li');
            const periodText = getPeriodText(med);

            li.innerHTML = `
                <div>
                    <strong>${med.name}</strong>
                    <div>Doz: ${med.dosageStr} (günde ${med.timesPerDay} kez ${med.amount})</div>
                    <div>Periyot: ${periodText}</div>
                </div>
                <button class="delete-btn" data-id="${med.id}">Sil</button>
            `;

            medicationsList.appendChild(li);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                medications = medications.filter(med => med.id !== id);
                saveMedications();
                renderMedicationsList();
                renderCalendar();
            });
        });
    }

    // Check if a medication should be taken on a specific date
    function shouldTakeMedication(medication, date) {
        const startDate = new Date(medication.startDate);
        startDate.setHours(0, 0, 0, 0); // Normalize to start of day

        // Create a copy of the date and normalize it
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Calculate days difference
        const timeDiff = checkDate.getTime() - startDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

        // If the difference is negative, the medication wasn't started yet
        if (daysDiff < 0) {
            return false;
        }

        // Check if today is a day to take the medication based on period
        return daysDiff % medication.periodDays === 0;
    }

    // Count medications for a specific date
    function getMedicationsForDate(date) {
        return medications.filter(med => shouldTakeMedication(med, date));
    }

    // Get medication abbreviations (first 3 letters)
    function getMedicationAbbreviations(medsForDay) {
        return medsForDay.map(med => {
            // Get the first 3 letters of the medication name
            return med.name.substring(0, 3);
        }).join(', ');
    }

    // Render calendar
    function renderCalendar() {
        calendar.innerHTML = '';

        // Update month display
        currentMonthElement.textContent = `${months[selectedMonth]} ${selectedYear}`;

        // Get first day of the month
        const firstDay = new Date(selectedYear, selectedMonth, 1);

        // Get last day of the month
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

        // Get day of week of first day (0 = Sunday, 1 = Monday, ...)
        // Convert to Monday start (0 = Monday, 6 = Sunday)
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6;

        // Create previous month days
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevMonthDay = new Date(selectedYear, selectedMonth, -firstDayOfWeek + i + 1);
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'inactive');
            dayDiv.innerHTML = `<div class="day-number">${prevMonthDay.getDate()}</div>`;
            calendar.appendChild(dayDiv);
        }

        // Create current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(selectedYear, selectedMonth, i);
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');

            // Get medications for this day
            const medsForDay = getMedicationsForDate(date);

            // Apply appropriate class based on number of medications
            if (medsForDay.length === 0) {
                dayDiv.classList.add('no-med');
            } else if (medsForDay.length === 1) {
                dayDiv.classList.add('one-med');
            } else {
                dayDiv.classList.add('multiple-med');
            }

            // Get medication abbreviations for the day
            const medAbbreviations = getMedicationAbbreviations(medsForDay);

            dayDiv.innerHTML = `
                <div class="day-number">${i}</div>
                <div class="med-count">${medsForDay.length > 0 ? medsForDay.length + ' ilaç' : ''}</div>
                ${medsForDay.length > 0 ? `<div class="med-names">${medAbbreviations}</div>` : ''}
            `;

            // Add tooltip with medication names
            if (medsForDay.length > 0) {
                dayDiv.title = medsForDay.map(med => `${med.name} (${med.dosageStr})`).join('\n');
            }

            calendar.appendChild(dayDiv);
        }

        // Fill the remaining days of the week with next month days
        const totalDays = calendar.children.length;
        const remainingDays = 42 - totalDays; // 6 rows * 7 days = 42

        for (let i = 1; i <= remainingDays; i++) {
            const nextMonthDay = new Date(selectedYear, selectedMonth + 1, i);
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day', 'inactive');
            dayDiv.innerHTML = `<div class="day-number">${nextMonthDay.getDate()}</div>`;
            calendar.appendChild(dayDiv);
        }
    }

    // Navigate to previous month
    prevMonthButton.addEventListener('click', () => {
        selectedMonth--;
        if (selectedMonth < 0) {
            selectedMonth = 11;
            selectedYear--;
        }
        renderCalendar();
    });

    // Navigate to next month
    nextMonthButton.addEventListener('click', () => {
        selectedMonth++;
        if (selectedMonth > 11) {
            selectedMonth = 0;
            selectedYear++;
        }
        renderCalendar();
    });

    // Initialize
    renderMedicationsList();
    renderCalendar();
});