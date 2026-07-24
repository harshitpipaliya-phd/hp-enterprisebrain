export class TaskRegistry {
    tasks = new Map();
    register(task) {
        if (this.tasks.has(task.name))
            throw new Error(`task_already_registered: ${task.name}`);
        this.tasks.set(task.name, task);
    }
    get(name) {
        return this.tasks.get(name);
    }
    list() {
        return [...this.tasks.values()];
    }
}
