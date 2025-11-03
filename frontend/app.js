// frontend/app.js
let notes = [];
let currentTag = 'all';
let currentSearch = '';
let currentEditingNoteId = null;

const notesContainer = document.getElementById('notesContainer');
const newNoteBtn = document.getElementById('newNoteBtn');
const tagItems = document.querySelectorAll('.spisok__item');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

const noteModal = document.getElementById('noteModal');
const modalTitle = document.getElementById('modalTitle');
const noteTitleInput = document.getElementById('noteTitle');
const noteContentInput = document.getElementById('noteContent');
const noteTagSelect = document.getElementById('noteTag');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSave = document.getElementById('modalSave');

// API функции
async function loadNotes() {
    try {
        const response = await fetch('http://localhost:3000/api/notes');
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Ошибка загрузки заметок:', error);
        notes = [];
        renderNotes();
    }
}

async function saveNoteToServer(note) {
    try {
        const response = await fetch('http://localhost:3000/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(note)
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка сохранения заметки:', error);
        throw error;
    }
}

async function updateNoteOnServer(noteId, updatedNote) {
    try {
        const response = await fetch(`http://localhost:3000/api/notes/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedNote)
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка обновления заметки:', error);
        throw error;
    }
}

async function deleteNoteFromServer(noteId) {
    try {
        await fetch(`http://localhost:3000/api/notes/${noteId}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Ошибка удаления заметки:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadNotes();
    
    tagItems.forEach(item => {
        item.addEventListener('click', function() {
            tagItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            currentTag = this.getAttribute('data-tag');
            renderNotes();
        });
    });
    
    newNoteBtn.addEventListener('click', () => openModal());
    
    searchBtn.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modalSave.addEventListener('click', saveNote);
    
    noteModal.addEventListener('click', function(event) {
        if (event.target === noteModal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && noteModal.style.display === 'block') {
            closeModal();
        }
    });
});

function renderNotes() {
    notesContainer.innerHTML = '';
    
    const filteredNotes = notes.filter(note => {
        const matchesTag = currentTag === 'all' || note.tag === currentTag;
        
        const matchesSearch = currentSearch === '' || 
            note.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            note.content.toLowerCase().includes(currentSearch.toLowerCase());
        
        return matchesTag && matchesSearch;
    });
    
    if (filteredNotes.length === 0) {
        notesContainer.innerHTML = '<div class="no-notes">Заметок не найдено</div>';
        return;
    }
    
    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'zadachi__item';
        noteElement.setAttribute('data-id', note.id);
        
        noteElement.innerHTML = `
            <div class="zadachi__item-top">
                <h2>${note.title}</h2>
                <span class="tag-${note.tag}">${getTagName(note.tag)}</span>
            </div>
            <div class="zadachi__item-content">
                ${note.content}
            </div>
            <div class="zadachi__item-down">
                <span>${note.date}</span>
                <div class="zadachi__item-actions">
                    <button class="edit-btn" data-id="${note.id}">Изменить</button>
                    <button class="delete-btn" data-id="${note.id}">Удалить</button>
                </div>
            </div>
        `;
        
        notesContainer.appendChild(noteElement);
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            editNote(noteId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            deleteNote(noteId);
        });
    });
}

function getTagName(tag) {
    const tagNames = {
        'all': 'Все',
        'ideas': 'Идеи',
        'personal': 'Личное',
        'work': 'Работа',
        'shopping': 'Список покупок'
    };
    return tagNames[tag] || tag;
}

function openModal(noteId = null) {
    if (noteId) {
        const note = notes.find(note => note.id === noteId);
        if (note) {
            modalTitle.textContent = 'Редактировать заметку';
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            noteTagSelect.value = note.tag;
            currentEditingNoteId = noteId;
        }
    } else {
        modalTitle.textContent = 'Новая заметка';
        noteTitleInput.value = '';
        noteContentInput.value = '';
        noteTagSelect.value = 'work';
        currentEditingNoteId = null;
    }
    
    noteModal.style.display = 'block';
    noteTitleInput.focus();
}

function closeModal() {
    noteModal.style.display = 'none';
    currentEditingNoteId = null;
}

async function saveNote() {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const tag = noteTagSelect.value;
    
    if (!title || !content) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    try {
        if (currentEditingNoteId) {
            // Редактирование существующей заметки
            const updatedNote = {
                title: title,
                content: content,
                tag: tag
            };
            await updateNoteOnServer(currentEditingNoteId, updatedNote);
        } else {
            // Создание новой заметки
            const newNote = {
                title: title,
                content: content,
                tag: tag
            };
            await saveNoteToServer(newNote);
        }
        
        await loadNotes(); // Перезагружаем заметки с сервера
        closeModal();
    } catch (error) {
        alert('Ошибка сохранения заметки');
    }
}

function editNote(noteId) {
    openModal(noteId);
}

async function deleteNote(noteId) {
    if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
        try {
            await deleteNoteFromServer(noteId);
            await loadNotes(); // Перезагружаем заметки с сервера
        } catch (error) {
            alert('Ошибка удаления заметки');
        }
    }
}

function performSearch() {
    currentSearch = searchInput.value.trim();
    renderNotes();
}