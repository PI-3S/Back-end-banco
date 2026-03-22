const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('./config/firebase');
const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});