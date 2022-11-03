import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { EEnvKey } from '@constants/env.constant';

import { getTemplateDir } from '@modules/notify/email/helpers';

import { MAIL_QUEUE_NAME } from './email.const';
import { MailProcessor } from './email.processor';
import { EmailService } from './email.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    transport: {
                        host: config.get(EEnvKey.MAIL_SMTP_HOST),
                        secure: config.get(EEnvKey.MAIL_SMTP_SECURE) === 'true',
                        port: config.get(EEnvKey.MAIL_SMTP_PORT),
                        auth: {
                            user: config.get(EEnvKey.MAIL_SMTP_USER),
                            pass: config.get(EEnvKey.MAIL_SMTP_PASS),
                        },
                    },
                    defaults: {
                        from: config.get(EEnvKey.MAIL_SMTP_DEFAULT_FROM) ?? 'noreply@example.com',
                    },
                    preview: false,
                    template: {
                        dir: getTemplateDir(),
                        adapter: new PugAdapter(),
                        options: {
                            strict: true,
                        },
                    },
                };
            },
        }),
        BullModule.registerQueue({ name: MAIL_QUEUE_NAME }),
    ],
    providers: [EmailService, MailProcessor],
    controllers: [],
    exports: [EmailService],
})
export class EmailModule {}
