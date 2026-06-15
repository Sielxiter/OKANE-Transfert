for backend :

Important: type only the command lines below. Do not paste the Maven output or the prompt text like `C:\OKANE-Transfert-abdellah\backend>`.

PowerShell:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/okane_transfer?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD=""
Set-Location "c:\OKANE-Transfert-abdellah\backend"
mvn exec:java "-Dexec.mainClass=com.okane.Main" -DskipTests
```

CMD:

```bat
set DB_URL=jdbc:mysql://localhost:3306/okane_transfer?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
set DB_USERNAME=root
set DB_PASSWORD=
cd /d c:\OKANE-Transfert-abdellah\backend
mvn exec:java "-Dexec.mainClass=com.okane.Main" -DskipTests
```

for frontend :

cd Okane-frontend
npm install (just for the first time)
ng serve
