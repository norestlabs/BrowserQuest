export class Node<T> {
    value : T;
    previous : Node<T> | null = null;
    next : Node<T> | null = null;

    constructor (value : T) {
        this.value = value;
    }
}

export default class DoublyLinkedList<T> {
    private first : Node<T> | null = null;
    last : Node<T> | null = null;

    public get First () : Node<T> | null {
        return this.first;
    }
    public get Last () : Node<T> | null {
        return this.last;
    }

    comparator : (a : T, b : T) => boolean;

    constructor (c : (a : T, b : T) => boolean) {
        this.comparator = c;
    }

    private CreateNode (value : T) : Node<T> {
        let node = new Node(value);

        return node;
    }

    public Add (value : T) : void {
        if (this.first === null || this.last === null) {
            this.first = this.CreateNode(value);
            this.last = this.first;
        }
        else {
            let newNode = this.CreateNode(value);
            this.last.next = newNode;
            newNode.previous = this.last;
            this.last = newNode;
        }
    }

    public Remove (value : T) : void {
        let current = this.first;
        while (current !== null) {
            if (this.comparator(value, current.value)) {
                if (current.previous != null)
                    current.previous.next = current.next;
                if (current.next != null)
                    current.next.previous = current.previous;
                if (current == this.first) {
                    this.first = null;
                }
                if (current == this.last) {
                    this.last = current.previous;
                }
                //current.value = null;
                current.previous = null;
                current.next = null;
                
                break;
            }

            current = current.next;
        }
    }

    public ForEach (callback : (value : T) => void, context : any) : void {
        let current = this.first, next;
        while (current != null) {
            next = current.next;
            callback.call(context, current.value);
            current = next;
        }
    }
}