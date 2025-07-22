// Script to run the concurso preference frontend tests
import { execSync } from 'child_process';

try {
  console.log('Running concurso preference frontend tests...');
  
  // Create a simple test that verifies the error handling components
  execSync('npx vitest run --environment jsdom --config vitest.config.tsx', { 
    stdio: 'inherit',
    cwd: './frontend'
  });
  
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Tests failed:', error.message);
  process.exit(1);
}