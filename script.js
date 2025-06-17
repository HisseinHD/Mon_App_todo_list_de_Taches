// Attendre que la page soit complètement chargée avant d'exécuter le code
document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments HTML nécessaires
    const taskInput = document.getElementById('task-input'); // Champ de saisie pour les tâches
    const addBtn = document.getElementById('add-btn'); // Bouton pour ajouter une tâche
    const taskList = document.getElementById('task-list'); // Liste des tâches
    const filterBtns = document.querySelectorAll('.filter-btn'); // Boutons de filtre
    const clearAllBtn = document.getElementById('clear-all'); // Bouton pour tout effacer
    const countElements = {
        all: document.getElementById('all-count'), // Compteur de toutes les tâches
        pending: document.getElementById('pending-count'), // Compteur des tâches en attente
        completed: document.getElementById('completed-count') // Compteur des tâches terminées
    };

    // Créer un tableau pour stocker les tâches
    let tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Charger les tâches depuis le stockage local
    let currentFilter = 'all'; // Filtre actif (par défaut : toutes les tâches)

    // Afficher les tâches et mettre à jour les compteurs au démarrage
    renderTasks();
    updateCounters();

    // Ajouter une tâche quand on clique sur le bouton "Ajouter"
    addBtn.addEventListener('click', addTask);

    // Ajouter une tâche quand on appuie sur "Entrée" dans le champ de saisie
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    // Ajouter un événement pour chaque bouton de filtre
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe "active" des autres boutons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Ajouter la classe "active" au bouton cliqué
            this.classList.add('active');
            // Mettre à jour le filtre actif
            currentFilter = this.dataset.filter;
            // Afficher les tâches selon le filtre
            renderTasks();
        });
    });

    // Effacer toutes les tâches quand on clique sur le bouton "Tout effacer"
    clearAllBtn.addEventListener('click', clearAllTasks);

    // Fonction pour ajouter une tâche
    function addTask() {
        const text = taskInput.value.trim(); // Récupérer le texte de la tâche
        if (text === '') return; // Ne rien faire si le champ est vide

        // Créer une nouvelle tâche
        const newTask = {
            id: Date.now(), // ID unique basé sur l'heure actuelle
            text: text, // Texte de la tâche
            completed: false // La tâche n'est pas terminée par défaut
        };

        tasks.push(newTask); // Ajouter la tâche au tableau
        saveTasks(); // Sauvegarder les tâches dans le stockage local
        taskInput.value = ''; // Vider le champ de saisie
        renderTasks(); // Afficher les tâches
        updateCounters(); // Mettre à jour les compteurs
    }

    // Fonction pour afficher les tâches
    function renderTasks() {
        taskList.innerHTML = ''; // Vider la liste avant de la remplir

        // Filtrer les tâches selon le filtre actif
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'all') return true; // Toutes les tâches
            if (currentFilter === 'pending') return !task.completed; // Tâches en attente
            if (currentFilter === 'completed') return task.completed; // Tâches terminées
        });

        // Si aucune tâche ne correspond au filtre, afficher un message
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = 'Aucune tâche à afficher';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.color = '#888';
            taskList.appendChild(emptyMessage);
            return;
        }

        // Ajouter chaque tâche à la liste
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item' + (task.completed ? ' completed' : '');
            taskItem.dataset.id = task.id;

            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fa-solid fa-pencil"></i></button>
                    <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            // Ajouter des événements pour les actions sur la tâche
            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            const taskText = taskItem.querySelector('.task-text');

            checkbox.addEventListener('change', function() {
                toggleTaskCompletion(task.id, this.checked);
            });

            editBtn.addEventListener('click', function() {
                editTask(task.id, taskText);
            });

            deleteBtn.addEventListener('click', function() {
                deleteTask(task.id);
            });

            taskList.appendChild(taskItem);
        });
    }

    // Fonction pour marquer une tâche comme terminée ou non
    function toggleTaskCompletion(id, completed) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
            saveTasks();
            renderTasks();
            updateCounters();
        }
    }

    // Fonction pour éditer une tâche
    function editTask(id, taskTextElement) {
        const currentText = taskTextElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';

        taskTextElement.replaceWith(input);
        input.focus();

        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                const taskIndex = tasks.findIndex(task => task.id === id);
                if (taskIndex !== -1) {
                    tasks[taskIndex].text = newText;
                    saveTasks();
                }
            }

            const newTaskText = document.createElement('span');
            newTaskText.className = 'task-text' + (tasks.find(task => task.id === id)?.completed ? ' completed' : '');
            newTaskText.textContent = newText || currentText;
            input.replaceWith(newTaskText);

            newTaskText.addEventListener('click', function() {
                editTask(id, newTaskText);
            });
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveEdit();
        });
    }

    // Fonction pour supprimer une tâche
    function deleteTask(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
            updateCounters();
        }
    }

    // Fonction pour supprimer toutes les tâches
    function clearAllTasks() {
        if (tasks.length === 0) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches ?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateCounters();
        }
    }

    // Fonction pour mettre à jour les compteurs
    function updateCounters() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        countElements.all.textContent = total;
        countElements.pending.textContent = pending;
        countElements.completed.textContent = completed;
    }

    // Fonction pour sauvegarder les tâches dans le stockage local
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
});