import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmail } from '@/lib/email';

// Define the partnership form data type
type PartnershipFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organizationName: string;
  organizationType: string;
  partnershipInterest: string;
  message: string;
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data: PartnershipFormData = await request.json();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.organizationName || !data.organizationType || !data.partnershipInterest || !data.message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    
    console.log('Partnership inquiry submitted:', {
      name: fullName,
      email: data.email,
      organization: data.organizationName,
      type: data.organizationType,
      interest: data.partnershipInterest
    });
    
    // Send confirmation email to the partner
    try {
      const subject = '[Partnership] Inquiry Received - New Steps Project';
      const htmlContent = `
        <h2>Partnership Inquiry Confirmation</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for your interest in partnering with the New Steps Project! We have received your partnership inquiry and will review it carefully.</p>
        
        <h3>Your Inquiry Details:</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        <p><strong>Organization:</strong> ${data.organizationName}</p>
        <p><strong>Organization Type:</strong> ${data.organizationType}</p>
        <p><strong>Partnership Interest:</strong> ${data.partnershipInterest}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #007bff;">${data.message}</p>
        
        <p>Our team will review your inquiry and get back to you within 2-3 business days. We're excited about the possibility of working together to help young athletes get the sports shoes they need!</p>
        
        <p>If you have any immediate questions, please don't hesitate to contact us at newstepsfit@gmail.com.</p>
        
        <p>Best regards,<br>The New Steps Project Team</p>
      `;
      
      await sendCustomEmail(data.email, subject, htmlContent);
      console.log('✅ Partnership confirmation email sent successfully to:', data.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send partnership confirmation email:', emailError);
      // Don't fail the entire request if email fails - just log the error
    }
    
    // Send notification email to admin
    try {
      const adminSubject = '[Partnership] New Partnership Inquiry - New Steps Project';
      const adminHtmlContent = `
        <h2>New Partnership Inquiry Received</h2>
        <p>A new partnership inquiry has been submitted:</p>
        
        <h3>Contact Information:</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        
        <h3>Organization Details:</h3>
        <p><strong>Organization:</strong> ${data.organizationName}</p>
        <p><strong>Type:</strong> ${data.organizationType}</p>
        <p><strong>Partnership Interest:</strong> ${data.partnershipInterest}</p>
        
        <h3>Message:</h3>
        <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #007bff;">${data.message}</p>
        
        <p>Please follow up with this inquiry within 2-3 business days.</p>
      `;
      
      await sendCustomEmail('newstepsfit@gmail.com', adminSubject, adminHtmlContent);
      console.log('✅ Partnership admin notification email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send partnership admin notification email:', emailError);
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Partnership inquiry submitted successfully. We will get back to you within 2-3 business days.'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting partnership inquiry:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit partnership inquiry', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
