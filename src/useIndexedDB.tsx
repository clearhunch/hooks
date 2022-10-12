import { useEffect, useState } from 'react';

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

type Key<T> = keyof T;

type Keypath<T> = {
  keyPath: Key<T>;
}

type AutoIncrement = {
  autoIncrement: boolean;
}

type Indice<T> = {
  indexName: string;
  keyPath: Key<T>;
  params?: {
    unique?: boolean;
    multiEntry?: boolean;
  };
}

type IndexedDBConfig<Type> = {
  databaseName: string;
  version?: number;
  storeName: string;
  key: XOR<Keypath<Type>, AutoIncrement>;
  indexes?: Indice<Type>[];
}

function useIndexedDB<Type>(config: IndexedDBConfig<Type>) {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [store, setStore] = useState<IDBObjectStore | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if(!window) return null;
    const request = window.indexedDB.open(config.databaseName, config.version ?? 3);
    request.onerror = (event) => {
      setError(request.error);
    };

    request.onsuccess = (event) => {
      setDb(request.result);
    };
  }, []);

  useEffect(() => {
    if (db) {
      const transaction = db.transaction([config.storeName], 'readwrite');
      const initstore = transaction.objectStore(config.storeName);
      setStore(initstore);

      if (config.key.hasOwnProperty('keyPath')) {
        initstore.createIndex(config.key.keyPath, config.key.keyPath, { unique: true });
      }
      
      if (config.indexes) {
        config.indexes.forEach((index) => {
          initstore.createIndex(index.indexName, index.keyPath, index.params);
        });
      }
    }
  }, [db]);

  return { db, store, error };
}

export default useIndexedDB;
