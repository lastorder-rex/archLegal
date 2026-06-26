import { createEaisIssueJob, getEaisIssueJobResult } from '@/lib/eais/jobs';

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

type McpToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type EaisJobResult = NonNullable<Awaited<ReturnType<typeof getEaisIssueJobResult>>>;
type EaisJobResultFile = EaisJobResult['files'][number];

const addressJobInputSchema = {
  type: 'object',
  properties: {
    address: {
      type: 'string',
      description: '세움터에서 발급할 건축물 주소',
    },
    docType: {
      type: 'string',
      enum: ['auto', '표제부', '전유부', '총괄표제부'],
      default: 'auto',
      description: '발급할 건축물대장 종류. 전유부는 dongHo가 필요합니다.',
    },
    dongHo: {
      type: 'string',
      description: '전유부 또는 다중동 표제부 발급 시 필요한 동/호 정보. 예: 101동 501호',
    },
    delivery: {
      type: 'string',
      enum: ['drive', 'email', 'both'],
      default: 'drive',
      description: '결과 전달 방식',
    },
    email: {
      type: 'string',
      description: '이메일 전달을 선택한 경우 받을 이메일 주소',
    },
  },
  required: ['address'],
  additionalProperties: false,
};

const jobIdInputSchema = {
  type: 'object',
  properties: {
    jobId: {
      type: 'string',
      description: '발급 작업 ID',
    },
  },
  required: ['jobId'],
  additionalProperties: false,
};

const waitJobInputSchema = {
  type: 'object',
  properties: {
    jobId: {
      type: 'string',
      description: '발급 작업 ID',
    },
    maxWaitSeconds: {
      type: 'number',
      default: 25,
      description: '결과를 기다릴 최대 초. 서버 안정성을 위해 25초 이하로 제한됩니다.',
    },
  },
  required: ['jobId'],
  additionalProperties: false,
};

export function listMcpTools(): ToolDefinition[] {
  return [
    {
      name: 'create_address_job',
      title: '주소 기반 세움터 발급 작업 생성',
      description: '사용자가 직접 입력한 주소로 세움터 건축물대장 발급/추출 작업을 생성합니다. 링크까지 사용자에게 보여줘야 하면 작업 생성 후 wait_address_job_result를 같은 jobId로 호출하세요.',
      inputSchema: addressJobInputSchema,
    },
    {
      name: 'get_address_job_status',
      title: '세움터 발급 작업 상태 조회',
      description: '세움터 발급 작업의 현재 상태를 조회합니다.',
      inputSchema: jobIdInputSchema,
    },
    {
      name: 'get_address_job_result',
      title: '세움터 발급 작업 결과 조회',
      description: '완료된 세움터 발급 작업의 Google Drive 링크 등 결과 파일을 조회합니다.',
      inputSchema: jobIdInputSchema,
    },
    {
      name: 'wait_address_job_result',
      title: '세움터 발급 결과 대기 및 링크 조회',
      description: '발급 작업이 완료될 때까지 짧게 기다린 뒤 Google Drive 링크를 조회합니다. 아직 진행 중이면 같은 jobId로 다시 호출하세요.',
      inputSchema: waitJobInputSchema,
    },
  ];
}

function textResult(text: string, structuredContent?: Record<string, unknown>): McpToolResult {
  return {
    content: [{ type: 'text', text }],
    structuredContent,
  };
}

function getString(value: unknown, fieldName: string, required = false) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (required) {
    throw new Error(`${fieldName} 값이 필요합니다.`);
  }
  return '';
}

function getNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createAddressJob(args: Record<string, unknown>): Promise<McpToolResult> {
  const address = getString(args.address, 'address', true);
  const docType = getString(args.docType, 'docType') || 'auto';
  const dongHo = getString(args.dongHo, 'dongHo');
  const delivery = getString(args.delivery, 'delivery') || 'drive';
  const email = getString(args.email, 'email');
  const defaultAdminId = process.env.MCP_DEFAULT_ADMIN_ID || null;

  const job = await createEaisIssueJob({
    address,
    docType: docType as any,
    dongHo,
    delivery: delivery as any,
    email,
    requestedByAdminId: defaultAdminId,
    source: 'manual_gpt',
    metadata: {
      requestedVia: 'chatgpt-mcp',
    },
  });

  return textResult(
    [
      `발급 작업을 생성했습니다. 작업 ID: ${job.id}, 상태: ${job.status}`,
      'Google Drive 링크를 사용자에게 보여주려면 wait_address_job_result 도구를 이 작업 ID로 호출하세요.',
      '아직 진행 중이면 같은 작업 ID로 wait_address_job_result를 다시 호출하면 됩니다.',
    ].join('\n'),
    { job }
  );
}

async function getAddressJobStatus(args: Record<string, unknown>): Promise<McpToolResult> {
  const jobId = getString(args.jobId, 'jobId', true);
  const result = await getEaisIssueJobResult(jobId);
  if (!result) {
    throw new Error('작업을 찾을 수 없습니다.');
  }

  const statusMessages: Record<string, string> = {
    pending: '발급 대기 중입니다.',
    claimed: '작업자가 작업을 가져갔습니다.',
    running: '세움터 발급이 진행 중입니다.',
    done: '발급 작업이 완료되었습니다.',
    failed: '발급 작업이 실패했습니다.',
    cancelled: '발급 작업이 취소되었습니다.',
  };

  const message = statusMessages[result.job.status] ?? `상태: ${result.job.status}`;
  return textResult(`${message} 작업 ID: ${result.job.id}`, {
    job: result.job,
    fileCount: result.files.length,
  });
}

async function getAddressJobResult(args: Record<string, unknown>): Promise<McpToolResult> {
  const jobId = getString(args.jobId, 'jobId', true);
  const result = await getEaisIssueJobResult(jobId);
  if (!result) {
    throw new Error('작업을 찾을 수 없습니다.');
  }

  if (result.job.status !== 'done') {
    return textResult(`아직 완료되지 않았습니다. 현재 상태: ${result.job.status}`, result);
  }

  return textResult(formatDoneResult(result), result);
}

function formatDoneResult(result: EaisJobResult) {
  const fileLabels: Record<string, string> = {
    building_register_pdf: '건축물대장 PDF',
    building_register_total_pdf: '총괄표제부 PDF',
    extracted_html: '추출 HTML',
    permit_form_pdf: '신고서 PDF',
  };

  const links = result.files
    .filter((file: EaisJobResultFile) => file.driveUrl)
    .map((file: EaisJobResultFile) => {
      const label = fileLabels[file.type] ?? file.fileName ?? file.type;
      const name = file.fileName ? ` (${file.fileName})` : '';
      return `- ${label}${name}: ${file.driveUrl}`;
    })
    .join('\n');

  const summary = [
    `주소: ${result.job.address}`,
    `대장 종류: ${result.job.resultSummary?.docType ?? result.job.docType}`,
    result.job.dongHo ? `동/호: ${result.job.dongHo}` : '',
    result.job.resultSummary?.buildingName ? `건물명: ${result.job.resultSummary.buildingName}` : '',
  ].filter(Boolean).join('\n');

  return links ? `발급 완료됐습니다.\n${summary}\n\nDrive 링크:\n${links}` : '작업은 완료되었지만 등록된 Drive 링크가 없습니다.';
}

async function waitAddressJobResult(args: Record<string, unknown>): Promise<McpToolResult> {
  const jobId = getString(args.jobId, 'jobId', true);
  const maxWaitSeconds = Math.max(1, Math.min(25, getNumber(args.maxWaitSeconds, 25)));
  const deadline = Date.now() + maxWaitSeconds * 1000;
  let result = await getEaisIssueJobResult(jobId);

  if (!result) {
    throw new Error('작업을 찾을 수 없습니다.');
  }

  while (result.job.status !== 'done' && result.job.status !== 'failed' && result.job.status !== 'cancelled' && Date.now() < deadline) {
    await sleep(2000);
    result = await getEaisIssueJobResult(jobId);
    if (!result) {
      throw new Error('작업을 찾을 수 없습니다.');
    }
  }

  if (result.job.status === 'done') {
    return textResult(formatDoneResult(result), result);
  }

  if (result.job.status === 'failed') {
    return textResult(`발급 작업이 실패했습니다. 오류: ${result.job.errorMessage ?? '원인 미상'}`, result);
  }

  if (result.job.status === 'cancelled') {
    return textResult('발급 작업이 취소되었습니다.', result);
  }

  return textResult(
    `아직 완료되지 않았습니다. 현재 상태: ${result.job.status}. 같은 작업 ID로 wait_address_job_result를 다시 호출하세요.`,
    result
  );
}

export async function callMcpTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
  switch (name) {
    case 'create_address_job':
      return createAddressJob(args);
    case 'get_address_job_status':
      return getAddressJobStatus(args);
    case 'get_address_job_result':
      return getAddressJobResult(args);
    case 'wait_address_job_result':
      return waitAddressJobResult(args);
    default:
      throw new Error(`지원하지 않는 tool입니다: ${name}`);
  }
}
