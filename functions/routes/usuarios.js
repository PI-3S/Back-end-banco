const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

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

// PATCH /api/usuarios/:id
router.patch('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, curso_id, matricula } = req.body;

    const usuarioDoc = await db.collection('usuarios').doc(id).get();
    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (req.usuario.perfil === 'coordenador') {
      const usuarioAtualizar = usuarioDoc.data();
      if (usuarioAtualizar.perfil !== 'aluno') {
        return res.status(403).json({ error: 'Coordenador só pode atualizar alunos' });
      }
    }

    const dadosAtualizados = {};
    if (nome) dadosAtualizados.nome = nome;
    if (curso_id) dadosAtualizados.curso_id = curso_id;
    if (matricula) dadosAtualizados.matricula = matricula;

    await db.collection('usuarios').doc(id).update(dadosAtualizados);

    await registrarLog(req.usuario.uid, 'usuario_atualizado', { usuario_id: id });

    res.status(200).json({
      success: true,
      mensagem: 'Usuário atualizado com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;