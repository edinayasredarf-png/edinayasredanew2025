import { NextRequest, NextResponse } from 'next/server';

const DEMO_WIDGET_URL = 'https://edinayasreda.ru/widget-api/widgetInfo/48603540c87bf7acfc31c93b54dfefc35cad960b1d36ac54ef5626cdb8844c33';

/**
 * Прокси для демо-виджета
 * Решает проблему с "Referer is null" - устанавливает правильный Referer при запросе
 */
export async function GET(request: NextRequest) {
  try {
    // Делаем запрос с правильным Referer
    const response = await fetch(DEMO_WIDGET_URL, {
      headers: {
        'Referer': 'https://edinayasreda.ru/',
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
      },
      // Не следовать редиректам автоматически, чтобы контролировать процесс
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch demo widget: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    const html = await response.text();

    // Если это HTML, можем попробовать переписать относительные пути на абсолютные
    // Но сначала попробуем просто отдать как есть
    let processedHtml = html;

    // Если в HTML есть относительные пути к ресурсам, переписываем их на абсолютные
    if (contentType.includes('text/html')) {
      // Переписываем относительные пути к ресурсам на абсолютные к edinayasreda.ru
      processedHtml = html
        .replace(/src="\//g, 'src="https://edinayasreda.ru/')
        .replace(/href="\//g, 'href="https://edinayasreda.ru/')
        .replace(/src='\//g, "src='https://edinayasreda.ru/")
        .replace(/href='\//g, "href='https://edinayasreda.ru/")
        // Также обрабатываем пути без кавычек в некоторых случаях
        .replace(/url\(['"]?\//g, "url('https://edinayasreda.ru/");
    }

    // Отдаем HTML с правильными заголовками
    return new NextResponse(processedHtml, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        // Убираем X-Frame-Options, чтобы можно было встроить в iframe
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  } catch (error) {
    console.error('Error proxying demo widget:', error);
    return NextResponse.json(
      { error: 'Failed to load demo widget' },
      { status: 500 }
    );
  }
}
