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

    // Super Admin
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

module.exports = router;