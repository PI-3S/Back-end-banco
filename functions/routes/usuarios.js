const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

const db = admin.firestore();
const auth = admin.auth();

// POST /api/usuarios
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil, matricula, curso_id } = req.body;

    // Valida perfil
    const perfisValidos = ['super_admin', 'coordenador', 'aluno'];
    if (!perfisValidos.includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    // Cria usuário no Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    // Salva no Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      nome,
      email,
      perfil,
      matricula: matricula || null,
      curso_id: curso_id || null,
      created_at: new Date().toISOString(),
    });

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