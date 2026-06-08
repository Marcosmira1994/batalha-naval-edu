import { supabase } from './supabase'

// Buscar todas as listas do professor logado
export async function buscarListas() {
  const { data, error } = await supabase
    .from('listas_questoes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

// Criar nova lista
export async function criarLista(nome, disciplina, serie) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('listas_questoes')
    .insert({ nome, disciplina, serie, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

// Apagar lista e suas questões
export async function apagarLista(listaId) {
  const { error } = await supabase
    .from('listas_questoes')
    .delete()
    .eq('id', listaId)
  if (error) throw error
}

// Buscar questões de uma lista
export async function buscarQuestoes(listaId) {
  const { data, error } = await supabase
    .from('questoes')
    .select('*')
    .eq('lista_id', listaId)
    .order('criado_em', { ascending: true })
  if (error) throw error
  return data
}

// Salvar questão em uma lista
export async function salvarQuestao(listaId, questao) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('questoes')
    .insert({
      lista_id: listaId,
      user_id: user.id,
      enunciado: questao.enunciado,
      tipo: questao.tipo === 'vf' ? 'verdadeiro_falso' : 'multipla',
      alternativas: questao.alternativas,
      resposta_correta: String(questao.correta),
      dificuldade: questao.dificuldade
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Apagar questão
export async function apagarQuestao(questaoId) {
  const { error } = await supabase
    .from('questoes')
    .delete()
    .eq('id', questaoId)
  if (error) throw error
}

// Contar questões de uma lista
export async function contarQuestoes(listaId) {
  const { count, error } = await supabase
    .from('questoes')
    .select('*', { count: 'exact', head: true })
    .eq('lista_id', listaId)
  if (error) throw error
  return count
}
