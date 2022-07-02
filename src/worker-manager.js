export const WorkerManager = {

    workersCreated: 0,
    workers: [],

    addTask(func=()=>{}){
        const worker = this.spawnWorker();
        worker.postMessage({message: "new-task", func})
        console.log("task added")
    },
    
    spawnWorker(){
        const worker = new Worker(new URL('./worker.js', import.meta.url));
        this.workersCreated++;
        worker.id = this.workersCreated;
        this.workers.push(worker)
        return worker;
    },
    
    killWorker(worker){
        const id = worker.id
        const idx = (this.workers.findIndex(obj => obj.id == id));
        this.workers[idx].terminate();
        this.workers.splice(idx,1);
    }
}