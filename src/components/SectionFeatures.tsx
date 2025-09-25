import React, { useState, useRef, useEffect } from 'react';

interface Feature {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    imageSrc: '/img/proverka.svg',
    imageAlt: 'Проверка подрядчиков',
    title: 'Контролируйте работы удалённо',
    description: 'Подрядчики сами вносят данные — вы принимаете работы онлайн',
  },
  {
    imageSrc: '/img/actual.svg',
    imageAlt: 'Актуальные данные',
    title: 'Актуальные данные 24/7',
    description: 'Реестры всегда под рукой — для отчетов и проверок',
  },
  // ... остальные объекты features с добавленными imageSrc
];

const SectionFeatures = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Инициализируем массив refs
    cardsRef.current = cardsRef.current.slice(0, features.length);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardsRef.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: sectionRef.current,
        threshold: 0.5,
      }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  // Функция для установки ref
  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[index] = el;
  };

  return (
    <section ref={sectionRef} className="h-screen flex overflow-hidden">
      {/* Левая часть с изображением */}
      <div className="w-1/2 h-full flex items-center justify-center bg-gray-100">
        <img
          src={features[activeIndex].imageSrc}
          alt={features[activeIndex].imageAlt}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Правая часть с карточками */}
      <div className="w-1/2 h-full overflow-y-auto">
        <div className="py-20 px-12">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={setCardRef(index)}
              className={`mb-12 p-8 rounded-lg transition-all duration-300 ${
                index === activeIndex
                  ? 'bg-blue-500 text-white shadow-xl'
                  : 'bg-white text-gray-700'
              }`}
            >
              <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-lg">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionFeatures;