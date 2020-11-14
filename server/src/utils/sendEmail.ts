import nodemailer from "nodemailer";


export async function sendEmail(to: string, body: string) {
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, //true for 465, false for other ports
    auth: {
      user: "u2k5gmtpjzswr2tl@ethereal.email", // generated ethereal user
      pass: "JrBnyh1EUevuTZVRUz", // generated ethereal password
    },
  });

  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: to, // list of receivers
    subject: "Change password", 
    html: body
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
 
}

