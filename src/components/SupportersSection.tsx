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
	{ src: '/img/logos/skolkovo.svg', alt: 'Сколково' },
];

export default function SupportersSection({
	logos = DEFAULT_LOGOS,
}: {
	logos?: Logo[];
}) {
	return (
		<section className="bg-white w-full py-10 md:py-14 lg:py-16" aria-label="Партнёры и поддержка">
			<div className="rd-content-column">
				<div className="flex justify-center">
					<ul className="flex flex-row flex-wrap justify-center items-center gap-4 md:gap-6 max-w-[984px]">
						{logos.map((logo) => (
							<li key={logo.alt}>
								<div className="w-[120px] h-[80px] rounded-2xl flex items-center justify-center p-[15px] shrink-0 border border-[#F6F7F9]">
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
