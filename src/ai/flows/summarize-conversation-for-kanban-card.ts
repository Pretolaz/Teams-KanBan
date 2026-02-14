'use server';
/**
 * @fileOverview This file implements a Genkit flow for summarizing Teams conversations.
 *
 * - summarizeConversationForKanbanCard - A function that summarizes a Teams conversation for a Kanban card.
 * - SummarizeConversationInput - The input type for the summarizeConversationForKanbanCard function.
 * - SummarizeConversationOutput - The return type for the summarizeConversationForKanbanCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the input schema for summarizing a conversation.
 * @property {string} conversationContent - The full content of the Teams conversation.
 */
const SummarizeConversationInputSchema = z.object({
  conversationContent: z.string().describe('The full content of the Teams conversation.'),
});
export type SummarizeConversationInput = z.infer<typeof SummarizeConversationInputSchema>;

/**
 * Defines the output schema for the summarized conversation.
 * @property {string} summary - A concise summary of the conversation suitable for a Kanban card.
 */
const SummarizeConversationOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation suitable for a Kanban card.'),
});
export type SummarizeConversationOutput = z.infer<typeof SummarizeConversationOutputSchema>;

/**
 * Summarizes a Teams conversation to create a concise text suitable for a Kanban card.
 * @param {SummarizeConversationInput} input - The input containing the conversation content.
 * @returns {Promise<SummarizeConversationOutput>} A promise that resolves to the summarized text.
 */
export async function summarizeConversationForKanbanCard(
  input: SummarizeConversationInput
): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

/**
 * Genkit prompt definition for summarizing conversation content.
 * It takes conversation content as input and aims to output a concise summary.
 */
const summarizeConversationPrompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {schema: SummarizeConversationInputSchema},
  output: {schema: SummarizeConversationOutputSchema},
  prompt: `Please provide a concise summary of the following Teams conversation. This summary will be used as a title or description for a Kanban card, so it should be brief, capture the main topic, and be easily digestible at a glance.

Conversation:
{{{conversationContent}}} `,
});

/**
 * Genkit flow definition for summarizing conversation content for a Kanban card.
 * It uses the 'summarizeConversationPrompt' to generate the summary.
 */
const summarizeConversationFlow = ai.defineFlow(
  {
    name: 'summarizeConversationFlow',
    inputSchema: SummarizeConversationInputSchema,
    outputSchema: SummarizeConversationOutputSchema,
  },
  async input => {
    const {output} = await summarizeConversationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate summary for the conversation.');
    }
    return output;
  }
);
