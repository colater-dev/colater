/**
 * Brand API Keys Tab Component
 * Manages API keys for brand MCP server access
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, Key, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/firebase';

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: {
    read: boolean;
    validate: boolean;
    generate: boolean;
    modify: boolean;
  };
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
}

interface BrandAPIKeysTabProps {
  brandId: string;
  brandName: string;
  userId: string;
}

export function BrandAPIKeysTab({ brandId, brandName, userId }: BrandAPIKeysTabProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'owner' | 'team' | 'developer'>('team');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { toast } = useToast();
  const auth = useAuth();

  // Load API keys
  useEffect(() => {
    loadAPIKeys();
  }, [brandId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAPIKeys() {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`/api/brands/${brandId}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load API keys');
      }

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error: unknown) {
      console.error('Error loading API keys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function createAPIKey() {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`/api/brands/${brandId}/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          permissionType: newKeyType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      setNewlyCreatedKey(data.key);
      setShowNewKeyDialog(true);
      setNewKeyName('');
      setNewKeyType('team');

      // Reload keys
      await loadAPIKeys();

      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
    } catch (error: unknown) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function revokeAPIKey(keyId: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const response = await fetch(`/api/brands/${brandId}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      toast({
        title: 'Success',
        description: 'API key revoked successfully',
      });

      // Reload keys
      await loadAPIKeys();
    } catch (error: unknown) {
      console.error('Error revoking API key:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke API key',
        variant: 'destructive',
      });
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  }

  function generateMCPConfig(key: string): string {
    return JSON.stringify(
      {
        mcpServers: {
          [`colater-${brandName.toLowerCase().replace(/\s+/g, '-')}`]: {
            command: 'npx',
            args: ['-y', '@colater/mcp-server'],
            env: {
              COLATER_API_KEY: key,
              COLATER_BRAND_ID: brandId,
            },
          },
        },
      },
      null,
      2
    );
  }

  function getPermissionLabel(permissions: APIKey['permissions']): string {
    if (permissions.modify) return 'Full Access';
    if (permissions.generate) return 'Read + Generate';
    if (permissions.validate) return 'Read + Validate';
    return 'Read Only';
  }

  return (
    <div className="space-y-6">
      {/* Personal Access */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 Your Personal Access</CardTitle>
          <CardDescription>
            Full access to brand settings and AI generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., My Personal Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="keyType">Access Level</Label>
              <Select value={newKeyType} onValueChange={(value: string) => setNewKeyType(value as 'owner' | 'team' | 'developer')}>
                <SelectTrigger id="keyType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Full Access</SelectItem>
                  <SelectItem value="team">Team (Read + Validate)</SelectItem>
                  <SelectItem value="developer">Developer (Read + Generate)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createAPIKey} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            Manage API keys for this brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No API keys yet. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{key.name}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {getPermissionLabel(key.permissions)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {key.keyPrefix}
                      </code>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Created {new Date(key.createdAt).toLocaleDateString()} •{' '}
                      {key.usageCount} uses
                      {key.lastUsedAt && (
                        <> • Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeAPIKey(key.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Sharing */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Team Access</CardTitle>
          <CardDescription>
            Share brand access with your team (coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Invite team members via email, generate shareable setup links, and manage team permissions.
          </p>
        </CardContent>
      </Card>

      {/* New Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Save this API key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>API Key</Label>
              <div className="flex gap-2 mt-1">
                <Input value={newlyCreatedKey || ''} readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newlyCreatedKey!, 'API key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>MCP Server Config</Label>
              <div className="flex gap-2 mt-1">
                <textarea
                  className="flex-1 font-mono text-xs border rounded p-2 min-h-[200px]"
                  value={newlyCreatedKey ? generateMCPConfig(newlyCreatedKey) : ''}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      newlyCreatedKey ? generateMCPConfig(newlyCreatedKey) : '',
                      'Config'
                    )
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-blue-900">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Copy the config above</li>
                <li>Add it to your Claude Desktop config file</li>
                <li>Restart Claude Desktop</li>
              </ol>
              <a
                href="https://docs.colater.ai/mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
              >
                View setup guide <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
