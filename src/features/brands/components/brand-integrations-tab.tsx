/**
 * Brand Integrations Tab Component
 * MCP setup wizard, API playground, and code snippets
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import {
  Copy,
  Check,
  Play,
  Loader2,
  ChevronRight,
  Zap,
  BookOpen,
  Code2,
  Plug,
} from 'lucide-react';

interface BrandIntegrationsTabProps {
  brandId: string;
  brandName: string;
  userId: string;
}

// --- MCP Endpoint Definitions ---

interface EndpointDef {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  defaultBody: Record<string, unknown>;
  bodyOptions?: { label: string; body: Record<string, unknown> }[];
}

function getEndpoints(brandId: string): EndpointDef[] {
  return [
    {
      id: 'brand-context',
      name: 'Get Brand Context',
      method: 'POST',
      path: '/api/mcp/brands/context',
      description: 'Full brand identity, voice, visual guidelines, and positioning.',
      defaultBody: { brandId, includeAssets: true },
      bodyOptions: [
        { label: 'Full context', body: { brandId, includeAssets: true } },
        { label: 'Identity only', body: { brandId, sections: ['identity'] } },
        { label: 'Voice only', body: { brandId, sections: ['voice'] } },
        { label: 'Visual only', body: { brandId, sections: ['visual'] } },
      ],
    },
    {
      id: 'brands-list',
      name: 'List Brands',
      method: 'POST',
      path: '/api/mcp/brands/list',
      description: 'List all brands with pagination, sorting, and filtering.',
      defaultBody: { limit: 10, sortBy: 'updated' },
      bodyOptions: [
        { label: 'Recent 10', body: { limit: 10, sortBy: 'updated' } },
        { label: 'All brands', body: { limit: 50, sortBy: 'name' } },
        { label: 'With logo only', body: { limit: 10, sortBy: 'updated', filter: { hasLogo: true } } },
      ],
    },
    {
      id: 'assets-get',
      name: 'Get Assets',
      method: 'POST',
      path: '/api/mcp/assets/get',
      description: 'Logos, colors, fonts, and mockups in multiple formats.',
      defaultBody: { brandId, assetTypes: ['logo', 'colors', 'fonts'] },
      bodyOptions: [
        { label: 'All assets', body: { brandId, assetTypes: ['logo', 'colors', 'fonts'] } },
        { label: 'Colors (Tailwind)', body: { brandId, assetTypes: ['colors'], format: { colors: 'tailwind' } } },
        { label: 'Colors (CSS)', body: { brandId, assetTypes: ['colors'], format: { colors: 'css' } } },
        { label: 'Fonts (CSS import)', body: { brandId, assetTypes: ['fonts'], format: { fonts: 'css_imports' } } },
      ],
    },
    {
      id: 'voice-validate',
      name: 'Validate Voice',
      method: 'POST',
      path: '/api/mcp/voice/validate',
      description: 'AI-powered text validation against brand voice guidelines.',
      defaultBody: { brandId, text: 'Your text to validate goes here', strictness: 0.7 },
      bodyOptions: [
        { label: 'Standard', body: { brandId, text: 'Your text to validate goes here', strictness: 0.7 } },
        { label: 'Strict', body: { brandId, text: 'Your text to validate goes here', strictness: 0.9 } },
        { label: 'Lenient', body: { brandId, text: 'Your text to validate goes here', strictness: 0.3 } },
      ],
    },
  ];
}

// --- Code Snippet Generators ---

function getCurlSnippet(endpoint: EndpointDef): string {
  return `curl -X POST \\
  ${typeof window !== 'undefined' ? window.location.origin : 'https://app.colater.ai'}${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.defaultBody, null, 2)}'`;
}

function getTypeScriptSnippet(endpoint: EndpointDef): string {
  return `const response = await fetch("${typeof window !== 'undefined' ? window.location.origin : 'https://app.colater.ai'}${endpoint.path}", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(${JSON.stringify(endpoint.defaultBody, null, 4)}),
});

const data = await response.json();
console.log(data);`;
}

function getPythonSnippet(endpoint: EndpointDef): string {
  const bodyStr = JSON.stringify(endpoint.defaultBody, null, 4)
    .replace(/true/g, 'True')
    .replace(/false/g, 'False')
    .replace(/null/g, 'None');

  return `import requests

response = requests.post(
    "${typeof window !== 'undefined' ? window.location.origin : 'https://app.colater.ai'}${endpoint.path}",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    },
    json=${bodyStr},
)

data = response.json()
print(data)`;
}

function getMCPConfig(brandId: string, brandName: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        [`colater-${brandName.toLowerCase().replace(/\s+/g, '-')}`]: {
          command: 'npx',
          args: ['-y', '@colater/mcp-server'],
          env: {
            COLATER_API_KEY: 'YOUR_API_KEY',
            COLATER_BRAND_ID: brandId,
          },
        },
      },
    },
    null,
    2
  );
}

// --- Copyable Code Block ---

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 hover:bg-gray-700 text-gray-300"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
        <code>{code}</code>
      </pre>
      <div className="absolute bottom-2 right-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{language}</span>
      </div>
    </div>
  );
}

// --- Step Component for Setup Wizard ---

function SetupStep({
  step,
  title,
  children,
  isActive,
  isComplete,
  onToggle,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  isActive: boolean;
  isComplete: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`border rounded-lg transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isComplete
              ? 'bg-green-100 text-green-700'
              : isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isComplete ? <Check className="w-3.5 h-3.5" /> : step}
        </div>
        <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-gray-700'}`}>
          {title}
        </span>
        <ChevronRight
          className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`}
        />
      </button>
      {isActive && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
}

// --- Main Component ---

export function BrandIntegrationsTab({ brandId, brandName }: BrandIntegrationsTabProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const endpoints = getEndpoints(brandId);

  // Setup wizard state
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Playground state
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0].id);
  const [selectedVariant, setSelectedVariant] = useState('0');
  const [playgroundResult, setPlaygroundResult] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [playgroundError, setPlaygroundError] = useState<string | null>(null);

  // Snippets state
  const [snippetEndpoint, setSnippetEndpoint] = useState(endpoints[0].id);
  const [snippetLang, setSnippetLang] = useState<'curl' | 'typescript' | 'python'>('curl');

  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpoint) ?? endpoints[0];
  const snippetEndpointDef = endpoints.find((e) => e.id === snippetEndpoint) ?? endpoints[0];

  function toggleStep(step: number) {
    setActiveStep(activeStep === step ? 0 : step);
  }

  function markStepComplete(step: number) {
    setCompletedSteps((prev) => new Set([...prev, step]));
    setActiveStep(step + 1);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  }

  async function runPlayground() {
    setIsRunning(true);
    setPlaygroundResult(null);
    setPlaygroundError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();
      const variant = currentEndpoint.bodyOptions
        ? currentEndpoint.bodyOptions[parseInt(selectedVariant)]
        : null;
      const body = variant ? variant.body : currentEndpoint.defaultBody;

      const response = await fetch(currentEndpoint.path, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setPlaygroundError(`${response.status}: ${data.error || 'Request failed'}`);
      } else {
        setPlaygroundResult(JSON.stringify(data, null, 2));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPlaygroundError(message);
    } finally {
      setIsRunning(false);
    }
  }

  const snippetGenerators: Record<string, (e: EndpointDef) => string> = {
    curl: getCurlSnippet,
    typescript: getTypeScriptSnippet,
    python: getPythonSnippet,
  };

  return (
    <div className="space-y-8">
      {/* ═══════════ Section 1: MCP Setup Wizard ═══════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Plug className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">MCP Setup Wizard</h3>
          <Badge variant="secondary" className="text-[10px]">Claude Desktop</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Connect {brandName} to Claude Desktop in 3 steps. Your AI assistant will have full
          access to brand context, assets, and voice validation.
        </p>

        <div className="space-y-2">
          {/* Step 1: Create API Key */}
          <SetupStep
            step={1}
            title="Create an API key"
            isActive={activeStep === 1}
            isComplete={completedSteps.has(1)}
            onToggle={() => toggleStep(1)}
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Go to the <strong className="text-foreground">Share & API Keys</strong> tab and create a new API key
                with <strong className="text-foreground">Full Access</strong> permissions.
              </p>
              <p>
                Copy the generated key — you&apos;ll need it for the next step.
              </p>
              <Button size="sm" variant="outline" onClick={() => markStepComplete(1)}>
                I have my API key <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </SetupStep>

          {/* Step 2: Add MCP Config */}
          <SetupStep
            step={2}
            title="Add MCP server config to Claude Desktop"
            isActive={activeStep === 2}
            isComplete={completedSteps.has(2)}
            onToggle={() => toggleStep(2)}
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Open Claude Desktop settings and navigate to the <strong className="text-foreground">Developer</strong> section.
                Click <strong className="text-foreground">Edit Config</strong> and paste this configuration:
              </p>
              <CodeBlock code={getMCPConfig(brandId, brandName)} language="json" />
              <p>
                Replace <code className="bg-muted px-1.5 py-0.5 rounded text-xs">YOUR_API_KEY</code> with the key from Step 1.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(getMCPConfig(brandId, brandName), 'MCP config')}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy config
                </Button>
                <Button size="sm" variant="outline" onClick={() => markStepComplete(2)}>
                  Done <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </SetupStep>

          {/* Step 3: Restart & Test */}
          <SetupStep
            step={3}
            title="Restart Claude Desktop and test"
            isActive={activeStep === 3}
            isComplete={completedSteps.has(3)}
            onToggle={() => toggleStep(3)}
          >
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Restart Claude Desktop. You should see <strong className="text-foreground">colater-{brandName.toLowerCase().replace(/\s+/g, '-')}</strong> in
                the MCP servers list.
              </p>
              <p>Try asking Claude:</p>
              <div className="space-y-2">
                <div className="bg-muted rounded-lg p-3 text-xs italic">
                  &ldquo;What are {brandName}&apos;s brand colors and fonts?&rdquo;
                </div>
                <div className="bg-muted rounded-lg p-3 text-xs italic">
                  &ldquo;Does this tagline match {brandName}&apos;s voice: &lsquo;Innovation starts here&rsquo;?&rdquo;
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => markStepComplete(3)}>
                It works! <Check className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </SetupStep>
        </div>
      </div>

      {/* ═══════════ Section 2: API Playground ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <CardTitle>API Playground</CardTitle>
          </div>
          <CardDescription>
            Test API endpoints live with your account credentials. No API key needed — uses your current session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint + variant selectors */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endpoint</label>
              <Select
                value={selectedEndpoint}
                onValueChange={(v) => {
                  setSelectedEndpoint(v);
                  setSelectedVariant('0');
                  setPlaygroundResult(null);
                  setPlaygroundError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {endpoints.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      {ep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentEndpoint.bodyOptions && currentEndpoint.bodyOptions.length > 1 && (
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Variant</label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentEndpoint.bodyOptions.map((opt, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Endpoint info */}
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              {currentEndpoint.method}
            </Badge>
            <code className="text-muted-foreground">{currentEndpoint.path}</code>
          </div>
          <p className="text-sm text-muted-foreground">{currentEndpoint.description}</p>

          {/* Request body preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Request Body</label>
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
              <code>
                {JSON.stringify(
                  currentEndpoint.bodyOptions
                    ? currentEndpoint.bodyOptions[parseInt(selectedVariant)]?.body ?? currentEndpoint.defaultBody
                    : currentEndpoint.defaultBody,
                  null,
                  2
                )}
              </code>
            </pre>
          </div>

          {/* Run button */}
          <Button onClick={runPlayground} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Send Request
              </>
            )}
          </Button>

          {/* Response */}
          {playgroundError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">Error</p>
              <p className="text-xs text-destructive/80 mt-1">{playgroundError}</p>
            </div>
          )}

          {playgroundResult && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Response</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(playgroundResult, 'Response')}
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                <code>{playgroundResult}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Section 3: Code Snippets ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <CardTitle>Code Snippets</CardTitle>
          </div>
          <CardDescription>
            Ready-to-use code for each endpoint. Replace <code className="bg-muted px-1 rounded text-xs">YOUR_API_KEY</code> with your actual key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint + language selectors */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endpoint</label>
              <Select value={snippetEndpoint} onValueChange={setSnippetEndpoint}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {endpoints.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      {ep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Language</label>
              <Select value={snippetLang} onValueChange={(v) => setSnippetLang(v as typeof snippetLang)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curl">cURL</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CodeBlock
            code={snippetGenerators[snippetLang](snippetEndpointDef)}
            language={snippetLang}
          />
        </CardContent>
      </Card>

      {/* ═══════════ Section 4: Quick Reference ═══════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle>Quick Reference</CardTitle>
          </div>
          <CardDescription>All available endpoints at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Endpoint</th>
                  <th className="pb-2 font-medium text-muted-foreground">Path</th>
                  <th className="pb-2 font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {endpoints.map((ep) => (
                  <tr key={ep.id}>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {ep.method}
                        </Badge>
                        <span className="font-medium">{ep.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <code className="text-xs text-muted-foreground">{ep.path}</code>
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{ep.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Authentication:</strong> All endpoints require an{' '}
              <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;api-key&gt;</code>{' '}
              header. Create API keys in the <strong>Share & API Keys</strong> tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
