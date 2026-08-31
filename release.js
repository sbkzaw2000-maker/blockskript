const { execSync } = require("child_process");
const fs = require("fs");

const pkg = require("./package.json");

const version = pkg.version;
const tag = `v${version}`;
const releaseName = `BlockSkript v${version}`;

console.log(`\n🚀 Tworzenie Release ${releaseName}\n`);

let body = "";

if (fs.existsSync("CHANGELOG.md")) {
    body = fs.readFileSync("CHANGELOG.md", "utf8").trim();
}

if (!body) {
    body = `## Informacje o aktualizacji

- Aktualizacja BlockSkript do wersji ${version}
`;
}

console.log("📦 Budowanie aplikacji...");

execSync("electron-builder", {
    stdio: "inherit"
});

console.log("\n🏷️ Tworzenie taga...");

try {
    execSync(`git tag ${tag}`, { stdio: "inherit" });
} catch {
    console.log(`Tag ${tag} już istnieje.`);
}

console.log("\n⬆️ Wysyłanie taga na GitHub...");

execSync(`git push origin ${tag}`, {
    stdio: "inherit"
});

console.log("\n✅ Gotowe!");
console.log(`Release: ${releaseName}`);
console.log(`Tag: ${tag}`);