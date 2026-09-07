let arsenalInitialState=/*__ARSENAL_STATE__*/;
const arsenalStorageValues={...arsenalInitialState.storage};
let arsenalTransaction=false;
function postArsenal(type,details={}){window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type,...details},'*')}
const forjaArsenalStorage={
  getItem(key){return arsenalStorageValues[key]??null},
  setItem(key,value){arsenalStorageValues[key]=String(value);if(!arsenalTransaction)postArsenal('save',{storage:{...arsenalStorageValues}})},
  removeItem(key){delete arsenalStorageValues[key];if(!arsenalTransaction)postArsenal('save',{storage:{...arsenalStorageValues}})}
};
