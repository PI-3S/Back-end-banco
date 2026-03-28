const express = require('express');
const router = express.Router();
const { db, auth } = require('../config/firebase');
const { registrarLog } = require('../services/logs');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

// PATCH /api/usuarios/:id - Atualiza usuário
router.patch('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, curso_id, matricula } = req.body;

    const usuarioDoc = await db.collection('usuarios').doc(id).get();
    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Coordenador só pode atualizar alunos
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