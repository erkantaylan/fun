// Interactive Neon Light Controller
class NeonLight {
    constructor() {
        this.isOn = false;
        this.isBroken = false;
        this.repairClicks = 0;
        this.breakdownTimer = null;
        this.flickerInterval = null;

        this.initElements();
        this.bindEvents();
        this.showHint("Click the switch to turn on the light!");
    }

    initElements() {
        // Get all DOM elements
        this.room = document.getElementById('room');
        this.tube = document.getElementById('tube');
        this.glow = document.getElementById('glow');
        this.content = document.getElementById('content');
        this.buzz = document.getElementById('buzz');
        this.status = document.getElementById('status');
        this.ballastStatus = document.getElementById('ballastStatus');
        this.statusContainer = document.getElementById('statusContainer');
        this.overlay = document.getElementById('overlay');
        this.switchElement = document.getElementById('switch');
        this.switchContainer = document.getElementById('switchContainer');
        this.fixture = document.getElementById('fixture');
        this.ballast = document.getElementById('ballast');
        this.crack = document.getElementById('crack');
        this.repairBtn = document.getElementById('repairBtn');
        this.hint = document.getElementById('hint');
        this.notification = document.getElementById('notification');
        this.clickCount = document.getElementById('clickCount');
    }

    bindEvents() {
        // Bind all click events
        this.switchElement.addEventListener('click', () => this.toggleSwitch());
        this.fixture.addEventListener('click', () => this.attemptRepair('fixture'));
        this.ballast.addEventListener('click', (e) => {
            e.stopPropagation();
            this.attemptRepair('ballast');
        });
        this.repairBtn.addEventListener('click', () => this.attemptRepair('emergency'));
    }

    toggleSwitch() {
        if (!this.isBroken) {
            this.isOn = !this.isOn;
            this.updateDisplay();

            if (this.isOn) {
                this.showHint("Light will break in 10 seconds...");
                this.scheduleBreakdown();
            } else {
                this.cancelBreakdown();
                this.showHint("Click the switch to turn on the light!");
            }
        } else {
            this.showNotification("Light is broken! Try repairing it first.");
        }
    }

    scheduleBreakdown() {
        this.breakdownTimer = setTimeout(() => {
            this.breakLight();
        }, 10000);
    }

    cancelBreakdown() {
        if (this.breakdownTimer) {
            clearTimeout(this.breakdownTimer);
            this.breakdownTimer = null;
        }
    }

    breakLight() {
        this.isBroken = true;
        this.isOn = false;
        this.startFlickering();
        this.showDamage();
        this.showHint("Light is broken! Click fixture, ballast, or repair button to fix it.");
        this.repairBtn.classList.add('visible');
        this.showNotification("⚡ BALLAST FAILURE! ⚡<br>Light needs repair!");
    }

    startFlickering() {
        let flickerCount = 0;
        this.flickerInterval = setInterval(() => {
            this.tube.classList.toggle('flicker');
            this.overlay.classList.toggle('flash');
            this.buzz.classList.toggle('active');

            flickerCount++;
            if (flickerCount > 10) {
                clearInterval(this.flickerInterval);
                this.tube.classList.remove('flicker', 'on');
                this.tube.classList.add('damaged');
                this.updateDisplay();
            }
        }, 200);
    }

    showDamage() {
        setTimeout(() => {
            this.crack.classList.add('visible');
            this.ballast.classList.add('damaged');
            this.fixture.classList.add('broken');
        }, 2000);
    }

    attemptRepair(type) {
        if (!this.isBroken) {
            this.showNotification("Light is working fine!");
            return;
        }

        this.repairClicks++;
        this.clickCount.textContent = `${this.repairClicks}/5`;

        let message = "";
        switch(type) {
            case 'fixture':
                message = `*tap tap* Percussive maintenance attempt ${this.repairClicks}`;
                break;
            case 'ballast':
                message = `Ballast replacement attempt ${this.repairClicks}`;
                break;
            case 'emergency':
                message = `Emergency repair ${this.repairClicks}/5`;
                break;
        }

        this.showNotification(message);

        if (this.repairClicks >= 5) {
            this.repairLight();
        } else {
            // Temporary flicker effect
            this.tube.classList.add('flicker');
            setTimeout(() => {
                this.tube.classList.remove('flicker');
            }, 500);
        }
    }

    repairLight() {
        this.isBroken = false;
        this.repairClicks = 0;
        this.clickCount.textContent = "0/5";

        // Remove all damage effects
        this.crack.classList.remove('visible');
        this.ballast.classList.remove('damaged');
        this.fixture.classList.remove('broken');
        this.tube.classList.remove('damaged');
        this.repairBtn.classList.remove('visible');

        // Turn light back on
        this.isOn = true;
        this.updateDisplay();

        this.showNotification("🔧 REPAIRED! 🔧<br>Light is working again!");
        this.showHint("Light repaired! It will break again in 15 seconds...");

        // Schedule next breakdown for demo purposes
        setTimeout(() => {
            if (this.isOn) {
                this.breakLight();
            }
        }, 15000);
    }

    updateDisplay() {
        // Update switch position
        this.switchElement.classList.toggle('on', this.isOn);

        // Update light appearance and room lighting
        if (this.isOn && !this.isBroken) {
            this.tube.classList.add('on');
            this.tube.classList.remove('damaged');
            this.glow.classList.add('active');
            this.room.classList.add('lit');
            this.content.classList.add('lit');
            this.statusContainer.classList.add('lit');
            this.switchContainer.classList.add('lit');
            this.status.textContent = 'ON';
        } else {
            this.tube.classList.remove('on');
            this.glow.classList.remove('active');
            this.room.classList.remove('lit');
            this.content.classList.remove('lit');
            this.statusContainer.classList.remove('lit');
            this.switchContainer.classList.remove('lit');
            this.status.textContent = 'OFF';
        }

        // Update ballast status
        this.ballastStatus.textContent = this.isBroken ? 'DAMAGED' : 'Good';
    }

    showHint(text) {
        this.hint.textContent = text;
        this.hint.classList.add('visible');

        setTimeout(() => {
            this.hint.classList.remove('visible');
        }, 5000);
    }

    showNotification(text) {
        this.notification.innerHTML = text;
        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the neon light when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new NeonLight();
});