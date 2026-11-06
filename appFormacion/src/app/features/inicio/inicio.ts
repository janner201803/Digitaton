import { ChangeDetectorRef, Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService, ResultadoTomo, calcularEstrellas, calcularPuntos } from '../../core/services/auth.service';

interface Tomo {
  id: number;
  title: string;
  description: string;
  reading: string;
  reference: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

interface Insignia {
  tomo: number;
  icono: string;
  nombre: string;
  descripcion: string;
}

interface Medalla {
  id: 'oro' | 'plata' | 'bronce';
  icono: string;
  nombre: string;
  minPuntos: number;
  descripcion: string;
}

const INSIGNIAS: Insignia[] = [
  { tomo: 5, icono: '🧭', nombre: 'Brújula Ciudadana', descripcion: 'Completaste 5 niveles: ya tienes rumbo hacia una sociedad con derechos.' },
  { tomo: 10, icono: '🌉', nombre: 'Puente de Diálogo', descripcion: 'Completaste 10 niveles: sabes conectar ideas y personas distintas.' },
  { tomo: 15, icono: '📣', nombre: 'Voz Colectiva', descripcion: 'Completaste 15 niveles: tu voz ya cuenta en las decisiones comunes.' },
  { tomo: 20, icono: '🏛️', nombre: 'Guardián del Pluralismo', descripcion: 'Completaste los 20 niveles del curso.' }
];

const MEDALLAS: Medalla[] = [
  { id: 'oro', icono: '🥇', nombre: 'Medalla de Oro', minPuntos: 1600, descripcion: 'Dominio excelente: casi siempre acertaste en los primeros intentos.' },
  { id: 'plata', icono: '🥈', nombre: 'Medalla de Plata', minPuntos: 1200, descripcion: 'Muy buen desempeño a lo largo de todo el recorrido.' },
  { id: 'bronce', icono: '🥉', nombre: 'Medalla de Bronce', minPuntos: 0, descripcion: 'Completaste el curso con perseverancia. ¡Sigue practicando!' }
];

const VIDEOS: Record<number, string> = {
  1: 'https://vimeo.com/1238394266/7d2223ab02?fl=ip&fe=ec&share=copy',
  2: '',
  3: '',
  4: '',
  5: ''
  // 6: 'URL_VIDEO_6',
  // 7: 'URL_VIDEO_7',
  // 8: 'URL_VIDEO_8',
  // 9: 'URL_VIDEO_9',
  // 10: 'URL_VIDEO_10',
  // 11: 'URL_VIDEO_11',
  // 12: 'URL_VIDEO_12',
  // 13: 'URL_VIDEO_13',
  // 14: 'URL_VIDEO_14',
  // 15: 'URL_VIDEO_15',
  // 16: 'URL_VIDEO_16',
  // 17: 'URL_VIDEO_17',
  // 18: 'URL_VIDEO_18',
  // 19: 'URL_VIDEO_19',
  // 20: 'URL_VIDEO_20'
};

function aEmbed(url: string): string {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  if (url.includes('player.vimeo.com')) return url;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (vm) {
    const hash = vm[2] ?? new URL(url).searchParams.get('h');
    return `https://player.vimeo.com/video/${vm[1]}${hash ? `?h=${hash}` : ''}`;
  }
  return url;
}

function crearSemilla(texto: string): number {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

function generadorAleatorio(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ordenAleatorio(cantidad: number, clave: string): number[] {
  const rand = generadorAleatorio(crearSemilla(clave));
  const orden = Array.from({ length: cantidad }, (_, i) => i);
  for (let i = cantidad - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  return orden;
}

const contenidos: Omit<Tomo, 'id'>[] = [
  {
    title: 'Ciudadanía',
    description: 'Participa y construye en comunidad.',
    reading: 'Pertenencia a una comunidad política que reconoce a las personas como sujetos de derechos y responsabilidades. Comprende participar en los asuntos públicos, intervenir en decisiones colectivas, expresar opiniones, organizarse y exigir el respeto de los derechos. Por eso, la ciudadanía no se limita a tener nacionalidad o votar: también se construye mediante prácticas cotidianas de participación, convivencia y compromiso con la vida en común.',
    reference: 'Constitución Política, arts. 40, 95 y 98.',
    question: 'En un barrio, un grupo de vecinos se reúne para expresar sus necesidades, proponer soluciones a un problema comunitario y solicitar la intervención de las autoridades. ¿Qué permite reconocer esta situación como una práctica de ciudadanía?',
    answers: [
      'La pertenencia formal de los vecinos a una comunidad política mediante su nacionalidad.',
      'La participación de los vecinos en procesos electorales para elegir representantes políticos.',
      'El ejercicio de derechos y responsabilidades mediante acciones que buscan mejorar la vida colectiva.',
      'El cumplimiento de normas institucionales para mantener el orden y la convivencia en la comunidad.'
    ],
    correctAnswer: 2,
    feedbackCorrect: '¡Muy bien! La ciudadanía no se limita a tener una nacionalidad o pertenecer formalmente a un Estado. También implica ejercer derechos y asumir responsabilidades mediante acciones que contribuyen a la vida colectiva. Cuando una comunidad identifica sus necesidades, propone soluciones e interviene en los asuntos que la afectan, está ejerciendo ciudadanía.',
    feedbackIncorrect: 'Recuerda que la ciudadanía va más allá de la pertenencia formal a un país o de participar en elecciones. También se expresa en la vida cotidiana, cuando las personas reconocen sus derechos, asumen responsabilidades y participan en la construcción de soluciones para los asuntos comunes. Revisa cuál opción recoge esta dimensión activa y colectiva.'
  },
  {
    title: 'Dignidad humana',
    description: 'Reconoce el valor propio de cada persona.',
    reading: 'Principio según el cual toda persona tiene un valor propio que debe ser respetado, sin importar su origen, identidad, edad, condición económica, creencias u otras características. Reconocer la dignidad implica tratar a las personas como sujetos de derechos, respetar su autonomía e integridad y evitar prácticas que las humillen, discriminen o instrumentalicen.',
    reference: 'Constitución Política, arts. 1 y 5.',
    question: 'Una institución ignora las solicitudes de atención de una persona mayor y toma decisiones sobre ella sin escuchar sus necesidades ni respetar su autonomía. ¿Qué principio permite comprender por qué esta situación puede afectar a la persona?',
    answers: [
      'Toda persona tiene un valor propio y debe ser reconocida como sujeto de derechos y decisiones.',
      'Toda persona debe recibir los mismos servicios institucionales, independientemente de sus necesidades.',
      'Toda persona debe cumplir las normas institucionales para acceder a los servicios disponibles.',
      'Toda persona tiene derecho a recibir un trato cordial en sus relaciones con otras personas.'
    ],
    correctAnswer: 0,
    feedbackCorrect: '¡Correcto! La dignidad humana reconoce que toda persona tiene un valor propio que debe ser respetado. Esto significa reconocerla como sujeto de derechos, escuchar sus necesidades y respetar su autonomía. Las instituciones deben evitar decisiones que desconozcan la capacidad de las personas para participar en los asuntos que las afectan.',
    feedbackIncorrect: 'La dignidad humana no se reduce a recibir un trato amable ni a cumplir determinadas normas. Se fundamenta en el valor propio de cada persona y exige reconocerla como sujeto de derechos, respetar su autonomía y considerar su voz en las decisiones que afectan su vida. Piensa qué opción expresa este reconocimiento fundamental.'
  },
  {
    title: 'Derechos humanos',
    description: 'Conoce las bases de una vida digna.',
    reading: 'Derechos y libertades que corresponden a todas las personas por el hecho de ser humanas. Protegen condiciones esenciales para vivir con dignidad, como la vida, la libertad, la igualdad, la integridad, la educación y la participación. Son universales y deben garantizarse sin discriminación. Los Estados tienen obligaciones de respetarlos, protegerlos y adoptar medidas para hacerlos efectivos.',
    reference: 'DUDH (1948); Pacto Internacional de Derechos Civiles y Políticos (1966).',
    question: 'Una comunidad migrante solicita acceso a servicios educativos y de salud, argumentando que sus integrantes tienen los mismos derechos que cualquier otra persona. ¿Cuál afirmación fundamenta mejor esta solicitud?',
    answers: [
      'Los derechos dependen de la nacionalidad y de la condición jurídica reconocida por cada Estado.',
      'Los derechos se adquieren cuando las personas cumplen sus deberes dentro de una comunidad política.',
      'Los derechos corresponden principalmente a quienes pueden ejercerlos sin enfrentar barreras sociales.',
      'Los derechos pertenecen a todas las personas por su condición humana y deben garantizarse sin discriminación.'
    ],
    correctAnswer: 3,
    feedbackCorrect: '¡Muy bien! Los derechos humanos pertenecen a todas las personas por el hecho de ser humanas. No dependen de la nacionalidad, el origen, la condición migratoria ni de los méritos individuales. Por eso, las instituciones deben garantizar su reconocimiento y protección sin discriminación.',
    feedbackIncorrect: 'Recuerda que los derechos humanos son universales: no se obtienen por cumplir determinados requisitos, pertenecer a un país o demostrar ciertas capacidades. Su fundamento es la condición humana. Revisa cuál opción reconoce que todas las personas son titulares de estos derechos, sin distinciones.'
  },
  {
    title: 'Igualdad y no discriminación',
    description: 'Identifica barreras para una igualdad real.',
    reading: 'Principios y garantías que reconocen que todas las personas tienen igual dignidad y deben recibir igual protección de la ley. Prohíben distinciones injustificadas que limiten derechos por razones como sexo, identidad, origen étnico, religión, opinión, discapacidad o condición económica. También exigen medidas para superar desigualdades y barreras que impiden una igualdad real y efectiva.',
    reference: 'Constitución Política, art. 13.',
    question: 'Una universidad instala rampas y adecuaciones de accesibilidad para garantizar que estudiantes con discapacidad puedan desplazarse por sus instalaciones. ¿Por qué estas medidas contribuyen a la igualdad?',
    answers: [
      'Porque establecen condiciones idénticas de acceso para todas las personas de la institución.',
      'Porque eliminan barreras específicas que dificultan el ejercicio efectivo de los derechos.',
      'Porque reconocen beneficios exclusivos para quienes presentan condiciones particulares de movilidad.',
      'Porque permiten que cada persona resuelva individualmente las dificultades de acceso existentes.'
    ],
    correctAnswer: 1,
    feedbackCorrect: '¡Excelente! La igualdad no siempre significa ofrecer exactamente lo mismo a todas las personas. En ocasiones, para garantizar que todas puedan ejercer efectivamente sus derechos, es necesario identificar y eliminar las barreras que afectan a determinados grupos. Las adaptaciones de accesibilidad son un ejemplo de cómo avanzar hacia una igualdad real.',
    feedbackIncorrect: 'Ten presente que tratar a todas las personas de manera idéntica no garantiza necesariamente igualdad. Algunas enfrentan barreras que dificultan el ejercicio de sus derechos. Para avanzar hacia una igualdad efectiva, es necesario reconocer esas condiciones y adoptar medidas que permitan superarlas. Revisa qué opción expresa esta idea.'
  },
  {
    title: 'Diversidad étnica y cultural',
    description: 'Reconoce la riqueza de pueblos y comunidades.',
    reading: 'Reconocimiento de la existencia de pueblos, comunidades y grupos con distintas identidades, lenguas, memorias, conocimientos, prácticas culturales, formas de organización y relaciones con el territorio. En Colombia, la Constitución reconoce y protege esta diversidad como parte de la nación. Esto implica respetar las diferencias y garantizar los derechos de los pueblos y comunidades.',
    reference: 'Constitución Política, arts. 7, 8, 10, 70 y 72; Convenio 169 de la OIT, aprobado por Ley 21 de 1991.',
    question: 'Una institución educativa desarrolla un proyecto sobre comunidades indígenas y afrodescendientes, incluyendo sus lenguas, conocimientos, memorias y formas de organización. ¿Qué comprensión de la diversidad expresa esta iniciativa?',
    answers: [
      'La identificación de celebraciones, comidas y expresiones tradicionales de diferentes comunidades.',
      'La comparación de costumbres y manifestaciones culturales entre los grupos de una sociedad.',
      'El reconocimiento de identidades, conocimientos, historias y derechos de los diferentes pueblos.',
      'La incorporación de actividades culturales que permitan conocer las tradiciones de otros grupos.'
    ],
    correctAnswer: 2,
    feedbackCorrect: '¡Correcto! La diversidad étnica y cultural no consiste únicamente en reconocer costumbres, celebraciones o expresiones tradicionales. Implica valorar las identidades, los conocimientos, las historias y los derechos de los pueblos y comunidades. Este reconocimiento contribuye a una sociedad que respeta sus distintas formas de comprender y habitar el mundo.',
    feedbackIncorrect: 'La diversidad étnica y cultural comprende mucho más que las manifestaciones visibles de una cultura, como la gastronomía, la música o las celebraciones. También involucra identidades, memorias, conocimientos, formas de organización y derechos colectivos. Identifica cuál opción reconoce esta dimensión amplia de la diversidad.'
  },
  {
    title: 'Constitución Política de 1991',
    description: 'Comprende la norma que organiza y limita el poder.',
    reading: 'Norma fundamental del Estado colombiano. Establece los principios que orientan la organización del país, reconoce derechos y deberes, define la estructura y funciones de las instituciones y establece mecanismos de participación y protección. Las autoridades y las demás normas del ordenamiento jurídico deben actuar de acuerdo con sus disposiciones.',
    reference: 'Constitución Política, arts. 2, 4, 40 y 86.',
    question: 'Una autoridad pública adopta una decisión que desconoce un derecho reconocido en la Constitución Política de Colombia. ¿Por qué puede cuestionarse jurídicamente esa decisión?',
    answers: [
      'Porque todas las autoridades deben actuar conforme a la Constitución, que organiza y limita el poder público.',
      'Porque las autoridades deben consultar a la ciudadanía antes de adoptar cualquier decisión institucional.',
      'Porque las instituciones públicas deben aplicar únicamente las normas aprobadas por los gobiernos anteriores.',
      'Porque las decisiones de las autoridades deben coincidir con las preferencias de la mayoría de ciudadanos.'
    ],
    correctAnswer: 0,
    feedbackCorrect: '¡Muy bien! La Constitución Política de 1991 es la norma fundamental que organiza el Estado, reconoce derechos y establece límites al ejercicio del poder público. Por eso, ninguna autoridad puede tomar decisiones por fuera del marco constitucional. Sus actuaciones deben respetar los principios y derechos que establece la Constitución.',
    feedbackIncorrect: 'Recuerda que la Constitución no es simplemente un conjunto de recomendaciones para las instituciones. Es la norma fundamental que organiza el Estado, reconoce derechos y establece límites a las autoridades. Por eso, sus decisiones deben ajustarse a sus disposiciones, incluso cuando tengan respaldo institucional o mayoritario.'
  },
  {
    title: 'Estado Social de Derecho',
    description: 'Descubre cómo se hacen efectivos los derechos.',
    reading: 'Forma de organización política establecida por la Constitución colombiana. Supone que las autoridades están sometidas a la Constitución y las leyes y que el Estado debe promover condiciones para que los derechos sean efectivos y las personas puedan vivir con dignidad. Se fundamenta en la dignidad humana, el trabajo, la solidaridad, la participación y la prevalencia del interés general.',
    reference: 'Constitución Política, arts. 1 y 2; Corte Constitucional, Sentencia T-406 de 1992.',
    question: 'Una comunidad rural debe desplazarse durante varias horas para recibir atención médica, aunque este servicio está reconocido como un derecho. ¿Qué responsabilidad expresa el principio de Estado Social de Derecho?',
    answers: [
      'Reconocer legalmente los derechos y permitir que cada persona gestione individualmente su acceso.',
      'Promover la participación comunitaria para que los ciudadanos resuelvan sus necesidades de manera autónoma.',
      'Establecer normas generales para organizar los servicios y regular las relaciones entre instituciones.',
      'Promover condiciones materiales e institucionales para que los derechos puedan ejercerse efectivamente.'
    ],
    correctAnswer: 3,
    feedbackCorrect: '¡Excelente! El Estado Social de Derecho no se limita a reconocer formalmente los derechos. También exige promover las condiciones sociales e institucionales necesarias para que las personas puedan ejercerlos efectivamente. Esto implica atender desigualdades y remover obstáculos que impiden el acceso real a servicios y garantías.',
    feedbackIncorrect: 'Reconocer un derecho en las normas no garantiza, por sí solo, que todas las personas puedan ejercerlo. El Estado Social de Derecho implica una responsabilidad activa de las instituciones para generar condiciones materiales que hagan efectivos los derechos. Piensa en la diferencia entre reconocer un derecho y garantizar su ejercicio real.'
  },
  {
    title: 'Derechos fundamentales',
    description: 'Identifica los derechos protegidos constitucionalmente.',
    reading: 'Derechos reconocidos por el orden constitucional colombiano que protegen dimensiones esenciales de la persona y de la vida en sociedad, como la vida, la igualdad, la libertad, la intimidad, la expresión y la participación. Cuando son vulnerados o amenazados, pueden existir mecanismos judiciales para solicitar su protección, entre ellos la acción de tutela, de acuerdo con las condiciones constitucionales y legales.',
    reference: 'Constitución Política, Título II y art. 86; Decreto 2591 de 1991, arts. 1 y 2; Corte Constitucional, Sentencia T-406 de 1992.',
    question: 'Una persona considera que una institución ha vulnerado su derecho a la intimidad y busca identificar mecanismos constitucionales para solicitar protección. ¿Qué caracteriza al derecho que busca proteger?',
    answers: [
      'Es un derecho reconocido internacionalmente que depende de su incorporación en una ley nacional.',
      'Es un derecho protegido por el orden constitucional colombiano y susceptible de mecanismos judiciales de protección.',
      'Es un beneficio establecido por las instituciones para garantizar condiciones de convivencia en la sociedad.',
      'Es una garantía que se reconoce exclusivamente cuando existe una decisión judicial que ordena protegerla.'
    ],
    correctAnswer: 1,
    feedbackCorrect: '¡Correcto! Los derechos fundamentales cuentan con reconocimiento y protección dentro del ordenamiento constitucional colombiano. Cuando son amenazados o vulnerados, las personas pueden acudir a mecanismos judiciales previstos para solicitar su protección. Su garantía no depende exclusivamente de que una autoridad decida reconocerlos en un caso particular.',
    feedbackIncorrect: 'Los derechos fundamentales no son beneficios que una institución concede a voluntad ni garantías que existen únicamente después de una decisión judicial. Son derechos reconocidos y protegidos por el orden constitucional. Cuando se ven amenazados o vulnerados, existen mecanismos para solicitar su protección. Revisa cuál opción recoge esta característica.'
  },
  {
    title: 'Pluralismo',
    description: 'Conoce el valor de nuestras diferencias.',
    reading: 'Principio de organización democrática que reconoce la coexistencia de distintas ideas, creencias, identidades, culturas, intereses y formas de comprender la sociedad. Supone que las diferencias puedan expresarse y participar en la vida pública, sin que una sola visión se imponga como la única legítima. Requiere respeto por los derechos y condiciones para que distintas voces intervengan en las decisiones colectivas.',
    reference: 'Constitución Política, arts. 1, 7, 18, 19 y 20.',
    question: 'En una comunidad existen diferentes opiniones sobre el uso de un espacio público. Sus integrantes debaten propuestas y buscan una decisión sin imponer una única visión. ¿Qué principio orienta esta forma de resolver las diferencias?',
    answers: [
      'El reconocimiento de distintas posiciones que pueden expresarse y debatirse respetando los derechos.',
      'La aceptación de todas las propuestas existentes para evitar desacuerdos entre los integrantes.',
      'La selección de una posición mayoritaria que represente los intereses de toda la comunidad.',
      'La eliminación de las diferencias mediante acuerdos que establezcan una única forma de pensar.'
    ],
    correctAnswer: 0,
    feedbackCorrect: '¡Muy bien! El pluralismo reconoce que en una sociedad pueden coexistir distintas ideas, perspectivas e intereses. No exige que todas las personas piensen igual ni que desaparezcan los desacuerdos. Por el contrario, permite expresar y debatir las diferencias dentro del respeto por los derechos de los demás.',
    feedbackIncorrect: 'El pluralismo no significa aceptar todas las propuestas sin discusión, imponer la decisión de la mayoría ni eliminar las diferencias. Significa reconocer que existen distintas perspectivas y que estas pueden expresarse, debatirse y participar en la vida colectiva, respetando los derechos de todas las personas.'
  },
  {
    title: 'Democracia',
    description: 'Explora cómo construimos acuerdos colectivos.',
    reading: 'Forma de organización política en la que la soberanía reside en el pueblo y el poder público debe responder a su voluntad. Se ejerce mediante representantes elegidos y a través de mecanismos de participación. Requiere elecciones libres, reconocimiento del pluralismo, respeto por los derechos, posibilidad de expresar opiniones y condiciones para intervenir en los asuntos colectivos.',
    reference: 'Constitución Política, arts. 1 y 3.',
    question: 'Después de unas elecciones, una comunidad participa en debates sobre decisiones públicas, solicita explicaciones a sus representantes y hace seguimiento a su gestión. ¿Qué comprensión de la democracia refleja esta situación?',
    answers: [
      'La organización política basada principalmente en elegir representantes mediante procedimientos electorales.',
      'La administración de los asuntos públicos mediante instituciones que toman decisiones para la ciudadanía.',
      'Una forma de organización política que combina representación, participación, derechos y control del poder.',
      'Un sistema de gobierno que permite a las mayorías definir las decisiones y prioridades de la sociedad.'
    ],
    correctAnswer: 2,
    feedbackCorrect: '¡Excelente! La democracia no termina con la elección de representantes. También requiere participación ciudadana, garantía de derechos y mecanismos para vigilar y controlar el ejercicio del poder. Una democracia activa necesita ciudadanos que intervengan en los asuntos públicos y hagan seguimiento a las decisiones de sus representantes.',
    feedbackIncorrect: 'Recuerda que las elecciones son fundamentales, pero no agotan el significado de la democracia. Esta también supone participación más allá de las urnas, reconocimiento de derechos y control sobre quienes ejercen el poder. Revisa qué opción integra estas dimensiones de la organización democrática.'
  },
  {
    title: 'Participación ciudadana',
    description: 'Haz parte de las decisiones de tu comunidad.',
    reading: 'Intervención de las personas y comunidades en los asuntos públicos y en las decisiones que afectan su vida individual y colectiva. Puede desarrollarse mediante elecciones, consultas, espacios de deliberación, organizaciones sociales, iniciativas comunitarias, movilizaciones y mecanismos de control a la gestión pública. Permite expresar necesidades, formular propuestas, incidir en decisiones y hacer seguimiento a las instituciones.',
    reference: 'Constitución Política, arts. 2, 40 y 103; Ley 1757 de 2015.',
    question: 'Los habitantes de un municipio asisten a una reunión pública, presentan propuestas sobre el transporte y solicitan que sus necesidades sean consideradas en las decisiones. ¿Qué condición permite reconocer una participación ciudadana efectiva?',
    answers: [
      'La asistencia de los habitantes a los espacios institucionales convocados por las autoridades.',
      'La expresión de opiniones individuales sobre los problemas que afectan a la comunidad.',
      'La presentación de solicitudes ante las instituciones responsables de prestar servicios públicos.',
      'La posibilidad de intervenir informadamente, ser escuchados e influir en las decisiones colectivas.'
    ],
    correctAnswer: 3,
    feedbackCorrect: '¡Muy bien! La participación ciudadana es efectiva cuando las personas pueden intervenir de manera informada en los asuntos colectivos, expresar sus necesidades, ser escuchadas e incidir en las decisiones. No basta con asistir a una reunión o presentar una solicitud: es importante que exista la posibilidad real de influir en los asuntos públicos.',
    feedbackIncorrect: 'Participar no significa únicamente asistir a espacios institucionales, expresar opiniones o presentar solicitudes. Una participación efectiva requiere que las personas tengan información, puedan intervenir, sean escuchadas y cuenten con posibilidades de incidir en las decisiones colectivas. Revisa cuál opción incluye estas condiciones.'
  },
  {
    title: 'Voto',
    description: 'Ejerce una decisión libre e informada.',
    reading: 'Derecho y mecanismo de participación política mediante el cual los ciudadanos eligen representantes o intervienen en determinadas decisiones democráticas. En Colombia, el voto debe ejercerse de manera libre y secreta, sin presiones ni coacciones. Permite expresar preferencias y contribuir a la conformación de las instituciones representativas.',
    reference: 'Constitución Política, arts. 40 y 258.',
    question: 'Una ciudadana compara las propuestas de diferentes candidatos y decide su voto sin aceptar presiones de otras personas. ¿Qué característica del voto se evidencia principalmente en esta situación?',
    answers: [
      'Su carácter obligatorio como mecanismo para elegir representantes de las instituciones públicas.',
      'Su ejercicio libre y secreto, sustentado en información y decisiones autónomas de los ciudadanos.',
      'Su función como mecanismo exclusivo para participar en las decisiones de carácter electoral.',
      'Su condición de procedimiento mediante el cual las autoridades consultan las preferencias ciudadanas.'
    ],
    correctAnswer: 1,
    feedbackCorrect: '¡Correcto! El voto es un mecanismo de participación democrática que debe ejercerse de manera libre y secreta. Su sentido democrático se fortalece cuando las personas toman decisiones autónomas e informadas, sin presiones ni imposiciones. Así, cada ciudadano puede expresar su voluntad en la elección de representantes o en otros procesos electorales.',
    feedbackIncorrect: 'El voto no debe entenderse únicamente como un procedimiento electoral o una obligación. Su carácter democrático depende de que las personas puedan expresar su voluntad libremente, sin presiones y con autonomía. La información también es importante para tomar decisiones conscientes. Identifica cuál opción reúne estas características.'
  },
  {
    title: 'Libertad de expresión',
    description: 'Expresa ideas y busca información con responsabilidad.',
    reading: 'Derecho de toda persona a expresar y difundir pensamientos y opiniones, así como a buscar, recibir y comunicar información e ideas por distintos medios. Es esencial para la vida democrática porque permite debatir asuntos públicos, cuestionar decisiones, compartir conocimientos y hacer visibles situaciones que afectan a personas y comunidades. Su ejercicio debe armonizarse con los derechos de los demás y las responsabilidades establecidas por la ley.',
    reference: 'Constitución Política, art. 20.',
    question: 'Un estudiante publica una crítica sobre una decisión institucional y comparte información relacionada con sus efectos en la comunidad. ¿Qué derecho respalda principalmente esta actuación?',
    answers: [
      'El derecho a participar en decisiones institucionales mediante mecanismos de representación ciudadana.',
      'El derecho a expresar acuerdos y desacuerdos únicamente en espacios autorizados por las instituciones.',
      'El derecho a expresar opiniones y buscar o comunicar información respetando los derechos de los demás.',
      'El derecho a difundir cualquier contenido sin considerar sus efectos sobre otras personas.'
    ],
    correctAnswer: 2,
    feedbackCorrect: '¡Excelente! La libertad de expresión protege la posibilidad de comunicar opiniones, buscar y compartir información, incluso cuando se cuestionan decisiones institucionales. Este derecho es fundamental para el debate público y la participación democrática. Su ejercicio debe considerar los derechos de las demás personas y las responsabilidades correspondientes.',
    feedbackIncorrect: 'La libertad de expresión no está limitada a los espacios autorizados por las instituciones ni significa que cualquier contenido pueda difundirse sin considerar los derechos de otras personas. Este derecho protege la posibilidad de expresar opiniones y buscar o comunicar información, dentro del respeto por los demás derechos.'
  },
  {
    title: 'Acción colectiva',
    description: 'Une esfuerzos para generar cambios.',
    reading: 'Actuación coordinada de varias personas o grupos que se organizan para expresar demandas, defender intereses compartidos, visibilizar problemáticas o promover cambios sociales. Puede desarrollarse mediante organizaciones comunitarias, movimientos sociales, movilizaciones, campañas, redes de apoyo, iniciativas culturales o acciones de defensa de derechos.',
    reference: 'Constitución Política, arts. 37 y 38.',
    question: 'Un grupo de mujeres organiza una campaña para visibilizar situaciones de violencia y promover respuestas institucionales. ¿Qué característica permite identificar esta iniciativa como acción colectiva?',
    answers: [
      'La coordinación de esfuerzos para defender intereses compartidos y promover cambios sociales.',
      'La participación individual en actividades destinadas a expresar opiniones sobre problemas sociales.',
      'La intervención de organizaciones institucionales para atender situaciones de interés comunitario.',
      'La realización de movilizaciones masivas para comunicar demandas ante las autoridades públicas.'
    ],
    correctAnswer: 0,
    feedbackCorrect: '¡Muy bien! La acción colectiva ocurre cuando varias personas articulan esfuerzos alrededor de intereses, necesidades o demandas compartidas. Mediante la organización y la coordinación, pueden visibilizar problemáticas, defender derechos e impulsar transformaciones sociales. Su fuerza está en la construcción de propósitos comunes.',
    feedbackIncorrect: 'La acción colectiva no consiste simplemente en que varias personas expresen opiniones o asistan a una movilización. Su elemento central es la articulación de esfuerzos alrededor de intereses compartidos, con el propósito de defender derechos, visibilizar problemas o promover cambios sociales. Revisa cuál opción recoge esta dimensión organizativa.'
  },
  {
    title: 'Territorio',
    description: 'Comprende los vínculos entre comunidad y territorio.',
    reading: 'Espacio geográfico y social en el que las personas y comunidades construyen relaciones, formas de vida, identidad, memoria, organización y pertenencia. No se limita a una superficie física o a un espacio de propiedad: puede incluir dimensiones culturales, históricas, económicas, políticas y espirituales. Para muchos pueblos y comunidades, el territorio es fundamental para la continuidad de sus prácticas culturales, formas de organización y relaciones con la naturaleza.',
    reference: 'Constitución Política, arts. 7, 63, 286, 329 y 330, según su ámbito.',
    question: 'Una comunidad defiende un río porque representa una fuente de vida, memoria, identidad y continuidad de sus prácticas culturales. ¿Qué comprensión del territorio expresa esta situación?',
    answers: [
      'El reconocimiento de un espacio geográfico delimitado por características físicas y ambientales.',
      'La protección de un recurso natural por su importancia económica para una población determinada.',
      'La defensa de una propiedad colectiva frente a los intereses de otros grupos sociales.',
      'La comprensión de un espacio construido mediante relaciones, identidades, memorias y formas de vida.'
    ],
    correctAnswer: 3,
    feedbackCorrect: '¡Correcto! El territorio no es solamente un espacio geográfico o un recurso natural. También se construye mediante las relaciones sociales, las memorias, las identidades y las prácticas culturales de quienes lo habitan. Por eso, defender un río puede significar proteger no solo el ambiente, sino también la historia y las formas de vida de una comunidad.',
    feedbackIncorrect: 'El territorio no puede comprenderse únicamente como una superficie delimitada o un recurso que puede aprovecharse económicamente. También tiene dimensiones sociales, culturales, políticas y simbólicas. Las relaciones, memorias, identidades y formas de vida de las comunidades contribuyen a construir su significado.'
  },
  {
    title: 'Vulneración de derechos',
    description: 'Aprende a analizar posibles vulneraciones.',
    reading: 'Situación en la que una acción u omisión afecta, desconoce, restringe o impide el ejercicio de un derecho. Puede ocurrir cuando una autoridad niega injustificadamente un servicio, una persona es discriminada o una comunidad enfrenta barreras que impiden acceder a derechos básicos. Para analizar una posible vulneración es necesario identificar el derecho comprometido, los hechos, las personas o instituciones involucradas y las condiciones del caso.',
    reference: 'Constitución Política, arts. 2, 5, 13 y 86.',
    question: 'Una persona denuncia que le negaron un servicio por razones discriminatorias y considera que se afectó su derecho a la igualdad. ¿Qué debe hacerse para identificar si existe una vulneración de derechos?',
    answers: [
      'Determinar si la persona recibió un trato desfavorable frente a otras personas de su comunidad.',
      'Examinar los hechos, el derecho comprometido y las personas o instituciones involucradas.',
      'Establecer si la situación generó inconformidad y si existen personas que respaldan la denuncia.',
      'Identificar si la institución incumplió sus procedimientos y si puede recibir una sanción administrativa.'
    ],
    correctAnswer: 1,
    feedbackCorrect: '¡Muy bien! Para identificar una posible vulneración de derechos no basta con reconocer que una persona está inconforme o recibió un trato desfavorable. Es necesario analizar los hechos, establecer qué derecho podría estar comprometido e identificar a las personas o instituciones involucradas. Este análisis permite comprender la situación y valorar las posibles acciones de protección.',
    feedbackIncorrect: 'Una vulneración de derechos requiere un análisis que vaya más allá de la inconformidad personal o de la existencia de una irregularidad administrativa. Es necesario examinar qué ocurrió, cuál derecho pudo verse afectado y quiénes participaron en la situación. Estos elementos permiten valorar si existe una afectación de derechos.'
  },
  {
    title: 'Acción de tutela',
    description: 'Conoce un mecanismo de protección inmediata.',
    reading: 'Mecanismo judicial establecido por la Constitución colombiana para solicitar la protección inmediata de derechos constitucionales fundamentales cuando son vulnerados o amenazados por la acción u omisión de una autoridad pública. También puede proceder contra particulares en las circunstancias previstas por la ley. Puede presentarla la persona afectada o quien actúe en su nombre y se tramita mediante un procedimiento preferente y sumario.',
    reference: 'Constitución Política, art. 86; Decreto 2591 de 1991, arts. 1, 2, 5, 6 y 10.',
    question: 'Una persona considera que una autoridad pública está amenazando su derecho fundamental a la salud y busca una protección judicial inmediata. ¿Qué mecanismo podría utilizar, si se cumplen los requisitos legales?',
    answers: [
      'El control social, porque permite vigilar las decisiones de las instituciones públicas.',
      'La acción colectiva, porque permite organizar personas para defender intereses compartidos.',
      'La acción de tutela, porque permite solicitar protección inmediata de derechos fundamentales.',
      'La participación ciudadana, porque permite intervenir en las decisiones de las autoridades públicas.'
    ],
    correctAnswer: 2,
    feedbackCorrect: '¡Excelente! La acción de tutela es un mecanismo constitucional que permite solicitar la protección inmediata de los derechos fundamentales cuando estos resultan vulnerados o amenazados, de acuerdo con los requisitos establecidos. Es una herramienta que acerca la protección judicial a las personas frente a situaciones que afectan sus derechos.',
    feedbackIncorrect: 'Es importante diferenciar los mecanismos de participación y control ciudadano de los mecanismos judiciales de protección. La acción de tutela permite acudir ante un juez para solicitar la protección inmediata de derechos fundamentales cuando se cumplen los requisitos constitucionales y legales. Revisa qué opción corresponde a esta finalidad.'
  },
  {
    title: 'Control social',
    description: 'Haz seguimiento a la gestión pública.',
    reading: 'Derecho y deber de los ciudadanos de participar, individualmente o mediante organizaciones, en la vigilancia de la gestión pública y sus resultados. Permite hacer seguimiento a decisiones institucionales, políticas públicas, prestación de servicios y uso de recursos públicos. Puede ejercerse solicitando información, presentando observaciones, peticiones, quejas o denuncias y participando en espacios de seguimiento.',
    reference: 'Constitución Política, arts. 40 y 270; Ley 1757 de 2015, arts. 60–63; Ley 850 de 2003.',
    question: 'Los habitantes de un barrio solicitan información sobre los recursos destinados a una obra pública y verifican si su ejecución corresponde a lo anunciado. ¿Qué práctica están ejerciendo?',
    answers: [
      'El control social, mediante el seguimiento ciudadano a la gestión y los recursos públicos.',
      'La participación electoral, mediante la evaluación ciudadana de las decisiones de los gobernantes.',
      'La acción colectiva, mediante la organización comunitaria para defender intereses compartidos.',
      'La libertad de expresión, mediante la difusión de opiniones sobre las actuaciones institucionales.'
    ],
    correctAnswer: 0,
    feedbackCorrect: '¡Correcto! El control social permite que la ciudadanía haga seguimiento a la gestión pública y vigile el uso de los recursos colectivos. Solicitar información, revisar la ejecución de una obra y verificar el cumplimiento de compromisos son prácticas que contribuyen a la transparencia y la rendición de cuentas de las instituciones.',
    feedbackIncorrect: 'El control social no consiste únicamente en expresar opiniones sobre las instituciones, elegir representantes o movilizarse frente a una problemática. Implica hacer seguimiento a la gestión pública, solicitar información y vigilar cómo se toman las decisiones y se utilizan los recursos colectivos.'
  },
  {
    title: 'Interculturalidad',
    description: 'Aprende del diálogo entre culturas.',
    reading: 'Perspectiva que promueve relaciones de diálogo, reconocimiento y aprendizaje entre personas y comunidades con diferentes referentes culturales. No se limita a la coexistencia de culturas: busca construir relaciones respetuosas y equitativas, reconocer las diferencias y examinar las desigualdades y relaciones de poder que pueden afectar el encuentro entre ellas.',
    reference: 'Constitución Política, arts. 7, 8, 10 y 70; Walsh (2005), Signo y Pensamiento, 24(46), 39–50; Walsh (2007), Revista Educación y Pedagogía, 19(48), 25–35.',
    question: 'En una universidad participan comunidades con diferentes referentes culturales. La institución promueve el diálogo, reconoce sus conocimientos y revisa las barreras que limitan la participación de algunas voces. ¿Qué caracteriza este enfoque?',
    answers: [
      'La coexistencia de diferentes culturas dentro de un mismo espacio institucional y educativo.',
      'El reconocimiento de las manifestaciones culturales mediante actividades de integración y celebración.',
      'La aceptación de las diferencias culturales mediante normas comunes de convivencia institucional.',
      'La construcción de relaciones de diálogo y aprendizaje que buscan superar desigualdades entre culturas.'
    ],
    correctAnswer: 3,
    feedbackCorrect: '¡Muy bien! La interculturalidad no se limita a la coexistencia de culturas diferentes ni a la celebración de sus expresiones. Propone construir relaciones de diálogo, reconocimiento y aprendizaje entre ellas, cuestionando las desigualdades que hacen que unas voces o conocimientos tengan mayor legitimidad que otros. Implica avanzar hacia relaciones más equitativas.',
    feedbackIncorrect: 'Recuerda que la interculturalidad va más allá de reconocer que existen diferentes culturas en un mismo espacio. Busca promover relaciones de diálogo y aprendizaje, reconociendo los conocimientos de distintos grupos y cuestionando las desigualdades que limitan su participación y reconocimiento.'
  },
  {
    title: 'Ciudadanía digital',
    description: 'Ejerce tus derechos en entornos digitales.',
    reading: 'Ejercicio de derechos, responsabilidades y formas de participación en los entornos digitales. Comprende acceder a información, expresarse, comunicarse, aprender, participar en asuntos públicos y organizar acciones colectivas mediante tecnologías. También implica utilizar estos espacios de manera crítica, segura y responsable, respetar los derechos de otras personas y reconocer riesgos como la desinformación, el acoso, la discriminación y la exposición indebida de datos personales.',
    reference: 'Consejo de Europa, Recommendation CM/Rec(2019)10; Consejo de Europa (2017), Digital Citizenship Education: Volume 1; UNESCO (2015); Constitución Política, arts. 13, 15, 20 y 67.',
    question: 'Una estudiante participa en un debate en redes sociales, verifica la información que comparte, protege sus datos personales y evita expresiones discriminatorias. ¿Qué demuestra principalmente esta actuación?',
    answers: [
      'El dominio de herramientas tecnológicas para comunicarse y participar en diferentes plataformas digitales.',
      'El ejercicio de derechos y responsabilidades mediante una participación crítica, segura y respetuosa en internet.',
      'La capacidad de utilizar redes sociales para expresar opiniones sobre asuntos de interés colectivo.',
      'El conocimiento de normas de comportamiento para evitar conflictos en los espacios de comunicación digital.'
    ],
    correctAnswer: 1,
    feedbackCorrect: '¡Excelente! La ciudadanía digital implica ejercer derechos y responsabilidades en los entornos digitales. No basta con saber utilizar plataformas o publicar opiniones: también es necesario participar de manera crítica, verificar la información, proteger los datos personales y relacionarse con otras personas desde el respeto y la no discriminación.',
    feedbackIncorrect: 'La ciudadanía digital no se reduce al dominio de herramientas tecnológicas ni al uso de redes sociales. Implica actuar responsablemente en los entornos digitales, ejercer derechos, reconocer responsabilidades, evaluar críticamente la información, proteger los datos personales y respetar a las demás personas.'
  }
];

@Component({
  selector: 'app-inicio', standalone: true, imports: [RouterLink],
  templateUrl: './inicio.html', styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private changeDetector = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private videosSeguros = new Map<number, SafeResourceUrl>();

  tomos: Tomo[] = contenidos.map((contenido, index) => ({ id: index + 1, ...contenido }));
  insignias = INSIGNIAS;
  insigniaFinal = INSIGNIAS[INSIGNIAS.length - 1];
  medallas = MEDALLAS;
  completed = new Set<number>();
  verifiedTomoIds = new Set<number>();
  selectedAnswers = new Map<number, number>();
  resultados = new Map<number, ResultadoTomo>();
  private ordenes = new Map<number, number[]>();
  userId = '';
  esAdmin = false;
  showCompletionModal = false;
  showProgressModal = false;
  insigniaNueva: Insignia | null = null;
  selectedTomo: Tomo | null = null;
  answer = -1;
  feedback = '';
  feedbackError = false;
  loading = true;
  saving = false;
  loadError = '';
  private progressChannel: RealtimeChannel | null = null;

  async ngOnInit() {
    this.userId = (await this.authService.obtenerUserId()) ?? '';
    this.esAdmin = await this.authService.esAdmin();
    this.changeDetector.markForCheck();
    void this.refreshProgress();
    void this.startProgressSubscription();
  }

  private async startProgressSubscription() {
    const subscription = await this.authService.observarCambiosProgreso(() => { void this.refreshProgress(); });
    this.progressChannel = subscription.channel;
    if (subscription.error) this.loadError = 'No se pudo activar la actualización en tiempo real. Revisa la sesión y la publicación supabase_realtime.';
    this.changeDetector.markForCheck();
  }

  async ngOnDestroy() {
    await this.authService.dejarDeObservarProgreso(this.progressChannel);
  }

  @HostListener('window:focus')
  onWindowFocus() { void this.refreshProgress(); }
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.insigniaNueva) this.cerrarInsigniaNueva();
    else if (this.showProgressModal) this.showProgressModal = false;
    else if (this.showCompletionModal) this.showCompletionModal = false;
    else if (this.selectedTomo) this.selectedTomo = null;
  }
  private async refreshProgress() {
    try {
      const { resultados, error } = await this.authService.obtenerResultados();
      this.loading = false;
      if (error) {
        this.loadError = `No se pudo cargar el progreso desde Supabase: ${this.mensajeError(error)}`;
        console.error(this.loadError, error);
        this.changeDetector.markForCheck();
        return;
      }
      this.loadError = '';
      const completados = new Set(this.completed);
      for (const r of resultados) {
        const local = this.resultados.get(r.tomo_id);
        if (!local || r.intentos >= local.intentos) this.resultados.set(r.tomo_id, r);
        if (r.completado) completados.add(r.tomo_id);
      }
      this.completed = completados;
      this.changeDetector.markForCheck();
    } catch (error) {
      this.loading = false;
      this.loadError = 'Falló la conexión al cargar el progreso. Revisa tu internet y la configuración de Supabase.';
      console.error(this.loadError, error);
      this.changeDetector.markForCheck();
    }
  }

  private mensajeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    const message = (error as { message?: string } | null)?.message;
    return message ?? JSON.stringify(error);
  }

  private orden(tomo: Tomo): number[] {
    let orden = this.ordenes.get(tomo.id);
    if (!orden) {
      orden = ordenAleatorio(tomo.answers.length, `${this.userId}:${tomo.id}`);
      this.ordenes.set(tomo.id, orden);
    }
    return orden;
  }
  private indiceCorrecto(tomo: Tomo) { return this.orden(tomo).indexOf(tomo.correctAnswer); }
  get respuestasMostradas(): string[] {
    const tomo = this.selectedTomo;
    return tomo ? this.orden(tomo).map((i) => tomo.answers[i]) : [];
  }

  get videoUrl(): SafeResourceUrl | null {
    const tomo = this.selectedTomo;
    const url = tomo ? VIDEOS[tomo.id] : '';
    if (!tomo || !url) return null;
    let seguro = this.videosSeguros.get(tomo.id);
    if (!seguro) {
      seguro = this.sanitizer.bypassSecurityTrustResourceUrl(aEmbed(url));
      this.videosSeguros.set(tomo.id, seguro);
    }
    return seguro;
  }

  get totalPuntos() {
    let total = 0;
    this.resultados.forEach((r) => { if (r.completado) total += r.puntos; });
    return total;
  }
  insigniaDe(tomoId: number) { return this.insignias.find((i) => i.tomo === tomoId); }

  get cursoCompletado() { return this.completed.size >= this.tomos.length; }

  get medallaFinal(): Medalla | null {
    if (!this.cursoCompletado) return null;
    return MEDALLAS.find((m) => this.totalPuntos >= m.minPuntos) ?? null;
  }

  get insigniasGanadas() {
    return this.insignias.filter((i) => this.completed.has(i.tomo)).length;
  }

  get filasProgreso() {
    return this.tomos.map((tomo) => ({ tomo, r: this.resultados.get(tomo.id) }));
  }

  estrellasTexto(n: number) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  private aplicarIntento(tomoId: number, correcto: boolean): ResultadoTomo {
    const intentos = (this.resultados.get(tomoId)?.intentos ?? 0) + 1;
    const resultado: ResultadoTomo = {
      tomo_id: tomoId,
      intentos,
      completado: correcto,
      puntos: correcto ? calcularPuntos(intentos) : 0,
      estrellas: correcto ? calcularEstrellas(intentos) : 0
    };
    this.resultados.set(tomoId, resultado);
    return resultado;
  }

  private async guardarIntento(tomoId: number, correcto: boolean) {
    const { resultado, error } = await this.authService.registrarIntento(tomoId, correcto);
    if (resultado) this.resultados.set(tomoId, resultado);
    else console.error('No se pudo guardar el intento en Supabase:', error);
    this.changeDetector.markForCheck();
  }

  get unlockedCount() { return Math.min(20, this.completed.size + 1); }
  get progress() { return Math.round(this.completed.size / 20 * 100); }
  isUnlocked(id: number) { return id === 1 || id <= this.unlockedCount; }
  openTomo(tomo: Tomo) {
    if (!this.isUnlocked(tomo.id)) return;
    this.selectedTomo = tomo;
    this.answer = this.completed.has(tomo.id)
      ? this.selectedAnswers.get(tomo.id) ?? this.indiceCorrecto(tomo)
      : -1;
    if (this.completed.has(tomo.id)) this.verifiedTomoIds.add(tomo.id);
    this.feedback = this.completed.has(tomo.id) ? tomo.feedbackCorrect : '';
    this.feedbackError = false;
  }
  closeTomo() { this.selectedTomo = null; }
  closeCompletionModal() { this.showCompletionModal = false; }
  abrirProgreso() {
    this.selectedTomo = null;
    this.showCompletionModal = false;
    this.showProgressModal = true;
  }
  closeProgreso() { this.showProgressModal = false; }
  cerrarInsigniaNueva() {
    const eraFinal = this.insigniaNueva?.tomo === 20;
    this.insigniaNueva = null;
    if (eraFinal) this.finalizarCurso();
  }
  finalizarCurso() {
    this.selectedTomo = null;
    this.showCompletionModal = true;
  }
  chooseAnswer(index: number) {
    if (this.selectedTomo && this.completed.has(this.selectedTomo.id)) return;
    this.answer = index;
    this.feedback = '';
    this.feedbackError = false;
  }
  async submitAnswer() {
    const tomo = this.selectedTomo;
    if (!tomo || this.answer < 0 || this.saving || this.verifiedTomoIds.has(tomo.id)) return;

    if (this.answer !== this.indiceCorrecto(tomo)) {
      if (!this.completed.has(tomo.id)) {
        this.aplicarIntento(tomo.id, false);
        void this.guardarIntento(tomo.id, false);
      }
      this.feedback = tomo.feedbackIncorrect;
      this.feedbackError = true;
      return;
    }
    if (this.completed.has(tomo.id)) {
      this.verifiedTomoIds.add(tomo.id);
      this.feedback = tomo.feedbackCorrect;
      this.feedbackError = false;
      return;
    }

    this.verifiedTomoIds.add(tomo.id);
    this.selectedAnswers.set(tomo.id, this.answer);
    this.saving = true;
    this.completed = new Set([...this.completed, tomo.id]);
    const resultado = this.aplicarIntento(tomo.id, true);
    const insignia = this.insigniaDe(tomo.id);
    const premio = `+${resultado.puntos} puntos (${resultado.estrellas} ${resultado.estrellas === 1 ? 'estrella' : 'estrellas'}).`;
    this.feedback = `${tomo.feedbackCorrect} ${premio}`;
    this.feedbackError = false;
    if (insignia) this.insigniaNueva = insignia;
    this.changeDetector.markForCheck();
    try {
      const timeout = new Promise<{ resultado: null; error: unknown }>((resolve) => setTimeout(() => resolve({ resultado: null, error: new Error('timeout') }), 8000));
      const { resultado: guardado, error } = await Promise.race([this.authService.registrarIntento(tomo.id, true), timeout]);
      if (guardado) {
        this.resultados.set(tomo.id, guardado);
      } else {
        const errorMessage = this.mensajeError(error);
        this.feedback = errorMessage === 'timeout'
          ? '¡Respuesta correcta! Supabase está tardando en guardar tu progreso.'
          : `¡Respuesta correcta! No se pudo guardar en Supabase: ${errorMessage}.`;
      }
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }
  async cerrarSesion() {
    const error = await this.authService.cerrarSesion();
    if (!error) await this.router.navigate(['/login']);
  }
}