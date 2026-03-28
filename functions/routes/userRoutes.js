// POST /api/usuarios - Cria um novo usuário (aluno)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { email, password, nome, curso_id, matricula } = req.body;

    // 1. Cria no Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: nome,
    });

    // 2. Salva os dados complementares no Firestore
    await db.collection('usuarios').doc(userRecord.uid).set({
      nome,
      email,
      curso_id: curso_id || null,
      matricula: matricula || null,
      perfil: 'aluno', // Define como aluno por padrão
      status: 'ativo',
      createdAt: new Date().toISOString()
    });

    // 3. (Opcional) Registra o log
    await registrarLog(req.usuario.uid, 'usuario_criado', { novo_usuario_id: userRecord.uid });

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      uid: userRecord.uid
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});