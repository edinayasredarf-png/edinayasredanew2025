'use client';

import React from 'react';
import Image from 'next/image';

type Logo = {
	src: string;
	alt: string;
};

const DEFAULT_LOGOS: Logo[] = [
	{ src: '/img/logos/asi.svg', alt: 'АСИ' },
	{ src: '/img/logos/fasie1.svg', alt: 'ФАСИИ' },
	{ src: '/img/logos/frii_logo.svg', alt: 'ФРИИ' },
	{ src: '/img/logos/mincifry.svg', alt: 'Минцифры' },
	{ src: '/img/logos/minstroy.svg', alt: 'Минстрой' },
	{ src: '/img/logos/myroots.svg', alt: 'myroots' },
	{ src: '/img/logos/skolkovo.svg', alt: 'Сколково' },
];

export default function SupportersSection({
	title = 'Разработано при поддержке',
	subtitle = 'Нам доверяют крупные организации. Совместно проводим пилоты и внедряем решения на государственном уровне.',
	logos = DEFAULT_LOGOS,
}: {
	title?: string;
	subtitle?: string;
	logos?: Logo[];
}) {
	return (
		<section className="bg-[#F6F7F9] w-full py-10 md:py-14 lg:py-16" aria-label="Партнёры и поддержка">
			<div className="rd-content-column">
				<header className="flex flex-col items-center text-center mb-10 md:mb-12 lg:mb-14">
					<h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,3rem)] leading-[1.2] md:leading-[58px]">
						{title}
					</h2>
					<p className="mt-3 md:mt-4 text-[#7c8a9a] font-[Raleway] text-base md:text-xl leading-7 max-w-[560px]">
						{subtitle}
					</p>
				</header>

				<div className="flex justify-center">
					<ul className="flex flex-row flex-wrap justify-center items-center gap-4 md:gap-6 max-w-[984px]">
						{logos.map((logo) => (
							<li key={logo.alt}>
								<div className="rd-block w-[120px] h-[80px] rounded-2xl flex items-center justify-center p-[15px] shrink-0">
									<div className="relative w-[90px] h-[50px]">
										<Image
											src={logo.src}
											alt={logo.alt}
											fill
											sizes="90px"
											className="object-contain"
											loading="lazy"
										/>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
