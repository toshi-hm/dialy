export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,json,css}': (filenames) => [
    `pnpm biome lint ${filenames.join(' ')}`,
    `pnpm biome format --write ${filenames.join(' ')}`,
  ],
};
