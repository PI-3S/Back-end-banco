# Serviços - logs.js

## Descrição

Serviço responsável pelo registro de logs de ações no sistema.

## Funcionalidades

### registrarLog(usuarioId, acao, dados)

Registra uma ação no sistema na coleção de logs.

**Parâmetros:**
- `usuarioId` - ID do usuário que realizou a ação
- `acao` - Tipo de ação realizada (ex: "usuario_criado", "submissao_aprovado")
- `dados` - Objeto com dados adicionais sobre a ação

**Exemplo de Uso:**
```javascript
await registrarLog(req.usuario.uid, 'usuario_criado', { 
  usuario_id: userRecord.uid, 
  perfil 
});
```

**Estrutura do Log:**
```javascript
{
  usuario_id: "abc123",
  acao: "usuario_criado",
  dados: { usuario_id: "def456", perfil: "aluno" },
  timestamp: new Date().toISOString()
}
```

## Ações Comuns

### Usuários
- `usuario_criado` - Usuário criado
- `usuario_atualizado` - Usuário atualizado
- `usuario_excluido` - Usuário excluído
- `senha_resetada` - Senha resetada

### Cursos
- `curso_criado` - Curso criado
- `curso_atualizado` - Curso atualizado
- `curso_excluido` - Curso excluído

### Regras
- `regra_criada` - Regra criada
- `regra_atualizada` - Regra atualizada
- `regra_excluida` - Regra excluída

### Submissões
- `submissao_criada` - Submissão criada
- `submissao_aprovado` - Submissão aprovada
- `submissao_reprovado` - Submissão reprovada
- `submissao_correcao` - Submissão enviada para correção
- `submissao_deletada` - Submissão deletada

### Vínculos
- `vinculo_coordenador_criado` - Vínculo coordenador-curso criado
- `vinculo_coordenador_removido` - Vínculo coordenador-curso removido
- `aluno_vinculado_curso` - Aluno vinculado ao curso

## Observações

- Logs são armazenados na coleção `logs` do Firestore
- Timestamp é gerado automaticamente
- Útil para auditoria e rastreamento de ações