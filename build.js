const fs = require('fs-extra');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Error: Missing required environment variable ${envVar}`);
        process.exit(1);
    }
}

// Firebase configuration template
const firebaseConfigTemplate = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Function to replace placeholders in a file
async function processFile(inputPath, outputPath) {
    let content = await fs.readFile(inputPath, 'utf8');

    // Replace Firebase config placeholder with actual values
    content = content.replace(
        /const firebaseConfig = {[\s\S]*?};/,
        `const firebaseConfig = ${JSON.stringify(firebaseConfigTemplate, null, 2)};`
    );

    // Write the processed file to the output directory
    await fs.outputFile(outputPath, content);
}

// Process both HTML files
async function build() {
    try {
        // Ensure output directory exists
        await fs.ensureDir('dist');

        // Process index.html
        await processFile('index.html', 'dist/index.html');

        // Process view.html
        await processFile('view.html', 'dist/view.html');

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
