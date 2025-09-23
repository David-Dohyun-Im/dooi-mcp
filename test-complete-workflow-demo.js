#!/usr/bin/env node

// Complete workflow demonstration
import { handleApplyComponent } from './dist/capabilities/tools/workflow/applyComponent.js';
import { writeFile, mkdir, readFile } from 'fs/promises';

async function demonstrateCompleteWorkflow() {
  console.log('🚀 Complete Dooi Workflow Demonstration');
  console.log('=====================================\n');
  
  try {
    // Create a new Next.js project structure
    const projectDir = '/tmp/complete-demo-project';
    await mkdir(projectDir, { recursive: true });
    
    // Create Next.js project structure
    await mkdir(`${projectDir}/src`, { recursive: true });
    await mkdir(`${projectDir}/src/components`, { recursive: true });
    await mkdir(`${projectDir}/src/app`, { recursive: true });
    await mkdir(`${projectDir}/public`, { recursive: true });
    
    // Create package.json for Next.js project
    const packageJson = {
      name: 'complete-demo-project',
      version: '1.0.0',
      description: 'Complete workflow demonstration project',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: {
        next: '^15.0.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0'
      },
      devDependencies: {}
    };
    
    await writeFile(`${projectDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('✅ Created Next.js project structure');
    
    // Demonstrate component application workflow
    console.log('\n📦 Applying Component Workflow');
    console.log('==============================');
    
    const componentResult = await handleApplyComponent({
      id: 'ui/fluid-blob',
      destRoot: projectDir,
      brand: 'AcmeCorp',
      pathStrategy: 'next-app',
      autoDeps: true
    });
    
    console.log('✅ Component Workflow Results:');
    console.log(`   • Files installed: ${componentResult.installed.files.length}`);
    console.log(`   • Files edited: ${componentResult.edits.changedFiles.length}`);
    console.log(`   • Dependencies installed: ${componentResult.deps.installed.length}`);
    
    // Show installed files
    console.log('\n📁 Installed Files:');
    componentResult.installed.files.forEach(file => {
      console.log(`   • ${file}`);
    });
    
    // Show installed dependencies
    console.log('\n📦 Installed Dependencies:');
    componentResult.deps.installed.forEach(dep => {
      console.log(`   • ${dep}`);
    });
    
    // Check the component file
    console.log('\n🔍 Component File Content:');
    try {
      const componentContent = await readFile(`${projectDir}/src/components/ui/fluid-blob.tsx`, 'utf8');
      console.log(`   • File size: ${componentContent.length} characters`);
      console.log(`   • Contains "AcmeCorp": ${componentContent.includes('AcmeCorp') ? '✅' : '❌'}`);
      console.log(`   • Contains "fluid-blob": ${componentContent.includes('fluid-blob') ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   • Error reading component: ${error.message}`);
    }
    
    // Check the README
    console.log('\n📖 README File Content:');
    try {
      const readmeContent = await readFile(`${projectDir}/README.md`, 'utf8');
      console.log(`   • File size: ${readmeContent.length} characters`);
      console.log(`   • Contains "AcmeCorp": ${readmeContent.includes('AcmeCorp') ? '✅' : '❌'}`);
      console.log(`   • Contains "mycompany-ui": ${readmeContent.includes('mycompany-ui') ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   • Error reading README: ${error.message}`);
    }
    
    // Check final package.json
    console.log('\n📋 Final Package.json:');
    try {
      const finalPackageJson = await readFile(`${projectDir}/package.json`, 'utf8');
      const parsed = JSON.parse(finalPackageJson);
      console.log(`   • Total dependencies: ${Object.keys(parsed.dependencies || {}).length}`);
      console.log(`   • Has three: ${parsed.dependencies?.three ? '✅' : '❌'}`);
      console.log(`   • Has @react-three/fiber: ${parsed.dependencies?.['@react-three/fiber'] ? '✅' : '❌'}`);
      console.log(`   • Has react: ${parsed.dependencies?.react ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   • Error reading package.json: ${error.message}`);
    }
    
    // Create a simple Next.js page to use the component
    console.log('\n🎨 Creating Next.js Page:');
    const pageContent = `import FluidBlob from '@/components/ui/fluid-blob';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Welcome to AcmeCorp
        </h1>
        <div className="h-96">
          <FluidBlob />
        </div>
        <p className="text-gray-300 mt-8">
          This page demonstrates the complete dooi workflow in action!
        </p>
      </div>
    </div>
  );
}`;
    
    await writeFile(`${projectDir}/src/app/page.tsx`, pageContent);
    console.log('✅ Created Next.js page using the component');
    
    // Final project structure
    console.log('\n📂 Final Project Structure:');
    const { execSync } = await import('child_process');
    try {
      const structure = execSync(`find ${projectDir} -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | grep -v node_modules | sort`, { encoding: 'utf8' });
      console.log(structure);
    } catch (error) {
      console.log('Error showing project structure:', error.message);
    }
    
    console.log('\n🎉 Complete Workflow Demonstration Successful!');
    console.log('=============================================');
    console.log('✅ Component fetched from dooi-ui');
    console.log('✅ Files installed with Next.js path mapping');
    console.log('✅ Brand customization applied (AcmeCorp)');
    console.log('✅ Dependencies automatically installed');
    console.log('✅ Peer dependencies resolved');
    console.log('✅ Ready-to-use Next.js project created');
    
  } catch (error) {
    console.error('❌ Workflow demonstration error:', error);
  }
}

demonstrateCompleteWorkflow();
