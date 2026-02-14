'use server';
/**
 * @fileOverview A Genkit flow that suggests task priorities for Kanban cards based on conversation content and frequency.
 *
 * - aiPrioritizeKanbanTask - A function that handles the task prioritization process.
 * - AIPrioritizeKanbanTaskInput - The input type for the aiPrioritizeKanbanTask function.
 * - AIPrioritizeKanbanTaskOutput - The return type for the aiPrioritizeKanbanTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AIPrioritizeKanbanTaskInputSchema = z.object({
  conversationContent: z
    .string()
    .describe('The full content of the conversation associated with the Kanban card.'),
  recentInteractionCount: z
    .number()
    .int()
    .min(0)
    .describe('The number of recent interactions or messages related to this conversation, indicating its frequency or urgency.'),
});
export type AIPrioritizeKanbanTaskInput = z.infer<typeof AIPrioritizeKanbanTaskInputSchema>;

// Output Schema
const AIPrioritizeKanbanTaskOutputSchema = z.object({
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The suggested priority for the Kanban card.'),
  reasoning: z
    .string()
    .describe('A brief explanation for the suggested priority.'),
});
export type AIPrioritizeKanbanTaskOutput = z.infer<typeof AIPrioritizeKanbanTaskOutputSchema>;

export async function aiPrioritizeKanbanTask(
  input: AIPrioritizeKanbanTaskInput
): Promise<AIPrioritizeKanbanTaskOutput> {
  return aiPrioritizeKanbanTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPrioritizeKanbanTaskPrompt',
  input: {schema: AIPrioritizeKanbanTaskInputSchema},
  output: {schema: AIPrioritizeKanbanTaskOutputSchema},
  prompt: `You are an intelligent assistant that helps prioritize Kanban tasks based on conversation content and frequency.
Your goal is to suggest a priority (High, Medium, Low) for a given Kanban card, and provide a brief reasoning for your suggestion.

Consider the following factors:
-   **High Priority**: Urgent requests, critical issues, time-sensitive tasks, or conversations with a very high recent interaction count (indicating immediate attention is needed).
-   **Medium Priority**: Important tasks, ongoing discussions, tasks with moderate recent interaction count, or items that require attention but are not immediately critical.
-   **Low Priority**: General information, follow-ups that are not urgent, tasks that can be addressed later, or conversations with a low recent interaction count.

Here is the conversation content for the Kanban card:
{{{conversationContent}}}

Number of recent interactions for this conversation: {{{recentInteractionCount}}}

Based on this information, determine the most appropriate priority.`,
});

const aiPrioritizeKanbanTaskFlow = ai.defineFlow(
  {
    name: 'aiPrioritizeKanbanTaskFlow',
    inputSchema: AIPrioritizeKanbanTaskInputSchema,
    outputSchema: AIPrioritizeKanbanTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a priority suggestion from the AI.');
    }
    return output;
  }
);
