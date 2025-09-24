/**
 * MCP Prompts for guided dooi operations
 */

import { logger } from '../../core/logger.js';
import { handleList } from '../tools/list.js';
import { ListItem } from '../../core/types.js';

export interface PromptInfo {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

/**
 * Get all available prompts
 */
export function getDooiPrompts(): PromptInfo[] {
  return [
    {
      name: 'getting-started',
      description: '🚀 RECOMMENDED: Get started with dooi-ui - Perfect for beginners! This will guide you through your first template installation.',
      arguments: [
        {
          name: 'projectType',
          description: 'What type of project do you want to create? (landing page, dashboard, blog, etc.)',
          required: true
        },
        {
          name: 'framework',
          description: 'Which framework do you prefer? (next, vite, nuxt, etc.)',
          required: false
        },
        {
          name: 'projectName',
          description: 'What would you like to name your project?',
          required: false
        }
      ]
    },
    {
      name: 'select-component',
      description: 'Guide the user to select a dooi component based on their needs',
      arguments: [
        {
          name: 'useCase',
          description: 'The use case or purpose for the component',
          required: true
        },
        {
          name: 'framework',
          description: 'The target framework (react, next, vue, etc.)',
          required: false
        },
        {
          name: 'style',
          description: 'Preferred style (minimal, modern, animated, etc.)',
          required: false
        }
      ]
    },
    {
      name: 'select-template',
      description: 'Guide the user to select a dooi template for their project',
      arguments: [
        {
          name: 'projectType',
          description: 'The type of project (landing, dashboard, blog, etc.)',
          required: true
        },
        {
          name: 'framework',
          description: 'The target framework (next, vite, nuxt, etc.)',
          required: false
        },
        {
          name: 'features',
          description: 'Required features (auth, payments, cms, etc.)',
          required: false
        }
      ]
    },
    {
      name: 'apply-component',
      description: 'Guide the user through applying a dooi component to their project',
      arguments: [
        {
          name: 'componentId',
          description: 'The ID of the component to apply',
          required: true
        },
        {
          name: 'projectPath',
          description: 'The path to the target project',
          required: true
        },
        {
          name: 'brandName',
          description: 'The brand name for customization',
          required: false
        }
      ]
    },
    {
      name: 'apply-template',
      description: 'Guide the user through applying a dooi template to create a new project',
      arguments: [
        {
          name: 'templateId',
          description: 'The ID of the template to apply',
          required: true
        },
        {
          name: 'projectPath',
          description: 'The path where to create the new project',
          required: true
        },
        {
          name: 'projectName',
          description: 'The name of the new project',
          required: false
        }
      ]
    }
  ];
}

/**
 * Execute a prompt with arguments
 */
export async function executePrompt(name: string, args: Record<string, any>): Promise<string> {
  logger.debug('Executing prompt', { name, args });
  
  switch (name) {
    case 'getting-started':
      return await executeGettingStartedPrompt(args);
    
    case 'select-component':
      return await executeSelectComponentPrompt(args);
    
    case 'select-template':
      return await executeSelectTemplatePrompt(args);
    
    case 'apply-component':
      return await executeApplyComponentPrompt(args);
    
    case 'apply-template':
      return await executeApplyTemplatePrompt(args);
    
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

/**
 * Execute getting started prompt
 */
async function executeGettingStartedPrompt(args: Record<string, any>): Promise<string> {
  const { projectType, framework, projectName } = args;
  
  try {
    // Get available templates
    const listResult = await handleList({});
    const templates = listResult.items.filter(item => item.type === 'template');
    
    if (templates.length === 0) {
      return `# Welcome to dooi-ui! 🚀\n\nUnfortunately, no templates are currently available. Please check if dooi-ui is properly installed and accessible.`;
    }
    
    let prompt = `# Welcome to dooi-ui! 🚀\n\n`;
    prompt += `You're about to create your first project with dooi-ui. This is the **RECOMMENDED** way to get started!\n\n`;
    
    prompt += `## Your Project Details\n\n`;
    prompt += `- **Project Type**: ${projectType}\n`;
    if (framework) prompt += `- **Framework**: ${framework}\n`;
    if (projectName) prompt += `- **Project Name**: ${projectName}\n\n`;
    
    prompt += `## Why Use Templates? 🎯\n\n`;
    prompt += `Templates are perfect for beginners because they:\n`;
    prompt += `- ✅ Include complete project structure\n`;
    prompt += `- ✅ Have all dependencies pre-configured\n`;
    prompt += `- ✅ Include best practices and examples\n`;
    prompt += `- ✅ Are ready to run immediately\n`;
    prompt += `- ✅ Support automatic customization\n\n`;
    
    prompt += `## Available Templates (${templates.length} total)\n\n`;
    
    for (const template of templates) {
      prompt += `- **${template.id}**: ${template.description}\n`;
    }
    
    prompt += `\n## Recommendations\n\n`;
    
    // Provide recommendations based on project type
    const recommendations = getTemplateRecommendations(projectType, framework, undefined, templates);
    if (recommendations.length > 0) {
      prompt += `Based on your project type, I recommend:\n\n`;
      for (const rec of recommendations) {
        prompt += `- **${rec.id}**: ${rec.description}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `## Next Steps - Apply Your First Template! 🚀\n\n`;
    prompt += `To create your project, use the **RECOMMENDED** workflow tool:\n\n`;
    prompt += `\`\`\`javascript\n`;
    prompt += `await dooi.workflow.applyTemplate({\n`;
    prompt += `  id: "template-id", // Choose from the templates above\n`;
    prompt += `  destRoot: "/path/to/your/project", // Where to create your project\n`;
    prompt += `  brand: "${projectName || 'YourBrand'}", // Your brand name\n`;
    prompt += `  pathStrategy: "${framework === 'vite' ? 'vite-react' : 'next-app'}", // Framework strategy\n`;
    prompt += `  autoDeps: true // Automatically install dependencies\n`;
    prompt += `});\n`;
    prompt += `\`\`\`\n\n`;
    
    prompt += `## What Happens Next? ✨\n\n`;
    prompt += `1. **Template Download**: The template will be fetched from dooi-ui\n`;
    prompt += `2. **File Installation**: All template files will be copied to your project\n`;
    prompt += `3. **Brand Customization**: Your brand name will be applied throughout\n`;
    prompt += `4. **Dependency Installation**: All required packages will be installed\n`;
    prompt += `5. **Ready to Go**: Your project will be ready to run!\n\n`;
    
    prompt += `## Alternative: Individual Components ⚡\n\n`;
    prompt += `If you prefer to add individual components to an existing project, you can use:\n`;
    prompt += `\`\`\`javascript\n`;
    prompt += `await dooi.workflow.applyComponent({\n`;
    prompt += `  id: "component-id",\n`;
    prompt += `  destRoot: "/path/to/existing/project"\n`;
    prompt += `});\n`;
    prompt += `\`\`\`\n\n`;
    
    prompt += `## Need Help? 🤝\n\n`;
    prompt += `- Use \`dooi_list\` to see all available templates and components\n`;
    prompt += `- Use \`dooi_workflow_applyTemplate\` for full project templates (RECOMMENDED)\n`;
    prompt += `- Use \`dooi_workflow_applyComponent\` for individual components\n`;
    
    return prompt;
    
  } catch (error) {
    logger.error('Failed to execute getting-started prompt', error);
    return `# Welcome to dooi-ui! 🚀\n\nError retrieving templates: ${error instanceof Error ? error.message : String(error)}\n\nPlease try again or check if dooi-ui is properly installed.`;
  }
}

/**
 * Execute component selection prompt
 */
async function executeSelectComponentPrompt(args: Record<string, any>): Promise<string> {
  const { useCase, framework, style } = args;
  
  try {
    // Get available components
    const listResult = await handleList({});
    const components = listResult.items.filter(item => item.type === 'component');
    
    if (components.length === 0) {
      return `No components available. Please check if dooi-ui is properly installed and accessible.`;
    }
    
    let prompt = `# Component Selection Guide\n\n`;
    prompt += `Based on your requirements:\n`;
    prompt += `- **Use Case**: ${useCase}\n`;
    if (framework) prompt += `- **Framework**: ${framework}\n`;
    if (style) prompt += `- **Style**: ${style}\n\n`;
    
    prompt += `## Available Components (${components.length} total)\n\n`;
    
    // Group components by category if possible
    const categorizedComponents = categorizeComponents(components);
    
    for (const [category, items] of Object.entries(categorizedComponents)) {
      prompt += `### ${category}\n\n`;
      
      for (const component of items) {
        prompt += `- **${component.id}**: ${component.description}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `## Recommendations\n\n`;
    
    // Provide recommendations based on use case
    const recommendations = getComponentRecommendations(useCase, framework, style, components);
    if (recommendations.length > 0) {
      prompt += `Based on your requirements, I recommend:\n\n`;
      for (const rec of recommendations) {
        prompt += `- **${rec.id}**: ${rec.description}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `## Next Steps\n\n`;
    prompt += `To apply a component, use:\n`;
    prompt += `\`\`\`\n`;
    prompt += `dooi.workflow.applyComponent({\n`;
    prompt += `  id: "component-id",\n`;
    prompt += `  destRoot: "/path/to/your/project",\n`;
    prompt += `  brand: "YourBrand",\n`;
    prompt += `  pathStrategy: "next-app" // or "vite-react"\n`;
    prompt += `})\n`;
    prompt += `\`\`\`\n`;
    
    return prompt;
    
  } catch (error) {
    logger.error('Failed to execute select-component prompt', error);
    return `Error retrieving components: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Execute template selection prompt
 */
async function executeSelectTemplatePrompt(args: Record<string, any>): Promise<string> {
  const { projectType, framework, features } = args;
  
  try {
    // Get available templates
    const listResult = await handleList({});
    const templates = listResult.items.filter(item => item.type === 'template');
    
    if (templates.length === 0) {
      return `No templates available. Please check if dooi-ui is properly installed and accessible.`;
    }
    
    let prompt = `# Template Selection Guide\n\n`;
    prompt += `Based on your requirements:\n`;
    prompt += `- **Project Type**: ${projectType}\n`;
    if (framework) prompt += `- **Framework**: ${framework}\n`;
    if (features) prompt += `- **Features**: ${features}\n\n`;
    
    prompt += `## Available Templates (${templates.length} total)\n\n`;
    
    for (const template of templates) {
      prompt += `- **${template.id}**: ${template.description}\n`;
    }
    
    prompt += `\n## Recommendations\n\n`;
    
    // Provide recommendations based on project type
    const recommendations = getTemplateRecommendations(projectType, framework, features, templates);
    if (recommendations.length > 0) {
      prompt += `Based on your requirements, I recommend:\n\n`;
      for (const rec of recommendations) {
        prompt += `- **${rec.id}**: ${rec.description}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `## Next Steps\n\n`;
    prompt += `To apply a template, use:\n`;
    prompt += `\`\`\`\n`;
    prompt += `dooi.workflow.applyTemplate({\n`;
    prompt += `  id: "template-id",\n`;
    prompt += `  destRoot: "/path/to/new/project",\n`;
    prompt += `  brand: "YourBrand"\n`;
    prompt += `})\n`;
    prompt += `\`\`\`\n`;
    
    return prompt;
    
  } catch (error) {
    logger.error('Failed to execute select-template prompt', error);
    return `Error retrieving templates: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Execute component application prompt
 */
async function executeApplyComponentPrompt(args: Record<string, any>): Promise<string> {
  const { componentId, projectPath, brandName } = args;
  
  let prompt = `# Component Application Guide\n\n`;
  prompt += `Applying component: **${componentId}**\n`;
  prompt += `Target project: **${projectPath}**\n`;
  if (brandName) prompt += `Brand: **${brandName}**\n`;
  
  prompt += `\n## Application Steps\n\n`;
  prompt += `1. **Fetch Component**: Download component from dooi-ui\n`;
  prompt += `2. **Install Files**: Copy component files to project\n`;
  prompt += `3. **Customize Brand**: Apply brand customization\n`;
  prompt += `4. **Install Dependencies**: Install required packages\n`;
  prompt += `5. **Install Peer Dependencies**: Install peer dependencies\n\n`;
  
  prompt += `## Command to Execute\n\n`;
  prompt += `\`\`\`javascript\n`;
  prompt += `await dooi.workflow.applyComponent({\n`;
  prompt += `  id: "${componentId}",\n`;
  prompt += `  destRoot: "${projectPath}",\n`;
  if (brandName) {
    prompt += `  brand: "${brandName}",\n`;
  }
  prompt += `  pathStrategy: "next-app", // or "vite-react"\n`;
  prompt += `  autoDeps: true\n`;
  prompt += `});\n`;
  prompt += `\`\`\`\n\n`;
  
  prompt += `## Expected Results\n\n`;
  prompt += `- Component files installed in project\n`;
  prompt += `- Brand customization applied\n`;
  prompt += `- Dependencies automatically installed\n`;
  prompt += `- Ready-to-use component in your project\n`;
  
  return prompt;
}

/**
 * Execute template application prompt
 */
async function executeApplyTemplatePrompt(args: Record<string, any>): Promise<string> {
  const { templateId, projectPath, projectName } = args;
  
  let prompt = `# Template Application Guide\n\n`;
  prompt += `Applying template: **${templateId}**\n`;
  prompt += `Target path: **${projectPath}**\n`;
  if (projectName) prompt += `Project name: **${projectName}**\n`;
  
  prompt += `\n## Application Steps\n\n`;
  prompt += `1. **Fetch Template**: Download template from dooi-ui\n`;
  prompt += `2. **Install Files**: Copy template files to project directory\n`;
  prompt += `3. **Customize Brand**: Apply brand customization\n`;
  prompt += `4. **Install Dependencies**: Install all required packages\n`;
  prompt += `5. **Setup Project**: Initialize project structure\n\n`;
  
  prompt += `## Command to Execute\n\n`;
  prompt += `\`\`\`javascript\n`;
  prompt += `await dooi.workflow.applyTemplate({\n`;
  prompt += `  id: "${templateId}",\n`;
  prompt += `  destRoot: "${projectPath}",\n`;
  prompt += `  brand: "${projectName || 'YourBrand'}",\n`;
  prompt += `  pathStrategy: "next-app", // or "vite-react"\n`;
  prompt += `  autoDeps: true\n`;
  prompt += `});\n`;
  prompt += `\`\`\`\n\n`;
  
  prompt += `## Expected Results\n\n`;
  prompt += `- Complete project structure created\n`;
  prompt += `- All template files installed\n`;
  prompt += `- Brand customization applied\n`;
  prompt += `- Dependencies automatically installed\n`;
  prompt += `- Ready-to-run project\n`;
  
  return prompt;
}

/**
 * Categorize components by their ID patterns
 */
function categorizeComponents(components: ListItem[]): Record<string, ListItem[]> {
  const categories: Record<string, ListItem[]> = {
    'UI Components': [],
    'Hero Sections': [],
    'Cards & Layout': [],
    'Forms & Inputs': [],
    'Navigation': [],
    'Other': []
  };
  
  for (const component of components) {
    const id = component.id.toLowerCase();
    
    if (id.includes('hero')) {
      categories['Hero Sections']!.push(component);
    } else if (id.includes('card') || id.includes('grid') || id.includes('layout')) {
      categories['Cards & Layout']!.push(component);
    } else if (id.includes('form') || id.includes('input') || id.includes('button')) {
      categories['Forms & Inputs']!.push(component);
    } else if (id.includes('nav') || id.includes('menu') || id.includes('header')) {
      categories['Navigation']!.push(component);
    } else if (id.startsWith('ui/')) {
      categories['UI Components']!.push(component);
    } else {
      categories['Other']!.push(component);
    }
  }
  
  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([, items]) => items.length > 0)
  );
}

/**
 * Get component recommendations based on use case
 */
function getComponentRecommendations(
  useCase: string, 
  framework?: string, 
  style?: string, 
  components: ListItem[] = []
): ListItem[] {
  const recommendations: ListItem[] = [];
  const useCaseLower = useCase.toLowerCase();
  
  // Simple recommendation logic based on use case keywords
  for (const component of components) {
    const id = component.id.toLowerCase();
    const description = component.description.toLowerCase();
    
    if (useCaseLower.includes('hero') && id.includes('hero')) {
      recommendations.push(component);
    } else if (useCaseLower.includes('card') && (id.includes('card') || id.includes('grid'))) {
      recommendations.push(component);
    } else if (useCaseLower.includes('form') && (id.includes('form') || id.includes('input'))) {
      recommendations.push(component);
    } else if (useCaseLower.includes('navigation') && (id.includes('nav') || id.includes('menu'))) {
      recommendations.push(component);
    }
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}

/**
 * Get template recommendations based on project type
 */
function getTemplateRecommendations(
  projectType: string,
  framework?: string,
  features?: string,
  templates: ListItem[] = []
): ListItem[] {
  const recommendations: ListItem[] = [];
  const projectTypeLower = projectType.toLowerCase();
  
  // Simple recommendation logic based on project type keywords
  for (const template of templates) {
    const id = template.id.toLowerCase();
    const description = template.description.toLowerCase();
    
    if (projectTypeLower.includes('landing') && (id.includes('landing') || description.includes('landing'))) {
      recommendations.push(template);
    } else if (projectTypeLower.includes('dashboard') && (id.includes('dashboard') || description.includes('dashboard'))) {
      recommendations.push(template);
    } else if (projectTypeLower.includes('blog') && (id.includes('blog') || description.includes('blog'))) {
      recommendations.push(template);
    }
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
}
