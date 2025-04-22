#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check for environment variables
const privateKey = process.env.APPLE_PRIVATE_KEY 
  ? Buffer.from(process.env.APPLE_PRIVATE_KEY, "base64").toString("ascii")
  : fs.existsSync(path.join(process.cwd(), 'apple-key.p8')) 
    ? fs.readFileSync(path.join(process.cwd(), 'apple-key.p8'), 'utf8')
    : null;

const keyId = process.env.APPLE_KEY_ID;
const teamId = process.env.APPLE_TEAM_ID;

if (!privateKey || !keyId || !teamId) {
  console.error('Error: Missing required Apple Music credentials.');
  console.error('Make sure you have set APPLE_PRIVATE_KEY, APPLE_KEY_ID, and APPLE_TEAM_ID');
  console.error('Or have a "apple-key.p8" file in your project root');
  process.exit(1);
}

try {
  const token = jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    issuer: teamId,
    header: {
      alg: "ES256",
      kid: keyId
    }
  });

  if (process.env.GITHUB_ENV) {
    // Running in GitHub Actions
    fs.appendFileSync(process.env.GITHUB_ENV, `NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=${token}\n`);
    console.log('Apple Music token set in GitHub environment');
  } else {
    // Running locally
    console.log('Apple Music Token:', token);
    
    // Update .env file if it exists
    const envFile = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      let envContent = fs.readFileSync(envFile, 'utf8');
      
      // Replace existing token or add new one
      if (envContent.includes('NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=')) {
        envContent = envContent.replace(
          /NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=.*/,
          `NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=${token}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=${token}\n`;
      }
      
      fs.writeFileSync(envFile, envContent);
      console.log('Updated .env file with new token');
    } else {
      fs.writeFileSync(envFile, `NEXT_PUBLIC_MUSIC_KIT_DEVELOPER_TOKEN=${token}\n`);
      console.log('Created .env file with new token');
    }
  }
} catch (error) {
  console.error('Error generating token:', error.message);
  process.exit(1);
} 