"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Card_1 = require("./Card");
var features = [
    {
        size: 'big',
        imageSrc: '/img/proverka.svg',
        imageAlt: 'Проверка подрядчиков',
        title: 'Контролируйте работы удалённо',
        description: 'Подрядчики сами вносят данные — вы принимаете работы онлайн',
    },
    {
        size: 'small',
        imageAlt: 'Актуальные данные',
        title: 'Актуальные данные 24/7',
        description: 'Реестры всегда под рукой — для отчетов и проверок',
    },
    {
        size: 'small',
        imageAlt: 'ГИС-платформа',
        title: 'ГИС-платформа для всех данных',
        description: 'Объекты с координатами, границами, атрибутами на карте',
    },
    {
        size: 'small',
        imageAlt: 'Прозрачность действий',
        title: 'Прозрачность действий',
        description: 'Отслеживайте все изменения в системе',
    },
    {
        size: 'small',
        imageAlt: 'Открытость для интеграций',
        title: 'Открытость для интеграций',
        description: 'Обмен данными с региональными/муниц. ИС',
    },
    {
        size: 'big',
        imageSrc: '/img/support.svg',
        imageAlt: 'Поддержка и обучение',
        title: 'Поддержка и обучение',
        description: 'Наши эксперты помогут на каждом этапе',
    },
    {
        size: 'big',
        imageSrc: '/img/pole.svg',
        imageAlt: 'Работайте в поле',
        title: 'Работайте в поле',
        description: 'Вносите данные с мобильных устройств — даже без интернета',
    },
    {
        size: 'small',
        imageAlt: 'Настраивайте доступы',
        title: 'Настраивайте доступы',
        description: 'Гибко управляйте правами: администраторы, проверяющие, подрядчики',
    },
    {
        size: 'small',
        imageAlt: 'Работайте с архивами',
        title: 'Работайте с архивами',
        description: 'Загрузим ваши существующие реестры кладбищ, ЗНО и другие объекты',
    },
];
var SectionFeatures = function () {
    return (<section className="max-w-[1400px] mx-auto mt-8">
      <div className="max-w-[1400px] mx-auto px-2 py-2">
        <h2 className="text-4xl text-black font-medium mb-12 text-left">
          Всё для удобного цифрового контроля и учёта вашей территории
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Карточки */}
          {features.map(function (f, i) { return (<Card_1.default key={i} {...f} textColor="text-black" descColor="text-black"/>); })}
        </div>
      </div>
    </section>);
};
exports.default = SectionFeatures;
