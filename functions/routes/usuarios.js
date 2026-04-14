const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');
const { enviarCredenciaisAcesso } = require('../services/email');

const db = admin.firestore();
const auth = admin.auth();

// POST /api/usuarios
router.post('/', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { nome, email, senha, perfil, matricula, curso_id } = req.body;

    const perfisValidos = ['super_admin', 'coordenador', 'aluno'];
    if (!perfisValidos.includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    const userRecord = await auth.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    await db.collection('usuarios').doc(userRecord.uid).set({
      nome,
      email,
      perfil,
      matricula: matricula || null,
      curso_id: curso_id || null,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'usuario_criado', { usuario_id: userRecord.uid, perfil });

    // 🆕 Enviar email com as credenciais
    try {
      await enviarCredenciaisAcesso(email, nome, senha, perfil);
      console.log(`✅ Email de credenciais enviado para ${email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      // Não falha a criação do usuário se o email falhar
    }

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      mensagem: 'Usuário criado com sucesso! As credenciais foram enviadas por email.',
      emailEnviado: true
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/usuarios/:id
router.patch('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, curso_id, matricula } = req.body;

    const usuarioDoc = await db.collection('usuarios').doc(id).get();
    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (req.usuario.perfil === 'coordenador') {
      if (usuarioDoc.data().perfil !== 'aluno') {
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

// GET /api/usuarios
router.get('/', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { perfil, curso_id } = req.query;

    if (req.usuario.perfil === 'coordenador') {
      const coordCursosSnap = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', req.usuario.uid)
        .get();

      const cursoIds = coordCursosSnap.docs.map(doc => doc.data().curso_id);

      if (cursoIds.length === 0) {
        return res.status(200).json({ success: true, usuarios: [] });
      }

      const alunosCursosSnap = await db.collection('alunos_cursos')
        .where('curso_id', 'in', cursoIds)
        .get();

      const alunoIds = alunosCursosSnap.docs.map(doc => doc.data().usuario_id);

      if (alunoIds.length === 0) {
        return res.status(200).json({ success: true, usuarios: [] });
      }

      const usuarios = [];
      for (const alunoId of alunoIds) {
        const alunoDoc = await db.collection('usuarios').doc(alunoId).get();
        if (alunoDoc.exists) {
          usuarios.push({ id: alunoDoc.id, ...alunoDoc.data() });
        }
      }

      return res.status(200).json({ success: true, usuarios });
    }

    let query = db.collection('usuarios');
    if (perfil) query = query.where('perfil', '==', perfil);

    if (curso_id) {
      const alunosCursosSnap = await db.collection('alunos_cursos')
        .where('curso_id', '==', curso_id)
        .get();

      const alunoIds = alunosCursosSnap.docs.map(doc => doc.data().usuario_id);

      const usuarios = [];
      for (const alunoId of alunoIds) {
        const alunoDoc = await db.collection('usuarios').doc(alunoId).get();
        if (alunoDoc.exists) {
          usuarios.push({ id: alunoDoc.id, ...alunoDoc.data() });
        }
      }

      return res.status(200).json({ success: true, usuarios });
    }

    const snapshot = await query.get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, usuarios });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🆕 DELETE /api/usuarios/:id - Excluir usuário
router.delete('/:id', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioLogado = req.usuario;

    // Verifica se o usuário existe no Firestore
    const usuarioRef = db.collection('usuarios').doc(id);
    const usuarioDoc = await usuarioRef.get();

    if (!usuarioDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    const usuarioData = usuarioDoc.data();

    // Coordenador só pode excluir alunos do seu curso
    if (usuarioLogado.perfil === 'coordenador') {
      if (usuarioData.perfil !== 'aluno') {
        return res.status(403).json({
          success: false,
          error: 'Coordenadores só podem excluir alunos'
        });
      }
      
      // Verifica se o aluno é do curso do coordenador
      const coordCursos = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', usuarioLogado.uid)
        .get();
      
      const cursosDoCoord = coordCursos.docs.map(d => d.data().curso_id);
      
      if (!cursosDoCoord.includes(usuarioData.curso_id)) {
        return res.status(403).json({
          success: false,
          error: 'Você só pode excluir alunos do seu curso'
        });
      }
    }

    // Não permite excluir o último super_admin
    if (usuarioData.perfil === 'super_admin') {
      const superAdmins = await db.collection('usuarios')
        .where('perfil', '==', 'super_admin')
        .get();
      
      if (superAdmins.size <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Não é possível excluir o último super_admin do sistema'
        });
      }
    }

    // Se for aluno, remove vínculos de alunos_cursos primeiro
    if (usuarioData.perfil === 'aluno') {
      const vinculosAluno = await db.collection('alunos_cursos')
        .where('usuario_id', '==', id)
        .get();
      
      const batch = db.batch();
      vinculosAluno.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Se for coordenador, remove vínculos de coordenadores_cursos
    if (usuarioData.perfil === 'coordenador') {
      const vinculosCoord = await db.collection('coordenadores_cursos')
        .where('usuario_id', '==', id)
        .get();
      
      const batch = db.batch();
      vinculosCoord.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Exclui o usuário do Firestore
    await usuarioRef.delete();

    // Exclui o usuário do Firebase Auth
    try {
      await auth.deleteUser(id);
    } catch (authError) {
      console.warn('Erro ao excluir usuário do Auth:', authError.message);
    }

    await registrarLog(usuarioLogado.uid, 'usuario_excluido', {
      usuario_id: id,
      nome: usuarioData.nome,
      perfil: usuarioData.perfil
    });

    res.status(200).json({
      success: true,
      mensagem: 'Usuário excluído com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;