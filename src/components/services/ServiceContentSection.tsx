import Image from 'next/image';

export interface ServiceContentCard { title: string; description: string; image?: string }

export default function ServiceContentSection({ title, subtitle, cards, columns = 3, outlined = false, onRequest }: {
  title: string; subtitle?: string; cards: ServiceContentCard[]; columns?: 2 | 3 | 4; outlined?: boolean; onRequest?: () => void;
}) {
  const grid = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3';
  return <section className="max-w-[1200px] mx-auto px-4 py-12 md:py-20">
    <h2 className="text-center text-[#313131] text-3xl md:text-[48px] leading-tight">{title}</h2>
    {subtitle && <p className="text-center text-[#7c8a9a] text-lg mt-6 max-w-3xl mx-auto">{subtitle}</p>}
    <div className={`grid ${grid} mt-12 ${outlined ? 'gap-px bg-[#e6edf5] border border-[#e6edf5] rounded-3xl overflow-hidden' : 'gap-3'}`}>
      {cards.map(card => <article key={card.title} className={outlined ? 'bg-white p-7 md:min-h-[320px]' : 'bg-[#F6F7F9] rounded-3xl overflow-hidden'}>
        {card.image && <div className="p-2"><div className="bg-white rounded-2xl h-[240px] flex items-center justify-center"><Image src={card.image} alt="" width={160} height={160} className="object-contain" /></div></div>}
        <div className={outlined ? '' : 'p-6'}><h3 className="text-[#313131] text-2xl leading-snug">{card.title}</h3><p className="text-[#7c8a9a] text-lg leading-relaxed mt-4">{card.description}</p></div>
      </article>)}
    </div>
    {onRequest && <div className="text-center mt-10"><button type="button" onClick={onRequest} className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg px-8 py-4 rounded-xl transition">Оставить заявку</button></div>}
  </section>;
}
