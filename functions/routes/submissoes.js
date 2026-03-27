const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { enviarEmailCoordenador, enviarEmailAluno } = require('../services/email');

const db = admin.firestore();

// POST /api/submissoes - Aluno cria submissão
router.post('/', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    const { regra_id, tipo, descricao, carga_horaria_solicitada } = req.body;

    if (!regra_id || !tipo || !carga_horaria_solicitada) {
      return res.status(400).json({ error: 'regra_id, tipo e carga_horaria_solicitada são obrigatórios' });
    }

    // Busca a regra para pegar o curso_id
    const regraDoc = await db.collection('regras_atividade').doc(regra_id).get();
    const regra = regraDoc.data();

    // Busca coordenador do curso
    const coordSnap = await db.collection('coordenadores_cursos')
      .where('curso_id', '==', regra.curso_id)
      .get();

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

    // Envia e-mail para coordenadores do curso
    if (!coordSnap.empty) {
      for (const coordDoc of coordSnap.docs) {
        const coordData = coordDoc.data();
        const coordUsuario = await db.collection('usuarios').doc(coordData.usuario_id).get();
        const coordEmail = coordUsuario.data().email;
        await enviarEmailCoordenador(coordEmail, req.usuario.nome);
      }
    }

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

    // Busca dados do aluno
    const submissaoDoc = await db.collection('submissoes').doc(id).get();
    const alunoDoc = await db.collection('usuarios').doc(submissaoDoc.data().aluno_id).get();
    const aluno = alunoDoc.data();

    // Envia e-mail para o aluno
    await enviarEmailAluno(aluno.email, aluno.nome, status);

    res.status(200).json({
      success: true,
      mensagem: `Submissão ${status} com sucesso!`,
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;