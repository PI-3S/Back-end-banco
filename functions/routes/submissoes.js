const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// POST /api/submissoes - Aluno cria submissão
router.post('/', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    const { regra_id, tipo, descricao, carga_horaria_solicitada } = req.body;

    if (!regra_id || !tipo || !carga_horaria_solicitada) {
      return res.status(400).json({ error: 'regra_id, tipo e carga_horaria_solicitada são obrigatórios' });
    }

    const submissaoRef = await db.collection('submissoes').add({
      aluno_id: req.usuario.uid,
      coordenador_id: null,
      regra_id,
      status: 'pendente',
      data_envio: new Date().toISOString(),
    });

    await db.collection('atividades_complementares').add({
      submissao_id: submissaoRef.id,
      tipo,
      descricao: descricao || null,
      carga_horaria_solicitada,
    });

    res.status(201).json({
      success: true,
      id: submissaoRef.id,
      mensagem: 'Submissão criada com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/submissoes - Lista submissões
router.get('/', verificarToken, async (req, res) => {
  try {
    let query = db.collection('submissoes');

    if (req.usuario.perfil === 'aluno') {
      query = query.where('aluno_id', '==', req.usuario.uid);
    }

    const snapshot = await query.get();

    const submissoes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, submissoes });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/submissoes/:id - Coordenador valida ou reprova
router.patch('/:id', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['aprovado', 'reprovado'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser aprovado ou reprovado' });
    }

    await db.collection('submissoes').doc(id).update({
      status,
      coordenador_id: req.usuario.uid,
      data_validacao: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      mensagem: `Submissão ${status} com sucesso!`,
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;