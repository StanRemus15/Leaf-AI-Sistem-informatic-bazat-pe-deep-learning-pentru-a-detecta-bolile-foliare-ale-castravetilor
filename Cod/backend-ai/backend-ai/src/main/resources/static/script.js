const fileInput = document.getElementById('fileInput');
const resultImage = document.getElementById('resultImage');
const screenUpload = document.getElementById('screen-upload');
const screenAnalyzing = document.getElementById('screen-analyzing');
const screenResults = document.getElementById('screen-results');
const screenHistory = document.getElementById('screen-history');

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

    // Cazul de eroare: daca backend-ul a returnat un mesaj de eroare,
    // afisez alertBox in rosu si resetez campurile de pe ecran
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

    // Determin tipul rezultatului: sanatos sau diagnostic incert (sub 65% siguranta)
    const isHealthy = data.boala_detectata.toLowerCase().includes('healthy');
    const isUncertain = data.siguranta < 65;

    // Setez data scanarii pentru afisare
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('resultDate').innerText = today;

    // Configurez alertBox-ul in functie de tipul rezultatului
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

    // Actualizez denumirea bolii, scorul de siguranta si progress bar-ul
    document.getElementById('resDiseaseName').innerText = data.boala_detectata;
    document.getElementById('resConfidence').innerText = data.siguranta.toFixed(0) + '%';
    document.getElementById('resProgressBar').style.width = data.siguranta + '%';

    // Schimb culoarea progress bar-ului in functie de nivelul de siguranta
    let barColor = "";
    if (data.siguranta >= 80) {
        barColor = "#3B6D11";
    } else if (data.siguranta >= 49) {
        barColor = "#EF9F27";
    } else {
        barColor = "#E24B4A";
    }
    document.getElementById('resProgressBar').style.backgroundColor = barColor;

    // Construiesc lista cu primele doua alternative posibile (Other possibilities)
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

    // Dictionarul cu recomandari concrete pentru fiecare boala
    const recomandari = {
        'Anthracnose': "Remove infected leaves, apply a copper-based fungicide, and avoid overhead watering.",
        'Bacterial Wilt': "Remove and destroy the plant immediately. Control cucumber beetles, as they spread the bacteria.",
        'Downy Mildew': "Ensure good ventilation, reduce environmental humidity, and apply specific fungicides.",
        'Gummy Stem Blight': "Clear infected plant debris, ensure crop rotation, and apply broad-spectrum fungicides.",
        'Healthy': "The plant is healthy! Continue normal care and monitor it periodically."
    };

    // Selectez recomandarea in functie de boala detectata
    let textRecomandare = recomandari[data.boala_detectata] || "Isolate the plant and consult a specialist for treatment.";

    // Daca diagnosticul este incert, suprascriu recomandarea cu un mesaj specific
    if (isUncertain) {
        textRecomandare = "The diagnosis is uncertain. Please retake the photo, preferably in natural light, focusing clearly on the affected leaf.";
    }

    // Construiesc HTML-ul final cu recomandarea + alternative
    recBox.innerHTML = `
        <p class="text-muted mb-1" style="font-size: 11px; text-transform: uppercase;">Treatment Recommendation</p>
        <p class="small mb-0 fw-bold" style="color: #333;">${textRecomandare}</p>
        ${alternativeHTML}
    `;
}

async function loadHistory() {
    try {
        // Cerere GET catre backend pentru a obtine toate diagnosticele salvate
        const response = await fetch('/api/ai-detection/istoric');
        if (!response.ok) return;

        const dateIstoric = await response.json();
        // Calculez cele trei statistici afisate in header-ul ecranului

        const totalScans = dateIstoric.length;
        const totalDiseases = dateIstoric.filter(d => d.boala && !d.boala.toLowerCase().includes('healthy')).length;
        const avgConf = totalScans > 0 ? (dateIstoric.reduce((sum, d) => sum + (d.siguranta || 0), 0) / totalScans).toFixed(0) : 0;
        // Actualizez contoarele afisate in interfata

        document.getElementById('statTotal').innerText = totalScans;
        document.getElementById('statDiseases').innerText = totalDiseases;
        document.getElementById('statAvg').innerText = avgConf + '%';
        // Resetez continutul listei inainte de a o repopula

        const listContainer = document.getElementById('historyList');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        // Daca nu exista scanari, afisez un mesaj informativ in locul listei
        if (dateIstoric.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center p-4 text-muted border rounded mt-3" style="background-color: #fafafa;">
                    <div style="font-size: 24px; margin-bottom: 10px;"></div>
                    <small>No scans yet.<br>Your first analysis will appear here.</small>
                </div>`;
            return;
        }
        // Inversez ordinea pentru a afisa cele mai recente scanari primele
        dateIstoric.reverse().forEach(item => {
            const boalaNume = item.boala || "Unknown Diagnosis";
            const siguranta = item.siguranta || 0;

            let typeClass = '';
            let dotColor = '';

            if (siguranta >= 80) {
                typeClass = 'success';
                dotColor = '#3B6D11';
            } else if (siguranta >= 49) {
                typeClass = 'warning';
                dotColor = '#EF9F27';
            } else {
                typeClass = 'danger';
                dotColor = '#E24B4A';
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
