import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';

@Console()
@Injectable()
export class SeederConsole {
    @Command({
        command: 'seeding-data',
        description: 'Seeding pool data',
    })
    async handle(): Promise<void> {
        console.log('Seeding...');
    }
}
