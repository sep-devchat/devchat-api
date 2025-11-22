import * as mailer from "nodemailer";
import { Env } from "./env";

const port = Env.EMAIL_PORT ?? 587;
const secure = Env.EMAIL_SECURE ?? (port === 465 ? true : false);

const transporter = mailer.createTransport({
	host: Env.EMAIL_HOST,
	port,
	secure,
	auth: {
		user: Env.EMAIL_USER,
		pass: Env.EMAIL_PASS,
	},
});

export async function sendVerificationEmail(emailTo: string, token: string) {
	const verifyUrl = `${Env.FRONTEND_VERIFY_URL}?token=${token}`;
	const mailOptions = {
		from: Env.EMAIL_FROM,
		to: emailTo,
		subject: "Verify your email address",
		html: `
            <p>Please click the link below to verify your email address:</p>
            <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-align: center; text-decoration: none; display: inline-block;">Verify Account</a>
            <p>If you did not request this, please ignore this email.</p>
        `,
	};
	try {
		await transporter.sendMail(mailOptions);
	} catch (err: any) {
		const reason = err?.response || err?.message || "Unknown error";
		throw new Error(`Failed to send verification email: ${reason}`);
	}
}

export async function sendPasswordResetCode(emailTo: string, code: string) {
	const mailOptions = {
		from: Env.EMAIL_FROM,
		to: emailTo,
		subject: "Your DevChat password reset code",
		html: `
            <p>Use the following verification code to reset your password:</p>
            <p style="font-size: 20px; font-weight: bold;">${code}</p>
            <p>This code will expire in 15 minutes. If you did not request this, you can ignore this email.</p>
        `,
	};
	try {
		await transporter.sendMail(mailOptions);
	} catch (err: any) {
		const reason = err?.response || err?.message || "Unknown error";
		throw new Error(`Failed to send password reset code: ${reason}`);
	}
}

export async function sendReminderEmailVerification(
	emailTo: string,
	username: string,
	dayLeft: number,
) {
	const mailOptions = {
		from: Env.EMAIL_FROM,
		to: emailTo,
		subject: "Reminder: Verify your DevChat email address",
		html: `
			<h3>Hi ${username},</h3>
			<p>This is a friendly reminder to verify your email address for your DevChat account.</p>
			<p>Please verify your email within the next <span style="font-weight: bold;color: red;">${dayLeft}</span> day(s) to continue enjoying our services without interruption.</p>
			<p>Go to your account settings to resend the verification email.</p>
			<p>If you have already verified your email, please disregard this message.</p>
		`,
	};
	try {
		await transporter.sendMail(mailOptions);
	} catch (err: any) {
		const reason = err?.response || err?.message || "Unknown error";
		throw new Error(`Failed to send reminder email: ${reason}`);
	}
}
