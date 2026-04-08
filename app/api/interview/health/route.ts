import { NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'offline',
          error: 'Ollama service not responding',
        },
        { status: 503 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      status: 'online',
      models: data.models?.map((m: any) => m.name) || [],
      ollamaUrl: OLLAMA_BASE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'offline',
        error: `Cannot connect to Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 503 }
    );
  }
}
