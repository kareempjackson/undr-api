import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";
import * as Handlebars from "handlebars";
import * as fs from "fs";
import * as path from "path";

interface SendEmailParams {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesDir: string;
  private readonly templates: Map<string, Handlebars.TemplateDelegate> =
    new Map();
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    // Initialize SendGrid
    this.initializeSendGrid();

    // Set templates directory
    this.templatesDir = path.join(
      process.cwd(),
      "src/modules/notification/templates"
    );

    // Precompile email templates
    this.loadTemplates();
  }

  /**
   * Initialize SendGrid with API key
   */
  private initializeSendGrid(): void {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");

    if (!apiKey) {
      this.logger.warn(
        "SendGrid API key not found. Email sending will be simulated."
      );
      this.isInitialized = false;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isInitialized = true;
      this.logger.log("SendGrid initialized successfully");
    } catch (error) {
      this.logger.error(`Error initializing SendGrid: ${error.message}`);
      this.isInitialized = false;
    }
  }

  /**
   * Load and precompile email templates
   */
  private loadTemplates(): void {
    try {
      if (!fs.existsSync(this.templatesDir)) {
        fs.mkdirSync(this.templatesDir, { recursive: true });
        this.createDefaultTemplates();
      }

      const templateFiles = fs
        .readdirSync(this.templatesDir)
        .filter((file) => file.endsWith(".hbs"));

      if (templateFiles.length === 0) {
        this.createDefaultTemplates();
        templateFiles.push("base.hbs", "notification.hbs");
      }

      for (const file of templateFiles) {
        const templatePath = path.join(this.templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, "utf-8");
        const templateName = file.replace(".hbs", "");
        this.templates.set(templateName, Handlebars.compile(templateContent));
      }

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error(`Error loading email templates: ${error.message}`);
    }
  }

  /**
   * Create default email templates if none exist
   */
  private createDefaultTemplates(): void {
    try {
      // Create base template
      const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }
    .logo {
      max-width: 150px;
    }
    .content {
      padding: 20px 0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      border-top: 1px solid #eee;
      padding-top: 20px;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="{{logoUrl}}" alt="GhostPay" class="logo">
  </div>
  <div class="content">
    {{> content}}
  </div>
  <div class="footer">
    <p>© {{year}} GhostPay. All rights reserved.</p>
    <p>This is an automated message, please do not reply to this email.</p>
    <p>
      <a href="{{unsubscribeUrl}}">Manage notification preferences</a>
    </p>
  </div>
</body>
</html>`;

      // Create notification template
      const notificationTemplate = `
<h2>{{title}}</h2>
<p>{{message}}</p>
{{#if actionUrl}}
<p>
  <a href="{{actionUrl}}" class="button">{{actionText}}</a>
</p>
{{/if}}`;

      fs.writeFileSync(path.join(this.templatesDir, "base.hbs"), baseTemplate);
      fs.writeFileSync(
        path.join(this.templatesDir, "notification.hbs"),
        notificationTemplate
      );

      this.logger.log("Created default email templates");
    } catch (error) {
      this.logger.error(`Error creating default templates: ${error.message}`);
    }
  }

  /**
   * Send an email using a template
   * @param params - Email parameters including recipient, subject, template, and context
   * @returns The message ID if sent successfully
   */
  async sendEmail(params: SendEmailParams): Promise<string> {
    const { to, subject, templateName, context, attachments } = params;

    try {
      // Check if the template exists
      if (!this.templates.has(templateName)) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Get the template
      const template = this.templates.get(templateName);

      // Register partials if needed
      if (templateName !== "base") {
        Handlebars.registerPartial("content", template);
      }

      // Compile the base template with context
      let html: string;
      if (templateName === "base") {
        html = template(context);
      } else {
        const baseTemplate = this.templates.get("base");
        html = baseTemplate({
          ...context,
          subject,
          year: new Date().getFullYear(),
          logoUrl:
            this.configService.get<string>("APP_LOGO_URL") ||
            "https://ghostpay.com/logo.png",
          unsubscribeUrl:
            this.configService.get<string>("APP_URL") +
            "/settings/notifications",
        });
      }

      // If SendGrid is not initialized, log the email content instead
      if (!this.isInitialized) {
        this.logger.debug(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        this.logger.debug(`[MOCK EMAIL] Content: ${html}`);
        return `mock-${Date.now()}`;
      }

      // Prepare the email message
      const msg = {
        to,
        from:
          this.configService.get<string>("SENDGRID_FROM_EMAIL") ||
          "noreply@ghostpay.com",
        subject,
        html,
        attachments: attachments?.map((att) => ({
          content: att.content.toString("base64"),
          filename: att.filename,
          type: att.contentType,
          disposition: "attachment",
        })),
      };

      // Send the email via SendGrid
      await sgMail.send(msg);
      this.logger.debug(`Email sent to ${to}`);
      return `sg-${Date.now()}`;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a notification email
   * @param to - Recipient email
   * @param subject - Email subject
   * @param message - Email message
   * @param actionUrl - Optional CTA URL
   * @param actionText - Optional CTA text
   * @returns The message ID if sent successfully
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    message: string,
    actionUrl?: string,
    actionText: string = "View Details"
  ): Promise<string> {
    return this.sendEmail({
      to,
      subject,
      templateName: "notification",
      context: {
        title: subject,
        message,
        actionUrl,
        actionText,
      },
    });
  }
}
