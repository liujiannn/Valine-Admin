'use strict';
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs  = require('fs');
const path = require('path');
const transporter = nodemailer.createTransport({
    service : process.env.SMTP_SERVICE,  // see : https://nodemailer.com/smtp/well-known/
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});
let templateName = process.env.TEMPLATE_NAME ?  process.env.TEMPLATE_NAME : "default";
let noticeTemplate = ejs.compile(fs.readFileSync(path.resolve(process.cwd(), 'template', templateName, 'notice.ejs'), 'utf8'));
let sendTemplate = ejs.compile(fs.readFileSync(path.resolve(process.cwd(), 'template', templateName, 'send.ejs'), 'utf8'));
// 提醒站长
exports.notice = (comment) => {
    let emailSubject = '👉 咚！「' + process.env.SITE_NAME + '」上有新评论了';
    let emailContent =  noticeTemplate({
                            siteName: process.env.SITE_NAME,
                            siteUrl: process.env.SITE_URL,
                            name: comment.get('nick'),
                            text: comment.get('comment'),
                            url: process.env.SITE_URL + comment.get('url')
                        });

    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
        to: process.env.TO_EMAIL ? process.env.TO_EMAIL : process.env.SMTP_USER,
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("收到一条评论, 已提醒站长");
    });
}
// 发送邮件通知他人
exports.send = (currentComment, parentComment)=> {
    // 站长被 @ 不需要提醒
    if (parentComment.get('mail') === process.env.TO_EMAIL 
        || parentComment.get('mail') === process.env.SMTP_USER) {
        return;
    }
    let emailSubject = '👉 叮咚！「' + process.env.SITE_NAME + '」上有人@了你';
    let emailContent = sendTemplate({
                            siteName: process.env.SITE_NAME,
                            siteUrl: process.env.SITE_URL,
                            pname: parentComment.get('nick'),
                            ptext: parentComment.get('comment'),
                            name: currentComment.get('nick'),
                            text: currentComment.get('comment'),
                            url: process.env.SITE_URL + currentComment.get('url')
                        });
    let mailOptions = {
        from: '"' + process.env.SENDER_NAME + '" <' + process.env.SMTP_USER + '>',
        to: parentComment.get('mail'),
        subject: emailSubject,
        html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log(currentComment.get('nick') + " @了" + parentComment.get('nick') + ", 已通知.");
    });
};

// 该方法可验证 SMTP 是否配置正确
exports.verify = function(){
    console.log("....");
    transporter.verify(function(error, success) {
        if (error) {
            console.log(error);
        }
        console.log("Server is ready to take our messages");
    });    
};
