
"use strict";

// =====================================
// 1. CIRCULAR QUEUE CONFIGURATION
// =====================================

const CAPACITY = 10;

let queue = new Array(CAPACITY);
let front = -1;
let rear = -1;
let count = 0;

let tokenNumber = 1;
let completedCount = 0;
let currentPatient = null;
let toastTimeout = null;

// =====================================
// 2. GET HTML ELEMENTS
// =====================================

const patientForm = document.getElementById("patientForm");
const patientNameInput = document.getElementById("patientName");
const patientAgeInput = document.getElementById("patientAge");
const departmentInput = document.getElementById("department");

const queueBody = document.getElementById("queueBody");
const waitingCountEl = document.getElementById("waitingCount");
const completedCountEl = document.getElementById("completedCount");
const currentTokenEl = document.getElementById("currentToken");
const capacityCountEl = document.getElementById("capacityCount");
const queueSummaryEl = document.getElementById("queueSummary");

const servingDetails = document.getElementById("servingDetails");
const tokenResult = document.getElementById("tokenResult");
const nextBtn = document.getElementById("nextBtn");
const completeBtn = document.getElementById("completeBtn");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");

// Check that the required HTML elements exist
const requiredElements = [
    patientForm,
    patientNameInput,
    patientAgeInput,
    departmentInput,
    queueBody,
    waitingCountEl,
    completedCountEl,
    currentTokenEl,
    capacityCountEl,
    queueSummaryEl,
    servingDetails,
    tokenResult,
    nextBtn,
    completeBtn,
    resetBtn,
    toast
];

if (requiredElements.some(element => element === null)) {
    throw new Error(
        "HTML element missing. Check index.html IDs and script.js."
    );
}

// =====================================
// 3. ENQUEUE: ADD PATIENT TO QUEUE
// =====================================

function enqueue(patient) {
    // Do not insert if queue is full
    if (count >= CAPACITY) {
        return false;
    }

    // First patient
    if (count === 0) {
        front = 0;
        rear = 0;
    } else {
        // Move rear circularly
        rear = (rear + 1) % CAPACITY;
    }

    queue[rear] = patient;
    count++;

    return true;
}

// =====================================
// 4. DEQUEUE: REMOVE NEXT PATIENT
// =====================================

function dequeue() {
    if (count === 0) {
        return null;
    }

    const patient = queue[front];

    queue[front] = undefined;
    count--;

    if (count === 0) {
        front = -1;
        rear = -1;
    } else {
        // Move front circularly
        front = (front + 1) % CAPACITY;
    }

    return patient;
}

// =====================================
// 5. GET ALL WAITING PATIENTS IN FIFO ORDER
// =====================================

function getQueuePatients() {
    const patients = [];

    for (let i = 0; i < count; i++) {
        const index = (front + i) % CAPACITY;
        patients.push(queue[index]);
    }

    return patients;
}

// =====================================
// 6. GENERATE TOKEN AND ADD PATIENT
// =====================================

patientForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = patientNameInput.value.trim();
    const ageText = patientAgeInput.value.trim();
    const age = Number(ageText);
    const department = departmentInput.value;

    // Validate form
    if (
        name === "" ||
        ageText === "" ||
        !Number.isInteger(age) ||
        age < 0 ||
        age > 120 ||
        department === ""
    ) {
        showToast("Please enter valid patient details.");
        return;
    }

    // Check queue capacity
    if (count >= CAPACITY) {
        showToast("Queue is full! Maximum 10 waiting patients.");
        return;
    }

    // Create patient object
    const patient = {
        token: "T-" + String(tokenNumber).padStart(3, "0"),
        name: name,
        age: age,
        department: department,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    };

    // Add patient to Circular Queue
    const added = enqueue(patient);

    if (!added) {
        showToast("Unable to add patient.");
        return;
    }

    tokenNumber++;

    // Show generated token immediately
    tokenResult.replaceChildren();

    const successText = document.createElement("div");
    successText.textContent = "Token generated successfully!";

    const tokenHeading = document.createElement("strong");
    tokenHeading.textContent = patient.token;

    const patientText = document.createElement("div");
    patientText.textContent =
        patient.name + " · " + patient.age + " years";

    const departmentText = document.createElement("div");
    departmentText.textContent = patient.department;

    tokenResult.append(
        successText,
        tokenHeading,
        patientText,
        departmentText
    );

    tokenResult.classList.remove("hidden");

    // Clear input fields
    patientForm.reset();

    // IMPORTANT:
    // Refresh queue table and dashboard after enqueue
    renderDashboard();

    showToast(
        patient.token + " generated and added to Patient Queue!"
    );
});

// =====================================
// 7. NEXT PATIENT BUTTON
// =====================================

nextBtn.addEventListener("click", function() {
    if (currentPatient !== null) {
        showToast("Complete the current token first.");
        return;
    }

    if (count === 0) {
        showToast("No patients waiting in the queue.");
        return;
    }

    // Remove first waiting patient
    currentPatient = dequeue();

    // Update queue and Now Serving panel
    renderDashboard();

    showToast(currentPatient.token + " is now being served.");
});

// =====================================
// 8. COMPLETE CURRENT TOKEN
// =====================================

completeBtn.addEventListener("click", function() {
    if (currentPatient === null) {
        showToast("No active token to complete.");
        return;
    }

    const finishedToken = currentPatient.token;

    completedCount++;
    currentPatient = null;

    renderDashboard();

    showToast(finishedToken + " completed successfully.");
});

// =====================================
// 9. RESET QUEUE
// =====================================

resetBtn.addEventListener("click", function() {
    const confirmed = window.confirm(
        "Reset the entire queue? All current demo data will be cleared."
    );

    if (!confirmed) {
        return;
    }

    queue = new Array(CAPACITY);
    front = -1;
    rear = -1;
    count = 0;

    tokenNumber = 1;
    completedCount = 0;
    currentPatient = null;

    tokenResult.replaceChildren();
    tokenResult.classList.add("hidden");

    renderDashboard();

    showToast("Queue reset successfully.");
});

// =====================================
// 10. DISPLAY WAITING QUEUE
// =====================================

function renderQueue() {
    // Always read patients from Circular Queue
    const patients = getQueuePatients();

    // Clear old table rows
    queueBody.replaceChildren();

    if (patients.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-row";
        cell.textContent = "No patients in the queue.";

        row.appendChild(cell);
        queueBody.appendChild(row);
    } else {
        patients.forEach(function(patient) {
            const row = document.createElement("tr");

            const tokenCell = document.createElement("td");
            tokenCell.className = "token-cell";
            tokenCell.textContent = patient.token;

            const nameCell = document.createElement("td");
            nameCell.className = "patient-cell";
            nameCell.textContent = patient.name;

            const ageCell = document.createElement("td");
            ageCell.textContent = patient.age;

            const departmentCell = document.createElement("td");
            departmentCell.className = "department-cell";
            departmentCell.textContent = patient.department;

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");

            badge.className = "waiting-badge";
            badge.textContent = "Waiting";

            statusCell.appendChild(badge);

            row.append(
                tokenCell,
                nameCell,
                ageCell,
                departmentCell,
                statusCell
            );

            // Add row to the HTML table
            queueBody.appendChild(row);
        });
    }

    queueSummaryEl.textContent =
        "Showing " + count + " waiting patient" +
        (count === 1 ? "" : "s");
}

// =====================================
// 11. DISPLAY CURRENT PATIENT
// =====================================

function renderCurrentPatient() {
    if (currentPatient === null) {
        servingDetails.replaceChildren();

        const avatar = document.createElement("div");
        avatar.className = "empty-avatar";
        avatar.textContent = "♙";

        const heading = document.createElement("h3");
        heading.textContent = "No Patient Selected";

        const message = document.createElement("p");
        message.textContent =
            "Click Next Patient to call the next token.";

        servingDetails.append(avatar, heading, message);

        currentTokenEl.textContent = "---";

        nextBtn.disabled = count === 0;
        completeBtn.disabled = true;

        return;
    }

    servingDetails.replaceChildren();

    const tokenHeading = document.createElement("div");
    tokenHeading.className = "serving-token";
    tokenHeading.textContent = currentPatient.token;

    const nameHeading = document.createElement("div");
    nameHeading.className = "serving-name";
    nameHeading.textContent = currentPatient.name;

    const meta = document.createElement("div");
    meta.className = "serving-meta";

    const ageSpan = document.createElement("span");
    ageSpan.textContent = "Age: " + currentPatient.age;

    const deptSpan = document.createElement("span");
    deptSpan.textContent = currentPatient.department;

    meta.append(ageSpan, deptSpan);

    const timeText = document.createElement("p");
    timeText.style.marginTop = "12px";
    timeText.textContent = "Token time: " + currentPatient.time;

    servingDetails.append(
        tokenHeading,
        nameHeading,
        meta,
        timeText
    );

    currentTokenEl.textContent = currentPatient.token;

    nextBtn.disabled = true;
    completeBtn.disabled = false;
}

// =====================================
// 12. UPDATE DASHBOARD
// =====================================

function renderDashboard() {
    waitingCountEl.textContent = count;
    completedCountEl.textContent = completedCount;
    capacityCountEl.textContent = count + " / " + CAPACITY;

    // These functions refresh the screen
    renderQueue();
    renderCurrentPatient();
}

// =====================================
// 13. TOAST NOTIFICATION
// =====================================

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(function() {
        toast.classList.remove("show");
    }, 3000);
}

// =====================================
// 14. DISPLAY CURRENT DATE
// =====================================

document.getElementById("currentDate").textContent =
    "📅 " + new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

// =====================================
// 15. START WEBSITE
// =====================================

renderDashboard();

console.log("Hospital Token Management System is ready.");
