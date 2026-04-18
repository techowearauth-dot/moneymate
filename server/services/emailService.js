const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. In development, if no real credentials, just log it
    if (process.env.NODE_ENV === 'development' && 
        (process.env.EMAIL_USER === 'your_email@gmail.com' || !process.env.EMAIL_PASS)) {
        console.log('-----------------------------------------');
        console.log('MOCK EMAIL SENT');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body snippet (full HTML removed for brevity):', options.html.substring(0, 100) + '...');
        console.log('-----------------------------------------');
        return;
    }

    // 2. Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // 3. Define the email options
    const mailOptions = {
        from: `Vaultify <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    // 4. Send the email
    await transporter.sendMail(mailOptions);
};

exports.sendResetPasswordEmail = async (user, resetUrl) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6C63FF; margin: 0;">Vaultify</h1>
            </div>
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <h2 style="color: #333333; margin-top: 0;">Reset Your Password</h2>
                <p style="color: #555555; line-height: 1.6;">Hello ${user.name},</p>
                <p style="color: #555555; line-height: 1.6;">We received a request to reset your password for your Vaultify account. Click the button below to set a new password.</p>
                <p style="color: #EF4444; font-size: 14px; font-weight: bold; margin: 20px 0;">This link will expire in 10 minutes.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #6C63FF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                
                <p style="color: #555555; line-height: 1.6;">Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #6C63FF; font-size: 14px;">${resetUrl}</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999999; font-size: 12px;">
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} Vaultify. All rights reserved.</p>
            </div>
        </div>
    `;

    await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html
    });
};
