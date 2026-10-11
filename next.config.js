const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
    prependData: `
      @use "abstracts/variables" as *;
      @use "abstracts/mixins" as *;
    `,
  },
};

module.exports = nextConfig;
