var tooltipsEnabled = false;



var tooltip = document.querySelector("#tooltip");
var cities = document.querySelectorAll("g#turkey > g");

var selectedCities = new Set();

cities.forEach(function (city) {
    city.addEventListener("mousemove", tooltip_position);
    city.addEventListener("mouseleave", hide_tooltip);
    city.addEventListener("click", toggle_select);
});

function addTooltipToggleButton() {
    // Create the toggle button
    var toggleButton = document.createElement("button");
    toggleButton.id = "tooltip-toggle";
    toggleButton.className = "tooltip-toggle-btn";
    toggleButton.innerHTML = "Disable Tooltips";
    toggleButton.onclick = toggleTooltips;

    // Style the button
    toggleButton.style.position = "absolute";
    toggleButton.style.top = "10px";
    toggleButton.style.right = "10px";
    toggleButton.style.padding = "8px 12px";
    toggleButton.style.backgroundColor = "#0249c7";
    toggleButton.style.color = "#ffffff";
    toggleButton.style.border = "none";
    toggleButton.style.borderRadius = "4px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.fontFamily = "'Segoe UI', 'Inter', 'Roboto', Arial, sans-serif";
    toggleButton.style.fontSize = "14px";
    toggleButton.style.fontWeight = "bold";
    toggleButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    // Add hover effect
    toggleButton.onmouseover = function() {
        this.style.backgroundColor = "#0033a0";
    };
    toggleButton.onmouseout = function() {
        this.style.backgroundColor = "#0249c7";
    };

    // Add the button to the document
    document.body.appendChild(toggleButton);
}

// Function to toggle tooltips on/off
function toggleTooltips() {
    tooltipsEnabled = !tooltipsEnabled;

    // Update button text
    var toggleButton = document.getElementById("tooltip-toggle");
    if (toggleButton) {
        toggleButton.innerHTML = tooltipsEnabled ? "Disable Tooltips" : "Enable Tooltips";
    }

    // If tooltips are disabled, hide any visible tooltip
    if (!tooltipsEnabled) {
        hide_tooltip();
    }
}

function tooltip_position(e) {
    // Only show tooltip if tooltips are enabled
    if (!tooltipsEnabled) return;

    var cityCode = this.dataset.cityCode;
    var cityName = this.dataset.cityName;

    tooltip.innerHTML =
        '<div class="plate"><b>' +
        cityCode +
        "</b><span>" +
        cityName +
        "</span></div>";

    // Position tooltip slightly away from cursor
    tooltip.style.left = (e.pageX + 15) + "px";
    tooltip.style.top = (e.pageY + 10) + "px";
    tooltip.style.display = "block";
}

function hide_tooltip() {
    tooltip.style.display = "none";
}

function toggle_select(e) {
    const city = this;
    const cityCode = city.dataset.cityCode;
    const isSelected = city.classList.contains("selected");

    if (isSelected) {
        // Deselect the city
        city.classList.remove("selected");
        selectedCities.delete(cityCode);

        // Remove plate number
        const plateLabel = city.querySelector(".city-plate-number");
        if (plateLabel) {
            city.removeChild(plateLabel);
        }
    } else {
        // Select the city using our reusable function
        selectCity(city);
    }
}


/* pre selected cities*/

// Array of pre-selected city plate numbers (1-21)
var preSelectedPlates = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "32", "34", "35", "42"
];

// Initialize the map with pre-selected cities
function initializeMap() {
    // Select cities based on the preSelectedPlates array
    cities.forEach(function (city) {
        var cityCode = city.dataset.cityCode;
        if (preSelectedPlates.includes(cityCode)) {
            selectCity(city);
        }
    });
}

// Function to select a city programmatically
function selectCity(city) {
    var cityCode = city.dataset.cityCode;
    var cityName = city.dataset.cityName;

    // Add to selected class and selectedCities set
    city.classList.add("selected");
    selectedCities.add(cityCode);

    // Add the plate number inside the city
    var path = city.querySelector("path");
    var x = 0, y = 0;
    if (path && typeof path.getBBox === "function") {
        var bbox = path.getBBox();
        x = bbox.x + bbox.width / 2;
        y = bbox.y + bbox.height / 2;
    }

    // Create the fancy plate number text
    var plateLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    plateLabel.setAttribute("x", x);
    plateLabel.setAttribute("y", y);
    plateLabel.setAttribute("class", "city-plate-number");
    plateLabel.textContent = cityCode;

    city.appendChild(plateLabel);

    // Make sure the fill is applied properly to the path
    if (path) {
        path.style.fill = "inherit";
    }
}

document.addEventListener("DOMContentLoaded", function() {
    addTooltipToggleButton();

    // We need to replace the original function with our modified version
    // First remove existing event listeners
    cities.forEach(function(city) {
        city.removeEventListener("mousemove", tooltip_position);
    });

    // Then add our updated event listeners back
    cities.forEach(function(city) {
        city.addEventListener("mousemove", tooltip_position);
    });

    // Initialize pre-selected cities (referencing the function we created earlier)
    if (typeof initializeMap === 'function') {
        initializeMap();
    }
});