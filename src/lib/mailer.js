import nodemailer from "nodemailer";

export function getTransport() {
	const host = process.env.SMTP_HOST;
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;

	if (!host || !user || !pass) {
		throw new Error("Missing SMTP configuration: SMTP_HOST, SMTP_USER, SMTP_PASS");
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		auth: { user, pass }
	});
}

export async function sendEmail({ to, subject, text, html, attachments }) {
	const transporter = getTransport();
	return transporter.sendMail({
		from: process.env.SMTP_FROM || process.env.SMTP_USER,
		to,
		subject,
		text,
		html,
		attachments
	});
}


