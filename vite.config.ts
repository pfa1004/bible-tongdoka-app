import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { DatabaseSync } from 'node:sqlite';

let dbCdb: any = null;
let dbManna: any = null;
let dbHenry: any = null;

function getDb(type: string) {
  try {
    if (type === 'cdb') {
      if (!dbCdb) dbCdb = new DatabaseSync(path.resolve(__dirname, 'b-data/성경관주.cdb'));
      return dbCdb;
    }
    if (type === 'manna') {
      if (!dbManna) dbManna = new DatabaseSync(path.resolve(__dirname, 'b-data/만나주석.cdb'));
      return dbManna;
    }
    if (type === 'henry') {
      if (!dbHenry) dbHenry = new DatabaseSync(path.resolve(__dirname, 'b-data/매튜헨리.cdb'));
      return dbHenry;
    }
  } catch (e) {
    console.error(`Failed to load DB ${type}:`, e);
  }
  return null;
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'bible-api-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = new URL(req.url || '', 'http://localhost');
            
            if (url.pathname === '/api/cross-reference') {
              const book = parseInt(url.searchParams.get('book') || '0', 10);
              const chapter = parseInt(url.searchParams.get('chapter') || '0', 10);
              const verse = parseInt(url.searchParams.get('verse') || '0', 10);

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              try {
                const db = getDb('cdb');
                if (!db) throw new Error('CDB DB not loaded');
                const stmt = db.prepare('SELECT btext FROM Bible WHERE book = ? AND chapter = ? AND verse = ?');
                const row: any = stmt.get(book, chapter, verse);
                res.end(JSON.stringify({ success: true, data: row ? row.btext : '' }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
              return;
            }

            if (url.pathname === '/api/commentary') {
              const type = url.searchParams.get('type') || 'manna';
              const book = parseInt(url.searchParams.get('book') || '0', 10);
              const chapter = parseInt(url.searchParams.get('chapter') || '0', 10);
              const verse = parseInt(url.searchParams.get('verse') || '0', 10);

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              try {
                const db = getDb(type);
                if (!db) throw new Error(`${type} DB not loaded`);

                let resultText = '';
                if (type === 'henry') {
                  const stmt = db.prepare('SELECT verse, btext FROM Bible WHERE book = ? AND chapter = ? AND verse <= ? ORDER BY verse DESC LIMIT 1');
                  const row: any = stmt.get(book, chapter, verse);
                  if (row) {
                    resultText = row.btext || '';
                    if (row.verse !== verse) {
                      resultText = `<div style="margin-bottom: 12px; padding: 10px 12px; border-radius: 12px; background-color: rgba(245, 158, 11, 0.15); color: #FBBF24; font-size: 11px; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.25);">💡 이 구절은 ${row.verse}절부터 시작하는 통합 주석 문단에 포함되어 있어, 해당 주석 내용으로 안내합니다.</div>` + resultText;
                    }
                  }
                } else {
                  const stmt = db.prepare('SELECT btext FROM Bible WHERE book = ? AND chapter = ? AND verse = ?');
                  const row: any = stmt.get(book, chapter, verse);
                  resultText = row ? (row.btext || '') : '';
                }

                res.end(JSON.stringify({ success: true, data: resultText }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
              return;
            }

            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
