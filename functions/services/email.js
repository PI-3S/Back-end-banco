const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Cache da configuração e do transporter
let transporter = null;
let configCache = null;
let lastFetch = 0;
const CACHE_TTL = 300000; // 5 minutos em milissegundos

/**
 * Busca as configurações de email do Firestore
 * Com cache de 5 minutos para evitar muitas leituras
 */
async function getEmailConfig() {
  const now = Date.now();
  
  // Retorna do cache se ainda for válido
  if (configCache && (now - lastFetch) < CACHE_TTL) {
    return configCache;
  }
  
  try {
    const db = admin.firestore();
    const configDoc = await db.collection('configuracoes').doc('email_config').get();
    
    if (!configDoc.exists) {
      console.error('❌ Configuração de email não encontrada no Firestore!');
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: `SGC SENAC <${process.env.EMAIL_USER}>`,
        ativo: true
      };
    }
    
    configCache = configDoc.data();
    lastFetch = now;
    
    console.log('✅ Configuração de email carregada do Firestore');
    return configCache;
    
  } catch (error) {
    console.error('❌ Erro ao buscar configuração de email:', error);
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: `SGC SENAC <${process.env.EMAIL_USER}>`,
      ativo: true
    };
  }
}

/**
 * Cria ou retorna o transporter de email
 */
async function getTransporter() {
  const config = await getEmailConfig();
  
  if (config.ativo === false) {
    console.warn('⚠️ Envio de emails está DESATIVADO nas configurações');
    return null;
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    
    console.log('✅ Transporter de email criado com sucesso');
  }
  
  return transporter;
}

/**
 * Limpa o cache de configuração (útil após atualizações)
 */
function clearEmailConfigCache() {
  configCache = null;
  transporter = null;
  lastFetch = 0;
  console.log('🔄 Cache de configuração de email limpo');
}

/**
 * Envia email para o coordenador quando um aluno faz uma submissão
 */
const enviarEmailCoordenador = async (emailCoordenador, nomeAluno) => {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.warn('⚠️ Email não enviado: transporter indisponível');
      return;
    }
    
    const config = await getEmailConfig();
    
    await transporter.sendMail({
      from: config.from,
      to: emailCoordenador,
      subject: 'Nova submissão de atividade complementar',
      html: `
        <h2>Nova submissão recebida!</h2>
        <p>O aluno <strong>${nomeAluno}</strong> enviou uma nova solicitação de atividade complementar.</p>
        <p>Acesse o sistema para validar.</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">${config.from}</p>
      `,
    });
    
    console.log(`✅ Email enviado para coordenador: ${emailCoordenador}`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar email para coordenador:', error);
  }
};

/**
 * Envia email para o aluno quando sua submissão é avaliada
 */
const enviarEmailAluno = async (emailAluno, nomeAluno, status) => {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.warn('⚠️ Email não enviado: transporter indisponível');
      return;
    }
    
    const config = await getEmailConfig();
    const aprovado = status === 'aprovado';
    
    await transporter.sendMail({
      from: config.from,
      to: emailAluno,
      subject: `Sua submissão foi ${status}`,
      html: `
        <h2>Atualização da sua submissão</h2>
        <p>Olá, <strong>${nomeAluno}</strong>!</p>
        <p>Sua atividade complementar foi <strong>${aprovado ? '✅ aprovada' : '❌ reprovada'}</strong>.</p>
        <p>Acesse o sistema para mais detalhes.</p>
        <hr>
        <p style="color: #718096; font-size: 12px;">${config.from}</p>
      `,
    });
    
    console.log(`✅ Email enviado para aluno: ${emailAluno} (status: ${status})`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar email para aluno:', error);
  }
};

/**
 * Envia credenciais de acesso para novos usuários
 */
const enviarCredenciaisAcesso = async (email, nome, senha, perfil) => {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.warn('⚠️ Email não enviado: transporter indisponível');
      return;
    }
    
    const config = await getEmailConfig();
    
    const perfilFormatado = perfil === 'super_admin' ? 'Super Administrador' : 
                            perfil === 'coordenador' ? 'Coordenador' : 'Aluno';
    
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    try {
      const db = admin.firestore();
      const sistemaDoc = await db.collection('configuracoes').doc('sistema_config').get();
      if (sistemaDoc.exists && sistemaDoc.data().frontend_url) {
        frontendUrl = sistemaDoc.data().frontend_url;
      }
    } catch (e) {
      // Usa o fallback do .env
    }
    
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: 'Suas credenciais de acesso - SGC SENAC',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d3748;">Bem-vindo ao SGC SENAC, ${nome}!</h2>
          
          <p>Suas credenciais de acesso ao <strong>Sistema de Gestão de Certificados (SGC)</strong> foram criadas com sucesso!</p>
          
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>📧 Email:</strong> ${email}</p>
            <p style="margin: 10px 0;"><strong>🔐 Senha:</strong> <code style="background: #edf2f7; padding: 4px 8px; border-radius: 4px;">${senha}</code></p>
            <p style="margin: 10px 0;"><strong>👤 Perfil:</strong> ${perfilFormatado}</p>
          </div>
          
          <p>
            <a href="${frontendUrl}" 
               style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Acessar o Sistema
            </a>
          </p>
          
          <p style="margin-top: 20px;">
            <small>🌐 Link de acesso: ${frontendUrl}</small>
          </p>
          
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
          
          <p style="color: #e53e3e;">
            <strong>⚠️ Importante:</strong> Recomendamos que você troque sua senha no primeiro acesso por segurança.
          </p>
          
          <p style="color: #718096; font-size: 14px;">
            Atenciosamente,<br>
            <strong>Equipe SENAC</strong>
          </p>
        </div>
      `,
    });
    
    console.log(`✅ Email de credenciais enviado para: ${email} (perfil: ${perfil})`);
    
  } catch (error) {
    console.error('❌ Erro ao enviar credenciais de acesso:', error);
  }
};

/**
 * Envia email de reset de senha
 * isLink=true: envia link de recuperação (forgot-password)
 * isLink=false: notifica que admin resetou a senha
 */
const enviarEmailResetSenha = async (email, linkOuNull, isLink = false) => {
  try {
    const transporter = await getTransporter();
    
    if (!transporter) {
      console.warn('⚠️ Email não enviado: transporter indisponível');
      return;
    }
    
    const config = await getEmailConfig();

    const html = isLink ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Recuperação de Senha - SGC SENAC</h2>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <p>
          <a href="${linkOuNull}" 
             style="background-color: #3182ce; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Redefinir Senha
          </a>
        </p>
        <p style="color: #718096; font-size: 12px;">
          Se você não solicitou a recuperação, ignore este email.
        </p>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">
          Atenciosamente,<br><strong>Equipe SENAC</strong>
        </p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Sua senha foi redefinida - SGC SENAC</h2>
        <p>Olá! Sua senha foi redefinida pelo administrador do sistema.</p>
        <p>Acesse o sistema e troque sua senha no próximo login.</p>
        <hr style="border: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">
          Atenciosamente,<br><strong>Equipe SENAC</strong>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: isLink ? 'Recuperação de senha - SGC SENAC' : 'Sua senha foi redefinida - SGC SENAC',
      html,
    });

    console.log(`✅ Email de reset enviado para: ${email}`);

  } catch (error) {
    console.error('❌ Erro ao enviar email de reset:', error);
  }
};

module.exports = { 
  enviarEmailCoordenador, 
  enviarEmailAluno,
  enviarCredenciaisAcesso,
  enviarEmailResetSenha,
  clearEmailConfigCache
};