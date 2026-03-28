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

const admin = require('./services/firebase');

const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const cursosRoutes = require('./routes/cursos');
const regrasRoutes = require('./routes/regras');
const submisoesRoutes = require('./routes/submissoes');
const certificadosRoutes = require('./routes/certificados');
const coordenadoresCursosRoutes = require('./routes/coordenadores_cursos');
const dashboardRoutes = require('./routes/dashboard');
const alunosCursosRoutes = require('./routes/alunos_cursos');


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

app.use('/api/alunos-cursos', alunosCursosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/regras', regrasRoutes);
app.use('/api/submissoes', submisoesRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/coordenadores-cursos', coordenadoresCursosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});