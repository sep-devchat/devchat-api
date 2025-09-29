import * as mailer from "nodemailer";
import { Env } from "./env";

const transporter = mailer.createTransport({
	host: Env.EMAIL_HOST,
	port: Env.EMAIL_PORT,
	secure: false, // true for 465, false for other ports
	auth: {
		user: Env.EMAIL_USER,
		pass: Env.EMAIL_PASS,
	},
});

export async function sendVerificationEmail(emailTo: string, token: string) {
	const verifyUrl = `${Env.FRONTEND_VERIFY_URL}/verify-email?token=${token}`;
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

	await transporter.sendMail(mailOptions);
}
