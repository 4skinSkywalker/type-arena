const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

function _exec(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout) => {
            if (error) {
                reject(error);
            }
            resolve(stdout);
        });
    });
}

(async function() {
    const currentDir = process.cwd();
    console.log("Current directory:", currentDir);
    await _exec("ng build --output-path docs --base-href /type-arena/");
    console.log("Built, ready to deploy");
    fs.copyFileSync("docs/browser/index.html", "docs/browser/404.html");
    console.log("Files copied");
    fs.rmSync(path.join(currentDir, "..", "docs"), { recursive: true });
    console.log("Removed old deployment");
    fs.cpSync("docs/browser", path.join(currentDir, "..", "docs"), { recursive: true });
    console.log("Successfully moved new deployment to root");
})();