declare module 'mailparser' {
  export interface ParsedMail {
    messageId: string;
    subject: string;
    from: {
      text: string;
    };
    text: string;
    html?: string;
    attachments?: any[];
    headers?: any;
  }

  export function simpleParser(
    stream: any,
    callback: (err: Error | null, mail: ParsedMail) => void
  ): void;
} 