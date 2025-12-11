import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, we'll use a simple console logger
    // In production, you would configure with actual SMTP settings
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Development mode - just log emails
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 Email would be sent:');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('Body:', mailOptions.text || mailOptions.html);
          return { messageId: 'dev-' + Date.now() };
        }
      };
    }
  }

  async sendHiringNotification(candidate, job, recruiter) {
    const subject = `Congratulations! You've been selected for ${job.title}`;
    
    const text = `
Hi ${candidate.name || 'there'},

Great news! You have been selected for the position of ${job.title}.

Job Details:
- Position: ${job.title}
- Company: ${recruiter.displayName || recruiter.name || 'Our Company'}
- Role Type: ${job.roleType}
- Location: ${job.location}

${job.description ? `\nJob Description:\n${job.description.substring(0, 500)}${job.description.length > 500 ? '...' : ''}` : ''}

The recruiter will be in touch with you soon with next steps.

Best regards,
The Kiro Talent Engine Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Job Selection Notification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .job-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .cta-button { background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <p>You've been selected for a position</p>
    </div>
    <div class="content">
      <p>Hi ${candidate.name || 'there'},</p>
      
      <p>Great news! You have been selected for the position of <strong>${job.title}</strong>.</p>
      
      <div class="job-details">
        <h3>Job Details:</h3>
        <ul>
          <li><strong>Position:</strong> ${job.title}</li>
          <li><strong>Company:</strong> ${recruiter.displayName || recruiter.name || 'Our Company'}</li>
          <li><strong>Role Type:</strong> ${job.roleType}</li>
          <li><strong>Location:</strong> ${job.location}</li>
        </ul>
        
        ${job.description ? `
        <h4>Job Description:</h4>
        <p>${job.description.substring(0, 500)}${job.description.length > 500 ? '...' : ''}</p>
        ` : ''}
      </div>
      
      <p>The recruiter will be in touch with you soon with next steps.</p>
      
      <div class="footer">
        <p>Best regards,<br>The Kiro Talent Engine Team</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      const result = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@kiro.com',
        to: candidate.email,
        subject,
        text,
        html
      });

      console.log('Hiring notification sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send hiring notification:', error);
      throw error;
    }
  }

  async sendCustomEmail(to, subject, content, isHtml = false) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@kiro.com',
        to,
        subject
      };

      if (isHtml) {
        mailOptions.html = content;
      } else {
        mailOptions.text = content;
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Custom email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send custom email:', error);
      throw error;
    }
  }

  generateMailtoLink(candidate, job) {
    const subject = encodeURIComponent(`Job Opportunity - ${job.title}`);
    const body = encodeURIComponent(`Hi ${candidate.name || 'there'},

I found your profile interesting and would like to discuss the ${job.title} position with you.

Job Details:
- Position: ${job.title}
- Role Type: ${job.roleType}
- Location: ${job.location}

${job.description ? `\nAbout the role:\n${job.description.substring(0, 300)}${job.description.length > 300 ? '...' : ''}` : ''}

I'd love to schedule a time to chat about this opportunity. Please let me know your availability.

Best regards`);

    return `mailto:${candidate.email}?subject=${subject}&body=${body}`;
  }
}

export default new EmailService();