const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


function resolve(pathname) {
  return path.resolve(__dirname, pathname);
}

module.exports = function(env) {
  console.log(env);

  return {
    mode: "development",
    devtool: "inline-source-map",
    entry: resolve("src/index.ts"),
    output: {
      clean: true,
      path: resolve("dist"),
      filename: "iEditor.global.js"
    },
    devServer: {
      static: "./dist"
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "public", to: resolve("dist") }
        ]
      }),
      new MiniCssExtractPlugin()
    ],
    resolve: {
      extensions: [ ".ts", ".tsx", ".js" ]
    },
    // optimization: {
    //   runtimeChunk: "single"
    // },
    module: {
      rules: [
        {
          test: /\.ts$/i,
          use: [ "ts-loader" ],
          exclude: /node_modules/
        },
        {
          test: /\.css/i,
          use: [ MiniCssExtractPlugin.loader, "css-loader" ]
        }
      ]
    }
  }
}