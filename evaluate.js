export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { question, criteria, answer } = req.body;
  if (!question || !criteria || !answer) {
    return res.status(400).json({ error: 'question, criteria and answer required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `Eres KAAI, una guacamaya sintética del año 3177 en Aburrát Cahué. Evalúas respuestas de estudiantes del curso Artes y Humanidades I (EAFIT, Medellín). 
Eres concisa, directa, y hablas con tono cálido pero analítico. Usas primera persona plural ("los exploradores", "su análisis").
Evalúa si la respuesta cumple el criterio indicado. Sé generosa: si hay comprensión genuina aunque incompleta, aprueba.
Responde SOLO en JSON válido con este formato exacto:
{"correct":true,"feedback":"Tu mensaje en 2-3 oraciones como Kaai, en español. Si es correcto empieza con 🦜. Si es incorrecto, orienta sin revelar la respuesta."}
No añadas nada fuera del JSON. No uses markdown.`,
        messages: [{
          role: 'user',
          content: `RETO: ${question}\nCRITERIO DE APROBACIÓN: ${criteria}\nRESPUESTA DEL EQUIPO: ${answer}`
        }]
      })
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{"correct":false,"feedback":"Error de evaluación. Solicita verificación al Profe."}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(200).json({
      correct: false,
      feedback: 'Sistema de evaluación no disponible. Solicita verificación al Profe con el código.'
    });
  }
}
