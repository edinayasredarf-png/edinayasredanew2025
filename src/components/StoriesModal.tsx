"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Stories from "react-insta-stories";

type StoryItem = {
	url: string;
	header?: {
		heading: string;
		subheading?: string;
		profileImage?: string;
	};
	duration?: number;
};

type StoriesModalProps = {
	stories: StoryItem[];
	isOpen: boolean;
	onClose: () => void;
};

export const StoriesModal: React.FC<StoriesModalProps> = ({
	stories,
	isOpen,
	onClose,
}) => {
	const [mounted, setMounted] = useState(false);

	// чтобы portal не падал на SSR
	useEffect(() => {
		setMounted(true);
	}, []);

	// блокируем скролл + ESC
	useEffect(() => {
		if (!isOpen) return;

		document.body.style.overflow = "hidden";

		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		document.addEventListener("keydown", handleEsc);

		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", handleEsc);
		};
	}, [isOpen, onClose]);

	if (!mounted || !isOpen) return null;

	const instaStories = stories.map((s) => ({
		url: s.url,
		header: s.header
			? {
				heading: s.header.heading,
				subheading: s.header.subheading || "",
				profileImage: s.header.profileImage || "",
			}
			: undefined,
		duration: s.duration || 5000,
	}));

	const modal = (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center">

			{/* Overlay */}
			<div
				className="absolute inset-0 bg-black/90 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Stories container */}
			<div
				className="
          relative
          w-full h-full
          md:max-w-[430px] md:h-[760px]
          overflow-hidden
          md:rounded-2xl
          isolate
        "
			>
				{/* STORIES */}
				<Stories
					stories={instaStories}
					defaultInterval={5000}
					width="100%"
					height="100%"
					onAllStoriesEnd={onClose}
					loop={false}
				/>

				{/* CLOSE BUTTON */}
				<button
					onClick={onClose}
					className="
            absolute top-4 right-4
            z-[9999]
            w-11 h-11
            flex items-center justify-center
            rounded-full
            bg-black/40
            text-white text-2xl font-bold
            hover:bg-black/70
            transition
          "
				>
					✕
				</button>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
};
