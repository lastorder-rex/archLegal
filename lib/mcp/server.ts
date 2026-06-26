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

const addressJobsInputSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      description: '발급할 주소 목록. 사용자가 여러 주소를 한 번에 요청하면 주소마다 하나의 item으로 분리하세요.',
      items: {
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
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

const waitJobsInputSchema = {
  type: 'object',
  properties: {
    jobIds: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      description: '결과를 확인할 발급 작업 ID 목록',
      items: {
        type: 'string',
      },
    },
    maxWaitSeconds: {
      type: 'number',
      default: 25,
      description: '결과를 기다릴 최대 초. 서버 안정성을 위해 25초 이하로 제한됩니다.',
    },
  },
  required: ['jobIds'],
  additionalProperties: false,
};

export function listMcpTools(): ToolDefinition[] {
  return [
    {
      name: 'create_address_job',
      title: '주소 기반 세움터 발급 작업 생성',
      description: '주소 1건의 세움터 건축물대장 발급/추출 작업을 생성합니다. 사용자의 최종 목적은 Drive 링크 확인이므로, 작업 생성 후 반드시 wait_address_job_result를 같은 jobId로 반복 호출해 최종 링크를 사용자에게 보여주세요. 여러 주소는 create_address_jobs를 사용하세요.',
      inputSchema: addressJobInputSchema,
    },
    {
      name: 'create_address_jobs',
      title: '여러 주소 세움터 발급 작업 생성',
      description: '사용자가 여러 주소의 건축물대장 발급을 요청할 때 주소별 작업을 한 번에 생성합니다. 생성 후 반드시 wait_address_jobs_result를 jobIds로 반복 호출해 주소별 최종 Drive 링크를 사용자에게 보여주세요.',
      inputSchema: addressJobsInputSchema,
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
      description: '단일 발급 작업이 완료될 때까지 짧게 기다린 뒤 Google Drive 링크를 조회합니다. 아직 진행 중이면 사용자가 중단하지 않는 한 같은 jobId로 다시 호출하세요.',
      inputSchema: waitJobInputSchema,
    },
    {
      name: 'wait_address_jobs_result',
      title: '여러 세움터 발급 결과 대기 및 링크 조회',
      description: '여러 발급 작업이 완료될 때까지 짧게 기다린 뒤 주소별 Google Drive 링크를 조회합니다. 진행 중인 작업이 남아 있으면 사용자가 중단하지 않는 한 같은 jobIds로 다시 호출하세요.',
      inputSchema: waitJobsInputSchema,
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

async function createJob(args: Record<string, unknown>) {
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

  return job;
}

async function createAddressJob(args: Record<string, unknown>): Promise<McpToolResult> {
  const job = await createJob(args);

  return textResult(
    [
      `발급 작업을 생성했습니다. 작업 ID: ${job.id}, 상태: ${job.status}`,
      '최종 Drive 링크를 사용자에게 보여주려면 wait_address_job_result 도구를 이 작업 ID로 호출하세요.',
      '아직 진행 중이면 사용자가 중단하지 않는 한 같은 작업 ID로 wait_address_job_result를 다시 호출하세요.',
    ].join('\n'),
    { job }
  );
}

function getRecordArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 배열이 필요합니다.`);
  }
  if (value.length === 0) {
    throw new Error(`${fieldName} 배열에 최소 1개 항목이 필요합니다.`);
  }
  if (value.length > 20) {
    throw new Error(`${fieldName} 배열은 최대 20개까지 처리할 수 있습니다.`);
  }
  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${fieldName}[${index}] 값이 올바르지 않습니다.`);
    }
    return item as Record<string, unknown>;
  });
}

function getStringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 배열이 필요합니다.`);
  }
  if (value.length === 0) {
    throw new Error(`${fieldName} 배열에 최소 1개 항목이 필요합니다.`);
  }
  if (value.length > 20) {
    throw new Error(`${fieldName} 배열은 최대 20개까지 처리할 수 있습니다.`);
  }
  return value.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`${fieldName}[${index}] 값이 필요합니다.`);
    }
    return item.trim();
  });
}

async function createAddressJobs(args: Record<string, unknown>): Promise<McpToolResult> {
  const items = getRecordArray(args.items, 'items');
  const jobs = [];

  for (const item of items) {
    jobs.push(await createJob(item));
  }

  const lines = jobs.map((job, index) => {
    const label = [job.address, job.docType !== 'auto' ? job.docType : '', job.dongHo].filter(Boolean).join(' ');
    return `${index + 1}. ${label}: ${job.id} (${job.status})`;
  });

  return textResult(
    [
      `${jobs.length}건의 발급 작업을 생성했습니다.`,
      ...lines,
      '최종 Drive 링크를 사용자에게 보여주려면 wait_address_jobs_result 도구를 위 jobIds로 호출하세요.',
      '진행 중인 작업이 남아 있으면 사용자가 중단하지 않는 한 같은 jobIds로 wait_address_jobs_result를 다시 호출하세요.',
    ].join('\n'),
    { jobs }
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

function isTerminal(result: EaisJobResult) {
  return result.job.status === 'done' || result.job.status === 'failed' || result.job.status === 'cancelled';
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

function formatBatchResult(results: EaisJobResult[]) {
  const done = results.filter((result) => result.job.status === 'done');
  const failed = results.filter((result) => result.job.status === 'failed');
  const cancelled = results.filter((result) => result.job.status === 'cancelled');
  const active = results.filter((result) => !isTerminal(result));
  const sections = [
    `전체 ${results.length}건 중 완료 ${done.length}건, 진행중 ${active.length}건, 실패 ${failed.length}건, 취소 ${cancelled.length}건입니다.`,
  ];

  for (const result of results) {
    const heading = `[${result.job.status}] ${result.job.address}${result.job.dongHo ? ` ${result.job.dongHo}` : ''}`;
    if (result.job.status === 'done') {
      sections.push(`${heading}\n${formatDoneResult(result)}`);
    } else if (result.job.status === 'failed') {
      sections.push(`${heading}\n오류: ${result.job.errorMessage ?? '원인 미상'}`);
    } else if (result.job.status === 'cancelled') {
      sections.push(`${heading}\n작업이 취소되었습니다.`);
    } else {
      sections.push(`${heading}\n현재 상태: ${result.job.status}.`);
    }
  }

  if (active.length > 0) {
    sections.push('진행 중인 작업이 남아 있습니다. 같은 jobIds로 wait_address_jobs_result를 다시 호출하세요.');
  }

  return sections.join('\n\n');
}

async function waitAddressJobsResult(args: Record<string, unknown>): Promise<McpToolResult> {
  const jobIds = getStringArray(args.jobIds, 'jobIds');
  const maxWaitSeconds = Math.max(1, Math.min(25, getNumber(args.maxWaitSeconds, 25)));
  const deadline = Date.now() + maxWaitSeconds * 1000;
  let results = await Promise.all(jobIds.map(async (jobId) => {
    const result = await getEaisIssueJobResult(jobId);
    if (!result) {
      throw new Error(`작업을 찾을 수 없습니다: ${jobId}`);
    }
    return result;
  }));

  while (results.some((result) => !isTerminal(result)) && Date.now() < deadline) {
    await sleep(2000);
    results = await Promise.all(jobIds.map(async (jobId) => {
      const result = await getEaisIssueJobResult(jobId);
      if (!result) {
        throw new Error(`작업을 찾을 수 없습니다: ${jobId}`);
      }
      return result;
    }));
  }

  const counts = {
    total: results.length,
    done: results.filter((result) => result.job.status === 'done').length,
    active: results.filter((result) => !isTerminal(result)).length,
    failed: results.filter((result) => result.job.status === 'failed').length,
    cancelled: results.filter((result) => result.job.status === 'cancelled').length,
  };

  return textResult(formatBatchResult(results), { results, counts });
}

export async function callMcpTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
  switch (name) {
    case 'create_address_job':
      return createAddressJob(args);
    case 'create_address_jobs':
      return createAddressJobs(args);
    case 'get_address_job_status':
      return getAddressJobStatus(args);
    case 'get_address_job_result':
      return getAddressJobResult(args);
    case 'wait_address_job_result':
      return waitAddressJobResult(args);
    case 'wait_address_jobs_result':
      return waitAddressJobsResult(args);
    default:
      throw new Error(`지원하지 않는 tool입니다: ${name}`);
  }
}
