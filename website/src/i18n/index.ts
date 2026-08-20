export type Locale = 'en' | 'zh';

export interface SiteCopy {
  htmlLang: 'en' | 'zh-CN';
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
    alternateLanguage: string;
    copyright: string;
  };
}

export const localeRoutes = {
  en: {
    home: '/',
    app: '/online/',
    alternateHome: '/zh/',
    alternateApp: '/zh/online/',
  },
  zh: {
    home: '/zh/',
    app: '/zh/online/',
    alternateHome: '/',
    alternateApp: '/online/',
  },
} as const satisfies Record<Locale, Record<string, string>>;

const webFormats = ['JPEG', 'PNG', 'GIF', 'WebP', 'AVIF', 'HEIC', 'BMP', 'TIFF'];

export const siteCopy = {
  en: {
    htmlLang: 'en',
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
    workbench: {
      appLabel: 'IMGo web app',
      loading: 'Loading web app...',
    },
    privacy: {
      title: 'Local processing, on both platforms.',
      description:
        'Your images stay on your device. The web and desktop apps use different runtimes, each suited to its platform.',
      webTitle: 'Web app',
      webDescription: 'Runs image processing in your browser with WebAssembly.',
      nativeTitle: 'Desktop app',
      nativeDescription: 'Supports more image formats and processes them faster with native code.',
    },
    formats: {
      label: 'Web formats',
      names: webFormats,
    },
    footer: {
      statement: 'Your images stay with you.',
      navigationLabel: 'Footer',
      github: 'GitHub',
      download: 'Download desktop app',
      alternateLanguage: '中文',
      copyright: 'IMGo local image tools',
    },
  },
  zh: {
    htmlLang: 'zh-CN',
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
    workbench: {
      appLabel: 'IMGo 网页版',
      loading: '正在加载网页版...',
    },
    privacy: {
      title: '两种平台，都在本地处理。',
      description: '图片始终留在你的设备上。网页与桌面应用使用不同运行方式，分别适配各自平台。',
      webTitle: '网页版',
      webDescription: '通过 WebAssembly 在浏览器中完成图片处理。',
      nativeTitle: '桌面版',
      nativeDescription: '支持更多图片格式，并通过原生代码获得更快的处理速度。',
    },
    formats: {
      label: '网页格式',
      names: webFormats,
    },
    footer: {
      statement: '图片始终留在你的设备上。',
      navigationLabel: '页脚导航',
      github: 'GitHub',
      download: '下载桌面版',
      alternateLanguage: 'English',
      copyright: 'IMGo 本地图片工具',
    },
  },
} as const satisfies Record<Locale, SiteCopy>;

export function getSiteCopy(locale: Locale): SiteCopy {
  return siteCopy[locale];
}
