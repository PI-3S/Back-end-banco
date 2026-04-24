# Serviços - email.js

## Descrição

Serviço responsável pelo envio de emails no sistema, utilizando Nodemailer.

## Funcionalidades

### getEmailConfig()

Busca as configurações de email do Firestore com cache de 5 minutos.

**Retorno:** Objeto com configurações de email

**Fallback:** Se não encontrar no Firestore, usa variáveis de ambiente

---

### getTransporter()

Cria ou retorna o transporter de email (Nodemailer).

**Retorno:** Instância do transporter ou null se emails estiverem desativados

---

### clearEmailConfigCache()

Limpa o cache de configuração de email.

**Uso:** Após atualizações nas configurações

---

### enviarEmailCoordenador(emailCoordenador, nomeAluno)

Envia email para o coordenador quando um aluno faz uma submissão.

**Parâmetros:**
- `emailCoordenador` - Email do coordenador
- `nomeAluno` - Nome do aluno que fez a submissão

**Template:**
- Assunto: "Nova submissão de atividade complementar"
- Corpo: Informa que o aluno enviou uma nova solicitação

---

### enviarEmailAluno(emailAluno, nomeAluno, status)

Envia email para o aluno quando sua submissão é avaliada.

**Parâmetros:**
- `emailAluno` - Email do aluno
- `nomeAluno` - Nome do aluno
- `status` - Status da avaliação ("aprovado" ou "reprovado")

**Template:**
- Assunto: "Sua submissão foi {status}"
- Corpo: Informa se foi aprovado ou reprovado

---

### enviarCredenciaisAcesso(email, nome, senha, perfil)

Envia email com credenciais de acesso para novos usuários.

**Parâmetros:**
- `email` - Email do usuário
- `nome` - Nome do usuário
- `senha` - Senha gerada
- `perfil` - Perfil do usuário ("super_admin", "coordenador" ou "aluno")

**Template:**
- Assunto: "Suas credenciais de acesso - SGC SENAC"
- Corpo: Inclui email, senha, perfil e link de acesso

**Observações:**
- Busca URL do frontend nas configurações ou usa variável de ambiente
- Recomenda troca de senha no primeiro acesso

---

### enviarEmailResetSenha(email, linkOuNull, isLink)

Envia email de reset de senha.

**Parâmetros:**
- `email` - Email do usuário
- `linkOuNull` - Link de recuperação (se isLink=true) ou null
- `isLink` - true para envio de link, false para notificação de reset por admin

**Template (isLink=true):**
- Assunto: "Recuperação de senha - SGC SENAC"
- Corpo: Inclui botão para redefinir senha

**Template (isLink=false):**
- Assunto: "Sua senha foi redefinida - SGC SENAC"
- Corpo: Informa que admin resetou a senha

## Configurações

### Variáveis de Ambiente

- `EMAIL_USER` - Email para envio (fallback)
- `EMAIL_PASS` - Senha do email (fallback)
- `FRONTEND_URL` - URL do frontend (fallback)

### Firestore

**Coleção:** `configuracoes`

**Documento:** `email_config`

**Campos:**
- `host` - Host SMTP
- `port` - Porta SMTP
- `secure` - Se usa SSL/TLS
- `user` - Usuário SMTP
- `pass` - Senha SMTP
- `from` - Remetente (formato: "Nome <email>")
- `ativo` - Se envio de emails está ativo

**Documento:** `sistema_config`

**Campos:**
- `frontend_url` - URL do frontend