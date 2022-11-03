import { Module } from '@nestjs/common';

import { SeederConsole } from '@modules//seeder/seeder.console';

@Module({
    controllers: [],
    providers: [SeederConsole],
    exports: [],
})
export class SeederModule {}
