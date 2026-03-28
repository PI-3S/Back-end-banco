const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { enviarEmailCoordenador, enviarEmailAluno } = require('../services/email');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/submissoes - Aluno cria submissão
router.post('/', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    const { regra_id, tipo, descricao, carga_horaria_solicitada } = req.body;

    if (!regra_id || !tipo || !carga_horaria_solicitada) {
      return res.status(400).json({ error: 'regra_id, tipo e carga_horaria_solicitada são obrigatórios' });
    }

    // Verifica se regra existe
    const regraDoc = await db.collection('regras_atividade').doc(regra_id).get();
    if (!regraDoc.exists) {
      return res.status(400).json({ error: 'Regra não encontrada' });
    }

    // Verifica submissão duplicada
    const submissaoDuplicada = await db.collection('submissoes')
      .where('aluno_id', '==', req.usuario.uid)
      .where('regra_id', '==', regra_id)
      .where('status', 'in', ['pendente', 'aprovado'])
      .get();

    if (!submissaoDuplicada.empty) {
      return res.status(400).json({ error: 'Você já possui uma submissão pendente ou aprovada para essa regra' });
    }

    const regra = regraDoc.data();

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

    if (!coordSnap.empty) {
      for (const coordDoc of coordSnap.docs) {
        const coordData = coordDoc.data();
        const coordUsuario = await db.collection('usuarios').doc(coordData.usuario_id).get();
        const coordEmail = coordUsuario.data().email;
        await enviarEmailCoordenador(coordEmail, req.usuario.nome);
      }
    }

    await registrarLog(req.usuario.uid, 'submissao_criada', { submissao_id: submissaoRef.id });

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
    let submissoes = [];

    if (req.usuario.perfil === 'aluno') {
      // Aluno vê só suas submissões
      const snapshot = await db.collection('submissoes')
        .where('aluno_id', '==', req.usuario.uid)
        .get();
      submissoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.usuario.perfil === 'coordenador') {
      // Coordenador vê só submissões dos seus cursos
      const coordCursosSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .get();

      const cursoIds = coordCursosSnap.docs.map(doc => doc.data().curso_id);

      if (cursoIds.length === 0) {
        return res.status(200).json({ success: true, submissoes: [] });
      }

      const regrasSnap = await db.collection('regras_atividade')
        .where('curso_id', 'in', cursoIds)
        .get();

      const regraIds = regrasSnap.docs.map(doc => doc.id);

      const snapshot = await db.collection('submissoes').get();
      submissoes = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => regraIds.includes(s.regra_id));

    } else {
      // Super Admin vê tudo
      const snapshot = await db.collection('submissoes').get();
      submissoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

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

    const submissaoDoc = await db.collection('submissoes').doc(id).get();
    const alunoDoc = await db.collection('usuarios').doc(submissaoDoc.data().aluno_id).get();
    const aluno = alunoDoc.data();

    await enviarEmailAluno(aluno.email, aluno.nome, status);
    await registrarLog(req.usuario.uid, `submissao_${status}`, { submissao_id: id });

    res.status(200).json({
      success: true,
      mensagem: `Submissão ${status} com sucesso!`,
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;