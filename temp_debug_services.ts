
import { db } from './src/db/index';
import { services } from './src/db/schema';
import fs from 'fs';

async function listServices() {
    try {
        const allServices = await db.select().from(services);
        const output = allServices.map(s => `ID: '${s.id}', Name: ${s.name}`).join('\n');
        fs.writeFileSync('temp_services_output.txt', output);
        console.log('Written to file.');
    } catch (err) {
        console.error(err);
        fs.writeFileSync('temp_services_output.txt', 'Error: ' + err);
    }
}

listServices();
