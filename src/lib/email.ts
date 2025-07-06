const nodemailer = require('nodemailer');
import { getAppSettings } from '@/lib/settings';

// Define email templates
export enum EmailTemplate {
  DONATION_CONFIRMATION = 'donation_confirmation',
  MONEY_DONATION_CONFIRMATION = 'money_donation_confirmation',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_SHIPPED = 'order_shipped',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  CONTACT_FORM = 'contact_form',
  VOLUNTEER_CONFIRMATION = 'volunteer_confirmation',
  PARTNER_INQUIRY = 'partner_inquiry',
  SHOE_REQUEST_CONFIRMATION = 'shoe_request_confirmation',
}

// Define email config (read dynamically to pick up environment changes)
function getEmailConfig() {
  return {
    from: process.env.EMAIL_FROM || 'newstepsfit@gmail.com',
    server: process.env.EMAIL_SERVER || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  };
}

// Create transporter
async function createTransporter() {
  const emailConfig = getEmailConfig();
  // Check if we have production email credentials (AWS SES or other SMTP)
  if (emailConfig.username && emailConfig.password && emailConfig.server !== 'smtp.ethereal.email') {
    console.log(`📧 Using production SMTP: ${emailConfig.server}`);
    return nodemailer.createTransport({
      host: emailConfig.server,
      port: emailConfig.port,
      secure: emailConfig.port === 465, // true for port 465, false for other ports
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password,
      },
    });
  }
  
  // Fallback to Ethereal for development
  console.log('📧 Using Ethereal email for development');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });
}

// Initialize transporter
let transporter: nodemailer.Transporter;

// Reset transporter to force recreation with new config
function resetTransporter() {
  transporter = null as any;
}

// Define template functions
const templates = {
  [EmailTemplate.DONATION_CONFIRMATION]: (data: any) => ({
    subject: 'Thank You for Your Donation to New Steps Project',
    html: `
      <h1>Thank You for Your Donation!</h1>
      <p>Dear ${data.name},</p>
      <p>Thank you for your generous donation to New Steps Project. Your donation helps us provide sports shoes to those in need.</p>
      <p><strong>Donation ID:</strong> ${data.donationId}</p>
      <p><strong>What You're Donating:</strong> ${data.donationDescription}</p>
      ${data.isBayArea 
        ? `<p><strong>Next Steps:</strong> Since you're in the Bay Area, we'll contact you soon to arrange pickup or drop-off of your donation.</p>` 
        : `<p><strong>Next Steps:</strong> We'll contact you soon with shipping instructions for your donation.</p>`
      }
      <p>If you have any questions, please feel free to contact us at ${getEmailConfig().from}.</p>
      <p>Thanks for your support!</p>
      <p>The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.MONEY_DONATION_CONFIRMATION]: async (data: any) => {
    const settings = await getAppSettings();
    return {
      subject: 'Thank You for Your Financial Contribution to New Steps Project',
      html: `
        <h1>Thank You for Your Donation!</h1>
        <p>Dear ${data.name},</p>
        <p>Thank you for your generous financial contribution to the New Steps Project. Your support helps us continue our mission of providing sports shoes to those in need.</p>
        <p><strong>Donation ID:</strong> ${data.donationId}</p>
        <p><strong>Donation Amount:</strong> $${data.amount}</p>
        <h2>Next Steps</h2>
        <ol>
          <li>Please make your check payable to <strong>"New Steps Project"</strong></li>
          <li>Write your donation ID (${data.donationId}) in the memo line of your check</li>
          <li>Mail your check to our address:
            <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px;">
              <p style="margin: 0;">New Steps Project</p>
              <p style="margin: 0;">Attn: Donations</p>
              <p style="margin: 0;">${settings.officeAddress.street}</p>
              <p style="margin: 0;">${settings.officeAddress.city}, ${settings.officeAddress.state} ${settings.officeAddress.zipCode}</p>
            </div>
          </li>
        </ol>
        <p>Once we receive your check, we'll send you a tax receipt for your records.</p>
        <p>If you have any questions, please feel free to contact us at ${settings.donationsEmail}.</p>
        <p>Thanks for your support!</p>
        <p>The New Steps Project Team</p>
      `,
    };
  },
  [EmailTemplate.VOLUNTEER_CONFIRMATION]: (data: any) => ({
    subject: 'Thank You for Your Interest in Volunteering - New Steps Project',
    html: `
      <h1>Welcome to the New Steps Project Family!</h1>
      <p>Dear ${data.name},</p>
      <p>Thank you for your interest in volunteering with New Steps Project! We're excited to have you join our mission of providing sports shoes to young athletes in need.</p>
      
      <h2>Your Application Details:</h2>
      <p><strong>Volunteer ID:</strong> ${data.volunteerId}</p>
      <p><strong>Interested Areas:</strong> ${data.interests.join(', ')}</p>
      <p><strong>Availability:</strong> ${data.availability}</p>
      
      <h2>What's Next?</h2>
      <p>Our volunteer coordinator will review your application and contact you within 1-2 weeks with:</p>
      <ul>
        <li>Available volunteer opportunities that match your interests</li>
        <li>Training information and resources</li>
        <li>Next steps to get you started</li>
      </ul>
      
      <p>In the meantime, feel free to follow our progress on social media and share our mission with friends and family.</p>
      
      <p>Thank you for choosing to make a difference in young athletes' lives!</p>
      
      <p>Best regards,<br>
      The New Steps Project Team<br>
      Email: ${getEmailConfig().from}</p>
    `,
  }),
  [EmailTemplate.PARTNER_INQUIRY]: (data: any) => ({
    subject: 'Thank You for Your Partnership Inquiry - New Steps Project',
    html: `
      <h1>Thank You for Your Interest in Partnering with Us!</h1>
      <p>Dear ${data.name},</p>
      <p>Thank you for reaching out about partnership opportunities with New Steps Project. We're always excited to connect with organizations that share our mission of supporting young athletes.</p>
      
      <h2>Your Inquiry:</h2>
      <p><strong>Organization:</strong> ${data.organization || 'Individual'}</p>
      <p><strong>Message:</strong></p>
      <p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0;">
        ${data.message}
      </p>
      
      <h2>Next Steps:</h2>
      <p>Our partnership team will review your inquiry and get back to you within 3-5 business days to discuss:</p>
      <ul>
        <li>Available partnership opportunities</li>
        <li>How we can work together</li>
        <li>Next steps in the partnership process</li>
      </ul>
      
      <p>We appreciate your interest in supporting young athletes and look forward to exploring how we can work together!</p>
      
      <p>Best regards,<br>
      The New Steps Project Team<br>
      Email: ${getEmailConfig().from}</p>
    `,
  }),
  [EmailTemplate.ORDER_CONFIRMATION]: (data: any) => ({
    subject: 'Your New Steps Project Order Confirmation',
    html: `
      <h1>Order Confirmation</h1>
      <p>Dear ${data.name},</p>
      <p>Thank you for your order from New Steps Project. We're excited to provide you with quality sports shoes!</p>
      <p>Order ID: ${data.orderId}</p>
      <p>Shipping Address: ${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}</p>
      <p>Shipping Fee: $${data.shippingFee.toFixed(2)}</p>
      <p>We'll notify you when your order ships.</p>
      <p>Thanks for participating in our initiative!</p>
      <p>The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.ORDER_SHIPPED]: (data: any) => ({
    subject: 'Your New Steps Project Order Has Shipped',
    html: `
      <h1>Your Order Has Shipped</h1>
      <p>Dear ${data.name},</p>
      <p>Great news! Your New Steps Project order has been shipped and is on its way to you.</p>
      <p>Order ID: ${data.orderId}</p>
      <p>Shipping Address: ${data.shippingAddress.street}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}</p>
      ${data.trackingNumber ? `<p>Tracking Number: ${data.trackingNumber}</p>` : ''}
      <p>We hope you enjoy your shoes!</p>
      <p>The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.SHOE_REQUEST_CONFIRMATION]: (data: any) => ({
    subject: `Shoe Request Confirmation - ${data.requestId || 'REQ-UNKNOWN'}`,
    html: `
      <h1>Your Shoe Request Has Been Submitted!</h1>
      <p>Dear ${data.firstName || 'Valued Customer'},</p>
      <p>Thank you for your shoe request! We've received your request and will process it soon.</p>
      
      <h2>Request Details:</h2>
      <p><strong>Request ID:</strong> ${data.requestId || 'REQ-UNKNOWN'}</p>
      <p><strong>Status:</strong> Submitted</p>
      <p><strong>Items requested:</strong> ${data.itemCount || (data.items ? data.items.length : 0)}</p>
      
      <h2>Requested Shoes:</h2>
      <ul>
        ${(data.items || []).map((item: any) => `<li>${item.brand || 'Unknown Brand'} ${item.name || item.modelName || 'Unknown Model'} (ID: ${item.shoeId || 'N/A'}) - Size ${item.size || 'Unknown'}</li>`).join('')}
      </ul>
      
      ${data.deliveryMethod === 'shipping' ? `
      <h2>Shipping Information:</h2>
      <p><strong>Address:</strong><br>
      ${data.address || ''}<br>
      ${data.city || ''}, ${data.state || ''} ${data.zipCode || ''}</p>
      <p><strong>Shipping Fee:</strong> $${(data.shippingFee || 0).toFixed(2)}</p>
      ` : `
      <h2>Pickup Selected</h2>
      <p>No shipping fee - pickup arrangements will be made when your request is approved.</p>
      `}
      
      <p>We'll notify you when your request is approved and processed.</p>
      
      <p>Thank you for choosing New Steps Project!</p>
      
      <p>Best regards,<br>
      The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.EMAIL_VERIFICATION]: (data: any) => ({
    subject: 'Verify Your Email for New Steps Project',
    html: `
      <h1>Email Verification</h1>
      <p>Dear ${data.name},</p>
      <p>Thank you for registering with New Steps Project. Please verify your email address by clicking the link below:</p>
      <p><a href="${data.verificationUrl}">Verify Email Address</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.PASSWORD_RESET]: (data: any) => ({
    subject: 'Reset Your New Steps Project Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Dear ${data.name},</p>
      <p>We received a request to reset your password. Please click the link below to reset your password:</p>
      <p><a href="${data.resetUrl}">Reset Password</a></p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <p>The New Steps Project Team</p>
    `,
  }),
  [EmailTemplate.CONTACT_FORM]: (data: any) => ({
    subject: `New Contact Form Submission: ${data.subject}`,
    html: `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message}</p>
    `,
  }),
};

/**
 * Get or create email transporter
 */
async function getTransporter() {
  // Always recreate transporter to pick up environment changes
  transporter = await createTransporter();
  return transporter;
}

/**
 * Send an email using a template
 * @param to - Recipient email address
 * @param template - Template to use
 * @param data - Data to populate the template
 * @returns Promise with info about the sent message
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  data: any
) {
  console.log(`Sending ${template} email to ${to}`);
  
  try {
    const templateFunction = templates[template];
    const templateResult = typeof templateFunction === 'function' 
      ? await templateFunction(data) 
      : templateFunction;
    
    const { subject, html } = templateResult;
    const emailTransporter = await getTransporter();

    const info = await emailTransporter.sendMail({
      from: getEmailConfig().from,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent successfully: ${info.messageId}`);
    if (process.env.NODE_ENV === 'development' && info.getTestMessageUrl) {
      console.log(`Preview URL: ${info.getTestMessageUrl()}`);
    }
    
    return info;
  } catch (error) {
    console.error(`Failed to send ${template} email:`, error);
    throw error;
  }
}

/**
 * Send a volunteer confirmation email
 */
export async function sendVolunteerConfirmation(options: {
  to: string;
  name: string;
  volunteerId: string;
  interests: string[];
  availability: string;
}) {
  return sendEmail(
    options.to,
    EmailTemplate.VOLUNTEER_CONFIRMATION,
    {
      name: options.name,
      volunteerId: options.volunteerId,
      interests: options.interests,
      availability: options.availability
    }
  );
}

/**
 * Send a partner inquiry confirmation email
 */
export async function sendPartnerInquiryConfirmation(options: {
  to: string;
  name: string;
  organization?: string;
  message: string;
}) {
  return sendEmail(
    options.to,
    EmailTemplate.PARTNER_INQUIRY,
    {
      name: options.name,
      organization: options.organization,
      message: options.message
    }
  );
}

/**
 * Send a money donation confirmation email
 * @param options - Options for the email
 * @returns Promise with info about the sent message
 */
export async function sendMoneyDonationConfirmation(options: {
  to: string;
  name: string;
  donationId: string;
  amount: string;
}) {
  return sendEmail(
    options.to,
    EmailTemplate.MONEY_DONATION_CONFIRMATION,
    {
      name: options.name,
      donationId: options.donationId,
      amount: options.amount
    }
  );
}

/**
 * Send a custom email
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @returns Promise with info about the sent message
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  html: string
) {
  console.log(`Sending custom email to ${to}`);
  
  try {
    const emailTransporter = await getTransporter();
    const info = await emailTransporter.sendMail({
      from: getEmailConfig().from,
      to,
      subject,
      html,
    });
    
    console.log(`Custom email sent successfully: ${info.messageId}`);
    if (process.env.NODE_ENV === 'development' && info.getTestMessageUrl) {
      console.log(`Preview URL: ${info.getTestMessageUrl()}`);
    }
    
    return info;
  } catch (error) {
    console.error('Failed to send custom email:', error);
    throw error;
  }
}

/**
 * Send a donation confirmation email
 */
export async function sendDonationConfirmationEmail({ 
  email, 
  name, 
  donationId, 
  itemCount 
}: { 
  email: string; 
  name: string; 
  donationId: string; 
  itemCount: number;
}) {
  return sendEmail(
    email,
    EmailTemplate.DONATION_CONFIRMATION,
    {
      name: name || 'Donor',
      donationId,
      donationDescription: `${itemCount} shoes`,
      isBayArea: false // This can be enhanced later
    }
  );
}

// Export for testing
export const _testing = {
  templates,
  getEmailConfig,
};