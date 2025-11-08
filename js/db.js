class ExpensesDB {
  constructor() {
    this.db = null;
    this.DB_NAME = 'ExpensesDB';
    this.DB_VERSION = 1;
    this.STORE_NAME = 'transactions';
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.error('Error opening database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Database initialized');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          
          console.log('✅ Object Store created');
        }
      };
    });
  }

  async add(transaction) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.add(transaction);
      
      request.onsuccess = () => {
        console.log('✅ Transaction added:', request.result);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('❌ Error adding:', request.error);
        reject(request.error);
      };
    });
  }

  
}

const expensesDB = new ExpensesDB();