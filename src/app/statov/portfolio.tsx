'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Plus, X } from 'lucide-react';
import snapshot from './telegram-snapshot.json';
import { Portrait } from './portrait';
import { PhotoRail } from './photos';
import photoSnapshot from './photo-snapshot.json';
import type { StatovPhoto } from './telegram';
import styles from './portfolio.module.css';

const channel = 'https://t.me/StatovLIVE';
const maxChannel = 'https://max.ru/channel_StatovLive';
const vk = 'https://vk.ru/avstatov';
const email = 'mailto:proeco09@ya.ru';

const bio = [
  'Мой профессиональный путь связан с развитием предпринимательства, реализацией экологических инициатив, внедрением современных решений и созданием проектов, имеющих долгосрочную общественную ценность.',
  'Сегодня в центре моей деятельности — развитие группы компаний «Единая среда», цифровых социальных инициатив и проектов, направленных на сохранение природного, культурного и исторического наследия.',
  'Я открыт к сотрудничеству с органами государственной власти, научным и образовательным сообществом, общественными организациями и предпринимателями.',
  'Особое значение для меня имеет объединение людей вокруг идей, способных приносить реальные изменения.',
];

const projects = [
  { name: 'Единая Среда', domain: 'единаясреда.рф', images: ['es-1.webp', 'es-2.webp'], description: 'Цифровая платформа для муниципалитетов и подрядчиков. Учёт объектов городской среды, контроль работ и аналитика в одном месте.' },
  { name: 'MyRoots', domain: 'myroots.pro', images: ['es-3.webp', 'es-4.webp'], description: 'Сервис для создания семейного дерева, сохранения воспоминаний и передачи семейной истории следующим поколениям.' },
  { name: 'Экострой', domain: 'ecorostov.ru', images: ['eco-1.webp', 'eco-2.webp'], description: 'Природоохранная группа компаний. Инвентаризация и паспортизация природных объектов, цифровой учёт и обследование территорий.' },
];

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow',
});

function Biography() {
  const section = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = section.current;
    if (!box) return;
    const words = Array.from(box.querySelectorAll<HTMLElement>('span'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const render = () => {
      frame = 0;
      const distance = innerHeight * 0.72 - box.getBoundingClientRect().top;
      words.forEach((word) => {
        const progress = Math.max(0, Math.min(1, (distance - word.offsetTop) / 86 + 0.48 - word.offsetLeft / box.clientWidth));
        word.style.opacity = reduced.matches ? '1' : String(0.48 + progress * 0.52);
      });
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(render); };
    render();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    reduced.addEventListener('change', request);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      reduced.removeEventListener('change', request);
    };
  }, []);

  return <div className={styles.bio} ref={section}>
    {bio.map((paragraph) => <p key={paragraph}>{paragraph.split(' ').map((word, index) => (
      <span key={index}>{word}{' '}</span>
    ))}</p>)}
  </div>;
}

function ProjectGallery({ project }: { project: typeof projects[number] }) {
  const track = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; left: number } | null>(null);
  const [active, setActive] = useState(0);

  function go(index: number) {
    const target = track.current;
    const slide = target?.children[index] as HTMLElement | undefined;
    if (!target || !slide) return;
    target.scrollTo({
      left: slide.offsetLeft,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.clientX, left: event.currentTarget.scrollLeft };
    event.currentTarget.dataset.dragging = 'true';
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (gesture.current) event.currentTarget.scrollLeft = gesture.current.left + gesture.current.x - event.clientX;
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (!gesture.current) return;
    const { x, left } = gesture.current;
    gesture.current = null;
    delete event.currentTarget.dataset.dragging;
    const from = Math.round(left / event.currentTarget.clientWidth);
    const delta = x - event.clientX;
    go(Math.max(0, Math.min(project.images.length - 1, from + (Math.abs(delta) > 36 ? Math.sign(delta) : 0))));
  }

  return <article className={styles.project}>
    <div className={styles.projectMeta}><h3>{project.name}</h3>
      <a href={'https://' + project.domain} aria-label={'Открыть сайт ' + project.name}>{project.domain} <ArrowUpRight size={17} /></a>
    </div>
    <div ref={track} className={styles.track} onPointerDown={start} onPointerMove={move} onPointerUp={end}
      onPointerCancel={end} onLostPointerCapture={end}
      onScroll={({ currentTarget }) => setActive(Math.round(currentTarget.scrollLeft / currentTarget.clientWidth))}
      aria-label={'Галерея проекта «' + project.name + '»'}>
      {project.images.map((image, index) => <div key={image} className={styles.slide}>
        <Image src={'/statov/' + image} alt={project.name + ', экран ' + (index + 1)} fill unoptimized draggable={false} />
      </div>)}
    </div>
    <div className={styles.projectDetails}>
      <p>{project.description}</p>
      <div className={styles.controls}>
        <button type="button" aria-label="Предыдущий кадр" onClick={() => go(active - 1)} disabled={active === 0}><ArrowLeft size={19} /></button>
        {project.images.map((image, index) => <button type="button" className={styles.dot} key={image}
          aria-label={'Кадр ' + (index + 1)} aria-current={active === index ? 'true' : undefined} onClick={() => go(index)} />)}
        <button type="button" aria-label="Следующий кадр" onClick={() => go(active + 1)} disabled={active === project.images.length - 1}><ArrowRight size={19} /></button>
      </div>
    </div>
  </article>;
}

function Journal() {
  const [posts, setPosts] = useState(snapshot);
  const [photos, setPhotos] = useState<StatovPhoto[]>(photoSnapshot);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/statov/feed?photos=1', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { posts: typeof snapshot; photos: StatovPhoto[] } | null) => {
        if (!data?.posts.length || controller.signal.aborted) return;
        setPosts(data.posts);
        if (data.photos.length) setPhotos(data.photos.map((photo) => photoSnapshot.find((cached) => cached.id === photo.id) ?? photo));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return <>
    <section id="statov-journal" className={styles.journal}>
      <h2>Что сейчас в моей жизни</h2>
      <div className={styles.posts}>{posts.map((post) => (
        <a key={post.id} className={styles.post} href={channel + '/' + post.id}>
          <div className={styles.postMeta}><span>Telegram / StatovLIVE</span><time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time></div>
          <h3>{post.title}</h3>
          {post.text && <p>{post.text}</p>}
        </a>
      ))}</div>
      <a href={channel} className={styles.readMore}>Читать ещё <ArrowUpRight size={18} /></a>
    </section>
    {photos.length > 0 && <PhotoRail photos={photos} channel={channel} />}
  </>;
}

export function StatovPortfolio({ fontClass }: { fontClass: string }) {
  const contactDialog = useRef<HTMLDialogElement>(null);

  function showContacts() {
    contactDialog.current?.showModal();
  }

  return <main className={styles.root + ' ' + fontClass} id="statov-top">
    <header className={styles.header}>
      <a className={styles.wordmark} href="#statov-top">Статов Андрей</a>
      <nav aria-label="Разделы страницы">
        <a href="#statov-projects">Проекты</a><a href="#statov-journal">Дневник</a><button type="button" aria-haspopup="dialog" aria-controls="statov-contact-dialog" onClick={showContacts}>Связаться <ArrowUpRight size={14} /></button>
      </nav>
    </header>
    <section className={styles.hero} aria-labelledby="statov-title">
      <div className={styles.portrait}><Portrait /></div>
      <div className={styles.heroCopy}>
        <h1 id="statov-title">Статов Андрей</h1>
        <p>Предприниматель. Создатель. Человек, меняющий среду вокруг себя.</p>
        <button type="button" className={styles.contactButton} aria-haspopup="dialog" aria-controls="statov-contact-dialog" onClick={showContacts}><span><Plus size={26} strokeWidth={1.4} /></span> Связаться</button>
      </div>
      <a className={styles.scrollLink} href="#statov-about" aria-label="Об Андрее Статове"><ArrowDown size={20} /></a>
    </section>
    <section id="statov-about" className={styles.about} aria-label="Об Андрее Статове">
      <div className={styles.manifesto}>
        <div><strong>17 лет</strong><p>предпринимательского опыта. Владелец природоохранной научно-практической группы компаний «Единая среда».</p></div>
        <blockquote>Моя философия — оставлять после себя не только результаты, но и ценность для следующих поколений.</blockquote>
        <p>Я убеждён, что настоящий успех предпринимателя измеряется и тем, какой след его деятельность оставляет в обществе.</p>
      </div>
      <Biography />
    </section>
    <section id="statov-projects" className={styles.projects}>
      <div className={styles.sectionHead}><h2>Мои проекты</h2><p>Создаю проекты, которые меняют настоящее и формируют будущее.</p></div>
      <div className={styles.projectGrid}>{projects.map((project) => <ProjectGallery key={project.name} project={project} />)}</div>
    </section>
    <Journal />
    <footer id="statov-contacts" className={styles.footer}>
      <h2>Статов Андрей</h2>
      <div className={styles.contacts}>
        <a href={channel}>Telegram <ArrowUpRight size={22} /></a>
        <a href={maxChannel}>MAX <ArrowUpRight size={22} /></a>
        <a href={vk}>ВКонтакте <ArrowUpRight size={22} /></a>
        <a href={email}>Почта <ArrowUpRight size={22} /></a>
      </div>
    </footer>
    <dialog id="statov-contact-dialog" ref={contactDialog} className={styles.contactDialog}
      aria-labelledby="statov-contact-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
      <div className={styles.contactPanel}>
        <div className={styles.contactDialogHead}>
          <h2 id="statov-contact-title">Способы связи</h2>
          <button type="button" aria-label="Закрыть" onClick={() => contactDialog.current?.close()}>
            <X size={36} strokeWidth={1.4} />
          </button>
        </div>
        <div className={styles.contactMethods}>
          <a href={channel}>Телеграм</a>
          <a href={vk}>Вконтакте</a>
          <a href={maxChannel}>MAX</a>
          <a href={email}>Почта</a>
        </div>
      </div>
    </dialog>
  </main>;
}
