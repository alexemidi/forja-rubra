/**
 * Runtime unificado em TypeScript da Forja T20.
 * Compõe o núcleo puro (src/lib/), os componentes visuais padronizados (src/components/ui/),
 * as features de domínio (src/features/), integrações (src/integrations/) e registro de páginas (src/pages/).
 */

import { efeitosMarcas } from '../lib/t20/distinctions.ts';
import {
  normalizarVitais,
  alterarVital,
  aplicarDescanso,
  encerrarAventura,
  calcularBonusIncentivadorEconomia,
} from '../lib/t20/vitals.ts';
import {
  estatisticas,
  moedas,
  espacosMoedas,
  calcularPrecoComModificador,
  calcularCustoFabricacao,
  RegrasPersonagem,
} from '../lib/t20/economy.ts';
import { criarCalculoPorOperacao } from '../lib/calculation-cache.ts';
import { sincronizarCabecalho } from '../components/ui/topbar.ts';
import { formatarReducaoDano } from '../components/ui/damage-reduction.ts';
import { tracosCondicao } from '../components/ui/condition-badges.ts';
import {
  renderTransactionModalHtml,
  renderConfirmModalHtml,
  renderChoiceModalHtml,
} from '../components/ui/modal.ts';
import * as RegrasMochilas from '../lib/t20/encumbrance.ts';
import * as RegrasMontarias from '../lib/t20/mounts.ts';
import * as RegrasManufaturaTs from '../lib/t20/crafting/index.ts';
import * as RecompensasT20Ts from '../lib/t20/rewards.ts';
import * as RegrasMasmorrasTs from '../lib/t20/dungeons.ts';
import {
  exportarBackup,
  importarBackup,
  validarBackup,
} from '../lib/storage/backup.ts';
import { renderCardInventario } from '../components/ui/inventory-card.ts';
import {
  restaurarEstadoInterface,
  separarEstadoInterface,
} from '../lib/storage/ui-state.ts';
import { ModuloPassosDano } from '../lib/t20/damage-steps.ts';
import { ModuloGolpePessoal } from '../lib/t20/golpe-pessoal.ts';
import * as RegrasFundamentalistas from '../lib/t20/fundamentalists.ts';
import * as RegrasFamiliarElemental from '../lib/t20/elemental-familiar.ts';
import * as RegrasCriacaoDosDeuses from '../lib/t20/criacao-dos-deuses.ts';
import * as RegrasArmaduraMecanizada from '../lib/t20/armadura-mecanizada.ts';
import * as RegrasArtesaoCriativo from '../lib/t20/artesao-criativo.ts';
import * as RegrasCampanha from '../lib/t20/regras-campanha.ts';
import * as ForjaFeatures from '../features/index.ts';
import { ExportacaoPersonagem } from '../integrations/export/character-export.ts';
import { FORJA_PAGES } from '../pages/registry.ts';

export const ForjaUnificada = Object.freeze({
  normalizarVitais,
  alterarVital,
  aplicarDescanso,
  encerrarAventura,
  calcularBonusIncentivadorEconomia,
  estatisticas,
  moedas,
  espacosMoedas,
  calcularPrecoComModificador,
  calcularCustoFabricacao,
  exportarBackup,
  importarBackup,
  validarBackup,
  renderCardInventario,
  renderTransactionModalHtml,
  renderConfirmModalHtml,
  renderChoiceModalHtml,
  restaurarEstadoInterface,
  separarEstadoInterface,
  podeReceberMaterialEspecial: RegrasManufaturaTs.podeReceberMaterialEspecial,
  registerAdventureSpending: ForjaFeatures.registerAdventureSpending,
  setManualAdventureSpending: ForjaFeatures.setManualAdventureSpending,
  addScopedTemporaryVital: ForjaFeatures.addScopedTemporaryVital,
  calculateCartCheckout: ForjaFeatures.calculateCartCheckout,
  removeCartItemAtIndex: ForjaFeatures.removeCartItemAtIndex,
  calculateSpecialArmorEffects: ForjaFeatures.calculateSpecialArmorEffects,
  canBeFundamentalist: RegrasFundamentalistas.canBeFundamentalist,
  getFundamentalistText: RegrasFundamentalistas.getFundamentalistText,
  getFundamentalistObligations: RegrasFundamentalistas.getFundamentalistObligations,
  isBroadDevotion: RegrasFundamentalistas.isBroadDevotion,
  getBroadDevotionTitle: RegrasFundamentalistas.getBroadDevotionTitle,
  calculateBroadDevotionPmBonus: RegrasFundamentalistas.calculateBroadDevotionPmBonus,
  checkFundamentalistWeaponViolation: RegrasFundamentalistas.checkFundamentalistWeaponViolation,
  FUNDAMENTALIST_TEXTS: RegrasFundamentalistas.FUNDAMENTALIST_TEXTS,
  ELEMENTAL_FAMILIAR_OPTIONS: RegrasFamiliarElemental.ELEMENTAL_FAMILIAR_OPTIONS,
  normalizeElementalFamiliarId: RegrasFamiliarElemental.normalizeElementalFamiliarId,
  getElementalFamiliarOption: RegrasFamiliarElemental.getElementalFamiliarOption,
  formatElementalFamiliarSheetTitle: RegrasFamiliarElemental.formatElementalFamiliarSheetTitle,
  CRIACAO_DEUSES_CATALOG: RegrasCriacaoDosDeuses.CRIACAO_DEUSES_CATALOG,
  getCriacaoDeusOption: RegrasCriacaoDosDeuses.getCriacaoDeusOption,
  normalizeCriacaoDeusId: RegrasCriacaoDosDeuses.normalizeCriacaoDeusId,
  loadActiveTableRules: ForjaFeatures.loadActiveTableRules,
  saveActiveTableRules: ForjaFeatures.saveActiveTableRules,
  encodeTableRulesCode: ForjaFeatures.encodeTableRulesCode,
  decodeTableRulesCode: ForjaFeatures.decodeTableRulesCode,
  buildTableInviteUrl: ForjaFeatures.buildTableInviteUrl,
  createDefaultLevelTrainingState: ForjaFeatures.createDefaultLevelTrainingState,
  normalizeLevelTrainingState: ForjaFeatures.normalizeLevelTrainingState,
  calculateLevelTrainingBonuses: ForjaFeatures.calculateLevelTrainingBonuses,
  pages: FORJA_PAGES,
});

Object.assign(globalThis, {
  ForjaUnificada,
  ForjaFeatures,
  ForjaCalculo: criarCalculoPorOperacao(),
  sincronizarCabecalho,
  formatarReducaoDano,
  tracosCondicao,
  RegrasMochilas,
  RegrasMontarias,
  RegrasPersonagem,
  RegrasManufaturaTs,
  RecompensasT20Ts,
  RegrasMasmorrasTs,
  RegrasArmaduraMecanizada,
  RegrasArtesaoCriativo,
  RegrasCampanha,
  ExportacaoPersonagem,
  ForjaPassosDano: ModuloPassosDano,
  ForjaGolpePessoal: ModuloGolpePessoal,
  efeitosMarcas,
});
