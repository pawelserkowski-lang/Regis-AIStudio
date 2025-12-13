/**
 * Conversation Export Utilities
 * Export conversations to JSON, Markdown, and HTML formats
 */

import { ChatSession, Sender } from '../types';

/**
 * Export conversation to JSON format
 */
export const exportToJSON = (session: ChatSession): string => {
  const exportData = {
    title: session.title,
    date: new Date(session.date).toISOString(),
    messages: session.messages.map(msg => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      timestamp: new Date(msg.timestamp).toISOString(),
      model: msg.model,
      attachments: msg.attachments,
    })),
    provider: session.provider,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export conversation to Markdown format
 */
export const exportToMarkdown = (session: ChatSession): string => {
  const lines: string[] = [];

  // Header
  lines.push(`# ${session.title}`);
  lines.push('');
  lines.push(`**Date:** ${new Date(session.date).toLocaleString()}`);
  lines.push(`**Provider:** ${session.provider || 'Unknown'}`);
  lines.push(`**Messages:** ${session.messages.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Messages
  session.messages.forEach((msg, index) => {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const sender = msg.sender === Sender.USER ? '👤 User' : '🤖 AI';

    lines.push(`### ${sender} (${time})`);
    lines.push('');
    lines.push(msg.text);
    lines.push('');

    if (msg.model) {
      lines.push(`*Model: ${msg.model}*`);
      lines.push('');
    }

    if (msg.attachments && msg.attachments.length > 0) {
      lines.push('**Attachments:**');
      msg.attachments.forEach(att => {
        lines.push(`- ${att.type}: ${att.url}`);
      });
      lines.push('');
    }

    if (index < session.messages.length - 1) {
      lines.push('---');
      lines.push('');
    }
  });

  // Footer
  lines.push('');
  lines.push('---');
  lines.push(`*Exported from Regis AI Studio on ${new Date().toLocaleString()}*`);

  return lines.join('\n');
};

/**
 * Export conversation to HTML format
 */
export const exportToHTML = (session: ChatSession): string => {
  const html: string[] = [];

  html.push('<!DOCTYPE html>');
  html.push('<html lang="en">');
  html.push('<head>');
  html.push('  <meta charset="UTF-8">');
  html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  html.push(`  <title>${session.title}</title>`);
  html.push('  <style>');
  html.push('    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }');
  html.push('    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }');
  html.push('    .meta { color: #94a3b8; font-size: 14px; margin-bottom: 30px; }');
  html.push('    .message { margin: 20px 0; padding: 15px; border-radius: 8px; border-left: 4px solid; }');
  html.push('    .user { background: #1e293b; border-color: #3b82f6; }');
  html.push('    .bot { background: #1e293b; border-color: #10b981; }');
  html.push('    .sender { font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }');
  html.push('    .time { color: #64748b; font-size: 12px; }');
  html.push('    .text { white-space: pre-wrap; line-height: 1.6; }');
  html.push('    .model { color: #94a3b8; font-size: 12px; font-style: italic; margin-top: 8px; }');
  html.push('    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px; }');
  html.push('  </style>');
  html.push('</head>');
  html.push('<body>');

  // Header
  html.push(`  <h1>${session.title}</h1>`);
  html.push(`  <div class="meta">`);
  html.push(`    <p><strong>Date:</strong> ${new Date(session.date).toLocaleString()}</p>`);
  html.push(`    <p><strong>Provider:</strong> ${session.provider || 'Unknown'}</p>`);
  html.push(`    <p><strong>Messages:</strong> ${session.messages.length}</p>`);
  html.push(`  </div>`);

  // Messages
  session.messages.forEach(msg => {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const cssClass = msg.sender === Sender.USER ? 'user' : 'bot';
    const sender = msg.sender === Sender.USER ? '👤 User' : '🤖 AI';

    html.push(`  <div class="message ${cssClass}">`);
    html.push(`    <div class="sender">${sender} <span class="time">${time}</span></div>`);
    html.push(`    <div class="text">${escapeHtml(msg.text)}</div>`);
    if (msg.model) {
      html.push(`    <div class="model">Model: ${msg.model}</div>`);
    }
    html.push(`  </div>`);
  });

  // Footer
  html.push(`  <div class="footer">`);
  html.push(`    Exported from Regis AI Studio on ${new Date().toLocaleString()}`);
  html.push(`  </div>`);
  html.push('</body>');
  html.push('</html>');

  return html.join('\n');
};

/**
 * Download file to user's computer
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export conversation in specified format
 */
export const exportConversation = (session: ChatSession, format: 'json' | 'markdown' | 'html') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeTitle = session.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);

  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case 'json':
      content = exportToJSON(session);
      filename = `${safeTitle}_${timestamp}.json`;
      mimeType = 'application/json';
      break;
    case 'markdown':
      content = exportToMarkdown(session);
      filename = `${safeTitle}_${timestamp}.md`;
      mimeType = 'text/markdown';
      break;
    case 'html':
      content = exportToHTML(session);
      filename = `${safeTitle}_${timestamp}.html`;
      mimeType = 'text/html';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  downloadFile(content, filename, mimeType);
};

/**
 * Export all conversations
 */
export const exportAllConversations = (sessions: ChatSession[], format: 'json' | 'markdown' | 'html') => {
  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'json') {
    // Export all sessions in a single JSON file
    const allData = {
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions: sessions.map(session => ({
        title: session.title,
        date: new Date(session.date).toISOString(),
        messages: session.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          timestamp: new Date(msg.timestamp).toISOString(),
          model: msg.model,
        })),
        provider: session.provider,
      })),
    };

    const content = JSON.stringify(allData, null, 2);
    downloadFile(content, `all_conversations_${timestamp}.json`, 'application/json');
  } else {
    // Export each session individually
    sessions.forEach(session => {
      exportConversation(session, format);
    });
  }
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy conversation to clipboard
 */
export const copyToClipboard = (session: ChatSession, format: 'json' | 'markdown' = 'markdown'): Promise<void> => {
  const content = format === 'json' ? exportToJSON(session) : exportToMarkdown(session);
  return navigator.clipboard.writeText(content);
};
