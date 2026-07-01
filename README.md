# Leaf-AI
Sistem informatic bazat pe Deep Learning pentru detectarea bolilor foliare la castravete.

## 1. Adresa repository-ului
 
Codul sursă complet se află în repository-ul de mai jos, pe GitHub:
 
https://github.com/StanRemus15/Leaf-AI-Sistem-informatic-bazat-pe-deep-learning-pentru-a-detecta-bolile-foliare-ale-castravetilor
 
Repository-ul conține întreg codul sursă al aplicației, modelul antrenat și setul de date folosit. 
Nu conține fișiere binare compilate: folderul `target` al proiectului Java, fișierele `.class` și arhivele `.jar` sunt excluse prin `.gitignore` și se generează local la compilare. 
Fișierele cu extensia `.keras` sunt ponderile modelului antrenat, iar `leafai.p12` este certificatul pentru HTTPS. 
Acestea nu sunt binare compilate ale aplicației, ci resurse necesare la rulare.

## 2. Cerințe
 
Pentru rularea aplicației sunt necesare:
 
- Java Development Kit 21
- Maven 3.9 sau mai nou (opțional)
- Python 3.10 sau mai nou

Aplicația folosește două procese care rulează în paralel: serviciul Python pe portul 8050 și backend-ul Java pe portul 8443. Backend-ul servește și interfața web.

## 3. Pași de compilare
 
### 3.1. Backend-ul Java
 
Din rădăcina proiectului Maven:
 
```
cd Cod/backend-ai/backend-ai
./mvnw clean package
```
 
Pe Windows se folosește `mvnw.cmd clean package`. Dacă Maven este deja instalat în sistem, comanda echivalentă este `mvn clean package`. Compilarea produce arhiva executabilă în folderul `target`, care este local și nu este inclus în repository.

### 3.2. Serviciul Python
 
Serviciul Python este interpretat, deci nu necesită compilare. Din rădăcina proiectului se creează un mediu virtual și se instalează dependențele din `requirements.txt`:
 
```
python -m venv venv
venv\Scripts\activate        (Windows)
source venv/bin/activate     (Linux sau macOS)
pip install -r requirements.txt
```

## 4. Pași de instalare și lansare
 
Serviciul Python trebuie pornit primul, fiindcă backend-ul îi trimite imaginile pentru diagnostic.
 
### 4.1. Pornirea serviciului Python
 
```
cd Cod/API
uvicorn api:app --host 0.0.0.0 --port 8050
```
 
Serviciul pornește pe `http://127.0.0.1:8050`. Comanda se rulează din folderul `Cod/API`, ca fișierul cu modelul (`model_antrenare_licenta_v2.keras`) să fie găsit lângă `api.py`.
 
### 4.2. Pornirea backend-ului Java
 
În alt terminal:
 
```
cd Cod/backend-ai/backend-ai
./mvnw spring-boot:run
```
 
Backend-ul pornește pe portul 8443, cu HTTPS. La prima rulare se creează automat baza de date H2 într-un folder `data`.
 
### 4.3. Deschiderea aplicației
 
Se deschide în browser:
 
```
https://localhost:8443/interfata.html
```
 
Fiind certificat autosemnat, browserul afișează un avertisment la prima accesare, care se acceptă pentru a continua. Aplicația poate fi folosită atât de pe desktop, cât și de pe telefon.

Pentru telefon trebuie să se pornească serverul de pe calculator sau laptop și să se ruleze comanda:

```
ipconfig (Windows)
hostname -I (Linux sau MacOS)
```

Apoi se deschide în browser de pe telefon cu adresa:
 ```
https://IP:8443/interfata.html
```
unde IP este rezultatul comenzii de mai sus
 
### 4.4. Dacă portul 8080 este ocupat
 
Backend-ul folosește portul 8080 pentru redirecționarea de pe HTTP către HTTPS. Dacă la pornire apare un mesaj de tipul „Web server failed to start. Port 8080 was already in use", înseamnă că alt program ocupă deja portul și trebuie eliberat.
 
Pe Windows, se află ce proces folosește portul:
 
```
netstat -ano | findstr :8080
```
 
Ultima coloană din rezultat este PID-ul procesului. Acesta se oprește cu:
 
```
taskkill /F /PID PID
```
 
unde `PID` este numărul găsit la pasul anterior.
 
Pe Linux sau macOS:
 
```
lsof -i :8080
kill -9 <pid>
```
 
După ce portul este liber, se pornește din nou backend-ul.

## 5. Setul de date

Am folosit un subset din setul "Cucumber Disease Recognition Dataset" de pe Kaggle: https://www.kaggle.com/datasets/sujaykapadnis/cucumber-disease-recognition-dataset/data
