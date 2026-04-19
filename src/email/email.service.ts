import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import {
  EMAIL_SMTP_APP_PASSWORD,
  EMAIL_SMTP_USER,
} from '../constants';

interface EmailSendPayload {
  recipients: string[];
  subject: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_SMTP_USER,
      pass: EMAIL_SMTP_APP_PASSWORD,
    },
  });

  async sendEmail(payload: EmailSendPayload): Promise<void> {
    const recipients = payload.recipients
      .map((recipient) => recipient.trim())
      .filter((recipient) => recipient.length > 0);

    if (!EMAIL_SMTP_USER || !EMAIL_SMTP_APP_PASSWORD) {
      this.logger.error('Email SMTP credentials are not configured.');
      throw new Error('Email SMTP credentials are not configured.');
    }

    if (recipients.length === 0) {
      throw new Error('At least one recipient is required.');
    }

    if (payload.subject.trim().length === 0) {
      throw new Error('Email subject is required.');
    }

    if (payload.text.trim().length === 0) {
      throw new Error('Email text content is required.');
    }

    await this.transporter.sendMail({
      from: EMAIL_SMTP_USER,
      to: recipients,
      subject: payload.subject,
      text: payload.text,
    });
  }
}
