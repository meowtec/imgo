export const locales = [
  'en',
  'zh',
  'ar',
  'es',
  'sv',
  'ko',
  'ja',
  'fr',
  'hr',
  'sr',
  'it',
  'de',
  'nl',
] as const;

export type Locale = (typeof locales)[number];
export type Page = 'home' | 'app';

export interface SiteCopy {
  seo: {
    homeTitle: string;
    homeDescription: string;
    appTitle: string;
    appDescription: string;
  };
  nav: {
    homeLabel: string;
    primaryLabel: string;
    languageLabel: string;
    openApp: string;
  };
  hero: {
    title: string;
    description: string;
    actionsLabel: string;
    openApp: string;
    downloadApp: string;
    proofLabel: string;
    proof: string[];
  };
  workbench: {
    appLabel: string;
    loading: string;
  };
  privacy: {
    title: string;
    description: string;
    webTitle: string;
    webDescription: string;
    nativeTitle: string;
    nativeDescription: string;
  };
  formats: {
    label: string;
    names: string[];
  };
  footer: {
    statement: string;
    navigationLabel: string;
    github: string;
    download: string;
    copyright: string;
  };
}

export const localeConfig: Record<
  Locale,
  { name: string; htmlLang: string; ogLocale: string; direction: 'ltr' | 'rtl' }
> = {
  en: { name: 'English', htmlLang: 'en', ogLocale: 'en_US', direction: 'ltr' },
  zh: { name: '中文', htmlLang: 'zh-CN', ogLocale: 'zh_CN', direction: 'ltr' },
  ar: { name: 'العربية', htmlLang: 'ar', ogLocale: 'ar_AR', direction: 'rtl' },
  es: { name: 'Español', htmlLang: 'es', ogLocale: 'es_ES', direction: 'ltr' },
  sv: { name: 'Svenska', htmlLang: 'sv', ogLocale: 'sv_SE', direction: 'ltr' },
  ko: { name: '한국어', htmlLang: 'ko', ogLocale: 'ko_KR', direction: 'ltr' },
  ja: { name: '日本語', htmlLang: 'ja', ogLocale: 'ja_JP', direction: 'ltr' },
  fr: { name: 'Français', htmlLang: 'fr', ogLocale: 'fr_FR', direction: 'ltr' },
  hr: { name: 'Hrvatski', htmlLang: 'hr', ogLocale: 'hr_HR', direction: 'ltr' },
  sr: { name: 'Srpski', htmlLang: 'sr', ogLocale: 'sr_RS', direction: 'ltr' },
  it: { name: 'Italiano', htmlLang: 'it', ogLocale: 'it_IT', direction: 'ltr' },
  de: { name: 'Deutsch', htmlLang: 'de', ogLocale: 'de_DE', direction: 'ltr' },
  nl: { name: 'Nederlands', htmlLang: 'nl', ogLocale: 'nl_NL', direction: 'ltr' },
};

export function getLocalePath(locale: Locale, page: Page): string {
  const prefix = locale === 'en' ? '/' : `/${locale}/`;
  return page === 'home' ? prefix : `${prefix}online/`;
}

export const localeRoutes = Object.fromEntries(
  locales.map((locale) => [
    locale,
    {
      home: getLocalePath(locale, 'home'),
      app: getLocalePath(locale, 'app'),
    },
  ]),
) as Record<Locale, Record<Page, string>>;

const webFormats = ['JPEG', 'PNG', 'GIF', 'WebP', 'AVIF', 'HEIC', 'BMP', 'TIFF'];

export const siteCopy = {
  en: {
    seo: {
      homeTitle: 'IMGo - Private batch image compression',
      homeDescription:
        'Compress and convert multiple images without uploading them. Use IMGo in your browser or as a native desktop app.',
      appTitle: 'IMGo Web App - Compress images locally',
      appDescription:
        'Compress and convert multiple images locally in your browser with IMGo. Your image files are processed on your device.',
    },
    nav: {
      homeLabel: 'IMGo home',
      primaryLabel: 'Primary',
      languageLabel: 'Choose language',
      openApp: 'Open web app',
    },
    hero: {
      title: 'Compress images. Keep them private.',
      description:
        'Process multiple images without uploading them. Use IMGo in your browser or download the native desktop app.',
      actionsLabel: 'Primary actions',
      openApp: 'Open web app',
      downloadApp: 'Download desktop app',
      proofLabel: 'Product facts',
      proof: ['Multiple files at once', 'Files stay on your device', 'Web and native apps'],
    },
    workbench: { appLabel: 'IMGo web app', loading: 'Loading web app...' },
    privacy: {
      title: 'Local processing, on both platforms.',
      description:
        'Your images stay on your device. The web and desktop apps use different runtimes, each suited to its platform.',
      webTitle: 'Web app',
      webDescription: 'Runs image processing in your browser with WebAssembly.',
      nativeTitle: 'Desktop app',
      nativeDescription: 'Supports more image formats and processes them faster with native code.',
    },
    formats: { label: 'Web formats', names: webFormats },
    footer: {
      statement: 'Your images stay with you.',
      navigationLabel: 'Footer',
      github: 'GitHub',
      download: 'Download desktop app',
      copyright: 'IMGo local image tools',
    },
  },
  zh: {
    seo: {
      homeTitle: 'IMGo - 本地批量图片压缩与格式转换',
      homeDescription: '无需上传即可批量压缩和转换图片。直接使用 IMGo 网页版，或下载原生桌面应用。',
      appTitle: 'IMGo 网页版 - 在浏览器本地压缩图片',
      appDescription: '使用 IMGo 在浏览器本地批量压缩和转换图片。图片文件始终在你的设备上处理。',
    },
    nav: {
      homeLabel: 'IMGo 首页',
      primaryLabel: '主要导航',
      languageLabel: '选择语言',
      openApp: '打开网页版',
    },
    hero: {
      title: '批量压缩图片，文件不离开设备。',
      description: '无需上传即可批量处理图片。直接使用网页版，或下载原生桌面应用。',
      actionsLabel: '主要操作',
      openApp: '打开网页版',
      downloadApp: '下载桌面版',
      proofLabel: '产品特性',
      proof: ['一次处理多张图片', '文件始终留在设备上', '支持 Web 与原生应用'],
    },
    workbench: { appLabel: 'IMGo 网页版', loading: '正在加载网页版...' },
    privacy: {
      title: '两种平台，都在本地处理。',
      description: '图片始终留在你的设备上。网页与桌面应用使用不同运行方式，分别适配各自平台。',
      webTitle: '网页版',
      webDescription: '通过 WebAssembly 在浏览器中完成图片处理。',
      nativeTitle: '桌面版',
      nativeDescription: '支持更多图片格式，并通过原生代码获得更快的处理速度。',
    },
    formats: { label: '网页格式', names: webFormats },
    footer: {
      statement: '图片始终留在你的设备上。',
      navigationLabel: '页脚导航',
      github: 'GitHub',
      download: '下载桌面版',
      copyright: 'IMGo 本地图片工具',
    },
  },
  ar: {
    seo: {
      homeTitle: 'IMGo - ضغط الصور دفعة واحدة بخصوصية',
      homeDescription:
        'اضغط وحوّل عدة صور دون رفعها. استخدم IMGo في المتصفح أو كتطبيق أصلي لسطح المكتب.',
      appTitle: 'تطبيق IMGo للويب - اضغط الصور محليًا',
      appDescription: 'اضغط وحوّل عدة صور محليًا في متصفحك. تتم معالجة ملفاتك على جهازك.',
    },
    nav: {
      homeLabel: 'الصفحة الرئيسية لـ IMGo',
      primaryLabel: 'التنقل الرئيسي',
      languageLabel: 'اختر اللغة',
      openApp: 'فتح تطبيق الويب',
    },
    hero: {
      title: 'اضغط الصور. حافظ على خصوصيتها.',
      description: 'عالج عدة صور دون رفعها. استخدم IMGo في المتصفح أو نزّل تطبيق سطح المكتب.',
      actionsLabel: 'الإجراءات الرئيسية',
      openApp: 'فتح تطبيق الويب',
      downloadApp: 'تنزيل تطبيق سطح المكتب',
      proofLabel: 'مزايا المنتج',
      proof: ['عدة ملفات في وقت واحد', 'تبقى الملفات على جهازك', 'تطبيقات ويب وسطح مكتب'],
    },
    workbench: { appLabel: 'تطبيق IMGo للويب', loading: 'جارٍ تحميل تطبيق الويب...' },
    privacy: {
      title: 'معالجة محلية على كلا النظامين.',
      description: 'تبقى صورك على جهازك. يستخدم تطبيقا الويب وسطح المكتب بيئتين مناسبتين لكل منصة.',
      webTitle: 'تطبيق الويب',
      webDescription: 'يعالج الصور في متصفحك باستخدام WebAssembly.',
      nativeTitle: 'تطبيق سطح المكتب',
      nativeDescription: 'يدعم تنسيقات أكثر ويعالج الصور أسرع باستخدام كود أصلي.',
    },
    formats: { label: 'تنسيقات الويب', names: webFormats },
    footer: {
      statement: 'صورك تبقى معك.',
      navigationLabel: 'تذييل الصفحة',
      github: 'GitHub',
      download: 'تنزيل تطبيق سطح المكتب',
      copyright: 'أدوات IMGo المحلية للصور',
    },
  },
  es: {
    seo: {
      homeTitle: 'IMGo - Compresión privada de imágenes por lotes',
      homeDescription:
        'Comprime y convierte varias imágenes sin subirlas. Usa IMGo en el navegador o como aplicación de escritorio.',
      appTitle: 'IMGo Web - Comprime imágenes localmente',
      appDescription:
        'Comprime y convierte varias imágenes en tu navegador. Los archivos se procesan en tu dispositivo.',
    },
    nav: {
      homeLabel: 'Inicio de IMGo',
      primaryLabel: 'Principal',
      languageLabel: 'Elegir idioma',
      openApp: 'Abrir aplicación web',
    },
    hero: {
      title: 'Comprime imágenes. Mantén su privacidad.',
      description:
        'Procesa varias imágenes sin subirlas. Usa IMGo en tu navegador o descarga la aplicación de escritorio.',
      actionsLabel: 'Acciones principales',
      openApp: 'Abrir aplicación web',
      downloadApp: 'Descargar aplicación',
      proofLabel: 'Características',
      proof: [
        'Varios archivos a la vez',
        'Los archivos permanecen en tu dispositivo',
        'Aplicaciones web y nativa',
      ],
    },
    workbench: { appLabel: 'Aplicación web IMGo', loading: 'Cargando aplicación web...' },
    privacy: {
      title: 'Procesamiento local en ambas plataformas.',
      description:
        'Tus imágenes permanecen en tu dispositivo. Cada aplicación usa la tecnología adecuada para su plataforma.',
      webTitle: 'Aplicación web',
      webDescription: 'Procesa imágenes en tu navegador con WebAssembly.',
      nativeTitle: 'Aplicación de escritorio',
      nativeDescription: 'Admite más formatos y procesa más rápido con código nativo.',
    },
    formats: { label: 'Formatos web', names: webFormats },
    footer: {
      statement: 'Tus imágenes se quedan contigo.',
      navigationLabel: 'Pie de página',
      github: 'GitHub',
      download: 'Descargar aplicación',
      copyright: 'Herramientas locales de imagen IMGo',
    },
  },
  sv: {
    seo: {
      homeTitle: 'IMGo - Privat bildkomprimering i batch',
      homeDescription:
        'Komprimera och konvertera flera bilder utan att ladda upp dem. Använd IMGo i webbläsaren eller på datorn.',
      appTitle: 'IMGo webbapp - Komprimera bilder lokalt',
      appDescription:
        'Komprimera och konvertera flera bilder lokalt i webbläsaren. Filerna bearbetas på din enhet.',
    },
    nav: {
      homeLabel: 'IMGo startsida',
      primaryLabel: 'Huvudnavigering',
      languageLabel: 'Välj språk',
      openApp: 'Öppna webbappen',
    },
    hero: {
      title: 'Komprimera bilder. Behåll dem privata.',
      description:
        'Bearbeta flera bilder utan uppladdning. Använd IMGo i webbläsaren eller hämta datorappen.',
      actionsLabel: 'Huvudåtgärder',
      openApp: 'Öppna webbappen',
      downloadApp: 'Hämta datorappen',
      proofLabel: 'Produktfakta',
      proof: ['Flera filer samtidigt', 'Filerna stannar på din enhet', 'Webb- och datorapp'],
    },
    workbench: { appLabel: 'IMGo webbapp', loading: 'Läser in webbappen...' },
    privacy: {
      title: 'Lokal bearbetning på båda plattformarna.',
      description:
        'Dina bilder stannar på enheten. Webb- och datorappen använder teknik anpassad för respektive plattform.',
      webTitle: 'Webbapp',
      webDescription: 'Bearbetar bilder i webbläsaren med WebAssembly.',
      nativeTitle: 'Datorapp',
      nativeDescription: 'Stöder fler bildformat och bearbetar snabbare med inbyggd kod.',
    },
    formats: { label: 'Webbformat', names: webFormats },
    footer: {
      statement: 'Dina bilder stannar hos dig.',
      navigationLabel: 'Sidfot',
      github: 'GitHub',
      download: 'Hämta datorappen',
      copyright: 'IMGo lokala bildverktyg',
    },
  },
  ko: {
    seo: {
      homeTitle: 'IMGo - 개인정보를 지키는 일괄 이미지 압축',
      homeDescription:
        '업로드 없이 여러 이미지를 압축하고 변환하세요. 브라우저 또는 데스크톱 앱에서 IMGo를 사용할 수 있습니다.',
      appTitle: 'IMGo 웹 앱 - 로컬에서 이미지 압축',
      appDescription:
        '브라우저에서 여러 이미지를 로컬로 압축하고 변환하세요. 파일은 기기에서 처리됩니다.',
    },
    nav: {
      homeLabel: 'IMGo 홈',
      primaryLabel: '주요 탐색',
      languageLabel: '언어 선택',
      openApp: '웹 앱 열기',
    },
    hero: {
      title: '이미지를 압축하고 개인정보를 지키세요.',
      description:
        '업로드 없이 여러 이미지를 처리하세요. 브라우저에서 사용하거나 데스크톱 앱을 다운로드할 수 있습니다.',
      actionsLabel: '주요 작업',
      openApp: '웹 앱 열기',
      downloadApp: '데스크톱 앱 다운로드',
      proofLabel: '제품 특징',
      proof: ['여러 파일 동시 처리', '파일은 기기에 유지', '웹 및 네이티브 앱'],
    },
    workbench: { appLabel: 'IMGo 웹 앱', loading: '웹 앱을 불러오는 중...' },
    privacy: {
      title: '두 플랫폼 모두 로컬에서 처리합니다.',
      description:
        '이미지는 기기에 남습니다. 웹과 데스크톱 앱은 각 플랫폼에 맞는 실행 환경을 사용합니다.',
      webTitle: '웹 앱',
      webDescription: 'WebAssembly로 브라우저에서 이미지를 처리합니다.',
      nativeTitle: '데스크톱 앱',
      nativeDescription: '더 많은 이미지 형식을 지원하며 네이티브 코드로 더 빠르게 처리합니다.',
    },
    formats: { label: '웹 지원 형식', names: webFormats },
    footer: {
      statement: '이미지는 항상 당신의 기기에.',
      navigationLabel: '바닥글',
      github: 'GitHub',
      download: '데스크톱 앱 다운로드',
      copyright: 'IMGo 로컬 이미지 도구',
    },
  },
  ja: {
    seo: {
      homeTitle: 'IMGo - プライバシーを守る画像一括圧縮',
      homeDescription:
        '画像をアップロードせずに、複数の画像を圧縮・変換できます。ブラウザーまたはデスクトップアプリでIMGoを利用できます。',
      appTitle: 'IMGo Webアプリ - 画像をローカルで圧縮',
      appDescription:
        'ブラウザー上で複数の画像をローカルに圧縮・変換できます。画像ファイルはお使いのデバイス上で処理されます。',
    },
    nav: {
      homeLabel: 'IMGoホーム',
      primaryLabel: 'メインナビゲーション',
      languageLabel: '言語を選択',
      openApp: 'Webアプリを開く',
    },
    hero: {
      title: '画像を圧縮。プライバシーはそのまま。',
      description:
        'アップロードせずに複数の画像を処理できます。ブラウザーで使うか、デスクトップアプリをダウンロードしてください。',
      actionsLabel: '主な操作',
      openApp: 'Webアプリを開く',
      downloadApp: 'デスクトップアプリをダウンロード',
      proofLabel: '製品の特長',
      proof: ['複数ファイルを一括処理', 'ファイルはデバイス内に保持', 'Web版とデスクトップ版'],
    },
    workbench: { appLabel: 'IMGo Webアプリ', loading: 'Webアプリを読み込み中...' },
    privacy: {
      title: 'どちらのプラットフォームでもローカル処理。',
      description:
        '画像はお使いのデバイス内に保持されます。Web版とデスクトップ版は、それぞれの環境に適した実行方式を使用します。',
      webTitle: 'Webアプリ',
      webDescription: 'WebAssemblyを使用してブラウザー内で画像を処理します。',
      nativeTitle: 'デスクトップアプリ',
      nativeDescription: 'より多くの画像形式に対応し、ネイティブコードで高速に処理します。',
    },
    formats: { label: 'Web対応形式', names: webFormats },
    footer: {
      statement: 'あなたの画像は、あなたのデバイスに。',
      navigationLabel: 'フッター',
      github: 'GitHub',
      download: 'デスクトップアプリをダウンロード',
      copyright: 'IMGo ローカル画像ツール',
    },
  },
  fr: {
    seo: {
      homeTitle: "IMGo - Compression privée d'images par lots",
      homeDescription:
        "Compressez et convertissez plusieurs images sans les envoyer. Utilisez IMGo dans le navigateur ou sur l'ordinateur.",
      appTitle: 'Application web IMGo - Compressez localement',
      appDescription:
        'Compressez et convertissez plusieurs images dans votre navigateur. Vos fichiers restent sur votre appareil.',
    },
    nav: {
      homeLabel: 'Accueil IMGo',
      primaryLabel: 'Navigation principale',
      languageLabel: 'Choisir la langue',
      openApp: "Ouvrir l'application web",
    },
    hero: {
      title: 'Compressez vos images. Gardez-les privées.',
      description:
        "Traitez plusieurs images sans les envoyer. Utilisez IMGo dans votre navigateur ou téléchargez l'application.",
      actionsLabel: 'Actions principales',
      openApp: "Ouvrir l'application web",
      downloadApp: "Télécharger l'application",
      proofLabel: 'Caractéristiques',
      proof: [
        'Plusieurs fichiers à la fois',
        'Les fichiers restent sur votre appareil',
        'Applications web et native',
      ],
    },
    workbench: { appLabel: 'Application web IMGo', loading: "Chargement de l'application web..." },
    privacy: {
      title: 'Traitement local sur les deux plateformes.',
      description:
        'Vos images restent sur votre appareil. Chaque application utilise un moteur adapté à sa plateforme.',
      webTitle: 'Application web',
      webDescription: 'Traite les images dans votre navigateur avec WebAssembly.',
      nativeTitle: 'Application de bureau',
      nativeDescription:
        'Prend en charge plus de formats et accélère le traitement grâce au code natif.',
    },
    formats: { label: 'Formats web', names: webFormats },
    footer: {
      statement: 'Vos images restent avec vous.',
      navigationLabel: 'Pied de page',
      github: 'GitHub',
      download: "Télécharger l'application",
      copyright: "Outils d'image locaux IMGo",
    },
  },
  hr: {
    seo: {
      homeTitle: 'IMGo - Privatno skupno sažimanje slika',
      homeDescription:
        'Sažmite i pretvorite više slika bez prijenosa. Koristite IMGo u pregledniku ili kao stolnu aplikaciju.',
      appTitle: 'IMGo web aplikacija - Sažmite slike lokalno',
      appDescription:
        'Sažmite i pretvorite više slika lokalno u pregledniku. Datoteke se obrađuju na vašem uređaju.',
    },
    nav: {
      homeLabel: 'IMGo početna stranica',
      primaryLabel: 'Glavna navigacija',
      languageLabel: 'Odaberite jezik',
      openApp: 'Otvori web aplikaciju',
    },
    hero: {
      title: 'Sažmite slike. Sačuvajte privatnost.',
      description:
        'Obradite više slika bez prijenosa. Koristite IMGo u pregledniku ili preuzmite stolnu aplikaciju.',
      actionsLabel: 'Glavne radnje',
      openApp: 'Otvori web aplikaciju',
      downloadApp: 'Preuzmi stolnu aplikaciju',
      proofLabel: 'Značajke proizvoda',
      proof: ['Više datoteka odjednom', 'Datoteke ostaju na uređaju', 'Web i stolna aplikacija'],
    },
    workbench: { appLabel: 'IMGo web aplikacija', loading: 'Učitavanje web aplikacije...' },
    privacy: {
      title: 'Lokalna obrada na obje platforme.',
      description:
        'Vaše slike ostaju na uređaju. Web i stolna aplikacija koriste tehnologiju prilagođenu svojoj platformi.',
      webTitle: 'Web aplikacija',
      webDescription: 'Obrađuje slike u pregledniku pomoću WebAssemblyja.',
      nativeTitle: 'Stolna aplikacija',
      nativeDescription: 'Podržava više formata i brže obrađuje slike izvornim kodom.',
    },
    formats: { label: 'Web formati', names: webFormats },
    footer: {
      statement: 'Vaše slike ostaju kod vas.',
      navigationLabel: 'Podnožje',
      github: 'GitHub',
      download: 'Preuzmi stolnu aplikaciju',
      copyright: 'IMGo lokalni alati za slike',
    },
  },
  sr: {
    seo: {
      homeTitle: 'IMGo - Приватно групно сажимање слика',
      homeDescription:
        'Сажмите и претворите више слика без отпремања. Користите IMGo у прегледачу или као десктоп апликацију.',
      appTitle: 'IMGo веб апликација - Сажмите слике локално',
      appDescription:
        'Сажмите и претворите више слика локално у прегледачу. Датотеке се обрађују на вашем уређају.',
    },
    nav: {
      homeLabel: 'IMGo почетна страница',
      primaryLabel: 'Главна навигација',
      languageLabel: 'Изаберите језик',
      openApp: 'Отвори веб апликацију',
    },
    hero: {
      title: 'Сажмите слике. Сачувајте приватност.',
      description:
        'Обрадите више слика без отпремања. Користите IMGo у прегледачу или преузмите десктоп апликацију.',
      actionsLabel: 'Главне радње',
      openApp: 'Отвори веб апликацију',
      downloadApp: 'Преузми десктоп апликацију',
      proofLabel: 'Карактеристике производа',
      proof: ['Више датотека одједном', 'Датотеке остају на уређају', 'Веб и десктоп апликација'],
    },
    workbench: { appLabel: 'IMGo веб апликација', loading: 'Учитавање веб апликације...' },
    privacy: {
      title: 'Локална обрада на обе платформе.',
      description:
        'Ваше слике остају на уређају. Веб и десктоп апликација користе технологију прилагођену платформи.',
      webTitle: 'Веб апликација',
      webDescription: 'Обрађује слике у прегледачу помоћу WebAssemblyја.',
      nativeTitle: 'Десктоп апликација',
      nativeDescription: 'Подржава више формата и брже обрађује слике изворним кодом.',
    },
    formats: { label: 'Веб формати', names: webFormats },
    footer: {
      statement: 'Ваше слике остају код вас.',
      navigationLabel: 'Подножје',
      github: 'GitHub',
      download: 'Преузми десктоп апликацију',
      copyright: 'IMGo локални алати за слике',
    },
  },
  it: {
    seo: {
      homeTitle: 'IMGo - Compressione privata di immagini in serie',
      homeDescription:
        'Comprimi e converti più immagini senza caricarle. Usa IMGo nel browser o come app desktop nativa.',
      appTitle: 'IMGo Web - Comprimi immagini localmente',
      appDescription:
        'Comprimi e converti più immagini nel browser. I file vengono elaborati sul tuo dispositivo.',
    },
    nav: {
      homeLabel: 'Home di IMGo',
      primaryLabel: 'Navigazione principale',
      languageLabel: 'Scegli la lingua',
      openApp: "Apri l'app web",
    },
    hero: {
      title: 'Comprimi le immagini. Mantienile private.',
      description:
        "Elabora più immagini senza caricarle. Usa IMGo nel browser o scarica l'app desktop.",
      actionsLabel: 'Azioni principali',
      openApp: "Apri l'app web",
      downloadApp: "Scarica l'app desktop",
      proofLabel: 'Caratteristiche',
      proof: ['Più file alla volta', 'I file restano sul dispositivo', 'App web e nativa'],
    },
    workbench: { appLabel: 'App web IMGo', loading: "Caricamento dell'app web..." },
    privacy: {
      title: 'Elaborazione locale su entrambe le piattaforme.',
      description:
        'Le immagini restano sul dispositivo. Ogni app usa la tecnologia più adatta alla propria piattaforma.',
      webTitle: 'App web',
      webDescription: 'Elabora le immagini nel browser con WebAssembly.',
      nativeTitle: 'App desktop',
      nativeDescription: 'Supporta più formati ed elabora più velocemente con codice nativo.',
    },
    formats: { label: 'Formati web', names: webFormats },
    footer: {
      statement: 'Le tue immagini restano con te.',
      navigationLabel: 'Piè di pagina',
      github: 'GitHub',
      download: "Scarica l'app desktop",
      copyright: 'Strumenti locali per immagini IMGo',
    },
  },
  de: {
    seo: {
      homeTitle: 'IMGo - Private Stapelkomprimierung für Bilder',
      homeDescription:
        'Komprimiere und konvertiere mehrere Bilder ohne Upload. Nutze IMGo im Browser oder als Desktop-App.',
      appTitle: 'IMGo Web-App - Bilder lokal komprimieren',
      appDescription:
        'Komprimiere und konvertiere mehrere Bilder lokal im Browser. Deine Dateien werden auf dem Gerät verarbeitet.',
    },
    nav: {
      homeLabel: 'IMGo-Startseite',
      primaryLabel: 'Hauptnavigation',
      languageLabel: 'Sprache wählen',
      openApp: 'Web-App öffnen',
    },
    hero: {
      title: 'Bilder komprimieren. Privatsphäre bewahren.',
      description:
        'Verarbeite mehrere Bilder ohne Upload. Nutze IMGo im Browser oder lade die Desktop-App herunter.',
      actionsLabel: 'Hauptaktionen',
      openApp: 'Web-App öffnen',
      downloadApp: 'Desktop-App herunterladen',
      proofLabel: 'Produktmerkmale',
      proof: [
        'Mehrere Dateien gleichzeitig',
        'Dateien bleiben auf deinem Gerät',
        'Web- und Desktop-App',
      ],
    },
    workbench: { appLabel: 'IMGo Web-App', loading: 'Web-App wird geladen...' },
    privacy: {
      title: 'Lokale Verarbeitung auf beiden Plattformen.',
      description:
        'Deine Bilder bleiben auf dem Gerät. Web- und Desktop-App nutzen jeweils die passende Laufzeit.',
      webTitle: 'Web-App',
      webDescription: 'Verarbeitet Bilder mit WebAssembly in deinem Browser.',
      nativeTitle: 'Desktop-App',
      nativeDescription:
        'Unterstützt mehr Formate und verarbeitet Bilder mit nativem Code schneller.',
    },
    formats: { label: 'Webformate', names: webFormats },
    footer: {
      statement: 'Deine Bilder bleiben bei dir.',
      navigationLabel: 'Fußzeile',
      github: 'GitHub',
      download: 'Desktop-App herunterladen',
      copyright: 'Lokale IMGo-Bildwerkzeuge',
    },
  },
  nl: {
    seo: {
      homeTitle: 'IMGo - Privé afbeeldingen in batches comprimeren',
      homeDescription:
        'Comprimeer en converteer meerdere afbeeldingen zonder upload. Gebruik IMGo in de browser of op je desktop.',
      appTitle: 'IMGo-webapp - Afbeeldingen lokaal comprimeren',
      appDescription:
        'Comprimeer en converteer meerdere afbeeldingen lokaal in je browser. Bestanden worden op je apparaat verwerkt.',
    },
    nav: {
      homeLabel: 'IMGo-home',
      primaryLabel: 'Hoofdnavigatie',
      languageLabel: 'Taal kiezen',
      openApp: 'Webapp openen',
    },
    hero: {
      title: 'Comprimeer afbeeldingen. Houd ze privé.',
      description:
        'Verwerk meerdere afbeeldingen zonder upload. Gebruik IMGo in je browser of download de desktopapp.',
      actionsLabel: 'Hoofdacties',
      openApp: 'Webapp openen',
      downloadApp: 'Desktopapp downloaden',
      proofLabel: 'Productkenmerken',
      proof: [
        'Meerdere bestanden tegelijk',
        'Bestanden blijven op je apparaat',
        'Web- en desktopapp',
      ],
    },
    workbench: { appLabel: 'IMGo-webapp', loading: 'Webapp laden...' },
    privacy: {
      title: 'Lokale verwerking op beide platforms.',
      description:
        'Je afbeeldingen blijven op je apparaat. De web- en desktopapp gebruiken technologie die bij hun platform past.',
      webTitle: 'Webapp',
      webDescription: 'Verwerkt afbeeldingen in je browser met WebAssembly.',
      nativeTitle: 'Desktopapp',
      nativeDescription: 'Ondersteunt meer formaten en verwerkt sneller met native code.',
    },
    formats: { label: 'Webformaten', names: webFormats },
    footer: {
      statement: 'Je afbeeldingen blijven bij jou.',
      navigationLabel: 'Voettekst',
      github: 'GitHub',
      download: 'Desktopapp downloaden',
      copyright: 'Lokale IMGo-afbeeldingstools',
    },
  },
} satisfies Record<Locale, SiteCopy>;

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
