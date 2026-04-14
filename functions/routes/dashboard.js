const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// GET /api/dashboard/coordenador
router.get('/coordenador', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    let cursoIds = [];
    
    // 🆕 Diferencia Super Admin de Coordenador
    if (req.usuario.perfil === 'super_admin') {
      // Super Admin vê TODOS os cursos
      const cursosSnap = await db.collection('cursos').get();
      cursoIds = cursosSnap.docs.map(doc => doc.id);
      console.log(`📊 Super Admin - ${cursoIds.length} cursos encontrados`);
    } else {
      // Coordenador vê apenas os cursos que coordena
      const coordCursosSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .get();
      cursoIds = coordCursosSnap.docs.map(doc => doc.data().curso_id);
      console.log(`📊 Coordenador - ${cursoIds.length} cursos coordenados`);
    }

    // Se não tem cursos, retorna vazio
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

    // Busca todas as regras dos cursos
    const regrasSnap = await db.collection('regras_atividade')
      .where('curso_id', 'in', cursoIds)
      .get();

    const regras = {};
    const regraIds = [];
    regrasSnap.docs.forEach(doc => {
      regras[doc.id] = doc.data();
      regraIds.push(doc.id);
    });

    // Se não tem regras, retorna vazio
    if (regraIds.length === 0) {
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

    // Busca submissões dessas regras
    const submissoesSnap = await db.collection('submissoes')
      .where('regra_id', 'in', regraIds)
      .get();
    
    const submissoesFiltradas = submissoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Total de submissões encontradas: ${submissoesFiltradas.length}`);

    // Calcula métricas básicas
    const pendentes = submissoesFiltradas.filter(s => s.status === 'pendente').length;
    const aprovadas = submissoesFiltradas.filter(s => s.status === 'aprovado').length;
    const reprovadas = submissoesFiltradas.filter(s => s.status === 'reprovado').length;

    // Agrupa por área
    const porArea = {};
    submissoesFiltradas.forEach(s => {
      const regra = regras[s.regra_id];
      if (regra) {
        const area = regra.area || 'Sem área';
        if (!porArea[area]) {
          porArea[area] = { area, total: 0, aprovadas: 0, pendentes: 0, reprovadas: 0 };
        }
        porArea[area].total++;
        if (s.status === 'aprovado') porArea[area].aprovadas++;
        if (s.status === 'pendente') porArea[area].pendentes++;
        if (s.status === 'reprovado') porArea[area].reprovadas++;
      }
    });

    // Agrupa por curso
    const porCurso = {};
    
    // Busca todos os cursos para ter os nomes
    const cursosSnap = await db.collection('cursos').get();
    const cursosMap = {};
    cursosSnap.docs.forEach(doc => {
      cursosMap[doc.id] = doc.data().nome;
    });

    for (const cursoId of cursoIds) {
      const nomeCurso = cursosMap[cursoId] || 'Curso sem nome';
      
      // Filtra regras deste curso
      const regrasDoCurso = regrasSnap.docs
        .filter(d => d.data().curso_id === cursoId)
        .map(d => d.id);
      
      // Filtra submissões deste curso
      const submissoesDoCurso = submissoesFiltradas.filter(s => regrasDoCurso.includes(s.regra_id));
      
      porCurso[cursoId] = {
        curso: nomeCurso,
        total: submissoesDoCurso.length,
        aprovadas: submissoesDoCurso.filter(s => s.status === 'aprovado').length,
        pendentes: submissoesDoCurso.filter(s => s.status === 'pendente').length,
        reprovadas: submissoesDoCurso.filter(s => s.status === 'reprovado').length,
      };
    }

    // Retorna as métricas
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
    console.error('❌ Erro no dashboard coordenador:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/dashboard/aluno
router.get('/aluno', verificarToken, verificarPerfil('aluno'), async (req, res) => {
  try {
    // Busca todas as submissões do aluno
    const submissoesSnap = await db.collection('submissoes')
      .where('aluno_id', '==', req.usuario.uid)
      .get();

    const submissoes = submissoesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcula totais por status
    const pendentes = submissoes.filter(s => s.status === 'pendente').length;
    const aprovadas = submissoes.filter(s => s.status === 'aprovado').length;
    const reprovadas = submissoes.filter(s => s.status === 'reprovado').length;

    // Calcula horas por área (apenas aprovadas)
    const horasPorArea = {};
    
    for (const submissao of submissoes) {
      if (submissao.status === 'aprovado') {
        // Busca a regra
        const regraDoc = await db.collection('regras_atividade').doc(submissao.regra_id).get();
        const regra = regraDoc.data();
        
        if (!regra) continue;

        // Busca a atividade complementar
        const atividadeSnap = await db.collection('atividades_complementares')
          .where('submissao_id', '==', submissao.id)
          .limit(1)
          .get();

        if (!atividadeSnap.empty) {
          const atividade = atividadeSnap.docs[0].data();
          const area = regra.area || 'Sem área';
          
          if (!horasPorArea[area]) {
            horasPorArea[area] = { 
              area, 
              horas: 0, 
              limite: regra.limite_horas || 0 
            };
          }
          horasPorArea[area].horas += atividade.carga_horaria_solicitada || 0;
        }
      }
    }

    // Calcula total de horas aprovadas
    const totalHoras = Object.values(horasPorArea).reduce((acc, a) => acc + a.horas, 0);

    // Busca informações do curso do aluno
    let carga_horaria_minima = 0;
    let progresso_percentual = 0;

    const usuarioDoc = await db.collection('usuarios').doc(req.usuario.uid).get();
    const usuario = usuarioDoc.data();

    if (usuario.curso_id) {
      const cursoDoc = await db.collection('cursos').doc(usuario.curso_id).get();
      if (cursoDoc.exists) {
        carga_horaria_minima = cursoDoc.data().carga_horaria_minima || 0;
        if (carga_horaria_minima > 0) {
          progresso_percentual = Math.min(Math.round((totalHoras / carga_horaria_minima) * 100), 100);
        }
      }
    }

    // Retorna as métricas do aluno
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
    console.error('❌ Erro no dashboard aluno:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;