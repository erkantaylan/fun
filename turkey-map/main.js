var tooltip = document.querySelector("#tooltip");
var cities = document.querySelectorAll("g#turkey > g");

var selectedCities = new Set();

cities.forEach(function (city) {
    city.addEventListener("mousemove", tooltip_position);
    city.addEventListener("mouseleave", hide_tooltip);
    city.addEventListener("click", toggle_select);
});

function tooltip_position(e) {
    var cityCode = this.dataset.cityCode;
    var cityName = this.dataset.cityName;

    tooltip.innerHTML =
        '<div class="plate"><b>' +
        cityCode +
        "</b><span>" +
        cityName +
        "</span></div>";

    tooltip.style.left = (e.pageX - 15) + "px";
    tooltip.style.top = (e.pageY - 50) + "px";
    tooltip.style.display = "block";
}

function hide_tooltip() {
    tooltip.style.display = "none";
}

function toggle_select(e) {
    var cityCode = this.dataset.cityCode;
    var cityName = this.dataset.cityName;
    var isSelected = this.classList.contains("selected");

    if (isSelected) {
        // Deselect the city
        this.classList.remove("selected");
        selectedCities.delete(cityCode);

        // Remove plate number
        var plateLabel = this.querySelector(".city-plate-number");
        if (plateLabel) {
            this.removeChild(plateLabel);
        }
    } else {
        // Select the city
        this.classList.add("selected");
        selectedCities.add(cityCode);

        // Remove any existing elements (cleanup)
        var existing = this.querySelector("g.city-label-group");
        if (existing) {
            this.removeChild(existing);
        }
        var existingPlate = this.querySelector(".city-plate-number");
        if (existingPlate) {
            this.removeChild(existingPlate);
        }

        // Find the center of the city
        var path = this.querySelector("path");
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

        this.appendChild(plateLabel);

        // Make sure the fill is applied properly to the path
        var path = this.querySelector("path");
        if (path) {
            path.style.fill = "inherit";
        }
    }
}