/**
 * Generic circular buffer implementation for efficient fixed-size collections
 */
export class CircularBuffer<T> {
  private buffer: Array<T | null>;
  private head = 0;
  private tail = 0;
  private size = 0;
  private readonly capacity: number;
  
  /**
   * Constructor
   * @param capacity Maximum number of items the buffer can hold
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }
    
    this.capacity = capacity;
    this.buffer = new Array<T | null>(capacity).fill(null);
  }
  
  /**
   * Add an item to the buffer
   * If the buffer is full, the oldest item will be overwritten
   * @param item Item to add
   * @returns The item that was overwritten, or null if no item was overwritten
   */
  public push(item: T): T | null {
    let overwritten: T | null = null;
    
    // If buffer is full, store the item that will be overwritten
    if (this.size === this.capacity) {
      overwritten = this.buffer[this.tail] as T;
    }
    
    // Add the new item
    this.buffer[this.tail] = item;
    
    // Update tail position
    this.tail = (this.tail + 1) % this.capacity;
    
    // Update size and head if necessary
    if (this.size < this.capacity) {
      this.size++;
    } else {
      // If buffer was full, move head as well
      this.head = (this.head + 1) % this.capacity;
    }
    
    return overwritten;
  }
  
  /**
   * Get the item at the specified index
   * @param index Index of the item to get (0 is the oldest item)
   * @returns The item at the specified index, or null if index is out of bounds
   */
  public get(index: number): T | null {
    if (index < 0 || index >= this.size) {
      return null;
    }
    
    const bufferIndex = (this.head + index) % this.capacity;
    return this.buffer[bufferIndex];
  }
  
  /**
   * Remove and return the oldest item from the buffer
   * @returns The oldest item, or null if the buffer is empty
   */
  public shift(): T | null {
    if (this.size === 0) {
      return null;
    }
    
    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    
    return item;
  }
  
  /**
   * Remove and return the newest item from the buffer
   * @returns The newest item, or null if the buffer is empty
   */
  public pop(): T | null {
    if (this.size === 0) {
      return null;
    }
    
    // Calculate the index of the newest item
    let newTail = this.tail - 1;
    if (newTail < 0) {
      newTail = this.capacity - 1;
    }
    
    const item = this.buffer[newTail];
    this.buffer[newTail] = null;
    this.tail = newTail;
    this.size--;
    
    return item;
  }
  
  /**
   * Get all items in the buffer as an array
   * @returns Array of all items in the buffer, oldest first
   */
  public toArray(): T[] {
    const result: T[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== null) {
        result.push(item);
      }
    }
    
    return result;
  }
  
  /**
   * Clear the buffer
   */
  public clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
  
  /**
   * Get the current size of the buffer
   * @returns Number of items in the buffer
   */
  public getSize(): number {
    return this.size;
  }
  
  /**
   * Get the capacity of the buffer
   * @returns Maximum number of items the buffer can hold
   */
  public getCapacity(): number {
    return this.capacity;
  }
  
  /**
   * Check if the buffer is empty
   * @returns True if the buffer is empty, false otherwise
   */
  public isEmpty(): boolean {
    return this.size === 0;
  }
  
  /**
   * Check if the buffer is full
   * @returns True if the buffer is full, false otherwise
   */
  public isFull(): boolean {
    return this.size === this.capacity;
  }
  
  /**
   * Filter the buffer and return a new array with items that match the predicate
   * @param predicate Function to test each item
   * @returns Array of items that match the predicate
   */
  public filter(predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== null && predicate(item)) {
        result.push(item);
      }
    }
    
    return result;
  }
  
  /**
   * Map the buffer to a new array
   * @param mapper Function to transform each item
   * @returns Array of transformed items
   */
  public map<U>(mapper: (item: T) => U): U[] {
    const result: U[] = [];
    
    for (let i = 0; i < this.size; i++) {
      const item = this.get(i);
      if (item !== null) {
        result.push(mapper(item));
      }
    }
    
    return result;
  }
  
  /**
   * Resize the buffer
   * If the new capacity is smaller than the current size, the oldest items will be discarded
   * @param newCapacity New capacity for the buffer
   * @returns Array of discarded items (oldest first)
   */
  public resize(newCapacity: number): T[] {
    if (newCapacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }
    
    // If new capacity is the same, do nothing
    if (newCapacity === this.capacity) {
      return [];
    }
    
    // Get current items as array
    const currentItems = this.toArray();
    
    // Create new buffer with new capacity
    const newBuffer = new Array<T | null>(newCapacity).fill(null);
    
    // Calculate how many items to keep
    const itemsToKeep = Math.min(currentItems.length, newCapacity);
    
    // Calculate which items will be discarded (if any)
    const discarded = currentItems.slice(0, currentItems.length - itemsToKeep);
    
    // Keep the newest items
    const itemsToStore = currentItems.slice(currentItems.length - itemsToKeep);
    
    // Reset head and tail
    this.head = 0;
    this.tail = itemsToStore.length % newCapacity;
    this.size = itemsToStore.length;
    
    // Store items in new buffer
    for (let i = 0; i < itemsToStore.length; i++) {
      newBuffer[i] = itemsToStore[i];
    }
    
    // Update buffer
    this.buffer = newBuffer;
    
    return discarded;
  }
}