const express = require('express');
const cors = require('cors');

// Só carrega o dotenv se NÃO estiver em produção (Vercel)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {
    console.log("Dotenv não encontrado, pulando...");
  }
}

// Importação das Rotas (Verifique se os nomes dos arquivos batem com os 'requires')
const usuariosRoutes = require('./routes/usuarios');
const cursosRoutes = require('./routes/cursos');
const regrasRoutes = require('./routes/regras');
const submissoesRoutes = require('./routes/submissoes');
const certificadosRoutes = require('./routes/certificados');
const coordenadoresCursosRoutes = require('./routes/coordenadores_cursos');
const dashboardRoutes = require('./routes/dashboard');
const alunosCursosRoutes = require('./routes/alunos_cursos');

const app = express();

// Configurações Globais
app.use(cors());
app.use(express.json());

// Rota Raiz (Teste rápido)
app.get('/', (req, res) => {
  res.json({ message: 'API Maestria funcionando!' });
});

// Registro das Rotas (Mantendo seus caminhos originais)
app.use('/api/alunos-cursos', alunosCursosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/regras', regrasRoutes);
app.use('/api/submissoes', submissoesRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/coordenadores-cursos', coordenadoresCursosRoutes);

// Execução Local (Vercel ignora o listen e usa o export)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

// Exportação obrigatória para o Vercel funcionar
module.exports = app;