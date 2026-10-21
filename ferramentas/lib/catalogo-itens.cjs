// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/**
 * Constrói e retorna a lista de todos os 750 itens canônicos (básicos, mágicos específicos e padrões adicionais).
 * @param {string} rootPath Diretório raiz do projeto
 * @returns {Array<any>}
 */
function obterCatalogoCanonicaItems(rootPath) {
  const read = p => fs.readFileSync(path.join(rootPath, p), 'utf8');

  const items = JSON.parse(read('dados/items.json'));
  const addedMagic = JSON.parse(read('dados/added_magic_content.json'));
  const improvements = JSON.parse(read('dados/improvement_data.json'));
  const enchantments = JSON.parse(read('dados/enchantment_data.json'));

  const ctx = {
    window: {
      __FORJA_DATA__: {
        ITEMS: items,
        ADDED_MAGIC_CONTENT: addedMagic,
        IMPROVEMENT_DATA: improvements,
        ENCHANTMENT_DATA: enchantments
      }
    },
    forjaArsenalStorage: { getItem: () => null }
  };
  vm.createContext(ctx);

  const readScript = p => {
    const tsCandidate = p.endsWith('.ts') ? p : p.replace(/\.(m?js)$/, '.ts');
    const resolvedPath = fs.existsSync(path.join(rootPath, tsCandidate)) ? tsCandidate : p;
    const raw = read(resolvedPath);
    if (resolvedPath.endsWith('.ts')) {
      const esbuild = require('esbuild');
      return esbuild.transformSync(raw, { loader: 'ts', target: 'es2022', sourcefile: resolvedPath }).code;
    }
    return raw;
  };

  vm.runInContext(readScript('src/funcionalidades/loja/03-00-ITEMS.ts'), ctx);
  vm.runInContext(readScript('src/funcionalidades/loja/03-01-LITURGICAL_CONTENT.ts'), ctx);
  vm.runInContext(readScript('src/funcionalidades/loja/03-02-current.ts'), ctx);

  const canonicalItems = vm.runInContext('ITEMS.concat(EXTRA_MAGIC_ITEMS, ADDITIONAL_STANDARD_ITEMS)', ctx);
  return canonicalItems;
}

module.exports = { obterCatalogoCanonicaItems };
