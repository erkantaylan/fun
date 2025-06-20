document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const medicationNameInput = document.getElementById('medicationName');
    const timesPerDayInput = document.getElementById('timesPerDay');
    const doseAmountInput = document.getElementById('doseAmount');
    const doseUnitSelect = document.getElementById('doseUnit');
    const sleepTimeInput = document.getElementById('sleepTime');
    const wakeTimeInput = document.getElementById('wakeTime');
    const periodValueInput = document.getElementById('periodValue');
    const periodTypeSelect = document.getElementById('periodType');
    const addMedicationButton = document.getElementById('addMedication');
    const medicationsList = document.getElementById('medicationsList');
    const calendar = document.getElementById('calendar');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const currentMonthElement = document.getElementById('currentMonth');
    const modal = document.getElementById('dayModal');
    const modalDate = document.getElementById('modalDate');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.querySelector('.close-modal');

    // Current date
    let currentDate = new Date();
    let selectedMonth = currentDate.getMonth();
    let selectedYear = currentDate.getFullYear();

    // Medications array
    let medications = JSON.parse(localStorage.getItem('medications')) || [];

    // Fix for medications without medicationTimes or doseUnit
    medications = medications.map(med => {
        if (!med.medicationTimes) {
            const sleepTime = med.sleepTime || "23:00";
            const wakeTime = med.wakeTime || "07:00";
            med.medicationTimes = calculateMedicationTimes(med.timesPerDay || 1, sleepTime, wakeTime);
            med.sleepTime = sleepTime;
            med.wakeTime = wakeTime;
        }

        // Add doseUnit if missing (for backward compatibility)
        if (!med.doseUnit) {
            med.doseUnit = 'tablet'; // Default to tablet
        }

        return med;
    });
    saveMedications(); // Save the fixed data

    // Months in Turkish
    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

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

    // Calculate medication times
    function calculateMedicationTimes(timesPerDay, sleepTime, wakeTime) {
        // Default values if not provided
        sleepTime = sleepTime || "23:00";
        wakeTime = wakeTime || "07:00";
        timesPerDay = timesPerDay || 1;

        try {
            // Parse sleep and wake times
            const sleepHour = parseInt(sleepTime.split(':')[0]);
            const sleepMinute = parseInt(sleepTime.split(':')[1]);
            const wakeHour = parseInt(wakeTime.split(':')[0]);
            const wakeMinute = parseInt(wakeTime.split(':')[1]);

            // Calculate sleep duration in minutes
            let sleepDurationMinutes = ((24 - sleepHour) * 60 - sleepMinute) + (wakeHour * 60 + wakeMinute);

            // Calculate awake duration in minutes
            const awakeDurationMinutes = 24 * 60 - sleepDurationMinutes;

            // Calculate interval between doses in minutes
            const intervalMinutes = Math.floor(awakeDurationMinutes / timesPerDay);

            // Start from wake time and calculate dose times
            const medicationTimes = [];
            let currentTimeMinutes = wakeHour * 60 + wakeMinute;

            for (let i = 0; i < timesPerDay; i++) {
                const hour = Math.floor(currentTimeMinutes / 60) % 24;
                const minute = currentTimeMinutes % 60;

                // Format as HH:MM
                medicationTimes.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);

                // Add interval for next dose
                currentTimeMinutes = (currentTimeMinutes + intervalMinutes) % (24 * 60);

                // Check if next dose would be during sleep time
                const nextDoseHour = Math.floor(currentTimeMinutes / 60) % 24;
                const nextDoseMinute = currentTimeMinutes % 60;

                // If next dose time is after sleep time but before wake time, adjust to wake time
                if ((nextDoseHour > sleepHour || (nextDoseHour === sleepHour && nextDoseMinute >= sleepMinute)) ||
                    (nextDoseHour < wakeHour || (nextDoseHour === wakeHour && nextDoseMinute < wakeMinute))) {
                    currentTimeMinutes = wakeHour * 60 + wakeMinute;
                }
            }

            return medicationTimes;
        } catch (error) {
            console.error("Error calculating medication times:", error);
            // Return default times as fallback
            return ["08:00"];
        }
    }

    // Add medication
    addMedicationButton.addEventListener('click', () => {
        const name = medicationNameInput.value.trim();
        const timesPerDay = parseInt(timesPerDayInput.value) || 1;
        const doseAmount = parseFloat(doseAmountInput.value) || 1;
        const doseUnit = doseUnitSelect.value;
        const sleepTime = sleepTimeInput.value;
        const wakeTime = wakeTimeInput.value;
        const periodValue = parseInt(periodValueInput.value) || 1;
        const periodType = periodTypeSelect.value;

        if (!name || timesPerDay < 1 || doseAmount < 0.25 || !sleepTime || !wakeTime || periodValue < 1) {
            alert('Lütfen tüm alanları doğru şekilde doldurun.');
            return;
        }

        // Calculate period in days
        const periodDays = calculatePeriodDays(periodValue, periodType);

        // Calculate medication times
        const medicationTimes = calculateMedicationTimes(timesPerDay, sleepTime, wakeTime);

        // Format dosage string
        const dosageStr = `${timesPerDay}x${doseAmount.toFixed(2).replace(/\.00$/, '')}`;

        const newMedication = {
            id: Date.now(),
            name,
            dosageStr,
            timesPerDay,
            doseAmount,
            doseUnit,
            sleepTime,
            wakeTime,
            medicationTimes,
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
        timesPerDayInput.value = '1';
        doseAmountInput.value = '1';
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

            // Check if medicationTimes exists and is an array before using join()
            const medicationTimesText = Array.isArray(med.medicationTimes) ?
                med.medicationTimes.join(', ') :
                'Belirtilmemiş';

            // Get dose unit (for backward compatibility)
            const doseUnit = med.doseUnit || 'tablet';

            li.innerHTML = `
                <div>
                    <strong>${med.name}</strong>
                    <div>Doz: ${med.dosageStr} (günde ${med.timesPerDay} kez ${med.doseAmount} ${doseUnit})</div>
                    <div>Kullanım Saatleri: ${medicationTimesText}</div>
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

    // Format date for modal
    function formatDate(date) {
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const weekday = weekdays[date.getDay()];

        return `${day} ${month} ${year}, ${weekday}`;
    }

    // Show modal with medication details for a specific date
    function showDayDetails(date) {
        const medsForDay = getMedicationsForDate(date);

        // Set modal date
        modalDate.textContent = formatDate(date);

        // Clear modal content
        modalContent.innerHTML = '';

        if (medsForDay.length === 0) {
            modalContent.innerHTML = '<p>Bu gün için planlanmış ilaç bulunmamaktadır.</p>';
        } else {
            medsForDay.forEach(med => {
                const medDiv = document.createElement('div');
                medDiv.className = 'med-schedule';

                // Check if medicationTimes exists and is an array
                const medicationTimesHtml = Array.isArray(med.medicationTimes) ?
                    med.medicationTimes.map(time => `<li>${time} - ${med.doseAmount} ${med.doseUnit || 'tablet'}</li>`).join('') :
                    '<li>Belirtilmemiş</li>';

                medDiv.innerHTML = `
                    <h3>${med.name}</h3>
                    <p>Doz: ${med.dosageStr} (${med.doseAmount} ${med.doseUnit || 'tablet'})</p>
                    <p>Kullanım saatleri:</p>
                    <ul class="time-list">
                        ${medicationTimesHtml}
                    </ul>
                `;

                modalContent.appendChild(medDiv);
            });
        }

        // Show modal
        modal.style.display = 'block';
    }

    // Close modal when clicking the close button
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

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

            // Add click event for day details
            dayDiv.addEventListener('click', () => {
                showDayDetails(date);
            });

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