'use server';

import { spawn } from 'child_process';
import path from 'path';

export async function fetchEmails(clientId: string, refreshToken: string, userEmail: string) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), 'scripts', 'wrapper.py');
        const pythonProcess = spawn('python3', [
            scriptPath,
            '--client-id', clientId,
            '--refresh-token', refreshToken,
            '--email', userEmail
        ]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Error: ${errorString}`);
                reject(new Error(`Script failed with code ${code}: ${errorString}`));
                return;
            }

            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                console.error('Failed to parse JSON:', dataString);
                reject(new Error('Failed to parse Python script output'));
            }
        });

        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to spawn Python process: ${err.message}`));
        });
    });
}

export async function deleteEmail(messageId: string, clientId: string, refreshToken: string, userEmail: string) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), 'scripts', 'delete_email.py');
        const pythonProcess = spawn('python3', [
            scriptPath,
            '--message-id', messageId,
            '--client-id', clientId,
            '--refresh-token', refreshToken,
            '--email', userEmail
        ]);
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Error: ${errorString}`);
                reject(new Error(`Script failed with code ${code}: ${errorString}`));
                return;
            }

            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                console.error('Failed to parse JSON:', dataString);
                reject(new Error('Failed to parse Python script output'));
            }
        });

        pythonProcess.on('error', (err) => {
            reject(new Error(`Failed to spawn Python process: ${err.message}`));
        });
    });
}
