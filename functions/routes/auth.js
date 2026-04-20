const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const fetch = require('node-fetch');

const db = admin.firestore();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const snapshot = await db.collection('usuarios')
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Usuário não encontrado no Firestore' });
    }

    const usuario = snapshot.docs[0].data();
    const uid = snapshot.docs[0].id;

    res.status(200).json({
      success: true,
      token: data.idToken,
      refreshToken: data.refreshToken,
      usuario: {
        uid,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        curso_id: usuario.curso_id,
      },
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const snapshot = await db.collection('usuarios')
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Email não encontrado no sistema' });
    }

    const { enviarEmailResetSenha } = require('../services/email');
    const link = await admin.auth().generatePasswordResetLink(email);
    await enviarEmailResetSenha(email, link, true);

    res.status(200).json({
      success: true,
      mensagem: 'Email de recuperação enviado com sucesso!'
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;