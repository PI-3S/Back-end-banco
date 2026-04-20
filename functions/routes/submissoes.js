const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { enviarEmailCoordenador, enviarEmailAluno } = require('../services/email');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// Função auxiliar para buscar dados complementares de submissões antigas
async function enrichSubmissoes(submissoes) {
  // Identifica submissões que precisam de dados complementares
  const needsEnrichment = submissoes.filter(s =>
    s.carga_horaria_solicitada === undefined || s.tipo === undefined
  );

  if (needsEnrichment.length === 0) {
    return submissoes; // Todas já têm os dados
  }

  // Busca atividades complementares de uma vez
  const submissaoIds = needsEnrichment.map(s => s.id);
  const atividadesSnap = await db.collection('atividades_complementares')
    .where('submissao_id', 'in', submissaoIds.slice(0, 10)) // Firestore limita 10 itens em 'in'
    .get();

  // Se tiver mais de 10, busca em batches
  let allAtividades = [...atividadesSnap.docs];

  if (submissaoIds.length > 10) {
    for (let i = 10; i < submissaoIds.length; i += 10) {
      const batchIds = submissaoIds.slice(i, i + 10);
      const batchSnap = await db.collection('atividades_complementares')
        .where('submissao_id', 'in', batchIds)
        .get();
      allAtividades = [...allAtividades, ...batchSnap.docs];
    }
  }

  // Cria mapa de submissao_id -> dados da atividade
  const atividadesMap = {};
  allAtividades.forEach(doc => {
    const data = doc.data();
    atividadesMap[data.submissao_id] = data;
  });

  // Enriquece as submissões
  return submissoes.map(s => {
    const atividade = atividadesMap[s.id];
    return {
      ...s,
      carga_horaria_solicitada: s.carga_horaria_solicitada ?? atividade?.carga_horaria_solicitada ?? null,
      tipo: s.tipo || atividade?.tipo || null,
      descricao: s.descricao ?? atividade?.descricao ?? null,
    };
  });
}

// POST /api/submissoes
router.post('/', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    const { regra_id, tipo, descricao, carga_horaria_solicitada } = req.body;

    if (!regra_id || !tipo || !carga_horaria_solicitada) {
      return res.status(400).json({ error: 'regra_id, tipo e carga_horaria_solicitada são obrigatórios' });
    }

    const regraDoc = await db.collection('regras_atividade').doc(regra_id).get();
    if (!regraDoc.exists) {
      return res.status(400).json({ error: 'Regra não encontrada' });
    }

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

    // Cria a submissão com todos os dados
    const submissaoRef = await db.collection('submissoes').add({
      aluno_id: req.usuario.uid,
      coordenador_id: null,
      regra_id,
      tipo,
      descricao: descricao || null,
      carga_horaria_solicitada,
      status: 'pendente',
      data_envio: new Date().toISOString(),
    });

    // Mantém também na collection de atividades_complementares para retrocompatibilidade
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
        if (coordUsuario.exists && coordUsuario.data().email) {
          const coordEmail = coordUsuario.data().email;
          await enviarEmailCoordenador(coordEmail, req.usuario.nome);
        }
      }
    }

    await registrarLog(req.usuario.uid, 'submissao_criada', { submissao_id: submissaoRef.id });

    res.status(201).json({
      success: true,
      id: submissaoRef.id,
      mensagem: 'Submissão criada com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao criar submissão:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/submissoes
router.get('/', verificarToken, async (req, res) => {
  try {
    let submissoes = [];

    if (req.usuario.perfil === 'aluno') {
      const snapshot = await db.collection('submissoes')
        .where('aluno_id', '==', req.usuario.uid)
        .get();
      submissoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else if (req.usuario.perfil === 'coordenador') {
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
      // super_admin busca todas
      const snapshot = await db.collection('submissoes').get();
      submissoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Enriquece submissões antigas com dados de atividades_complementares
    submissoes = await enrichSubmissoes(submissoes);

    res.status(200).json({ success: true, submissoes });

  } catch (error) {
    console.error('Erro ao buscar submissões:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/submissoes/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('submissoes').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Submissão não encontrada' });
    }

    let submissao = { id: doc.id, ...doc.data() };

    // Enriquece se necessário
    if (submissao.carga_horaria_solicitada === undefined || submissao.tipo === undefined) {
      const enriched = await enrichSubmissoes([submissao]);
      submissao = enriched[0];
    }

    res.status(200).json({ success: true, submissao });

  } catch (error) {
    console.error('Erro ao buscar submissão:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/submissoes/:id
router.patch('/:id', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacao, horas_aprovadas } = req.body;

    if (!['aprovado', 'reprovado', 'correcao'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser aprovado, reprovado ou correcao' });
    }

    const updateData = {
      status,
      coordenador_id: req.usuario.uid,
      data_validacao: new Date().toISOString(),
      observacao: observacao || null,
    };

    // Se aprovar e enviar horas_aprovadas, salva também
    if (status === 'aprovado' && horas_aprovadas) {
      updateData.horas_aprovadas = horas_aprovadas;
    }

    await db.collection('submissoes').doc(id).update(updateData);

    const submissaoDoc = await db.collection('submissoes').doc(id).get();
    const alunoDoc = await db.collection('usuarios').doc(submissaoDoc.data().aluno_id).get();

    if (alunoDoc.exists) {
      const aluno = alunoDoc.data();
      if (status !== 'correcao' && aluno.email) {
        await enviarEmailAluno(aluno.email, aluno.nome, status);
      }
    }

    await registrarLog(req.usuario.uid, `submissao_${status}`, { submissao_id: id });

    res.status(200).json({
      success: true,
      mensagem: `Submissão ${status} com sucesso!`,
    });

  } catch (error) {
    console.error('Erro ao atualizar submissão:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/submissoes/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const submissaoDoc = await db.collection('submissoes').doc(id).get();

    if (!submissaoDoc.exists) {
      return res.status(404).json({ error: 'Submissão não encontrada' });
    }

    const submissao = submissaoDoc.data();

    // Aluno só pode deletar submissões pendentes ou em correção
    if (req.usuario.perfil === 'aluno') {
      if (submissao.aluno_id !== req.usuario.uid) {
        return res.status(403).json({ error: 'Você não tem permissão para deletar esta submissão' });
      }
      if (!['pendente', 'correcao'].includes(submissao.status)) {
        return res.status(400).json({ error: 'Só é possível deletar submissões pendentes ou em correção' });
      }
    }

    // Deleta atividades_complementares relacionadas
    const atividadesSnap = await db.collection('atividades_complementares')
      .where('submissao_id', '==', id)
      .get();

    const batch = db.batch();
    atividadesSnap.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(submissaoDoc.ref);
    await batch.commit();

    await registrarLog(req.usuario.uid, 'submissao_deletada', { submissao_id: id });

    res.status(200).json({
      success: true,
      mensagem: 'Submissão deletada com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao deletar submissão:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;