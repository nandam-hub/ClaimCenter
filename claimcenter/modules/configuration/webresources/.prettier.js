const prettier = require("prettier");
const fs = require("fs");
const glob = require("glob");
const { filesToTest } = require("./.eslintrc");
const prettierConfigPath = require.resolve("./.prettierrc");

const mode = process.argv[2] || "check";
const filePaths = process.argv.slice(3);

const shouldWrite = mode === "write";
let didWarn = false;
let didError = false;

const files =
    filePaths.length !== 0
        ? filePaths
        : [].concat(
              ...filesToTest
                  .map((file) => file.replace(/'/g, ""))
                  .map((file) =>
                      glob.sync(file, {
                          ignore: [
                              "**/node_modules/**",
                              "**/dist/**",
                              "**/build/**",
                              "**/reports/**",
                              "**/tmp/**",
                              "**/i18n/**",
                          ],
                      })
                  )
          );

files.forEach((file) => {
    const options = prettier.resolveConfig.sync(file, {
        config: prettierConfigPath,
    });
    try {
        const input = fs.readFileSync(file, "utf8");
        if (shouldWrite) {
            const output = prettier.format(input, options);
            if (output !== input) {
                fs.writeFileSync(file, output, "utf8");
            }
        } else {
            if (!prettier.check(input, options)) {
                console.log(file);
                didWarn = true;
            }
        }
    } catch (error) {
        didError = true;
        console.log("\n\n" + error.message);
        console.log(file);
    }
});

if (didWarn) {
    console.log("Code style issues found in the above file(s). Forgot to run `npm run prettier`?");
}

if (didWarn || didError) {
    process.exit(1);
}
