import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './TelaLogin.module.css';

export default function TelaLogin() {
  const [modo, setModo] = useState('login'); // 'login' | 'cadastro'
  const [nome, setNome]           = useState('');
  const [email, setEmail]         = useState('');
  const [senha, setSenha]         = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro]           = useState('');
  const [sucesso, setSucesso]     = useState('');
  const [carregando, setCarregando] = useState(false);

  function limparMensagens() {
    setErro('');
    setSucesso('');
  }

  function alternarModo() {
    setModo(m => m === 'login' ? 'cadastro' : 'login');
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmar('');
    limparMensagens();
  }

  async function handleLogin(e) {
    e.preventDefault();
    limparMensagens();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro('E-mail ou senha incorretos. Tente novamente.');
    }
  }

  async function handleCadastro(e) {
    e.preventDefault();
    limparMensagens();
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    setCarregando(false);
    if (error) {
      setErro('Erro ao criar conta: ' + error.message);
    } else {
      setSucesso('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      setModo('login');
      setEmail('');
      setSenha('');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>🎮</div>
        <h1 className={styles.titulo}>JogaEduca</h1>
        <p className={styles.subtitulo}>
          {modo === 'login' ? 'Acesse sua conta de professor' : 'Crie sua conta de professor'}
        </p>

        {erro && <div className={styles.erro}>{erro}</div>}
        {sucesso && <div className={styles.sucesso}>{sucesso}</div>}

        <form
          className={styles.form}
          onSubmit={modo === 'login' ? handleLogin : handleCadastro}
        >
          {modo === 'cadastro' && (
            <div className={styles.campo}>
              <label className={styles.label}>Nome completo</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.campo}>
            <label className={styles.label}>E-mail</label>
            <input
              className={styles.input}
              type="email"
              placeholder="professor@escola.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.label}>Senha</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          {modo === 'cadastro' && (
            <div className={styles.campo}>
              <label className={styles.label}>Confirmar senha</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
              />
            </div>
          )}

          <button
            className={styles.btnEntrar}
            type="submit"
            disabled={carregando}
          >
            {carregando
              ? 'Aguarde...'
              : modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className={styles.alternar}>
          {modo === 'login' ? (
            <>
              Não tem conta?{' '}
              <button className={styles.linkBtn} onClick={alternarModo}>
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button className={styles.linkBtn} onClick={alternarModo}>
                Fazer login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
