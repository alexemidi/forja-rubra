function renderGrimoireCompletion(plan=spellPlan()){
  const ids=allLearnedSpellIds(plan).filter(id=>spellById(id)),sources=characterSpellcastingSources();
  const learning=plan.classes.map(cls=>{
    const frequency=cls.path==='feiticeiro'?'nivel_impar':cls.effect.aprendeMagia?.frequencia||(cls.classId==='frade'?'todo_nivel':'nenhuma');
    const label={todo_nivel:'Aprende uma nova magia a cada nível nesta classe.',nivel_par:'Aprende uma nova magia a cada nível par nesta classe.',nivel_impar:'Aprende uma nova magia a cada nível ímpar nesta classe.'}[frequency]||'O aprendizado adicional segue as habilidades desta classe.';
    return '<p><strong>'+esc(cls.name)+'</strong> — '+label+(cls.path==='mago'?' Também aprende uma magia adicional ao alcançar um novo círculo.':'')+'</p>';
  }).join('');
  const schools=[...new Set(plan.classes.flatMap(cls=>cls.schools||[]))];
  return '<p>Este é o seu grimório. Você conhece <strong>'+ids.length+' magia(s)</strong>.</p>'+learning+(schools.length?'<p>Você estudou nas escolas de magia '+esc(schools.map(id=>SPELL_SCHOOLS[id]||id).join(', '))+'.</p>':'')+'<ul>'+ids.map(id=>'<li>'+esc(spellById(id).name)+'</li>').join('')+'</ul>'+sources.map(source=>'<p><strong>CD das magias de '+esc(source.name)+': '+source.cd+'</strong></p>').join('');
}
function openGrimoireCompletion(){
  const modal=document.getElementById('spellSchoolModal');
  schoolDialogReturnFocus=document.activeElement;modal.dataset.mode='grimoire';modal.dataset.classId='';
  document.getElementById('spellSchoolTitle').textContent='Seu grimório';
  document.getElementById('spellSchoolBody').innerHTML=renderGrimoireCompletion();
  document.getElementById('spellSchoolActions').innerHTML='<button type="button" class="button primary" data-action="school-dialog-close">Ver magias aprendidas</button>';
  spellState().view='learned';modal.hidden=false;document.getElementById('spellSchoolTitle').focus?.();
}
