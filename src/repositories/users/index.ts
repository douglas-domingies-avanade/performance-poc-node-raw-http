import BaseRepository, { MemoryRepo } from "../base";
export class User {
    id: number;
    nome: string;
    constructor(){
        this.id = 0;
        delete this.id;
        this.nome = '';
    }
}
export default class Users extends MemoryRepo<User> {
    constructor() {
        super({ route: '/users'});
    }
}