// Variables
let filledSeats = 0;
const totalRows = 14;
const leftGroupCols = 5;
const centerGroupCols = 14;
const rightGroupCols = 5;

const totalSeats = (leftGroupCols * totalRows) + (centerGroupCols * totalRows) + (rightGroupCols * totalRows);

const leftGroup = document.getElementById("leftGroup");
const centerGroup = document.getElementById("centerGroup");
const rightGroup = document.getElementById("rightGroup");

const remainingSeatsElement = document.getElementById("remainingSeats");
const groupList = document.getElementById("groupList");

let isJaugeTendue = false;
let lastFilledRow = totalRows - 1;
let groupColors = [];

const EMPTY_SEAT_COLOR = "rgb(204, 255, 204)";

// 🔹 Fonction pour créer les sièges vides
function createStadium() {
    createSeats(leftGroup, leftGroupCols, totalRows);
    createSeats(centerGroup, centerGroupCols, totalRows);
    createSeats(rightGroup, rightGroupCols, totalRows);
    updateRemainingSeats();
}

function createSeats(group, cols, rows) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const div = document.createElement("div");
            div.style.backgroundColor = EMPTY_SEAT_COLOR;
            div.style.position = "relative";
            group.appendChild(div);
        }
    }
}

createStadium();

// 🔹 Fonction pour afficher l'application après le choix de la jauge
function setJaugeTendue(tendue) {
    isJaugeTendue = tendue;

    document.getElementById("initial-question").style.display = "none";
    document.getElementById("app").style.display = "block";
}

// 🔹 Fonction pour mettre à jour les places restantes
function updateRemainingSeats() {
    let occupiedSeats = document.querySelectorAll("#stadium div:not([style*='background-color: " + EMPTY_SEAT_COLOR + "'])").length;
    remainingSeatsElement.textContent = totalSeats - occupiedSeats;
}

// 🔹 Fonction pour ajouter un groupe
function addGroup() {
    const adults = parseInt(document.getElementById("adults").value);
    const children = parseInt(document.getElementById("children").value);

    if (isNaN(adults) || adults < 0 || isNaN(children) || children < 0) {
        alert("Veuillez entrer un nombre valide d'adultes et d'enfants.");
        return;
    }

    const groupSize = adults + children;
    if (groupSize <= 0) {
        alert("Le groupe doit contenir au moins une personne.");
        return;
    }

    let groupColor = getRandomColor();
    let remainingAdults = adults;
    let remainingChildren = children;
    let row = lastFilledRow;

    while (remainingAdults > 0 || remainingChildren > 0) {
        if (row < 0) {
            alert("Pas assez de places disponibles.");
            return;
        }

        let seatsAvailable = countEmptySeats(centerGroup, centerGroupCols, row);
        if (seatsAvailable < 2) {
            row--;
            continue;
        }

        let adultPlaced = false;

        // 🔹 Placer un adulte en début de rangée si possible
        if (remainingAdults > 0) {
            placeAdultInRow(centerGroup, centerGroupCols, row, groupColor, "start");
            remainingAdults--;
            adultPlaced = true;
        }

        // 🔹 Vérifier si on peut mettre les enfants aux extrémités
        let canPlaceChildrenOnEdges = !adultPlaced && (row === totalRows - 1 || !hasAdultOnFirstSeatBelow(centerGroup, centerGroupCols, row));

        // 🔹 Placer les enfants (centré ou avec extrémités libres)
        let childrenPlaced = placeChildrenInRow(centerGroup, centerGroupCols, row, remainingChildren, groupColor, canPlaceChildrenOnEdges);
        remainingChildren -= childrenPlaced;

        // 🔹 Vérifier les places restantes
        seatsAvailable = countEmptySeats(centerGroup, centerGroupCols, row);

        if (seatsAvailable < 3 && remainingAdults > 0) {
            // 🛠️ Si moins de 3 places restent, placer l'adulte sur cette même rangée
            placeAdultInRow(centerGroup, centerGroupCols, row, groupColor, "end");
            remainingAdults--;
        } else {
            // 🛠️ Sinon, passer à la rangée suivante
            row--;
        }
    }

    lastFilledRow = row;
    updateRemainingSeats();

    // 🔹 Ajouter le groupe à la liste
    const li = document.createElement("li");
    li.textContent = `Groupe de ${groupSize} personnes (👨 ${adults} adultes, 🧒 ${children} enfants)`;
    li.style.color = groupColor;
    groupList.appendChild(li);

    document.getElementById("adults").value = "";
    document.getElementById("children").value = "";
}

// 🔹 Fonction pour placer un adulte en début ou en fin de rangée
function placeAdultInRow(groupDiv, cols, row, groupColor, position) {
    let start = position === "start" ? 0 : cols - 1;

    for (let j = start; (position === "start" ? j < cols : j >= 0); j += (position === "start" ? 1 : -1)) {
        const index = row * cols + j;
        let seat = groupDiv.children[index];

        if (seat && getComputedStyle(seat).backgroundColor === EMPTY_SEAT_COLOR) {
            placeAdult(seat, groupColor);
            return;
        }
    }
}

// 🔹 Fonction pour placer des enfants dans une rangée
function placeChildrenInRow(groupDiv, cols, row, children, groupColor, allowEdges) {
    let seatsFilled = 0;
    let start = allowEdges ? 0 : 1;
    let end = allowEdges ? cols : cols - 1;

    for (let j = start; j < end; j++) {
        const index = row * cols + j;
        let seat = groupDiv.children[index];

        if (seatsFilled < children && seat && getComputedStyle(seat).backgroundColor === EMPTY_SEAT_COLOR) {
            seat.style.backgroundColor = groupColor;
            seatsFilled++;
        }
    }
    return seatsFilled;
}

// 🔹 Fonction pour vérifier si un adulte est sur le premier siège de la rangée en dessous
function hasAdultOnFirstSeatBelow(groupDiv, cols, row) {
    if (row >= totalRows - 1) return false; // Pas de rangée en dessous

    const index = (row + 1) * cols; // Premier siège de la rangée en dessous
    let seat = groupDiv.children[index];

    return seat && seat.children.length > 0; // Un adulte a un cercle rouge
}

// 🔹 Fonction pour compter les places vides dans une rangée
function countEmptySeats(groupDiv, cols, row) {
    let count = 0;
    for (let j = 0; j < cols; j++) {
        const index = row * cols + j;
        let seat = groupDiv.children[index];

        if (seat && getComputedStyle(seat).backgroundColor === EMPTY_SEAT_COLOR) {
            count++;
        }
    }
    return count;
}

// 🔹 Fonction pour placer un adulte avec un cercle rouge
function placeAdult(seat, groupColor) {
    seat.style.backgroundColor = groupColor;
    const circle = document.createElement("div");
    circle.style.width = "10px";
    circle.style.height = "10px";
    circle.style.backgroundColor = "red";
    circle.style.borderRadius = "50%";
    circle.style.position = "absolute";
    seat.appendChild(circle);
}

// 🔹 Fonction pour générer une couleur aléatoire contrastée
function getRandomColor() {
    let color;
    do {
        let r = Math.floor(Math.random() * 156);
        let g = Math.floor(Math.random() * 156);
        let b = Math.floor(Math.random() * 156);
        color = `rgb(${r}, ${g}, ${b})`;
    } while (groupColors.includes(color));
    groupColors.push(color);
    return color;
}
