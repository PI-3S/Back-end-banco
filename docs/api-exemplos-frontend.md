# API - Exemplos para Frontend

Guia prático com exemplos de implementação das chamadas da API no frontend.

## Índice

1. [Configuração do Cliente HTTP](#configuração-do-cliente-http)
2. [Tratamento de Erros](#tratamento-de-erros)
3. [Exemplos de Chamadas por Endpoint](#exemplos-de-chamadas-por-endpoint)
4. [Fluxos Completos](#fluxos-completos)

---

## Configuração do Cliente HTTP

### Opção 1: Usando Axios (Recomendado)

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

// Cria instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se token expirou (401), redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Opção 2: Usando Fetch

```javascript
// src/services/api.js
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // Se token expirou (401), redireciona para login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    const error = await response.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
}

export default apiCall;
```

### Uso no Vue.js

```javascript
// src/services/authService.js
import api from './api';

export const authService = {
  async login(email, senha) {
    const response = await api.post('/api/auth/login', { email, senha });
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
};
```

### Uso no React

```javascript
// src/services/authService.js
import api from './api';

export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/api/auth/login', { email, senha });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
};
```

---

## Tratamento de Erros

### Códigos de Erro Comuns

| Código | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| 200 | Sucesso | Exibir dados |
| 201 | Criado com sucesso | Exibir mensagem de sucesso |
| 400 | Requisição inválida | Exibir erro de validação |
| 401 | Não autorizado | Redirecionar para login |
| 403 | Acesso negado | Exibir mensagem de permissão |
| 404 | Não encontrado | Exibir mensagem de recurso não encontrado |

### Exemplo de Tratamento de Erros (Vue.js)

```javascript
// src/composables/useApi.js
import { ref } from 'vue';
import api from '@/services/api';

export function useApi() {
  const loading = ref(false);
  const error = ref(null);

  async function call(apiFunction, ...args) {
    loading.value = true;
    error.value = null;

    try {
      const result = await apiFunction(...args);
      return result;
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

### Exemplo de Tratamento de Erros (React)

```javascript
// src/hooks/useApi.js
import { useState } from 'react';
import api from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function call(apiFunction, ...args) {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      return result;
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

### Exemplo de Componente com Tratamento de Erros (Vue.js)

```vue
<template>
  <div>
    <button @click="handleSubmit" :disabled="loading">
      {{ loading ? 'Enviando...' : 'Enviar' }}
    </button>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="successMessage" class="success">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';
import { authService } from '@/services/authService';

const { loading, error, call } = useApi();
const successMessage = ref(null);

async function handleSubmit() {
  try {
    successMessage.value = null;
    await call(authService.login, 'usuario@exemplo.com', 'senha123');
    successMessage.value = 'Login realizado com sucesso!';
  } catch (err) {
    // Erro já tratado no useApi
  }
}
</script>

<style scoped>
.error {
  color: red;
  margin-top: 10px;
}

.success {
  color: green;
  margin-top: 10px;
}
</style>
```

### Exemplo de Componente com Tratamento de Erros (React)

```jsx
// src/components/LoginForm.jsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { authService } from '../services/authService';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const { loading, error, call } = useApi();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSuccessMessage(null);
      await call(authService.login, email, senha);
      setSuccessMessage('Login realizado com sucesso!');
    } catch (err) {
      // Erro já tratado no useApi
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Entrar'}
      </button>

      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
    </form>
  );
}

export default LoginForm;
```

---

## Exemplos de Chamadas por Endpoint

### Autenticação

#### Login

```javascript
// src/services/authService.js
import api from './api';

export const authService = {
  async login(email, senha) {
    const response = await api.post('/api/auth/login', { email, senha });
    // Salva token e dados do usuário
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
  },

  getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
```

#### Exemplo de Uso (Vue.js)

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" placeholder="Email" />
    <input v-model="senha" type="password" placeholder="Senha" />
    <button type="submit">Entrar</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/authService';

const router = useRouter();
const email = ref('');
const senha = ref('');

async function handleLogin() {
  try {
    await authService.login(email.value, senha.value);
    router.push('/dashboard');
  } catch (error) {
    alert(error.response?.data?.error || 'Erro ao fazer login');
  }
}
</script>
```

#### Exemplo de Uso (React)

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await authService.login(email, senha);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao fazer login');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit">Entrar</button>
    </form>
  );
}

export default LoginForm;
```

---

### Usuários

```javascript
// src/services/usuarioService.js
import api from './api';

export const usuarioService = {
  async criarUsuario(dados) {
    const response = await api.post('/api/usuarios', dados);
    return response.data;
  },

  async listarUsuarios(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/api/usuarios${params ? `?${params}` : ''}`);
    return response.data;
  },

  async atualizarUsuario(id, dados) {
    const response = await api.patch(`/api/usuarios/${id}`, dados);
    return response.data;
  },

  async excluirUsuario(id) {
    const response = await api.delete(`/api/usuarios/${id}`);
    return response.data;
  },

  async resetarSenha(id, novaSenha) {
    const response = await api.post(`/api/usuarios/${id}/reset-senha`, { novaSenha });
    return response.data;
  },
};
```

#### Exemplo de Listagem (Vue.js)

```vue
<template>
  <div>
    <h1>Usuários</h1>

    <div v-if="loading">Carregando...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Perfil</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="usuario in usuarios" :key="usuario.id">
          <td>{{ usuario.nome }}</td>
          <td>{{ usuario.email }}</td>
          <td>{{ usuario.perfil }}</td>
          <td>
            <button @click="editarUsuario(usuario)">Editar</button>
            <button @click="excluirUsuario(usuario.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { usuarioService } from '@/services/usuarioService';

const { loading, error, call } = useApi();
const usuarios = ref([]);

async function carregarUsuarios() {
  const result = await call(usuarioService.listarUsuarios);
  usuarios.value = result.usuarios;
}

function editarUsuario(usuario) {
  // Implementar edição
}

async function excluirUsuario(id) {
  if (confirm('Tem certeza que deseja excluir?')) {
    await call(usuarioService.excluirUsuario, id);
    await carregarUsuarios();
  }
}

onMounted(carregarUsuarios);
</script>
```

---

### Cursos

```javascript
// src/services/cursoService.js
import api from './api';

export const cursoService = {
  async criarCurso(dados) {
    const response = await api.post('/api/cursos', dados);
    return response.data;
  },

  async listarCursos() {
    const response = await api.get('/api/cursos');
    return response.data;
  },

  async atualizarCurso(id, dados) {
    const response = await api.patch(`/api/cursos/${id}`, dados);
    return response.data;
  },

  async excluirCurso(id) {
    const response = await api.delete(`/api/cursos/${id}`);
    return response.data;
  },
};
```

---

### Regras

```javascript
// src/services/regraService.js
import api from './api';

export const regraService = {
  async criarRegra(dados) {
    const response = await api.post('/api/regras', dados);
    return response.data;
  },

  async listarRegras(cursoId) {
    const params = cursoId ? `?curso_id=${cursoId}` : '';
    const response = await api.get(`/api/regras${params}`);
    return response.data;
  },

  async atualizarRegra(id, dados) {
    const response = await api.patch(`/api/regras/${id}`, dados);
    return response.data;
  },

  async excluirRegra(id) {
    const response = await api.delete(`/api/regras/${id}`);
    return response.data;
  },
};
```

---

### Submissões

```javascript
// src/services/submissaoService.js
import api from './api';

export const submissaoService = {
  async criarSubmissao(dados) {
    const response = await api.post('/api/submissoes', dados);
    return response.data;
  },

  async listarSubmissoes() {
    const response = await api.get('/api/submissoes');
    return response.data;
  },

  async buscarSubmissao(id) {
    const response = await api.get(`/api/submissoes/${id}`);
    return response.data;
  },

  async avaliarSubmissao(id, dados) {
    const response = await api.patch(`/api/submissoes/${id}`, dados);
    return response.data;
  },

  async excluirSubmissao(id) {
    const response = await api.delete(`/api/submissoes/${id}`);
    return response.data;
  },
};
```

---

### Certificados (Upload de Arquivo)

```javascript
// src/services/certificadoService.js
import api from './api';

export const certificadoService = {
  async uploadCertificado(submissaoId, arquivo) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('submissao_id', submissaoId);

    const response = await api.post('/api/certificados', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async listarCertificados(submissaoId) {
    const params = submissaoId ? `?submissao_id=${submissaoId}` : '';
    const response = await api.get(`/api/certificados${params}`);
    return response.data;
  },
};
```

#### Exemplo de Upload (Vue.js)

```vue
<template>
  <div>
    <input
      type="file"
      @change="handleFileChange"
      accept=".pdf,.jpg,.jpeg,.png,.webp"
    />

    <button
      @click="uploadCertificado"
      :disabled="!arquivo || loading"
    >
      {{ loading ? 'Enviando...' : 'Enviar Certificado' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="certificado" class="success">
      Certificado enviado com sucesso!
      <a :href="certificado.url_arquivo" target="_blank">Ver arquivo</a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@/composables/useApi';
import { certificadoService } from '@/services/certificadoService';

const { loading, error, call } = useApi();
const arquivo = ref(null);
const certificado = ref(null);

function handleFileChange(e) {
  arquivo.value = e.target.files[0];
}

async function uploadCertificado() {
  try {
    const result = await call(
      certificadoService.uploadCertificado,
      'submissao123',
      arquivo.value
    );
    certificado.value = result;
  } catch (err) {
    // Erro já tratado no useApi
  }
}
</script>
```

#### Exemplo de Upload (React)

```jsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { certificadoService } from '../services/certificadoService';

function CertificadoUpload({ submissaoId }) {
  const [arquivo, setArquivo] = useState(null);
  const [certificado, setCertificado] = useState(null);
  const { loading, error, call } = useApi();

  function handleFileChange(e) {
    setArquivo(e.target.files[0]);
  }

  async function handleUpload() {
    try {
      const result = await call(
        certificadoService.uploadCertificado,
        submissaoId,
        arquivo
      );
      setCertificado(result);
    } catch (err) {
      // Erro já tratado no useApi
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
      />

      <button
        onClick={handleUpload}
        disabled={!arquivo || loading}
      >
        {loading ? 'Enviando...' : 'Enviar Certificado'}
      </button>

      {error && <div className="error">{error}</div>}

      {certificado && (
        <div className="success">
          Certificado enviado com sucesso!
          <a href={certificado.url_arquivo} target="_blank" rel="noopener noreferrer">
            Ver arquivo
          </a>
        </div>
      )}
    </div>
  );
}

export default CertificadoUpload;
```

---

### Vínculos

```javascript
// src/services/vinculoService.js
import api from './api';

export const vinculoService = {
  // Coordenador-Curso
  async vincularCoordenadorCurso(usuarioId, cursoId) {
    const response = await api.post('/api/coordenadores-cursos', {
      usuario_id: usuarioId,
      curso_id: cursoId,
    });
    return response.data;
  },

  async listarCoordenadoresCursos(cursoId) {
    const params = cursoId ? `?curso_id=${cursoId}` : '';
    const response = await api.get(`/api/coordenadores-cursos${params}`);
    return response.data;
  },

  async removerCoordenadorCurso(id) {
    const response = await api.delete(`/api/coordenadores-cursos/${id}`);
    return response.data;
  },

  // Aluno-Curso
  async vincularAlunoCurso(usuarioId, cursoId) {
    const response = await api.post('/api/alunos-cursos', {
      usuario_id: usuarioId,
      curso_id: cursoId,
    });
    return response.data;
  },

  async listarAlunosCursos(usuarioId) {
    const params = usuarioId ? `?usuario_id=${usuarioId}` : '';
    const response = await api.get(`/api/alunos-cursos${params}`);
    return response.data;
  },

  async removerAlunoCurso(id) {
    const response = await api.delete(`/api/alunos-cursos/${id}`);
    return response.data;
  },
};
```

---

### Dashboard

```javascript
// src/services/dashboardService.js
import api from './api';

export const dashboardService = {
  async getDashboardCoordenador() {
    const response = await api.get('/api/dashboard/coordenador');
    return response.data;
  },

  async getDashboardAluno() {
    const response = await api.get('/api/dashboard/aluno');
    return response.data;
  },
};
```

#### Exemplo de Dashboard (Vue.js)

```vue
<template>
  <div>
    <h1>Dashboard</h1>

    <div v-if="loading">Carregando...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="metricas">
      <div class="cards">
        <div class="card">
          <h3>Total de Submissões</h3>
          <p class="number">{{ metricas.total_submissoes }}</p>
        </div>

        <div class="card">
          <h3>Pendentes</h3>
          <p class="number pending">{{ metricas.pendentes }}</p>
        </div>

        <div class="card">
          <h3>Aprovadas</h3>
          <p class="number approved">{{ metricas.aprovadas }}</p>
        </div>

        <div class="card">
          <h3>Reprovadas</h3>
          <p class="number rejected">{{ metricas.reprovadas }}</p>
        </div>
      </div>

      <!-- Para aluno -->
      <div v-if="isAluno" class="progress">
        <h3>Progresso</h3>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: metricas.progresso_percentual + '%' }"
          >
            {{ metricas.progresso_percentual }}%
          </div>
        </div>
        <p>
          {{ metricas.total_horas_aprovadas }}h de {{ metricas.carga_horaria_minima }}h
        </p>
      </div>

      <!-- Por área -->
      <div class="by-area">
        <h3>Por Área</h3>
        <div v-for="area in metricas.horas_por_area" :key="area.area" class="area-item">
          <span>{{ area.area }}</span>
          <span>{{ area.horas }}h / {{ area.limite }}h</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { dashboardService } from '@/services/dashboardService';
import { authService } from '@/services/authService';

const { loading, error, call } = useApi();
const metricas = ref(null);

const usuario = computed(() => authService.getUsuario());
const isAluno = computed(() => usuario.value?.perfil === 'aluno');

async function carregarDashboard() {
  const service = isAluno.value
    ? dashboardService.getDashboardAluno
    : dashboardService.getDashboardCoordenador;

  const result = await call(service);
  metricas.value = result.metricas;
}

onMounted(carregarDashboard);
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  padding: 20px;
  border-radius: 8px;
  background: #f5f5f5;
}

.number {
  font-size: 32px;
  font-weight: bold;
}

.number.pending { color: #f59e0b; }
.number.approved { color: #10b981; }
.number.rejected { color: #ef4444; }

.progress-bar {
  height: 30px;
  background: #e5e7eb;
  border-radius: 15px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.by-area {
  margin-top: 30px;
}

.area-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
}
</style>
```

---

### Configurações

```javascript
// src/services/configuracaoService.js
import api from './api';

export const configuracaoService = {
  async buscarConfiguracao(id) {
    const response = await api.get(`/api/configuracoes/${id}`);
    return response.data;
  },

  async salvarConfiguracao(id, dados) {
    const response = await api.post(`/api/configuracoes/${id}`, dados);
    return response.data;
  },

  async enviarEmailTeste(email) {
    const response = await api.post('/api/configuracoes/test-email', { to: email });
    return response.data;
  },
};
```

---

## Fluxos Completos

### Fluxo 1: Login e Acesso ao Dashboard

```javascript
// 1. Usuário faz login
async function fazerLogin() {
  try {
    const resultado = await authService.login('aluno@exemplo.com', 'senha123');

    // Resultado contém:
    // - token: JWT para autenticação
    // - refreshToken: Token para renovar sessão
    // - usuario: { uid, nome, email, perfil, curso_id }

    // Redirecionar para dashboard apropriado
    if (resultado.usuario.perfil === 'aluno') {
      router.push('/dashboard/aluno');
    } else if (resultado.usuario.perfil === 'coordenador') {
      router.push('/dashboard/coordenador');
    } else {
      router.push('/dashboard/admin');
    }
  } catch (error) {
    alert('Email ou senha inválidos');
  }
}

// 2. Carregar dashboard do aluno
async function carregarDashboardAluno() {
  try {
    const resultado = await dashboardService.getDashboardAluno();

    // Resultado contém:
    // - total_submissoes: número total de submissões
    // - pendentes: submissões aguardando avaliação
    // - aprovadas: submissões aprovadas
    // - reprovadas: submissões reprovadas
    // - total_horas_aprovadas: total de horas computadas
    // - carga_horaria_minima: horas necessárias para conclusão
    // - progresso_percentual: progresso em porcentagem
    // - horas_por_area: array com horas por área de atividade

    return resultado.metricas;
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
  }
}
```

---

### Fluxo 2: Submissão de Atividade Complementar pelo Aluno

```javascript
// 1. Carregar regras disponíveis para o curso do aluno
async function carregarRegras() {
  const usuario = authService.getUsuario();

  if (!usuario.curso_id) {
    alert('Você não está vinculado a nenhum curso');
    return [];
  }

  try {
    const resultado = await regraService.listarRegras(usuario.curso_id);
    return resultado.regras;
  } catch (error) {
    alert('Erro ao carregar regras');
    return [];
  }
}

// 2. Criar submissão
async function criarSubmissao(dados) {
  try {
    const resultado = await submissaoService.criarSubmissao({
      regra_id: dados.regraId,
      tipo: dados.tipo,
      descricao: dados.descricao,
      carga_horaria_solicitada: dados.cargaHoraria,
    });

    // Resultado contém:
    // - id: ID da submissão criada
    // - mensagem: "Submissão criada com sucesso!"

    // Email é enviado automaticamente para os coordenadores

    return resultado.id;
  } catch (error) {
    const mensagem = error.response?.data?.error || 'Erro ao criar submissão';
    alert(mensagem);
    throw error;
  }
}

// 3. Upload do certificado
async function uploadCertificado(submissaoId, arquivo) {
  try {
    const resultado = await certificadoService.uploadCertificado(
      submissaoId,
      arquivo
    );

    // Resultado contém:
    // - id: ID do certificado
    // - url_arquivo: URL pública do arquivo
    // - texto_extraido: Texto extraído via OCR (se aplicável)
    // - mensagem: "Certificado enviado com sucesso!"

    return resultado;
  } catch (error) {
    const mensagem = error.response?.data?.error || 'Erro ao fazer upload';
    alert(mensagem);
    throw error;
  }
}

// 4. Fluxo completo (Vue.js)
async function fluxoCompletoSubmissao(dadosFormulario, arquivoCertificado) {
  try {
    // Passo 1: Criar submissão
    const submissaoId = await criarSubmissao(dadosFormulario);

    // Passo 2: Upload do certificado
    await uploadCertificado(submissaoId, arquivoCertificado);

    // Passo 3: Sucesso!
    alert('Submissão enviada com sucesso! Aguarde a avaliação do coordenador.');

    // Passo 4: Redirecionar ou atualizar lista
    router.push('/minhas-submissoes');
  } catch (error) {
    // Erro já tratado nas funções acima
  }
}
```

---

### Fluxo 3: Avaliação de Submissão pelo Coordenador

```javascript
// 1. Carregar submissões pendentes
async function carregarSubmissoesPendentes() {
  try {
    const resultado = await submissaoService.listarSubmissoes();

    // Filtrar apenas pendentes
    const pendentes = resultado.submissoes.filter(
      s => s.status === 'pendente'
    );

    return pendentes;
  } catch (error) {
    alert('Erro ao carregar submissões');
    return [];
  }
}

// 2. Buscar detalhes de uma submissão
async function buscarDetalhesSubmissao(submissaoId) {
  try {
    const resultado = await submissaoService.buscarSubmissao(submissaoId);

    // Resultado contém todos os dados da submissão

    // Buscar certificado associado
    const certificados = await certificadoService.listarCertificados(submissaoId);
    const certificado = certificados.certificados[0];

    return {
      submissao: resultado.submissao,
      certificado,
    };
  } catch (error) {
    alert('Erro ao buscar detalhes');
    return null;
  }
}

// 3. Avaliar submissão
async function avaliarSubmissao(submissaoId, avaliacao) {
  try {
    const resultado = await submissaoService.avalizarSubmissao(submissaoId, {
      status: avaliacao.status, // 'aprovado', 'reprovado' ou 'correcao'
      observacao: avaliacao.observacao,
      horas_aprovadas: avaliacao.status === 'aprovado'
        ? avaliacao.horasAprovadas
        : undefined,
    });

    // Email é enviado automaticamente para o aluno (exceto se status for 'correcao')

    alert('Submissão avaliada com sucesso!');
    return resultado;
  } catch (error) {
    const mensagem = error.response?.data?.error || 'Erro ao avaliar';
    alert(mensagem);
    throw error;
  }
}

// 4. Fluxo completo (Vue.js)
async function fluxoCompletoAvaliacao(submissaoId, dadosAvaliacao) {
  try {
    // Passo 1: Buscar detalhes
    const detalhes = await buscarDetalhesSubmissao(submissaoId);

    // Passo 2: Exibir detalhes para o coordenador
    // (implementação de UI)

    // Passo 3: Coletar avaliação
    const avaliacao = {
      status: dadosAvaliacao.status,
      observacao: dadosAvaliacao.observacao,
      horasAprovadas: dadosAvaliacao.horasAprovadas,
    };

    // Passo 4: Enviar avaliação
    await avaliarSubmissao(submissaoId, avaliacao);

    // Passo 5: Atualizar lista
    await carregarSubmissoesPendentes();
  } catch (error) {
    // Erro já tratado
  }
}
```

---

### Fluxo 4: Criação de Usuário pelo Administrador

```javascript
// 1. Carregar cursos disponíveis
async function carregarCursos() {
  try {
    const resultado = await cursoService.listarCursos();
    return resultado.cursos;
  } catch (error) {
    alert('Erro ao carregar cursos');
    return [];
  }
}

// 2. Criar usuário
async function criarUsuario(dados) {
  try {
    const resultado = await usuarioService.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha, // Senha gerada ou fornecida
      perfil: dados.perfil, // 'super_admin', 'coordenador' ou 'aluno'
      matricula: dados.matricula || null,
      curso_id: dados.cursoId || null,
    });

    // Resultado contém:
    // - uid: ID do usuário criado
    // - mensagem: "Usuário criado com sucesso! As credenciais foram enviadas por email."
    // - emailEnviado: true

    // Email com credenciais é enviado automaticamente

    alert('Usuário criado com sucesso! Email enviado.');
    return resultado;
  } catch (error) {
    const mensagem = error.response?.data?.error || 'Erro ao criar usuário';
    alert(mensagem);
    throw error;
  }
}

// 3. Fluxo completo (Vue.js)
async function fluxoCompletoCriarUsuario(dadosFormulario) {
  try {
    // Passo 1: Validar dados
    if (!dadosFormulario.nome || !dadosFormulario.email || !dadosFormulario.perfil) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Passo 2: Gerar senha se não fornecida
    const senha = dadosFormulario.senha || gerarSenhaAleatoria();

    // Passo 3: Criar usuário
    await criarUsuario({
      ...dadosFormulario,
      senha,
    });

    // Passo 4: Atualizar lista de usuários
    await carregarUsuarios();
  } catch (error) {
    // Erro já tratado
  }
}

function gerarSenhaAleatoria() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let senha = '';
  for (let i = 0; i < 12; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return senha;
}
```

---

### Fluxo 5: Recuperação de Senha

```javascript
// 1. Solicitar recuperação de senha
async function solicitarRecuperacaoSenha(email) {
  try {
    const resultado = await authService.forgotPassword(email);

    // Resultado contém:
    // - mensagem: "Email de recuperação enviado com sucesso!"

    alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
    return resultado;
  } catch (error) {
    const mensagem = error.response?.data?.error || 'Erro ao solicitar recuperação';
    alert(mensagem);
    throw error;
  }
}

// 2. Redefinir senha (usando Firebase SDK no frontend)
async function redefinirSenha(novaSenha, oobCode) {
  try {
    // Usar Firebase Auth SDK para redefinir senha
    await auth.confirmPasswordReset(oobCode, novaSenha);

    alert('Senha redefinida com sucesso! Faça login com sua nova senha.');
    router.push('/login');
  } catch (error) {
    alert('Erro ao redefinir senha. O link pode ter expirado.');
  }
}

// 3. Fluxo completo (Vue.js)
async function fluxoRecuperacaoSenha(email) {
  try {
    // Passo 1: Solicitar recuperação
    await solicitarRecuperacaoSenha(email);

    // Passo 2: Redirecionar para página de confirmação
    router.push('/recuperacao-enviada');
  } catch (error) {
    // Erro já tratado
  }
}
```

---

## Dicas Adicionais

### 1. Armazenamento Seguro de Token

```javascript
// Usar httpOnly cookies é mais seguro que localStorage
// Se possível, configure o backend para usar cookies

// Alternativa: sessionStorage (limpa ao fechar navegador)
sessionStorage.setItem('token', token);

// Ou localStorage (persiste entre sessões)
localStorage.setItem('token', token);
```

### 2. Refresh de Token

```javascript
// Implementar refresh automático de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await api.post('/api/auth/refresh', {
          refreshToken,
        });

        const newToken = response.data.token;
        localStorage.setItem('token', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 3. Cancelamento de Requisições

```javascript
// Cancelar requisições pendentes ao desmontar componente
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    const source = axios.CancelToken.source();

    async function loadData() {
      try {
        const response = await api.get('/api/usuarios', {
          cancelToken: source.token,
        });
        // Processar dados
      } catch (error) {
        if (!axios.isCancel(error)) {
          // Tratar erro real
        }
      }
    }

    loadData();

    return () => {
      source.cancel('Componente desmontado');
    };
  }, []);
}
```

### 4. Paginação

```javascript
// Implementar paginação nas listagens
async function listarUsuariosPaginados(pagina = 1, porPagina = 10) {
  try {
    const response = await api.get('/api/usuarios', {
      params: {
        pagina,
        por_pagina: porPagina,
      },
    });

    return {
      dados: response.data.usuarios,
      total: response.data.total,
      pagina: response.data.pagina,
      totalPaginas: response.data.total_paginas,
    };
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return null;
  }
}
```

### 5. Filtros e Busca

```javascript
// Implementar filtros dinâmicos
async function buscarUsuarios(filtros) {
  const params = new URLSearchParams();

  if (filtros.perfil) params.append('perfil', filtros.perfil);
  if (filtros.curso_id) params.append('curso_id', filtros.curso_id);
  if (filtros.busca) params.append('busca', filtros.busca);

  try {
    const response = await api.get(`/api/usuarios?${params}`);
    return response.data.usuarios;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}
```

---

## Conclusão

Este guia fornece exemplos completos para implementar todas as funcionalidades da API no frontend. Para dúvidas adicionais, consulte a documentação específica de cada endpoint na pasta `docs/`.