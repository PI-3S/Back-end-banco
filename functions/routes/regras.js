const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/regras
router.post('/', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    // Suporta tanto o formato antigo quanto o novo
    const {
      // Formato antigo (compatibilidade)
      area,
      limite_horas,
      exige_comprovante,
      // Formato novo
      nome,
      categoria,
      descricao,
      horas_maximas,
      requisitos_obrigatorios,
      tipo_documento,
      observacoes,
      ativo,
      curso_id,
    } = req.body;

    if (!curso_id) {
      return res.status(400).json({ error: 'curso_id é obrigatório' });
    }

    // Verifica se o coordenador tem acesso ao curso
    if (req.usuario.perfil === 'coordenador') {
      const coordCursoSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .where('curso_id', '==', curso_id)
        .get();

      if (coordCursoSnap.empty) {
        return res.status(403).json({ error: 'Você não tem permissão para gerenciar regras deste curso' });
      }
    }

    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    // Se for formato novo, usa os campos novos
    const isNovoFormato = nome && categoria;

    const docRef = await db.collection('regras_atividade').add({
      // Campos do formato novo
      nome: nome || area,
      categoria: categoria || 'ensino',
      descricao: descricao || '',
      horas_maximas: horas_maximas || limite_horas || 10,
      requisitos_obrigatorios: requisitos_obrigatorios || '',
      tipo_documento: tipo_documento || 'pdf_imagem',
      observacoes: observacoes || '',
      ativo: ativo !== undefined ? ativo : true,
      // Campos do formato antigo (compatibilidade)
      area: area || categoria || nome,
      limite_horas: limite_horas || horas_maximas || 10,
      exige_comprovante: exige_comprovante !== undefined ? exige_comprovante : true,
      // Campos comuns
      curso_id,
      curso_nome: cursoDoc.data().nome,
      criado_por: req.usuario.uid,
      criado_por_perfil: req.usuario.perfil,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'regra_criada', {
      regra_id: docRef.id,
      nome: nome || area,
      curso_id
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Regra criada com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao criar regra:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/regras
router.get('/', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;

    let query = db.collection('regras_atividade');

    if (curso_id) {
      query = query.where('curso_id', '==', curso_id);
    }

    const snapshot = await query.get();

    const regras = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let cursoNome = data.curso_nome;

      // Se não tiver nome do curso, busca
      if (!cursoNome && data.curso_id) {
        const cursoDoc = await db.collection('cursos').doc(data.curso_id).get();
        if (cursoDoc.exists) {
          cursoNome = cursoDoc.data().nome;
        }
      }

      return {
        id: doc.id,
        ...data,
        curso_nome: cursoNome || '—',
      };
    }));

    res.status(200).json({ success: true, regras });

  } catch (error) {
    console.error('Erro ao buscar regras:', error);
    res.status(400).json({ error: error.message });
  }
});

// 🆕 PATCH /api/regras/:id - Atualizar regra
router.patch('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;

    const regraRef = db.collection('regras_atividade').doc(id);
    const regraDoc = await regraRef.get();

    if (!regraDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Regra não encontrada'
      });
    }

    const regraData = regraDoc.data();

    // Se for coordenador, verifica se tem acesso ao curso da regra
    if (req.usuario.perfil === 'coordenador') {
      const cursoId = req.body.curso_id || regraData.curso_id;
      const coordCursoSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .where('curso_id', '==', cursoId)
        .get();

      if (coordCursoSnap.empty) {
        return res.status(403).json({ error: 'Você não tem permissão para gerenciar regras deste curso' });
      }
    }

    const updateData = {};

    // Campos do formato novo
    if (req.body.nome !== undefined) updateData.nome = req.body.nome;
    if (req.body.categoria !== undefined) updateData.categoria = req.body.categoria;
    if (req.body.descricao !== undefined) updateData.descricao = req.body.descricao;
    if (req.body.horas_maximas !== undefined) updateData.horas_maximas = req.body.horas_maximas;
    if (req.body.requisitos_obrigatorios !== undefined) updateData.requisitos_obrigatorios = req.body.requisitos_obrigatorios;
    if (req.body.tipo_documento !== undefined) updateData.tipo_documento = req.body.tipo_documento;
    if (req.body.observacoes !== undefined) updateData.observacoes = req.body.observacoes;
    if (req.body.ativo !== undefined) updateData.ativo = req.body.ativo;

    // Campos do formato antigo (compatibilidade)
    if (req.body.area !== undefined) updateData.area = req.body.area;
    if (req.body.limite_horas !== undefined) updateData.limite_horas = req.body.limite_horas;
    if (req.body.exige_comprovante !== undefined) updateData.exige_comprovante = req.body.exige_comprovante;
    if (req.body.curso_id !== undefined) updateData.curso_id = req.body.curso_id;

    // Se mudou o curso, atualiza o nome do curso
    if (req.body.curso_id) {
      const cursoDoc = await db.collection('cursos').doc(req.body.curso_id).get();
      if (cursoDoc.exists) {
        updateData.curso_nome = cursoDoc.data().nome;
      }
    }

    updateData.atualizado_por = req.usuario.uid;
    updateData.atualizado_por_perfil = req.usuario.perfil;
    updateData.updated_at = new Date().toISOString();

    await regraRef.update(updateData);

    await registrarLog(req.usuario.uid, 'regra_atualizada', {
      regra_id: id,
      ...updateData
    });

    res.status(200).json({
      success: true,
      mensagem: 'Regra atualizada com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao atualizar regra:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 🆕 DELETE /api/regras/:id - Excluir regra
router.delete('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;

    const regraRef = db.collection('regras_atividade').doc(id);
    const regraDoc = await regraRef.get();

    if (!regraDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Regra não encontrada'
      });
    }

    const regraData = regraDoc.data();

    // Se for coordenador, verifica se tem acesso ao curso da regra
    if (req.usuario.perfil === 'coordenador') {
      const coordCursoSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .where('curso_id', '==', regraData.curso_id)
        .get();

      if (coordCursoSnap.empty) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir regras deste curso' });
      }
    }

    // Verifica se há submissões usando esta regra
    const submissoesSnapshot = await db.collection('submissoes')
      .where('regra_id', '==', id)
      .limit(1)
      .get();

    if (!submissoesSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem submissões vinculadas a esta regra'
      });
    }

    await regraRef.delete();

    await registrarLog(req.usuario.uid, 'regra_excluida', {
      regra_id: id,
      nome: regraData.nome || regraData.area,
      curso_id: regraData.curso_id
    });

    res.status(200).json({
      success: true,
      mensagem: 'Regra excluída com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao excluir regra:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;