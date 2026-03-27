const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('./config/firebase');

const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const cursosRoutes = require('./routes/cursos');
const regrasRoutes = require('./routes/regras');
const submisoesRoutes = require('./routes/submissoes');
const certificadosRoutes = require('./routes/certificados');


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
app.use('/api/submissoes', submisoesRoutes);
app.use('/api/certificados', certificadosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});