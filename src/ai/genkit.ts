// genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
 plugins: [
  
  googleAI({ 
   apiKey: process.env.GEMINI_API_KEY,
  }),
  
 ],
 // Usa el modelo con el que estás trabajando.
 model: 'googleai/gemini-2.5-flash',
});