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

    tooltip.style.left = e.pageX + "px";
    tooltip.style.top = e.pageY + "px";
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
        this.classList.remove("selected");
        selectedCities.delete(cityCode);

        // Remove city label
        var label = this.querySelector("g.city-label-group");
        if (label) {
            this.removeChild(label);
        }
    } else {
        this.classList.add("selected");
        selectedCities.add(cityCode);

        // Add city badge and name side by side
        var existing = this.querySelector("g.city-label-group");
        if (!existing) {
            var path = this.querySelector("path");
            var x = 0, y = 0;
            if (path && typeof path.getBBox === "function") {
                var bbox = path.getBBox();
                x = bbox.x + bbox.width / 2;
                y = bbox.y + bbox.height / 2;
            }
            var labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            labelGroup.setAttribute("class", "city-label-group");

            // Plate badge
            var codeRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            codeRect.setAttribute("x", x - 17);
            codeRect.setAttribute("y", y - 10);
            codeRect.setAttribute("width", 22);
            codeRect.setAttribute("height", 16);
            codeRect.setAttribute("rx", 4);
            codeRect.setAttribute("fill", "#0249c7");
            codeRect.setAttribute("stroke", "#fff");
            codeRect.setAttribute("stroke-width", 1);

            var codeLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            codeLabel.setAttribute("x", x - 6);
            codeLabel.setAttribute("y", y + 2);
            codeLabel.setAttribute("class", "city-label city-label-plate");
            codeLabel.setAttribute("text-anchor", "middle");
            codeLabel.setAttribute("alignment-baseline", "middle");
            codeLabel.setAttribute("pointer-events", "none");
            codeLabel.textContent = cityCode;

            // City name
            var nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            nameLabel.setAttribute("x", x + 16);
            nameLabel.setAttribute("y", y + 2);
            nameLabel.setAttribute("class", "city-label city-label-name");
            nameLabel.setAttribute("text-anchor", "start");
            nameLabel.setAttribute("alignment-baseline", "middle");
            nameLabel.setAttribute("pointer-events", "none");
            nameLabel.textContent = cityName;

            labelGroup.appendChild(codeRect);
            labelGroup.appendChild(codeLabel);
            labelGroup.appendChild(nameLabel);
            this.appendChild(labelGroup);
        }
    }
}