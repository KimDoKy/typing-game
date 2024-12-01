import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 서버의 code-samples 디렉토리 경로 설정
const CODE_DIR = path.join(process.cwd(), 'code-samples');

export async function GET() {
  try {
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(CODE_DIR)) {
      fs.mkdirSync(CODE_DIR);
    }

    // 파일 목록을 읽어서 각 파일의 내용과 함께 반환
    const files = fs.readdirSync(CODE_DIR);
    const fileContents = {};

    files.forEach(file => {
      const content = fs.readFileSync(path.join(CODE_DIR, file), 'utf-8');
      fileContents[file] = content;
    });

    return NextResponse.json(fileContents);
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
