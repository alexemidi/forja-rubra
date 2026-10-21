const fs = require('node:fs');
const Module = require('node:module');
const esbuild = require('esbuild');

// Interceptar resolução para arquivos .js / .mjs apontando para .ts se não existirem
const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  try {
    return origResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      const tsCandidate = request.replace(/\.(m?js)$/, '.ts');
      if (tsCandidate !== request) {
        try {
          return origResolveFilename.call(this, tsCandidate, parent, isMain, options);
        } catch (_) {}
      }
    }
    throw err;
  }
};

// Suporte para require de arquivos .ts em tempo de execução
require.extensions['.ts'] = function(module, filename) {
  const code = fs.readFileSync(filename, 'utf8');
  const transformed = esbuild.transformSync(code, {
    loader: 'ts',
    target: 'es2022',
    sourcefile: filename
  });
  module._compile(transformed.code, filename);
};

// Interceptor para carregar .ts caso um require peça o arquivo antigo .js ou .mjs
const defaultJs = require.extensions['.js'];
require.extensions['.js'] = function(module, filename) {
  if (!origExistsSync(filename)) {
    const tsCandidate = filename.replace(/\.(m?js)$/, '.ts');
    if (origExistsSync(tsCandidate)) {
      return require.extensions['.ts'](module, tsCandidate);
    }
  }
  return defaultJs(module, filename);
};

// Compatibilidade de leitura de arquivos para testes estáticos legados
const origReadFileSync = fs.readFileSync;
fs.readFileSync = function(pathArg, options) {
  if (typeof pathArg === 'string' && (pathArg.endsWith('.js') || pathArg.endsWith('.mjs')) && (pathArg.includes('src') || pathArg.includes('src/'))) {
    if (!origExistsSync(pathArg)) {
      const tsPath = pathArg.replace(/\.(m?js)$/, '.ts');
      if (origExistsSync(tsPath)) {
        return origReadFileSync(tsPath, options);
      }
    }
  }
  return origReadFileSync(pathArg, options);
};

const origExistsSync = fs.existsSync;
fs.existsSync = function(pathArg) {
  const exists = origExistsSync(pathArg);
  if (!exists && typeof pathArg === 'string' && (pathArg.endsWith('.js') || pathArg.endsWith('.mjs')) && (pathArg.includes('src') || pathArg.includes('src/'))) {
    const tsPath = pathArg.replace(/\.(m?js)$/, '.ts');
    return origExistsSync(tsPath);
  }
  return exists;
};
