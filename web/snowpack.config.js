// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  root: ".",
  mount: {
    src: { url: "/" },
    public: { url: "/", static: true, resolve: false },
  },
  buildOptions: {
    out: "./build",
  },
  plugins: [
    "@snowpack/plugin-typescript",
    "@snowpack/plugin-postcss",
    ["@snowpack/plugin-webpack", {}],
  ],
  devOptions: {
    talwindConfig: "./tailwind.config.js",
  },
};
