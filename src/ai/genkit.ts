// genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // This will automatically look for the GEMINI_API_KEY environment variable
  ],
  model: 'googleai/gemini-2.5-flash',
});
