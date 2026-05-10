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
document.getElementById('btnSaveHistory').addEventListener('click', () => {
    loadHistory();
    showScreen(screenHistory);
});

fileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;

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
            alert("Eroare la procesarea pozei de catre server.");
            showScreen(screenUpload);
        }
    } catch (error) {
        alert("Eroare de conexiune cu serverul.");
        showScreen(screenUpload);
    } finally {
        fileInput.value = '';
    }
});

function populateResults(data) {
    const alertBox = document.getElementById('alertBox');
    const isHealthy = data.boala_detectata.toLowerCase().includes('healthy');
    const isUncertain = data.siguranta < 65;

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('resultDate').innerText = today;

    if (isUncertain) {
        alertBox.className = "alert-box warning";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">Diagnostic Incert (${data.siguranta.toFixed(0)}%)</div>
                <div style="font-size: 11px;">AI-ul are dubii. Repetati poza la lumina mai buna.</div>
            </div>`;
    } else if (isHealthy) {
        alertBox.className = "alert-box success";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">Planta Sanatoasa</div>
                <div style="font-size: 11px;">Nicio boala detectata.</div>
            </div>`;
    } else {
        alertBox.className = "alert-box danger";
        alertBox.innerHTML = `
            <div>
                <div class="fw-bold">${data.boala_detectata}</div>
                <div style="font-size: 11px;">Severitate Ridicata. Boala detectata.</div>
            </div>`;
    }

    document.getElementById('resDiseaseName').innerText = data.boala_detectata;
    document.getElementById('resConfidence').innerText = data.siguranta.toFixed(0) + '%';
    document.getElementById('resProgressBar').style.width = data.siguranta + '%';
    document.getElementById('resProgressBar').style.backgroundColor = isUncertain ? "#EF9F27" : (isHealthy ? "#3B6D11" : "#E24B4A");

    let alternativeHTML = `<p class="text-muted mt-3" style="font-size: 10px; text-transform: uppercase;">Alte posibilitati:</p>`;
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

    const recBox = document.querySelector('.recommendation-box');
    recBox.innerHTML = `
        <p class="text-muted mb-1" style="font-size: 11px; text-transform: uppercase;">Recomandare</p>
        <p class="small mb-0">${isUncertain ? "Va recomandam o inspectie vizuala atenta." : "Izolati planta si aplicati tratamentul."}</p>
        ${alternativeHTML}
    `;
}

async function loadHistory() {
    try {
        const response = await fetch('/api/ai-detection/istoric');
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

        dateIstoric.reverse().forEach(item => {
            const boalaNume = item.boala || "Diagnostic Necunoscut";
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

            let scanDate = "Data necunoscuta";
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
    } catch (error) {
        console.error("Eroare la desenarea istoricului: ", error);
    }
}