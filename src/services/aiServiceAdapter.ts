/**
 * Adapter for the new AI service to maintain backward compatibility
 * This bridges the old geminiService API with the new modular AI service
 */

import * as aiService from './ai';
import { Attachment } from '../types';

/**
 * Send message with streaming response
 * Adapts the new AI service API to match the old signature
 */
export const sendMessageStream = async (
  message: string,
  attachments: Attachment[],
  onChunk: (text: string, metadata?: any) => void
): Promise<void> => {
  // Ensure AI is initialized
  if (!aiService.isAIInitialized()) {
    await aiService.initializeAI();
  }

  // Map attachments to the format expected by the new service
  const mappedAttachments = attachments
    .filter(att => att.data !== undefined)
    .map(att => ({
      type: att.type,
      data: att.data!,
      mimeType: att.mimeType
    }));

  // Call the new service with adapted callbacks
  await aiService.sendMessageStream(
    message,
    {
      onToken: (text: string) => onChunk(text),
      onComplete: () => {},
      onError: (error: Error) => {
        throw error;
      }
    },
    mappedAttachments
  );
};

/**
 * Improve a user prompt using AI
 */
export const improvePrompt = async (prompt: string): Promise<string> => {
  // Ensure AI is initialized
  if (!aiService.isAIInitialized()) {
    await aiService.initializeAI();
  }

  return aiService.improvePrompt(prompt);
};

/**
 * Initialize AI services
 */
export const initializeAI = aiService.initializeAI;

/**
 * Check if AI is initialized
 */
export const isAIInitialized = aiService.isAIInitialized;

// Re-export other useful functions
export {
  getProvider,
  setProvider,
  getModel,
  setModel,
  healthCheck,
  clearHistory
} from './ai';
