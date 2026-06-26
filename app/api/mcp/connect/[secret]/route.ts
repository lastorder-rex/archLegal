import { NextRequest, NextResponse } from 'next/server';
import { callMcpTool, listMcpTools } from '@/lib/mcp/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type JsonRpcRequest = {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method?: string;
  params?: any;
};

type RouteContext = {
  params: {
    secret: string;
  };
};

function jsonRpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result };
}

function jsonRpcError(id: JsonRpcRequest['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

function isAuthorized(secret: string): boolean {
  const expected = process.env.MCP_CONNECT_SECRET;
  return Boolean(expected && secret && secret === expected);
}

function forbidden() {
  return NextResponse.json(jsonRpcError(null, -32001, 'MCP 연결 권한이 없습니다.'), { status: 404 });
}

async function handleRpc(message: JsonRpcRequest) {
  const id = message.id ?? null;

  if (!message.method) {
    return jsonRpcError(id, -32600, 'method가 필요합니다.');
  }

  switch (message.method) {
    case 'initialize':
      return jsonRpcResult(id, {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'jake-eais',
          version: '0.1.0',
        },
      });

    case 'ping':
      return jsonRpcResult(id, {});

    case 'notifications/initialized':
      return null;

    case 'tools/list':
      return jsonRpcResult(id, { tools: listMcpTools() });

    case 'tools/call': {
      const name = message.params?.name;
      const args = message.params?.arguments ?? {};
      if (typeof name !== 'string') {
        return jsonRpcError(id, -32602, 'tool name이 필요합니다.');
      }

      try {
        const result = await callMcpTool(name, args);
        return jsonRpcResult(id, result);
      } catch (error) {
        const errMessage = error instanceof Error ? error.message : 'tool 실행 중 오류가 발생했습니다.';
        return jsonRpcResult(id, {
          isError: true,
          content: [{ type: 'text', text: errMessage }],
        });
      }
    }

    default:
      return jsonRpcError(id, -32601, `지원하지 않는 MCP method입니다: ${message.method}`);
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(params.secret)) {
    return forbidden();
  }

  return NextResponse.json({
    name: 'jake-eais',
    version: '0.1.0',
    endpoint: `/api/mcp/connect/${params.secret}`,
    tools: listMcpTools().map((tool) => tool.name),
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(params.secret)) {
    return forbidden();
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(jsonRpcError(null, -32700, 'JSON body를 파싱할 수 없습니다.'), { status: 400 });
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(handleRpc))).filter(Boolean);
    return NextResponse.json(responses);
  }

  const response = await handleRpc(body);
  if (!response) {
    return new NextResponse(null, { status: 202 });
  }

  return NextResponse.json(response);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(params.secret)) {
    return forbidden();
  }

  return new NextResponse(null, { status: 204 });
}
