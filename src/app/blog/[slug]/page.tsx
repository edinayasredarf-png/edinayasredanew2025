import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PostPageClient from '@/components/blog/PostPageClient';
import { getPostSeoBySlug } from '@/lib/seoServer';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
	{ params }: { params: { slug: string } }
): Promise<Metadata> {
	const slug = params?.slug;
	const fallbackTitle = 'Статья';
	const fallbackDescription = 'Статья блога «Единая среда». Новости, практика и кейсы цифровизации.';

	try {
		const seo = await getPostSeoBySlug(slug);
		if (seo?.title) {
			const images = seo.image ? [seo.image] : undefined;

			return {
				title: seo.title, // template из root metadata добавит " | Единая среда"
				description: seo.description ?? fallbackDescription,
				openGraph: {
					type: 'article',
					title: seo.title,
					description: seo.description ?? fallbackDescription,
					images,
				},
				twitter: {
					card: 'summary_large_image',
					title: seo.title,
					description: seo.description ?? fallbackDescription,
					images,
				},
			};
		}
	} catch {
		// ignore
	}

	return {
		title: fallbackTitle,
		description: fallbackDescription,
		openGraph: { type: 'article', title: fallbackTitle, description: fallbackDescription },
		twitter: { card: 'summary_large_image', title: fallbackTitle, description: fallbackDescription },
	};
}

export default async function BlogPostPage(props: any) {
	const raw = props?.params;
	const params = raw && typeof raw.then === 'function' ? await raw : raw;
	const slug = params?.slug as string;

	return (
		<Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
			<PostPageClient slug={slug} />
		</Suspense>
	);
}
