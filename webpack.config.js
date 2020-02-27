module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js"
  },
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./dist"
  }
};
