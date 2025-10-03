export default async function CasePage({ params }: any) {
  const { id } = (typeof params?.then === 'function') ? await params : params;
  return <div>Кейс #{id}</div>;
}
