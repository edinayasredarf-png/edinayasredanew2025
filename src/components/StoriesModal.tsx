"use client";

import Stories from "react-insta-stories";

type StoryItem = {
	url: string;
	header?: {
		heading: string;
		subheading: string;      // обязательно строка, пустая если нет
		profileImage: string;    // обязательно строка, пустая если нет
	};
	duration?: number;
};

type StoriesModalProps = {
	stories: StoryItem[];
	isOpen: boolean;
	onClose: () => void;
};

export const StoriesModal: React.FC<StoriesModalProps> = ({ stories, isOpen, onClose }) => {
	if (!isOpen) return null;

	// Преобразуем данные строго по типу Story
	const instaStories = stories.map((s) => ({
		url: s.url,
		header: s.header
			? {
				heading: s.header.heading,
				subheading: s.header.subheading || "",       // пустая строка
				profileImage: s.header.profileImage || "",   // пустая строка
			}
			: undefined,
		duration: s.duration || 5000,
	}));

	return (
		<div
			id="stories-overlay"
			onClick={(e) => {
				if ((e.target as Element).id === "stories-overlay") onClose();
			}}
			className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 md:p-10"
		>
			<div className="relative w-full max-w-[600px] md:rounded-xl overflow-hidden">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-20 text-white text-xl md:text-2xl font-bold"
				>
					✕
				</button>

				<Stories
					stories={instaStories}
					defaultInterval={5000}
					width="100%"
					height="80vh"
					onAllStoriesEnd={onClose}
					loop={false}
				/>
			</div>
		</div>
	);
};
