const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
// const ESLintWebpackPlugin = require("eslint-webpack-plugin");

/**
 * This file expects 2 arguments
 * 1. --js-output: a list of output directories concatenated with "+"
 * 2. --env: "production" or "development"
 */

const JS_OUTPUT_PATH_ARGUMENT_SEPARATOR = "+";
let outputDirs = [];
let environment = "production"; //default to production

process.argv.forEach(function (val, index) {
  function nextArg() {
    return index + 1 < process.argv.length ? process.argv[index + 1] : "";
  }

  function hasNextArg() {
    const next = nextArg();
    return next && !next.startsWith("--");
  }

  if (val === "--js-output") {
    if (hasNextArg()) {
      outputDirs = nextArg().split(JS_OUTPUT_PATH_ARGUMENT_SEPARATOR);
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

function isProduction() {
  return environment === "production";
}

const getExportLineForFile = (fileName) => {
  const normalizedFileName = path.sep === "/" ? fileName : fileName.split(path.sep).join("/");
  return 'export * from "' + normalizedFileName.replace(".ts", "") + '";';
};

const writeIndexFile = (dir, prefix, paths) => {
  const indexPath = path.resolve(dir, prefix + "-index.ts");

  let finalString = "/* eslint:disable:no-import-side-effect */";

  paths.forEach((fileName) => {
    finalString += "\n";
    finalString += getExportLineForFile(fileName);
  });

  const fd = fs.openSync(indexPath, "w");
  fs.writeSync(fd, finalString);
  fs.closeSync(fd);
  return indexPath;
};

const buildTsPaths = (filePaths, filter, dir) => {
  const prefix = dir.replace(tsRootDir, ".") + path.sep;
  const dirs = [];

  fs.readdirSync(dir).forEach((fileName) => {
    const subPath = path.resolve(dir, fileName);
    if (filter(subPath)) {
      const statObj = fs.statSync(subPath);
      if (statObj.isDirectory()) {
        dirs.push(subPath);
      } else if (fileName.indexOf(".ts") > -1 && fileName.indexOf(".d.ts") === -1) {
        filePaths.push(prefix + fileName);
      }
    }
  });

  dirs.forEach(buildTsPaths.bind(this, filePaths, filter));
};

//
// Transpiles TypeScript and builds combined webpack files
//
function transpileTypeScript(rootDir, outputFileName, entryPoint, callback) {
  let webpackConfig = {
    entry: entryPoint,
    mode: environment,
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: {
              // Leave type-checking to the fork loader
              transpileOnly: true,
            },
          },
        },
        // Source map loader, extracts source maps from JavaScript libraries (jQuery, d3) to be processed by webpack
        {
          test: /\.js$/,
          use: ["source-map-loader"],
          enforce: "pre",
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        JQuery: "jquery",
        jQuery: "jquery",
      },
    },
    output: {
      path: outputDirs[0],
      filename: outputFileName,
      libraryTarget: "umd",
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({ async: false }),// No async to ensure webpack waits
      // new ESLintWebpackPlugin({ extensions: [".ts"], context: "ts", exclude: "node_modules" }),
      new webpack.SourceMapDevToolPlugin({ include: outputFileName }),
    ],
  };

  function copyToAdditionalDirectoriesIfNeeded() {
    for (let i = 1; i < outputDirs.length; i++) {
      const additionalDir = outputDirs[i];
      fs.copyFileSync(
        path.resolve(outputDirs[0], outputFileName),
        path.resolve(additionalDir, outputFileName),
        fs.constants.COPYFILE_FICLONE
      );
    }
  }

  webpack(webpackConfig, function (wpErr, wpStats) {
    if (wpErr) {
      throw new Error(wpErr.toString());
    } else {
      const compilation = wpStats.compilation;
      if (compilation.errors && compilation.errors.length > 0) {
        throw new Error(wpStats.toString());
      }

      copyToAdditionalDirectoriesIfNeeded();

      console.info(wpStats.toString());
      if (callback) {
        callback();
      }
    }
  });
}

//
// Main program
//

const tsRootDir = path.resolve(__dirname, "ts");

const nodeModulesDir = path.resolve(__dirname, "node_modules");
const testDir = path.resolve(tsRootDir, "test");
const embeddedDir = path.resolve(tsRootDir, "embedded");

console.info("\nGenerating index file for internal TypeScript...");

function filterForInternalTypeScript(path) {
  return path !== nodeModulesDir && path !== testDir && path !== embeddedDir;
}

const internalTsPaths = [];
buildTsPaths(internalTsPaths, filterForInternalTypeScript, tsRootDir);
const internalEntryPoint = writeIndexFile(tsRootDir, "internal", internalTsPaths.sort());

console.info("\nTranspiling internal TypeScript...");
transpileTypeScript(tsRootDir, "app-ts.js", internalEntryPoint, function () {
  fs.unlinkSync(internalEntryPoint);

  console.info("\nGenerating index file for embedded TypeScript...");

  function filterForEmbeddedTypeScript(path) {
    return path.startsWith(embeddedDir);
  }

  const embeddedTsPaths = [];
  buildTsPaths(embeddedTsPaths, filterForEmbeddedTypeScript, tsRootDir);
  const embeddedEntryPoint = writeIndexFile(tsRootDir, "embedded", embeddedTsPaths.sort());

  console.info("\nTranspiling embedded TypeScript...");
  transpileTypeScript(tsRootDir, "gw-embedded-ts.js", embeddedEntryPoint, function () {
    fs.unlinkSync(embeddedEntryPoint);
  });
});
