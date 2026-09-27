console.log('app.js loaded');
const STORAGE_KEY = 'odd-pets-v1';
const CREATURES = {
    Moth: { color: '#F6B44C', phrase: 'a night-light collector' },
    Frog: { color: '#77C66E', phrase: 'a puddle critic' },
    Blob: { color: '#B58AE8', phrase: 'a very small weather system' }
};

function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

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
        
        let normalized = false;
        pets = parsed.map(pet => {
            if (pet.snacks === undefined || pet.lastSnackDay === undefined) {
                normalized = true;
                return {
                    ...pet,
                    snacks: pet.snacks ?? 0,
                    lastSnackDay: pet.lastSnackDay ?? null
                };
            }
            return pet;
        });

        if (normalized) {
            savePets();
        }

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

    petShelf.addEventListener('click', (e) => {
        const snackBtn = e.target.closest('.pet-care-btn');
        if (snackBtn) {
            handleSnackClick(snackBtn.dataset.petId);
        }
    });
}

function selectCreature(creature) {
    selectedCreature = creature;
    starterButtons.forEach(btn => {
        const isSelected = btn.dataset.creature === creature;
        btn.setAttribute('aria_pressed', isSelected ? 'true' : 'false');
        if (isSelected) {
            btn.style.borderColor = CREATURES[creature].color;
        } else {
            btn.style.borderColor = 'transparent';
        }
    });
}

function handleSnackClick(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

    const todayKey = getTodayKey();
    if (pet.lastSnackDay === todayKey) return;

    pet.snacks += 1;
    pet.lastSnackDay = todayKey;
    
    savePets();
    render();
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
        id: Math.random().toString(36).substring(2, 11),
        name: name,
        owner: owner,
        creature: selectedCreature,
        color: CREATURES[selectedCreature].color,
        createdAt: new Date().toISOString(),
        snacks: 0,
        lastSnackDay: null
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
}

function renderShelf() {
    const count = pets.length;
    const countText = count === 1 ? '1 odd pet lives here.' : `${count} odd pets live here.`;
    const todayKey = getTodayKey();

    let petsHtml = '';
    for (const pet of pets) {
        const hasSnackedToday = pet.lastSnackDay === todayKey;
        
        let careStripHtml = '';
        if (!hasSnackedToday) {
            careStripHtml = `
                <div class="pet-care-strip">
                    <span class="pet-care-label">TODAY'S TINY CARE</span>
                    <p class="pet-care-prompt">Offer one snack. They will remember.</p>
                    <button class="pet-care-btn" data-pet-id="${pet.id}" style="outline-color: ${pet.color}">Give a snack</button>
                </div>
            `;
        } else {
            const results = {
                Moth: 'Moth has placed the crumb under a lamp for later.',
                Frog: 'Frog says this snack has excellent bounce.',
                Blob: 'Blob is now shaped slightly more like a bean.'
            };
            careStripHtml = `
                <div class="pet-care-strip">
                    <span class="pet-care-label">TODAY'S TINY CARE</span>
                    <p class="pet-care-result">${results[pet.creature]}</p>
                    <p class="pet-care-count">${pet.snacks} snack${pet.snacks === 1 ? '' : 's'} remembered.</p>
                </div>
            `;
        }

        petsHtml += `
            <div class="pet-tile" style="border-left: 10px solid ${pet.color}">
                <h4>${escapeHTML(pet.name)}</h4>
                <p class="pet-meta">${escapeHTML(pet.creature)} · ${escapeHTML(pet.owner)}</p>
                <p class="pet-phrase">${CREATURES[pet.creature].phrase}</p>
                ${careStripHtml}
                <p class="pet-date">Arrived today.</p>
            </div>
        `;
    }

    petShelf.innerHTML = `
        <h2 id="shelf-heading" class="headline">THE HOUSEHOLD</h2>
        <p id="shelf-count-line" class="subtitle">${countText}</p>
        ${petsHtml}
    `;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

init();
