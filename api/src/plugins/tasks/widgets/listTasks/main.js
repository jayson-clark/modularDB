function toggleTaskCompletion(taskId, title, description, completed) {
    fetch(`/api/tasks/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, description, completed })
    })
        .then(response => response.json())
        .then(updatedTask => {
            const taskItem = document.querySelector(`li[data-task-id='${taskId}']`);
            if (updatedTask.completed) {
                taskItem.classList.add('completed');
            } else {
                taskItem.classList.remove('completed');
            }
        })
        .catch(error => console.error('Error updating task:', error));
}

window.onload = () => {
    const tasksList = document.getElementById('tasks');

    fetch('/api/tasks/tasks')
        .then(response => response.json())
        .then(tasks => {

            tasks.forEach(task => {
                const listItem = document.createElement('li');

                listItem.setAttribute('data-task-id', task.id);

                listItem.innerHTML += `
                    <input type="checkbox" name="${task.id}" ${task.completed ? 'checked' : ''}/>
                    <span>${task.title}: ${task.description || ''}</span>
                `;

                if (task.completed) {
                    listItem.classList.add('completed');
                }

                const checkbox = listItem.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => toggleTaskCompletion(task.id, task.title, task.description || '', checkbox.checked));

                tasksList.appendChild(listItem);
            });

        })
        .catch(error => console.error('Error fetching tasks:', error));
}
