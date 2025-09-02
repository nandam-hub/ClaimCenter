const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');

/**
 * Create only the minified bundle
 */
module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'ClaimCenterHeatMapAzure.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'ClaimCenterHeatMapAzure',
      type: 'umd',
      export: 'default',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

// Copy the output file to the original directory for easier testing
const outputDir = path.resolve(__dirname, '../');
const buildCallback = (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(err || stats.toString());
    return;
  }
  
  // Copy only the minified version
  const file = 'ClaimCenterHeatMapAzure.min.js';
  const src = path.resolve(__dirname, 'dist', file);
  const dest = path.resolve(outputDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFile(src, dest, (err) => {
      if (err) {
        console.error(`Error copying ${file}: ${err}`);
      } else {
        console.log(`Successfully copied ${file} to ${dest}`);
      }
    });
  }
};
