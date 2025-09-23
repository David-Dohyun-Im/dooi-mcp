/**
 * MCP Resources for dooi templates and components
 */

import { logger } from '../../core/logger.js';
import { handleList } from '../tools/list.js';
import { handleFetch } from '../tools/fetch.js';
import { ListItem } from '../../core/types.js';

export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  content?: string;
  metadata?: Record<string, any>;
}

/**
 * Get all available dooi resources
 */
export async function getDooiResources(): Promise<ResourceInfo[]> {
  try {
    logger.debug('Getting dooi resources');
    
    const listResult = await handleList({});
    const resources: ResourceInfo[] = [];
    
    for (const item of listResult.items) {
      // Create resource for each item
      resources.push({
        uri: `dooi://${item.type}/${item.id}`,
        name: `${item.type}:${item.id}`,
        description: item.description,
        mimeType: 'application/json',
        metadata: {
          type: item.type,
          id: item.id,
          title: item.title
        }
      });
    }
    
    logger.debug('Retrieved dooi resources', { count: resources.length });
    return resources;
    
  } catch (error) {
    logger.error('Failed to get dooi resources', error);
    return [];
  }
}

/**
 * Get specific resource content
 */
export async function getResourceContent(uri: string): Promise<ResourceInfo | null> {
  try {
    logger.debug('Getting resource content', { uri });
    
    // Parse URI: dooi://type/id
    const match = uri.match(/^dooi:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      logger.warn('Invalid dooi resource URI', { uri });
      return null;
    }
    
    const [, type, id] = match;
    
    // Fetch the resource
    const fetchResult = await handleFetch({ id });
    
    const resource: ResourceInfo = {
      uri,
      name: `${type}:${id}`,
      description: fetchResult.meta.description || 'Component from dooi-ui',
      mimeType: 'application/json',
      content: JSON.stringify({
        id: fetchResult.meta.id,
        title: fetchResult.meta.title,
        description: fetchResult.meta.description,
        dependencies: fetchResult.meta.dependencies,
        peerDependencies: fetchResult.meta.peerDependencies,
        uses: fetchResult.meta.uses,
        files: fetchResult.files,
        stageDir: fetchResult.stageDir,
        codeBlock: fetchResult.meta.codeBlock
      }, null, 2),
      metadata: {
        type,
        id,
        stageDir: fetchResult.stageDir,
        files: fetchResult.files,
        dependencies: fetchResult.meta.dependencies,
        peerDependencies: fetchResult.meta.peerDependencies
      }
    };
    
    logger.debug('Retrieved resource content', { uri, contentLength: resource.content?.length });
    return resource;
    
  } catch (error) {
    logger.error('Failed to get resource content', { uri, error });
    return null;
  }
}

/**
 * Check if URI is a dooi resource
 */
export function isDooiResource(uri: string): boolean {
  return uri.startsWith('dooi://');
}

/**
 * Get resource metadata without content
 */
export async function getResourceMetadata(uri: string): Promise<ResourceInfo | null> {
  if (!isDooiResource(uri)) {
    return null;
  }
  
  try {
    // Parse URI to get basic info
    const match = uri.match(/^dooi:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      return null;
    }
    
    const [, type, id] = match;
    
    return {
      uri,
      name: `${type}:${id}`,
      description: `${type} from dooi-ui`,
      mimeType: 'application/json',
      metadata: {
        type,
        id
      }
    };
    
  } catch (error) {
    logger.error('Failed to get resource metadata', { uri, error });
    return null;
  }
}
