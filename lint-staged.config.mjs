export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,json,css}': (filenames) => [
    `pnpm lint ${filenames.join(' ')}`,
    `pnpm format ${filenames.join(' ')}`,
  ],
};
