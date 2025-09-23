/**
 * Tests for MCP resources system
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  getDooiResources, 
  getResourceContent, 
  isDooiResource,
  getResourceMetadata 
} from '../../src/capabilities/resources/index.js';
import { handleList, handleFetch } from '../../src/capabilities/tools/list.js';

// Mock the tool handlers
jest.mock('../../src/capabilities/tools/list.js', () => ({
  handleList: jest.fn(),
  handleFetch: jest.fn()
}));

describe('MCP Resources System', () => {
  const mockHandleList = handleList as jest.MockedFunction<typeof handleList>;
  const mockHandleFetch = handleFetch as jest.MockedFunction<typeof handleFetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getDooiResources', () => {
    it('should return resources from list result', async () => {
      const mockListResult = {
        items: [
          {
            id: 'ui/fluid-blob',
            type: 'component' as const,
            title: 'Fluid Blob',
            description: 'Animated fluid blob component'
          },
          {
            id: 'landing-morphic',
            type: 'template' as const,
            title: 'Morphic Landing',
            description: 'Morphic landing page template'
          }
        ],
        raw: {
          stdout: 'mock output',
          stderr: '',
          exitCode: 0
        }
      };

      mockHandleList.mockResolvedValue(mockListResult);

      const resources = await getDooiResources();

      expect(resources).toHaveLength(2);
      expect(resources[0]).toEqual({
        uri: 'dooi://component/ui/fluid-blob',
        name: 'component:ui/fluid-blob',
        description: 'Animated fluid blob component',
        mimeType: 'application/json',
        metadata: {
          type: 'component',
          id: 'ui/fluid-blob',
          title: 'Fluid Blob'
        }
      });
      expect(resources[1]).toEqual({
        uri: 'dooi://template/landing-morphic',
        name: 'template:landing-morphic',
        description: 'Morphic landing page template',
        mimeType: 'application/json',
        metadata: {
          type: 'template',
          id: 'landing-morphic',
          title: 'Morphic Landing'
        }
      });
    });

    it('should handle empty list result', async () => {
      mockHandleList.mockResolvedValue({
        items: [],
        raw: { stdout: '', stderr: '', exitCode: 0 }
      });

      const resources = await getDooiResources();

      expect(resources).toHaveLength(0);
    });

    it('should handle list errors gracefully', async () => {
      mockHandleList.mockRejectedValue(new Error('List failed'));

      const resources = await getDooiResources();

      expect(resources).toHaveLength(0);
    });
  });

  describe('getResourceContent', () => {
    it('should fetch and format resource content', async () => {
      const mockFetchResult = {
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx', 'package.json'],
        meta: {
          id: 'ui/fluid-blob',
          title: 'Fluid Blob',
          description: 'Animated component',
          dependencies: ['three', '@react-three/fiber'],
          peerDependencies: ['react', 'react-dom'],
          uses: [],
          codeBlock: 'const Component = () => <div>Hello</div>;'
        },
        raw: {
          stdout: 'mock stdout',
          stderr: '',
          exitCode: 0
        }
      };

      mockHandleFetch.mockResolvedValue(mockFetchResult);

      const content = await getResourceContent('dooi://component/ui/fluid-blob');

      expect(content).toBeDefined();
      expect(content!.uri).toBe('dooi://component/ui/fluid-blob');
      expect(content!.name).toBe('component:ui/fluid-blob');
      expect(content!.mimeType).toBe('application/json');
      expect(content!.content).toContain('"id":"ui/fluid-blob"');
      expect(content!.content).toContain('"dependencies":["three","@react-three/fiber"]');
      expect(content!.metadata).toEqual({
        type: 'component',
        id: 'ui/fluid-blob',
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx', 'package.json'],
        dependencies: ['three', '@react-three/fiber'],
        peerDependencies: ['react', 'react-dom']
      });
    });

    it('should handle invalid URI format', async () => {
      const content = await getResourceContent('invalid-uri');

      expect(content).toBeNull();
    });

    it('should handle fetch errors', async () => {
      mockHandleFetch.mockRejectedValue(new Error('Fetch failed'));

      const content = await getResourceContent('dooi://component/nonexistent');

      expect(content).toBeNull();
    });
  });

  describe('isDooiResource', () => {
    it('should identify dooi resource URIs', () => {
      expect(isDooiResource('dooi://component/ui/button')).toBe(true);
      expect(isDooiResource('dooi://template/landing')).toBe(true);
      expect(isDooiResource('https://example.com')).toBe(false);
      expect(isDooiResource('file:///path/to/file')).toBe(false);
      expect(isDooiResource('')).toBe(false);
    });
  });

  describe('getResourceMetadata', () => {
    it('should return metadata for valid dooi URIs', async () => {
      const metadata = await getResourceMetadata('dooi://component/ui/button');

      expect(metadata).toEqual({
        uri: 'dooi://component/ui/button',
        name: 'component:ui/button',
        description: 'component from dooi-ui',
        mimeType: 'application/json',
        metadata: {
          type: 'component',
          id: 'ui/button'
        }
      });
    });

    it('should return null for non-dooi URIs', async () => {
      const metadata = await getResourceMetadata('https://example.com');

      expect(metadata).toBeNull();
    });

    it('should handle malformed URIs', async () => {
      const metadata = await getResourceMetadata('dooi://invalid');

      expect(metadata).toBeNull();
    });
  });
});
