# Guia de Integração — Frontend

Exemplos práticos para consumir a API do SGC SENAC no frontend.

## Configuração do Cliente HTTP

### Axios (recomendado)

```js
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login em 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Serviços por Domínio

### Autenticação

```js
// src/services/authService.js
import api from './api';

export const authService = {
  async login(email, senha) {
    const { data } = await api.post('/api/auth/login', { email, senha });
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    return data;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/api/auth/forgot-password', { email });
    return data;
  },

  logout() {
    localStorage.clear();
  },

  getUsuario() {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
```

### Usuários

```js
// src/services/usuarioService.js
import api from './api';

export const usuarioService = {
  criar: (dados) => api.post('/api/usuarios', dados).then(r => r.data),
  listar: (filtros = {}) => api.get('/api/usuarios', { params: filtros }).then(r => r.data),
  atualizar: (id, dados) => api.patch(`/api/usuarios/${id}`, dados).then(r => r.data),
  excluir: (id) => api.delete(`/api/usuarios/${id}`).then(r => r.data),
  resetarSenha: (id, novaSenha) => api.post(`/api/usuarios/${id}/reset-senha`, { novaSenha }).then(r => r.data),
};
```

### Cursos

```js
// src/services/cursoService.js
import api from './api';

export const cursoService = {
  criar: (dados) => api.post('/api/cursos', dados).then(r => r.data),
  listar: () => api.get('/api/cursos').then(r => r.data),
  atualizar: (id, dados) => api.patch(`/api/cursos/${id}`, dados).then(r => r.data),
  excluir: (id) => api.delete(`/api/cursos/${id}`).then(r => r.data),
};
```

### Regras

```js
// src/services/regraService.js
import api from './api';

export const regraService = {
  criar: (dados) => api.post('/api/regras', dados).then(r => r.data),
  listar: (cursoId) => api.get('/api/regras', { params: cursoId ? { curso_id: cursoId } : {} }).then(r => r.data),
  atualizar: (id, dados) => api.patch(`/api/regras/${id}`, dados).then(r => r.data),
  excluir: (id) => api.delete(`/api/regras/${id}`).then(r => r.data),
};
```

### Submissões

```js
// src/services/submissaoService.js
import api from './api';

export const submissaoService = {
  criar: (dados) => api.post('/api/submissoes', dados).then(r => r.data),
  listar: () => api.get('/api/submissoes').then(r => r.data),
  buscar: (id) => api.get(`/api/submissoes/${id}`).then(r => r.data),
  avaliar: (id, dados) => api.patch(`/api/submissoes/${id}`, dados).then(r => r.data),
  excluir: (id) => api.delete(`/api/submissoes/${id}`).then(r => r.data),
};
```

### Certificados (upload de arquivo)

```js
// src/services/certificadoService.js
import api from './api';

export const certificadoService = {
  upload: (submissaoId, arquivo) => {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('submissao_id', submissaoId);
    return api.post('/api/certificados', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  listar: (submissaoId) =>
    api.get('/api/certificados', { params: submissaoId ? { submissao_id: submissaoId } : {} })
      .then(r => r.data),
};
```

### Dashboard

```js
// src/services/dashboardService.js
import api from './api';

export const dashboardService = {
  coordenador: () => api.get('/api/dashboard/coordenador').then(r => r.data),
  aluno: () => api.get('/api/dashboard/aluno').then(r => r.data),
};
```

### Vínculos

```js
// src/services/vinculoService.js
import api from './api';

export const vinculoService = {
  vincularCoordenador: (usuario_id, curso_id) =>
    api.post('/api/coordenadores-cursos', { usuario_id, curso_id }).then(r => r.data),
  listarCoordenadores: (cursoId) =>
    api.get('/api/coordenadores-cursos', { params: cursoId ? { curso_id: cursoId } : {} }).then(r => r.data),
  removerCoordenador: (id) =>
    api.delete(`/api/coordenadores-cursos/${id}`).then(r => r.data),

  vincularAluno: (usuario_id, curso_id) =>
    api.post('/api/alunos-cursos', { usuario_id, curso_id }).then(r => r.data),
  listarAlunos: (usuarioId) =>
    api.get('/api/alunos-cursos', { params: usuarioId ? { usuario_id: usuarioId } : {} }).then(r => r.data),
  removerAluno: (id) =>
    api.delete(`/api/alunos-cursos/${id}`).then(r => r.data),
};
```

---

## Tratamento de Erros

### Composable reutilizável (Vue.js)

```js
// src/composables/useApi.js
import { ref } from 'vue';

export function useApi() {
  const loading = ref(false);
  const error = ref(null);

  async function call(fn, ...args) {
    loading.value = true;
    error.value = null;
    try {
      return await fn(...args);
    } catch (err) {
      error.value = err.response?.data?.error || err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, call };
}
```

### Hook reutilizável (React)

```js
// src/hooks/useApi.js
import { useState } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function call(fn, ...args) {
    setLoading(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, call };
}
```

### Códigos de status HTTP

| Código | Significado | Ação |
| ------ | ---------- | ---- |
| 200 | Sucesso | Exibir dados |
| 201 | Criado | Feedback de sucesso |
| 400 | Dados inválidos | Exibir mensagem de validação |
| 401 | Não autenticado | Redirecionar para login |
| 403 | Sem permissão | Exibir mensagem de acesso negado |
| 404 | Não encontrado | Exibir mensagem adequada |
| 500 | Erro interno | Exibir mensagem genérica |

---

## Fluxos de Uso

### Login e acesso ao dashboard

```js
async function login(email, senha) {
  const data = await authService.login(email, senha);
  const perfil = data.usuario.perfil;

  if (perfil === 'aluno') router.push('/dashboard/aluno');
  else if (perfil === 'coordenador') router.push('/dashboard/coordenador');
  else router.push('/dashboard/admin');
}
```

### Submissão de atividade complementar (aluno)

```js
async function submeterAtividade(dadosFormulario, arquivo) {
  // 1. Criar submissão
  const { id } = await submissaoService.criar({
    regra_id: dadosFormulario.regraId,
    tipo: dadosFormulario.tipo,
    descricao: dadosFormulario.descricao,
    carga_horaria_solicitada: dadosFormulario.cargaHoraria,
  });

  // 2. Upload do certificado
  await certificadoService.upload(id, arquivo);

  // Email automático enviado aos coordenadores pelo backend
  router.push('/minhas-submissoes');
}
```

### Avaliação de submissão (coordenador)

```js
async function avaliarSubmissao(submissaoId, status, observacao, horasAprovadas) {
  await submissaoService.avaliar(submissaoId, {
    status,          // 'aprovado' | 'reprovado' | 'correcao'
    observacao,
    horas_aprovadas: status === 'aprovado' ? horasAprovadas : undefined,
  });
  // Email automático enviado ao aluno pelo backend
}
```

### Criar usuário (admin)

```js
async function criarUsuario(dados) {
  await usuarioService.criar({
    nome: dados.nome,
    email: dados.email,
    senha: dados.senha,
    perfil: dados.perfil,   // 'super_admin' | 'coordenador' | 'aluno'
    matricula: dados.matricula || null,
    curso_id: dados.cursoId || null,
  });
  // Email com credenciais enviado automaticamente pelo backend
}
```

---

## Dados retornados pelo login

```json
{
  "token": "eyJ...",
  "refreshToken": "...",
  "usuario": {
    "uid": "abc123",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "perfil": "aluno",
    "curso_id": "curso_xyz"
  }
}
```

## Dados retornados pelo dashboard do aluno

```json
{
  "metricas": {
    "total_submissoes": 5,
    "pendentes": 1,
    "aprovadas": 3,
    "reprovadas": 1,
    "total_horas_aprovadas": 60,
    "carga_horaria_minima": 100,
    "progresso_percentual": 60,
    "horas_por_area": [
      { "area": "Extensão", "horas": 40, "limite": 60 },
      { "area": "Pesquisa", "horas": 20, "limite": 40 }
    ]
  }
}
```
