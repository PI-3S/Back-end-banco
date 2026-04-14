const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/regras
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { area, limite_horas, exige_comprovante, curso_id } = req.body;

    if (!area || !limite_horas || !curso_id) {
      return res.status(400).json({ error: 'area, limite_horas e curso_id são obrigatórios' });
    }

    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    const regraDuplicada = await db.collection('regras_atividade')
      .where('curso_id', '==', curso_id)
      .where('area', '==', area)
      .get();

    if (!regraDuplicada.empty) {
      return res.status(400).json({ error: 'Já existe uma regra para essa área nesse curso' });
    }

    const docRef = await db.collection('regras_atividade').add({
      area,
      limite_horas,
      exige_comprovante: exige_comprovante || false,
      curso_id,
      criado_por_admin_id: req.usuario.uid,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'regra_criada', {
      regra_id: docRef.id,
      area,
      curso_id
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Regra criada com sucesso!',
    });

  } catch (error) {
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

    const regras = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, regras });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🆕 PATCH /api/regras/:id - Atualizar regra
router.patch('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { area, limite_horas, exige_comprovante, curso_id } = req.body;

    const regraRef = db.collection('regras_atividade').doc(id);
    const regraDoc = await regraRef.get();

    if (!regraDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Regra não encontrada' 
      });
    }

    // Se estiver mudando curso_id ou area, verifica duplicidade
    if (curso_id || area) {
      const novoCursoId = curso_id || regraDoc.data().curso_id;
      const novaArea = area || regraDoc.data().area;
      
      const regraDuplicada = await db.collection('regras_atividade')
        .where('curso_id', '==', novoCursoId)
        .where('area', '==', novaArea)
        .get();

      if (!regraDuplicada.empty) {
        const duplicada = regraDuplicada.docs[0];
        if (duplicada.id !== id) {
          return res.status(400).json({ 
            success: false,
            error: 'Já existe uma regra para essa área nesse curso' 
          });
        }
      }
    }

    const updateData = {};
    if (area) updateData.area = area;
    if (limite_horas !== undefined) updateData.limite_horas = limite_horas;
    if (exige_comprovante !== undefined) updateData.exige_comprovante = exige_comprovante;
    if (curso_id) updateData.curso_id = curso_id;
    updateData.atualizado_por_admin_id = req.usuario.uid;
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
router.delete('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
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
      area: regraData.area,
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