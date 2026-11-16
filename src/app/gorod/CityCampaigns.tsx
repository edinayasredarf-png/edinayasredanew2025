'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, MapPin, Plus, X } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import s from './city.module.css';

const projects = [
  { title: 'Тенистая аллея', city: 'Краснодар', category: 'Озеленение', author: 'Инициативная группа жителей', image: 'krasnodar', amount: 186000, target: 300000, description: 'Высадим деревья вдоль прогулочной дорожки, чтобы летом здесь было прохладнее гулять.', plan: 'Саженцы, подготовка почвы, посадка и уход в первый сезон.' },
  { title: 'Скамейки у набережной', city: 'Ярославль', category: 'Благоустройство', author: 'Муниципалитет', image: 'yaroslavl', amount: 88000, target: 220000, description: 'Поставим скамейки вдоль прогулочного маршрута, чтобы можно было отдохнуть с видом на реку.', plan: 'Изготовление, доставка и установка скамеек.' },
  { title: 'Указатели к реке', city: 'Тавда', category: 'Навигация', author: 'Инициативная группа жителей', image: 'tavda', amount: 45000, target: 120000, description: 'Обозначим удобный пеший маршрут к воде и добавим карту прогулочных дорожек.', plan: 'Разработка схемы, производство и монтаж указателей.' },
];

const rubles = (amount: number) => new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className={s.dialog} aria-labelledby="city-dialog-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className={s.dialogHead}><h2 id="city-dialog-title">{title}</h2><button className={s.icon} onClick={onClose} aria-label="Закрыть"><X size={21} /></button></div>
      {children}
    </dialog>
  );
}

export default function CityCampaigns() {
  const [index, setIndex] = useState(0);
  const [dialog, setDialog] = useState<'idea' | 'support' | 'details' | null>(null);
  const [amount, setAmount] = useState('500');
  const [complete, setComplete] = useState(false);
  const deck = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const project = projects[index];

  function open(kind: typeof dialog) {
    setComplete(false);
    setAmount('500');
    setDialog(kind);
  }

  function next() {
    setIndex((current) => Math.min(current + 1, projects.length));
  }

  function start() {
    if (!project) setIndex(0);
    deck.current?.focus({ preventScroll: true });
    deck.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComplete(true);
  }

  return (
    <div className={s.site}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" aria-label="Единая среда, главная"><Image src="/img/es_logo_blue.svg" width={146} height={34} alt="Единая среда" /></Link>
          <a className={s.wordmark} href="#top">Город рядом</a>
          <a className={s.navLink} href="#how">Как это работает <ArrowUpRight size={15} /></a>
        </div>
      </header>
      <main id="top" className={s.main}>
        <div className={s.hero}>
          <section className={s.intro} aria-labelledby="city-heading">
            <div className={s.status}><span /> Демоверсия платформы</div>
            <h1 id="city-heading">Хорошие перемены <em>начинаются рядом.</em></h1>
            <p>Предложите идею для своего города или помогите воплотить проект, который вам близок.</p>
            <div className={s.actions}>
              <button className={s.primary} onClick={start}><Heart size={19} /> Поддержать проект <ArrowRight size={18} /></button>
              <button className={s.secondary} onClick={() => open('idea')}><Plus size={20} /> Предложить идею</button>
            </div>
            <a className={s.learn} href="#how"><ArrowDown size={16} /> От заявки до результата</a>
          </section>
          <section ref={deck} className={s.deck} tabIndex={-1} aria-label="Подборка проектов">
            <div className={s.deckLabel}><strong>Проекты рядом</strong><span aria-live="polite">{Math.min(index + 1, projects.length)} / {projects.length}</span></div>
            {project ? <>
              <motion.article key={project.image} className={s.card} initial={reduceMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.65} dragMomentum={false}
                onDragEnd={(_, { offset }) => { if (offset.x > 75) open('support'); else if (offset.x < -75) next(); }}>
                <div className={s.photo}>
                  <Image src={'/gorod/' + project.image + '.webp'} alt={'Вид города: ' + project.city} fill sizes="(max-width: 760px) 90vw, 480px" priority={index === 0} draggable={false} />
                  <span className={s.location}><MapPin size={15} /> {project.city}</span>
                  <span className={s.photoNote}>Фото города</span>
                </div>
                <div className={s.cardBody}>
                  <div className={s.category}>{project.category}</div>
                  <h2>{project.title}</h2>
                  <p>{project.description}</p>
                  <div className={s.funding}><strong>{rubles(project.amount)}</strong><span>из {rubles(project.target)}</span></div>
                  <progress max={project.target} value={project.amount} aria-label="Собрано средств" />
                  <button className={s.details} onClick={() => open('details')}>О проекте <ArrowUpRight size={15} /></button>
                </div>
              </motion.article>
              <div className={s.deckActions}>
                <button className={s.secondary} onClick={next}><ArrowLeft size={17} /> Пропустить</button>
                <button className={s.primary} onClick={() => open('support')}><Heart size={17} /> Поддержать</button>
              </div>
              <p className={s.hint}>Свайп влево — следующий проект · вправо — поддержать</p>
            </> : <div className={s.empty} role="status"><Check size={36} /><h2>Вы посмотрели все проекты</h2><button className={s.secondary} onClick={() => setIndex(0)}>Посмотреть ещё раз</button></div>}
          </section>
        </div>
        <section id="how" className={s.how}>
          <h2>От идеи до результата</h2>
          <ol>
            <li><span>1</span><h3>Предложите проект</h3><p>Житель или муниципалитет описывает, что нужно городу и где.</p></li>
            <li><span>2</span><h3>Проверьте детали</h3><p>Перед сбором команда проверяет смету, согласования и ответственного за работы.</p></li>
            <li><span>3</span><h3>Поддержите и следите</h3><p>Выберите сумму, а после сбора следите за работами и итоговым отчётом.</p></li>
          </ol>
        </section>
      </main>
      <footer className={s.footer}><span>Город рядом · проект «Единой среды»</span><span>Проекты и суммы приведены для примера</span></footer>
      {dialog === 'idea' && <Dialog key={dialog} title={complete ? 'Демо-заявка заполнена' : 'Предложить идею'} onClose={() => setDialog(null)}>
        {complete ? <><p>Вы прошли весь сценарий. Данные никуда не отправлены.</p><button className={s.primary} onClick={() => setDialog(null)}>Готово</button></> :
          <form onSubmit={submit} className={s.form}>
            <p>Попробуйте подать заявку. В демоверсии данные не отправляются.</p>
            <label>Кто предлагает<select required defaultValue="resident"><option value="resident">Житель или инициативная группа</option><option value="municipality">Муниципалитет</option></select></label>
            <label>Город или посёлок<input required maxLength={120} placeholder="Например, Краснодар" /></label>
            <label>Название проекта<input required maxLength={140} placeholder="Например, новая аллея у школы" /></label>
            <label>Что хотите изменить?<textarea required maxLength={1500} rows={3} placeholder="Опишите место и что нужно сделать" /></label>
            <button className={s.primary}>Проверить демо-заявку <ArrowRight size={17} /></button>
          </form>}
      </Dialog>}
      {project && dialog === 'details' && <Dialog key={dialog} title={project.title} onClose={() => setDialog(null)}>
        <p>{project.city} · {project.author}</p><p>{project.description}</p>
        <h3>На что пойдут средства</h3><p>{project.plan}</p>
        <h3>Цель сбора</h3><p>{rubles(project.target)} · демонстрационный проект</p>
        <button className={s.primary} onClick={() => open('support')}><Heart size={17} /> Поддержать</button>
      </Dialog>}
      {project && dialog === 'support' && <Dialog key={dialog} title={complete ? 'Спасибо за поддержку!' : 'Поддержать проект'} onClose={() => setDialog(null)}>
        {complete ? <><p>Демо-взнос {rubles(Number(amount))} для проекта «{project.title}». Деньги не списаны.</p><button className={s.primary} onClick={() => { setDialog(null); next(); }}>К следующему проекту <ArrowRight size={17} /></button></> :
          <form onSubmit={submit} className={s.form}>
            <p>«{project.title}» · {project.city}. Это демо, оплата не проводится.</p>
            <div className={s.amounts}>{[200, 500, 1000].map((value) => <button key={value} type="button" className={s.secondary} aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))}>{rubles(value)}</button>)}</div>
            <label>Сумма в рублях<input type="number" min={1} max={1000000} step={1} required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
            <button className={s.primary}>Подтвердить демо-взнос <ArrowRight size={17} /></button>
          </form>}
      </Dialog>}
    </div>
  );
}
