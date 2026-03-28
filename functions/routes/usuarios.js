const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { registrarLog } = require('../services/logs');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();
const auth = admin.auth();

// POST /api/usuarios
router.post('/', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { nome, email, senha, perfil, matricula, curso_id } = req.body;

    const perfisValidos = ['super_admin', 'coordenador', 'aluno'];
    if (!perfisValidos.includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const userRecord = await auth.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    await db.collection('usuarios').doc(userRecord.uid).set({
      nome,
      email,
      perfil,
      matricula: matricula || null,
      curso_id: curso_id || null,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'usuario_criado', { usuario_id: userRecord.uid, perfil });

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      mensagem: 'Usuário criado com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;