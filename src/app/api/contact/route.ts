import { NextRequest, NextResponse } from 'next/server';
import { sendPartnerInquiryConfirmation, sendCustomEmail } from '@/lib/email';
import { getEmailAddress, getAppSettings } from '@/lib/settings';
import { ensureDbConnected } from '@/lib/db-utils';
import Interest, { InterestType } from '@/models/interest';
import Counter from '@/models/counter';

// Define the contact form data type
type ContactFormData = {
  // Support both old format (name) and new format (firstName + lastName)
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  subject: string;
  message: string;
  inquiryType?: 'general' | 'partnership' | 'volunteer' | 'donation';
  organization?: string;
  organizationName?: string; // Partnership forms use this
  organizationType?: string; // Partnership forms use this
  phone?: string;
  type?: string; // Some forms send this instead of inquiryType
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data: ContactFormData = await request.json();
    
    // Extract the contact name (support both formats)
    const contactName = data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : '');
    
    // Validate required fields
    if (!contactName || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: name (or firstName/lastName), email, subject, and message are required' },
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
    
    // Determine inquiry type
    const inquiryType = data.inquiryType || data.type || 'general';
    const normalizedType: InterestType = ['general', 'partnership', 'volunteer', 'donation'].includes(
      inquiryType as string
    )
      ? (inquiryType as InterestType)
      : 'general';
    
    console.log('Contact form submitted:', {
      name: contactName,
      email: data.email,
      subject: data.subject,
      inquiryType,
      organization: data.organization || data.organizationName,
      organizationType: data.organizationType,
      phone: data.phone,
      messageLength: data.message.length
    });
    
    // Store interest submission in the database
    try {
      await ensureDbConnected();

      const sequenceValue = await Counter.getNextSequence('interest');
      const interestId = `INT-${sequenceValue}`;

      // Attempt to derive individual name parts if they were not explicitly provided
      let inferredFirstName = data.firstName;
      let inferredLastName = data.lastName;
      if ((!inferredFirstName || !inferredLastName) && contactName.trim()) {
        const nameParts = contactName.trim().split(' ');
        if (nameParts.length > 1) {
          inferredFirstName = inferredFirstName || nameParts[0];
          inferredLastName = inferredLastName || nameParts.slice(1).join(' ');
        } else {
          inferredFirstName = inferredFirstName || contactName.trim();
        }
      }

      await Interest.create({
        interestId,
        type: normalizedType,
        firstName: inferredFirstName,
        lastName: inferredLastName,
        name: contactName,
        email: data.email,
        phone: data.phone,
        organizationName: data.organizationName || data.organization,
        organizationType: data.organizationType,
        subject: data.subject,
        message: data.message,
        source: data.type || data.inquiryType || 'contact-form',
        status: 'new',
        submittedAt: new Date(),
        metadata: {
          rawInquiryType: inquiryType,
        },
      });

      console.log('✅ Interest submission stored:', interestId);
    } catch (persistenceError) {
      console.error('❌ Failed to persist interest submission:', persistenceError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to record your submission. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Send notification email to the team
    try {
      const contactEmail = await getEmailAddress('contact');
      const organizationInfo = data.organizationName ? `
        <p><strong>Organization:</strong> ${data.organizationName}</p>
        <p><strong>Organization Type:</strong> ${data.organizationType || 'Not specified'}</p>
      ` : data.organization ? `<p><strong>Organization:</strong> ${data.organization}</p>` : '';
      
      await sendCustomEmail(
        contactEmail,
        `[Contact] New Contact Form Submission: ${data.subject}`,
        `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${contactName} (${data.email})</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Inquiry Type:</strong> ${inquiryType}</p>
          ${organizationInfo}
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
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
      if (inquiryType === 'partnership' || data.subject.toLowerCase().includes('partner')) {
        // Send partner inquiry confirmation
        await sendPartnerInquiryConfirmation({
          to: data.email,
          name: contactName,
          organization: data.organizationName || data.organization,
          message: data.message
        });
        console.log('✅ Partner inquiry confirmation sent to:', data.email);
      } else {
        // Send general contact confirmation
        await sendCustomEmail(
          data.email,
          '[Contact] Thank you for contacting New Steps Project',
          `
            <h1>Thank you for reaching out!</h1>
            <p>Dear ${contactName},</p>
            <p>We've received your message and will get back to you within 24-48 hours during business days.</p>
            
            <h2>Your Message:</h2>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              ${data.message.replace(/\n/g, '<br>')}
            </div>
            
            <p>If you have any urgent questions, please don't hesitate to call us at ${(await getAppSettings()).projectPhone}.</p>
            
            <p>Best regards,<br>
            The New Steps Project Team<br>
            Email: ${await getEmailAddress('contact')}</p>
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
