/* Preparação da página de ficha; a navegação pertence a renderStage. */
window.prepararFicha=function(){
  const params=new URLSearchParams(location.search);
  const heroId=params.get('id');
  if(heroId){
    const roster = typeof characterRoster === 'function' ? characterRoster() : [];
    const mesaHerois = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa.listarHeroisMesa() : [];
    const found = roster.find(h => h.id === heroId || h.name === heroId) || mesaHerois.find(h => h.id === heroId || h.nome === heroId);
    if(found?.snapshot && Object.keys(found.snapshot).length > 0){
      state = ModeloEstado.migratePersistedState(found.snapshot);
      normalizeState();
    }
  } else if(!state.identity?.characterName&&!state.identity?.raceId&&!state.identity?.classId&&!state.progression?.length){
    const roster=characterRoster();
    if(roster[0]?.snapshot){state=ModeloEstado.migratePersistedState(roster[0].snapshot);normalizeState()}
  }
  try {
    const rawActive = localStorage.getItem('forja-heroi-t20-v1');
    if (rawActive) {
      const activeH = JSON.parse(rawActive);
      if (activeH?.distinctions && Array.isArray(activeH.distinctions.activeIds)) {
        const existingIds = Array.isArray(state.distinctions?.activeIds) ? state.distinctions.activeIds : [];
        const mergedIds = Array.from(new Set([...existingIds, ...activeH.distinctions.activeIds]));
        if (mergedIds.length > existingIds.length || JSON.stringify(state.distinctions?.activeIds) !== JSON.stringify(activeH.distinctions.activeIds)) {
          state.distinctions = {
            activeIds: mergedIds,
            selectedId: activeH.distinctions.selectedId || state.distinctions?.selectedId || mergedIds[0] || ''
          };
          if (typeof persistNow === 'function') persistNow();
        }
      }
    }
  } catch (_e) {}
  if(!state.isLevelingUp&&!state.editingCharacter){
    state.finished=true;
    state.step=10;
    const params=new URLSearchParams(location.search);
    const view=params.get('view');
    if (view === 'workshop') {
      const ofParam = params.get('oficina') || '';
      if (ofParam === 'engenhoqueiro' || ofParam === 'engenhoca') {
        window.location.replace('loja.html?oficina=engenhoqueiro');
        return;
      } else {
        window.location.replace('oficina.html?modo=fabricar' + (ofParam ? '&oficina=' + encodeURIComponent(ofParam) : ''));
        return;
      }
    }
    state.sheetView=['shop','tavern','grimoire','sheet'].includes(view)?view:'sheet';
  }
};
