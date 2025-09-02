const nodePath = require("path");
const fs = require("fs");
const sass = require("sass");
const url = require("url")

/**
 * This file expects 4 arguments to be passed when executed
 * 1. Path to Client_Properties --client-props
 * 2. Path to Sass Source Files --sass-source
 * 3. Path to CSS output directories --css-output (concatenated with "+")
 * 4. Environment --env ("production" or "development")
 */
let clientPropsPath = null;
let sassSourcePath = null;
let cssOutputPaths = null;
let environment = "development";
const CSS_OUTPUT_PATH_ARGUMENT_SEPARATOR = "+";

let clientPropsMap = null;

const THEME_FILES_TO_INCLUDE_KEY = "theme_files_to_include_and_their_display_key_names";

function processArgs() {
    process.argv.forEach((val, index) => {
        function nextArg() {
            return process.argv[index + 1] === undefined ? "" : process.argv[index + 1];
        }

        function hasNextArg() {
            const next = nextArg();
            const hasNext = next && next.indexOf("--") === -1;
            return hasNext;
        }

        if (val === "--client-props") {
            if (hasNextArg()) {
                clientPropsPath = nextArg();

                clientPropsMap = (() => {
                    try {
                        return JSON.parse(fs.readFileSync(nodePath.resolve(clientPropsPath), "utf8"));
                    } catch (err) {
                        throw new Error("Unable to read Client_Properties.json: " + err);
                    }
                })();

                console.log("--client-props set to: " + clientPropsPath);
            } else {
                throw new Error("missing --client-props value in argv: " + process.argv);
            }
        } else if (val === "--sass-source") {
            if (hasNextArg()) {
                sassSourcePath = nextArg();
                console.log("--sass-source set to: " + sassSourcePath);
            }
        } else if (val === "--css-output") {
            if (hasNextArg()) {
                cssOutputPaths = nextArg().split(CSS_OUTPUT_PATH_ARGUMENT_SEPARATOR);
                console.log("--css-output set to: " + cssOutputPaths.join(" "));
            }
        } else if (val === "--env") {
            if (hasNextArg()) {
                const devOrProd = nextArg();
                if (devOrProd === "dev" || devOrProd === "development") {
                    environment = "development";
                } else if (devOrProd === "prod" || devOrProd === "production") {
                    environment = "production";
                } else {
                    console.warn("Unknown value passed to --env : " + devOrProd);
                }
            }
        }
    });

    if (!sassSourcePath) {
        throw new Error("--sass-source was null " + process.argv);
    }

    if (!cssOutputPaths || cssOutputPaths.length === 0) {
        throw new Error("--css-output was null " + process.argv);
    }
}

/**
 * Compiles in order:
 * Example: Assuming we have theme files called RedTheme and BlueTheme
 * 1. All non theme environment files.
 * 2. RedTheme Globals (manually importing any partials)
 * 3. All !Default Globals
 * 4. Utilities
 * 5. (inserts a wrapper id) #RedTheme {
 * 6. Theme Dependent Environment Variables
 * 7. Components
 * 8. Pages
 * 9. Application
 * 10. Customer
 * 11. (closes the wrapper id) }
 * 12. Then runs step 2 through 11 for the BlueTheme
 */
function runTaskAction() {
    processArgs();

    console.log("START: Compiling SASS files...");
    compilePreThemeFile();

    const themeFilePaths = getAllThemeFilePaths();
    console.log("Found " + themeFilePaths.length + " theme files.");

    themeFilePaths.forEach(compileSingleThemeFile);
    console.log("\nFINISH: Compiling SASS files...");
}

function writeCssFileToDisk(cssFileName, compileResult) {
    const {css, sourceMap, loadedUrls} = compileResult;

    let finalCss = "" + css;

    if (sourceMap) {
        // relativize sourceMap.sources
        const relativeRoot = nodePath.resolve(process.cwd(), '../');
        sourceMap.sources.forEach((source, index) => {
            const absolutePath = url.fileURLToPath(source);
            const relativePath = nodePath.relative(relativeRoot, absolutePath);
            sourceMap.sources[index] = 'file://' + relativePath;
        })

        finalCss += "\n\n";
        finalCss += '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,';
        finalCss += (Buffer.from(JSON.stringify(sourceMap), 'utf8') || '').toString('base64');
        finalCss += ' */\n';
    }

    cssOutputPaths.forEach((outPath) => {
        fs.writeFileSync(nodePath.resolve(outPath, cssFileName), finalCss, "utf8");
    });
}

function compilePreThemeFile() {
    console.log("\nCompiling pre theme files");

    // Make a file called pretheme.scss
    let prethemeString = "";

    const fontIconMapSass = getFontIconMapSass();
    fontIconMapSass.forEach((val) => (prethemeString += createImportStatement(val)));

    const nonThemedEnvironmentSass = getNonThemedEnvironmentSass();
    nonThemedEnvironmentSass.forEach((val) => (prethemeString += createImportStatement(val)));

    const compileResult = compileSubsetSassString(
        prethemeString,
        fontIconMapSass.concat(fontIconMapSass)
    );
    console.log("\nFinished compiling pre theme files.\n");

    writeCssFileToDisk("pretheme.css", compileResult);
}

/**
 * Returns the list of theme files to be iterated over
 *
 * @return {}[]
 */
function getAllThemeFilePaths() {
    const themeFilesToInclude = clientPropsMap[THEME_FILES_TO_INCLUDE_KEY];
    if (!themeFilesToInclude) {
        throw new Error(
            "Unable to locate: " + THEME_FILES_TO_INCLUDE_KEY + " in Config_Properties.json"
        );
    }

    const themeFolderPath = nodePath.resolve(sassSourcePath, "themes");
    const themeDir = fs.readdirSync(themeFolderPath);
    const includedThemePaths = [];

    themeDir.forEach((fileName) => {
        // Allow end user to specify a theme file name that optionally includes the file suffix
        const fileNameWithoutSuffix = fileName.slice(0, fileName.length - 5);
        if (!themeFilesToInclude[fileName] && !themeFilesToInclude[fileNameWithoutSuffix]) {
            return;
        }
        const filePath = nodePath.resolve(themeFolderPath, fileName);
        const stat = fs.lstatSync(filePath);
        if (stat.isFile()) {
            includedThemePaths.push({filePath, fileName});
        }
    });

    if(themeFilesToInclude.length === 0) {
        throw new Error("SASS compilation requires one valid theme file. Ensure the map located in Client_Properties.json at " + THEME_FILES_TO_INCLUDE_KEY + " has at least one key that references a file in " + themeDir);
    }

    return includedThemePaths;
}

function compileSingleThemeFile(themeFileInfo) {
    //Iterate over every theme file, import any partials it's declared, by adding those files to the collection.
    //wrap it with a class of the theme name. Then compile out the sass

    const {fileName, filePath} = themeFileInfo;
    const themeName = fileName.substring(0, fileName.lastIndexOf("."));
    console.log("\nBuilding SASS Theme: " + themeName + ".");

    //Build a temp string representation of a sass file that has all of the imports
    let fileContent = "";

    // Add import statements for all the themed files that are not wrapped by the theme id selector
    const modifierFunctionSass = getModifierFunctionsSass();
    modifierFunctionSass.forEach((path) => (fileContent += createImportStatement(path)));

    fileContent += createImportStatement(filePath);

    const themeRequiredSass = getThemeRequiredSass();
    themeRequiredSass.forEach((path) => (fileContent += createImportStatement(path)));

    const fontIconMapSass = getFontIconMapSass();
    fontIconMapSass.forEach((path) => (fileContent += createImportStatement(path)));

    const utilitySass = getUtilitySass();
    utilitySass.forEach((path) => (fileContent += createImportStatement(path)));

    //Wrap all theme specific sass in the theme id selector
    fileContent += `\n#${themeName} {\n`;
    const wrappedThemeSpecificSass = getWrappedThemeSpecificSass();
    wrappedThemeSpecificSass.forEach((path) => (fileContent += createImportStatement(path)));
    fileContent += "\n}";

    // Compile the entire theme into a single css file, using all needed files, independently of any other themes
    const themeOutput = compileSubsetSassString(
        fileContent,
        modifierFunctionSass
            .concat([filePath])
            .concat(themeRequiredSass)
            .concat(fontIconMapSass)
            .concat(utilitySass)
            .concat(wrappedThemeSpecificSass)
    );
    console.log("Created Theme: " + themeName + ".");

    writeCssFileToDisk(themeName + ".css", themeOutput);
}

/**
 * Returns the sass file paths to be compiled before all themes, and independent of themes.
 */
function getNonThemedEnvironmentSass() {
    const files = findScss(nodePath.resolve(sassSourcePath, "platform", "environment", "not_themed"));
    // console.log("Found " + files.length + " environment files.");
    return files;
}

/**
 * Returns the sass file paths to be compiled inside of each theme compilation, but before the actual theme file
 */
function getModifierFunctionsSass() {
    const filePaths = findScss(nodePath.resolve(sassSourcePath, "platform", "modifier_functions"));
    // console.log(
    //     "Found " +
    //     filePaths.length +
    //     " modifier function files. These will be compiled per theme before global and utility files but after theme file variables."
    // );
    return filePaths;
}

/**
 * Returns the sass files relating to font icon maps. These files are required by non themed sass
 * to build out font-icon css classes, but also by themed mixins that need access to the maps.
 */
function getFontIconMapSass() {
    const filePaths = findScss(nodePath.resolve(sassSourcePath, "platform", "icon_font_maps"));
    // console.log(
    //     "Found " +
    //     filePaths.length +
    //     " font icon files. These will be compiled per theme, outside of the theme wrapper class."
    // );
    return filePaths;
}

/**
 * Returns the sass file paths to be compiled for each theme, but outside of the given theme wrapper.
 */
function getThemeRequiredSass() {
    const filePaths = findScss(nodePath.resolve(sassSourcePath, "themes", "global_variables"));
    // console.log(
    //     "Found " +
    //     filePaths.length +
    //     " global variable files. These will be compiled per theme, outside of the theme wrapper class."
    // );
    return filePaths;
}

/**
 * Gets the file paths for Utility functions used during theme compilation
 */
function getUtilitySass() {
    const filePaths = findScss(nodePath.resolve(sassSourcePath, "platform", "mixins_and_functions"));
    // console.log(
    //     "Found " +
    //     filePaths.length +
    //     " utility files. These will be compiled per theme, outside of the theme wrapper class."
    // );
    return filePaths;
}

/**
 * Returns all sass file paths to be compiled per theme, inside of the theme wrapper.
 */
function getWrappedThemeSpecificSass() {
    const filePaths = getScssInPaths(
        nodePath.resolve(sassSourcePath, "platform", "environment", "themed"),
        nodePath.resolve(sassSourcePath, "platform", "components"),
        nodePath.resolve(sassSourcePath, "platform", "pages"),
        nodePath.resolve(sassSourcePath, "apps"),
        nodePath.resolve(sassSourcePath, "customer")
    );
    console.log(
        "Found " +
        filePaths.length +
        " sass files to be compiled inside the theme class wrapper for theme."
    );
    return filePaths;
}

function getScssInPaths(...paths) {
    let explodedPaths = [];
    paths.forEach((path) => (explodedPaths = explodedPaths.concat(findScss(path))));
    return explodedPaths;
}

/**
 * Does the full sass compile, by way of a source map string and a source map.
 *
 * @return CompileResult of the fully compiled SASS
 */
function compileSubsetSassString(rawScss, loadPaths) {
    //TODO: run linter here, styleLint probably
    const options = {
        style: "compressed",
        sourceMap: !isProduction(),
        sourceMapIncludeSources: true,
        quietDeps: true,
        loadPaths,
    };

    const compiledSassInfo = sass.compileString(rawScss, options);
    return compiledSassInfo;
}

/**
 * Unfortunately, our current SASS setup relies on alphabetical ordering of Files.
 */
function findScss(directoryRoot) {
    directoryRoot = nodePath.relative(__dirname, directoryRoot);

    if (!fs.existsSync(directoryRoot)) {
        return [];
    }

    const orderedFilePaths = [];

    function readDirectory(currDirRoot) {
        fs.readdirSync(currDirRoot)
            .sort()
            .forEach((fileName) => {
                const filePath = nodePath.join(currDirRoot, fileName);
                const fileStat = fs.lstatSync(filePath);
                if (fileStat.isFile()) {
                    if (isSassFile(fileName)) {
                        orderedFilePaths.push(filePath);
                    }
                } else if (fileStat.isDirectory()) {
                    readDirectory(filePath);
                }
            });
    }

    readDirectory(directoryRoot);
    return orderedFilePaths;
}

function isSassFile(fileNameOrPath) {
    const split = fileNameOrPath.split(".");
    return split[split.length - 1] === "scss" || split[split.length - 1] === "sass";
}

function createImportStatement(scssFilePath) {
    const chunks = scssFilePath.split(".");
    const fileExt = chunks[chunks.length - 1];

    const validFileExt = {
        "scss": true,
        "css": true,
        "sass": true
    }

    if (!validFileExt[fileExt]) {
        return "";
    }
    // SASS compiler requires URLs to parse import files
    const converter = (url && url.pathToFileURL) || pathToFileURLPolyfill;
    return "@import '" + converter(nodePath.resolve(__dirname, scssFilePath)) + "';\n";
}

function pathToFileURLPolyfill(filePath) {
    return filePath.replaceAll("\\", "/")
        .replaceAll(" ", "%20")
        .replace(/(.)\:\//, "file:///$1:/");
}

function isProduction() {
    return environment === "production";
}

runTaskAction();
