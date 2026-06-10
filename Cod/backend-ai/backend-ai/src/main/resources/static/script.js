const fileInput = document.getElementById('fileInput');
const resultImage = document.getElementById('resultImage');
const screenLogin = document.getElementById('screen-login');
const screenUpload = document.getElementById('screen-upload');
const screenAnalyzing = document.getElementById('screen-analyzing');
const screenResults = document.getElementById('screen-results');
const screenHistory = document.getElementById('screen-history');

let currentUser = null;

function saveUser(user) {
    currentUser = user;
    localStorage.setItem('leafai_user', JSON.stringify(user));
}

function loadSavedUser() {
    const saved = localStorage.getItem('leafai_user');
    if (saved) {
        try { currentUser = JSON.parse(saved); } catch (e) { currentUser = null; }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('leafai_user');
    showScreen(screenLogin);
}

let isRegisterMode = false;

function updateAuthScreen() {
    document.getElementById('authTitle').innerText = isRegisterMode ? "Create account" : "Welcome back";
    document.getElementById('authSubtitle').innerText = isRegisterMode
        ? "Register to start scanning your plants"
        : "Sign in to access your scan history";
    document.getElementById('btnAuthSubmit').innerText = isRegisterMode ? "Create account" : "Sign in";
    document.getElementById('authSwitchText').innerText = isRegisterMode ? "Already have an account?" : "Don't have an account?";
    document.getElementById('authSwitchLink').innerText = isRegisterMode ? "Sign in" : "Create one";
    hideAuthError();
}

function showAuthError(msg) {
    const box = document.getElementById('authError');
    box.innerText = msg;
    box.style.display = 'block';
}

function hideAuthError() {
    document.getElementById('authError').style.display = 'none';
}

document.getElementById('authSwitchLink').addEventListener('click', (e) => {
    e.preventDefault();
    isRegisterMode = !isRegisterMode;
    updateAuthScreen();
});

document.getElementById('btnAuthSubmit').addEventListener('click', async () => {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;

    if (!username || !password) {
        showAuthError("Please fill in both fields.");
        return;
    }

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();

        if (!response.ok || data.eroare) {
            showAuthError(data.eroare || "Something went wrong. Please try again.");
            return;
        }

        saveUser(data);
        enterApp();
    } catch (error) {
        showAuthError("Server connection error.");
    }
});

function enterApp() {
    document.getElementById('loggedUser').innerText = currentUser.username;
    document.getElementById('authPassword').value = '';
    hideAuthError();
    showScreen(screenUpload);
}

document.getElementById('btnLogout').addEventListener('click', logout);


function showScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenElement.classList.add('active');
}

document.getElementById('navToHistory').addEventListener('click', () => {
    loadHistory();
    showScreen(screenHistory);
});

document.getElementById('btnNewScan').addEventListener('click', () => showScreen(screenUpload));
document.getElementById('btnScanAgain').addEventListener('click', () => showScreen(screenUpload));


fileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("The image is too large! Please upload a photo of maximum 5MB.");
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) { resultImage.src = e.target.result; }
    reader.readAsDataURL(file);

    showScreen(screenAnalyzing);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", currentUser.id);

    try {
        const response = await fetch('/api/ai-detection/analiza/', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            populateResults(data);
            setTimeout(() => showScreen(screenResults), 1500);
        } else {
            alert("Error processing the image on the server.");
            showScreen(screenUpload);
        }
    } catch (error) {
        alert("Server connection error.");
        showScreen(screenUpload);
    } finally {
        fileInput.value = '';
    }
});

function populateResults(data) {
    const alertBox = document.getElementById('alertBox');
    const recBox = document.querySelector('.recommendation-box');

    if (data.eroare) {
        alertBox.className = "alert-box danger";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">Invalid Scan</div>
                <div style="font-size: 11px;">${data.eroare}</div>
            </div>`;

        document.getElementById('resDiseaseName').innerText = "Undetected";
        document.getElementById('resConfidence').innerText = "0%";
        document.getElementById('resProgressBar').style.width = "0%";
        document.getElementById('resProgressBar').style.backgroundColor = "#ccc";

        recBox.innerHTML = `
            <p class="text-muted mb-1" style="font-size: 11px; text-transform: uppercase;">Recommendation</p>
            <p class="small mb-0">Please upload a clear image containing exclusively plant leaves to run the diagnosis.</p>
        `;
        return;
    }

    const isHealthy = data.boala_detectata.toLowerCase().includes('healthy');
    const isUncertain = data.siguranta < 65;

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('resultDate').innerText = today;

    if (isUncertain) {
        alertBox.className = "alert-box warning";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">Uncertain Diagnosis (${data.siguranta.toFixed(0)}%)</div>
                <div style="font-size: 11px;">The AI is in doubt. Please retake the photo in better light.</div>
            </div>`;
    } else if (isHealthy) {
        alertBox.className = "alert-box success";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">Healthy Plant</div>
                <div style="font-size: 11px;">No diseases detected.</div>
            </div>`;
    } else {
        alertBox.className = "alert-box danger";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">${data.boala_detectata}</div>
                <div style="font-size: 11px;">High Severity. Disease detected.</div>
            </div>`;
    }

    document.getElementById('resDiseaseName').innerText = data.boala_detectata;
    document.getElementById('resConfidence').innerText = data.siguranta.toFixed(0) + '%';
    document.getElementById('resProgressBar').style.width = data.siguranta + '%';
    document.getElementById('resProgressBar').style.backgroundColor = isUncertain ? "#EF9F27" : (isHealthy ? "#3B6D11" : "#E24B4A");

    let alternativeHTML = `<p class="text-muted mt-3" style="font-size: 10px; text-transform: uppercase;">Other possibilities:</p>`;
    data.alternative.forEach(alt => {
        alternativeHTML += `
            <div class="d-flex justify-content-between small text-muted">
                <span>${alt.boala}</span>
                <span>${alt.siguranta.toFixed(0)}%</span>
            </div>
            <div class="progress mb-2" style="height: 3px; opacity: 0.5;">
                <div class="progress-bar bg-secondary" style="width: ${alt.siguranta}%"></div>
            </div>`;
    });

    const recomandari = {
        'Anthracnose': "Remove infected leaves, apply a copper-based fungicide, and avoid overhead watering.",
        'Bacterial Wilt': "Remove and destroy the plant immediately. Control cucumber beetles, as they spread the bacteria.",
        'Downy Mildew': "Ensure good ventilation, reduce environmental humidity, and apply specific fungicides.",
        'Gummy Stem Blight': "Clear infected plant debris, ensure crop rotation, and apply broad-spectrum fungicides.",
        'Healthy': "The plant is healthy! Continue normal care and monitor it periodically."
    };

    let textRecomandare = recomandari[data.boala_detectata] || "Isolate the plant and consult a specialist for treatment.";

    if (isUncertain) {
        textRecomandare = "The diagnosis is uncertain. Please retake the photo, preferably in natural light, focusing clearly on the affected leaf.";
    }

    recBox.innerHTML = `
        <p class="text-muted mb-1" style="font-size: 11px; text-transform: uppercase;">Treatment Recommendation</p>
        <p class="small mb-0 fw-bold" style="color: #333;">${textRecomandare}</p>
        ${alternativeHTML}
    `;
}


async function loadHistory() {
    try {
        const response = await fetch('/api/ai-detection/istoric?userId=' + currentUser.id);
        if (!response.ok) return;

        const dateIstoric = await response.json();

        const totalScans = dateIstoric.length;
        const totalDiseases = dateIstoric.filter(d => d.boala && !d.boala.toLowerCase().includes('healthy')).length;
        const avgConf = totalScans > 0 ? (dateIstoric.reduce((sum, d) => sum + (d.siguranta || 0), 0) / totalScans).toFixed(0) : 0;

        document.getElementById('statTotal').innerText = totalScans;
        document.getElementById('statDiseases').innerText = totalDiseases;
        document.getElementById('statAvg').innerText = avgConf + '%';

        const listContainer = document.getElementById('historyList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (dateIstoric.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center p-4 text-muted border rounded mt-3" style="background-color: #fafafa;">
                    <div style="font-size: 24px; margin-bottom: 10px;"></div>
                    <small>No scans yet.<br>Your first analysis will appear here.</small>
                </div>`;
            return;
        }

        dateIstoric.reverse().forEach(item => {
            const boalaNume = item.boala || "Unknown Diagnosis";
            const siguranta = item.siguranta || 0;
            const isHealthy = boalaNume.toLowerCase().includes('healthy');

            let typeClass = 'danger';
            let dotColor = 'var(--danger)';

            if (isHealthy) {
                typeClass = 'success';
                dotColor = 'var(--primary)';
            } else if (siguranta < 75) {
                typeClass = 'warning';
                dotColor = 'var(--warning)';
            }

            let scanDate = "Unknown date";
            if (item.dataScanarii) {
                scanDate = new Date(item.dataScanarii).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            const row = `
                <div class="history-item ${typeClass}">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${dotColor};"></div>
                    <div style="flex-grow: 1;">
                        <div class="fw-bold" style="font-size: 13px;">${boalaNume}</div>
                        <div class="text-muted" style="font-size: 10px;">${scanDate} · ${siguranta.toFixed(0)}% confidence</div>
                    </div>
                </div>`;
            listContainer.innerHTML += row;
        });
    } catch (error) {}
}


loadSavedUser();
if (currentUser) {
    enterApp();
} else {
    showScreen(screenLogin);
}