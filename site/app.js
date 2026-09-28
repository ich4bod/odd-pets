console.log('app.js loaded');
const STORAGE_KEY = 'odd-pets-v1';
const CREATURES = {
    Moth: { color: '#F6B44C', phrase: 'a night-light collector' },
    Frog: { color: '#77C66E', phrase: 'a puddle critic' },
    Blob: { color: '#B58AE8', phrase: 'a very small weather system' }
};

const HABITS = {
    Moth: 'Moth has begun cataloguing lamps by mood.',
    Frog: 'Frog now insists every puddle has an accent.',
    Blob: 'Blob has learned to look bean-shaped on purpose.'
};

const SHELF_TITLES = {
    Moth: 'LAMP LIBRARIAN',
    Frog: 'PUDDLE DIALECTICIAN',
    Blob: 'BEAN APPRENTICE'
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

    petShelf.innerHTML = '';
    
    const heading = document.createElement('h2');
    heading.id = 'shelf-heading';
    heading.className = 'headline';
    heading.textContent = 'THE HOUSEHOLD';
    petShelf.appendChild(heading);

    const subtitle = document.createElement('p');
    subtitle.id = 'shelf-count-line';
    subtitle.className = 'subtitle';
    subtitle.textContent = countText;
    petShelf.appendChild(subtitle);

    for (const pet of pets) {
        const hasSnackedToday = pet.lastSnackDay === todayKey;
        
        const tile = document.createElement('div');
        tile.className = 'pet-tile';
        tile.style.borderLeft = `10px solid ${pet.color}`;

        const name = document.createElement('h4');
        name.textContent = pet.name;
        tile.appendChild(name);

        const normalizedSnacks = Number(pet.snacks) || 0;
        if (normalizedSnacks >= 6) {
            const title = document.createElement('span');
            title.className = 'pet-title';
            title.style.backgroundColor = pet.color;
            title.textContent = SHELF_TITLES[pet.creature];
            tile.appendChild(title);
        }

        const meta = document.createElement('p');
        meta.className = 'pet-meta';
        meta.textContent = pet.creature + ' · ' + pet.owner;
        tile.appendChild(meta);

        const phrase = document.createElement('p');
        phrase.className = 'pet-phrase';
        phrase.textContent = CREATURES[pet.creature].phrase;
        tile.appendChild(phrase);

        const careStrip = document.createElement('div');
        careStrip.className = 'pet-care-strip';
        if (!hasSnackedToday) {
            const label = document.createElement('span');
            label.className = 'pet-care-label';
            label.textContent = "TODAY'S TINY CARE";
            careStrip.appendChild(label);

            const prompt = document.createElement('p');
            prompt.className = 'pet-care-prompt';
            prompt.textContent = 'Offer one snack. They will remember.';
            careStrip.appendChild(prompt);

            const btn = document.createElement('button');
            btn.className = 'pet-care-btn';
            btn.dataset.petId = pet.id;
            btn.style.outlineColor = pet.color;
            btn.textContent = 'Give a snack';
            careStrip.appendChild(btn);
        } else {
            const results = {
                Moth: 'Moth has placed the crumb under a lamp for later.',
                Frog: 'Frog says this snack has excellent bounce.',
                Blob: 'Blob is now shaped slightly more like a bean.'
            };
            const label = document.createElement('span');
            label.className = 'pet-care-label';
            label.textContent = "TODAY'S TINY CARE";
            careStrip.appendChild(label);

            const result = document.createElement('p');
            result.className = 'pet-care-result';
            result.textContent = results[pet.creature];
            careStrip.appendChild(result);

            const count = document.createElement('p');
            count.className = 'pet-care-count';
            count.textContent = pet.snacks + ' snack' + (pet.snacks === 1 ? '' : 's') + ' remembered.';
            careStrip.appendChild(count);
        }
        tile.appendChild(careStrip);

        if (pet.snacks >= 3) {
            const habitSection = document.createElement('section');
            habitSection.className = 'pet-habit';
            habitSection.style.borderLeftColor = pet.color;

            const eyebrow = document.createElement('div');
            eyebrow.className = 'pet-habit-eyebrow';
            eyebrow.textContent = 'A SMALL HABIT';
            habitSection.appendChild(eyebrow);

            const sentence = document.createElement('div');
            sentence.className = 'pet-habit-sentence';
            sentence.textContent = HABITS[pet.creature];
            habitSection.appendChild(sentence);

            tile.appendChild(habitSection);
        }

        const date = document.createElement('p');
        date.className = 'pet-date';
        date.textContent = 'Arrived today.';
        tile.appendChild(date);

        petShelf.appendChild(tile);
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

init();
