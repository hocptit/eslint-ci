import { join } from 'path';
import fs from 'fs';

export const getTemplateDir = () => {
    const devDir = join(process.cwd(), 'src', 'modules', 'notify', 'email', 'templates');
    const buildDir = join(process.cwd(), 'dist', 'modules', 'notify', 'email', 'templates');

    if (fs.existsSync(devDir)) return devDir;
    if (fs.existsSync(buildDir)) return buildDir;

    throw new Error('ERROR: template directory not exist!');
};
