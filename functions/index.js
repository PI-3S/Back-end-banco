const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('./config/firebase');

const configuracoesRoutes = require('./routes/configuracoes');
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const cursosRoutes = require('./routes/cursos');
const regrasRoutes = require('./routes/regras');
const submissoesRoutes = require('./routes/submissoes');
const certificadosRoutes = require('./routes/certificados');
const coordenadoresCursosRoutes = require('./routes/coordenadores_cursos');
const alunosCursosRoutes = require('./routes/alunos_cursos');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/regras', regrasRoutes);
app.use('/api/submissoes', submissoesRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/coordenadores-cursos', coordenadoresCursosRoutes);
app.use('/api/alunos-cursos', alunosCursosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/configuracoes', configuracoesRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});