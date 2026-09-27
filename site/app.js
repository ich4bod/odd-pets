const STORAGE_KEY = 'odd-pets-v1';
const CREATURES = {
    Moth: { color: '#F6B44C', phrase: 'a night-light collector' },
    Frog: { color: '#77C66E', phrase: 'a puddle critic' },
    Blob: { color: '#B58AE8', phrase: 'a very small weather system' }
};

let pets = [];
let selectedCreature = 'Moth';

const petShelf = document.getElementById('pet-shelf');
const petForm = document.getElementById('pet-form');
const petNameInput = document.getElementById('pet-name');
const petOwnerInput = document.getElementById('pet-owner');
const errorName = document.getElementById('error-name');
const errorOwner = document.getElementById('error-owner');
const starterButtons = document.querySelectorAll('.starter-btn');

function init() {
    loadPets();
    setupEventListeners();
    render();
}

function loadPets() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            pets = [];
            return;
        }
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
            pets = [];
            return;
        }
        pets = parsed;
    } catch (e) {
        console.error('Error loading pets:', e);
        pets = [];
    }
}

function savePets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function setupEventListeners() {
    petForm.addEventListener('submit', handleFormSubmit);

    starterButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectCreature(button.dataset.creature);
        });
    });
}

function selectCreature(creature) {
    selectedCreature = creature;
    starterButtons.forEach(btn => {
        const isSelected = btn.dataset.creature === creature;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    const name = petNameInput.value.trim();
    const owner = petOwnerInput.value.trim();
    let isValid = true;
    errorName.textContent = '';
    errorOwner.textContent = '';
    if (name.length < 1 || name.length > 24) {
        errorName.textContent = 'Give this pet a name.';
        isValid = false;
    }
    if (owner.length < 1 || owner.length > 24) {
        errorOwner.textContent = 'Give this pet an owner label.';
        isValid = false;
    }
    if (!isValid) return;
    const newPet = {
        id: crypto.randomUUID(),
        name: name,
        owner: owner,
        creature: selectedCreature,
        color: CREATURES[selectedCreature].color,
        createdAt: new Date().toISOString()
    };
    pets.unshift(newPet);
    savePets();
    render();
    petNameInput.value = '';
    petOwnerInput.value = '';
}

function render() {
    if (pets.length === 0) {
        renderEmptyShelf();
    } else {
        renderShelf();
    }
}

function renderEmptyShelf() {
    petShelf.innerHTML = `
        <div class="empty-shelf-card">
            <p class="eyebrow">THE SHELF</p>
            <h2 class="headline">No pets yet. This is suspiciously quiet.</h2>
            <p>Make one little creature to get the household started.</p>
        </div>
    `;
    const heading = document.getElementById('shelf-heading');
    if (heading) {
        heading.textContent = 'THE SHELF';
    }
    const countLine = document.getElementById('shelf-count-line');
    if (countLine) {
        countLine.remove();
    }
}

function renderShelf() {
    const heading = document.getElementById('shelf-heading');
    if (heading) {
        heading.textContent = 'THE HOUSEHOLD';
    }
    const count = pets.length;
    const countText = count === 1 ? '1 odd pet lives here.' : `${count} odd pets live here.`;
    let countLine = document.getElementById('shelf-count-line');
    if (!countLine) {
        countLine = document.createElement('p');
        countLine.id = 'shelf-count-line';
        countLine.className = 'subtitle';
        heading.parentNode.insertBefore(countLine, heading.nextSibling);
    }
    countLine.textContent = countText;

    petShelf.innerHTML = pets.map(pet => `
        <div class="pet-tile" style="border-left: 10px solid ${pet.color}">
            <h4>${escapeHTML(pet.name)}</h4>
            <p class="pet-meta">${escapeHTML(pet.creature)} · ${escapeHTML(pet.owner)}</p>
            <p class="pet-phrase">${CREATURES[pet.creature].phrase}</p>
            <p class="pet-date">Arrived today.</p>
        </div>
    `).join('');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

init();
