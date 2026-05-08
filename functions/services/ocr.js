const fetch = require('node-fetch');
const FormData = require('form-data');

/**
 * Extrai campos estruturados do texto extraído pelo OCR
 * @param {string} texto - Texto extraído pelo OCR
 * @returns {Object} Objeto com campos estruturados
 */
const extrairCamposEstruturados = (texto) => {
  if (!texto) return null;

  const resultado = {
    nome: null,
    carga_horaria: null,
    data: null,
    instituicao: null,
    tipo: null,
    confianca: 0
  };

  // Padrões regex para extração de campos
  const padroes = {
    // Nome: busca por "Nome:", "Participante:", "Cursista:", ou padrão de nome completo
    nome: [
      /(?:Nome|Participante|Cursista|Aluno|Estudante)\s*[:：]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /(?:Certificamos que|Declaramos que)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)/
    ],
    // Carga horária: busca por "Carga Horária:", "Horas:", "CH:", "Duração:"
    carga_horaria: [
      /(?:Carga\s+Horária|Horas|CH|Duração|Total\s+de\s+horas)\s*[:：]\s*(\d+(?:[.,]\d+)?)\s*(?:horas?|h|hs)/i,
      /(\d+(?:[.,]\d+)?)\s*(?:horas?|h|hs)\s*(?:de\s+)?(?:carga\s+)?(?:horária)?/i,
      /(\d+)\s*(?:horas?|h)/i
    ],
    // Data: busca por "Data:", "Realizado em:", "Período:", ou formato de data
    data: [
      /(?:Data|Realizado\s+em|Emitido\s+em|Concluído\s+em)\s*[:：]\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      /(?:Período|De|Entre)\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\s*(?:a|até|e)/i,
      /(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/
    ],
    // Instituição: busca por "Instituição:", "Organizado por:", "Promovido por:"
    instituicao: [
      /(?:Instituição|Organizado\s+por|Promovido\s+por|Realizado\s+por|Promotor)\s*[:：]\s*([A-Z][A-Za-z\s]+(?:S\.?A\.?|Ltda\.?|ME)?)/i,
      /(?:SENAC|SENAI|SEBRAE|UNIVERSIDADE|FACULDADE|ESCOLA|INSTITUTO)/i
    ],
    // Tipo: busca por "Tipo:", "Categoria:", "Modalidade:", "Natureza:"
    tipo: [
      /(?:Tipo|Categoria|Modalidade|Natureza|Atividade)\s*[:：]\s*([A-Za-z\s]+)/i,
      /(?:Curso|Palestra|Workshop|Seminário|Conferência|Congresso|Treinamento|Capacitação)/i
    ]
  };

  // Extrair cada campo usando os padrões
  for (const campo in padroes) {
    for (const padrao of padroes[campo]) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        resultado[campo] = match[1].trim();
        resultado.confianca += 1;
        break;
      }
    }
  }

  // Calcular confiança média (0-1)
  const camposEncontrados = Object.values(resultado).filter(v => v !== null).length - 1; // -1 para excluir confianca
  resultado.confianca = camposEncontrados / 5; // 5 campos totais

  return resultado;
};

const extrairTexto = async (fileBuffer, mimeType, nomeArquivo) => {
  try {
    const form = new FormData();
    form.append('file', fileBuffer, {
      filename: nomeArquivo,
      contentType: mimeType,
    });
    form.append('apikey', process.env.OCR_API_KEY);
    form.append('language', 'por');
    form.append('isOverlayRequired', 'false');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      console.error('Erro OCR.space:', data.ErrorMessage);
      return null;
    }

    const texto = data.ParsedResults?.[0]?.ParsedText;

    if (!texto) return null;

    // Extrair campos estruturados
    const camposEstruturados = extrairCamposEstruturados(texto);

    return {
      texto_bruto: texto,
      campos: camposEstruturados
    };

  } catch (error) {
    console.error('Erro no OCR:', error);
    return null;
  }
};

module.exports = { extrairTexto, extrairCamposEstruturados };