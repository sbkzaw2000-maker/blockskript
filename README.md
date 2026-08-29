# BlockSkript

Desktopowy kreator Skript dla Minecrafta, oparty na układaniu klocków.

## Uruchomienie w Visual Studio Code

1. Zainstaluj Node.js LTS.
2. W terminalu projektu wykonaj:
   `npm install`
3. Uruchom:
   `npm start`

## Budowanie aplikacji Windows

`npm run build`

Instalator pojawi się w folderze `dist/`.

## Aktualizacje

Aplikacja używa `electron-updater` i GitHub Releases.

Przed pierwszym wydaniem zmień w `package.json`:
- `TWOJ_GITHUB_LOGIN` na swój login GitHub,
- `TWOJE_REPOZYTORIUM` na nazwę repozytorium.

Następnie zwiększ wersję w `package.json`, np. `1.1.0` → `1.2.0`, zbuduj nowy instalator i opublikuj go jako GitHub Release. Zbudowana aplikacja będzie mogła sprawdzać, pobierać i instalować kolejne aktualizacje.

> Aktualizacje nie działają z `npm start`/trybu developerskiego — działają w zainstalowanej, spakowanej aplikacji.
