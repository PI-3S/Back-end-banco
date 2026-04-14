const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/cursos - Criar
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { nome, carga_horaria_minima } = req.body;

    if (!nome || !carga_horaria_minima) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e carga horária são obrigatórios' 
      });
    }

    const docRef = await db.collection('cursos').add({
      nome,
      carga_horaria_minima,
      criado_por_admin_id: req.usuario.uid,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'curso_criado', { 
      curso_id: docRef.id, 
      nome 
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Curso criado com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/cursos - Listar
router.get('/', verificarToken, async (req, res) => {
  try {
    const snapshot = await db.collection('cursos').get();

    const cursos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, cursos });

  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🆕 PATCH /api/cursos/:id - Atualizar
router.patch('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, carga_horaria_minima } = req.body;

    if (!nome && !carga_horaria_minima) {
      return res.status(400).json({ 
        success: false, 
        error: 'Pelo menos um campo deve ser fornecido' 
      });
    }

    const cursoRef = db.collection('cursos').doc(id);
    const cursoDoc = await cursoRef.get();

    if (!cursoDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Curso não encontrado' 
      });
    }

    const updateData = {};
    if (nome) updateData.nome = nome;
    if (carga_horaria_minima) updateData.carga_horaria_minima = carga_horaria_minima;
    updateData.atualizado_por_admin_id = req.usuario.uid;
    updateData.updated_at = new Date().toISOString();

    await cursoRef.update(updateData);

    await registrarLog(req.usuario.uid, 'curso_atualizado', {
      curso_id: id,
      ...updateData
    });

    res.status(200).json({
      success: true,
      mensagem: 'Curso atualizado com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🆕 DELETE /api/cursos/:id - Excluir
router.delete('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const cursoRef = db.collection('cursos').doc(id);
    const cursoDoc = await cursoRef.get();

    if (!cursoDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Curso não encontrado' 
      });
    }

    const cursoData = cursoDoc.data();

    // Verifica vínculos
    const alunosSnapshot = await db.collection('alunos_cursos')
      .where('curso_id', '==', id)
      .limit(1)
      .get();

    if (!alunosSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem alunos vinculados'
      });
    }

    const coordenadoresSnapshot = await db.collection('coordenadores_cursos')
      .where('curso_id', '==', id)
      .limit(1)
      .get();

    if (!coordenadoresSnapshot.empty) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir: existem coordenadores vinculados'
      });
    }

    await cursoRef.delete();

    await registrarLog(req.usuario.uid, 'curso_excluido', {
      curso_id: id,
      nome: cursoData.nome
    });

    res.status(200).json({
      success: true,
      mensagem: 'Curso excluído com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao excluir curso:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;