const fetch = require('node-fetch');
const FormData = require('form-data');

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
    return texto || null;

  } catch (error) {
    console.error('Erro no OCR:', error);
    return null;
  }
};

module.exports = { extrairTexto };