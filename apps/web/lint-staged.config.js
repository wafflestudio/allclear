module.exports = {
  '**/*.(ts|tsx)': () => 'pnpm tsc --noEmit',
  '**/*.(ts|tsx|js|jsx|json|jsonc)': (filenames) =>
    `pnpm biome check --write --no-errors-on-unmatched ${filenames.join(' ')}`,
}
