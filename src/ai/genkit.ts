// genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
 plugins: [
  // TEMPORARY DIAGNOSTIC STEP
  // We are hardcoding the API key to prove the rest of the system works.
  // THIS IS INSECURE AND WILL BE REVERTED.
  googleAI({apiKey: "AIzaSyAOcasHeuJqocxGVE9dZ64KXLB41A_mT8Y"}),
 ],
 // Usa el modelo con el que estás trabajando.
 model: 'googleai/gemini-2.5-flash',
});
