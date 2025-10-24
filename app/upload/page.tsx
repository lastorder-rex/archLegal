import UploadPageClient from './UploadPageClient';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function UploadPage({ searchParams }: PageProps) {
  const tokenParam = searchParams?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? '';

  return <UploadPageClient token={token} />;
}
