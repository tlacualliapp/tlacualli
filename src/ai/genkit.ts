// genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
 plugins: [
  // El plugin googleAI buscará automáticamente la
  // GEMINI_API_KEY o GOOGLE_API_KEY en las variables de entorno.
  googleAI(),
 ],
 // Usa el modelo con el que estás trabajando.
 model: 'googleai/gemini-2.5-flash',
});