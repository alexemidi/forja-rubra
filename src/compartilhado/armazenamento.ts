/* Porta de armazenamento injetável: nenhuma dependência da interface. */
const ArmazenamentoForja = Object.freeze({
  criar(storage) {
    return Object.freeze({
      ler(key, fallback) {
        try {
          const value=JSON.parse(storage.getItem(key)||'null');
          if(value===null)return fallback();
          if(key==='forja-heroi-t20-v1'&&(!value.identity||typeof value.identity!=='object'))throw Error('Identidade ausente');
          if(['forja-heroi-t20-personagens-v1','forja-roster-t20-v1'].includes(key)&&!Array.isArray(value))throw Error('Lista inválida');
          if(typeof ForjaUnificada!=='undefined'){
            if(key==='forja-heroi-t20-v1')return ForjaUnificada.restaurarEstadoInterface(value);
            if(['forja-heroi-t20-personagens-v1','forja-roster-t20-v1'].includes(key))return value.map(hero=>({...hero,snapshot:ForjaUnificada.restaurarEstadoInterface(hero.snapshot)}));
          }
          return value;
        }
        catch(error) {
          if(['forja-heroi-t20-v1','forja-heroi-t20-personagens-v1','forja-roster-t20-v1'].includes(key))throw Error('Dados de personagem inválidos em '+key+'. Exporte o backup antes de recuperar a ficha.');
          return fallback();
        }
      },
      salvar(key, value) {
        // A exceção continua chegando ao chamador: falhas não podem parecer sucesso.
        if(typeof ForjaUnificada!=='undefined'){
          if(key==='forja-heroi-t20-v1')value=ForjaUnificada.separarEstadoInterface(value);
          if(['forja-heroi-t20-personagens-v1','forja-roster-t20-v1'].includes(key))value=value.map(hero=>({...hero,snapshot:ForjaUnificada.separarEstadoInterface(hero.snapshot)}));
        }
        storage.setItem(key, JSON.stringify(value));
      }
    });
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=ArmazenamentoForja;
