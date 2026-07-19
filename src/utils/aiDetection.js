const axios_url = process.env.AI_DETECTION_URL;

async function analyzeImage(fileUrl) {
  console.log("AI DETECTION CALLED");
  console.log(process.env.AI_DETECTION_URL);
  if (process.env.AI_DETECTION_ENABLED !== 'true' || !process.env.AI_DETECTION_URL) {
    return { isPothole: true, confidence: null, severity: 'medium', source: 'fallback' };
  }

  try {
    const FormData = require('form-data');
    const axios = require('axios');

    // fileUrl is now a Cloudinary URL, not a local path — fetch it as a buffer.
    const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    const form = new FormData();
    form.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const { data } = await axios.post(process.env.AI_DETECTION_URL, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });

    return {
      isPothole: data.isPothole ?? true,
      confidence: data.confidence ?? null,
      severity: data.severity ?? 'medium',
      image: data.image ?? null,
      source: 'model',
    };
  } catch (err) {
    console.warn('AI detection service unavailable, using fallback:', err.message);
    return { isPothole: true, confidence: null, severity: 'null', source: 'fallback' };
  }
}

module.exports = { analyzeImage };