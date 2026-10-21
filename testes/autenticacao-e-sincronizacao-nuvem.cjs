const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

console.log('=== Testes de Autenticação com Google (Supabase) e Sincronização Multi-Tenant ===');

// 1. Validação da migração SQL versionada
console.log('1. Validando migração SQL versionada...');
const sqlPath = path.join(root, 'supabase/migrations/20260925000000_init_auth_and_characters.sql');
assert(fs.existsSync(sqlPath), 'Arquivo de migração SQL versionado deve existir');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Migration deve criar a tabela profiles');
assert(sqlContent.includes('CREATE TABLE IF NOT EXISTS public.characters'), 'Migration deve criar a tabela characters');
assert(sqlContent.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY'), 'RLS deve estar habilitado para profiles');
assert(sqlContent.includes('ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY'), 'RLS deve estar habilitado para characters');
assert(sqlContent.includes('auth.uid() = user_id'), 'Políticas de RLS devem isolar estritamente por user_id');
assert(sqlContent.includes('CREATE INDEX IF NOT EXISTS idx_characters_user_id'), 'Deve conter índice em user_id');
console.log('✔ Migração SQL versionada aprovada com sucesso!');

// 2. Validação do módulo de configuração
console.log('2. Validando SupabaseConfig...');
const SupabaseConfig = require(path.join(root, 'src/compartilhado/auth/supabase-config.js'));
assert(typeof SupabaseConfig.obterConfiguracao === 'function', 'Deve expor obterConfiguracao');
assert(typeof SupabaseConfig.criarClienteSupabase === 'function', 'Deve expor criarClienteSupabase');

// Sem chaves, deve retornar cliente nulo com segurança
const clientePadrao = SupabaseConfig.criarClienteSupabase({ supabaseUrl: '', supabaseAnonKey: '' });
assert.equal(clientePadrao, null, 'Cliente sem URL/Key deve retornar null');

// Com customFactory, deve instanciar mock
let factoryChamada = false;
const mockClient = SupabaseConfig.criarClienteSupabase(
  { supabaseUrl: 'https://test.supabase.co', supabaseAnonKey: 'anon-test' },
  (url, key) => {
    factoryChamada = true;
    return { url, key, mock: true };
  }
);
assert(factoryChamada, 'Factory customizada deve ser invocada');
assert.equal(mockClient.url, 'https://test.supabase.co');
console.log('✔ SupabaseConfig validado com sucesso!');

// 3. Validação do Serviço de Autenticação
console.log('3. Validando Serviço de Autenticação (ModuloAuth)...');
const ModuloAuth = require(path.join(root, 'src/compartilhado/auth/servico-autenticacao.js'));

let signInProvider = null;
let redirectUrl = null;
let authListenerCallback = null;

const fakeSupabase = {
  auth: {
    signInWithOAuth: async ({ provider, options }) => {
      signInProvider = provider;
      redirectUrl = options.redirectTo;
      return { data: { provider, url: 'https://accounts.google.com/o/oauth2/auth' }, error: null };
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({
      data: {
        session: {
          user: { id: 'usr_123', email: 'aventureiro@arton.com', user_metadata: { full_name: 'Paladino de Khalmyr' } }
        }
      },
      error: null
    }),
    onAuthStateChange: (cb) => {
      authListenerCallback = cb;
    }
  }
};

const authService = ModuloAuth.criarServicoAutenticacao(fakeSupabase);
assert(authService, 'Serviço de autenticação deve ser instanciado');

let eventNotification = null;
let userNotification = null;
const unsubscribe = authService.aoMudarEstado((evt, usr) => {
  eventNotification = evt;
  userNotification = usr;
});

// Testar login com Google
(async () => {
  const loginRes = await authService.loginComGoogle('https://forja.app/ficha.html');
  assert.equal(signInProvider, 'google', 'Provider deve ser google');
  assert.equal(redirectUrl, 'https://forja.app/ficha.html', 'Redirect URL deve ser respeitada');
  assert(loginRes.url.includes('google.com'), 'URL de autenticação do Google deve ser retornada');

  // Testar recuperação de sessão
  const sessao = await authService.obterSessao();
  assert(sessao, 'Sessão mockada deve ser retornada');
  assert.equal(authService.obterUsuarioAtual()?.id, 'usr_123', 'Usuário atual deve ter id usr_123');
  assert.equal(authService.estaAutenticado(), true, 'estaAutenticado deve ser true');

  // Simular alteração de estado para SIGNED_OUT
  await authService.logout();
  assert.equal(authService.estaAutenticado(), false, 'estaAutenticado deve ser false após logout');
  assert.equal(eventNotification, 'SIGNED_OUT', 'Listener deve receber evento SIGNED_OUT');
  assert.equal(userNotification, null, 'User no listener deve ser null após logout');

  unsubscribe();
  console.log('✔ Serviço de Autenticação validado com sucesso!');

  // 4. Validação do Serviço de Sincronização em Nuvem (Multi-Tenant)
  console.log('4. Validando Sincronização em Nuvem...');
  const ModuloSincronizacao = require(path.join(root, 'src/compartilhado/auth/sincronizacao-nuvem.js'));

  let upsertPayload = null;
  let queryFilter = null;

  const fakeDbClient = {
    from: (table) => {
      assert.equal(table, 'characters', 'Todas as operações de ficha devem acessar a tabela characters');
      return {
        upsert: (payload, opts) => {
          upsertPayload = payload;
          return {
            select: () => ({
              single: async () => ({ data: { id: 'char_abc', ...payload }, error: null })
            })
          };
        },
        select: (cols) => ({
          order: (col, opts) => ({
            data: [{ id: 'char_abc', name: 'Herói Teste', user_id: 'usr_123' }],
            error: null
          }),
          eq: (col, val) => ({
            single: async () => ({ data: { id: val, name: 'Herói Teste' }, error: null })
          })
        }),
        delete: () => ({
          eq: (col, val) => ({ error: null })
        })
      };
    }
  };

  const sincService = ModuloSincronizacao.criarServicoSincronizacao(fakeDbClient, {
    obterUsuarioAtual: () => ({ id: 'usr_tenant_999' })
  });

  const mockState = {
    identity: {
      characterName: 'Ladino Sombrio',
      initialLevel: 3,
      classId: 'ladino',
      raceId: 'humano'
    }
  };

  // Teste de salvamento multi-tenant
  const saveRes = await sincService.salvarFichaNuvem(mockState);
  assert(saveRes.ok, 'Salvamento na nuvem deve ter sucesso');
  assert.equal(upsertPayload.user_id, 'usr_tenant_999', 'user_id deve ser o do usuário autenticado (isolamento multi-tenant)');
  assert.equal(upsertPayload.name, 'Ladino Sombrio', 'Nome do personagem deve ser preenchido');
  assert.equal(upsertPayload.level, 3, 'Nível deve ser 3');
  assert.equal(upsertPayload.class_id, 'ladino', 'Classe deve ser ladino');
  assert.deepEqual(upsertPayload.snapshot, mockState, 'Snapshot completo deve ser armazenado');

  // Teste de listagem
  const listRes = await sincService.listarFichasNuvem();
  assert(listRes.ok, 'Listagem deve ter sucesso');
  assert(Array.isArray(listRes.data), 'Resultado da listagem deve ser um array');
  assert.equal(listRes.data.length, 1);

  // Teste de usuário deslogado
  const sincServiceDeslogado = ModuloSincronizacao.criarServicoSincronizacao(fakeDbClient, {
    obterUsuarioAtual: () => null
  });
  const unauthSave = await sincServiceDeslogado.salvarFichaNuvem(mockState);
  assert.equal(unauthSave.ok, false, 'Salvamento deve falhar se não houver usuário autenticado');
  assert.equal(unauthSave.error, 'Usuário não autenticado.');

  console.log('✔ Sincronização em Nuvem Multi-Tenant validada com sucesso!');

  console.log('\n======================================================');
  console.log('🎉 SUCESSO TOTAL: Autenticação Google e Nuvem Multi-Tenant 100% Aprovadas!');
  console.log('======================================================\n');
})();
