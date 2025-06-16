import { NextRequest, NextResponse } from 'next/server';
import { sendPartnerInquiryConfirmation, sendCustomEmail } from '@/lib/email';
import { CONTACT_INFO } from '@/constants/config';

// Define the contact form data type
type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  inquiryType?: 'general' | 'partnership' | 'volunteer' | 'donation';
  organization?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data: ContactFormData = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name, email, subject, and message are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    console.log('Contact form submitted:', {
      name: data.name,
      email: data.email,
      subject: data.subject,
      inquiryType: data.inquiryType || 'general',
      organization: data.organization,
      messageLength: data.message.length
    });
    
    // Send notification email to the team
    try {
      await sendCustomEmail(
        CONTACT_INFO.email,
        `New Contact Form Submission: ${data.subject}`,
        `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${data.name} (${data.email})</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Inquiry Type:</strong> ${data.inquiryType || 'general'}</p>
          ${data.organization ? `<p><strong>Organization:</strong> ${data.organization}</p>` : ''}
          <p><strong>Message:</strong></p>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
        `
      );
      console.log('✅ Contact form notification sent to team');
    } catch (notificationError) {
      console.error('⚠️ Failed to send contact form notification to team:', notificationError);
    }
    
    // Send confirmation email to the user
    try {
      if (data.inquiryType === 'partnership' || data.subject.toLowerCase().includes('partner')) {
        // Send partner inquiry confirmation
        await sendPartnerInquiryConfirmation({
          to: data.email,
          name: data.name,
          organization: data.organization,
          message: data.message
        });
        console.log('✅ Partner inquiry confirmation sent to:', data.email);
      } else {
        // Send general contact confirmation
        await sendCustomEmail(
          data.email,
          'Thank you for contacting New Steps Project',
          `
            <h1>Thank you for reaching out!</h1>
            <p>Dear ${data.name},</p>
            <p>We've received your message and will get back to you within 24-48 hours during business days.</p>
            
            <h2>Your Message:</h2>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            
            <p>If you have any urgent questions, please don't hesitate to call us at ${CONTACT_INFO.phone}.</p>
            
            <p>Best regards,<br>
            The New Steps Project Team<br>
            Email: ${CONTACT_INFO.email}</p>
          `
        );
        console.log('✅ General contact confirmation sent to:', data.email);
      }
    } catch (confirmationError) {
      console.error('⚠️ Failed to send confirmation email to user:', confirmationError);
      // Don't fail the entire request if confirmation email fails
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message! We\'ll get back to you within 24-48 hours.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit contact form. Please try again or contact us directly.',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 