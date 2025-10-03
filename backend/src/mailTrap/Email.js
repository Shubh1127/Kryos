const {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
	WELCOME_EMAIL,
	OTP_LOGIN_TEMPLATE,
	LOGIN_SUCCESS_TEMPLATE,
	} = require("./EmailTemplate.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	service: "gmail",
	port: 465,
	priority: "high",
	secure: true,
	auth: {
		user: process.env.EMAIL_USER || "shubhamsinghmor2312@gmail.com",
		pass: process.env.EMAIL_PASS ,
	},
});


const sendVerificationEmail = async (email, verificationToken) => {
	try {
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
		})
		console.log("Email sent successfully");
	} catch (error) {
		console.error(`Error sending verification`, error);

		throw new Error(`Error sending verification email: ${error}`);
	}
};

const sendWelcomeEmail = async (email, name) => {
	try {
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Welcome Email",
			html: WELCOME_EMAIL.replace("{Name}", name),
		})

		console.log("Welcome email sent successfully");
	} catch (error) {
		console.error(`Error sending welcome email`, error);

		throw new Error(`Error sending welcome email: ${error}`);
	}
};

const sendPasswordResetEmail = async (email, resetURL) => {
	try {
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
		})
	} catch (error) {
		console.error(`Error sending password reset email`, error);

		throw new Error(`Error sending password reset email: ${error}`);
	}
};

const sendResetSuccessEmail = async (email) => {
	try {
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Password Reset Successful",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
		})
		console.log("Password reset email sent successfully");
	} catch (error) {
		console.error(`Error sending password reset success email`, error);

		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

const sendOtpLoginEmail = async (email, companyName, otpCode) => {
	try {
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Kryos Login OTP - " + otpCode,
			html: OTP_LOGIN_TEMPLATE
				.replace("{companyName}", companyName)
				.replace("{otpCode}", otpCode),
		})
		console.log("OTP login email sent successfully");
	} catch (error) {
		console.error(`Error sending OTP login email`, error);
		throw new Error(`Error sending OTP login email: ${error}`);
	}
};

const sendLoginSuccessEmail = async (email, companyName, dashboardUrl = "http://localhost:3000/dashboard") => {
	try {
		const loginTime = new Date().toLocaleString();
		await transporter.sendMail({
			from: "shubhamsinghmor2312@gmail.com",
			to: email,
			subject: "Successful Login to Kryos Dashboard",
			html: LOGIN_SUCCESS_TEMPLATE
				.replace(/{companyName}/g, companyName)
				.replace("{email}", email)
				.replace("{loginTime}", loginTime)
				.replace("{dashboardUrl}", dashboardUrl),
		})
		console.log("Login success email sent successfully");
	} catch (error) {
		console.error(`Error sending login success email`, error);
		throw new Error(`Error sending login success email: ${error}`);
	}
};

module.exports = {
	sendVerificationEmail,
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendResetSuccessEmail,
	sendOtpLoginEmail,
	sendLoginSuccessEmail
};