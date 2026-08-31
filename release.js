const fs = require("fs");
const https = require("https");
const { execSync } = require("child_process");

const packageJson = JSON.parse(
    fs.readFileSync("./package.json", "utf8")
);

const version = packageJson.version;
const tag = `v${version}`;
const releaseName = `BlockSkript v${version}`;

const changelog = fs.existsSync("./CHANGELOG.md")
    ? fs.readFileSync("./CHANGELOG.md", "utf8").trim()
    : "## Informacje o aktualizacji\n\n- Poprawiono działanie aplikacji.";

const token = process.env.GH_TOKEN;

if (!token) {
    console.error("❌ Brak GH_TOKEN!");
    console.error("Ustaw GH_TOKEN przed uruchomieniem.");
    process.exit(1);
}

const owner = "sbkzaw2000-maker";
const repo = "blockskript";

function githubRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {

        const options = {
            hostname: "api.github.com",
            path,
            method,

            headers: {
                "User-Agent": "BlockSkript",
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json"
            }
        };

        const req = https.request(options, res => {

            let result = "";

            res.on("data", chunk => {
                result += chunk;
            });

            res.on("end", () => {

                let json;

                try {
                    json = result ? JSON.parse(result) : {};
                } catch {
                    json = {};
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(json);
                } else {
                    reject(
                        new Error(
                            `GitHub API ${res.statusCode}: ${result}`
                        )
                    );
                }
            });
        });

        req.on("error", reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function main() {

    console.log("");
    console.log("=================================");
    console.log("       BlockSkript Release");
    console.log("=================================");
    console.log("");

    console.log(`📦 Wersja: ${version}`);
    console.log(`🏷️ Tag: ${tag}`);
    console.log(`📝 Nazwa: ${releaseName}`);
    console.log("");

    try {

        /*
         * 1. Utworzenie / aktualizacja GitHub Release
         */

        let release;

        try {

            release = await githubRequest(
                "GET",
                `/repos/${owner}/${repo}/releases/tags/${tag}`
            );

            console.log("ℹ️ Release już istnieje.");
            console.log("📝 Aktualizuję nazwę i opis...");

            release = await githubRequest(
                "PATCH",
                `/repos/${owner}/${repo}/releases/${release.id}`,
                {
                    name: releaseName,
                    body: changelog,
                    draft: false,
                    prerelease: false
                }
            );

        } catch {

            console.log("🆕 Tworzę nowy Release...");

            release = await githubRequest(
                "POST",
                `/repos/${owner}/${repo}/releases`,
                {
                    tag_name: tag,
                    name: releaseName,
                    body: changelog,
                    draft: false,
                    prerelease: false
                }
            );
        }

        console.log("");
        console.log("✅ GitHub Release gotowy!");
        console.log(`🔗 ${release.html_url}`);
        console.log("");

        /*
         * 2. Budowanie aplikacji
         */

        console.log("🔨 Uruchamiam electron-builder...");
        console.log("");

        execSync(
            "npx electron-builder --win nsis",
            {
                stdio: "inherit"
            }
        );

        console.log("");
        console.log("=================================");
        console.log("✅ RELEASE GOTOWY!");
        console.log("=================================");
        console.log("");

    } catch (error) {

        console.error("");
        console.error("❌ Wystąpił błąd:");
        console.error(error.message);
        console.error("");

        process.exit(1);
    }
}

main();