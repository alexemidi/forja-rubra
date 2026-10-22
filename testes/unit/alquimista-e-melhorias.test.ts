import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularFormulasAlquimistaIniciado,
  podeFabricarPocaoOuPergaminho
} from '../../src/lib/t20/alquimista-iniciado.ts';

test('Alquimista Iniciado: Fórmulas concedidas e escalonamento de círculos', () => {
  // Nível 1: 3 fórmulas de 1º círculo
  const lv1 = calcularFormulasAlquimistaIniciado(1, false);
  assert.equal(lv1.totalFormulas, 3);
  assert.equal(lv1.maxCircle, 1);

  // Nível 3: 3 + 2 = 5 fórmulas, ainda 1º círculo
  const lv3 = calcularFormulasAlquimistaIniciado(3, false);
  assert.equal(lv3.totalFormulas, 5);
  assert.equal(lv3.maxCircle, 1);

  // Nível 6: 3 + 5 = 8 fórmulas, 2º círculo desbloqueado
  const lv6 = calcularFormulasAlquimistaIniciado(6, false);
  assert.equal(lv6.totalFormulas, 8);
  assert.equal(lv6.maxCircle, 2);

  // Nível 10 sem Mestre Alquimista: 3 + 9 = 12 fórmulas, continua no 2º círculo
  const lv10SemMestre = calcularFormulasAlquimistaIniciado(10, false);
  assert.equal(lv10SemMestre.totalFormulas, 12);
  assert.equal(lv10SemMestre.maxCircle, 2);

  // Nível 10 com Mestre Alquimista: 3º círculo
  const lv10ComMestre = calcularFormulasAlquimistaIniciado(10, true);
  assert.equal(lv10ComMestre.totalFormulas, 12);
  assert.equal(lv10ComMestre.maxCircle, 3);

  // Nível 14 com Mestre Alquimista: 4º círculo
  const lv14ComMestre = calcularFormulasAlquimistaIniciado(14, true);
  assert.equal(lv14ComMestre.totalFormulas, 16);
  assert.equal(lv14ComMestre.maxCircle, 4);

  // Nível 18 com Mestre Alquimista: 5º círculo
  const lv18ComMestre = calcularFormulasAlquimistaIniciado(18, true);
  assert.equal(lv18ComMestre.totalFormulas, 20);
  assert.equal(lv18ComMestre.maxCircle, 5);
});

test('Restrição de Poções e Pergaminhos: somente magias conhecidas pelo personagem', () => {
  const magiasConhecidas = ['curar_ferimentos', 'bola_de_fogo', 'escudo_da_fe'];

  // Magias que o personagem conhece devem ser permitidas
  assert.equal(podeFabricarPocaoOuPergaminho('curar_ferimentos', magiasConhecidas), true);
  assert.equal(podeFabricarPocaoOuPergaminho('Curar Ferimentos', magiasConhecidas), true);
  assert.equal(podeFabricarPocaoOuPergaminho('bola-de-fogo', magiasConhecidas), true);
  assert.equal(podeFabricarPocaoOuPergaminho('Escudo da Fé', magiasConhecidas), true);

  // Magias desconhecidas pelo personagem devem ser estritamente bloqueadas
  assert.equal(podeFabricarPocaoOuPergaminho('relampago', magiasConhecidas), false);
  assert.equal(podeFabricarPocaoOuPergaminho('invisibilidade', magiasConhecidas), false);
  assert.equal(podeFabricarPocaoOuPergaminho('desejo', magiasConhecidas), false);

  // Personagem sem nenhuma magia conhecida não pode fabricar nada
  assert.equal(podeFabricarPocaoOuPergaminho('curar_ferimentos', []), false);
  assert.equal(podeFabricarPocaoOuPergaminho('', magiasConhecidas), false);
});
