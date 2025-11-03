import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const notes = [
    { id: 1, title: "План на неделю", content: "Составить план задач на неделю", tag: "work", date: "30 июля 2025" },
    { id: 2, title: "Идея для проекта", content: "Разработать новое мобильное приложение", tag: "ideas", date: "28 июля 2025" },
    { id: 3, title: "Покупки", content: "Молоко, хлеб, яйца, фрукты", tag: "shopping", date: "25 июля 2025" },
    { id: 4, title: "Личные цели", content: "Начать заниматься спортом 3 раза в неделю", tag: "personal", date: "22 июля 2025" }
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../frontend');

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    return types[ext] || 'text/plain';
}

function serveStaticFile(response, filePath) {
    try {
        const fullPath = path.join(frontendPath, filePath);
        const fileData = fs.readFileSync(fullPath);
        const contentType = getContentType(filePath);
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(fileData);
    } catch (error) {
        response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end('<h1>404 - Файл не найден</h1>');
    }
}

function servePage(request, response) {
    if (request.url.startsWith('/api/')) {
        response.setHeader('Access-Control-Allow-Origin', '*'); // определяет какие порты использовать
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); //определяет методы
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');// определяет запросы для использования
    }
    //браузер отправляет метод options для преверки прав
    if (request.method === 'OPTIONS') {
        response.writeHead(200);
        response.end();
        return;
    }

    if (request.url === '/api/notes' && request.method === 'GET') {
        response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(notes));
        return;
    }

    if (request.url === '/api/notes' && request.method === 'POST') {
        let body = '';
        request.on('data', chunk => body += chunk.toString());
        request.on('end', () => {
            try {
                const newNote = JSON.parse(body);
                newNote.id = Date.now();
                newNote.date = new Date().toLocaleDateString('ru-RU', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                });
                notes.unshift(newNote);
                response.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                response.end(JSON.stringify(newNote));
            } catch (error) {
                response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                response.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    if (request.url.startsWith('/api/notes/') && request.method === 'PUT') {
        const noteId = parseInt(request.url.split('/')[3]);
        let body = '';
        request.on('data', chunk => body += chunk.toString());
        request.on('end', () => {
            try {
                const updatedNote = JSON.parse(body);
                const noteIndex = notes.findIndex(note => note.id === noteId);
                if (noteIndex !== -1) {
                    notes[noteIndex] = { ...notes[noteIndex], ...updatedNote };
                    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    response.end(JSON.stringify(notes[noteIndex]));
                } else {
                    response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                    response.end(JSON.stringify({ error: 'Note not found' }));
                }
            } catch (error) {
                response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                response.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    if (request.url.startsWith('/api/notes/') && request.method === 'DELETE') {
        const noteId = parseInt(request.url.split('/')[3]);
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex !== -1) {
            notes.splice(noteIndex, 1);
            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ message: 'Note deleted' }));
        } else {
            response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: 'Note not found' }));
        }
        return;
    }

    let filePath = request.url === '/' ? '/index.html' : request.url;
    
    if (filePath === '/index.html' || filePath === '/main' || filePath === '/notes-app') {
        if (filePath === '/main') filePath = '/main.html';
        else if (filePath === '/notes-app') filePath = '/notes-app.html';
        else filePath = '/index.html';
    }

    serveStaticFile(response, filePath);
}

const hostname = '127.0.0.1';
const port = 3001;
const server = createServer(servePage);

server.listen(port, hostname, () => {
    console.log(`Server Running at http://${hostname}:${port}`);
    console.log(`Приложение заметок: http://${hostname}:${port}/notes-app`);
});