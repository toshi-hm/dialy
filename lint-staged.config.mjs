export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,json,css}': (filenames) => {
    return [`pnpm exec biome check --write ${filenames.join(' ')}`];
  },
};
