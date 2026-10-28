/**
 * Karobaar AI Model Service (Compatibility Layer)
 * Bridges to the modular Unified AI Service architecture (v2.0).
 */

import { aiService } from './ai/aiService.js';

class AiModelService {
  async sendMessage(params) {
    return aiService.sendMessage(params);
  }

  async executeConfirmedAction(actionData, authContext) {
    return aiService.executeConfirmedAction(actionData, authContext);
  }
}

export const aiModelService = new AiModelService();
export default aiModelService;
