// Only the embedded copy uses this isolated store, never the standalone Arsenal.
const arsenalInitialState=/*__ARSENAL_STATE__*/;
const arsenalStorageValues={...arsenalInitialState.storage};
const forjaArsenalStorage={
  getItem(key){return arsenalStorageValues[key]??null},
  setItem(key,value){arsenalStorageValues[key]=String(value);window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'save',storage:{...arsenalStorageValues}},'*')},
  removeItem(key){delete arsenalStorageValues[key];window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'save',storage:{...arsenalStorageValues}},'*')}
};
