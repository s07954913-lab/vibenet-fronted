import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  liked?: boolean;
  disliked?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {

  // ✅ Har language ke liye system instruction
  private languageInstructions: { [key: string]: string } = {
    'English (US)': 'You must always respond in English only.',
    'Urdu':         'آپ کو ہمیشہ صرف اردو میں جواب دینا ہے۔',
    'Arabic':       'يجب عليك الرد باللغة العربية فقط دائمًا.',
    'Spanish':      'Debes responder siempre solo en español.',
    'French':       'Tu dois toujours répondre uniquement en français.',
    'Chinese':      '你必须始终只用中文回答。'
  };

  async sendMessage(messages: ChatMessage[], language: string = 'English (US)'): Promise<string> {

    // ✅ Selected language ki instruction
    const systemPrompt = this.languageInstructions[language]
      || this.languageInstructions['English (US)'];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${environment.openRouterKey}`,
        // Baad mein (new):
'HTTP-Referer': 'https://vibenet-backend-production.up.railway.app',
        'X-Title': 'VibeNet AI'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          // ✅ System message pehle — AI ko language batao
          { role: 'system', content: systemPrompt },
          // Phir poori chat history
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data?.error?.message || 'API Error');
    }

    return data.choices[0].message.content;
  }
}