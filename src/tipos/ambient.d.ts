/**
 * Declarações de ambiente e extensões globais do Window para o navegador
 */

declare global {
  interface Window {
    [key: string]: any;
  }
  var Forja: any;
  var ForjaAuthUI: any;
  var ModuloAuth: any;
  var ForjaDrawer: any;
  var IconesForja: any;
  var ForjaModais: any;
  var ForjaTopBar: any;
  var ForjaLimites: any;
  var ForjaPassosDano: any;
  var ForjaGolpePessoal: any;
  var state: any;
  var renderStage: any;
  var sincronizarCabecalho: any;
  var prepararFicha: any;
  var supabase: any;
  var __FORJA_READY__: any;
  var __FORJA_ENV__: any;
  var __FORJA_CONTEXT__: any;
  var __FORJA_DATA__: any;
  var BOOKS: any;
  var SupabaseConfig: any;
  var remainingFunds: any;
  var raceById: any;
  var classById: any;
  var choiceId: any;
  var optionList: any;
  var selectedStandardOrigin: any;
  var originBenefitOptions: any;
  var skillTokenFromName: any;
}

export {};
