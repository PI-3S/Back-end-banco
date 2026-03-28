const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// GET /api/dashboard/coordenador
router.get('/coordenador', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    const coordCursosSnap = await db.collection('coordenadores_cursos')
      .where('usuario_id', '==', req.usuario.uid)
      .get();

    const cursoIds = coordCursosSnap.docs.map(doc => doc.data().curso_id);

    if (cursoIds.length === 0) {
      return res.status(200).json({
        success: true,
        metricas: {
          total_submissoes: 0,
          pendentes: 0,
          aprovadas: 0,
          reprovadas: 0,
          por_area: [],
          por_curso: [],
        },
      });
    }

    const submissoesSnap = await db.collection('submissoes').get();
    const todasSubmissoes = submissoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const regrasSnap = await db.collection('regras_atividade')
      .where('curso_id', 'in', cursoIds)
      .get();

    const regras = {};
    regrasSnap.docs.forEach(doc => {
      regras[doc.id] = doc.data();
    });

    const submissoesFiltradas = todasSubmissoes.filter(s => regras[s.regra_id]);

    const pendentes = submissoesFiltradas.filter(s => s.status === 'pendente').length;
    const aprovadas = submissoesFiltradas.filter(s => s.status === 'aprovado').length;
    const reprovadas = submissoesFiltradas.filter(s => s.status === 'reprovado').length;

    const porArea = {};
    submissoesFiltradas.forEach(s => {
      const regra = regras[s.regra_id];
      if (regra) {
        if (!porArea[regra.area]) {
          porArea[regra.area] = { area: regra.area, total: 0, aprovadas: 0, pendentes: 0, reprovadas: 0 };
        }
        porArea[regra.area].total++;
        if (s.status === 'aprovado') porArea[regra.area].aprovadas++;
        if (s.status === 'pendente') porArea[regra.area].pendentes++;
        if (s.status === 'reprovado') porArea[regra.area].reprovadas++;
      }
    });

    const porCurso = {};
    for (const cursoId of cursoIds) {
      const cursoDoc = await db.collection('cursos').doc(cursoId).get();
      const curso = cursoDoc.data();
      const regraIds = regrasSnap.docs.filter(d => d.data().curso_id === cursoId).map(d => d.id);
      const submissoesDoCurso = submissoesFiltradas.filter(s => regraIds.includes(s.regra_id));

      porCurso[cursoId] = {
        curso: curso.nome,
        total: submissoesDoCurso.length,
        aprovadas: submissoesDoCurso.filter(s => s.status === 'aprovado').length,
        pendentes: submissoesDoCurso.filter(s => s.status === 'pendente').length,
        reprovadas: submissoesDoCurso.filter(s => s.status === 'reprovado').length,
      };
    }

    res.status(200).json({
      success: true,
      metricas: {
        total_submissoes: submissoesFiltradas.length,
        pendentes,
        aprovadas,
        reprovadas,
        por_area: Object.values(porArea),
        por_curso: Object.values(porCurso),
      },
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/dashboard/aluno
router.get('/aluno', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    const submissoesSnap = await db.collection('submissoes')
      .where('aluno_id', '==', req.usuario.uid)
      .get();

    const submissoes = submissoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pendentes = submissoes.filter(s => s.status === 'pendente').length;
    const aprovadas = submissoes.filter(s => s.status === 'aprovado').length;
    const reprovadas = submissoes.filter(s => s.status === 'reprovado').length;

    const horasPorArea = {};
    for (const submissao of submissoes) {
      if (submissao.status === 'aprovado') {
        const regraDoc = await db.collection('regras_atividade').doc(submissao.regra_id).get();
        const regra = regraDoc.data();

        const atividadeSnap = await db.collection('atividades_complementares')
          .where('submissao_id', '==', submissao.id)
          .get();

        if (!atividadeSnap.empty) {
          const atividade = atividadeSnap.docs[0].data();
          if (!horasPorArea[regra.area]) {
            horasPorArea[regra.area] = { area: regra.area, horas: 0, limite: regra.limite_horas };
          }
          horasPorArea[regra.area].horas += atividade.carga_horaria_solicitada;
        }
      }
    }

    const totalHoras = Object.values(horasPorArea).reduce((acc, a) => acc + a.horas, 0);

    let carga_horaria_minima = 0;
    let progresso_percentual = 0;

    const usuarioDoc = await db.collection('usuarios').doc(req.usuario.uid).get();
    const usuario = usuarioDoc.data();

    if (usuario.curso_id) {
      const cursoDoc = await db.collection('cursos').doc(usuario.curso_id).get();
      if (cursoDoc.exists) {
        carga_horaria_minima = cursoDoc.data().carga_horaria_minima;
        progresso_percentual = Math.min(Math.round((totalHoras / carga_horaria_minima) * 100), 100);
      }
    }

    res.status(200).json({
      success: true,
      metricas: {
        total_submissoes: submissoes.length,
        pendentes,
        aprovadas,
        reprovadas,
        total_horas_aprovadas: totalHoras,
        carga_horaria_minima,
        progresso_percentual,
        horas_por_area: Object.values(horasPorArea),
      },
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;