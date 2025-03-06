// --------------------------
// Définitions des constantes et variables
// --------------------------

const EMPTY_SEAT_COLOR = "rgb(204, 255, 204)";
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

let selectedSeat = null; // Siège actuellement sélectionné
let selectedUserColor = null; // Couleur de l'utilisateur sélectionné
let isAdultSelected = false; // Indique si l'utilisateur sélectionné est un adulte

// --------------------------
// Fonction de génération des sièges
// --------------------------

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
            div.addEventListener("click", () => handleSeatClick(div));
            group.appendChild(div);
        }
    }
}

createStadium();

// --------------------------
// Gestion des utilisateurs et groupes
// --------------------------

function setJaugeTendue(tendue) {
    isJaugeTendue = tendue;
    document.getElementById("initial-question").style.display = "none";
    document.getElementById("app").style.display = "block";
}

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

        if (remainingAdults > 0) {
            placeAdultInRow(centerGroup, centerGroupCols, row, groupColor, "start");
            remainingAdults--;
            adultPlaced = true;
        }

        let canPlaceChildrenOnEdges = !adultPlaced && (row === totalRows - 1 || !hasAdultOnFirstSeatBelow(centerGroup, centerGroupCols, row));
        let childrenPlaced = placeChildrenInRow(centerGroup, centerGroupCols, row, remainingChildren, groupColor, canPlaceChildrenOnEdges);
        remainingChildren -= childrenPlaced;

        seatsAvailable = countEmptySeats(centerGroup, centerGroupCols, row);

        if (seatsAvailable < 3 && remainingAdults > 0) {
            placeAdultInRow(centerGroup, centerGroupCols, row, groupColor, "end");
            remainingAdults--;
        } else {
            row--;
        }
    }

    lastFilledRow = row;
    updateRemainingSeats();

    const li = document.createElement("li");
    li.textContent = `Groupe de ${groupSize} personnes (👨 ${adults} adultes, 🧒 ${children} enfants)`;
    li.style.color = groupColor;
    groupList.appendChild(li);

    document.getElementById("adults").value = "";
    document.getElementById("children").value = "";
}

function updateRemainingSeats() {
    let occupiedSeats = document.querySelectorAll("#stadium div:not([style*='background-color: " + EMPTY_SEAT_COLOR + "'])").length;
    remainingSeatsElement.textContent = totalSeats - occupiedSeats;
}

// --------------------------
// Gestion du déplacement des utilisateurs
// --------------------------

/**
 * Gestion du clic sur un siège
 * Si un siège est occupé, on sélectionne l'utilisateur, sinon on déplace l'utilisateur sélectionné
 */
function handleSeatClick(seat) {
    if (getComputedStyle(seat).backgroundColor === EMPTY_SEAT_COLOR) {
        // Si le siège est vide, déplacer l'utilisateur sélectionné ici, si un utilisateur est sélectionné
        if (selectedSeat) {
            moveUserToNewSeat(seat);
        }
    } else {
        // Si le siège est occupé, sélectionner cet utilisateur
        selectUser(seat);
    }
}

/**
 * Sélectionne un utilisateur et met à jour le style du siège
 * @param {HTMLElement} seat
 */
function selectUser(seat) {
    // Si un utilisateur est déjà sélectionné, désélectionner l'utilisateur
    if (selectedSeat) {
        selectedSeat.style.border = "";
    }

    selectedSeat = seat;
    selectedUserColor = getComputedStyle(seat).backgroundColor;
    isAdultSelected = seat.querySelector('div') !== null; // Vérifie si l'utilisateur est un adulte (cercle rouge présent)

    // Ajout de la bordure pour signaler que l'utilisateur est sélectionné
    selectedSeat.style.border = "2px solid #ff5733"; // Bordure rouge pour signaler la sélection
}

/**
 * Déplace un utilisateur vers un nouveau siège
 * @param {HTMLElement} newSeat
 */
function moveUserToNewSeat(newSeat) {
    // Supprimer le cercle de l'ancien siège si c'est un adulte
    if (isAdultSelected) {
        const oldCircle = selectedSeat.querySelector("div"); // Le cercle est le premier enfant (div) de l'ancien siège
        if (oldCircle) {
            oldCircle.remove(); // Supprimer le cercle de l'ancien siège
        }
    }

    // Déplace l'utilisateur en mettant à jour le style du siège
    newSeat.style.backgroundColor = selectedUserColor;

    // Si l'utilisateur est un adulte, déplace également le cercle rouge
    if (isAdultSelected) {
        const circle = document.createElement("div");
        circle.style.width = "10px";
        circle.style.height = "10px";
        circle.style.backgroundColor = "red";
        circle.style.borderRadius = "50%";
        circle.style.position = "absolute";
        newSeat.appendChild(circle);
    }

    // Réinitialise l'ancien siège comme vide
    selectedSeat.style.backgroundColor = EMPTY_SEAT_COLOR;
    selectedSeat.style.border = "";

    // Mise à jour du siège sélectionné
    selectedSeat = null;
    selectedUserColor = null;
    isAdultSelected = false;
}

// --------------------------
// Fonction de support
// --------------------------

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

function placeAdultInRow(groupDiv, cols, row, groupColor, position) {
    let start = position === "start" ? 0 : cols - 1;

    for (let j = start; (position === "start" ? j < cols : j >= 0); j += (position === "start" ? 1 : -1)) {
        const index = row * cols + j;
        let seat = groupDiv.children[index];

        if (seat && getComputedStyle(seat).backgroundColor === EMPTY_SEAT_COLOR) {
            seat.style.backgroundColor = groupColor;
            const circle = document.createElement("div");
            circle.style.width = "10px";
            circle.style.height = "10px";
            circle.style.backgroundColor = "red";
            circle.style.borderRadius = "50%";
            circle.style.position = "absolute";
            seat.appendChild(circle);
            return;
        }
    }
}

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

function hasAdultOnFirstSeatBelow(groupDiv, cols, row) {
    if (row >= totalRows - 1) return false; // Pas de rangée en dessous

    const index = (row + 1) * cols; // Premier siège de la rangée en dessous
    let seat = groupDiv.children[index];

    return seat && seat.children.length > 0; // Un adulte a un cercle rouge
}
