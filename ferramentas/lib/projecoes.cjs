const {JSDOM}=require('jsdom');
function gerarProjecoes(items,improvements,cards){
 const document=new JSDOM(Object.values(cards).join('')).window.document;
 const descriptions=[...document.querySelectorAll('[data-spell-key]')].map(card=>{
  const entry=document.createElement('div');entry.dataset.spellKey=card.dataset.spellKey;
  entry.innerHTML=[...card.querySelectorAll('.card-props,.card-desc,.truque-section,.apr-section')].map(node=>node.outerHTML).join('');return entry.outerHTML;
 }).join('');
 const spellTexts=Object.fromEntries([...document.querySelectorAll('[data-spell-key]')].map(card=>{
   const sections=[...card.querySelectorAll('.card-props,.card-desc,.truque-section,.apr-section')];
   return [card.dataset.spellKey,sections.map(section=>{
     const clone=section.cloneNode(true);
     clone.querySelectorAll('.apr-title').forEach(node=>node.remove());
     clone.querySelectorAll('.prop-row').forEach(row=>{
       const label=(row.querySelector('.prop-label')?.textContent||'').trim().replace(/:$/,'');
       const val=(row.querySelector('.prop-value')?.textContent||'').trim();
       if(label&&val){
         row.textContent=`${label}: ${val}\n`;
       }
     });
     clone.querySelectorAll('br').forEach(node=>node.replaceWith('\n'));
     clone.querySelectorAll('p,li').forEach(node=>node.append('\n'));
     return clone.textContent.replace(/[\t ]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
   }).filter(Boolean).join('\n\n')];
 }));
 return {
  'magias-textos':spellTexts,
  'criador-pdfItems':items.map(({id,nome,tipo,categoriaId,espacos,preco,equipamento,arma,armadura,escudo,textos,livroOrigemId,magico,origem,origemExclusiva})=>({id,nome,tipo,categoriaId,espacos,preco,equipamento,arma,armadura,escudo,...(textos?{textos}:{}),...(livroOrigemId?{livroOrigemId}:{}),...(magico?{magico}:{}),...(origem?{origem}:{}),...(origemExclusiva?{origemExclusiva}:{})})),
  'criador-inventoryLoadData':{items:items.map(({id,espacos,magico})=>({id,espacos,magico})),improvements:improvements.melhorias.map(({id,efeitos})=>({id,efeitos}))},
  'criador-grimoireHtml':descriptions
 };
}
module.exports={gerarProjecoes};
