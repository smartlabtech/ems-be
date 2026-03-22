import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  context?: any;
  text?: string;
  html?: string;
  attachments?: any[];
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

@Injectable()
export class MailerService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailerService.name);
  private readonly templatesPath: string;

  constructor(private configService: ConfigService) {
    // Set templates path based on environment
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    if (isDevelopment) {
      this.templatesPath = path.join(process.cwd(), 'src/templates/emails');
    } else {
      this.templatesPath = path.join(__dirname, '../../templates/emails');
    }
    
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('SMTP connection failed:', error);
    }
  }

  async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      const from = options.from || `${this.configService.get('EMAIL_FROM_NAME')} <${this.configService.get('EMAIL_FROM')}>`;
      
      let html = options.html;
      
      if (options.template && !html) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html,
        attachments: options.attachments,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  private async renderTemplate(templateName: string, context: any): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<boolean> {
    const verificationUrl = `${this.configService.get('EMAIL_VERIFICATION_URL')}?token=${token}`;
    
    return this.sendMail({
      to: email,
      subject: 'Verify Your Email - 2ZPoint',
      template: 'email-verification',
      context: {
        userName: userName || 'User',
        verificationUrl,
        appName: '2ZPoint',
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('PASSWORD_RESET_URL')}?token=${token}`;
    
    return this.sendMail({
      to: email,
      subject: 'Reset Your Password - 2ZPoint',
      template: 'password-reset',
      context: {
        userName: userName || 'User',
        resetUrl,
        appName: '2ZPoint',
        expiresIn: '1 hour',
      },
    });
  }

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: 'Welcome to 2ZPoint!',
      template: 'welcome',
      context: {
        userName,
        appName: '2ZPoint',
        loginUrl: this.configService.get('APP_URL'),
      },
    });
  }

  async sendInvoiceEmail(email: string, invoiceData: any): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: `Invoice #${invoiceData.invoiceNumber} - 2ZPoint`,
      template: 'invoice',
      context: {
        ...invoiceData,
        appName: '2ZPoint',
      },
      attachments: invoiceData.attachments || [],
    });
  }

  async sendSubscriptionEmail(email: string, subscriptionData: any): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: `Subscription ${subscriptionData.type} - 2ZPoint`,
      template: 'subscription',
      context: {
        ...subscriptionData,
        appName: '2ZPoint',
      },
    });
  }

  async sendProjectInvitationEmail(email: string, invitationData: any): Promise<boolean> {
    return this.sendMail({
      to: email,
      subject: `You've been invited to join ${invitationData.projectName}`,
      template: 'project-invitation',
      context: {
        ...invitationData,
        appName: '2ZPoint',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP test failed:', error);
      return false;
    }
  }
}